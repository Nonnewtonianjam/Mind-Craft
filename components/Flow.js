'use client';

import React, { useState, useCallback } from 'react';
import { 
  ReactFlowProvider, 
  ReactFlow, 
  addEdge, 
  Background,
  applyNodeChanges,
  applyEdgeChanges
} from '@xyflow/react';
import PromptNode from './PromptNode';
import ImageNode from './ImageNode';
import ReactMarkdown from 'react-markdown';
import { ToastContainer, useToast } from './Toast';
import { 
  saveProjectToStorage, 
  loadProjectFromStorage, 
  deleteProjectFromStorage, 
  loadProjectsList as loadProjectsListUtil,
  loadLastProject as loadLastProjectUtil,
  exportProjectAsJSON 
} from '../utils/projectHelpers';
import { 
  buildPromptContext as buildPromptContextUtil,
  getOutputTitle as getOutputTitleUtil
} from '../utils/promptHelpers';
import { addNodeCallbacks, createNewNode } from '../utils/nodeHelpers';
import { generateTitleFromContent, findEmptyPositionInGrid, findPositionInSpiral } from '../utils/captureHelpers';
import { demoTemplates, loadDemoTemplate } from '../utils/demoTemplates';
import '@xyflow/react/dist/style.css';

export default function Flow() {
  return (
    <ReactFlowProvider>
      <FlowGraph />
    </ReactFlowProvider>
  );
}

