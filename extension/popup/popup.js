
const API_BASE_URL = 'http://localhost:3000/api';
const getTabTitleBtn = document.getElementById('getTabTitle');
const tabTitleResult = document.getElementById('tabTitleResult');
const profileUrlsInput = document.getElementById('profileUrls');
const startScrapingBtn = document.getElementById('startScraping');
const scrapingProgress = document.getElementById('scrapingProgress');
const likeCountInput = document.getElementById('likeCount');
const commentCountInput = document.getElementById('commentCount');
const startEngagementBtn = document.getElementById('startEngagement');
const engagementProgress = document.getElementById('engagementProgress');


getTabTitleBtn.addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab && tab.title) {
      tabTitleResult.textContent = `Tab Title: ${tab.title}`;
      tabTitleResult.classList.add('show');
    } else {
      tabTitleResult.textContent = 'Could not get tab title';
      tabTitleResult.classList.add('show');
    }
  } catch (error) {
    tabTitleResult.textContent = `Error: ${error.message}`;
    tabTitleResult.classList.add('show');
  }
});


startScrapingBtn.addEventListener('click', async () => {
  const urls = profileUrlsInput.value
    .split(',')
    .map(url => url.trim())
    .filter(url => url.length > 0);

  if (urls.length < 3) {
    showProgress(scrapingProgress, 'Please enter at least 3 LinkedIn profile URLs', 'error');
    return;
  }

  const validUrls = urls.filter(url => 
    url.includes('linkedin.com/in/') || url.includes('linkedin.com/company/')
  );

  if (validUrls.length < urls.length) {
    showProgress(scrapingProgress, 'Some URLs are not valid LinkedIn profile URLs', 'error');
    return;
  }


  startScrapingBtn.disabled = true;
  scrapingProgress.innerHTML = '';
  scrapingProgress.classList.add('show');

  try {
    showProgress(scrapingProgress, `Starting scraping for ${validUrls.length} profiles...`, 'info');

    
    chrome.runtime.sendMessage(
      { action: 'startScraping', urls: validUrls },
      (response) => {
        if (chrome.runtime.lastError) {
          showProgress(scrapingProgress, `Error: ${chrome.runtime.lastError.message}`, 'error');
          startScrapingBtn.disabled = false;
        }
      }
    );

    
    chrome.runtime.onMessage.addListener(function progressListener(message) {
      if (message.action === 'scrapingProgress') {
        const { current, total, status, profile, error } = message.data;
        
        if (status === 'processing') {
          showProgress(scrapingProgress, 
            `<span class="loading"></span>Processing profile ${current}/${total}: ${profile?.name || 'Loading...'}`, 
            'info'
          );
        } else if (status === 'success') {
          showProgress(scrapingProgress, 
            `✓ Profile ${current}/${total} saved: ${profile.name}`, 
            'success'
          );
        } else if (status === 'error') {
          showProgress(scrapingProgress, 
            `✗ Profile ${current}/${total} failed: ${error}`, 
            'error'
          );
        } else if (status === 'complete') {
          showProgress(scrapingProgress, 
            `✓ Scraping complete! Processed ${total} profiles.`, 
            'success'
          );
          startScrapingBtn.disabled = false;
          chrome.runtime.onMessage.removeListener(progressListener);
        }
      }
    });
  } catch (error) {
    showProgress(scrapingProgress, `Error: ${error.message}`, 'error');
    startScrapingBtn.disabled = false;
  }
});


function validateEngagementInputs() {
  const likeCount = parseInt(likeCountInput.value) || 0;
  const commentCount = parseInt(commentCountInput.value) || 0;
  
  startEngagementBtn.disabled = !(likeCount > 0 || commentCount > 0);
}

likeCountInput.addEventListener('input', validateEngagementInputs);
commentCountInput.addEventListener('input', validateEngagementInputs);

startEngagementBtn.addEventListener('click', async () => {
  const likeCount = parseInt(likeCountInput.value) || 0;
  const commentCount = parseInt(commentCountInput.value) || 0;

  if (likeCount <= 0 && commentCount <= 0) {
    showProgress(engagementProgress, 'Please enter valid counts greater than 0', 'error');
    return;
  }

  
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab.url.includes('linkedin.com')) {
    showProgress(engagementProgress, 'Please navigate to LinkedIn first', 'error');
    return;
  }

  
  startEngagementBtn.disabled = true;
  engagementProgress.innerHTML = '';
  engagementProgress.classList.add('show');

  try {
    showProgress(engagementProgress, 'Starting feed engagement...', 'info');

    
    chrome.runtime.sendMessage(
      { 
        action: 'startEngagement', 
        data: { likeCount, commentCount }
      },
      (response) => {
        if (chrome.runtime.lastError) {
          showProgress(engagementProgress, `Error: ${chrome.runtime.lastError.message}`, 'error');
          startEngagementBtn.disabled = false;
        }
      }
    );

    
    chrome.runtime.onMessage.addListener(function engagementListener(message) {
      if (message.action === 'engagementProgress') {
        const { liked, totalLikes, commented, totalComments, status, error } = message.data;
        
        if (status === 'processing') {
          const counterHTML = `
            <div class="counter">
              <div>Liked: ${liked} / ${totalLikes}</div>
              <div>Commented: ${commented} / ${totalComments}</div>
            </div>
          `;
          
          engagementProgress.innerHTML = counterHTML;
        } else if (status === 'complete') {
          showProgress(engagementProgress, 
            `✓ Engagement complete! Liked ${liked} posts, Commented on ${commented} posts.`, 
            'success'
          );
          startEngagementBtn.disabled = false;
          validateEngagementInputs();
          chrome.runtime.onMessage.removeListener(engagementListener);
        } else if (status === 'error') {
          showProgress(engagementProgress, `✗ Error: ${error}`, 'error');
          startEngagementBtn.disabled = false;
          validateEngagementInputs();
          chrome.runtime.onMessage.removeListener(engagementListener);
        }
      }
    });
  } catch (error) {
    showProgress(engagementProgress, `Error: ${error.message}`, 'error');
    startEngagementBtn.disabled = false;
    validateEngagementInputs();
  }
});

function showProgress(container, message, type = 'info') {
  const progressItem = document.createElement('div');
  progressItem.className = `progress-item ${type}`;
  progressItem.innerHTML = message;
  container.appendChild(progressItem);
  container.classList.add('show');
  
  container.scrollTop = container.scrollHeight;
}
