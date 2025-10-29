let currentPageInfo = { title: '', url: '' };
let sessionNodes = [];
let mergeMode = false;
let selectedNodes = new Set();
let domReady = false;

document.addEventListener('DOMContentLoaded', async () => {
  domReady = true;
  await loadPageInfo();
  await loadSessionNodes();
  setupEventListeners();
  startSyncPolling();
});

async function loadPageInfo() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getPageInfo' });
    if (response) {
      currentPageInfo = response;
    }
  } catch (error) {
    console.error('Error loading page info:', error);
  }
}

async function loadSessionNodes() {
  try {
    // Load from web app's nodes API
    const appUrl = await getAppUrl();
    const response = await fetch(`${appUrl}/api/nodes`);
    
    if (response.ok) {
      const data = await response.json();
      // Filter to only show captured nodes (not manually created ones)
      sessionNodes = (data.nodes || []).filter(n => 
        n.id.startsWith('captured-') || n.id.startsWith('merged-')
      );
      renderNodeHistory();
      updateSessionBadge();
    }
  } catch (error) {
    console.error('Error loading session nodes:', error);
    // Fallback to empty if API not available
    sessionNodes = [];
    renderNodeHistory();
    updateSessionBadge();
  }
}

async function saveSessionNodes() {
  // No longer needed - web app is source of truth
  renderNodeHistory();
  updateSessionBadge();
}

async function startSyncPolling() {
  setInterval(async () => {
    try {
      const appUrl = await getAppUrl();
      
      // Sync with web app's nodes API to get current state
      const response = await fetch(`${appUrl}/api/nodes`);
      
      if (response.ok) {
        const data = await response.json();
        const webAppNodes = (data.nodes || []).filter(n => 
          n.id.startsWith('captured-') || n.id.startsWith('merged-')
        );
        
        // Update our session nodes with web app state
        let changed = false;
        
        // Add new nodes from web app
        webAppNodes.forEach(webNode => {
          if (!sessionNodes.find(sn => sn.id === webNode.id)) {
            sessionNodes.push({
              id: webNode.id,
              type: webNode.data?.captureType || webNode.type,
              title: webNode.data?.title || 'Untitled',
              content: webNode.data?.content || '',
              weight: webNode.data?.weight || 5,
              url: webNode.data?.sourceUrl || '',
              sourceUrl: webNode.data?.sourceUrl || '',
              timestamp: new Date().toISOString(),
              aiGenerated: webNode.data?.aiGenerated || false
            });
            changed = true;
          }
        });
        
        // Remove nodes that were deleted in web app
        const webAppNodeIds = new Set(webAppNodes.map(n => n.id));
        const originalLength = sessionNodes.length;
        sessionNodes = sessionNodes.filter(sn => webAppNodeIds.has(sn.id));
        if (sessionNodes.length !== originalLength) {
          changed = true;
        }
        
        // Update titles that changed
        sessionNodes.forEach(sessionNode => {
          const webNode = webAppNodes.find(wn => wn.id === sessionNode.id);
          if (webNode && webNode.data?.title && webNode.data.title !== sessionNode.title) {
            sessionNode.title = webNode.data.title;
            sessionNode.aiGenerated = webNode.data.aiGenerated || false;
            changed = true;
          }
        });
        
        if (changed) {
          await saveSessionNodes();
        }
      }
    } catch (error) {
      // Silently fail
    }
  }, 2000);
}

