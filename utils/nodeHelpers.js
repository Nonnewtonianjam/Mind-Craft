// Color system for node weights
export function getWeightColor(weight) {
  if (weight <= 3) return '#cbd5e1';
  if (weight <= 6) return '#60a5fa';
  if (weight <= 8) return '#3b82f6';
  return '#1e40af';
}

// Calculate border width based on weight
export function getBorderWidth(weight) {
  return Math.max(3, Math.floor(weight / 1.2)); // 3-8px
}

// Common handle styles
export const handleStyles = {
  regular: {
    width: '12px',
    height: '12px',
    background: '#60a5fa',
    border: '2px solid white'
  },
  root: {
    width: '16px',
    height: '16px',
    background: '#f59e0b',
    border: '3px solid white',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
  }
};

// Priority bar component (reusable)
export function PriorityBar({ weight, onWeightChange }) {
  return (
    <div className="flex items-center gap-1.5 flex-shrink-0">
      <span className="text-xs text-gray-500 flex-shrink-0">Priority</span>
      <div className="flex-1 flex gap-0.5" style={{ maxWidth: '150px' }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
          <button
            key={level}
            onClick={() => onWeightChange(level)}
            className="flex-1 h-3 rounded-sm transition-all hover:opacity-80"
            style={{
              backgroundColor: level <= weight ? getWeightColor(level) : '#f3f4f6',
              cursor: 'pointer',
              minWidth: '12px'
            }}
            title={`Priority ${level}`}
          />
        ))}
      </div>
      <span className="text-xs font-medium text-gray-700 flex-shrink-0 w-6 text-right">
        {weight}
      </span>
    </div>
  );
}

// Node menu component (reusable)
export function NodeMenu({ 
  showMenu, 
  onClose, 
  isRoot, 
  isSkipped, 
  onSetAsRoot, 
  onToggleSkip, 
  onDelete,
  hideSkip = false
}) {
  if (!showMenu) return null;

  return (
    <div className="absolute right-2 top-8 bg-white border border-gray-300 rounded shadow-lg z-50 w-36">
      {!isRoot && onSetAsRoot && (
        <button
          className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 text-gray-700"
          onClick={onSetAsRoot}
        >
          Set as Root
        </button>
      )}
      {!hideSkip && onToggleSkip && (
        <button
          className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 text-gray-700"
          onClick={onToggleSkip}
        >
          {isSkipped ? '✓ Skipped' : 'Skip in Output'}
        </button>
      )}
      <button
        className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 text-red-600"
        onClick={onDelete}
      >
        Delete Node
      </button>
    </div>
  );
}

// Add node callbacks helper
export function addNodeCallbacks(node, updateNode, setNodeAsRoot, deleteNode) {
  return {
    ...node,
    data: {
      ...node.data,
      onChange: updateNode,
      onSetAsRoot: setNodeAsRoot,
      onDelete: deleteNode,
      isSelectedForMerge: false,
      isSelectedForAction: false
    }
  };
}

// Create new node structure
export function createNewNode(id, position, updateNode, setNodeAsRoot, deleteNode, type = 'promptNode') {
  const isImage = type === 'imageNode';
  
  return {
    id,
    type,
    position,
    style: { 
      width: isImage ? 240 : 220, 
      height: isImage ? 200 : 160 
    },
    data: {
      id,
      title: `New Node #${id}`,
      content: '',
      weight: 5,
      isRoot: false,
      isSkipped: false,
      isSelectedForMerge: false,
      isSelectedForAction: false,
      onChange: updateNode,
      onSetAsRoot: setNodeAsRoot,
      onDelete: deleteNode
    }
  };
}