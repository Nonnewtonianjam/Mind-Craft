'use client';

import React, { useState, useEffect } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import { getWeightColor, getBorderWidth, handleStyles, PriorityBar, NodeMenu } from '../utils/nodeHelpers';

export default function ImageNode({ data, selected }) {
  const [title, setTitle] = useState(data?.title || '');
  const [weight, setWeight] = useState(data?.weight || 5);
  const [showMenu, setShowMenu] = useState(false);
  const [isSkipped, setIsSkipped] = useState(data?.isSkipped || false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setTitle(data?.title || '');
    setWeight(data?.weight || 5);
    setIsSkipped(data?.isSkipped || false);
  }, [data?.title, data?.weight, data?.isSkipped]);

  if (!data) return null;

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    data.onChange?.(data.id, { title: newTitle });
  };

  const handleWeightClick = (newWeight) => {
    setWeight(newWeight);
    data.onChange?.(data.id, { weight: newWeight });
  };

  const handleSetAsRoot = () => {
    data.onSetAsRoot?.(data.id);
    setShowMenu(false);
  };

  const handleToggleSkip = () => {
    const newSkipped = !isSkipped;
    setIsSkipped(newSkipped);
    data.onChange?.(data.id, { isSkipped: newSkipped });
    setShowMenu(false);
  };

  const handleDelete = () => {
    data.onDelete?.(data.id);
  };

  const nodeOpacity = isSkipped ? 0.4 : 1;
  const borderWidth = Math.max(3, Math.floor(weight / 1.2));
  const borderColor = getWeightColor(weight);

  return (
    <div
      className="rounded-lg p-2.5 bg-white shadow-md relative h-full w-full"
      style={{ 
        borderWidth: `${borderWidth}px`,
        borderStyle: 'solid',
        borderColor: borderColor,
        opacity: nodeOpacity,
        minWidth: '240px',
        minHeight: '200px',
        maxWidth: '400px'
      }}
    >
      <NodeResizer 
        color={borderColor}
        isVisible={selected}
        minWidth={240}
        minHeight={200}
        maxWidth={400}
      />
      
      <Handle 
        type="target" 
        position={Position.Top}
        style={{ 
          width: '12px', 
          height: '12px', 
          background: '#60a5fa',
          border: '2px solid white'
        }}
      />
      <Handle 
        type="source" 
        position={Position.Bottom}
        style={{ 
          width: '12px', 
          height: '12px', 
          background: '#60a5fa',
          border: '2px solid white'
        }}
      />
      
      <div className="flex items-center gap-1 mb-2">
        <input
          className="font-semibold flex-1 px-1 bg-transparent text-sm text-gray-800 min-w-0"
          value={title}
          onChange={handleTitleChange}
          placeholder="Image title"
        />
        <button
          className="p-1 hover:bg-gray-100 rounded text-sm text-gray-600 flex-shrink-0"
          onClick={() => setShowMenu(!showMenu)}
        >
          ⋮
        </button>
        {showMenu && (
          <div className="absolute right-2 top-8 bg-white border border-gray-300 rounded shadow-lg z-50 w-36">
            <button
              className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 text-gray-700"
              onClick={handleSetAsRoot}
            >
              Set as Root
            </button>
            <button
              className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 text-gray-700"
              onClick={handleToggleSkip}
            >
              {isSkipped ? '✓ Skipped' : 'Skip in Output'}
            </button>
            <button
              className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 text-red-600"
              onClick={handleDelete}
            >
              Delete Node
            </button>
          </div>
        )}
      </div>
      
      {isSkipped && (
        <div className="text-xs text-gray-500 italic mb-2">Skipped</div>
      )}
      
      <div className="flex flex-col space-y-2" style={{ height: 'calc(100% - 55px)' }}>
        <div className="flex-1 border border-gray-200 rounded bg-gray-50 flex items-center justify-center overflow-hidden">
          {imageError ? (
            <div className="text-xs text-gray-500 text-center p-4">
              <div className="mb-1">Image not available</div>
              <div className="text-xs text-gray-400">{data.content}</div>
            </div>
          ) : (
            <img 
              src={data.content} 
              alt={title}
              onError={() => setImageError(true)}
              className="max-w-full max-h-full object-contain"
            />
          )}
        </div>
        
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-xs text-gray-500 flex-shrink-0">Priority</span>
          <div className="flex-1 flex gap-0.5" style={{ maxWidth: '150px' }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
              <button
                key={level}
                onClick={() => handleWeightClick(level)}
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
          <span className="text-xs font-medium text-gray-700 flex-shrink-0 w-6 text-right">{weight}</span>
        </div>
      </div>
    </div>
  );
}