function renderNodeHistory() {
  const listEl = document.getElementById('nodeList');
  
  if (sessionNodes.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📦</div>
        <div class="empty-text">No nodes yet</div>
        <div class="empty-hint">Create or capture content to see it here</div>
      </div>
    `;
    return;
  }

  listEl.innerHTML = sessionNodes.map(node => {
    const isImage = node.type === 'image';
    const displayContent = isImage ? '' : (node.content || '').substring(0, 150);
    const isSelected = selectedNodes.has(node.id);
    
    return `
      <div class="node-item ${mergeMode ? 'merge-mode' : ''} ${isSelected ? 'selected' : ''}" 
           data-id="${node.id}">
        ${mergeMode ? `<input type="checkbox" class="node-checkbox" ${isSelected ? 'checked' : ''}>` : ''}
        ${!mergeMode ? `<button class="delete-x" data-node-id="${node.id}">×</button>` : ''}
        <div class="node-header">
          <span class="node-type-badge">
            <span>${getTypeIcon(node.type)}</span>
            ${node.type}
          </span>
          ${node.aiGenerated ? '<span class="ai-badge">✨ AI</span>' : ''}
        </div>
        ${isImage ? `<img src="${node.content}" class="node-image" alt="Node image">` : ''}
        <div class="node-title">${escapeHtml(node.title || 'Untitled')}</div>
        ${!isImage ? `<div class="node-content-text">${escapeHtml(displayContent)}</div>` : ''}
        <div class="node-meta">
          <span>${timeAgo(node.timestamp)}</span>
        </div>
      </div>
    `;
  }).join('');

  if (mergeMode) {
    document.querySelectorAll('.node-item.merge-mode').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.type !== 'checkbox') {
          const checkbox = item.querySelector('.node-checkbox');
          checkbox.checked = !checkbox.checked;
        }
        toggleNodeSelection(item.dataset.id);
      });
      
      const checkbox = item.querySelector('.node-checkbox');
      checkbox.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleNodeSelection(item.dataset.id);
      });
    });
  } else {
    document.querySelectorAll('.delete-x').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const nodeId = btn.dataset.nodeId;
        deleteNode(nodeId);
      });
    });
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function getTypeIcon(type) {
  const icons = {
    text: '📝',
    image: '🖼️',
    link: '🔗',
    screenshot: '📸',
    custom: '✨',
    summary: '📄'
  };
  return icons[type] || '📄';
}

function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - new Date(timestamp)) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return 'Earlier';
}

function setupEventListeners() {
  const openAppBtn = document.getElementById('openApp');
  const captureSelectionBtn = document.getElementById('captureSelection');
  const captureSummaryBtn = document.getElementById('captureSummary');
  const captureTitleBtn = document.getElementById('captureTitle');
  const captureScreenshotBtn = document.getElementById('captureScreenshot');
  const createNodeBtn = document.getElementById('createNode');
  const mergeBtnEl = document.getElementById('mergeBtn');
  const cancelMergeBtn = document.getElementById('cancelMerge');
  const confirmMergeBtn = document.getElementById('confirmMerge');
  const customTextEl = document.getElementById('customText');
  
  if (openAppBtn) {
    openAppBtn.addEventListener('click', async () => {
      const appUrl = await getAppUrl();
      chrome.tabs.create({ url: `${appUrl}/flow` });
    });
  }
  
  if (captureSelectionBtn) {
    captureSelectionBtn.addEventListener('click', captureSelection);
  }
  
  if (captureSummaryBtn) {
    captureSummaryBtn.addEventListener('click', captureSummary);
  }
  
  if (captureTitleBtn) {
    captureTitleBtn.addEventListener('click', captureTitle);
  }
  
  if (captureScreenshotBtn) {
    captureScreenshotBtn.addEventListener('click', captureScreenshot);
  }
  
  if (createNodeBtn) {
    createNodeBtn.addEventListener('click', createCustomNode);
  }

  if (mergeBtnEl) {
    mergeBtnEl.addEventListener('click', enterMergeMode);
  }
  
  if (cancelMergeBtn) {
    cancelMergeBtn.addEventListener('click', exitMergeMode);
  }
  
  if (confirmMergeBtn) {
    confirmMergeBtn.addEventListener('click', mergeSelectedNodes);
  }

  if (customTextEl) {
    customTextEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        createCustomNode();
      }
    });

    customTextEl.addEventListener('input', () => {
      customTextEl.style.height = 'auto';
      customTextEl.style.height = Math.min(customTextEl.scrollHeight, 200) + 'px';
    });
  }

  chrome.runtime.onMessage.addListener(async (message) => {
    if (message.target === 'sidepanel' && message.action === 'captureAdded') {
      setTimeout(() => loadSessionNodes(), 500);
    }
  });
}

async function captureSelection() {
  if (!domReady) return;
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection().toString()
    });
    
    const selection = result[0].result;
    if (!selection || !selection.trim()) {
      showStatus('Please select some text first', 'error');
      return;
    }

    await createNode({
      type: 'text',
      content: selection,
      url: currentPageInfo.url,
      sourceUrl: currentPageInfo.url,
      weight: 5
    });
  } catch (error) {
    console.error('Selection capture error:', error);
    showStatus('Failed to capture selection', 'error');
  }
}

async function captureSummary() {
  if (!domReady) return;
  
  try {
    showStatus('Extracting page content...', 'success');
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const article = document.querySelector('article') || 
                       document.querySelector('main') || 
                       document.querySelector('[role="main"]') ||
                       document.body;
        // Extract more content for comprehensive summary
        return article.innerText.substring(0, 5000);
      }
    });
    
    const pageText = result[0].result;
    
    if (!pageText || !pageText.trim()) {
      showStatus('Could not extract page content', 'error');
      return;
    }

    showStatus('Summarizing...', 'success');

    // Try to use AI summarizer (global Summarizer)
    let summaryContent = pageText;
    let summaryTitle = `Page: ${currentPageInfo.title}`;
    let usedAI = false;
    
    try {
      if (typeof Summarizer !== 'undefined') {
        console.log('Using Summarizer API for page summary...');
        
        // Summarize the content - use medium length for comprehensive summary
        const summarizer = await Summarizer.create({
          type: 'tl;dr',
          format: 'plain-text',
          length: 'medium'
        });
        
        summaryContent = await summarizer.summarize(pageText);
        summarizer.destroy();
        
        // Clean up summary - ensure it ends at a complete sentence
        if (summaryContent && summaryContent.trim()) {
          const trimmed = summaryContent.trim();
          
          // Find the last sentence-ending punctuation
          const lastPeriod = trimmed.lastIndexOf('.');
          const lastQuestion = trimmed.lastIndexOf('?');
          const lastExclamation = trimmed.lastIndexOf('!');
          const lastSentenceEnd = Math.max(lastPeriod, lastQuestion, lastExclamation);
          
          // If the summary doesn't end with punctuation, cut at last complete sentence
          const lastChar = trimmed[trimmed.length - 1];
          if (lastChar !== '.' && lastChar !== '?' && lastChar !== '!' && lastSentenceEnd > 0) {
            // Cut at the last complete sentence
            summaryContent = trimmed.substring(0, lastSentenceEnd + 1);
            console.log('Trimmed incomplete sentence from summary');
          } else {
            summaryContent = trimmed;
          }
        }
        
        // Generate title using headline type for conciseness
        const titleSummarizer = await Summarizer.create({
          type: 'headline',
          format: 'plain-text',
          length: 'short'
        });
        summaryTitle = await titleSummarizer.summarize(pageText);
        titleSummarizer.destroy();
        
        // Clean up title - take first line and limit length
        const cleanTitle = summaryTitle.split('\n')[0]
          .trim()
          .replace(/^["'\-•*]\s*|["']$/g, '')
          .replace(/\s+/g, ' ');
        
        summaryTitle = cleanTitle.length > 40 
          ? cleanTitle.substring(0, 37) + '...' 
          : cleanTitle;
        
        usedAI = true;
        console.log('AI summary generated, final length:', summaryContent.length, 'chars');
      } else {
        console.log('Summarizer API not available');
      }
    } catch (error) {
      console.log('AI summarization failed, using raw text:', error.message);
    }

    await createNode({
      type: 'summary',
      content: summaryContent,
      title: summaryTitle,
      url: currentPageInfo.url,
      sourceUrl: currentPageInfo.url,
      weight: 5,
      aiGenerated: usedAI
    });
    
    showStatus(usedAI ? 'AI summary captured!' : 'Page content captured!', 'success');
  } catch (error) {
    console.error('Summary error:', error);
    showStatus('Failed to capture page', 'error');
  }
}

async function captureTitle() {
  if (!domReady) return;
  
  await createNode({
    type: 'text',
    content: currentPageInfo.title,
    title: currentPageInfo.title,
    url: currentPageInfo.url,
    sourceUrl: currentPageInfo.url,
    weight: 5,
    aiGenerated: false
  });
}

async function captureScreenshot() {
  if (!domReady) return;
  
  try {
    showStatus('Capturing screenshot...', 'success');
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      showStatus('No active tab found', 'error');
      return;
    }
    
    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
      format: 'png'
    });
    
    if (dataUrl) {
      await createNode({
        type: 'image',
        content: dataUrl,
        url: currentPageInfo.url,
        sourceUrl: currentPageInfo.url,
        weight: 5
      });
      showStatus('Screenshot captured!', 'success');
    } else {
      showStatus('Failed to capture screenshot', 'error');
    }
  } catch (error) {
    console.error('Screenshot error:', error);
    if (error.message && error.message.includes('permission')) {
      showStatus('Permission needed - close and reopen side panel', 'error');
    } else if (error.message && error.message.includes('cannot be captured')) {
      showStatus('This page cannot be captured', 'error');
    } else {
      showStatus('Failed to capture screenshot', 'error');
    }
  }
}

async function createCustomNode() {
  if (!domReady) return;
  
  const textarea = document.getElementById('customText');
  if (!textarea) return;
  
  const content = textarea.value.trim();
  
  if (!content) {
    showStatus('Please enter some text', 'error');
    return;
  }

  await createNode({
    type: 'custom',
    content: content,
    url: currentPageInfo.url,
    sourceUrl: currentPageInfo.url,
    weight: 5
  });

  textarea.value = '';
  textarea.style.height = 'auto';
}

async function createNode(data) {
  try {
    console.log('Creating node with data:', data);
    
    const nodeId = `captured-${Date.now()}`;
    let fallbackTitle = data.title || generateFallbackTitle(data);
    
    // Try to generate AI title if content is text and substantial
    let aiTitle = null;
    let aiGenerated = false;
    
    if ((data.type === 'text' || data.type === 'custom' || data.type === 'summary') && 
        data.content && 
        data.content.length > 50) {
      try {
        // Check for Chrome's built-in AI (global Summarizer)
        if (typeof Summarizer !== 'undefined') {
          console.log('Generating AI title with Summarizer API...');
          
          const summarizer = await Summarizer.create({
            type: 'headline',
            format: 'plain-text',
            length: 'short'
          });
          
          const truncatedContent = data.content.length > 800 
            ? data.content.substring(0, 800) 
            : data.content;
          
          aiTitle = await summarizer.summarize(truncatedContent);
          summarizer.destroy();
          
          if (aiTitle && aiTitle.trim()) {
            // Take first line if multi-line, clean up formatting
            const cleanTitle = aiTitle.split('\n')[0]
              .trim()
              .replace(/^["'\-•*]\s*|["']$/g, '')
              .replace(/\s+/g, ' ');
            
            // Limit to 40 characters for node display
            aiTitle = cleanTitle.length > 40 
              ? cleanTitle.substring(0, 37) + '...' 
              : cleanTitle;
            
            aiGenerated = true;
            console.log('AI title generated:', aiTitle);
          }
        } else {
          console.log('Summarizer API not available');
        }
      } catch (error) {
        console.log('AI title generation failed:', error.message);
      }
    }
    
    const finalTitle = aiTitle || fallbackTitle;
    
    const nodeData = {
      id: nodeId,
      ...data,
      title: finalTitle,
      timestamp: new Date().toISOString(),
      aiGenerated: aiGenerated
    };

    console.log('Sending node data to web app:', nodeData);

    // Send to web app - it will add to nodes
    const appUrl = await getAppUrl();
    const response = await fetch(`${appUrl}/api/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nodeData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server response not OK:', response.status, errorText);
      throw new Error(`Server error: ${response.status}`);
    }

    const result = await response.json();
    console.log('Node created successfully:', result);

    showStatus('Node created!', 'success');
    
    // Refresh immediately to show the new node
    setTimeout(() => loadSessionNodes(), 500);
  } catch (error) {
    console.error('Create node error:', error);
    showStatus('Failed to create node', 'error');
  }
}

