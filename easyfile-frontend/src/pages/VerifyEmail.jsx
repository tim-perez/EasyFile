import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    // 1. Initialize state dynamically! If no token exists, set the error message immediately.
    const [status, setStatus] = useState(
        token ? 'Verifying your email...' : 'Invalid link. No verification token found.'
    );

    useEffect(() => {
        // 2. If there is no token, just stop. The initial state is already handling the error message.
        if (!token) return;

        const verifyAccount = async () => {
            try {
                const response = await api.post(`/auth/verify-email?token=${encodeURIComponent(token)}`);
                setStatus(response.data?.message || 'Email verified successfully! Redirecting to login...');
                setTimeout(() => navigate('/login'), 3000); 
            } catch (error) {
                console.error("Email verification failed:", error);
                setStatus(error.message || 'Verification failed. The link may be expired.');
            }
        };

        verifyAccount();
    }, [token, navigate]);

    return (
        <div style={{ textAlign: 'center', marginTop: '100px', fontFamily: 'sans-serif' }}>
            <h2>EasyFile Account Verification</h2>
            <p style={{ fontSize: '18px', color: '#555' }}>{status}</p>
            
            {status.includes('failed') && (
                <div style={{ marginTop: '20px' }}>
                    <Link to="/register" style={{ color: '#007bff', textDecoration: 'none' }}>
                        Return to Registration
                    </Link>
                </div>
            )}
        </div>
    );
}
