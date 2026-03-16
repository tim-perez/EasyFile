import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import { ProtectedRoute } from './components/ProtectedRoute';
import Login from './components/Login';
import Register from './components/Register';
import DashboardLayout from './components/DashboardLayout';
import Dashboard from './components/Dashboard';
import Documents from './components/Documents';
import RecycleBin from './components/RecycleBin';

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    
                    {/* Protected Routes */}
                    <Route element={<ProtectedRoute allowedRoles={['Customer', 'Admin']} />}>
                        <Route path="/" element={<DashboardLayout />}>
                            <Route index element={<Navigate to="/dashboard" replace />} />
                            <Route path="dashboard" element={<Dashboard />} />
                            <Route path="documents" element={<Documents />} />
                            <Route path="recycle-bin" element={<RecycleBin />} />
                        </Route>
                    </Route>

                    {/* Fallback Route */}
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </Router>
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