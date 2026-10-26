import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBell, FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes, FaBox, FaMotorcycle, FaTrash } from 'react-icons/fa';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import toast from 'react-hot-toast';

const DeliveryNotifications = () => {
    const [selectedNotif, setSelectedNotif] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await Axios({
                ...SummaryApi.notification.get,
                params: { role: 'DELIVERY_BOY' }
            });
            if (res.data.success) {
                setNotifications(res.data.data);
            }
        } catch (error) {
            console.error("Fetch notifications error:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 10000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const handleRead = async (id) => {
        try {
            await Axios({
                url: `${SummaryApi.notification.markRead.url}/${id}`,
                method: SummaryApi.notification.markRead.method
            });
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
        } catch (error) {
            console.error("Mark read error:", error);
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        try {
            const res = await Axios({
                url: `${SummaryApi.notification.delete.url}/${id}`,
                method: SummaryApi.notification.delete.method
            });
            if (res.data.success) {
                setNotifications(prev => prev.filter(n => n._id !== id));
                toast.success("Notification deleted");
            }
        } catch (error) {
            console.error("Delete notification error:", error);
        }
    };

    const getIcon = (notif) => {
        const colorClass = notif.type === 'success' ? 'text-green-500' : notif.type === 'warning' ? 'text-amber-500' : 'text-blue-500';
        let icon = <FaBell />;
        if (notif.event === 'NEW_ORDER_AVAILABLE') icon = <FaBox />;
        if (notif.event === 'ORDER_OUT') icon = <FaMotorcycle />;

        return React.cloneElement(icon, { className: colorClass });
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + 
               date.toLocaleDateString([], { day: '2-digit', month: 'short' });
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className='p-4 lg:p-10 bg-gray-50 min-h-screen pb-24'
        >
            <div className='max-w-4xl mx-auto'>
                <div className='flex items-center justify-between mb-8'>
                    <div>
                        <h1 className='text-2xl font-black text-gray-900'>My Alerts</h1>
                        <p className='text-[10px] text-gray-400 font-black uppercase tracking-[2px] mt-1'>Delivery Partner Notifications</p>
                    </div>
                </div>

                <div className='grid grid-cols-1 gap-4'>
                    <AnimatePresence>
                        {notifications.map((notif) => (
                            <motion.div 
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                key={notif._id}
                                onClick={() => {
                                    setSelectedNotif(notif);
                                    if (!notif.read) handleRead(notif._id);
                                }}
                                className={`p-5 rounded-[2.5rem] border transition-all flex items-start gap-4 cursor-pointer relative
                                    ${notif.read ? 'bg-white border-gray-100' : 'bg-white border-blue-100 shadow-xl shadow-blue-50'}`}
                            >
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg shrink-0
                                    ${notif.type === 'success' ? 'bg-green-50' : notif.type === 'warning' ? 'bg-amber-50' : 'bg-blue-50'}`}>
                                    {getIcon(notif)}
                                </div>
                                <div className='flex-1 pr-6'>
                                    <h3 className={`font-black text-gray-900 text-base ${notif.read ? 'opacity-60' : ''}`}>{notif.title}</h3>
                                    <p className={`text-xs text-gray-500 font-medium mt-1 leading-relaxed ${notif.read ? 'opacity-60' : ''}`}>{notif.message}</p>
                                    <span className='text-[9px] font-black text-gray-400 uppercase tracking-widest mt-2 block'>{formatTime(notif.createdAt)}</span>
                                </div>
                                
                                <div className='flex flex-col items-end gap-3'>
                                    {!notif.read && (
                                        <div className='w-2 h-2 bg-blue-600 rounded-full animate-ping' />
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {notifications.length === 0 && !loading && (
                    <div className='text-center py-20 bg-white rounded-[3rem] border border-dashed border-gray-200'>
                        <FaBell size={40} className='mx-auto text-gray-100 mb-4' />
                        <p className='text-gray-400 font-black uppercase tracking-widest text-sm'>No new alerts</p>
                    </div>
                )}

                {loading && (
                    <div className='space-y-4'>
                        {[1, 2, 3].map(i => (
                            <div key={i} className='h-24 bg-white border border-gray-100 rounded-[2.5rem] animate-pulse' />
                        ))}
                    </div>
                )}
            </div>

            <AnimatePresence>
                {selectedNotif && (
                    <div className='fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm'>
                        <motion.div 
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 50, opacity: 0 }}
                            className='bg-white rounded-[3rem] w-full max-w-sm overflow-hidden shadow-2xl'
                        >
                            <div className='p-8'>
                                <div className='flex justify-between items-start mb-6'>
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl 
                                        ${selectedNotif.type === 'success' ? 'bg-green-50' : selectedNotif.type === 'warning' ? 'bg-amber-50' : 'bg-blue-50'}`}>
                                        {getIcon(selectedNotif)}
                                    </div>
                                    <button 
                                        onClick={() => setSelectedNotif(null)}
                                        className='p-3 hover:bg-gray-100 rounded-2xl transition-all'
                                    >
                                        <FaTimes className='text-gray-400' />
                                    </button>
                                </div>
                                
                                <h2 className='text-xl font-black text-gray-900 mb-2'>{selectedNotif.title}</h2>
                                <p className='text-[10px] font-black text-blue-600 uppercase tracking-widest mb-6'>{formatTime(selectedNotif.createdAt)}</p>
                                
                                <div className='bg-gray-50 rounded-[2rem] p-6 border border-gray-100'>
                                    <p className='text-sm text-gray-600 leading-relaxed font-bold'>
                                        {selectedNotif.details || selectedNotif.message}
                                    </p>
                                </div>

                                <button 
                                    onClick={() => setSelectedNotif(null)}
                                    className='w-full bg-gray-900 text-white font-black uppercase tracking-widest text-xs py-5 rounded-3xl mt-8 hover:bg-gray-800 transition-all active:scale-[0.98]'
                                >
                                    Dismiss
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default DeliveryNotifications;
