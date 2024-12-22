import React from 'react';

const Popup = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
    onClick={onClose}>
      <div className="bg-white w-96 rounded-lg shadow-lg p-4 relative">
        {/* Close Button */}
        <button
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
          onClick={onClose}
        >
          &times;
        </button>
        {/* Popup Content */}
        {children}
      </div>
    </div>
  );
};

export default Popup;
