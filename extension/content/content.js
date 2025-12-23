

console.log('LinkedIn Automation content script loaded');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'scrapeProfile') {
    const profileData = scrapeLinkedInProfile();
    sendResponse({ success: true, data: profileData });
  }
  return true;
});

function scrapeLinkedInProfile() {
  const profile = {};

  try {
    const nameSelectors = [
      'h1.text-heading-xlarge',
      '.pv-text-details__left-panel h1',
      'h1.inline.t-24.v-align-middle.break-words'
    ];
    
    for (const selector of nameSelectors) {
      const element = document.querySelector(selector);
      if (element?.innerText?.trim()) {
        profile.name = element.innerText.trim();
        break;
      }
    }

    const bioLineSelectors = [
      '.text-body-medium.break-words',
      '.pv-text-details__left-panel .text-body-medium',
      'div.text-body-medium.break-words'
    ];
    
    for (const selector of bioLineSelectors) {
      const element = document.querySelector(selector);
      if (element?.innerText?.trim()) {
        profile.bio_line = element.innerText.trim();
        break;
      }
    }

    const locationSelectors = [
      '.text-body-small.inline.t-black--light.break-words',
      '.pv-text-details__left-panel .text-body-small',
      'span.text-body-small.inline.t-black--light.break-words'
    ];
    
    for (const selector of locationSelectors) {
      const element = document.querySelector(selector);
      if (element?.innerText?.trim()) {
        profile.location = element.innerText.trim();
        break;
      }
    }
    const aboutSection = document.querySelector('#about');
    if (aboutSection) {
      const aboutContent = aboutSection.parentElement?.parentElement?.querySelector('.display-flex');
      if (aboutContent) {
        profile.about = aboutContent.innerText.trim();
        profile.bio = profile.about;
      }
    }

    const connectionInfoElements = document.querySelectorAll('span.text-body-small');
    for (const element of connectionInfoElements) {
      const text = element.innerText.toLowerCase();
      if (text.includes('follower') || text.includes('followers')) {
        const count = text.match(/[\d,]+/)?.[0]?.replace(/,/g, '');
        profile.follower_count = parseInt(count) || 0;
      }
      if (text.includes('connection') || text.includes('connections')) {
        const count = text.match(/[\d,]+/)?.[0]?.replace(/,/g, '');
        profile.connection_count = parseInt(count) || 0;
      }
    }

    if (!profile.follower_count || !profile.connection_count) {
      const countElements = document.querySelectorAll('span.t-black--light span');
      if (countElements.length >= 2) {
        profile.follower_count = parseCount(countElements[0]?.innerText);
        profile.connection_count = parseCount(countElements[1]?.innerText);
      }
    }

    console.log('Scraped profile:', profile);
    return profile;

  } catch (error) {
    console.error('Error scraping LinkedIn profile:', error);
    return profile;
  }
}

function parseCount(text) {
  if (!text) return 0;
  
  const cleanText = text.toLowerCase().replace(/[^0-9.km]/g, '');
  
  if (cleanText.includes('k')) {
    return Math.round(parseFloat(cleanText) * 1000);
  } else if (cleanText.includes('m')) {
    return Math.round(parseFloat(cleanText) * 1000000);
  }
  
  return parseInt(cleanText) || 0;
}

let currentUrl = location.href;
new MutationObserver(() => {
  if (location.href !== currentUrl) {
    currentUrl = location.href;
    console.log('LinkedIn page changed:', currentUrl);
  }
}).observe(document, { subtree: true, childList: true });