function generateFallbackTitle(data) {
  if (data.type === 'image' || data.type === 'screenshot') {
    return 'Screenshot';
  }
  
  if (data.type === 'summary') {
    return 'Page Summary';
  }
  
  const words = (data.content || '').split(/\s+/).slice(0, 4);
  return words.join(' ').substring(0, 35) || 'Untitled';
}

function enterMergeMode() {
  mergeMode = true;
  selectedNodes.clear();
  document.getElementById('mergeBar').classList.add('active');
  document.getElementById('confirmMerge').disabled = true;
  document.getElementById('mergeCount').textContent = '0';
  renderNodeHistory();
}

function exitMergeMode() {
  mergeMode = false;
  selectedNodes.clear();
  document.getElementById('mergeBar').classList.remove('active');
  renderNodeHistory();
}

function toggleNodeSelection(nodeId) {
  if (selectedNodes.has(nodeId)) {
    selectedNodes.delete(nodeId);
  } else {
    selectedNodes.add(nodeId);
  }
  
  document.getElementById('mergeCount').textContent = selectedNodes.size;
  document.getElementById('confirmMerge').disabled = selectedNodes.size < 2;
  
  const nodeItem = document.querySelector(`.node-item[data-id="${nodeId}"]`);
  if (nodeItem) {
    if (selectedNodes.has(nodeId)) {
      nodeItem.classList.add('selected');
    } else {
      nodeItem.classList.remove('selected');
    }
  }
}

