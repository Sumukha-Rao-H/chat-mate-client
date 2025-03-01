import React, { useEffect, useState } from "react";

const NotificationPopup = ({ message, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Automatically dismiss the notification after 2 seconds
    const timer = setTimeout(() => {
      setIsVisible(false); // Start fading out
      setTimeout(() => {
        onClose(); // Close the popup completely after fade-out
      }, 500); // Delay before calling onClose to allow fade-out transition
    }, 2000);

    return () => clearTimeout(timer); // Cleanup timer
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-6 right-6 bg-gray-800/80 text-white shadow-lg rounded-xl px-5 py-3 flex items-center space-x-4 transform transition-all duration-500 ease-out z-50 backdrop-fix ${
        !isVisible
          ? "opacity-0 scale-95 translate-y-4 invisible"
          : "opacity-100 scale-100 visible"
      }`}
    >
      <div className="flex flex-col">
        <span className="font-semibold text-lg">{message.title}</span>
        <span className="text-sm text-gray-300">{message.body}</span>
      </div>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 500); // Close after animation
        }}
        className="ml-2 text-gray-400 hover:text-gray-200 transition-all duration-200"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
};

export default NotificationPopup;
