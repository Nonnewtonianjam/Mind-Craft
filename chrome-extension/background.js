// Create context menu items when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  // Context menu for selected text
  chrome.contextMenus.create({
    id: 'captureText',
    title: 'Send to Mind-Craft',
    contexts: ['selection']
  });

  // Context menu for images
  chrome.contextMenus.create({
    id: 'captureImage',
    title: 'Send Image to Mind-Craft',
    contexts: ['image']
  });

  // Context menu for links
  chrome.contextMenus.create({
    id: 'captureLink',
    title: 'Send Link to Mind-Craft',
    contexts: ['link']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  let captureData = {
    type: '',
    content: '',
    url: tab.url,
    pageTitle: tab.title,
    timestamp: new Date().toISOString()
  };

  if (info.menuItemId === 'captureText') {
    captureData.type = 'text';
    captureData.content = info.selectionText;
  } else if (info.menuItemId === 'captureImage') {
    captureData.type = 'image';
    captureData.content = info.srcUrl;
  } else if (info.menuItemId === 'captureLink') {
    captureData.type = 'link';
    captureData.content = info.linkUrl;
  }

  // Send to Mind-Craft web app (context menu = direct capture)
  sendToMindCraft(captureData, 'context-menu');
  
  // Notify side panel to update
  notifySidePanel('captureAdded', captureData);
});

// Handle toolbar icon click - open side panel
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

// Listen for messages from side panel or content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'captureContent') {
    sendToMindCraft(message.data, message.source || 'sidepanel');
    sendResponse({ success: true });
  } else if (message.action === 'getPageInfo') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        sendResponse({
          title: tabs[0].title,
          url: tabs[0].url
        });
      }
    });
    return true; // Keep channel open for async response
  } else if (message.action === 'captureScreenshot') {
    captureScreenshot().then(dataUrl => {
      sendResponse({ success: true, dataUrl });
    });
    return true;
  } else if (message.action === 'getSessionStats') {
    getSessionStats().then(stats => {
      sendResponse(stats);
    });
    return true;
  }
});

// Send captured content to Mind-Craft web app
async function sendToMindCraft(data, source = 'context-menu') {
  try {
    const result = await chrome.storage.sync.get(['mindCraftUrl']);
    const appUrl = result.mindCraftUrl || 'http://localhost:3000';

    const captureData = {
      ...data,
      source: source === 'sidepanel' ? 'popup' : undefined
    };

    const response = await fetch(`${appUrl}/api/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(captureData)
    });

    if (response.ok) {
      const responseData = await response.json();
      console.log('Content sent successfully:', responseData);
      
      await incrementSessionCaptures();
      
      // Notify side panel with the node ID from the response
      if (responseData.item) {
        chrome.runtime.sendMessage({
          target: 'sidepanel',
          action: 'captureAdded',
          data: responseData.item  // Use the item from response which has the ID
        }).catch(() => {});
      }
      
      if (source === 'context-menu') {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'Mind-Craft',
          message: 'Content captured successfully!'
        });
      }
      
      return { success: true };
    } else {
      throw new Error('Failed to send content');
    }
  } catch (error) {
    console.error('Error sending to Mind-Craft:', error);
    
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Mind-Craft Error',
      message: 'Failed to send content. Is Mind-Craft running?'
    });
    
    return { success: false, error: error.message };
  }
}

// Capture screenshot with proper permission handling
async function captureScreenshot() {
  try {
    // Get the current active tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tabs || tabs.length === 0) {
      throw new Error('No active tab found');
    }
    
    const tab = tabs[0];
    
    // Check if the tab URL is capturable (some Chrome pages can't be captured)
    if (tab.url.startsWith('chrome://') || 
        tab.url.startsWith('chrome-extension://') ||
        tab.url.startsWith('edge://') ||
        tab.url.startsWith('about:')) {
      throw new Error('This page cannot be captured due to browser restrictions');
    }
    
    // Capture the visible area of the tab
    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
      format: 'png',
      quality: 95
    });
    
    if (!dataUrl) {
      throw new Error('Failed to capture screenshot');
    }
    
    return dataUrl;
  } catch (error) {
    console.error('Screenshot capture error:', error);
    throw error;
  }
}

// Listen for messages from side panel or content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'captureContent') {
    sendToMindCraft(message.data, message.source || 'sidepanel');
    sendResponse({ success: true });
  } else if (message.action === 'getPageInfo') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        sendResponse({
          title: tabs[0].title,
          url: tabs[0].url
        });
      } else {
        sendResponse({ title: '', url: '' });
      }
    });
    return true; // Keep channel open for async response
  } else if (message.action === 'captureScreenshot') {
    // Handle screenshot capture asynchronously
    captureScreenshot()
      .then(dataUrl => {
        sendResponse({ success: true, dataUrl });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep channel open for async response
  } else if (message.action === 'getSessionStats') {
    getSessionStats().then(stats => {
      sendResponse(stats);
    });
    return true;
  }
  
  return false;
});

// Notify side panel of updates
function notifySidePanel(action, data) {
  chrome.runtime.sendMessage({
    target: 'sidepanel',
    action,
    data
  }).catch(() => {
    // Side panel might not be open, that's ok
  });
}

// Session tracking
async function incrementSessionCaptures() {
  const result = await chrome.storage.local.get(['sessionCaptures', 'sessionStart']);
  const count = (result.sessionCaptures || 0) + 1;
  const start = result.sessionStart || Date.now();
  
  await chrome.storage.local.set({
    sessionCaptures: count,
    sessionStart: start
  });
}

async function getSessionStats() {
  const result = await chrome.storage.local.get(['sessionCaptures', 'sessionStart']);
  return {
    count: result.sessionCaptures || 0,
    startTime: result.sessionStart || Date.now()
  };
}

// Reset session on browser restart
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.set({
    sessionCaptures: 0,
    sessionStart: Date.now()
  });
});

chrome.commands.onCommand.addListener((command) => {
  if (command === 'open-side-panel') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.sidePanel.open({ windowId: tabs[0].windowId });
      }
    });
  }
});