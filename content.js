// content.js
(function() {
  'use strict';

  let isBlocked = false;
  
  function blockCurrentSite() {
    if (isBlocked) return;
    
    const currentHostname = window.location.hostname.toLowerCase();
    
    // Get blocked sites from storage
    chrome.storage.local.get(['blockedSites'], (result) => {
      const blockedSites = result.blockedSites || [];
      
      const shouldBlock = blockedSites.some(site => {
        const cleanSite = site.replace('www.', '').toLowerCase();
        return currentHostname.includes(cleanSite) || 
               currentHostname.endsWith(cleanSite) ||
               currentHostname === cleanSite;
      });
      
      if (shouldBlock) {
        isBlocked = true;
        console.log('Content script blocking:', currentHostname);
        
        // Immediately hide all content
        if (document.documentElement) {
          document.documentElement.style.display = 'none';
        }
        
        // Replace page content
        document.documentElement.innerHTML = `
          <html>
          <head>
            <title>Site Blocked</title>
          </head>
          <body style="font-family: Arial; text-align: center; margin-top: 100px; background: #f0f0f0;">
            <h1 style="color: #e74c3c;">🚫 সাইট ব্লক করা হয়েছে</h1>
            <p style="font-size: 18px; color: #555;">Google এ পাঠানো হচ্ছে...</p>
            <script>
              setTimeout(function() {
                window.location.href = 'https://www.google.com';
              }, 1000);
            </script>
          </body>
          </html>
        `;
        
        // Force redirect after a moment
        setTimeout(() => {
          window.location.replace('https://www.google.com');
        }, 500);
        
        // Block back button
        history.pushState(null, null, window.location.href);
        window.addEventListener('popstate', function() {
          window.location.replace('https://www.google.com');
        });
        
        // Block refresh
        window.addEventListener('beforeunload', function(e) {
          window.location.replace('https://www.google.com');
        });
      }
    });
  }
  
  // Run immediately
  blockCurrentSite();
  
  // Run when DOM starts loading
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', blockCurrentSite);
  }
  
  // Also run on any page changes
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      blockCurrentSite();
    }
  }).observe(document, {subtree: true, childList: true});
  
})();