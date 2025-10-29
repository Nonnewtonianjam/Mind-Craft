'use client';

import React, { useState, useEffect } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import { getWeightColor, getBorderWidth, handleStyles, PriorityBar, NodeMenu } from '../utils/nodeHelpers';

export default function PromptNode({ data, selected }) {
  const [title, setTitle] = useState(data?.title || '');
  const [content, setContent] = useState(data?.content || '');
  const [weight, setWeight] = useState(data?.weight || 5);
  const [showMenu, setShowMenu] = useState(false);
  const [isSkipped, setIsSkipped] = useState(data?.isSkipped || false);

  useEffect(() => {
    setTitle(data?.title || '');
    setContent(data?.content || '');
    setWeight(data?.weight || 5);
    setIsSkipped(data?.isSkipped || false);
  }, [data?.title, data?.content, data?.weight, data?.isSkipped]);

  if (!data) return null;

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    data.onChange?.(data.id, { title: newTitle });
  };

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
    data.onChange?.(data.id, { content: newContent });
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
  const isSelectedForMerge = data?.isSelectedForMerge || false;
  
  // Root node - always expanded, distinctive styling
  if (data.isRoot) {
    return (
      <div
        className="rounded-xl p-4 shadow-2xl relative h-full w-full"
        style={{ 
          border: '4px solid #2563eb',
          background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
          opacity: nodeOpacity,
          minWidth: '280px',
          minHeight: '200px',
          boxShadow: isSelectedForMerge ? '0 0 0 4px #10b981' : '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}
      >
        <NodeResizer 
          color="#2563eb" 
          isVisible={selected}
          minWidth={280}
          minHeight={200}
        />
        
        <Handle 
          type="target" 
          position={Position.Top}
          style={{ 
            width: '16px', 
            height: '16px', 
            background: '#2563eb',
            border: '3px solid white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
        />
        <Handle 
          type="source" 
          position={Position.Bottom}
          style={{ 
            width: '16px', 
            height: '16px', 
            background: '#2563eb',
            border: '3px solid white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
        />
        
        <div className="flex items-start justify-between mb-3">
          <div className="px-2 py-1 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider rounded">
            Project Root
          </div>
          <div className="relative">
            <button
              className="p-1 hover:bg-blue-100 rounded text-sm text-blue-700"
              onClick={() => setShowMenu(!showMenu)}
            >
              ⋮
            </button>
            {showMenu && (
              <div className="absolute right-0 top-6 bg-white border border-gray-300 rounded shadow-lg z-50 w-36">
                <button
                  className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 text-red-600"
                  onClick={handleDelete}
                >
                  Delete Node
                </button>
              </div>
            )}
          </div>
        </div>
        
        <input
          className="font-bold w-full mb-3 px-2 py-1 bg-white bg-opacity-60 text-base text-gray-900 border-b-2 border-blue-400 rounded-t"
          value={title}
          onChange={handleTitleChange}
          placeholder="Project premise"
        />
        
        <textarea
          className="w-full border-2 border-blue-200 rounded p-2 text-sm bg-white bg-opacity-60 resize-none font-medium text-gray-800"
          value={content}
          onChange={handleContentChange}
          placeholder="Describe your project goal..."
          style={{ height: 'calc(100% - 100px)' }}
        />
      </div>
    );
  }

  // Regular node - always expanded, resizable
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
        minWidth: '220px',
        minHeight: '160px',
        maxWidth: '500px',
        background: isSelectedForMerge ? '#eff6ff' : 'white',
        boxShadow: isSelectedForMerge ? '0 0 0 3px #2563eb' : undefined
      }}
    >
      <NodeResizer 
        color={borderColor}
        isVisible={selected}
        minWidth={220}
        minHeight={160}
        maxWidth={500}
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
      
      <div className="flex items-center gap-1 mb-1.5">
        <input
          className="font-semibold flex-1 px-1 bg-transparent text-sm text-gray-800 min-w-0"
          value={title}
          onChange={handleTitleChange}
          placeholder="Node title"
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
        <div className="text-xs text-gray-500 italic mb-1.5">Skipped</div>
      )}
      
      <div className="flex flex-col space-y-2" style={{ height: 'calc(100% - 45px)' }}>
        <textarea
          className="flex-1 w-full border border-gray-200 rounded p-1.5 text-xs bg-transparent resize-none"
          value={content}
          onChange={handleContentChange}
          placeholder="Enter content..."
        />
        
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-xs text-gray-500 flex-shrink-0">Priority</span>
          <div className="flex-1 flex gap-0.5" style={{ maxWidth: '140px' }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
              <button
                key={level}
                onClick={() => handleWeightClick(level)}
                className="flex-1 h-3 rounded-sm transition-all hover:opacity-80"
                style={{
                  backgroundColor: level <= weight ? getWeightColor(level) : '#f3f4f6',
                  cursor: 'pointer',
                  minWidth: '11px'
                }}
                title={`Priority ${level}`}
              />
            ))}
          </div>
          <span className="text-xs font-medium text-gray-700 flex-shrink-0" style={{ width: '16px', textAlign: 'right' }}>{weight}</span>
        </div>
      </div>
    </div>
  );
}