import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    // 1. Initialize state dynamically. A missing token triggers an error immediately.
    const [status, setStatus] = useState({
        state: token ? 'loading' : 'error',
        message: token ? 'Verifying your email...' : 'Invalid link. No verification token found.'
    });

    useEffect(() => {
        // 2. Only run the async API call if the token exists.
        if (!token) return;

        const verifyAccount = async () => {
            try {
                const response = await api.post(`/auth/verify-email?token=${encodeURIComponent(token)}`);
                setStatus({ state: 'success', message: response.data?.message || 'Email verified successfully! Redirecting to login...' });
                setTimeout(() => navigate('/login'), 3000); 
            } catch (error) {
                console.error("Email verification failed:", error);
                setStatus({ state: 'error', message: error.response?.data?.message || 'Verification failed. The link may have expired.' });
            }
        };

        verifyAccount();
    }, [token, navigate]);

    return (
        <div style={{ textAlign: 'center', marginTop: '100px', fontFamily: 'sans-serif' }}>
            <h2>EasyFile Account Verification</h2>
            
            {status.state === 'loading' && (
                 <div style={{ marginTop: '20px' }}>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p style={{ fontSize: '18px', color: '#555', marginTop: '15px' }}>{status.message}</p>
                 </div>
            )}

            {status.state !== 'loading' && (
                 <p style={{ fontSize: '18px', color: status.state === 'error' ? '#d9534f' : '#5cb85c', marginTop: '20px' }}>
                     {status.message}
                 </p>
            )}
            
            {status.state === 'error' && (
                <div style={{ marginTop: '20px' }}>
                    <Link to="/register" style={{ color: '#007bff', textDecoration: 'none' }}>
                        Return to Registration
                    </Link>
                </div>
            )}
        </div>
    );
}