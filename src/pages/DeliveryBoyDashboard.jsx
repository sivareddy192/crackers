import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Axios from '../utils/Axios'
import { motion, AnimatePresence } from 'framer-motion'
import { FaMotorcycle, FaMapMarkerAlt, FaPhoneAlt, FaCheckCircle, FaSpinner, FaExternalLinkAlt, FaBox, FaQrcode } from 'react-icons/fa'
import toast from 'react-hot-toast'
import SummaryApi from '../common/SummaryApi'
import QRScanner from '../components/QRScanner'
import { getImageUrl } from '../utils/getImageUrl'

const statusSteps = [
    "Confirmed",
    "Shipped",
    "Out for Delivery",
    "Delivered",
];

const DeliveryBoyDashboard = () => {
    const navigate = useNavigate()
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [otpInput, setOtpInput] = useState({}) 
    const [verifying, setVerifying] = useState({})
    const [sendingOtp, setSendingOtp] = useState({})
    
    const [showScanner, setShowScanner] = useState(false)
    const [scanning, setScanning] = useState(false)

    const handleScanAssign = async (orderId) => {
        if (scanning) return;
        setScanning(true);
        try {
            const res = await Axios({
                ...SummaryApi.order.scanAssignOrder,
                data: { orderId }
            });
            if (res.data.success) {
                toast.success(res.data.message);
                setShowScanner(false);
                fetchMyOrders();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Assignment failed");
        } finally {
            setScanning(false);
        }
    }

    const fetchMyOrders = async () => {
        try {
            const res = await Axios({ url: '/api/delivery-boy/my-orders', method: 'get' })
            setOrders(res.data.data || [])
        } catch (err) {
            toast.error("Failed to load orders")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchMyOrders()
        const interval = setInterval(fetchMyOrders, 10000) 
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        if (!("geolocation" in navigator)) return;

        const updateLocation = async (position) => {
            try {
                await Axios({
                    url: '/api/delivery-boy/update-location',
                    method: 'put',
                    data: {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    }
                });
            } catch (err) {
            }
        }

        const watchId = navigator.geolocation.watchPosition(
            updateLocation,
            (err) => console.error("GPS error:", err),
            {
                enableHighAccuracy: true,
                timeout: 20000,
                maximumAge: 10000
            }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);


    const groupedOrders = useMemo(() => {
        const groups = {};
        orders.forEach(order => {
            if (!groups[order.orderId]) {
                groups[order.orderId] = {
                    ...order,
                    items: []
                };
            }
            groups[order.orderId].items.push(order);
        });
        return Object.values(groups);
    }, [orders]);

    const stats = useMemo(() => {
        const delivered = groupedOrders.filter(o => o.status === 'Delivered').length;
        const totalProfit = delivered * 50; 

        return {
            delivered,
            totalProfit,
            totalAssigned: groupedOrders.length
        }
    }, [groupedOrders]);

    const updateStatus = async (orderId, status) => {
        if (status === "Delivered") {
            toast.error("Use OTP for Delivery")
            return
        }

        const previousOrders = [...orders];
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status } : o));
        
        try {
            await Axios({
                url: '/api/delivery-boy/update-status',
                method: 'put',
                data: { orderId, status }
            })
            toast.success(`Updated to ${status}`)
            fetchMyOrders()
        } catch (err) {
            setOrders(previousOrders);
            toast.error("Update failed")
        }
    }


    const handleSendOTP = async (orderId) => {
        setSendingOtp(prev => ({ ...prev, [orderId]: true }))
        try {
            const res = await Axios({
                ...SummaryApi.deliveryBoy.sendOtp,
                data: { orderId }
            })
            toast.success(res.data.message || "OTP sent")
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to send OTP")
        } finally {
            setSendingOtp(prev => ({ ...prev, [orderId]: false }))
        }
    }

    const handleVerifyOTP = async (orderId) => {
        if (!otpInput[orderId]) return toast.error("Enter OTP")
        setVerifying(prev => ({ ...prev, [orderId]: true }))
        try {
            const res = await Axios({
                ...SummaryApi.deliveryBoy.verifyOtp,
                data: { orderId, otp: otpInput[orderId] }
            })
            if (res.data.success) {
                toast.success("Delivered!")
                setOtpInput(prev => {
                    const newState = { ...prev }; delete newState[orderId]; return newState
                })
                fetchMyOrders()
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Invalid OTP")
        } finally {
            setVerifying(prev => ({ ...prev, [orderId]: false }))
        }
    }

    const formatAddress = (order) => {
        const addr = order.delivery_address || order.address;
        if (!addr) return "No Address";
        return `${addr.address_line || addr.street || ''}, ${addr.city || ''}`;
    }

    if (loading) return (
        <div className='min-h-screen p-4 space-y-6 bg-gray-50'>
            <div className='h-32 bg-white rounded-3xl animate-pulse' />
            <div className='grid grid-cols-3 gap-3'>
                <div className='h-24 bg-white rounded-3xl animate-pulse' />
                <div className='h-24 bg-white rounded-3xl animate-pulse' />
                <div className='h-24 bg-white rounded-3xl animate-pulse' />
            </div>
            <div className='h-64 bg-white rounded-[2rem] animate-pulse' />
        </div>
    )

    return (
        <div className='min-h-screen bg-gray-50 pb-24'>
            <AnimatePresence>
                {showScanner && (
                    <QRScanner 
                        onScan={handleScanAssign} 
                        onClose={() => setShowScanner(false)} 
                    />
                )}
            </AnimatePresence>


            <div className='bg-white rounded-b-[2.5rem] shadow-sm p-6 lg:p-10 mb-6'>
                <div className='max-w-5xl mx-auto'>
                    <div className='flex items-center justify-between mb-8'>
                        <div>
                            <h1 className='text-2xl font-black text-gray-900'>Delivery Panel</h1>
                            <p className='text-[10px] text-gray-400 font-black uppercase tracking-[2px] mt-1'>Trace Logistics</p>
                        </div>
                        <div className='w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-gray-200'>
                            <FaMotorcycle size={20}/>
                        </div>
                    </div>

                    <div className='grid grid-cols-3 gap-3 lg:gap-6'>
                        <div className='bg-blue-50 p-4 rounded-3xl border border-blue-100 text-center'>
                            <p className='text-[9px] font-black text-blue-400 uppercase mb-1'>Total</p>
                            <p className='text-xl font-black text-blue-700'>{stats.totalAssigned}</p>
                        </div>
                        <div className='bg-green-50 p-4 rounded-3xl border border-green-100 text-center'>
                            <p className='text-[9px] font-black text-green-400 uppercase mb-1'>Done</p>
                            <p className='text-xl font-black text-green-700'>{stats.delivered}</p>
                        </div>
                        <div className='bg-gray-900 p-4 rounded-3xl text-center text-white shadow-xl shadow-gray-200'>
                            <p className='text-[9px] font-black text-gray-500 uppercase mb-1'>Profit</p>
                            <p className='text-xl font-black'>₹{stats.totalProfit}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className='px-4 max-w-5xl mx-auto'>
                <div className='flex items-center justify-between mb-4 px-2'>
                    <h2 className='text-[10px] font-black text-gray-400 uppercase tracking-[3px]'>Assigned Orders</h2>
                    <span className='bg-white px-3 py-1 rounded-full text-[9px] font-black text-gray-900 border border-gray-100 shadow-sm'>ACTIVE: {orders.length}</span>
                </div>

                {orders.length === 0 && (
                    <div className='bg-white p-12 rounded-[2.5rem] text-center border-2 border-dashed border-gray-100 mt-4'>
                        <div className='w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4'>
                            <FaBox className='text-gray-200 text-3xl'/>
                        </div>
                        <h3 className='text-gray-400 font-black uppercase tracking-widest text-sm'>No assignments</h3>
                        <p className='text-[10px] text-gray-300 font-bold uppercase mt-2'>Scan an order QR to start delivering</p>
                    </div>
                )}

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6'>
                    {groupedOrders.map((order) => (
                        <motion.div 
                            layout
                            key={order.orderId} 
                            className={`bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-50 flex flex-col justify-between cursor-pointer active:scale-[0.98] transition-all ${order.status === 'Delivered' ? 'opacity-60 grayscale-[0.5]' : ''}`}
                            onClick={() => navigate(`/delivery-portal/order/${order.orderId}`)}
                        >
                            <div className='flex justify-between items-start mb-4'>
                                <div className='flex gap-4'>
                                    <div className='w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 flex-shrink-0'>
                                        <FaBox className='text-gray-200 text-2xl'/>
                                    </div>
                                    <div>
                                        <div className='flex items-center gap-2'>
                                            <h3 className='font-black text-lg text-gray-900 tracking-tight leading-none'>#{order.orderId.slice(-6)}</h3>
                                            <span className='bg-gray-900 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase'>₹{order.totalAmt}</span>
                                        </div>
                                        <p className='text-[11px] font-black text-indigo-600 mt-1 uppercase tracking-wider'>
                                            {order.items.length} {order.items.length === 1 ? 'Item' : 'Items'}
                                            <span className='text-gray-400 ml-1'>• View Details</span>
                                        </p>
                                        <p className='text-[9px] text-gray-400 font-bold uppercase mt-0.5 tracking-widest'>Client: {order.userId?.name || "User"}</p>
                                        {order.deliveryDate && (
                                            <p className='text-[9px] text-green-600 font-black uppercase mt-1 tracking-wider'>🚚 Delivery Date: {new Date(order.deliveryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                        )}
                                    </div>

                                </div>
                                <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                    order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                    {order.status}
                                </div>
                            </div>

                            <div className='bg-gray-50 rounded-2xl p-4 border border-gray-100 flex items-center justify-between'>
                                <div className='flex items-center gap-3 overflow-hidden'>
                                    <FaMapMarkerAlt className='text-red-500 text-[10px] shrink-0'/>
                                    <p className='text-[11px] font-black text-gray-700 truncate uppercase'>{formatAddress(order)}</p>
                                </div>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const addr = order.delivery_address || order.address;
                                        const fullAddr = `${addr.address_line || addr.street}, ${addr.city}`;
                                        window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddr)}`, '_blank');
                                    }}
                                    className='p-2 bg-white rounded-lg shadow-sm border border-gray-100 text-blue-600 hover:bg-blue-600 hover:text-white transition-all'
                                >
                                    <FaExternalLinkAlt size={10}/>
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            <button 
                onClick={() => setShowScanner(true)}
                className='fixed bottom-8 right-6 w-16 h-16 bg-gray-900 text-white rounded-3xl flex items-center justify-center shadow-2xl z-50 hover:scale-110 active:scale-95 transition-all'
            >
                <FaQrcode size={24}/>
                <div className='absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-4 border-gray-50 animate-pulse'/>
            </button>
        </div>
    )
}

export default DeliveryBoyDashboard
