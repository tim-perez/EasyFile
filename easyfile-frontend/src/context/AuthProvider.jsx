import React, { createContext, useContext, useState } from 'react';
import api, { STORAGE_KEYS } from '../services/api';

const AuthContext = createContext(null);

// Centralize the local UI keys 
const UI_STORAGE_KEYS = {
    USER_DATA: 'easyfile_user', // Bundles id, names, email, isGuest
};

export const AuthProvider = ({ children }) => {
    const [loading, setLoading] = useState(false);

    // 1. Initialize state cleanly from bundled storage
    const [user, setUser] = useState(() => {
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
        const role = localStorage.getItem(STORAGE_KEYS.ROLE);
        const savedUserData = localStorage.getItem(UI_STORAGE_KEYS.USER_DATA);
        
        if (token && role && savedUserData) {
            try {
                const parsedData = JSON.parse(savedUserData);
                return { token, role, ...parsedData };
            } catch {
                return null; // Fail safe if JSON is corrupted
            }
        }
        return null;
    });

    const persistAuthenticatedUser = (responseData, isGuest = false) => {
        const { id, token, role, firstName, lastName, email } = responseData;

        localStorage.setItem(STORAGE_KEYS.TOKEN, token);
        localStorage.setItem(STORAGE_KEYS.ROLE, role);

        const userData = { id, firstName, lastName, email, isGuest };
        localStorage.setItem(UI_STORAGE_KEYS.USER_DATA, JSON.stringify(userData));

        setUser({ token, role, ...userData });
    };

    const login = async (email, password) => {
        try {
            setLoading(true);
            const response = await api.post('/auth/login', { email, password });
            persistAuthenticatedUser(response.data);
        } catch (error) {
            console.error("Authentication failed:", error);
            throw error; 
        } finally {
            setLoading(false);
        }
    };

    const verifyAndLogin = async (email, password) => {
        try {
            setLoading(true);
            const response = await api.post('/auth/verify-login', { email, password });
            persistAuthenticatedUser(response.data);
        } catch (error) {
            console.error("Verification login failed:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const loginAsGuest = async () => {
        try {
            setLoading(true);
            
            const savedGuestEmail = localStorage.getItem(STORAGE_KEYS.GUEST_EMAIL);
            const response = await api.post('/auth/guest-login', { guestEmail: savedGuestEmail });
            
            localStorage.setItem(STORAGE_KEYS.GUEST_EMAIL, response.data.email); 
            persistAuthenticatedUser(response.data, true);
        } catch (error) {
            console.error("Guest login failed:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const updateUserContext = (newFirstName, newLastName, newEmail) => {
        const updatedData = { ...user, firstName: newFirstName, lastName: newLastName, email: newEmail };
        
        // Save the updated bundle minus the token/role
        // eslint-disable-next-line no-unused-vars
        const { token, role, ...storageData } = updatedData;
        localStorage.setItem(UI_STORAGE_KEYS.USER_DATA, JSON.stringify(storageData));
        
        setUser(updatedData);
    };

    const logout = () => {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.ROLE);
        localStorage.removeItem(UI_STORAGE_KEYS.USER_DATA);
        
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, verifyAndLogin, loginAsGuest, logout, loading, updateUserContext }}>
            {children}
        </AuthContext.Provider>
    );
};

// 4. Export the custom hook so components don't need to import useContext
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
