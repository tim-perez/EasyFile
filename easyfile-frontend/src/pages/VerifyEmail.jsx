import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import logo from '../assets/EasyFileLogo3.png';

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [status, setStatus] = useState({
        state: token ? 'loading' : 'error',
        message: token ? 'Verifying your secure token...' : 'Invalid link. No verification token found.'
    });

    useEffect(() => {
        if (!token) return;

        const verifyAccount = async () => {
            try {
                const response = await api.post(`/auth/verify-email?token=${encodeURIComponent(token)}`);
                setStatus({ state: 'success', message: response.data?.message || 'Email verified successfully! Redirecting...' });
                setTimeout(() => navigate('/login'), 3000); 
            } catch (error) {
                console.error("Email verification failed:", error);
                setStatus({ state: 'error', message: error.response?.data?.message || 'Verification failed. The link may have expired.' });
            }
        };

        verifyAccount();
    }, [token, navigate]);

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
    
          {/* ================= RIGHT PANE (STATUS AREA) ================= */}
          <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 relative z-0">
            <div className="w-full max-w-md transition-all animate-fade-in">
              
              <div className="flex flex-col items-center mb-8 lg:hidden">
                <img src={logo} alt="EasyFile Logo" className="h-14 w-auto mb-3" />
              </div>

              <div className="p-10 rounded-3xl shadow-xl border transition-all duration-300 bg-white border-gray-100 dark:bg-[#1f1f1f] dark:border-gray-800 text-center">
                
                {status.state === 'loading' && (
                  <div className="flex flex-col items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-14 w-14 border-4 border-blue-100 border-t-blue-600 dark:border-blue-900/30 dark:border-t-blue-500 mb-6"></div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Verifying...</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{status.message}</p>
                  </div>
                )}

                {status.state === 'success' && (
                  <div className="flex flex-col items-center justify-center animate-fade-in-up">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-6 shadow-sm">
                      <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Verification Complete</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">{status.message}</p>
                  </div>
                )}

                {status.state === 'error' && (
                  <div className="flex flex-col items-center justify-center animate-fade-in">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-6 shadow-sm">
                      <svg className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Verification Failed</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">{status.message}</p>
                    <Link to="/register" className="w-full inline-flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition duration-150">
                      Return to Registration
                    </Link>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
    );
}