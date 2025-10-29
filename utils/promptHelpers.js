// Prompt building utilities

// Build connection graph from nodes and edges
export function buildConnectionGraph(activeNodes, edges) {
  const nodeConnections = new Map();
  
  activeNodes.forEach(node => {
    nodeConnections.set(node.id, {
      node,
      connectedTo: [],
      connectedFrom: []
    });
  });
  
  edges.forEach(edge => {
    const sourceActive = activeNodes.some(n => n.id === edge.source);
    const targetActive = activeNodes.some(n => n.id === edge.target);
    
    if (sourceActive && targetActive) {
      const sourceData = nodeConnections.get(edge.source);
      const targetData = nodeConnections.get(edge.target);
      
      if (sourceData) sourceData.connectedTo.push(edge.target);
      if (targetData) targetData.connectedFrom.push(edge.source);
    }
  });
  
  return nodeConnections;
}

// Separate nodes into connected and isolated
export function separateNodesByConnections(activeNodes, edges) {
  const connectedNodeIds = new Set();
  
  edges.forEach(edge => {
    const sourceActive = activeNodes.some(n => n.id === edge.source);
    const targetActive = activeNodes.some(n => n.id === edge.target);
    if (sourceActive && targetActive) {
      connectedNodeIds.add(edge.source);
      connectedNodeIds.add(edge.target);
    }
  });
  
  const rootNode = activeNodes.find(n => n.data.isRoot);
  const connectedNodes = activeNodes.filter(n => !n.data.isRoot && connectedNodeIds.has(n.id));
  const isolatedNodes = activeNodes.filter(n => !n.data.isRoot && !connectedNodeIds.has(n.id));
  
  return { rootNode, connectedNodes, isolatedNodes };
}

// Format isolated nodes as global references
export function formatIsolatedNodes(isolatedNodes) {
  let context = '';
  
  if (isolatedNodes.length === 0) return context;
  
  context += '=== SUPPORTING REFERENCES ===\n';
  context += '(Weave these points naturally into your narrative where relevant)\n\n';
  
  isolatedNodes.sort((a, b) => (b.data.weight || 5) - (a.data.weight || 5));
  
  isolatedNodes.forEach((node) => {
    const isImage = node.type === 'imageNode' || node.data.captureType === 'image';
    
    if (isImage) {
      // Provide context about the image for the AI to reference
      context += `Reference this visual element: "${node.data.title}". Describe what this likely depicts and its relevance to the topic.\n\n`;
    } else {
      context += `${node.data.content}\n\n`;
    }
  });
  
  return context;
}

// Format connected nodes following flow from root
export function formatConnectedNodes(connectedNodes, nodeConnections, activeNodes, rootNode) {
  let context = '';
  
  if (connectedNodes.length === 0) return context;
  
  context += '=== MAIN NARRATIVE ===\n';
  context += '(Follow this sequence in your output)\n\n';
  
  const processedNodes = new Set();
  
  // Recursive function to process node and its connections in order
  const processNode = (node) => {
    if (!node || processedNodes.has(node.id)) return;
    processedNodes.add(node.id);
    
    const isImage = node.type === 'imageNode' || node.data.captureType === 'image';
    
    if (isImage) {
      // For images, just note what should be described
      context += `Describe: ${node.data.title}\n\n`;
    } else {
      // Just add content, no markers
      context += `${node.data.content}\n\n`;
    }
    
    // Follow connections in order
    const connections = nodeConnections.get(node.id);
    if (connections && connections.connectedTo.length > 0) {
      connections.connectedTo.forEach(nextId => {
        const nextNode = activeNodes.find(n => n.id === nextId);
        if (nextNode) {
          processNode(nextNode);
        }
      });
    }
  };
  
  // Start from root node if it has outgoing connections
  if (rootNode) {
    const rootConnections = nodeConnections.get(rootNode.id);
    if (rootConnections && rootConnections.connectedTo.length > 0) {
      rootConnections.connectedTo.forEach(nodeId => {
        const node = activeNodes.find(n => n.id === nodeId);
        if (node) {
          processNode(node);
        }
      });
    }
  }
  
  // Process any remaining connected nodes
  connectedNodes.forEach(node => {
    if (!processedNodes.has(node.id)) {
      processNode(node);
    }
  });
  
  return context;
}

// Build complete prompt context
export function buildPromptContext(nodes, edges) {
  if (nodes.length === 0) return '';
  
  const activeNodes = nodes.filter(n => !n.data.isSkipped);
  if (activeNodes.length === 0) return 'No active nodes.';
  
  let context = '';
  
  // 1. ROOT NODE
  const { rootNode, connectedNodes, isolatedNodes } = separateNodesByConnections(activeNodes, edges);
  
  if (rootNode) {
    context += '=== PROJECT PREMISE ===\n';
    context += `${rootNode.data.content}\n\n`;
  }
  
  // 2. Build connection graph
  const nodeConnections = buildConnectionGraph(activeNodes, edges);
  
  // 3. ISOLATED NODES - Global references
  context += formatIsolatedNodes(isolatedNodes);
  
  // 4. CONNECTED NODES - Main flow
  context += formatConnectedNodes(connectedNodes, nodeConnections, activeNodes, rootNode);
  
  // 5. SYNTHESIS GUIDANCE
  context += '\n=== INSTRUCTIONS ===\n';
  context += 'Write a thoughtful, well-structured article that:\n';
  context += '- Follows the order presented in Main Narrative and Supporting References\n';
  context += '- Uses sophisticated, engaging prose appropriate for publication\n';
  context += '- Naturally describes any images mentioned (starting with "Describe:")\n';
  context += '- Creates smooth transitions between topics\n';
  context += '- Removes ALL structural markers (===, "Describe:", etc.) from output\n';
  context += '- Sounds authoritative and well-researched\n';
  
  return context;
}

// Get output title from content
export function getOutputTitle(content) {
  if (!content) return 'Untitled';
  
  let cleaned = content
    .replace(/^#+\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim();
  
  const firstLine = cleaned.split('\n')[0];
  const firstSentence = firstLine.split(/[.!?]/)[0];
  const title = firstSentence.substring(0, 60);
  
  return title.length === 60 ? title + '...' : title;
}