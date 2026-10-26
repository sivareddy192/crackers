import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ShopNowRedirect = () => {
    const navigate = useNavigate();
    const user = useSelector(state => state.user);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        
        if (token || user?._id) {
            navigate('/dashboard/profile', { replace: true });
        } else {
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
