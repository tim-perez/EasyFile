import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Public Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyAccount from './pages/VerifyAccount';

// Protected Pages
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import Submissions from './pages/Submissions';
import RecycleBin from './pages/RecycleBin';
import Account from './pages/Account';
import Users from './pages/Users';
import VerifyEmail from './pages/VerifyEmail';


function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* ========================================== */}
                    {/* PUBLIC ROUTES (No login required)          */}
                    {/* ========================================== */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/verify-email" element={<VerifyEmail />} />
                    <Route path="/verify-account" element={<VerifyAccount />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    {/* ========================================== */}
                    {/* PROTECTED ROUTES (Requires Login)          */}
                    {/* ========================================== */}
                    <Route element={<ProtectedRoute />}>
                        <Route path="/" element={<DashboardLayout />}>
                            
                            {/* Default redirect to Dashboard */}
                            <Route index element={<Navigate to="/dashboard" replace />} />
                            
                            {/* Standard features for all logged-in users */}
                            <Route path="dashboard" element={<Dashboard />} />
                            <Route path="submissions" element={<Submissions />} />
                            <Route path="documents" element={<Documents />} />
                            <Route path="recycle-bin" element={<RecycleBin />} />
                            <Route path="account" element={<Account />} />
                            
                            {/* ADMIN-ONLY ROUTES */}
                            {/* Only users with the "Admin" role can get past this secondary checkpoint */}
                            <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
                                <Route path="users" element={<Users />} />
                            </Route>

                        </Route>
                    </Route>

                    {/* ========================================== */}
                    {/* FALLBACK ROUTE                             */}
                    {/* ========================================== */}
                    {/* If a user types a random URL, send them safely to the login screen */}
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
