'use client';

import React, { useEffect } from 'react';

export function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          toast={toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

function Toast({ toast, onClose }) {
  useEffect(() => {
    const duration = toast.duration || 3000;
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => {
      clearTimeout(timer);
    };
  }, []); // Empty dependency array - only run once on mount

  const bgColor = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
    warning: 'bg-yellow-50 border-yellow-200'
  }[toast.type] || 'bg-gray-50 border-gray-200';

  const textColor = {
    success: 'text-green-800',
    error: 'text-red-800',
    info: 'text-blue-800',
    warning: 'text-yellow-800'
  }[toast.type] || 'text-gray-800';

  const icon = {
    success: '✓',
    error: '✕',
    info: 'i',
    warning: '⚠'
  }[toast.type] || '';

  return (
    <div
      className={`${bgColor} border rounded-lg shadow-lg p-4 min-w-80 max-w-md animate-slide-in-right`}
      style={{
        animation: 'slideInRight 0.3s ease-out'
      }}
    >
      <div className="flex items-start gap-3">
        {icon && (
          <div className={`${textColor} font-bold text-lg flex-shrink-0`}>
            {icon}
          </div>
        )}
        <div className="flex-1">
          {toast.title && (
            <div className={`${textColor} font-semibold mb-1`}>
              {toast.title}
            </div>
          )}
          <div className={`${textColor} text-sm`}>
            {toast.message}
          </div>
        </div>
        <button
          onClick={onClose}
          className={`${textColor} hover:opacity-70 flex-shrink-0`}
        >
          ×
        </button>
      </div>
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = React.useState([]);

  const addToast = (toast) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, ...toast }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const toast = {
    success: (message, title) => addToast({ type: 'success', message, title }),
    error: (message, title) => addToast({ type: 'error', message, title }),
    info: (message, title) => addToast({ type: 'info', message, title }),
    warning: (message, title) => addToast({ type: 'warning', message, title }),
  };

  return { toasts, removeToast, toast };
}