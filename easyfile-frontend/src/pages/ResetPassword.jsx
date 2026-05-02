import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import logo from '../assets/EasyFileLogo3.png';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState({
    type: token ? '' : 'error',
    text: token ? '' : 'Invalid reset link. No token was provided.'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', text: '' });

    if (!token) {
      setStatus({ type: 'error', text: 'Invalid reset link. No token was provided.' });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setStatus({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    if (formData.newPassword.length < 6) {
      setStatus({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/reset-password', {
        token,
        newPassword: formData.newPassword
      });

      setStatus({
        type: 'success',
        text: response.data?.message || 'Password reset successfully. Redirecting to sign in...'
      });
      setTimeout(() => navigate('/login'), 2500);
    } catch (error) {
      setStatus({
        type: 'error',
        text: error.message || 'Unable to reset password. Please request a new link.'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
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
            Create a new password
          </h2>

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
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.newPassword}
                  onChange={(e) => updateField('newPassword', e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-lg border transition duration-150 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white border-gray-300 text-gray-900 dark:bg-[#2a2a2a] dark:border-gray-700 dark:text-white dark:focus:ring-blue-900 pr-10"
                  placeholder="••••••••"
                  disabled={!token}
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
              <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.confirmPassword}
                onChange={(e) => updateField('confirmPassword', e.target.value)}
                className="w-full px-4 py-2.5 text-sm rounded-lg border transition duration-150 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white border-gray-300 text-gray-900 dark:bg-[#2a2a2a] dark:border-gray-700 dark:text-white dark:focus:ring-blue-900"
                placeholder="••••••••"
                disabled={!token}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              className="w-full flex justify-center py-2.5 px-4 rounded-lg shadow-sm text-sm font-semibold text-white transition duration-150 bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
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
