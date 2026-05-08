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
  
  // New state to manage the success screen
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

  // Render the success screen if registration passed
  if (isRegistered) {
      return (
        <div className="min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 bg-gray-50 text-gray-900 dark:bg-[#121212] dark:text-white">
          <div className="sm:mx-auto sm:w-full sm:max-w-xl transition-all">
            <div className="flex flex-col items-center mb-8">
              <img src={logo} alt="EasyFile Logo" className="h-16 w-auto mb-2" />
              <h2 className="mt-2 text-center text-2xl font-bold text-gray-900 dark:text-white">
                Registration Successful
              </h2>
            </div>
            <div className="p-8 rounded-2xl shadow-lg border transition-all duration-300 bg-white border-gray-100 dark:bg-[#1f1f1f] dark:border-gray-800 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-2">Check your email</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    We sent a verification link to <span className="font-semibold">{formData.email}</span>. Please click the link to activate your EasyFile account.
                </p>
                <Link to="/login" className="w-full inline-flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150">
                    Go to Login
                </Link>
            </div>
          </div>
        </div>
      );
  }

  // Original form rendering below
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 bg-gray-50 text-gray-900 dark:bg-[#121212] dark:text-white">
      
      <div className="sm:mx-auto sm:w-full sm:max-w-xl transition-all">
        <div className="flex flex-col items-center mb-8">
          <img src={logo} alt="EasyFile Logo" className="h-16 w-auto mb-2" />
          <h2 className="mt-2 text-center text-2xl font-bold text-gray-900 dark:text-white">
            Account Information
          </h2>
        </div>

        <div className="p-8 rounded-2xl shadow-lg border transition-all duration-300 bg-white border-gray-100 dark:bg-[#1f1f1f] dark:border-gray-800">
          
          {statusMessage.text && (
            <div className={`mb-6 p-4 text-sm rounded-lg border ${
              statusMessage.type === 'error' 
                ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/50 dark:text-red-200 dark:border-red-800' 
                : 'bg-green-50 text-green-600 border-green-100 dark:bg-green-900/50 dark:text-green-200 dark:border-green-800'
            }`}>
              {statusMessage.text}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                Type of Account *
              </label>
              <select
                name="accountType"
                value={formData.accountType}
                onChange={handleChange}
                className="w-full px-4 py-2.5 text-sm rounded-lg border transition duration-150 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white border-gray-300 text-gray-900 dark:bg-[#2a2a2a] dark:border-gray-700 dark:text-white dark:focus:ring-blue-900"
              >
                <option value="Customer">Customer</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">First Name *</label>
                <input type="text" name="firstName" required value={formData.firstName} onChange={handleChange} className="w-full px-4 py-2.5 text-sm rounded-lg border focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white border-gray-300 text-gray-900 dark:bg-[#2a2a2a] dark:border-gray-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Last Name *</label>
                <input type="text" name="lastName" required value={formData.lastName} onChange={handleChange} className="w-full px-4 py-2.5 text-sm rounded-lg border focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white border-gray-300 text-gray-900 dark:bg-[#2a2a2a] dark:border-gray-700 dark:text-white" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Enter Business Name (Optional)</label>
              <input type="text" name="businessName" value={formData.businessName} onChange={handleChange} className="w-full px-4 py-2.5 text-sm rounded-lg border focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white border-gray-300 text-gray-900 dark:bg-[#2a2a2a] dark:border-gray-700 dark:text-white" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Email *</label>
                <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full px-4 py-2.5 text-sm rounded-lg border focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white border-gray-300 text-gray-900 dark:bg-[#2a2a2a] dark:border-gray-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Phone Number (Optional)</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-2.5 text-sm rounded-lg border focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white border-gray-300 text-gray-900 dark:bg-[#2a2a2a] dark:border-gray-700 dark:text-white" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Password *</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    name="password" 
                    required 
                    value={formData.password} 
                    onChange={handleChange} 
                    className="w-full px-4 py-2.5 text-sm rounded-lg border focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white border-gray-300 text-gray-900 dark:bg-[#2a2a2a] dark:border-gray-700 dark:text-white pr-10" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    tabIndex="-1"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0a10.05 10.05 0 015.71-1.604c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0l-3.29-3.29" /></svg>
                    )}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Confirm Password *</label>
                <div className="relative">
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    name="confirmPassword" 
                    required 
                    value={formData.confirmPassword} 
                    onChange={handleChange} 
                    className="w-full px-4 py-2.5 text-sm rounded-lg border focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white border-gray-300 text-gray-900 dark:bg-[#2a2a2a] dark:border-gray-700 dark:text-white pr-10" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    tabIndex="-1"
                  >
                    {showConfirmPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0a10.05 10.05 0 015.71-1.604c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0l-3.29-3.29" /></svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {formData.accountType === 'Admin' && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-2">
                <label className="block text-sm font-medium text-red-600 dark:text-red-400 mb-1.5">
                  Admin Authorization Code *
                </label>
                <input
                  type="text"
                  name="secretPassword"
                  required
                  value={formData.secretPassword}
                  onChange={handleChange}
                  placeholder="Enter secret admin code"
                  className="w-full px-4 py-2.5 text-sm rounded-lg border transition duration-150 focus:ring-2 focus:ring-red-200 focus:border-red-500 bg-red-50 border-red-200 text-gray-900 dark:bg-[#2a1a1a] dark:border-red-900 dark:text-white dark:focus:ring-red-900"
                />
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 transition duration-150 mt-2"
              >
                {!isSubmitting && 'Register'}
                
                {isSubmitting && !coldStartMessage && (
                    <span>Registering...</span>
                )}

                {isSubmitting && coldStartMessage && (
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
            
            <div className="text-xs text-gray-500 text-center mt-4">
              * Indicates a required field
            </div>
          </form>

          <div className="mt-8 border-t border-gray-100 dark:border-gray-700 pt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 hover:underline transition-colors">
              Sign in
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
