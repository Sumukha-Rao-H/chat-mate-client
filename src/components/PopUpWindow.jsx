import React, { useState } from 'react';
import Buttons, { CloseButton } from './ui/Buttons'; // Assuming Buttons.jsx is in ui folder

const PopUpWindow = ({ message }) => {  // Accept message as prop
  const [isOpen, setIsOpen] = useState(false);

  const openPopUp = () => setIsOpen(true);
  const closePopUp = () => setIsOpen(false);

  return (
    <div>
      {/* Button to trigger pop-up */}
      <Buttons type="button" onClick={openPopUp}>Open Pop-Up</Buttons>

      {/* Pop-Up Window (conditionally rendered) */}
      {isOpen && (
        <div className="fixed inset-0 flex justify-center items-center bg-gray-800 bg-opacity-50 z-50" onClick={closePopUp}>
          <div
            className="bg-white p-8 rounded-lg shadow-lg max-w-sm w-full"
            onClick={(e) => e.stopPropagation()} // Prevent click event on pop-up window itself
          >
            <div className="mt-4 flex justify-end">
              <CloseButton type="button" onClick={closePopUp}></CloseButton>
            </div>
            <h2 className="text-xl font-semibold mb-4">Pop-Up Title</h2>
            <p>{message}</p>  {/* Dynamic Text passed as prop */}
            
          </div>
        </div>
      )}
    </div>
  );
};

export default PopUpWindow;