async function mergeSelectedNodes() {
  if (selectedNodes.size < 2) {
    showStatus('Select at least 2 nodes to merge', 'error');
    return;
  }

  try {
    showStatus('Merging nodes...', 'success');
    
    const nodesToMerge = sessionNodes.filter(n => selectedNodes.has(n.id));
    
    if (nodesToMerge.length < 2) {
      showStatus('Could not find selected nodes', 'error');
      return;
    }
    
    const mergedContent = nodesToMerge.map(n => n.content).join('\n\n---\n\n');
    const mergedTitle = `Merged: ${nodesToMerge[0].title}`;
    const avgWeight = Math.round(
      nodesToMerge.reduce((sum, n) => sum + (n.weight || 5), 0) / nodesToMerge.length
    );

    const mergedNodeId = `merged-${Date.now()}`;
    const mergedNode = {
      id: mergedNodeId,
      type: 'text',
      title: mergedTitle,
      content: mergedContent,
      weight: avgWeight,
      url: currentPageInfo.url,
      sourceUrl: currentPageInfo.url,
      timestamp: new Date().toISOString(),
      aiGenerated: false
    };

    const appUrl = await getAppUrl();

    // Delete old nodes via nodes API
    const deletePromises = Array.from(selectedNodes).map(nodeId => 
      fetch(`${appUrl}/api/nodes?id=${nodeId}`, {
        method: 'DELETE'
      }).catch(err => console.error('Failed to delete node:', err))
    );
    
    await Promise.all(deletePromises);

    // Send merged node to capture API (will be added to web app)
    await fetch(`${appUrl}/api/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mergedNode)
    });
    
    showStatus(`Merged ${selectedNodes.size} nodes!`, 'success');
    exitMergeMode();
    
    // Refresh to show merged result
    setTimeout(() => loadSessionNodes(), 500);
  } catch (error) {
    console.error('Merge error:', error);
    showStatus('Failed to merge nodes', 'error');
  }
}

async function deleteNode(nodeId) {
  try {
    const appUrl = await getAppUrl();
    
    console.log('Deleting node:', nodeId);
    
    // Remove from local session first for immediate feedback
    sessionNodes = sessionNodes.filter(n => n.id !== nodeId);
    renderNodeHistory();
    updateSessionBadge();
    
    // Mark as deleted in capture API (this tells Flow.js to remove it)
    const deleteResponse = await fetch(`${appUrl}/api/capture?id=${nodeId}&type=direct&fromSidePanel=true`, {
      method: 'DELETE'
    });
    
    if (deleteResponse.ok) {
      const result = await deleteResponse.json();
      console.log('Delete API response:', result);
    }
    
    // Also delete from nodes API
    await fetch(`${appUrl}/api/nodes?id=${nodeId}`, {
      method: 'DELETE'
    });

    showStatus('Node deleted', 'success');
  } catch (error) {
    console.error('Delete error:', error);
    showStatus('Failed to delete node', 'error');
    // Reload on error to get correct state
    setTimeout(() => loadSessionNodes(), 500);
  }
}

async function updateSessionBadge() {
  const badge = document.getElementById('sessionBadge');
  badge.textContent = `${sessionNodes.length} node${sessionNodes.length !== 1 ? 's' : ''}`;
}

function showStatus(message, type) {
  // Always log to console for debugging
  console.log(`Status [${type}]:`, message);
  
  if (!domReady) {
    return;
  }
  
  const statusEl = document.getElementById('statusMessage');
  
  if (!statusEl) {
    console.warn('Status element not found in DOM');
    return;
  }
  
  if (statusEl.hideTimeout) {
    clearTimeout(statusEl.hideTimeout);
  }
  
  statusEl.textContent = message;
  statusEl.className = `status-message ${type}`;
  
  // Force reflow
  void statusEl.offsetWidth;
  
  statusEl.classList.add('show');
  
  // Store timeout on the element itself
  const timeoutId = setTimeout(() => {
    const el = document.getElementById('statusMessage');
    if (el) {
      el.classList.remove('show');
    }
  }, 3000);
  
  statusEl.hideTimeout = timeoutId;
}

async function getAppUrl() {
  const result = await chrome.storage.sync.get(['mindCraftUrl']);
  return result.mindCraftUrl || 'https://mind-craft-deploy.vercel.app';
}