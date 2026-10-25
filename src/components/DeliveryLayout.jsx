import React from 'react'
import { Outlet, Navigate, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { FaMotorcycle, FaBell } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import { logout } from '../store/userSlice'
import { clearCartItem } from '../store/cartProduct'
import { clearAddress } from '../store/addressSlice'
import { clearOrder } from '../store/orderSlice'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import toast, { Toaster } from 'react-hot-toast'
import isDeliveryBoy from '../utils/isDeliveryBoy'

const DeliveryLayout = () => {
    const user = useSelector(state => state.user)
    const dispatch = useDispatch()
    const navigate = useNavigate()

    if (!localStorage.getItem('accessToken')) {
        return <Navigate to="/login" replace />
    }

    if (user?._id && !isDeliveryBoy(user?.role)) {
        return <Navigate to="/dashboard/profile" replace />
    }

    const handleLogout = async () => {
        try {
            const response = await Axios({ ...SummaryApi.logout })
            if (response?.data?.success) {
                dispatch(logout())
                dispatch(clearCartItem())
                dispatch(clearAddress())
                dispatch(clearOrder())
                localStorage.removeItem('accessToken')

                localStorage.removeItem('refreshToken')
                toast.success('Logged out successfully')
                navigate('/login')
            }
        } catch (error) {
            toast.error('Logout failed')
        }
    }

    const displayName = user?.name || user?.mobile || 'Delivery Boy'
    const initial = displayName?.charAt(0)?.toUpperCase()

    return (
        <div className="trace-fire-theme min-h-screen bg-[#f4f6f9] flex flex-col">
            <Toaster />

            {/* Top Nav Bar */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
                <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                    {/* Brand */}
                    <Link to="/delivery-portal/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer">
                        <div className="w-10 h-10 bg-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-100">
                            <FaMotorcycle className="text-white text-lg" />
                        </div>
                        <div>
                            <h1 className="font-black text-gray-800 text-base leading-none">Trace Delivery</h1>
                            <p className="text-[9px] text-green-600 font-black uppercase tracking-widest flex items-center gap-1 mt-0.5">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                Live Dashboard
                            </p>
                        </div>
                    </Link>

                    {/* Right side */}
                    <div className="flex items-center gap-3">
                        <Link 
                            to="/delivery-portal/notifications"
                            className="relative w-10 h-10 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm"
                        >
                            <FaBell />
                            <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
                        </Link>

                        {/* Avatar + Name */}
                        <div className="hidden sm:flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-2xl px-3 py-2">
                            <div className="w-7 h-7 bg-linear-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-sm">
                                {initial}
                            </div>
                            <span className="text-xs font-bold text-gray-700 max-w-[120px] truncate">{displayName}</span>
                            <span className="text-[8px] font-black text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                Delivery
                            </span>
                        </div>

                        {/* Logout */}
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-black text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-2xl transition-all border border-red-100"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Page Content */}
            <main className="flex-1">
                <Outlet />
            </main>
        </div>
    )
}

export default DeliveryLayout
