import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import logo from '../assets/EasyFileLogo3.png';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', text: '' });
    setLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', { email });
      setStatus({
        type: 'success',
        text: response.data?.message || 'If an account exists for that email, a password reset link has been sent.'
      });
    } catch (error) {
      setStatus({
        type: 'error',
        text: error.message || 'Unable to send reset link. Please try again.'
      });
    } finally {
      setLoading(false);
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
          <h2 className="text-2xl font-bold text-center mb-3 text-gray-900 dark:text-white">
            Reset your password
          </h2>
          <p className="text-sm text-center mb-8 text-gray-500 dark:text-gray-400">
            Enter your account email and we'll send a reset link.
          </p>

          {status.text && (
            <div className={`mb-6 p-4 text-sm rounded-lg border ${
              status.type === 'success'
                ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/40 dark:text-green-200 dark:border-green-800'
                : 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/50 dark:text-red-200 dark:border-red-800'
            }`}>
              {status.text}
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

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 rounded-lg shadow-sm text-sm font-semibold text-white transition duration-150 bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <div className="mt-8 text-center text-sm">
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 hover:underline transition-colors">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
