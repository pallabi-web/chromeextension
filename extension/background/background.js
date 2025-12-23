const API_BASE_URL = 'http://localhost:3000/api';


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startScraping') {
    handleProfileScraping(message.urls);
    sendResponse({ success: true });
  } else if (message.action === 'startEngagement') {
    handleFeedEngagement(message.data);
    sendResponse({ success: true });
  }
  return true;
});


async function handleProfileScraping(urls) {
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const current = i + 1;
    const total = urls.length;

    try {
      
      chrome.runtime.sendMessage({
        action: 'scrapingProgress',
        data: { current, total, status: 'processing' }
      });

      
      const tab = await chrome.tabs.create({ url, active: false });
      
      
      await waitForTabLoad(tab.id);
      
      
      console.log('Waiting for page to fully load...');
      await delay(5000); 

      
      console.log('Injecting scraper...');
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: scrapeLinkedInProfile
      });

      const profileData = results[0]?.result;
      console.log('Scraped data:', profileData);

      if (profileData && profileData.name) {
      
        profileData.url = url;

        console.log('Sending to backend:', profileData);

        
        const response = await fetch(`${API_BASE_URL}/profiles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profileData)
        });

        const responseData = await response.json();
        console.log('Backend response:', responseData);

        if (response.ok) {
          chrome.runtime.sendMessage({
            action: 'scrapingProgress',
            data: { current, total, status: 'success', profile: profileData }
          });
        } else {
          throw new Error(`Backend error: ${responseData.message || 'Failed to save'}`);
        }
      } else {
        throw new Error('Failed to scrape profile data - no name found');
      }

    
      await chrome.tabs.remove(tab.id);
      
    
      await delay(2000);

    } catch (error) {
      console.error('Scraping error:', error);
      chrome.runtime.sendMessage({
        action: 'scrapingProgress',
        data: { current, total, status: 'error', error: error.message }
      });
      
      
      try {
        const tabs = await chrome.tabs.query({});
        const targetTab = tabs.find(t => t.url === url);
        if (targetTab) await chrome.tabs.remove(targetTab.id);
      } catch (e) {
        console.error('Error closing tab:', e);
      }
    }
  }

  
  chrome.runtime.sendMessage({
    action: 'scrapingProgress',
    data: { status: 'complete', total: urls.length }
  });
}


async function handleFeedEngagement(data) {
  const { likeCount, commentCount } = data;
  
  try {
  
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url.includes('linkedin.com')) {
      throw new Error('Not on LinkedIn');
    }

    
    if (!tab.url.includes('/feed')) {
      await chrome.tabs.update(tab.id, { url: 'https://www.linkedin.com/feed/' });
      await waitForTabLoad(tab.id);
      await delay(3000);
    }

    
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: engageWithFeed,
      args: [likeCount, commentCount]
    });

  } catch (error) {
    chrome.runtime.sendMessage({
      action: 'engagementProgress',
      data: { status: 'error', error: error.message }
    });
  }
}


function scrapeLinkedInProfile() {
  console.log('Starting scrape on page:', window.location.href);
  
  const profile = {
    name: '',
    bio_line: '',
    location: '',
    about: '',
    bio: '',
    follower_count: 0,
    connection_count: 0
  };

  
  function getTextContent(selector) {
    const element = document.querySelector(selector);
    return element?.innerText?.trim() || '';
  }


  function getTextFromSelectors(selectors) {
    for (const selector of selectors) {
      const text = getTextContent(selector);
      if (text) return text;
    }
    return '';
  }

  try {
    
    const nameSelectors = [
      'h1.text-heading-xlarge',
      '.pv-text-details__left-panel h1',
      'h1.inline.t-24.v-align-middle.break-words',
      '.pv-top-card--list li:first-child',
      'div.ph5 h1'
    ];
    profile.name = getTextFromSelectors(nameSelectors);
    console.log('Found name:', profile.name);

    
    const bioLineSelectors = [
      '.text-body-medium.break-words',
      '.pv-text-details__left-panel .text-body-medium',
      'div.text-body-medium.break-words',
      '.pv-top-card--list.pv-top-card--list-bullet.mt1 li:first-child'
    ];
    profile.bio_line = getTextFromSelectors(bioLineSelectors);
    console.log('Found bio_line:', profile.bio_line);

  
    const locationSelectors = [
      '.text-body-small.inline.t-black--light.break-words',
      '.pv-text-details__left-panel .text-body-small',
      'span.text-body-small.inline.t-black--light.break-words',
      '.pv-top-card--list-bullet li'
    ];
    profile.location = getTextFromSelectors(locationSelectors);
    console.log('Found location:', profile.location);

    
    const aboutSelectors = [
      '#about ~ * .display-flex.ph5.pv3',
      'section[data-section="summary"] .pv-shared-text-with-see-more',
      '.pv-about-section .pv-about__summary-text',
      'div[id="about"] ~ div .inline-show-more-text'
    ];
    
    profile.about = getTextFromSelectors(aboutSelectors);
    
    
    if (!profile.about) {
      const aboutHeading = Array.from(document.querySelectorAll('h2, h3')).find(
        h => h.innerText.trim().toLowerCase() === 'about'
      );
      if (aboutHeading) {
        const aboutContent = aboutHeading.parentElement?.parentElement?.querySelector('.display-flex');
        profile.about = aboutContent?.innerText?.trim() || '';
      }
    }
    
    profile.bio = profile.about;
    console.log('Found about:', profile.about);

  
    const topCardSection = document.querySelector('.pv-top-card') || document.querySelector('.ph5.pb5');
    if (topCardSection) {
      const topCardText = topCardSection.innerText;
      
     
      const followerMatch = topCardText.match(/(\d+(?:[,\.]\d+)?[KkMm]?)\s*followers?/i);
      const connectionMatch = topCardText.match(/(\d+(?:[,\.]\d+)?[KkMm]?\+?)\s*connections?/i);
      
      if (followerMatch) {
        profile.follower_count = parseCount(followerMatch[1]);
        console.log('Method 1 - Follower match:', followerMatch[1], '→', profile.follower_count);
      }
      
      if (connectionMatch) {
        profile.connection_count = parseCount(connectionMatch[1]);
        console.log('Method 1 - Connection match:', connectionMatch[1], '→', profile.connection_count);
      }
    }
    
    
    const profileLinks = document.querySelectorAll('a[href*="/search/results/"], a.pv-top-card--list-bullet');
    for (const link of profileLinks) {
      const linkText = link.innerText.toLowerCase();
      const linkHref = link.getAttribute('href') || '';
      
      if (linkText.includes('follower') || linkHref.includes('facetNetwork')) {
        const match = linkText.match(/(\d+(?:[,\.]\d+)?[KkMm]?)\s*followers?/i);
        if (match && !profile.follower_count) {
          profile.follower_count = parseCount(match[1]);
          console.log('Method 2 - Follower from link:', match[1], '→', profile.follower_count);
        }
      }
      
      if (linkText.includes('connection') || linkHref.includes('facetConnectionOf')) {
        const match = linkText.match(/(\d+(?:[,\.]\d+)?[KkMm]?\+?)\s*connections?/i);
        if (match && !profile.connection_count) {
          profile.connection_count = parseCount(match[1]);
          console.log('Method 2 - Connection from link:', match[1], '→', profile.connection_count);
        }
      }
    }
    
    
    if (!profile.follower_count || !profile.connection_count) {
      const allText = document.body.innerText;
      
      if (!profile.follower_count) {
        
        const followerMatches = allText.match(/(\d+(?:[,\.]\d+)?[KkMm]?)\s*followers?/gi);
        if (followerMatches && followerMatches.length > 0) {
        
          const firstMatch = followerMatches[0].match(/(\d+(?:[,\.]\d+)?[KkMm]?)/i);
          if (firstMatch) {
            profile.follower_count = parseCount(firstMatch[1]);
            console.log('Method 3 - Follower from body:', firstMatch[1], '→', profile.follower_count);
          }
        }
      }
      
      if (!profile.connection_count) {
        
        const connectionMatches = allText.match(/(\d+(?:[,\.]\d+)?[KkMm]?\+?)\s*connections?/gi);
        if (connectionMatches && connectionMatches.length > 0) {
          const firstMatch = connectionMatches[0].match(/(\d+(?:[,\.]\d+)?[KkMm]?\+?)/i);
          if (firstMatch) {
            profile.connection_count = parseCount(firstMatch[1]);
            console.log('Method 3 - Connection from body:', firstMatch[1], '→', profile.connection_count);
          }
        }
      }
    }
    
    
    const structuredData = document.querySelector('script[type="application/ld+json"]');
    if (structuredData) {
      try {
        const jsonData = JSON.parse(structuredData.textContent);
        if (jsonData.interactionStatistic) {
          for (const stat of jsonData.interactionStatistic) {
            if (stat['@type'] === 'InteractionCounter') {
              if (stat.name === 'Follows' && !profile.follower_count) {
                profile.follower_count = parseInt(stat.userInteractionCount) || 0;
                console.log('Method 4 - Follower from structured data:', profile.follower_count);
              }
            }
          }
        }
      } catch (e) {
        console.log('Could not parse structured data');
      }
    }

    console.log('Final follower_count:', profile.follower_count);
    console.log('Final connection_count:', profile.connection_count);
    console.log('Final profile data:', profile);

    return profile;
  } catch (error) {
    console.error('Error in scrapeLinkedInProfile:', error);
    return profile;
  }
}


function parseCount(text) {
  if (!text) return 0;
  
  const cleanText = text.toString().toLowerCase().replace(/[^0-9.km]/g, '');
  
  if (cleanText.includes('k')) {
    return Math.round(parseFloat(cleanText) * 1000);
  } else if (cleanText.includes('m')) {
    return Math.round(parseFloat(cleanText) * 1000000);
  }
  
  return parseInt(cleanText.replace(/,/g, '')) || 0;
}

async function engageWithFeed(targetLikes, targetComments) {
  let liked = 0;
  let commented = 0;

  function sendProgress() {
    chrome.runtime.sendMessage({
      action: 'engagementProgress',
      data: {
        liked,
        totalLikes: targetLikes,
        commented,
        totalComments: targetComments,
        status: 'processing'
      }
    });
  }

  function scrollPage() {
    window.scrollBy(0, window.innerHeight * 0.7);
    return new Promise(resolve => setTimeout(resolve, 1500));
  }

  function randomDelay() {
    return new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
  }

  try {
    while (liked < targetLikes || commented < targetComments) {
      const posts = document.querySelectorAll('[data-id^="urn:li:activity"]');
      
      for (const post of posts) {
        if (liked >= targetLikes && commented >= targetComments) break;

        const needLike = liked < targetLikes;
        const needComment = commented < targetComments;
        const shouldLike = needLike && (Math.random() > 0.5 || !needComment);

        if (shouldLike) {
          const likeButton = post.querySelector('button[aria-label^="React"]') ||
                            post.querySelector('button[aria-label*="Like"]');
          
          if (likeButton && !likeButton.classList.contains('react-button__trigger--active')) {
            likeButton.click();
            liked++;
            sendProgress();
            await randomDelay();
          }
        } else if (needComment) {
          const commentButton = post.querySelector('button[aria-label*="Comment"]');
          
          if (commentButton) {
            commentButton.click();
            await new Promise(resolve => setTimeout(resolve, 1000));

            const commentBox = post.querySelector('.ql-editor[contenteditable="true"]') ||
                              document.querySelector('.ql-editor[contenteditable="true"]');
            
            if (commentBox) {
              commentBox.focus();
              commentBox.innerHTML = '<p>CFBR</p>';
              await new Promise(resolve => setTimeout(resolve, 500));

              const postButton = post.querySelector('button.comments-comment-box__submit-button--cr') ||
                                document.querySelector('button[form]');
              
              if (postButton && !postButton.disabled) {
                postButton.click();
                commented++;
                sendProgress();
                await randomDelay();
              }
            }
          }
        }

        if (liked >= targetLikes && commented >= targetComments) break;
      }

      if (liked < targetLikes || commented < targetComments) {
        await scrollPage();
      } else {
        break;
      }
    }

    chrome.runtime.sendMessage({
      action: 'engagementProgress',
      data: {
        liked,
        totalLikes: targetLikes,
        commented,
        totalComments: targetComments,
        status: 'complete'
      }
    });

  } catch (error) {
    chrome.runtime.sendMessage({
      action: 'engagementProgress',
      data: { status: 'error', error: error.message }
    });
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function waitForTabLoad(tabId) {
  return new Promise((resolve) => {
    chrome.tabs.onUpdated.addListener(function listener(updatedTabId, changeInfo) {
      if (updatedTabId === tabId && changeInfo.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    });
  });
}
