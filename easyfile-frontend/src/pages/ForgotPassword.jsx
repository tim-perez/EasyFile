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
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Reset Password</h2>
          </div>

          <div className="hidden lg:block mb-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Reset Password</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Enter your email and we'll send a link.</p>
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
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 text-sm rounded-xl border transition duration-150 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-gray-50 border-gray-200 text-gray-900 dark:bg-[#151515] dark:border-gray-700 dark:text-white outline-none"
                  placeholder="you@domain.com"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 rounded-xl shadow-sm text-sm font-bold text-white transition duration-150 bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
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