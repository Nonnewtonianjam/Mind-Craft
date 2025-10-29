// Get current tab info
let currentTab = null;

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  currentTab = tabs[0];
});

// Show status message
function showStatus(message, isSuccess) {
  const statusEl = document.getElementById('status');
  statusEl.textContent = message;
  statusEl.className = `status ${isSuccess ? 'success' : 'error'}`;
  statusEl.style.display = 'block';
  
  setTimeout(() => {
    statusEl.style.display = 'none';
  }, 3000);
}

// Capture page URL
document.getElementById('captureUrl').addEventListener('click', () => {
  if (!currentTab) return;
  
  const data = {
    type: 'link',
    content: currentTab.url,
    url: currentTab.url,
    title: currentTab.title,
    source: 'popup',
    timestamp: new Date().toISOString()
  };
  
  chrome.runtime.sendMessage({ action: 'captureContent', data }, (response) => {
    if (response.success) {
      showStatus('URL captured successfully!', true);
    } else {
      showStatus('Failed to capture URL', false);
    }
  });
});

// Capture page title
document.getElementById('captureTitle').addEventListener('click', () => {
  if (!currentTab) return;
  
  const data = {
    type: 'text',
    content: currentTab.title,
    url: currentTab.url,
    title: currentTab.title,
    source: 'popup',
    timestamp: new Date().toISOString()
  };
  
  chrome.runtime.sendMessage({ action: 'captureContent', data }, (response) => {
    if (response.success) {
      showStatus('Title captured successfully!', true);
    } else {
      showStatus('Failed to capture title', false);
    }
  });
});

// Capture custom text
document.getElementById('captureCustom').addEventListener('click', () => {
  const customText = document.getElementById('customText').value.trim();
  
  if (!customText) {
    showStatus('Please enter some text', false);
    return;
  }
  
  const data = {
    type: 'text',
    content: customText,
    url: currentTab ? currentTab.url : '',
    title: currentTab ? currentTab.title : 'Custom Text',
    source: 'popup',
    timestamp: new Date().toISOString()
  };
  
  chrome.runtime.sendMessage({ action: 'captureContent', data }, (response) => {
    if (response.success) {
      showStatus('Text captured successfully!', true);
      document.getElementById('customText').value = '';
    } else {
      showStatus('Failed to capture text', false);
    }
  });
});