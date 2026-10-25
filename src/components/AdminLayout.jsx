import React, { useState } from 'react'
import { Outlet, Navigate, NavLink, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { logout } from '../store/userSlice'
import { clearCartItem } from '../store/cartProduct'
import { clearAddress } from '../store/addressSlice'
import { clearOrder } from '../store/orderSlice'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import toast, { Toaster } from 'react-hot-toast'
import isAdmin from '../utils/isAdmin'
import {
    FaChartLine, FaBoxOpen, FaLayerGroup, FaClipboardList,
    FaUsers, FaMotorcycle, FaBars, FaTimes, FaImage, FaStar, FaBell, FaGift
} from 'react-icons/fa'
import { MdOutlineCategory, MdOutlineDashboardCustomize } from 'react-icons/md'
import { RiCoupon2Line } from 'react-icons/ri'
import traceLogo from '../assets/image.png'

const navItems = [
    { to: '/admin-portal/dashboard',       icon: <FaChartLine />,              label: 'Dashboard' },
    { to: '/admin-portal/category',        icon: <MdOutlineCategory />,        label: 'Category' },
    { to: '/admin-portal/subcategory',     icon: <FaLayerGroup />,             label: 'Sub Category' },
    { to: '/admin-portal/upload-product',  icon: <MdOutlineDashboardCustomize />, label: 'Upload Product' },
    { to: '/admin-portal/product',         icon: <FaBoxOpen />,                label: 'Products' },
    { to: '/admin-portal/orders',          icon: <FaClipboardList />,          label: 'Orders' },
    { to: '/admin-portal/banners',         icon: <FaImage />,                  label: 'Banners' },
    { to: '/admin-portal/festival-offers', icon: <FaGift />,                   label: 'Festival Offers' },
    { to: '/admin-portal/manage-users',    icon: <FaUsers />,                  label: 'Manage Users' },
    { to: '/admin-portal/coupons',         icon: <RiCoupon2Line />,            label: 'Coupons' },
    { to: '/admin-portal/reviews',         icon: <FaStar />,                   label: 'Reviews' },
    { to: '/admin-portal/notifications',   icon: <FaBell />,                   label: 'Notifications' },
]

const AdminLayout = () => {
    const user = useSelector(state => state.user)
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    if (!localStorage.getItem('accessToken')) {

        return <Navigate to="/login" replace />
    }
    
    if (user?._id && !isAdmin(user?.role)) {
        return <Navigate to="/" replace />
    }

    const handleLogout = async () => {
        try {
            const res = await Axios({ ...SummaryApi.logout })
            if (res?.data?.success) {
                dispatch(logout())
                dispatch(clearCartItem())
                dispatch(clearAddress())
                dispatch(clearOrder())
                localStorage.removeItem('accessToken')

                localStorage.removeItem('refreshToken')
                toast.success('Logged out successfully')
                navigate('/login')
            }
        } catch {
            toast.error('Logout failed')
        }
    }

    const displayName = user?.name || user?.email || 'Admin'
    const initial = displayName?.charAt(0)?.toUpperCase()

    const navLinkClass = ({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
            isActive
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`

    const Sidebar = () => (
        <aside className="flex flex-col h-full bg-white border-r border-gray-100">
            <div className="flex h-28 shrink-0 items-center justify-center border-b border-gray-100 px-6 py-5">
                <img src={traceLogo} alt="Trace" className="h-auto max-h-20 w-full max-w-48 object-contain" />
            </div>

            {/* Nav Items */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-3 mb-3">Navigation</p>
                {navItems.map(item => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={navLinkClass}
                        onClick={() => setSidebarOpen(false)}
                    >
                        <span className="text-base">{item.icon}</span>
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            {/* Logout */}
            <div className="px-3 pb-6 pt-3 border-t border-gray-100">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-600 font-black text-sm hover:bg-red-50 transition-all"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                </button>
            </div>
        </aside>
    )

    return (
        <div className="trace-fire-theme min-h-screen bg-[#f7f8fc] flex">
            <Toaster />

            {/* Desktop Sidebar */}
            <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:z-50">
                <Sidebar />
            </div>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div className="lg:hidden fixed inset-0 z-50 flex">
                    <div
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() => setSidebarOpen(false)}
                    />
                    <div className="relative w-72 flex flex-col bg-white h-full z-10 shadow-2xl">
                        <Sidebar />
                    </div>
                </div>
            )}

            {/* Main content area */}
            <div className="flex-1 lg:ml-64 flex flex-col min-h-screen overflow-x-hidden">
                <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
                    <div className="px-4 lg:px-8 py-3 flex items-center justify-between">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-all"
                        >
                            <FaBars className="text-lg" />
                        </button>
                        <div className="hidden lg:block">
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Trace Admin Panel</p>
                        </div>
                        <div className="flex items-center gap-3 ml-auto">
                            <button
                                onClick={() => navigate('/admin-portal/notifications')}
                                className="relative p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all active:scale-95"
                            >
                                <FaBell className="text-lg" />
                                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
                            </button>
                            <div className="hidden sm:flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-2xl px-3 py-2">
                                <div className="w-6 h-6 bg-linear-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-xs font-black">
                                    {initial}
                                </div>
                                <span className="text-xs font-bold text-gray-700 max-w-[120px] truncate">{displayName}</span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-black text-[10px] uppercase tracking-widest px-3 py-2.5 rounded-xl transition-all border border-red-100"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"
                                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Logout
                            </button>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

export default AdminLayout
