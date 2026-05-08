import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import logo from '../assets/EasyFileLogo3.png'; 

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [coldStartMessage, setColdStartMessage] = useState('');
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [guestColdStartMessage, setGuestColdStartMessage] = useState('');


  // Enterprise pattern: Using the custom hook instead of raw useContext
  const { login, loginAsGuest } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setColdStartMessage('');


    const coldStartTimer = setTimeout(() => {
      setColdStartMessage('Waking up secure database (approx. 30s)...');
    }, 2000);
    const almostThereTimer = setTimeout(() => {
      setColdStartMessage('Almost there, thank you for waiting...');
    }, 30000);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      clearTimeout(coldStartTimer);
      clearTimeout(almostThereTimer);
      setLoading(false);
      setColdStartMessage('');
    }
  };

  const handleGuestLogin = async (e) => { 
    e.preventDefault(); 
    setIsGuestLoading(true);
    setGuestColdStartMessage('');

    const guestColdStartTimer = setTimeout(() => {
      setGuestColdStartMessage('Waking up secure database (approx. 30s)...');
    }, 2000);
    const guestAlmostThereTimer = setTimeout(() => {
      setGuestColdStartMessage('Almost there, thank you for waiting...');
    }, 30000);

    try {
      await loginAsGuest(); 
      navigate('/dashboard'); 
    } catch (error) {
      console.error("Guest login failed", error);
      setError('Guest login failed. Please try again.');
    } finally {
      clearTimeout(guestColdStartTimer);
      clearTimeout(guestAlmostThereTimer);
      setIsGuestLoading(false);
      setGuestColdStartMessage('');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 bg-gray-50 text-gray-900 dark:bg-[#121212] dark:text-white">
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email Address
                </label>
                <Link to="/verify-account" className="text-xs font-medium text-blue-600 hover:text-blue-500">
                  Verify?
                </Link>
              </div>
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
                <Link to="/forgot-password" className="text-xs font-medium text-blue-600 hover:text-blue-500">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-lg border transition duration-150 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white border-gray-300 text-gray-900 dark:bg-[#2a2a2a] dark:border-gray-700 dark:text-white dark:focus:ring-blue-900 pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  tabIndex="-1"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0a10.05 10.05 0 015.71-1.604c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0l-3.29-3.29" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg shadow-sm text-sm font-semibold text-white transition duration-150 bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60"
              >
                {!loading && 'Sign In'}
                
                {loading && !coldStartMessage && (
                    <span>Authenticating...</span>
                )}

                {loading && coldStartMessage && (
                    <span className="flex items-center">
                        <svg className="animate-spin h-4 w-4 mr-2 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {coldStartMessage}
                    </span>
                )}
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
              disabled={isGuestLoading}
              className="w-full flex justify-center items-center py-2.5 px-4 border rounded-lg shadow-sm text-sm font-semibold transition duration-150 bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 dark:bg-[#3a3a3a] dark:text-gray-200 dark:border-gray-700 dark:hover:bg-[#4a4a4a] disabled:opacity-60"
            >
                {!isGuestLoading && 'Continue as Guest'}
                
                {isGuestLoading && !guestColdStartMessage && (
                    <span>Authenticating...</span>
                )}

                {isGuestLoading && guestColdStartMessage && (
                    <span className="flex items-center">
                        <svg className="animate-spin h-4 w-4 mr-2 text-gray-700 dark:text-gray-200" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {guestColdStartMessage}
                    </span>
                )}
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
