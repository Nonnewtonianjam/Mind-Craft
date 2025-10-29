// Capture and node positioning utilities

// Generate title from content
export function generateTitleFromContent(content, type) {
  if (!content) return 'Untitled';
  
  if (type === 'image') {
    try {
      const url = new URL(content);
      const filename = url.pathname.split('/').pop();
      return filename.split('.')[0].substring(0, 35) || 'Image';
    } catch {
      return 'Image';
    }
  } else if (type === 'text') {
    const words = content.split(/\s+/).slice(0, 4);
    return words.join(' ').substring(0, 35) || 'Text';
  } else if (type === 'link') {
    const words = content.split(/\s+/).slice(0, 4);
    return words.join(' ').substring(0, 35) || 'Link';
  }
  
  return 'Note';
}

// Find empty position in grid (searches left to right, top to bottom)
export function findEmptyPositionInGrid(nodes, startX, startY, cols, rows, nodeWidth, nodeHeight, padding) {
  const occupiedPositions = nodes.map(node => ({
    x: node.position?.x || 0,
    y: node.position?.y || 0,
    width: node.style?.width || nodeWidth,
    height: node.style?.height || nodeHeight
  }));
  
  const hasOverlap = (x, y) => {
    return occupiedPositions.some(occ => {
      return (
        x < occ.x + occ.width + padding &&
        x + nodeWidth + padding > occ.x &&
        y < occ.y + occ.height + padding &&
        y + nodeHeight + padding > occ.y
      );
    });
  };
  
  // Search each row completely before moving to next row
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = startX + col * (nodeWidth + padding);
      const y = startY + row * (nodeHeight + padding);
      
      if (!hasOverlap(x, y)) {
        return { x, y };
      }
    }
  }
  
  return null;
}

// Find position in spiral pattern from center
export function findPositionInSpiral(centerX, centerY, nodeWidth, nodeHeight, padding, nodes, startX, maxX, startY, maxY) {
  const occupiedPositions = nodes.map(node => ({
    x: node.position?.x || 0,
    y: node.position?.y || 0,
    width: node.style?.width || nodeWidth,
    height: node.style?.height || nodeHeight
  }));
  
  const hasOverlap = (x, y) => {
    return occupiedPositions.some(occ => {
      return (
        x < occ.x + occ.width + padding &&
        x + nodeWidth + padding > occ.x &&
        y < occ.y + occ.height + padding &&
        y + nodeHeight + padding > occ.y
      );
    });
  };
  
  for (let radius = 0; radius < 10; radius++) {
    const offset = radius * (nodeWidth + padding);
    const positions = [
      { x: centerX + offset, y: centerY },
      { x: centerX - offset, y: centerY },
      { x: centerX, y: centerY + offset },
      { x: centerX, y: centerY - offset },
      { x: centerX + offset, y: centerY + offset },
      { x: centerX - offset, y: centerY - offset },
      { x: centerX + offset, y: centerY - offset },
      { x: centerX - offset, y: centerY + offset }
    ];
    
    for (const pos of positions) {
      if (pos.x >= startX && pos.x + nodeWidth <= maxX && 
          pos.y >= startY && pos.y + nodeHeight <= maxY &&
          !hasOverlap(pos.x, pos.y)) {
        return pos;
      }
    }
  }
  
  return null;
}