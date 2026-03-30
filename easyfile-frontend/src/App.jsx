import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import { ProtectedRoute } from './components/ProtectedRoute';

// Public Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Protected Pages
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './components/Dashboard';
import Documents from './components/Documents';
import RecycleBin from './components/RecycleBin';
import Account from './components/Account';
import Users from './components/Users';

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
                    
                    {/* ========================================== */}
                    {/* PROTECTED ROUTES (Requires Login)          */}
                    {/* ========================================== */}
                    <Route element={<ProtectedRoute />}>
                        <Route path="/" element={<DashboardLayout />}>
                            
                            {/* Default redirect to Dashboard */}
                            <Route index element={<Navigate to="/dashboard" replace />} />
                            
                            {/* Standard features for all logged-in users */}
                            <Route path="dashboard" element={<Dashboard />} />
                            <Route path="documents" element={<Documents />} />
                            <Route path="recycle-bin" element={<RecycleBin />} />
                            <Route path="account" element={<Account />} />
                            
                            {/* 🛑 ADMIN-ONLY ROUTES */}
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