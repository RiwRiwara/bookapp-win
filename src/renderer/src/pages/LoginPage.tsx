import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';
import eyeoff from '../assets/eyeoff.png';
import bgimage from '../assets/bgimage.png';

const LoginPage: React.FC<{ onNavigate?: (page: string) => void }> = ({
  onNavigate,
}) => {
  const { login, loading } = useAuth();
  const [userId, setUserId] = useState('1');
  const [password, setPassword] = useState('1');

  const handleSubmit = async () => {
    const success = await login(userId, password);
    if (success) {
      toast.success('Login successful');
    } else {
      toast.error('Invalid credentials');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundImage: `url(${bgimage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 flex flex-col items-center">
        <img src={logo} alt="BookSiam Logo" className="w-24 mb-4" />
        <h2 className="text-xl font-medium mb-2">Welcome Back !</h2>
        <p className="text-gray-400 text-sm mb-6">
          Sign in to continue to your Digital Library
        </p>
        <div className="w-full">
          <label className="block text-left text-sm font-medium mb-1">
            Username / Email
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded mb-4 bg-white"
            placeholder="username"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
          <label className="block text-left text-sm font-medium mb-1">
            Password
          </label>
          <div className="relative mb-4">
            <input
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded bg-white"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span className="absolute right-3 top-3 text-gray-400 cursor-pointer">
              <img src={eyeoff} alt="eyeoff" className="w-6 h-6" />
            </span>
          </div>
          <div className="flex items-center mb-4">
            <button
              className="ml-auto text-xs text-blue-400 hover:underline"
              onClick={() => onNavigate?.('forgot')}
            >
              Forgot password?
            </button>
          </div>
          <button
            className="w-full bg-blue-500 text-white py-2 rounded-xl hover:bg-blue-600 mb-2"
            disabled={loading}
            onClick={handleSubmit}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
          <div className="flex justify-center text-xs mt-2">
            <span>
              Not a member?{' '}
              <button
                className="text-blue-400 hover:underline"
                onClick={() => onNavigate?.('register')}
              >
                Register Now
              </button>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
