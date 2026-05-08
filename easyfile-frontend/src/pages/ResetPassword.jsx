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
    <div className="min-h-screen flex w-full bg-gray-50 dark:bg-[#121212]">
      
      {/* ================= LEFT PANE (BRANDING) ================= */}
      <div className="hidden lg:flex lg:w-5/12 bg-[#0B113B] text-white relative flex-col justify-between p-12 overflow-hidden shadow-2xl z-10">
        <div className="absolute top-0 bottom-0 right-0 w-32 translate-x-16 bg-gray-50 dark:bg-[#121212] rounded-l-[50%] z-0"></div>
        <div className="relative z-10 mt-8">
          <div className="bg-white inline-block p-3 rounded-2xl mb-8 shadow-md">
            <img src={logo} alt="EasyFile Logo" className="h-10 w-auto" />
          </div>
          <h1 className="text-4xl font-bold mb-6 leading-tight text-white">
            Streamline Your <br /> Legal E-Filing
          </h1>
          <p className="text-lg text-blue-200 max-w-sm leading-relaxed">
            Expertly reviewing, parsing, and preparing your legal documents for seamless submission to the courthouse.
          </p>
        </div>
        <div className="relative z-10 mb-8">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-4">
            Connect with the Developer
          </h3>
          <div className="flex flex-col gap-3 max-w-xs">
            <a href="https://tim-perez.github.io/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10 hover:border-white/30 group">
              <span className="text-xl group-hover:scale-110 transition-transform">🌐</span>
              <span className="text-sm font-medium text-white group-hover:text-blue-300 transition-colors">Portfolio Website</span>
            </a>
            <a href="https://www.linkedin.com/in/tim-perez-/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10 hover:border-white/30 group">
              <span className="text-xl group-hover:scale-110 transition-transform">💼</span>
              <span className="text-sm font-medium text-white group-hover:text-blue-300 transition-colors">LinkedIn Profile</span>
            </a>
            <a href="https://github.com/tim-perez/EasyFile" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10 hover:border-white/30 group">
              <span className="text-xl group-hover:scale-110 transition-transform">📁</span>
              <span className="text-sm font-medium text-white group-hover:text-blue-300 transition-colors">GitHub Repository</span>
            </a>
          </div>
        </div>
      </div>

      {/* ================= RIGHT PANE (FORM AREA) ================= */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 relative z-0">
        <div className="w-full max-w-md transition-all animate-fade-in">
          
          <div className="flex flex-col items-center mb-8 lg:hidden">
            <img src={logo} alt="EasyFile Logo" className="h-14 w-auto mb-3" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Password</h2>
          </div>

          <div className="hidden lg:block mb-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Create New Password</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Enter and confirm your new password below.</p>
          </div>

          <div className="p-8 sm:p-10 rounded-3xl shadow-xl border transition-all duration-300 bg-white border-gray-100 dark:bg-[#1f1f1f] dark:border-gray-800">

            {status.text && (
              <div className={`mb-6 p-4 text-sm rounded-xl border ${
                status.type === 'success'
                  ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50'
                  : 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50'
              }`}>
                {status.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.newPassword}
                    onChange={(e) => updateField('newPassword', e.target.value)}
                    className="w-full px-4 py-3 text-sm rounded-xl border transition duration-150 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-gray-50 border-gray-200 text-gray-900 dark:bg-[#151515] dark:border-gray-700 dark:text-white outline-none pr-10"
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
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0a10.05 10.05 0 015.71-1.604c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0l-3.29-3.29" /></svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  className="w-full px-4 py-3 text-sm rounded-xl border transition duration-150 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-gray-50 border-gray-200 text-gray-900 dark:bg-[#151515] dark:border-gray-700 dark:text-white outline-none"
                  placeholder="••••••••"
                  disabled={!token}
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || !token}
                  className="w-full flex justify-center py-3 px-4 rounded-xl shadow-sm text-sm font-bold text-white transition duration-150 bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60"
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>

            <div className="mt-8 border-t border-gray-100 dark:border-gray-800 pt-6 text-center text-sm">
              <Link to="/login" className="font-bold text-blue-600 hover:text-blue-500 hover:underline transition-colors">
                Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}