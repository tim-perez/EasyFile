import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Register() {
  const navigate = useNavigate();
  
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

  // New state to handle UI feedback
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    
    // 1. Frontend Validation
    if (formData.password !== formData.confirmPassword) {
      setStatusMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setIsSubmitting(true);

    try {
      // 2. API Call to C# Backend
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

      // 3. Success Handling
      setStatusMessage({ type: 'success', text: 'Account successfully registered! Redirecting to login...' });
      
      // Delay the redirect so the user can read the success message
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (error) {
      // 4. Error Handling (e.g., Email already exists, wrong secret code)
      const errorMsg = error.response?.data?.message || 'An error occurred during registration. Please try again.';
      setStatusMessage({ type: 'error', text: errorMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1f1f1f] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <h1 className="text-center text-5xl font-extrabold text-blue-500 tracking-wider">
          EasyFile
        </h1>
        <h2 className="mt-6 text-center text-2xl font-bold text-gray-100">
          Account Information
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-[#282828] py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-700">
          
          {/* Conditional rendering for status messages */}
          {statusMessage.text && (
            <div className={`p-4 mb-6 rounded text-sm ${statusMessage.type === 'error' ? 'bg-red-900/50 text-red-200 border border-red-800' : 'bg-green-900/50 text-green-200 border border-green-800'}`}>
              {statusMessage.text}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            
            <div>
              <label htmlFor="accountType" className="block text-sm font-medium text-gray-300 mb-1">Type of Account *</label>
              <select
                id="accountType"
                name="accountType"
                value={formData.accountType}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-[#121212] text-white"
              >
                <option value="Customer">Customer</option>
                <option value="Employee">Employee</option>
                <option value="Vendor">Vendor</option>
              </select>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-1">First Name *</label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-[#121212] text-white"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-1">Last Name *</label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-[#121212] text-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-gray-300 mb-1">Enter Business Name (Optional)</label>
              <input
                id="businessName"
                name="businessName"
                type="text"
                value={formData.businessName}
                onChange={handleChange}
                className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-[#121212] text-white"
              />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email *</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-[#121212] text-white"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-1">Phone Number (Optional)</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-[#121212] text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">Password *</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-[#121212] text-white"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">Confirm Password *</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-[#121212] text-white"
                />
              </div>
            </div>

            {(formData.accountType === 'Employee' || formData.accountType === 'Vendor') && (
              <div className="pt-2 border-t border-gray-700 mt-4">
                <label htmlFor="secretPassword" className="block text-sm font-medium text-red-400 mb-1">
                  {formData.accountType} Authorization Code *
                </label>
                <input
                  id="secretPassword"
                  name="secretPassword"
                  type="password"
                  required
                  value={formData.secretPassword}
                  onChange={handleChange}
                  placeholder={`Enter secret ${formData.accountType.toLowerCase()} password`}
                  className="appearance-none block w-full px-3 py-2 border border-red-900 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm bg-[#1a1212] text-white"
                />
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition mt-4 disabled:opacity-50"
              >
                {isSubmitting ? 'Registering...' : 'Register'}
              </button>
            </div>
            
            <div className="text-xs text-gray-500 text-center mt-4">
              * Indicates a required field
            </div>
          </form>

          <div className="mt-6 border-t border-gray-700 pt-4 flex justify-center text-sm">
            <Link to="/login" className="font-medium text-blue-400 hover:text-blue-300">
              Already have an account? Login here.
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}