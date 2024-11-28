import React from 'react';

const TextFields = ({ type, name, placeholder, value, onChange, required }) => {
  return (
    <input
      type={type}
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-300"
    />
  );
};

export default TextFields;
