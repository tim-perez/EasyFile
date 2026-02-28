import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthProvider } from './context/AuthProvider';
import { AuthContext } from './context/AuthContext';
import DashboardLayout from './components/DashboardLayout';
import Dashboard from './components/Dashboard';
import Orders from './components/Orders';
import Cases from './components/Cases';
import Login from './components/Login';
import Register from './components/Register';

// ProtectedRoute component to guard routes that require authentication
function ProtectedRoute({ children }) {
  const { token } = useContext(AuthContext);

  // if no token exists, redirect to login page
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
       <Routes>
        { /* Public Routes */ }
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        { /* Protected Routes */ }
        <Route 
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="orders" element={<Orders />} />
          <Route path="cases" element={<Cases />} />
        </Route>
       </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

// import { useContext } from 'react';
// import { AuthProvider } from './context/AuthProvider';
// import { AuthContext } from './context/AuthContext';
// import Login from './components/Login';
// import UploadForm from './components/UploadForm'; 

// function AppContent() {
//   // Pull the token and logout function from our AuthContext
//   const { token, logout } = useContext(AuthContext);

//   return (
//     <div className="App">
//       {token ? (
//         <>
//           <button onClick={logout} style={{ float: 'right', padding: '5px 10px' }}>
//             Logout
//           </button>
//           <UploadForm />
//         </>
//       ) : (
//         <Login />
//       )}
//     </div>
//   );
// }

// function App() {
//   return (
//     <AuthProvider>
//       <AppContent />
//     </AuthProvider>
//   );
// }

// export default App;