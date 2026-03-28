import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/EasyFileLogo3.png'; 

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, loginAsGuest } = useContext(AuthContext);
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

  // 1. Make sure 'async' is here
  const handleGuestLogin = async (e) => { 
    e.preventDefault(); // Prevents the page from refreshing 

    try {
      // 2. Make sure 'await' is here so React STOPS and waits for the database!
      await loginAsGuest(); 
      
      // 3. Only navigate AFTER the login is completely finished
      navigate('/dashboard'); 
    } catch (error) {
      console.error("Guest login failed", error);
    }
  };

  return (
    // 4. Overhaul Tailwind classes. Transition from solid dark bg [#1f1f1f]
    //    to a clean, light gray background [bg-gray-50] for professionalism.
    <div className="min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 transition-colors duration-300
                    bg-gray-50 text-gray-900 
                    dark:bg-[#121212] dark:text-white">

      <div className="w-full max-w-md transition-all">
        {/* 6. Replace text "EasyFile" with your New Logo (Image 1) */}
        <div className="flex flex-col items-center mb-10">
          <img 
            src={logo} 
            alt="EasyFile Logo" 
            // 7. Tailwind classes to perfectly size the logo
            className="h-16 w-auto mb-2" 
          />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Securely manage your legal documents.
          </p>
        </div>

        {/* 8. The Card Container: Clean white card, sharp shadow */}
        <div className="p-8 rounded-2xl shadow-lg border transition-all duration-300
                        bg-white border-gray-100
                        dark:bg-[#1f1f1f] dark:border-gray-800">
          <h2 className="text-2xl font-bold text-center mb-8
                         text-gray-900 dark:text-white">
            Welcome back
          </h2>

          {error && (
            <div className="mb-6 p-4 text-sm rounded-lg bg-red-50 text-red-600 border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-1.5
                                 text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              {/* 9. Refined Input Styling for Light/Dark */}
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 text-sm rounded-lg border transition duration-150 focus:ring-2 focus:ring-blue-200 focus:border-blue-500
                           bg-white border-gray-300 text-gray-900
                           dark:bg-[#2a2a2a] dark:border-gray-700 dark:text-white dark:focus:ring-blue-900"
                placeholder="you@domain.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium 
                                   text-gray-700 dark:text-gray-300">
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
                className="w-full px-4 py-2.5 text-sm rounded-lg border transition duration-150 focus:ring-2 focus:ring-blue-200 focus:border-blue-500
                           bg-white border-gray-300 text-gray-900
                           dark:bg-[#2a2a2a] dark:border-gray-700 dark:text-white dark:focus:ring-blue-900"
                placeholder="••••••••"
              />
            </div>

            <div>
              {/* 10. We keep the "EasyFile Blue" as the primary button action */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 rounded-lg shadow-sm text-sm font-semibold text-white transition duration-150
                           bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                           disabled:opacity-60"
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
              <span className="px-2 text-xs font-medium uppercase transition
                               bg-white text-gray-500 
                               dark:bg-[#1f1f1f] dark:text-gray-400">
                Or explore without access
              </span>
            </div>
          </div>

          <div>
            {/* 11. Guest Button: Subtle styling for light mode [bg-gray-100] */}
            <button
              type="button"
              onClick={handleGuestLogin}
              className="w-full flex justify-center py-2.5 px-4 border rounded-lg shadow-sm text-sm font-semibold transition duration-150
                         bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200
                         dark:bg-[#3a3a3a] dark:text-gray-200 dark:border-gray-700 dark:hover:bg-[#4a4a4a]"
            >
              Continue as Guest
            </button>
          </div>
          
          {/* NEW: The Register Link */}
          <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <button 
              onClick={() => navigate('/register')} 
              className="font-medium text-blue-600 hover:text-blue-500 hover:underline transition-colors"
            >
              Sign up
            </button>
          </div>

        </div> {/* This is the end of the white card */}
      </div> {/* This is the end of the max-w-md container */}
    </div>
  );
}
// import { useState, useContext } from 'react';
// import { AuthContext } from '../context/AuthContext';
// import { Link, useNavigate } from 'react-router-dom';

// export default function Login() {
//   const navigate = useNavigate();

//   const [credentials, setCredentials] = useState({
//     email: '',
//     password: ''
//   });
//   const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

//   const { login, loginAsGuest } = useContext(AuthContext);

//   const handleGuestLogin = () => {
//     loginAsGuest();
//     navigate('/dashboard');
//   };
  
//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setCredentials(prevState => ({
//       ...prevState,
//       [name]: value
//     }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       await login(credentials.email, credentials.password); 
//       navigate('/dashboard');
//     } catch (error) {
//       console.error('Login failed:', error);
//       setStatusMessage({ type: 'error', text: 'Login failed. Please check your credentials.' });
//     }
//   };

//   return (
//     <div className="min-h-screen bg-[#1f1f1f] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans text-white">
//       <div className="sm:mx-auto sm:w-full sm:max-w-md">
//         <h1 className="text-center text-5xl font-extrabold text-blue-500 tracking-wider">
//           EasyFile
//         </h1>
//         <h2 className="mt-6 text-center text-2xl font-bold text-gray-100">
//           Secure Login
//         </h2>
//       </div>

//       <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
//         <div className="bg-[#282828] py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-700">
//           <form className="space-y-6" onSubmit={handleSubmit}>
//             {statusMessage.text && (
//               <div className={`text-sm ${statusMessage.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>
//                 {statusMessage.text}
//               </div>
//             )}
//             <div className="mb-4">
//               <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email</label>
//               <input
//                 id="email"
//                 name="email"
//                 type="email"
//                 autoComplete="email"
//                 required
//                 value={credentials.email}
//                 onChange={handleChange}
//                 className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-[#121212] text-white"
//               />
//             </div>

//             <div className="mb-4">
//               <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">Password</label>
//               <input
//                 id="password"
//                 name="password"
//                 type="password"
//                 autoComplete="current-password"
//                 required
//                 value={credentials.password}
//                 onChange={handleChange}
//                 className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-[#121212] text-white"
//               />
//             </div>
            
//             <div>
//               <button
//                 type="submit"
//                 className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
//               >
//                 Login
//               </button>
//             </div>
//             <div className="mt-4">
//               <button
//                 type="button"
//                 onClick={handleGuestLogin}
//                 className="w-full flex justify-center py-2 px-4 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-[#3a3a3a] hover:bg-[#4a4a4a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition"
//               >
//                 Continue as Guest
//               </button>
//             </div>
//           </form>

//           <div className="mt-6 flex items-center justify-between text-sm">
//             <div className="flex items-center">
//               <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-[#121212]" />
//               <label htmlFor="remember-me" className="ml-2 block text-gray-300">
//                 Remember me
//               </label>
//             </div>
//           </div>

//           <div className="mt-6 border-t border-gray-700 pt-4 flex justify-between text-sm">
//             <a href="#" className="font-medium text-blue-400 hover:text-blue-300">Forgot password?</a>
//             <Link to="/register" className="font-medium text-blue-400 hover:text-blue-300">New user?</Link>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


// // import { useState, useContext } from 'react';
// // import { AuthContext } from '../context/AuthContext';
// // import { loginUser } from '../services/api';

// // export default function Login() {
// //   const [credentials, setCredentials] = useState({ username: '', password: '' });
// //   const [error, setError] = useState(null);
// //   const { login } = useContext(AuthContext);

// //   const handleChange = (e) => {
// //     setCredentials({ ...credentials, [e.target.name]: e.target.value });
// //   };

// //   const handleSubmit = async (e) => {
// //     e.preventDefault();
// //     try {
// //       const data = await loginUser(credentials);
// //       login(data.token);
// //       setError(null);
// //       // Redirect or update UI state here upon successful login
// //     } catch (err) {
// //       setError(err.message);
// //     }
// //   };

// //   return (
// //     <form onSubmit={handleSubmit}>
// //       <h2>Employee Login</h2>
// //       <div>
// //         <label>Username</label>
// //         <input name="username" onChange={handleChange} required />
// //       </div>
// //       <div>
// //         <label>Password</label>
// //         <input name="password" type="password" onChange={handleChange} required />
// //       </div>
// //       <button type="submit">Login</button>
// //       {error && <p style={{ color: 'red' }}>{error}</p>}
// //     </form>
// //   );
// // }