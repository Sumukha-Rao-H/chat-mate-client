import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-4 mt-12">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-sm">
          &copy; {new Date().getFullYear()} ChatMate. All rights reserved.
        </div>
        <div className="flex space-x-4 pr-4">
          <p className="text-sm hover:text-gray-400">Privacy Policy</p>
          <p className="text-sm hover:text-gray-400">Terms of Service</p>
          <p className="text-sm hover:text-gray-400">Contact</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
