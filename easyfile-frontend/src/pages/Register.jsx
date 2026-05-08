import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import logo from '../assets/EasyFileLogo3.png';

export default function Register() {  
  const [formData, setFormData] = useState({
    accountType: 'Customer',
    firstName: '',
    lastName: '',
    businessName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    secretPassword: ''
  });

  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false); 
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [coldStartMessage, setColdStartMessage] = useState(''); 
  
  const [isRegistered, setIsRegistered] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage({ type: '', text: '' });
    setColdStartMessage('');
    
    if (formData.password !== formData.confirmPassword) {
      setStatusMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setIsSubmitting(true);

    const coldStartTimer = setTimeout(() => {
      setColdStartMessage('Waking up secure database (approx. 30s)...');
    }, 2000);
    const almostThereTimer = setTimeout(() => {
      setColdStartMessage('Almost there, thank you for waiting...');
    }, 30000);

    try {
      await api.post('/auth/register', {
        accountType: formData.accountType,
        firstName: formData.firstName,
        lastName: formData.lastName,
        businessName: formData.businessName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        secretPassword: formData.secretPassword
      });

      setIsRegistered(true);

    } catch (error) {
      const errorMsg = error.message || 'An error occurred during registration. Please try again.';
      setStatusMessage({ type: 'error', text: errorMsg });
    } finally {
      clearTimeout(coldStartTimer);
      clearTimeout(almostThereTimer);
      setIsSubmitting(false);
      setColdStartMessage('');
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-gray-50 dark:bg-[#121212]">
      
      {/* ================= LEFT PANE (BRANDING) ================= */}
      <div className="hidden lg:flex lg:w-5/12 bg-[#0B113B] text-white relative flex-col justify-between p-12 overflow-hidden shadow-2xl z-10">
        
        <div className="absolute top-0 bottom-0 right-0 w-32 translate-x-16 bg-gray-50 dark:bg-[#121212] rounded-l-[50%] z-0"></div>

        {/* Top Section: Logo & Copy */}
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

        {/* Bottom Section: Socials */}
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
        
        {/* Render Success Screen OR Registration Form */}
        {isRegistered ? (
          <div className="w-full max-w-md transition-all animate-fade-in-up">
            <div className="p-10 rounded-3xl shadow-xl border bg-white border-gray-100 dark:bg-[#1f1f1f] dark:border-gray-800 text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-6 shadow-sm">
                <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Check your email</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                We sent a verification link to <br/><span className="font-semibold text-gray-900 dark:text-gray-200">{formData.email}</span>. <br/>Please click the link to activate your account.
              </p>
              <Link to="/login" className="w-full inline-flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition duration-150">
                Proceed to Login
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </Link>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-lg transition-all animate-fade-in">
            
            {/* Mobile Logo (Only shows on small screens when the side pane is hidden) */}
            <div className="flex flex-col items-center mb-8 lg:hidden">
              <img src={logo} alt="EasyFile Logo" className="h-14 w-auto mb-3" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create an Account</h2>
            </div>

            <div className="hidden lg:block mb-8 text-center">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Create an Account</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Get started with EasyFile today.</p>
            </div>

            <div className="p-8 sm:p-10 rounded-3xl shadow-xl border transition-all duration-300 bg-white border-gray-100 dark:bg-[#1f1f1f] dark:border-gray-800">
              
              {statusMessage.text && (
                <div className={`mb-6 p-4 text-sm rounded-xl border ${
                  statusMessage.type === 'error' 
                    ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50' 
                    : 'bg-green-50 text-green-600 border-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50'
                }`}>
                  {statusMessage.text}
                </div>
              )}

              <form className="space-y-5" onSubmit={handleSubmit}>
                
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">Type of Account <span className="text-red-500">*</span></label>
                  <select name="accountType" value={formData.accountType} onChange={handleChange} className="w-full px-4 py-3 text-sm rounded-xl border transition duration-150 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-gray-50 border-gray-200 text-gray-900 dark:bg-[#151515] dark:border-gray-700 dark:text-white outline-none">
                    <option value="Customer">Customer</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">First Name <span className="text-red-500">*</span></label>
                    <input type="text" name="firstName" required value={formData.firstName} onChange={handleChange} className="w-full px-4 py-3 text-sm rounded-xl border focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-gray-50 border-gray-200 text-gray-900 dark:bg-[#151515] dark:border-gray-700 dark:text-white outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">Last Name <span className="text-red-500">*</span></label>
                    <input type="text" name="lastName" required value={formData.lastName} onChange={handleChange} className="w-full px-4 py-3 text-sm rounded-xl border focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-gray-50 border-gray-200 text-gray-900 dark:bg-[#151515] dark:border-gray-700 dark:text-white outline-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">Business Name <span className="text-gray-400 font-normal">(Optional)</span></label>
                  <input type="text" name="businessName" value={formData.businessName} onChange={handleChange} className="w-full px-4 py-3 text-sm rounded-xl border focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-gray-50 border-gray-200 text-gray-900 dark:bg-[#151515] dark:border-gray-700 dark:text-white outline-none" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">Email <span className="text-red-500">*</span></label>
                    <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full px-4 py-3 text-sm rounded-xl border focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-gray-50 border-gray-200 text-gray-900 dark:bg-[#151515] dark:border-gray-700 dark:text-white outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">Phone Number <span className="text-gray-400 font-normal">(Optional)</span></label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-3 text-sm rounded-xl border focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-gray-50 border-gray-200 text-gray-900 dark:bg-[#151515] dark:border-gray-700 dark:text-white outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">Password <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        name="password" 
                        required 
                        value={formData.password} 
                        onChange={handleChange} 
                        className="w-full px-4 py-3 text-sm rounded-xl border focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-gray-50 border-gray-200 text-gray-900 dark:bg-[#151515] dark:border-gray-700 dark:text-white outline-none pr-10" 
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors" tabIndex="-1">
                        {showPassword ? (
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        ) : (
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0a10.05 10.05 0 015.71-1.604c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0l-3.29-3.29" /></svg>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">Confirm <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input 
                        type={showConfirmPassword ? "text" : "password"} 
                        name="confirmPassword" 
                        required 
                        value={formData.confirmPassword} 
                        onChange={handleChange} 
                        className="w-full px-4 py-3 text-sm rounded-xl border focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-gray-50 border-gray-200 text-gray-900 dark:bg-[#151515] dark:border-gray-700 dark:text-white outline-none pr-10" 
                      />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors" tabIndex="-1">
                        {showConfirmPassword ? (
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        ) : (
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0a10.05 10.05 0 015.71-1.604c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0l-3.29-3.29" /></svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {formData.accountType === 'Admin' && (
                  <div className="pt-5 border-t border-gray-100 dark:border-gray-800 mt-2">
                    <label className="block text-sm font-semibold text-red-600 dark:text-red-400 mb-1.5">
                      Admin Authorization Code <span className="text-red-500">*</span>
                    </label>
                    <input type="text" name="secretPassword" required value={formData.secretPassword} onChange={handleChange} placeholder="Enter secret admin code" className="w-full px-4 py-3 text-sm rounded-xl border transition duration-150 focus:ring-2 focus:ring-red-500/50 focus:border-red-500 bg-red-50 border-red-200 text-gray-900 dark:bg-[#2a1a1a] dark:border-red-900/50 dark:text-white outline-none" />
                  </div>
                )}

                <div className="pt-2">
                  <button type="submit" disabled={isSubmitting} className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 transition duration-150">
                    {!isSubmitting && 'Register Account'}
                    {isSubmitting && !coldStartMessage && <span>Registering...</span>}
                    {isSubmitting && coldStartMessage && (
                        <span className="flex items-center">
                            <svg className="animate-spin h-4 w-4 mr-2 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            {coldStartMessage}
                        </span>
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-8 border-t border-gray-100 dark:border-gray-800 pt-6 text-center text-sm font-medium text-gray-600 dark:text-gray-400">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-600 hover:text-blue-500 hover:underline transition-colors">
                  Sign in instead
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}