function FlowGraph() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [capturedItems, setCapturedItems] = useState([]);
  const [projectName, setProjectName] = useState('Untitled Project');
  const [savedProjects, setSavedProjects] = useState([]);
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [showDemoMenu, setShowDemoMenu] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [aiCapabilities, setAiCapabilities] = useState({
    prompt: 'checking',
    summarizer: 'checking',
    writer: 'checking',
    rewriter: 'checking'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [outputContent, setOutputContent] = useState('');
  const [outputMode, setOutputMode] = useState('prompt');
  const [rootNodeId, setRootNodeId] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [outputHistory, setOutputHistory] = useState([]);
  const [selectedOutputIndex, setSelectedOutputIndex] = useState(null);
  const [processedCaptureIds, setProcessedCaptureIds] = useState(new Set());
  const [isProcessingCapture, setIsProcessingCapture] = useState(false);
  const [mergeMode, setMergeMode] = useState(false);
  const [selectedNodesForMerge, setSelectedNodesForMerge] = useState(new Set());

  const { toasts, removeToast, toast } = useToast();
  const recentToastsRef = React.useRef(new Set());

  const nodeTypes = { 
    promptNode: PromptNode,
    imageNode: ImageNode
  };

  React.useEffect(() => {
    setSavedProjects(loadProjectsListUtil());
    loadLastProjectFromStorage();
  }, []);

  React.useEffect(() => {
    checkAICapabilities();
  }, []);

  React.useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (nodes.length > 0 || edges.length > 0 || outputContent) {
        saveProject(projectName, true);
      }
    }, 30000);
    return () => clearInterval(autoSaveInterval);
  }, [nodes, edges, projectName, outputContent, outputHistory]);

  // Sync nodes to API for side panel access (improved two-way sync)
  React.useEffect(() => {
    const syncNodes = async () => {
      try {
        // FIRST: Check for deletions from side panel
        const deletedResponse = await fetch('/api/capture?type=deleted').catch(() => null);
        if (deletedResponse && deletedResponse.ok) {
          const deletedData = await deletedResponse.json();
          const deletedIdsArray = deletedData.deletedIds || [];
          
          // Ensure it's an array
          if (!Array.isArray(deletedIdsArray)) {
            console.error('deletedIds is not an array:', deletedIdsArray);
            return;
          }
          
          const deletedIds = new Set(deletedIdsArray);
          
          if (deletedIds.size > 0) {
            const nodesToRemove = nodes
              .filter(n => n.id.startsWith('captured-') || n.id.startsWith('merged-'))
              .filter(n => deletedIds.has(n.id))
              .map(n => n.id);
            
            if (nodesToRemove.length > 0) {
              console.log('Removing nodes deleted in side panel:', nodesToRemove);
              setNodes(currentNodes => currentNodes.filter(n => !nodesToRemove.includes(n.id)));
              setEdges(currentEdges => currentEdges.filter(e => 
                !nodesToRemove.includes(e.source) && !nodesToRemove.includes(e.target)
              ));
              
              // Clear the deleted IDs from the API
              await fetch('/api/capture?type=deleted', { method: 'DELETE' }).catch(() => {});
              
              // Don't sync back - we just deleted these nodes
              return;
            }
          }
        }
        
        // THEN: Sync our current state to API
        await fetch('/api/nodes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nodes })
        });
      } catch (error) {
        console.error('Node sync error:', error);
      }
    };
    
    syncNodes();
    
    // Poll every 2 seconds
    const interval = setInterval(syncNodes, 2000);
    return () => clearInterval(interval);
  }, [nodes]);

  React.useEffect(() => {
    setNodes(currentNodes => currentNodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        isSelectedForMerge: selectedNodesForMerge.has(node.id)
      }
    })));
  }, [selectedNodesForMerge]);

  // Apply selected edge styling
  React.useEffect(() => {
    setEdges(currentEdges => currentEdges.map(edge => ({
      ...edge,
      style: edge.selected 
        ? { stroke: '#2563eb', strokeWidth: 5 }
        : { stroke: '#94a3b8', strokeWidth: 3 },
      animated: edge.selected || false
    })));
  }, [edges.map(e => e.selected).join(',')]);

  const checkAICapabilities = async () => {
    const capabilities = { prompt: 'no', summarizer: 'no', writer: 'no', rewriter: 'no' };
    try {
      if (typeof LanguageModel !== 'undefined') {
        try {
          capabilities.prompt = await LanguageModel.availability();
        } catch (e) {}
      }
      if (typeof Summarizer !== 'undefined') {
        try {
          capabilities.summarizer = await Summarizer.availability();
        } catch (e) {}
      }
      if (typeof Writer !== 'undefined') {
        try {
          capabilities.writer = await Writer.availability();
        } catch (e) {}
      }
    } catch (error) {
      console.error('Error checking AI capabilities:', error);
    }
    setAiCapabilities(capabilities);
  };

  const onNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);

  const updateNode = useCallback((id, data) => {
    setNodes((nds) => nds.map((n) => n.id === id ? { ...n, data: { ...n.data, ...data } } : n));
  }, []);

  const setNodeAsRoot = useCallback((id) => {
    setNodes((nds) => nds.map((n) => ({
      ...n,
      data: { ...n.data, isRoot: n.id === id, weight: n.id === id ? 10 : n.data.weight }
    })));
    setRootNodeId(id);
  }, []);

  const deleteNode = useCallback((id) => {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    if (rootNodeId === id) setRootNodeId(null);
  }, [rootNodeId]);

  const findEmptyPosition = useCallback(() => {
    const nodeWidth = 240;
    const nodeHeight = 200;
    const padding = 40;
    
    // Calculate available viewport area accounting for all UI elements
    const sidebarWidth = sidebarExpanded ? 256 : 64;
    const outputPanelWidth = (outputContent && outputContent !== '__GENERATING__') || isGenerating ? window.innerWidth / 2 : 0;
    const headerHeight = 64;
    const buttonAreaHeight = 60;
    
    const availableWidth = window.innerWidth - sidebarWidth - outputPanelWidth;
    const availableHeight = window.innerHeight - headerHeight;
    
    const startX = 100;
    const startY = 100 + buttonAreaHeight;
    const maxX = availableWidth - nodeWidth - 100;
    const maxY = availableHeight - nodeHeight - 100;
    
    const cols = Math.max(1, Math.floor((maxX - startX) / (nodeWidth + padding)));
    const rows = Math.max(1, Math.floor((maxY - startY) / (nodeHeight + padding)));
    
    // Try grid positions first
    const gridPosition = findEmptyPositionInGrid(nodes, startX, startY, cols, rows, nodeWidth, nodeHeight, padding);
    if (gridPosition) return gridPosition;
    
    // Try spiral pattern from center
    const centerX = startX + (maxX - startX) / 2;
    const centerY = startY + (maxY - startY) / 2;
    const spiralPosition = findPositionInSpiral(centerX, centerY, nodeWidth, nodeHeight, padding, nodes, startX, maxX, startY, maxY);
    if (spiralPosition) return spiralPosition;
    
    // Last resort: top-left with offset
    return { 
      x: startX + (nodes.length % 3) * 50, 
      y: startY + Math.floor(nodes.length / 3) * 50 
    };
  }, [nodes, sidebarExpanded, outputContent, isGenerating]);

  const createNodeFromCapture = useCallback((item, isDirect = false) => {
    console.log('createNodeFromCapture called with:', item, 'isDirect:', isDirect);
    
    setNodes((currentNodes) => {
      if (currentNodes.find(n => n.id === item.id || n.id === `captured-${item.id}`)) {
        console.log('Node already exists, skipping:', item.id);
        return currentNodes;
      }

      const nodeWidth = item.type === 'image' ? 240 : 220;
      const nodeHeight = item.type === 'image' ? 200 : 160;
      const padding = 40;
      
      // Calculate available viewport
      const sidebarWidth = sidebarExpanded ? 256 : 64;
      const outputPanelWidth = (outputContent && outputContent !== '__GENERATING__') || isGenerating ? window.innerWidth / 2 : 0;
      const availableWidth = window.innerWidth - sidebarWidth - outputPanelWidth;
      const availableHeight = window.innerHeight - 64;
      
      const startX = 100;
      const startY = 160;
      const maxX = availableWidth - nodeWidth - 100;
      const maxY = availableHeight - nodeHeight - 100;
      
      const cols = Math.max(1, Math.floor((maxX - startX) / (nodeWidth + padding)));
      const rows = Math.max(1, Math.floor((maxY - startY) / (nodeHeight + padding)));
      
      let foundPosition = findEmptyPositionInGrid(currentNodes, startX, startY, cols, rows, nodeWidth, nodeHeight, padding);
      
      if (!foundPosition) {
        const centerX = startX + (maxX - startX) / 2;
        const centerY = startY + (maxY - startY) / 2;
        foundPosition = findPositionInSpiral(centerX, centerY, nodeWidth, nodeHeight, padding, currentNodes, startX, maxX, startY, maxY);
      }
      
      if (!foundPosition) {
        foundPosition = { 
          x: startX + (currentNodes.length % 3) * 50, 
          y: startY + Math.floor(currentNodes.length / 3) * 50 
        };
      }
      
      const position = foundPosition;
      const content = item.content;
      let title = item.title || generateTitleFromContent(content, item.type);
      if (!title.trim()) title = 'Note';
      
      const id = item.id.startsWith('captured-') ? item.id : `captured-${item.id}`;
      const nodeType = item.type === 'image' ? 'imageNode' : 'promptNode';
      
      console.log('Creating new node:', {
        id,
        type: nodeType,
        position,
        title,
        contentLength: content.length
      });
      
      const newNode = {
        id,
        type: nodeType,
        position,
        style: { width: nodeWidth, height: nodeHeight },
        data: { 
          id, 
          title, 
          content,
          weight: item.weight || 5, 
          isRoot: false, 
          isSkipped: false,
          isSelectedForMerge: false,
          captureType: item.type, 
          sourceUrl: item.url || item.sourceUrl,
          aiGenerated: item.aiGenerated || false,
          onChange: updateNode, 
          onSetAsRoot: setNodeAsRoot, 
          onDelete: deleteNode
        },
      };
      
      setTimeout(() => {
        saveProject(projectName, true);
      }, 500);
      
      if (isDirect) {
        const toastKey = `node-${item.id}-${title}`;
        
        if (!recentToastsRef.current.has(toastKey)) {
          recentToastsRef.current.add(toastKey);
          setTimeout(() => {
            toast.success('Node added', title);
            setTimeout(() => {
              recentToastsRef.current.delete(toastKey);
            }, 2000);
          }, 100);
        }
      }
      
      if (!isDirect) {
        setCapturedItems((items) => items.filter((i) => i.id !== item.id));
      }
      
      console.log('Node created successfully, new nodes count:', currentNodes.length + 1);
      return [...currentNodes, newNode];
    });
  }, [updateNode, setNodeAsRoot, deleteNode, projectName, toast, sidebarExpanded, outputContent, isGenerating]);

  const fetchCapturedItems = useCallback(async () => {
    if (isProcessingCapture) {
      return;
    }
    try {
      // FIRST: Check for deletions from side panel
      const deletedResponse = await fetch('/api/capture?type=deleted').catch(() => null);
      if (deletedResponse && deletedResponse.ok) {
        const deletedData = await deletedResponse.json();
        const deletedIdsArray = deletedData.deletedIds || [];
        
        // Ensure it's an array
        if (!Array.isArray(deletedIdsArray)) {
          console.error('deletedIds is not an array:', deletedIdsArray);
        } else {
          const deletedIds = new Set(deletedIdsArray);
          
          if (deletedIds.size > 0) {
            const nodesToRemove = nodes
              .filter(n => n.id.startsWith('captured-') || n.id.startsWith('merged-'))
              .filter(n => deletedIds.has(n.id))
              .map(n => n.id);
            
            if (nodesToRemove.length > 0) {
              console.log('Removing nodes deleted in side panel:', nodesToRemove);
              setNodes(currentNodes => currentNodes.filter(n => !nodesToRemove.includes(n.id)));
              setEdges(currentEdges => currentEdges.filter(e => 
                !nodesToRemove.includes(e.source) && !nodesToRemove.includes(e.target)
              ));
              
              // Clear the deleted IDs from the API so we don't process them again
              await fetch('/api/capture?type=deleted', { method: 'DELETE' }).catch(() => {});
            }
          }
        }
      }
      
      const previewResponse = await fetch('/api/capture').catch(() => null);
      if (previewResponse && previewResponse.ok) {
        const previewData = await previewResponse.json();
        setCapturedItems(previewData.items || []);
      }
      
      const directResponse = await fetch('/api/capture?type=direct').catch(() => null);
      if (directResponse && directResponse.ok) {
        const directData = await directResponse.json();
        const directItems = directData.items || [];
        
        if (directItems.length > 0) {
          console.log('Polling direct captures:', directItems.length, 'items found');
        }
        
        const newItems = directItems.filter(item => !processedCaptureIds.has(item.id));
        
        if (newItems.length > 0) {
          console.log('Found new captures to process:', newItems.length);
          setIsProcessingCapture(true);
          
          for (const item of newItems) {
            console.log('Creating node from capture:', item);
            processedCaptureIds.add(item.id);
            createNodeFromCapture(item, true);
            await fetch(`/api/capture?type=direct&id=${item.id}`, { method: 'DELETE' }).catch(() => {});
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          
          setProcessedCaptureIds(new Set(processedCaptureIds));
          setIsProcessingCapture(false);
        }
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setIsProcessingCapture(false);
    }
  }, [isProcessingCapture, processedCaptureIds, createNodeFromCapture, nodes]);

  const clearCapturedItems = useCallback(async () => {
    try {
      const response = await fetch('/api/capture', { method: 'DELETE' });
      if (response.ok) setCapturedItems([]);
    } catch (error) {}
  }, []);

  React.useEffect(() => {
    const initialTimeout = setTimeout(() => fetchCapturedItems(), 1000);
    const interval = setInterval(fetchCapturedItems, 2000);
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [fetchCapturedItems]);

  const loadLastProjectFromStorage = () => {
    try {
      const projectData = loadLastProjectUtil();
      if (projectData) {
        const nodesWithCallbacks = projectData.nodes.map(n => addNodeCallbacks(n, updateNode, setNodeAsRoot, deleteNode));
        setNodes(nodesWithCallbacks);
        setEdges(projectData.edges);
        setProjectName(projectData.name);
        setOutputContent(projectData.outputContent || '');
        setOutputHistory(projectData.outputHistory || []);
        setRootNodeId(projectData.rootNodeId || null);
      }
    } catch (error) {
      console.error('Error loading last project:', error);
    }
  };

  const saveProject = (name = projectName, silent = false) => {
    try {
      const result = saveProjectToStorage(name, nodes, edges, outputContent, outputHistory, rootNodeId);
      setSavedProjects(loadProjectsListUtil());
      setLastSaved(result.timestamp);
      if (!silent) toast.success(`Project "${name}" saved`);
    } catch (error) {
      toast.error('Failed to save project');
    }
  };

  const loadProject = (name) => {
    try {
      const projectData = loadProjectFromStorage(name);
      if (projectData) {
        const nodesWithCallbacks = projectData.nodes.map(n => addNodeCallbacks(n, updateNode, setNodeAsRoot, deleteNode));
        setNodes(nodesWithCallbacks);
        setEdges(projectData.edges);
        setProjectName(name);
        setOutputContent(projectData.outputContent || '');
        setOutputHistory(projectData.outputHistory || []);
        setRootNodeId(projectData.rootNodeId || null);
        setShowProjectMenu(false);
        localStorage.setItem('mindcraft_last_project', name);
        toast.success(`Project "${name}" loaded`);
      }
    } catch (error) {
      toast.error('Failed to load project');
    }
  };

  const deleteProject = (name) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      const updated = deleteProjectFromStorage(name);
      setSavedProjects(updated);
    } catch (error) {}
  };

  const newProject = () => {
    if (nodes.length > 0 || edges.length > 0) {
      if (!confirm('Create new project? Unsaved changes will be lost.')) return;
    }
    setNodes([]);
    setEdges([]);
    setProjectName('Untitled Project');
    setOutputContent('');
    setRootNodeId(null);
    setOutputHistory([]);
    setMergeMode(false);
    setSelectedNodesForMerge(new Set());
    localStorage.removeItem('mindcraft_last_project');
    toast.info('New project created');
  };

  const exportProject = () => {
    exportProjectAsJSON(projectName, nodes, edges, outputContent, outputHistory, rootNodeId);
  };

  const importProject = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const projectData = JSON.parse(e.target?.result);
        const nodesWithCallbacks = (projectData.nodes || []).map(n => addNodeCallbacks(n, updateNode, setNodeAsRoot, deleteNode));
        setNodes(nodesWithCallbacks);
        setEdges(projectData.edges || []);
        setProjectName(projectData.name || 'Imported Project');
        setOutputContent(projectData.outputContent || '');
        setOutputHistory(projectData.outputHistory || []);
        setRootNodeId(projectData.rootNodeId || null);
        toast.success('Project imported');
      } catch (error) {
        toast.error('Failed to import project');
      }
    };
    reader.readAsText(file);
  };

  const loadDemo = (templateId) => {
    const demoData = loadDemoTemplate(templateId, updateNode, setNodeAsRoot, deleteNode);
    if (demoData) {
      setNodes(demoData.nodes);
      setEdges(demoData.edges);
      setProjectName(demoData.name);
      setOutputContent('');
      setOutputHistory([]);
      setRootNodeId(demoData.rootNodeId);
      setShowDemoMenu(false);
      toast.success(`Loaded: ${demoData.name}`);
    }
  };

  const generateWithPromptAPI = async () => {
    if (aiCapabilities.prompt === 'no') {
      toast.error('Prompt API not available');
      return;
    }
    setIsGenerating(true);
    try {
      if (aiCapabilities.prompt === 'after-download') setDownloadProgress(0);
      const session = await LanguageModel.create({
        systemPrompt: `You are an expert writer and researcher who creates thoughtful, well-structured articles and essays.

CRITICAL INSTRUCTIONS:
1. Follow the EXACT order of information presented in the Main Narrative section
   - The content flows in a deliberate sequence
   - Present information in the order given - do not reorganize

2. Writing Quality:
   - Write sophisticated, engaging prose suitable for publication
   - Use varied sentence structure and eloquent language
   - Create smooth transitions between topics
   - Sound authoritative and well-researched
   - Match the tone of a thoughtful magazine article or essay

3. Content Handling:
   - Include ALL content comprehensively
   - Supporting References should be woven in naturally where contextually relevant
   - When you see [Visual Element: "title"], use the title and surrounding context to infer what the image depicts, then describe it naturally as if you're viewing it
   - For example: [Visual Element: "Humpback whale breaching"] becomes "The humpback whale, captured mid-breach, demonstrates the spectacular acrobatic abilities..."
   - Integrate all information seamlessly into a cohesive narrative

4. Output Format:
   - Remove ALL structural markers from your output (===, "Describe:", ---, etc.)
   - Write as clean, flowing prose
   - No meta-commentary about structure
   - Professional article/essay format

Think of yourself as writing for a prestigious magazine. The content order is your outline - follow it exactly while making the writing compelling and sophisticated.`,
        monitor(m) {
          m.addEventListener('downloadprogress', (e) => {
            setDownloadProgress(Math.round(e.loaded * 100));
          });
        }
      });
      setDownloadProgress(null);
      const context = buildPromptContextUtil(nodes, edges);
      const truncatedContext = context.length > 4000 ? context.substring(0, 4000) + '...\n[Context truncated - ensure all mentioned information is included in the order presented]' : context;
      const prompt = `${truncatedContext}\n\nProvide a comprehensive synthesis that follows the exact order of the sections above:`;
      const result = await session.prompt(prompt);
      setOutputContent(result);
      const newOutput = { id: crypto.randomUUID(), content: result, timestamp: new Date().toISOString(), mode: 'prompt' };
      setOutputHistory(prev => [newOutput, ...prev]);
      setSelectedOutputIndex(0);
      session.destroy();
      checkAICapabilities();
    } catch (error) {
      setOutputContent(`Error: ${error.message}`);
      setDownloadProgress(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateWithSummarizer = async () => {
    if (aiCapabilities.summarizer !== 'available') {
      toast.error('Summarizer not available');
      return;
    }
    setIsGenerating(true);
    try {
      const summarizer = await Summarizer.create();
      const summary = await summarizer.summarize(buildPromptContextUtil(nodes, edges));
      setOutputContent(summary);
      const newOutput = { id: crypto.randomUUID(), content: summary, timestamp: new Date().toISOString(), mode: 'summarize' };
      setOutputHistory(prev => [newOutput, ...prev]);
      setSelectedOutputIndex(0);
      summarizer.destroy();
    } catch (error) {
      setOutputContent(`Error: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateWithWriter = async () => {
    if (aiCapabilities.writer !== 'available') {
      toast.error('Writer not available');
      return;
    }
    setIsGenerating(true);
    try {
      const writer = await Writer.create({ tone: 'formal', format: 'plain-text', length: 'long' });
      const result = await writer.write(`Create document: ${buildPromptContextUtil(nodes, edges)}`);
      setOutputContent(result);
      const newOutput = { id: crypto.randomUUID(), content: result, timestamp: new Date().toISOString(), mode: 'write' };
      setOutputHistory(prev => [newOutput, ...prev]);
      setSelectedOutputIndex(0);
      writer.destroy();
    } catch (error) {
      setOutputContent(`Error: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateOutput = () => {
    if (nodes.length === 0) {
      toast.warning('Please add nodes first');
      return;
    }
    if (isGenerating) return;
    setOutputContent('__GENERATING__');
    const actions = { prompt: generateWithPromptAPI, summarize: generateWithSummarizer, write: generateWithWriter };
    (actions[outputMode] || generateWithPromptAPI)();
  };

  const addNode = useCallback(() => {
    const id = (nodes.length + 1).toString();
    const newNode = createNewNode(id, findEmptyPosition(), updateNode, setNodeAsRoot, deleteNode);
    setNodes((nds) => [...nds, newNode]);
  }, [nodes, updateNode, findEmptyPosition, setNodeAsRoot, deleteNode]);

  const copyOutputToClipboard = useCallback(() => {
    if (!outputContent || outputContent === '__GENERATING__') {
      toast.warning('No output to copy');
      return;
    }
    
    navigator.clipboard.writeText(outputContent)
      .then(() => {
        toast.success('Output copied to clipboard!');
      })
      .catch(() => {
        toast.error('Failed to copy output');
      });
  }, [outputContent, toast]);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), []);

  const deleteOutput = useCallback((indexToDelete) => {
    setOutputHistory(prev => prev.filter((_, index) => index !== indexToDelete));
    if (selectedOutputIndex === indexToDelete) {
      setOutputContent('');
      setSelectedOutputIndex(null);
    } else if (selectedOutputIndex > indexToDelete) {
      setSelectedOutputIndex(prev => prev - 1);
    }
  }, [selectedOutputIndex]);

  const enterMergeMode = useCallback(() => {
    setMergeMode(true);
    setSelectedNodesForMerge(new Set());
  }, []);

  const exitMergeMode = useCallback(() => {
    setMergeMode(false);
    setSelectedNodesForMerge(new Set());
  }, []);

  const toggleNodeForMerge = useCallback((nodeId) => {
    setSelectedNodesForMerge(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  const mergeSelectedNodes = useCallback(async () => {
    if (selectedNodesForMerge.size < 2) {
      toast.error('Select at least 2 nodes to merge');
      return;
    }

    try {
      const nodesToMerge = nodes.filter(n => selectedNodesForMerge.has(n.id));
      
      if (nodesToMerge.length < 2) {
        toast.error('Could not find selected nodes');
        return;
      }

      const mergedContent = nodesToMerge.map(n => n.data.content).join('\n\n---\n\n');
      const mergedTitle = `Merged: ${nodesToMerge[0].data.title}`;
      const avgWeight = Math.round(
        nodesToMerge.reduce((sum, n) => sum + (n.data.weight || 5), 0) / nodesToMerge.length
      );

      const avgX = nodesToMerge.reduce((sum, n) => sum + (n.position?.x || 0), 0) / nodesToMerge.length;
      const avgY = nodesToMerge.reduce((sum, n) => sum + (n.position?.y || 0), 0) / nodesToMerge.length;

      const mergedNodeId = `merged-${Date.now()}`;
      const mergedNode = {
        id: mergedNodeId,
        type: 'promptNode',
        position: { x: avgX, y: avgY },
        style: { width: 220, height: 160 },
        data: {
          id: mergedNodeId,
          title: mergedTitle,
          content: mergedContent,
          weight: avgWeight,
          isRoot: false,
          isSkipped: false,
          isSelectedForMerge: false,
          onChange: updateNode,
          onSetAsRoot: setNodeAsRoot,
          onDelete: deleteNode
        }
      };

      const nodeIdsToRemove = Array.from(selectedNodesForMerge);
      setNodes(currentNodes => [
        ...currentNodes.filter(n => !nodeIdsToRemove.includes(n.id)),
        mergedNode
      ]);
      setEdges(currentEdges => currentEdges.filter(e => 
        !nodeIdsToRemove.includes(e.source) && !nodeIdsToRemove.includes(e.target)
      ));

      exitMergeMode();
      
      toast.success(`Merged ${selectedNodesForMerge.size} nodes!`);
    } catch (error) {
      console.error('Merge error:', error);
      toast.error('Failed to merge nodes');
    }
  }, [selectedNodesForMerge, nodes, updateNode, setNodeAsRoot, deleteNode, toast]);

  return (
    <div className="flex h-screen w-full bg-white">
      <div className={`${sidebarExpanded ? 'w-64' : 'w-16'} transition-all duration-200 border-r border-gray-200 bg-white flex flex-col`}>
        <div className="h-16 border-b border-gray-200 flex items-center justify-center px-3">
          {sidebarExpanded ? (
            <div className="flex items-center justify-between w-full">
              <span className="font-semibold text-gray-800">Mind-Craft</span>
              <button onClick={() => { setSidebarExpanded(false); setShowProjectMenu(false); }}
                className="p-1.5 hover:bg-gray-100 rounded">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </div>
          ) : (
            <button onClick={() => setSidebarExpanded(true)} className="p-1.5 hover:bg-gray-100 rounded">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
        <div className="p-2 border-b border-gray-200 space-y-1">
          <button onClick={newProject} className={`w-full flex items-center ${sidebarExpanded ? 'gap-3 px-3' : 'justify-center px-0'} py-2 hover:bg-gray-100 rounded text-gray-700 text-sm`} title="New Project">
            {!sidebarExpanded && <span className="text-base">+</span>}
            {sidebarExpanded && <span>New Project</span>}
          </button>
          <button onClick={() => saveProject()} className={`w-full flex items-center ${sidebarExpanded ? 'gap-3 px-3' : 'justify-center px-0'} py-2 hover:bg-gray-100 rounded text-gray-700 text-sm`} title="Save">
            {!sidebarExpanded && <span className="text-base">💾</span>}
            {sidebarExpanded && <span>Save</span>}
          </button>
          <button onClick={() => {
              if (!sidebarExpanded) { setSidebarExpanded(true); setTimeout(() => setShowProjectMenu(true), 100); }
              else setShowProjectMenu(!showProjectMenu);
            }} className={`w-full flex items-center ${sidebarExpanded ? 'gap-3 px-3' : 'justify-center px-0'} py-2 hover:bg-gray-100 rounded text-gray-700 text-sm`} title="Projects">
            {!sidebarExpanded && <span className="text-base">📁</span>}
            {sidebarExpanded && <span>Projects</span>}
          </button>
          <button onClick={() => {
              if (!sidebarExpanded) { setSidebarExpanded(true); setTimeout(() => setShowDemoMenu(true), 100); }
              else setShowDemoMenu(!showDemoMenu);
            }} className={`w-full flex items-center ${sidebarExpanded ? 'gap-3 px-3' : 'justify-center px-0'} py-2 hover:bg-gray-100 rounded text-gray-700 text-sm`} title="Load Demo">
            {!sidebarExpanded && <span className="text-base">★</span>}
            {sidebarExpanded && <span>Load Demo</span>}
          </button>
        </div>
        {sidebarExpanded && (<>
          {showProjectMenu && (
            <div className="p-3 border-b border-gray-200">
              <div className="flex gap-2 mb-3">
                <button onClick={exportProject} className="flex-1 px-2 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 text-xs">Export</button>
                <label className="flex-1 px-2 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 text-xs text-center cursor-pointer">
                  Import<input type="file" accept=".json" onChange={importProject} className="hidden" />
                </label>
              </div>
              <div className="max-h-64 overflow-y-auto bg-gray-50 rounded">
                {savedProjects.length === 0 ? (<div className="p-3 text-sm text-gray-500">No saved projects</div>) : (
                  savedProjects.map((project) => (
                    <div key={project.name} className="p-2 border-b border-gray-200 hover:bg-gray-100 group">
                      <div className="flex justify-between items-center">
                        <button onClick={() => loadProject(project.name)} className="flex-1 text-left">
                          <div className="text-xs font-semibold truncate text-gray-800">{project.name}</div>
                          <div className="text-xs text-gray-500">{new Date(project.timestamp).toLocaleString()}</div>
                        </button>
                        <button onClick={() => deleteProject(project.name)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-red-600">×</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          {showDemoMenu && (
            <div className="p-3 border-b border-gray-200">
              <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Example Projects</div>
              <div className="space-y-2">
                {demoTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => {
                      if (nodes.length > 0 && !confirm('Load demo? Current project will be replaced.')) return;
                      loadDemo(template.id);
                    }}
                    className="w-full text-left p-2 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    <div className="text-xs font-semibold text-gray-800">{template.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{template.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex-1 overflow-y-auto p-3">
            <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">History</div>
            {outputHistory.length === 0 ? (<div className="text-xs text-gray-500">No outputs yet</div>) : (
              <div className="space-y-1">
                {outputHistory.map((output, index) => (
                  <div key={output.id} className={`group relative rounded ${selectedOutputIndex === index ? 'bg-gray-100' : 'hover:bg-gray-50'}`}>
                    <button onClick={() => { setOutputContent(output.content); setSelectedOutputIndex(index); }}
                      className="w-full text-left p-2 pr-8 text-xs">
                      <div className="flex items-center gap-2 mb-1"><span className="font-medium text-gray-700">{output.mode}</span></div>
                      <div className="text-gray-600">{getOutputTitleUtil(output.content)}</div>
                      <div className="text-gray-400 text-xs mt-1">{new Date(output.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); deleteOutput(index); }}
                      className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-gray-200 rounded text-gray-500 hover:text-red-600">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {capturedItems.length > 0 && (
            <div className="border-t border-gray-200 p-3 max-h-48 overflow-y-auto">
              <div className="flex justify-between items-center mb-2">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Captured</div>
                <button className="text-xs text-gray-500 hover:text-gray-700" onClick={clearCapturedItems}>Clear</button>
              </div>
              <div className="space-y-1">
                {capturedItems.map((item) => (
                  <button key={item.id} onClick={() => createNodeFromCapture(item, false)}
                    className="w-full text-left p-2 hover:bg-gray-50 rounded text-xs text-gray-600">
                    <div className="font-medium text-gray-700 mb-1">{item.type}</div>
                    <div className="line-clamp-2">{item.content}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="border-t border-gray-200 p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">{lastSaved ? `Saved ${lastSaved.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : 'Not saved'}</span>
              <div className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${aiCapabilities.prompt === 'available' ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                <span className="text-gray-500">AI</span>
              </div>
            </div>
          </div>
        </>)}
      </div>
      <div className="flex-1 flex flex-col bg-gray-50">
        <div className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6">
          <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)}
            onBlur={() => saveProject(projectName, true)}
            className="px-3 py-2 border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 outline-none text-xl font-semibold text-gray-900"
            placeholder="Untitled Project" style={{ width: '400px' }} />
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-500">{nodes.length} {nodes.length === 1 ? 'node' : 'nodes'}</div>
            <select value={outputMode} onChange={(e) => setOutputMode(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded text-gray-700 bg-white">
              <option value="prompt">Generate</option>
              <option value="summarize" disabled={aiCapabilities.summarizer !== 'available'}>Summarize</option>
              <option value="write" disabled={aiCapabilities.writer !== 'available'}>Write</option>
            </select>
            <button onClick={generateOutput} disabled={isGenerating || nodes.length === 0 || aiCapabilities.prompt === 'no'}
              className="px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 text-sm font-medium">
              {isGenerating ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </div>
        <div className="flex-1 flex overflow-hidden relative">
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
            <button onClick={addNode} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg text-sm font-medium">
              + Add Node
            </button>
            {!mergeMode ? (
              <button
                onClick={enterMergeMode}
                disabled={nodes.length < 2}
                className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-sm font-medium"
              >
                Merge Nodes
              </button>
            ) : (
              <>
                <div className="px-3 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium shadow-lg">
                  {selectedNodesForMerge.size} selected
                </div>
                <button
                  onClick={mergeSelectedNodes}
                  disabled={selectedNodesForMerge.size < 2}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 shadow-lg text-sm font-medium"
                >
                  Merge Selected
                </button>
                <button
                  onClick={exitMergeMode}
                  className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 shadow-lg text-sm font-medium"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
          <div className={`${outputContent && outputContent !== '__GENERATING__' ? 'w-1/2' : outputContent === '__GENERATING__' || isGenerating ? 'w-1/2' : 'w-full'} transition-all duration-300`}>
            <ReactFlow 
              nodes={nodes} 
              edges={edges} 
              onNodesChange={onNodesChange} 
              onEdgesChange={onEdgesChange}
              onConnect={onConnect} 
              nodeTypes={nodeTypes}
              onNodeClick={mergeMode ? (event, node) => {
                event.stopPropagation();
                toggleNodeForMerge(node.id);
              } : undefined}
              defaultEdgeOptions={{ type: 'smoothstep', style: { stroke: '#94a3b8', strokeWidth: 3 } }}
              connectionLineStyle={{ stroke: '#60a5fa', strokeWidth: 3 }} 
              connectionLineType="smoothstep"
              snapToGrid={true} 
              snapGrid={[15, 15]} 
              fitView>
              <Background />
            </ReactFlow>
          </div>
          {(outputContent || isGenerating) && (
            <div className="w-1/2 border-l border-gray-200 bg-white flex flex-col">
              <div className="h-14 border-b border-gray-200 flex justify-between items-center px-6">
                <h3 className="font-medium text-gray-800">Output</h3>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={copyOutputToClipboard}
                    disabled={!outputContent || outputContent === '__GENERATING__' || isGenerating}
                    className="px-3 py-1.5 text-sm bg-white text-gray-700 border border-gray-300 rounded hover:bg-gray-50 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                  >
                    Copy
                  </button>
                  <button onClick={() => { setOutputContent(''); setIsGenerating(false); }}
                    className="text-gray-500 hover:text-gray-700 text-xl" disabled={isGenerating}>×</button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {downloadProgress !== null ? (
                  <div>
                    <div className="text-sm mb-3 text-gray-600">Downloading: {downloadProgress}%</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gray-800 h-2 rounded-full" style={{ width: `${downloadProgress}%` }}></div>
                    </div>
                  </div>
                ) : isGenerating || outputContent === '__GENERATING__' ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mb-4"></div>
                    <div className="text-sm text-gray-600">Generating...</div>
                    <div className="text-xs text-gray-500 mt-2">10-30 seconds</div>
                  </div>
                ) : outputContent ? (
                  <div className="prose prose-sm max-w-none text-gray-700">
                    <ReactMarkdown components={{
                      h1: ({node, ...props}) => <h1 className="text-2xl font-bold mt-6 mb-4 text-gray-900" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-xl font-semibold mt-5 mb-3 text-gray-900" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-lg font-semibold mt-4 mb-2 text-gray-900" {...props} />,
                      p: ({node, ...props}) => <p className="mb-4 leading-relaxed" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4 space-y-2" {...props} />,
                      code: ({node, inline, ...props}) => inline ? <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono" {...props} /> :
                        <code className="block bg-gray-100 p-3 rounded my-2 overflow-x-auto text-sm font-mono" {...props} />,
                    }}>{outputContent}</ReactMarkdown>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}