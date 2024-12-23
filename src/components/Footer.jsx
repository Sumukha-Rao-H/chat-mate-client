import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-6">
      <div className="container mx-auto flex flex-col lg:flex-row justify-between items-center">
        {/* Copyright text */}
        <div className="text-sm text-center lg:text-left mb-4 lg:mb-0">
          &copy; {new Date().getFullYear()} ChatMate. All rights reserved.
        </div>
        
        {/* Footer links */}
        <div className="flex space-x-4 pr-4 justify-center lg:justify-end">
          <p className="text-sm hover:text-gray-400 cursor-pointer">Privacy Policy</p>
          <p className="text-sm hover:text-gray-400 cursor-pointer">Terms of Service</p>
          <p className="text-sm hover:text-gray-400 cursor-pointer">Contact</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

