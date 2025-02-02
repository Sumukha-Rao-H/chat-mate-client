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
      className={`fixed bottom-4 right-4 bg-gray-600 text-white shadow-md rounded-md p-4 flex items-center space-x-2 transition-opacity duration-500 ease-out z-50 ${
        !isVisible ? "opacity-0 invisible" : "opacity-100 visible"
      }`}
    >
      <div className="flex flex-col">
        <span className="font-semibold">{message.title}</span>
        <span className="text-sm">{message.body}</span>
      </div>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 500); // Close the popup after fade-out
        }}
        className="ml-2 text-gray-400 hover:text-gray-200"
      >
        ✕
      </button>
    </div>
  );
};

export default NotificationPopup;
