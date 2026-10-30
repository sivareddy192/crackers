import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaHome } from 'react-icons/fa';
import { FaCartShopping, FaGrip, FaShieldHalved, FaUser } from 'react-icons/fa6';
import { useSelector } from 'react-redux';
import { useGlobalContext } from '../provider/GlobalProvider';
import { prefetchRoute } from '../utils/routePrefetch';

const BottomNavigationBar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { totalQty } = useGlobalContext();
    const user = useSelector(state => state.user);

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    const profilePath = user?._id ? '/user-menu' : '/login';

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 shadow-[0_-4px_25px_rgba(0,0,0,0.05)] z-[100] pb-safe transition-all duration-300">
            <div className="flex h-16 items-center justify-around px-2">
                
                <Link
                    to="/"
                    onMouseEnter={() => prefetchRoute('/')}
                    onTouchStart={() => prefetchRoute('/')}
                    className="flex-1 flex flex-col items-center justify-center gap-1 group transition-colors h-full"
                >
                    <div className={`relative flex items-center justify-center rounded-2xl p-1.5 transition-all duration-300 active:scale-90 ${isActive('/') ? 'text-orange-600' : 'text-slate-400 group-hover:text-slate-800'}`}>
                        <FaHome size={20} className={`transition-all ${isActive('/') ? 'scale-110' : ''}`} />
                    </div>
                    <span className={`text-[10px] font-semibold transition-all ${isActive('/') ? 'text-orange-600' : 'text-slate-400'}`}>
                        Home
                    </span>
                </Link>

                <button
                    type="button"
                    onMouseEnter={() => prefetchRoute('/categories')}
                    onTouchStart={() => prefetchRoute('/categories')}
                    onClick={() => navigate('/categories')}
                    className="group flex h-full flex-1 flex-col items-center justify-center gap-1 transition-colors"
                >
                    <div className={`flex items-center justify-center rounded-2xl p-1.5 transition-all ${isActive('/categories') ? 'text-orange-600' : 'text-slate-400 group-hover:text-slate-800'}`}>
                        <FaGrip size={20} />
                    </div>
                    <span className={`text-[10px] font-semibold transition-all ${isActive('/categories') ? 'text-orange-600' : 'text-slate-400'}`}>
                        Categories
                    </span>
                </button>

                <Link
                    to="/safety-tips"
                    onMouseEnter={() => prefetchRoute('/safety-tips')}
                    onTouchStart={() => prefetchRoute('/safety-tips')}
                    className="flex-1 flex flex-col items-center justify-center gap-1 group transition-colors h-full"
                >
                    <div className={`flex items-center justify-center rounded-2xl p-1.5 transition-all ${isActive('/safety-tips') ? 'text-orange-600' : 'text-slate-400 group-hover:text-slate-800'}`}>
                        <FaShieldHalved size={19} />
                    </div>
                    <span className={`text-[10px] font-semibold transition-all ${isActive('/safety-tips') ? 'text-orange-600' : 'text-slate-400'}`}>
                        Safety
                    </span>
                </Link>

                <Link
                    to="/cart"
                    onMouseEnter={() => prefetchRoute('/cart')}
                    onTouchStart={() => prefetchRoute('/cart')}
                    className="flex-1 flex flex-col items-center justify-center gap-1 group transition-colors h-full"
                >
                    <div className={`relative flex items-center justify-center rounded-2xl p-1.5 transition-all duration-300 active:scale-90 ${isActive('/cart') ? 'text-orange-600' : 'text-slate-400 group-hover:text-slate-800'}`}>
                        <FaCartShopping size={20} className={`transition-all ${isActive('/cart') ? 'scale-110' : ''}`} />
                        {totalQty > 0 && (
                            <span className="absolute -top-1 -right-1 bg-gradient-to-r from-rose-500 to-amber-500 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center ring-2 ring-white animate-in zoom-in shadow-xs">
                                {totalQty > 99 ? '99+' : totalQty}
                            </span>
                        )}
                    </div>
                    <span className={`text-[10px] font-semibold transition-all ${isActive('/cart') ? 'text-orange-600' : 'text-slate-400'}`}>
                        Cart
                    </span>
                </Link>

                <Link to={profilePath} className="flex-1 flex flex-col items-center justify-center gap-1 group transition-colors h-full">
                    <div className={`relative flex items-center justify-center rounded-2xl p-1.5 transition-all duration-300 active:scale-90 ${isActive('/user-menu') || isActive('/dashboard') ? 'text-orange-600' : 'text-slate-400 group-hover:text-slate-800'}`}>
                        <FaUser size={19} className="transition-all" />
                    </div>
                    <span className={`text-[10px] font-semibold transition-all ${isActive('/user-menu') || isActive('/dashboard') ? 'text-orange-600' : 'text-slate-400'}`}>
                        Profile
                    </span>
                </Link>
            </div>
        </nav>
    );
};

export default BottomNavigationBar;
