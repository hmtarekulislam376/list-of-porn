// background.js
let blockedSites = [];

// Load blocked sites when extension starts
chrome.runtime.onStartup.addListener(loadBlockedSites);
chrome.runtime.onInstalled.addListener(loadBlockedSites);

async function loadBlockedSites() {
  try {
    // Try to read block.txt from extension directory
    const response = await fetch(chrome.runtime.getURL('block.txt'));
    const text = await response.text();
    
    blockedSites = text.split('\n')
      .map(line => line.trim().toLowerCase())
      .filter(line => line && !line.startsWith('#') && !line.startsWith('//'));
    
    console.log('Loaded blocked sites:', blockedSites);
    
    // Store in chrome storage for content script
    chrome.storage.local.set({ blockedSites: blockedSites });
    
  } catch (error) {
    console.error('Could not load block.txt:', error);
    
    // Default blocked sites if file not found
    blockedSites = [
      'pornhub.com',
      'xvideos.com', 
      'xhamster.com',
      'xnxx.com',
      'redtube.com'
    ];
    
    chrome.storage.local.set({ blockedSites: blockedSites });
  }
}

// Check URL before navigation
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId !== 0) return; // Only main frame
  
  const url = details.url.toLowerCase();
  const hostname = new URL(details.url).hostname.toLowerCase();
  
  // Check if site is blocked
  const isBlocked = blockedSites.some(site => {
    const cleanSite = site.replace('www.', '');
    return hostname.includes(cleanSite) || hostname.endsWith(cleanSite);
  });
  
  if (isBlocked) {
    console.log('Blocking site:', hostname);
    // Redirect to Google
    chrome.tabs.update(details.tabId, { 
      url: 'https://www.google.com/?blocked=' + encodeURIComponent(hostname)
    });
  }
});

// Handle tab updates (for when user types URL directly)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    const hostname = new URL(changeInfo.url).hostname.toLowerCase();
    
    const isBlocked = blockedSites.some(site => {
      const cleanSite = site.replace('www.', '');
      return hostname.includes(cleanSite) || hostname.endsWith(cleanSite);
    });
    
    if (isBlocked) {
      console.log('Blocking direct URL:', hostname);
      chrome.tabs.update(tabId, { 
        url: 'https://www.google.com/?blocked=' + encodeURIComponent(hostname)
      });
    }
  }
});