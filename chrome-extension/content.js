// This content script can be used for future enhancements
// like highlighting selected text or showing a floating capture button

console.log('Mind-Craft content script loaded');

// Listen for messages from background script if needed
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getPageContent') {
    // Could extract specific page content if needed
    sendResponse({
      title: document.title,
      url: window.location.href,
      content: document.body.innerText
    });
  }
});