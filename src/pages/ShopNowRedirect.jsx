import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ShopNowRedirect = () => {
    const navigate = useNavigate();
    const user = useSelector(state => state.user);

    useEffect(() => {
        // Check for access token in localStorage or active user session in redux
        const token = localStorage.getItem('accessToken');
        
        if (token || user?._id) {
            // User is active -> Redirect to account dashboard/profile
            navigate('/dashboard/profile', { replace: true });
        } else {
            // User not active -> Redirect to login gate
            navigate('/login', { replace: true });
        }
    }, [user, navigate]);

    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-pulse text-slate-400 font-bold tracking-widest uppercase text-xs">
                Redirecting to Trace...
            </div>
        </div>
    );
};

export default ShopNowRedirect;
