import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();

  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  const { login, loginAsGuest } = useContext(AuthContext);

  const handleGuestLogin = () => {
    loginAsGuest();
    navigate('/dashboard');
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(credentials.email, credentials.password); 
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      setStatusMessage({ type: 'error', text: 'Login failed. Please check your credentials.' });
    }
  };

  return (
    <div className="min-h-screen bg-[#1f1f1f] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-5xl font-extrabold text-blue-500 tracking-wider">
          EasyFile
        </h1>
        <h2 className="mt-6 text-center text-2xl font-bold text-gray-100">
          Secure Login
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#282828] py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-700">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {statusMessage.text && (
              <div className={`text-sm ${statusMessage.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>
                {statusMessage.text}
              </div>
            )}
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={credentials.email}
                onChange={handleChange}
                className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-[#121212] text-white"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={credentials.password}
                onChange={handleChange}
                className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-[#121212] text-white"
              />
            </div>
            
            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
              >
                Login
              </button>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={handleGuestLogin}
                className="w-full flex justify-center py-2 px-4 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-[#3a3a3a] hover:bg-[#4a4a4a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition"
              >
                Continue as Guest
              </button>
            </div>
          </form>

          <div className="mt-6 flex items-center justify-between text-sm">
            <div className="flex items-center">
              <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-[#121212]" />
              <label htmlFor="remember-me" className="ml-2 block text-gray-300">
                Remember me
              </label>
            </div>
          </div>

          <div className="mt-6 border-t border-gray-700 pt-4 flex justify-between text-sm">
            <a href="#" className="font-medium text-blue-400 hover:text-blue-300">Forgot password?</a>
            <Link to="/register" className="font-medium text-blue-400 hover:text-blue-300">New user?</Link>
          </div>
        </div>
      </div>
    </div>
  );
}


// import { useState, useContext } from 'react';
// import { AuthContext } from '../context/AuthContext';
// import { loginUser } from '../services/api';

// export default function Login() {
//   const [credentials, setCredentials] = useState({ username: '', password: '' });
//   const [error, setError] = useState(null);
//   const { login } = useContext(AuthContext);

//   const handleChange = (e) => {
//     setCredentials({ ...credentials, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       const data = await loginUser(credentials);
//       login(data.token);
//       setError(null);
//       // Redirect or update UI state here upon successful login
//     } catch (err) {
//       setError(err.message);
//     }
//   };

//   return (
//     <form onSubmit={handleSubmit}>
//       <h2>Employee Login</h2>
//       <div>
//         <label>Username</label>
//         <input name="username" onChange={handleChange} required />
//       </div>
//       <div>
//         <label>Password</label>
//         <input name="password" type="password" onChange={handleChange} required />
//       </div>
//       <button type="submit">Login</button>
//       {error && <p style={{ color: 'red' }}>{error}</p>}
//     </form>
//   );
// }