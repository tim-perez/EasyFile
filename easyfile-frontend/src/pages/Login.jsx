import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import logo from '../assets/EasyFileLogo3.png'; 

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Enterprise pattern: Using the custom hook instead of raw useContext
  const { login, loginAsGuest } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async (e) => { 
    e.preventDefault(); 
    try {
      await loginAsGuest(); 
      navigate('/dashboard'); 
    } catch (error) {
      console.error("Guest login failed", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 transition-colors duration-300 bg-gray-50 text-gray-900 dark:bg-[#121212] dark:text-white">
      <div className="w-full max-w-md transition-all">
        
        <div className="flex flex-col items-center mb-10">
          <img src={logo} alt="EasyFile Logo" className="h-16 w-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Securely manage your legal documents.
          </p>
        </div>

        <div className="p-8 rounded-2xl shadow-lg border transition-all duration-300 bg-white border-gray-100 dark:bg-[#1f1f1f] dark:border-gray-800">
          <h2 className="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-white">
            Welcome back
          </h2>

          {error && (
            <div className="mb-6 p-4 text-sm rounded-lg bg-red-50 text-red-600 border border-red-100 dark:bg-red-900/50 dark:text-red-200 dark:border-red-800">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 text-sm rounded-lg border transition duration-150 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white border-gray-300 text-gray-900 dark:bg-[#2a2a2a] dark:border-gray-700 dark:text-white dark:focus:ring-blue-900"
                placeholder="you@domain.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <a href="#" className="text-xs font-medium text-blue-600 hover:text-blue-500">
                  Forgot?
                </a>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 text-sm rounded-lg border transition duration-150 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white border-gray-300 text-gray-900 dark:bg-[#2a2a2a] dark:border-gray-700 dark:text-white dark:focus:ring-blue-900"
                placeholder="••••••••"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 rounded-lg shadow-sm text-sm font-semibold text-white transition duration-150 bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </div>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-200 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-2 text-xs font-medium uppercase transition bg-white text-gray-500 dark:bg-[#1f1f1f] dark:text-gray-400">
                Or explore without access
              </span>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={handleGuestLogin}
              className="w-full flex justify-center py-2.5 px-4 border rounded-lg shadow-sm text-sm font-semibold transition duration-150 bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 dark:bg-[#3a3a3a] dark:text-gray-200 dark:border-gray-700 dark:hover:bg-[#4a4a4a]"
            >
              Continue as Guest
            </button>
          </div>
          
          <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <button 
              onClick={() => navigate('/register')} 
              className="font-medium text-blue-600 hover:text-blue-500 hover:underline transition-colors"
            >
              Sign up
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}