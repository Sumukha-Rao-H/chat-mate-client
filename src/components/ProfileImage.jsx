import React, { useState } from 'react';
import Popup from './PopUpWindow.jsx';

const ProfileImage = ({ imageUrl, onChangeImage }) => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const togglePopup = () => setIsPopupOpen(!isPopupOpen);

  return (
    <div className="flex flex-col items-center">
      {/* Profile Image */}
      <img
        src={imageUrl}
        alt="Profile"
        className="w-32 h-32 rounded-full object-cover cursor-pointer"
        onClick={togglePopup}
      />

      {/* Popup */}
      <Popup isOpen={isPopupOpen} onClose={togglePopup}>
        <div className="flex flex-col items-center">
          {/* Maximized Image */}
          <img
            src={imageUrl}
            alt="Profile Enlarged"
            className="w-full max-w-md rounded-lg mb-4 object-cover"
          />
          {/* Change Image Button */}
          <button
            onClick={() => {
              togglePopup();
              onChangeImage(); // Trigger the image change logic
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            Change Image
          </button>
        </div>
      </Popup>
    </div>
  );
};

export default ProfileImage;
