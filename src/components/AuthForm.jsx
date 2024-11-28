import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Buttons from './ui/Buttons';
import TextFields from './ui/TextFields';

const AuthForm = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const navigate = useNavigate();

  const staticCredentials = { username: 'user123', password: 'password123' };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (
      formData.username === staticCredentials.username &&
      formData.password === staticCredentials.password
    ) {
      navigate('/home', { state: { username: formData.username } });
    } else {
      alert('Invalid username or password!');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-md rounded-md">
      <h1 className="text-2xl font-bold text-center mb-6">Login</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextFields
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleInputChange}
          required
        />
        <TextFields
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleInputChange}
          required
        />
        <div className='grid place-items-center'>
          <Buttons type="submit">Login</Buttons>
        </div>
        
      </form>
    </div>
  );
};

export default AuthForm;
