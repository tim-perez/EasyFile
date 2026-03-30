import axios from 'axios';

// 1. Centralize your storage keys to prevent spelling typos across your app
export const STORAGE_KEYS = {
    TOKEN: 'jwtToken',
    ROLE: 'userRole',
    GUEST_EMAIL: 'guestEmail' // Useful if you are tracking your persistent guests!
};

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'https://localhost:7190/api',
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: 15000 // Enterprise apps always have a timeout so the UI doesn't hang forever
});

// ==========================================
// REQUEST INTERCEPTOR: Attach Token
// ==========================================
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ==========================================
// RESPONSE INTERCEPTOR: Global Error Handling
// ==========================================
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle Missing or Expired Tokens (Kick to login)
        if (error.response?.status === 401) {
            localStorage.removeItem(STORAGE_KEYS.TOKEN);
            localStorage.removeItem(STORAGE_KEYS.ROLE);
            
            // Only redirect if they aren't already on the login page to prevent infinite loops
            if (window.location.pathname !== '/login') {
                window.location.href = '/login?expired=true'; 
            }
        }
        
        // Handle Forbidden (Logged in, but tried to do an Admin action as a Customer)
        if (error.response?.status === 403) {
            console.warn("User attempted an unauthorized action.");
            // You could dispatch a custom event here to trigger a global toast notification!
        }

        // Standardize the error message so your components don't have to dig through the error object
        const customError = new Error(
            error.response?.data?.message || 
            error.response?.data?.title || 
            "An unexpected network error occurred."
        );
        customError.status = error.response?.status;

        return Promise.reject(customError);
    }
);

export default api;