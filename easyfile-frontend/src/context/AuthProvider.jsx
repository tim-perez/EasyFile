import { useState } from 'react';
import { AuthContext } from './AuthContext';
import api from '../services/api';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const id = localStorage.getItem('id');
        const token = localStorage.getItem('jwtToken');
        const role = localStorage.getItem('userRole');
        const firstName = localStorage.getItem('firstName');
        const lastName = localStorage.getItem('lastName');
        const email = localStorage.getItem('email');
        const isGuest = localStorage.getItem('isGuest') === 'true'; 
        
        if (token && role) {
            return { id, token, role, firstName, lastName, email, isGuest }; 
        }
        return null;
    });
    
    const [loading, setLoading] = useState(false);

    const login = async (email, password) => {
        try {
            setLoading(true);
            const response = await api.post('/auth/login', { email, password });
            
            const { id, token, role, firstName, lastName, email: userEmail } = response.data; 
            
            localStorage.setItem('id', id);
            localStorage.setItem('jwtToken', token);
            localStorage.setItem('userRole', role);
            localStorage.setItem('firstName', firstName);
            localStorage.setItem('lastName', lastName);
            localStorage.setItem('email', userEmail);
            localStorage.removeItem('isGuest'); 
            
            setUser({ id, token, role, firstName, lastName, email: userEmail, isGuest: false }); 
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
            
            const { id, token, role, firstName, lastName, email } = response.data;
            
            localStorage.setItem('id', id);
            localStorage.setItem('jwtToken', token);
            localStorage.setItem('userRole', role);
            localStorage.setItem('firstName', firstName);
            localStorage.setItem('lastName', lastName);
            localStorage.setItem('email', email);
            localStorage.setItem('isGuest', 'true');
            
            if (!localStorage.getItem('guestDocCount')) {
                localStorage.setItem('guestDocCount', '0');
            }

            setUser({ id, token, role, firstName, lastName, email, isGuest: true });
        } catch (error) {
            console.error("Guest login failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const updateUserContext = (newFirstName, newLastName, newEmail) => {
        localStorage.setItem('firstName', newFirstName);
        localStorage.setItem('lastName', newLastName);
        localStorage.setItem('email', newEmail);
        localStorage.setItem('id', localStorage.getItem('id'));
        setUser(prev => ({ ...prev, firstName: newFirstName, lastName: newLastName, email: newEmail }));
    };

    // THIS WAS THE MISSING FUNCTION!
    const logout = () => {
        localStorage.removeItem('id');
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('isGuest');
        localStorage.removeItem('firstName');
        localStorage.removeItem('lastName');
        localStorage.removeItem('email');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, loginAsGuest, logout, loading, updateUserContext }}>
            {children}
        </AuthContext.Provider>
    );
};