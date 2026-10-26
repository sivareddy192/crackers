import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaPhoneAlt, FaMapMarkerAlt, FaUser, FaReceipt, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { getImageUrl } from '../utils/getImageUrl';
import Skeleton from '../components/Skeleton';

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

    const fetchOrderDetails = async () => {
        try {
            const res = await Axios({
                url: `${SummaryApi.order.getOrderItems.url}/${orderId}`,
                method: SummaryApi.order.getOrderItems.method
            });
            if (res.data.success) {
                setOrderItems(res.data.data);
                if (res.data.data.length > 0) {
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

    const clientMobile = mainOrder.delivery_address?.mobile || mainOrder.address?.phone || mainOrder.userId?.mobile || 'Not Available';
    const totalAmount = orderItems.reduce((acc, curr) => acc + curr.subTotalAmt, 0);

    const updateStatus = async (status) => {
        if (status === "Delivered") {
            toast.error("Use OTP for Delivery");
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
            toast.error("Update failed");
        }
    };

    const handleSendOTP = async () => {
        setSendingOtp(true);
        try {
            const res = await Axios({
                ...SummaryApi.deliveryBoy.sendOtp,
                data: { orderId: mainOrder._id }
            });
            toast.success(res.data.message || "OTP sent");
        } catch (err) {
            toast.error("Failed to send OTP");
        } finally {
            setSendingOtp(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!otpInput) return toast.error("Enter OTP");
        setVerifying(true);
        try {
            const res = await Axios({
                ...SummaryApi.deliveryBoy.verifyOtp,
                data: { orderId: mainOrder._id, otp: otpInput }
            });
            if (res.data.success) {
                toast.success("Delivered!");
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
            <div className='bg-white px-6 py-6 border-b border-gray-100 flex items-center gap-4 sticky top-0 z-40'>
                <button onClick={() => navigate(-1)} className='p-2 hover:bg-gray-100 rounded-xl transition-all'>
                    <FaArrowLeft className='text-gray-900' />
                </button>
                <div>
                    <h1 className='text-lg font-black text-gray-900 leading-none'>Order #{orderId.slice(-6)}</h1>
                    <p className='text-[10px] text-indigo-600 font-black uppercase tracking-widest mt-1.5'>{mainOrder.status}</p>
                    {mainOrder.deliveryDate && (
                        <p className='text-[10px] text-green-600 font-black uppercase tracking-widest mt-1.5'>🚚 Delivery Date: {new Date(mainOrder.deliveryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    )}
                </div>
            </div>

            <div className='p-6 max-w-2xl mx-auto space-y-6'>
                <section className='bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100'>
                    <div className='flex items-center gap-3 mb-6'>
                        <div className='w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600'>
                            <FaUser size={14}/>
                        </div>
                        <h2 className='text-xs font-black text-gray-400 uppercase tracking-widest'>Customer Info</h2>
                    </div>
                    
                    <div className='space-y-4'>
                        <div>
                            <p className='text-[10px] font-black text-gray-400 uppercase mb-1'>Name</p>
                            <p className='text-base font-black text-gray-900'>{mainOrder.userId?.name || 'N/A'}</p>
                        </div>
                        <div>
                            <p className='text-[10px] font-black text-gray-400 uppercase mb-1'>Delivery Address</p>
                            <div className='flex gap-3 items-start'>
                                <FaMapMarkerAlt className='text-red-500 mt-1 shrink-0' size={14}/>
                                <p className='text-sm font-bold text-gray-700 leading-relaxed'>
                                    {mainOrder.delivery_address?.address_line}, {mainOrder.delivery_address?.city}, {mainOrder.delivery_address?.state} - {mainOrder.delivery_address?.pincode}
                                </p>
                            </div>
                        </div>
                        
                        <div className='flex flex-col gap-3 mt-4'>
                            <div className='flex flex-col sm:flex-row gap-3 w-full'>
                                <a href={`tel:${clientMobile}`} className='flex-1 bg-blue-600 text-white py-4 rounded-2xl shadow-lg shadow-blue-100 active:scale-95 transition-all flex flex-col items-center justify-center font-black uppercase tracking-widest gap-1'>
                                    <div className='flex items-center gap-2 text-xs'>
                                        <FaPhoneAlt size={12}/> CALL CLIENT
                                    </div>
                                    {clientMobile !== 'Not Available' && <span className='text-[9px] opacity-80 tracking-normal'>{clientMobile}</span>}
                                </a>
                                <button 
                                    onClick={() => {
                                        const addr = mainOrder.delivery_address || mainOrder.address;
                                        if (!addr) return;
                                        const fullAddr = `${addr.address_line || addr.street}, ${addr.city}, ${addr.state || ''} ${addr.pincode || ''}`;
                                        window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddr)}&travelmode=driving`, '_blank');
                                    }}
                                    className='flex-1 bg-white border-2 border-gray-100 py-4 rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-3 font-black text-xs text-gray-900 uppercase tracking-widest'
                                >
                                    <FaMapMarkerAlt className='text-red-500' size={14}/> NAVIGATE
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                <section className='space-y-4'>
                    <h2 className='text-[10px] font-black text-gray-400 uppercase tracking-[3px] px-2'>Order Content</h2>
                    {orderItems.map((item, idx) => (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            key={item._id}
                            className='bg-white rounded-[2rem] p-5 flex items-center gap-5 shadow-sm border border-gray-50'
                        >
                            <div className='w-20 h-20 bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 shrink-0'>
                                <img 
                                    src={getImageUrl(item.product_details?.image)} 
                                    alt={item.product_details?.name}
                                    className='w-full h-full object-cover'
                                />
                            </div>
                            <div className='flex-1'>
                                <h3 className='font-black text-gray-900 text-sm leading-snug mb-1'>{item.product_details?.name}</h3>
                                <p className='text-[11px] font-black text-gray-400 uppercase'>QTY: {item.product_details?.quantity || 1}</p>
                            </div>
                            <div className='text-right'>
                                <p className='text-base font-black text-gray-900'>₹{item.subTotalAmt}</p>
                            </div>
                        </motion.div>
                    ))}
                </section>

                <section className='bg-gray-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-gray-200'>
                    <div className='flex items-center gap-3 mb-6 opacity-60'>
                        <FaReceipt size={14}/>
                        <h2 className='text-[10px] font-black uppercase tracking-widest'>Billing Details</h2>
                    </div>
                    <div className='space-y-3'>
                        <div className='flex justify-between items-center opacity-60'>
                            <p className='text-xs font-bold uppercase'>Subtotal</p>
                            <p className='text-sm font-black'>₹{totalAmount}</p>
                        </div>
                        <div className='flex justify-between items-center opacity-60'>
                            <p className='text-xs font-bold uppercase'>Delivery Fee</p>
                            <p className='text-sm font-black'>FREE</p>
                        </div>
                        <div className='h-[1px] bg-white/10 my-4' />
                        <div className='flex justify-between items-center'>
                            <p className='text-sm font-black uppercase tracking-widest'>Grand Total</p>
                            <p className='text-2xl font-black text-green-400'>₹{totalAmount}</p>
                        </div>
                    </div>
                </section>

                {mainOrder.status !== 'Delivered' ? (
                    <section className='bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm'>
                        <h2 className='text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6'>Update Progress</h2>
                        <div className='flex flex-wrap gap-2 mb-8'>
                            {statusSteps.filter(s => s !== 'Delivered').map(s => (
                                <button 
                                    key={s} onClick={() => updateStatus(s)}
                                    className={`flex-1 min-w-[120px] py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                        mainOrder.status === s ? 'bg-gray-900 text-white scale-[1.02] shadow-xl' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                                    }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>

                        {mainOrder.status === 'Out for Delivery' && (
                            <div className='bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100'>
                                <div className='flex items-center justify-between mb-4'>
                                    <p className='text-[10px] font-black text-indigo-700 uppercase tracking-widest'>OTP Verification</p>
                                    <button 
                                        onClick={handleSendOTP} 
                                        disabled={sendingOtp}
                                        className='text-[10px] font-black text-indigo-600 uppercase underline decoration-2'
                                    >
                                        {sendingOtp ? 'Sending...' : 'Send OTP'}
                                    </button>
                                </div>
                                <div className='flex flex-col sm:flex-row gap-3'>
                                    <input 
                                        type="tel" 
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        placeholder="••••••" 
                                        value={otpInput} onChange={(e) => setOtpInput(e.target.value.replace(/\D/g,''))}
                                        className='w-full bg-white border-2 border-indigo-200 focus:border-indigo-600 rounded-2xl px-4 py-5 text-center font-black tracking-[0.4em] text-2xl outline-none shadow-sm transition-all'
                                        maxLength={6}
                                    />
                                    <button 
                                        onClick={handleVerifyOTP}
                                        disabled={verifying}
                                        className='w-full sm:w-auto sm:px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase shadow-lg shadow-indigo-200 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70'
                                    >
                                        {verifying ? <FaSpinner className='animate-spin'/> : 'Verify Delivery'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </section>
                ) : (
                    <div className='bg-green-50 p-8 rounded-[2.5rem] border border-green-100 flex flex-col items-center text-center'>
                        <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4'>
                            <FaCheckCircle size={30}/>
                        </div>
                        <h2 className='text-lg font-black text-green-900'>Delivery Completed</h2>
                        <p className='text-xs font-bold text-green-700 mt-1 opacity-60'>This order was successfully delivered and verified.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeliveryOrderDetails;
