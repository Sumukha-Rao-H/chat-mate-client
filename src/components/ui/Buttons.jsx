import React from 'react';

const Buttons = ({ type, children, onClick, variant }) => {
  const baseClasses =
    'font-bold py-2 px-4 rounded focus:outline-none focus:ring';
  const variants = {
    primary: 'bg-blue-500 hover:bg-blue-700 text-white',
    close: 'bg-gray-200 hover:bg-gray-300 text-gray-700', // Close button style
  };

  const selectedVariant = variants[variant] || variants.primary;

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${baseClasses} ${selectedVariant}`}
    >
      {children}
    </button>
  );
};

export const CloseButton = ({ onClick }) => (
  <Buttons type="button" onClick={onClick} variant="close">
    ✖
  </Buttons>
);

export default Buttons;
