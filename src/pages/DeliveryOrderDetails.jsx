import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import { motion } from 'framer-motion';
import { 
    FaArrowLeft, 
    FaPhoneAlt, 
    FaMapMarkerAlt, 
    FaUser, 
    FaReceipt, 
    FaCheckCircle, 
    FaSpinner, 
    FaDirections, 
    FaWhatsapp, 
    FaRoute,
    FaCompass
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import { getImageUrl } from '../utils/getImageUrl';
import Skeleton from '../components/Skeleton';

// Haversine distance calculator in km / meters
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

// Estimated driving time (avg 25 km/h in city traffic)
function estimateDriveTime(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    const mins = Math.max(1, Math.round((d / 25) * 60));
    return `~${mins} min${mins > 1 ? 's' : ''}`;
}

const statusSteps = ["Confirmed", "Shipped", "Out for Delivery", "Delivered"];

const DeliveryOrderDetails = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [orderItems, setOrderItems] = useState([]);
    const [mainOrder, setMainOrder] = useState({});
    const [loading, setLoading] = useState(true);
    const [otpInput, setOtpInput] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [sendingOtp, setSendingOtp] = useState(false);

    // Live tracking states
    const [deliveryCoords, setDeliveryCoords] = useState(null);
    const [customerCoords, setCustomerCoords] = useState(null);
    const [coordSource, setCoordSource] = useState(null);

    const fetchOrderDetails = async () => {
        try {
            const res = await Axios({
                url: `${SummaryApi.order.getOrderItems.url}/${orderId}`,
                method: SummaryApi.order.getOrderItems.method
            });
            if (res.data?.success) {
                setOrderItems(res.data.data || []);
                if (res.data.data?.length > 0) {
                    setMainOrder(res.data.data[0]);
                }
            }
        } catch (err) {
            toast.error("Failed to load order details");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrderDetails();
    }, [orderId]);

    // Live GPS tracking of delivery boy
    useEffect(() => {
        if (!("geolocation" in navigator)) return;

        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                setDeliveryCoords([latitude, longitude]);
                Axios({
                    url: '/api/delivery-boy/update-location',
                    method: 'put',
                    data: { latitude, longitude }
                }).catch(() => {});
            },
            (err) => console.warn("GPS tracking warning:", err.message),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    // Resolve Customer Coordinates
    useEffect(() => {
        const addr = mainOrder.delivery_address || mainOrder.address;
        if (!addr) return;

        const dbLat = addr.latitude ? parseFloat(addr.latitude) : null;
        const dbLng = addr.longitude ? parseFloat(addr.longitude) : null;

        if (dbLat && dbLng && !isNaN(dbLat) && !isNaN(dbLng)) {
            setCustomerCoords([dbLat, dbLng]);
            setCoordSource("Exact GPS");
        }
    }, [mainOrder]);

    const clientMobile = mainOrder.delivery_address?.mobile || mainOrder.address?.phone || mainOrder.userId?.mobile || 'Not Available';
    const clientName = mainOrder.userId?.name || 'Customer';
    const totalAmount = orderItems.reduce((acc, curr) => acc + (curr.subTotalAmt || 0), 0);

    const fullAddressString = useMemo(() => {
        const addr = mainOrder.delivery_address || mainOrder.address;
        if (!addr) return "Address not specified";
        return [
            addr.address_line || addr.street,
            addr.city,
            addr.state,
            addr.pincode ? `- ${addr.pincode}` : ''
        ].filter(Boolean).join(', ');
    }, [mainOrder]);

    // Live distance & drive time
    const liveDistance = useMemo(() => {
        if (!deliveryCoords || !customerCoords) return null;
        return calculateDistance(deliveryCoords[0], deliveryCoords[1], customerCoords[0], customerCoords[1]);
    }, [deliveryCoords, customerCoords]);

    const liveDriveTime = useMemo(() => {
        if (!deliveryCoords || !customerCoords) return null;
        return estimateDriveTime(deliveryCoords[0], deliveryCoords[1], customerCoords[0], customerCoords[1]);
    }, [deliveryCoords, customerCoords]);

    // Open Turn-by-Turn GPS Navigation
    const handleOpenNavigation = () => {
        if (customerCoords) {
            const [lat, lng] = customerCoords;
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`, '_blank');
        } else {
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddressString)}&travelmode=driving`, '_blank');
        }
    };

    // Open WhatsApp
    const handleOpenWhatsApp = () => {
        if (!clientMobile || clientMobile === 'Not Available') return;
        const cleanNumber = String(clientMobile).replace(/\D/g, '');
        const formattedNumber = cleanNumber.startsWith('91') && cleanNumber.length === 12 ? cleanNumber : `91${cleanNumber.slice(-10)}`;
        const text = `Hello ${clientName}, this is your delivery partner from Trace Crackers regarding your order #${orderId.slice(-6).toUpperCase()}. I am on my way with your delivery!`;
        window.open(`https://wa.me/${formattedNumber}?text=${encodeURIComponent(text)}`, '_blank');
    };

    const updateStatus = async (status) => {
        if (status === "Delivered") {
            toast.error("Please use OTP verification for marking Delivered");
            return;
        }
        try {
            await Axios({
                url: '/api/delivery-boy/update-status',
                method: 'put',
                data: { orderId: mainOrder._id, status }
            });
            toast.success(`Status updated to ${status}`);
            fetchOrderDetails();
        } catch (err) {
            toast.error(err?.response?.data?.message || "Update failed");
        }
    };

    const handleSendOTP = async () => {
        setSendingOtp(true);
        try {
            const res = await Axios({
                ...SummaryApi.deliveryBoy.sendOtp,
                data: { orderId: mainOrder._id }
            });
            toast.success(res.data.message || "OTP sent successfully");
        } catch (err) {
            toast.error(err?.response?.data?.message || "Failed to send OTP");
        } finally {
            setSendingOtp(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!otpInput) return toast.error("Please enter the 6-digit OTP");
        setVerifying(true);
        try {
            const res = await Axios({
                ...SummaryApi.deliveryBoy.verifyOtp,
                data: { orderId: mainOrder._id, otp: otpInput }
            });
            if (res.data.success) {
                toast.success("Delivery completed successfully!");
                fetchOrderDetails();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Invalid OTP");
        } finally {
            setVerifying(false);
        }
    };

    if (loading) return (
        <div className='min-h-screen bg-gray-50 pb-32 animate-pulse'>
            <div className='bg-white px-6 py-6 border-b border-gray-100 flex items-center gap-4 sticky top-0 z-40'>
                <Skeleton className='w-8 h-8 rounded-xl' />
                <div className='space-y-2'>
                    <Skeleton className='h-5 w-32' />
                    <Skeleton className='h-3.5 w-20' />
                </div>
            </div>
            <div className='p-6 max-w-2xl mx-auto space-y-6'>
                <div className='bg-white rounded-[2.5rem] p-8 border border-gray-100 space-y-4 h-64 flex flex-col justify-between'>
                    <Skeleton className='h-4 w-40' />
                    <div className='space-y-2'>
                        <Skeleton className='h-8 w-full' />
                        <Skeleton className='h-8 w-2/3' />
                    </div>
                </div>
                <div className='bg-white rounded-[2.5rem] p-8 border border-gray-100 space-y-4 h-48 flex flex-col justify-between'>
                    <Skeleton className='h-4 w-40' />
                    <Skeleton className='h-8 w-full' />
                </div>
            </div>
        </div>
    );

    return (
        <div className='min-h-screen bg-gray-50 pb-32'>
            {/* Top Bar */}
            <div className='bg-white px-6 py-5 border-b border-gray-100 flex items-center justify-between sticky top-0 z-40 shadow-xs'>
                <div className='flex items-center gap-4'>
                    <button 
                        onClick={() => navigate(-1)} 
                        className='p-2.5 hover:bg-gray-100 rounded-xl transition-all'
                        aria-label="Back"
                    >
                        <FaArrowLeft className='text-gray-900' />
                    </button>
                    <div>
                        <div className='flex items-center gap-2'>
                            <h1 className='text-lg font-black text-gray-900 leading-none'>
                                Order #{orderId.slice(-6).toUpperCase()}
                            </h1>
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                mainOrder.status === 'Delivered' 
                                    ? 'bg-green-100 text-green-700' 
                                    : mainOrder.status === 'Out for Delivery'
                                    ? 'bg-indigo-100 text-indigo-700'
                                    : 'bg-amber-100 text-amber-700'
                            }`}>
                                {mainOrder.status}
                            </span>
                        </div>
                        {mainOrder.deliveryDate && (
                            <p className='text-[10px] text-green-600 font-black uppercase tracking-wider mt-1.5'>
                                🚚 Delivery Date: {new Date(mainOrder.deliveryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                        )}
                    </div>
                </div>

                {deliveryCoords && (
                    <div className='flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-xl border border-green-200 text-[10px] font-black uppercase tracking-widest'>
                        <span className='w-2 h-2 rounded-full bg-green-500 animate-ping' />
                        GPS Active
                    </div>
                )}
            </div>

            <div className='p-4 md:p-6 max-w-3xl mx-auto space-y-6'>
                {/* CUSTOMER LOCATION & NAVIGATION ACTIONS */}
                <section className='bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-sm border border-gray-100 space-y-5'>
                    <div className='flex flex-wrap items-center justify-between gap-3'>
                        <div className='flex items-center gap-3'>
                            <div className='w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-xs'>
                                <FaCompass size={18} />
                            </div>
                            <div>
                                <h2 className='text-xs font-black text-gray-900 uppercase tracking-widest'>
                                    Delivery Destination
                                </h2>
                                <p className='text-[10px] text-gray-400 font-bold'>
                                    {clientName}
                                </p>
                            </div>
                        </div>

                        {/* Distance & ETA Badges if available */}
                        <div className='flex items-center gap-2'>
                            {liveDistance && (
                                <div className='bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl text-center'>
                                    <p className='text-[8px] font-black uppercase text-indigo-400 tracking-wider'>Distance</p>
                                    <p className='text-xs font-black text-indigo-700'>{liveDistance}</p>
                                </div>
                            )}
                            {liveDriveTime && (
                                <div className='bg-green-50 border border-green-100 px-3 py-1.5 rounded-xl text-center'>
                                    <p className='text-[8px] font-black uppercase text-green-400 tracking-wider'>ETA</p>
                                    <p className='text-xs font-black text-green-700'>{liveDriveTime}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Address Box */}
                    <div className='bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-start gap-3'>
                        <FaMapMarkerAlt className='text-red-500 mt-1 shrink-0' size={16}/>
                        <div className='flex-1'>
                            <p className='text-xs font-bold text-gray-800 leading-relaxed'>
                                {fullAddressString}
                            </p>
                            {customerCoords && (
                                <p className='text-[9px] font-mono text-gray-400 mt-1'>
                                    GPS Coordinates: {customerCoords[0].toFixed(5)}° N, {customerCoords[1].toFixed(5)}° E
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Navigation Actions */}
                    <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                        <button
                            onClick={handleOpenNavigation}
                            className='sm:col-span-1 bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-4 px-4 rounded-2xl shadow-lg shadow-indigo-200 active:scale-95 transition-all flex items-center justify-center gap-2 font-black text-xs uppercase tracking-wider'
                        >
                            <FaDirections size={16} /> NAVIGATE GPS
                        </button>
                        
                        <a
                            href={`tel:${clientMobile}`}
                            className='bg-white border-2 border-gray-100 hover:border-blue-400 text-gray-900 py-4 px-4 rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2 font-black text-xs uppercase tracking-wider'
                        >
                            <FaPhoneAlt size={12} className='text-blue-600' /> CALL CLIENT
                        </a>

                        <button
                            onClick={handleOpenWhatsApp}
                            disabled={!clientMobile || clientMobile === 'Not Available'}
                            className='bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 py-4 px-4 rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2 font-black text-xs uppercase tracking-wider disabled:opacity-50'
                        >
                            <FaWhatsapp size={15} className='text-emerald-600' /> WHATSAPP
                        </button>
                    </div>
                </section>

                {/* CUSTOMER INFO CARD */}
                <section className='bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 space-y-4'>
                    <div className='flex items-center gap-3 mb-2'>
                        <div className='w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600'>
                            <FaUser size={14}/>
                        </div>
                        <div>
                            <h2 className='text-xs font-black text-gray-400 uppercase tracking-widest'>Customer Details</h2>
                            <p className='text-sm font-black text-gray-900'>{clientName}</p>
                        </div>
                    </div>

                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-50'>
                        <div>
                            <p className='text-[10px] font-black text-gray-400 uppercase mb-1'>Contact Phone</p>
                            <p className='text-sm font-black text-gray-800'>{clientMobile}</p>
                        </div>
                        <div>
                            <p className='text-[10px] font-black text-gray-400 uppercase mb-1'>Payment Mode</p>
                            <span className='inline-block px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200'>
                                {mainOrder.payment_status || 'CASH ON DELIVERY'}
                            </span>
                        </div>
                    </div>
                </section>

                {/* ORDER CONTENT */}
                <section className='space-y-4'>
                    <div className='flex items-center justify-between px-2'>
                        <h2 className='text-[10px] font-black text-gray-400 uppercase tracking-[3px]'>
                            Order Items ({orderItems.length})
                        </h2>
                        <span className='text-[10px] font-black text-gray-500 uppercase'>Total: ₹{totalAmount}</span>
                    </div>

                    {orderItems.map((item, idx) => (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            key={item._id}
                            className='bg-white rounded-[2rem] p-5 flex items-center gap-5 shadow-sm border border-gray-50'
                        >
                            <div className='w-16 h-16 bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 shrink-0 flex items-center justify-center p-1'>
                                <img 
                                    src={getImageUrl(item.product_details?.image)} 
                                    alt={item.product_details?.name}
                                    className='w-full h-full object-contain'
                                />
                            </div>
                            <div className='flex-1 min-w-0'>
                                <h3 className='font-black text-gray-900 text-sm leading-snug truncate'>{item.product_details?.name}</h3>
                                <p className='text-[11px] font-black text-gray-400 uppercase mt-0.5'>QTY: {item.product_details?.quantity || 1}</p>
                            </div>
                            <div className='text-right'>
                                <p className='text-base font-black text-gray-900'>₹{item.subTotalAmt}</p>
                            </div>
                        </motion.div>
                    ))}
                </section>

                {/* BILLING SUMMARY */}
                <section className='bg-gray-900 rounded-[2.5rem] p-8 text-white shadow-xl shadow-gray-200'>
                    <div className='flex items-center gap-3 mb-6 opacity-60'>
                        <FaReceipt size={14}/>
                        <h2 className='text-[10px] font-black uppercase tracking-widest'>Billing Summary</h2>
                    </div>
                    <div className='space-y-3'>
                        <div className='flex justify-between items-center opacity-70'>
                            <p className='text-xs font-bold uppercase'>Items Subtotal</p>
                            <p className='text-sm font-black'>₹{totalAmount}</p>
                        </div>
                        <div className='flex justify-between items-center text-amber-400'>
                            <p className='text-xs font-bold uppercase'>Delivery Fee</p>
                            <p className='text-xs font-black'>₹500 - ₹1,000 (Collect upon delivery)</p>
                        </div>
                        <div className='h-[1px] bg-white/10 my-4' />
                        <div className='flex justify-between items-center'>
                            <p className='text-sm font-black uppercase tracking-widest'>Grand Total to Collect</p>
                            <p className='text-2xl font-black text-green-400'>₹{totalAmount}</p>
                        </div>
                    </div>
                </section>

                {/* STATUS & OTP VERIFICATION */}
                {mainOrder.status !== 'Delivered' ? (
                    <section className='bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm'>
                        <div className='flex items-center gap-3 mb-6'>
                            <div className='w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600'>
                                <FaRoute size={14} />
                            </div>
                            <div>
                                <h2 className='text-xs font-black text-gray-900 uppercase tracking-widest'>Update Delivery Progress</h2>
                                <p className='text-[10px] text-gray-400 font-bold'>Set order status as you deliver</p>
                            </div>
                        </div>

                        <div className='flex flex-wrap gap-2 mb-8'>
                            {statusSteps.filter(s => s !== 'Delivered').map(s => (
                                <button 
                                    key={s} 
                                    onClick={() => updateStatus(s)}
                                    className={`flex-1 min-w-[120px] py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                        mainOrder.status === s 
                                            ? 'bg-gray-900 text-white scale-[1.02] shadow-xl' 
                                            : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-700'
                                    }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>

                        {mainOrder.status === 'Out for Delivery' && (
                            <div className='bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100'>
                                <div className='flex items-center justify-between mb-4'>
                                    <div>
                                        <p className='text-[10px] font-black text-indigo-700 uppercase tracking-widest'>Customer OTP Verification</p>
                                        <p className='text-[10px] text-indigo-500 font-bold mt-0.5'>Ask the customer for the 6-digit OTP</p>
                                    </div>
                                    <button 
                                        onClick={handleSendOTP} 
                                        disabled={sendingOtp}
                                        className='text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase underline decoration-2 disabled:opacity-50'
                                    >
                                        {sendingOtp ? 'Sending…' : 'Resend OTP'}
                                    </button>
                                </div>
                                <div className='flex flex-col sm:flex-row gap-3'>
                                    <input 
                                        type="tel" 
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        placeholder="••••••" 
                                        value={otpInput} 
                                        onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                                        className='w-full bg-white border-2 border-indigo-200 focus:border-indigo-600 rounded-2xl px-4 py-5 text-center font-black tracking-[0.4em] text-2xl outline-none shadow-sm transition-all'
                                        maxLength={6}
                                    />
                                    <button 
                                        onClick={handleVerifyOTP}
                                        disabled={verifying}
                                        className='w-full sm:w-auto sm:px-10 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-indigo-200 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70'
                                    >
                                        {verifying ? <FaSpinner className='animate-spin' /> : 'Complete Delivery'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </section>
                ) : (
                    <div className='bg-green-50 p-8 rounded-[2.5rem] border border-green-100 flex flex-col items-center text-center'>
                        <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4 shadow-sm'>
                            <FaCheckCircle size={32}/>
                        </div>
                        <h2 className='text-lg font-black text-green-900 uppercase tracking-tight'>Delivery Completed</h2>
                        <p className='text-xs font-bold text-green-700 mt-1 opacity-70'>This order has been verified and successfully delivered.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeliveryOrderDetails;
