import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Axios from '../utils/Axios'
import { motion, AnimatePresence } from 'framer-motion'
import { 
    FaMotorcycle, 
    FaMapMarkerAlt, 
    FaPhoneAlt, 
    FaCheckCircle, 
    FaSpinner, 
    FaBox, 
    FaQrcode,
    FaDirections
} from 'react-icons/fa'
import toast from 'react-hot-toast'
import SummaryApi from '../common/SummaryApi'
import QRScanner from '../components/QRScanner'

function calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`;
}

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
    const [showScanner, setShowScanner] = useState(false)
    const [scanning, setScanning] = useState(false)
    const [deliveryCoords, setDeliveryCoords] = useState(null)

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

    // Real-time GPS location tracking & broadcast
    useEffect(() => {
        if (!("geolocation" in navigator)) return;

        const updateLocation = async (position) => {
            const { latitude, longitude } = position.coords;
            setDeliveryCoords([latitude, longitude]);
            try {
                await Axios({
                    url: '/api/delivery-boy/update-location',
                    method: 'put',
                    data: { latitude, longitude }
                });
            } catch (err) {
                // silent sync error
            }
        }

        const watchId = navigator.geolocation.watchPosition(
            updateLocation,
            (err) => console.warn("GPS watch warning:", err.message),
            {
                enableHighAccuracy: true,
                timeout: 20000,
                maximumAge: 5000
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

    const formatAddress = (order) => {
        const addr = order.delivery_address || order.address;
        if (!addr) return "No Address";
        return `${addr.address_line || addr.street || ''}, ${addr.city || ''}`;
    }

    if (loading) return (
        <div className='min-h-screen p-4 space-y-6 bg-gray-50 animate-pulse'>
            <div className='h-32 bg-white rounded-3xl' />
            <div className='grid grid-cols-3 gap-3'>
                <div className='h-24 bg-white rounded-3xl' />
                <div className='h-24 bg-white rounded-3xl' />
                <div className='h-24 bg-white rounded-3xl' />
            </div>
            <div className='h-64 bg-white rounded-[2rem]' />
        </div>
    )

    return (
        <div className='min-h-screen bg-gray-50 pb-28'>
            <AnimatePresence>
                {showScanner && (
                    <QRScanner 
                        onScan={handleScanAssign} 
                        onClose={() => setShowScanner(false)} 
                    />
                )}
            </AnimatePresence>

            {/* Dashboard Header */}
            <div className='bg-white rounded-b-[2.5rem] shadow-sm p-6 lg:p-10 mb-6 border-b border-gray-100'>
                <div className='max-w-5xl mx-auto'>
                    <div className='flex items-center justify-between mb-6'>
                        <div>
                            <h1 className='text-2xl font-black text-gray-900'>Delivery Panel</h1>
                            <p className='text-[10px] text-gray-400 font-black uppercase tracking-[2px] mt-1'>Trace Logistics</p>
                        </div>
                        <div className='flex items-center gap-3'>
                            {deliveryCoords ? (
                                <div className='hidden sm:flex items-center gap-2 bg-green-50 text-green-700 px-3.5 py-2 rounded-2xl border border-green-200 text-[10px] font-black uppercase tracking-wider'>
                                    <span className='w-2 h-2 rounded-full bg-green-500 animate-ping' />
                                    GPS Active
                                </div>
                            ) : (
                                <div className='hidden sm:flex items-center gap-2 bg-amber-50 text-amber-700 px-3.5 py-2 rounded-2xl border border-amber-200 text-[10px] font-black uppercase tracking-wider'>
                                    <span className='w-2 h-2 rounded-full bg-amber-500' />
                                    Acquiring GPS…
                                </div>
                            )}
                            <div className='w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-gray-200'>
                                <FaMotorcycle size={20}/>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
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
                            <p className='text-[9px] font-black text-gray-400 uppercase mb-1'>Earnings</p>
                            <p className='text-xl font-black text-green-400'>₹{stats.totalProfit}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className='px-4 max-w-5xl mx-auto space-y-4'>
                <div className='flex items-center justify-between px-2'>
                    <div className='flex items-center gap-2'>
                        <h2 className='text-[10px] font-black text-gray-400 uppercase tracking-[3px]'>Assigned Deliveries</h2>
                        <span className='bg-white px-2.5 py-0.5 rounded-full text-[9px] font-black text-gray-900 border border-gray-100 shadow-xs'>
                            {groupedOrders.length}
                        </span>
                    </div>
                </div>

                {/* Empty State */}
                {groupedOrders.length === 0 && (
                    <div className='bg-white p-12 rounded-[2.5rem] text-center border-2 border-dashed border-gray-100 mt-4'>
                        <div className='w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4'>
                            <FaBox className='text-gray-200 text-3xl'/>
                        </div>
                        <h3 className='text-gray-400 font-black uppercase tracking-widest text-sm'>No assignments</h3>
                        <p className='text-[10px] text-gray-300 font-bold uppercase mt-2'>Scan an order QR code to start delivering</p>
                    </div>
                )}

                {/* Order Cards Grid */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6'>
                    {groupedOrders.map((order) => {
                        const addr = order.delivery_address || order.address;
                        const hasCoords = addr?.latitude && addr?.longitude;
                        const clientPhone = addr?.mobile || order.userId?.mobile;

                        const distance = (hasCoords && deliveryCoords) 
                            ? calculateDistance(deliveryCoords[0], deliveryCoords[1], addr.latitude, addr.longitude)
                            : null;

                        const navUrl = hasCoords 
                            ? `https://www.google.com/maps/dir/?api=1&destination=${addr.latitude},${addr.longitude}&travelmode=driving`
                            : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(formatAddress(order))}&travelmode=driving`;

                        return (
                            <motion.div 
                                layout
                                key={order.orderId} 
                                className={`bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100 flex flex-col justify-between cursor-pointer active:scale-[0.99] transition-all hover:border-indigo-100 hover:shadow-md ${
                                    order.status === 'Delivered' ? 'opacity-65 grayscale-[0.4]' : ''
                                }`}
                                onClick={() => navigate(`/delivery-portal/order/${order.orderId}`)}
                            >
                                <div>
                                    {/* Card Top */}
                                    <div className='flex justify-between items-start mb-4'>
                                        <div className='flex gap-4'>
                                            <div className='w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100 flex-shrink-0 text-indigo-600'>
                                                <FaBox size={22}/>
                                            </div>
                                            <div>
                                                <div className='flex items-center gap-2'>
                                                    <h3 className='font-black text-lg text-gray-900 tracking-tight leading-none'>
                                                        #{order.orderId.slice(-6).toUpperCase()}
                                                    </h3>
                                                    <span className='bg-gray-900 text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase'>
                                                        ₹{order.totalAmt}
                                                    </span>
                                                </div>
                                                <p className='text-[11px] font-black text-indigo-600 mt-1 uppercase tracking-wider'>
                                                    {order.items.length} {order.items.length === 1 ? 'Item' : 'Items'}
                                                    <span className='text-gray-400 ml-1'>• Tap for Details</span>
                                                </p>
                                                <p className='text-[9px] text-gray-500 font-bold uppercase mt-0.5 tracking-wider'>
                                                    Client: {order.userId?.name || "Customer"}
                                                </p>
                                                {order.deliveryDate && (
                                                    <p className='text-[9px] text-green-600 font-black uppercase mt-1 tracking-wider'>
                                                        🚚 Expected: {new Date(order.deliveryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                            order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 
                                            order.status === 'Out for Delivery' ? 'bg-indigo-100 text-indigo-700' :
                                            'bg-blue-100 text-blue-700'
                                        }`}>
                                            {order.status}
                                        </div>
                                    </div>

                                    {/* Live Distance Tag */}
                                    {distance && (
                                        <div className='mb-3 flex items-center gap-2'>
                                            <span className='bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5'>
                                                <FaDirections size={10} /> {distance} away
                                            </span>
                                        </div>
                                    )}

                                    {/* Address Display */}
                                    <div className='bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-4'>
                                        <div className='flex items-start gap-3'>
                                            <FaMapMarkerAlt className='text-red-500 text-xs shrink-0 mt-0.5'/>
                                            <p className='text-[11px] font-bold text-gray-700 leading-snug line-clamp-2 uppercase'>
                                                {formatAddress(order)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Action Buttons */}
                                <div className='grid grid-cols-2 gap-2 pt-2 border-t border-gray-50' onClick={(e) => e.stopPropagation()}>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            window.open(navUrl, '_blank');
                                        }}
                                        className='py-3 px-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm hover:opacity-95 active:scale-95 transition-all'
                                    >
                                        <FaDirections size={12}/> NAVIGATE
                                    </button>

                                    {clientPhone ? (
                                        <a 
                                            href={`tel:${clientPhone}`}
                                            className='py-3 px-3 bg-white border border-gray-200 text-gray-900 rounded-2xl font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-gray-50 active:scale-95 transition-all'
                                        >
                                            <FaPhoneAlt size={10} className='text-blue-600'/> CALL
                                        </a>
                                    ) : (
                                        <button 
                                            onClick={() => navigate(`/delivery-portal/order/${order.orderId}`)}
                                            className='py-3 px-3 bg-gray-100 text-gray-700 rounded-2xl font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5'
                                        >
                                            DETAILS
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Floating QR Scanner Button */}
            <button 
                onClick={() => setShowScanner(true)}
                className='fixed bottom-8 right-6 w-16 h-16 bg-gray-900 text-white rounded-3xl flex items-center justify-center shadow-2xl z-50 hover:scale-110 active:scale-95 transition-all'
                title="Scan Order QR"
            >
                <FaQrcode size={24}/>
                <div className='absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-4 border-gray-50 animate-pulse'/>
            </button>
        </div>
    )
}

export default DeliveryBoyDashboard
