import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider'; 

export const ProtectedRoute = ({ allowedRoles }) => {
    const { user } = useAuth();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        console.warn(`Access Denied: ${user.role} attempted to access an ${allowedRoles.join('/')} route.`);
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
};