import React from 'react';
import { useAuth } from '../context/AuthProvider';
import CustomerPortal from '../components/features/CustomerPortal';
import AdminPortal from '../components/features/AdminPortal';

export default function Dashboard() {
    const { user } = useAuth();
    const role = user?.role; 

    // Conditional Routing based on Role-Based Access Control (RBAC)
    if (role === 'Customer' || role === 'Guest') {
        return <CustomerPortal />;
    } 

    if (role === 'Admin') {
        return <AdminPortal />;
    }

    // Fallback if role is unrecognized or missing
    return (
        <div className="flex justify-center items-center h-screen bg-gray-50 text-gray-900 dark:bg-[#121212] dark:text-white">
            <p className="text-lg font-medium">Error: Unauthorized role or missing access level.</p>
        </div>
    );
}