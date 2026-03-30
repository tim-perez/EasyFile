import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider'; // Update this path if you named the file differently!

export const ProtectedRoute = ({ allowedRoles }) => {
    // 1. Elegantly grab the user state using our custom hook
    const { user } = useAuth();

    // 2. If they are not logged in at all, kick them to the login screen
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // 3. If the route requires specific roles, and the user doesn't have it, kick them to the dashboard
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        console.warn(`Access Denied: ${user.role} attempted to access an ${allowedRoles.join('/')} route.`);
        return <Navigate to="/dashboard" replace />;
    }

    // 4. If they pass all checks, render the child components!
    return <Outlet />;
};