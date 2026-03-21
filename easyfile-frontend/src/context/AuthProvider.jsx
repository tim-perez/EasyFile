import { useState } from 'react';
import { AuthContext } from './AuthContext';
import api from '../services/api';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const token = localStorage.getItem('jwtToken');
        const role = localStorage.getItem('userRole');
        const firstName = localStorage.getItem('firstName');
        const lastName = localStorage.getItem('lastName');
        const isGuest = localStorage.getItem('isGuest') === 'true'; 
        
        if (token && role) {
            return { token, role, firstName, lastName, isGuest }; 
        }
        return null;
    });
    
    const [loading, setLoading] = useState(false);

    const login = async (email, password) => {
        try {
            setLoading(true);
            const response = await api.post('/auth/login', { email, password });
            
            const { token, role, firstName, lastName } = response.data; 
            
            localStorage.setItem('jwtToken', token);
            localStorage.setItem('userRole', role);
            localStorage.setItem('firstName', firstName);
            localStorage.setItem('lastName', lastName);
            localStorage.removeItem('isGuest'); 
            
            setUser({ token, role, firstName, lastName, isGuest: false }); 
        } catch (error) {
            console.error("Authentication failed:", error);
            throw error; 
        } finally {
            setLoading(false);
        }
    };

    const loginAsGuest = async () => {
        try {
            setLoading(true);
            const response = await api.post('/auth/guest-login');
            
            const { token, role, firstName, lastName } = response.data;
            
            localStorage.setItem('jwtToken', token);
            localStorage.setItem('userRole', role);
            localStorage.setItem('firstName', firstName);
            localStorage.setItem('lastName', lastName);
            localStorage.setItem('isGuest', 'true');
            
            if (!localStorage.getItem('guestDocCount')) {
                localStorage.setItem('guestDocCount', '0');
            }

            setUser({ token, role, firstName, lastName, isGuest: true });
        } catch (error) {
            console.error("Guest login failed:", error);
        } finally {
            setLoading(false);
        }
    };

    // THIS WAS THE MISSING FUNCTION!
    const logout = () => {
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('isGuest');
        localStorage.removeItem('firstName');
        localStorage.removeItem('lastName');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, loginAsGuest, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};