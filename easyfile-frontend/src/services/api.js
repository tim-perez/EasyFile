import axios from 'axios';

export const STORAGE_KEYS = {
    TOKEN: 'jwtToken',
    ROLE: 'userRole',
    GUEST_EMAIL: 'guestEmail'
};

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'https://localhost:7190/api',
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: 30000 
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
        if (error.response?.status === 401) {
            localStorage.removeItem(STORAGE_KEYS.TOKEN);
            localStorage.removeItem(STORAGE_KEYS.ROLE);
            localStorage.removeItem(STORAGE_KEYS.GUEST_EMAIL);

            if (window.location.pathname !== '/login') {
                window.location.href = '/login?expired=true'; 
            }
        }
        
        if (error.response?.status === 403) {
            console.warn("User attempted an unauthorized action.");
        }

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