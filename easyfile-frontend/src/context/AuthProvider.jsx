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
            // Make sure to clear any old guest flags when a real user logs in
            localStorage.removeItem('isGuest'); 
            
            setUser({ token, role, firstName, lastName, isGuest: false });
        } catch (error) {
            console.error("Authentication failed:", error);
            throw error; 
        } finally {
            setLoading(false);
        }
    };

    // 2. Our new fake login function
    const loginAsGuest = () => {
        const token = 'guest-token-' + Math.random().toString(36).substr(2, 9);
        const role = 'Customer'; // Send them to the Customer portal
        
        localStorage.setItem('jwtToken', token);
        localStorage.setItem('userRole', role);
        localStorage.setItem('isGuest', 'true');
        
        // Initialize their document limit counter if it doesn't exist
        if (!localStorage.getItem('guestDocCount')) {
            localStorage.setItem('guestDocCount', '0');
        }

        setUser({ token, role, isGuest: true });
    };

    const logout = () => {
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('isGuest');
        localStorage.removeItem('firstName');
        localStorage.removeItem('lastName');
        setUser(null);
    };

    return (
        // 3. Add loginAsGuest to the provider value
        <AuthContext.Provider value={{ user, login, loginAsGuest, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};