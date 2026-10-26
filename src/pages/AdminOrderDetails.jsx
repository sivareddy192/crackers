import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaPhoneAlt, FaMapMarkerAlt, FaUser, FaReceipt, FaCheckCircle, FaSpinner, FaTrash } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { getImageUrl } from '../utils/getImageUrl';
import Skeleton from '../components/Skeleton';

const statusSteps = ["Pending", "Confirmed", "Shipped", "Out for Delivery", "Delivered"];

const AdminOrderDetails = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [orderItems, setOrderItems] = useState([]);
    const [mainOrder, setMainOrder] = useState({});
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    const fetchOrderDetails = async () => {
        try {
            const response = await Axios({
                ...SummaryApi.order.getOrders
            });
            const allOrders = response?.data?.data || [];
            const match = allOrders.filter(o => o.orderId === orderId || o._id === orderId);
            setOrderItems(match);
            if(match.length > 0) {
                setMainOrder(match[0]);
            }
            setLoading(false);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchOrderDetails();
    }, [orderId]);

    const handleUpdateStatus = async (status) => {
        setUpdating(true);
        try {
            const response = await Axios({
                ...SummaryApi.order.updateOrder,
                url: SummaryApi.order.updateOrder.url.replace(":id", mainOrder._id),
                data: { status }
            });
            if(response.data.success) {
                toast.success("Status updated");
                fetchOrderDetails();
            }
        } catch (err) {
            toast.error("Update failed");
        } finally {
            setUpdating(false);
        }
    };

    const handleDeleteOrder = async () => {
        if(!window.confirm("Are you sure you want to delete this entire order?")) return;
        try {
            const response = await Axios({
                ...SummaryApi.order.deleteOrder,
                url: SummaryApi.order.deleteOrder.url.replace(":id", mainOrder._id)
            })
            if(response.data.success) {
                toast.success("Order deleted");
                navigate('/admin-portal/orders');
            }
        } catch (err) {
            toast.error("Delete failed");
        }
    };

    if (loading) return (
        <div className='min-h-screen bg-gray-50 pb-32 animate-pulse'>
            <div className='bg-white px-6 lg:px-12 py-6 flex items-center justify-between border-b border-gray-100'>
                <div className='flex items-center gap-6'>
                    <Skeleton className='w-12 h-12 rounded-2xl' />
                    <div className='space-y-2'>
                        <Skeleton className='h-6 w-48' />
                        <Skeleton className='h-3 w-32' />
                    </div>
                </div>
                <Skeleton className='w-12 h-12 rounded-2xl' />
            </div>

            <div className='p-6 lg:p-12 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10'>
                <div className='lg:col-span-2 space-y-12'>
                    <div className='bg-white rounded-[3rem] p-10 border border-gray-100 space-y-6 h-64 flex flex-col justify-between'>
                        <Skeleton className='h-4 w-40' />
                        <div className='grid grid-cols-2 gap-6'>
                            <Skeleton className='h-8 w-full' />
                            <Skeleton className='h-8 w-full' />
                        </div>
                    </div>
                    <div className='space-y-4'>
                        <Skeleton className='h-5 w-32' />
                        <Skeleton className='h-20 w-full rounded-2xl' />
                        <Skeleton className='h-20 w-full rounded-2xl' />
                    </div>
                </div>
                <div className='bg-white rounded-[3rem] p-10 border border-gray-100 h-96 flex flex-col justify-between'>
                    <Skeleton className='h-5 w-40' />
                    <div className='space-y-4'>
                        <Skeleton className='h-12 w-full rounded-2xl' />
                        <Skeleton className='h-12 w-full rounded-2xl' />
                    </div>
                </div>
            </div>
        </div>
    );

    const totalAmount = orderItems.reduce((acc, curr) => acc + curr.subTotalAmt, 0);

    return (
        <div className='min-h-screen bg-white pb-32'>
            <div className='bg-white px-6 lg:px-12 py-6 flex items-center justify-between sticky top-0 z-40 border-b border-gray-50'>
                <div className='flex items-center gap-6'>
                    <button onClick={() => navigate(-1)} className='w-12 h-12 flex items-center justify-center bg-gray-50 hover:bg-gray-900 hover:text-white rounded-2xl transition-all shadow-sm'>
                        <FaArrowLeft size={14} />
                    </button>
                    <div>
                        <h1 className='text-2xl font-black text-gray-900 tracking-tight'>Order Inspection</h1>
                        <p className='text-[10px] text-indigo-600 font-black uppercase tracking-[3px] mt-1'>ID: #{orderId.slice(-8)}</p>
                        {mainOrder.deliveryDate && (
                            <p className='text-green-600 text-[10px] font-black uppercase tracking-wider mt-1.5 flex items-center gap-1.5'>
                                <span className='w-1.5 h-1.5 bg-green-600 rounded-full animate-pulse' />
                                🚚 Delivery Date: {new Date(mainOrder.deliveryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                        )}
                    </div>
                </div>
                <div className='flex items-center gap-3'>
                    <button 
                        onClick={handleDeleteOrder}
                        className='w-12 h-12 flex items-center justify-center bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all'
                    >
                        <FaTrash size={14}/>
                    </button>
                </div>
            </div>

            <div className='p-6 lg:p-12 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10'>
                <div className='lg:col-span-2 space-y-12'>
                    <section className='bg-blue-50/30 rounded-[3rem] p-10 border border-blue-100/50 relative overflow-hidden'>
                        <div className='absolute top-0 right-0 p-8 opacity-10'>
                            <FaMapMarkerAlt size={120} className='text-blue-600' />
                        </div>
                        <h2 className='text-[11px] font-black text-blue-700 uppercase tracking-[4px] mb-10'>Shipping Destination</h2>
                        
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12 relative z-10'>
                            <div className='space-y-1'>
                                <p className='text-[9px] font-black text-blue-400 uppercase tracking-widest'>Address</p>
                                <p className='text-base font-black text-gray-800 leading-tight'>{mainOrder.delivery_address?.address_line}</p>
                            </div>
                            <div className='space-y-1'>
                                <p className='text-[9px] font-black text-blue-400 uppercase tracking-widest'>City</p>
                                <p className='text-base font-black text-gray-800 leading-tight'>{mainOrder.delivery_address?.city}</p>
                            </div>
                            <div className='space-y-1'>
                                <p className='text-[9px] font-black text-blue-400 uppercase tracking-widest'>State & Pincode</p>
                                <p className='text-base font-black text-gray-800 leading-tight'>{mainOrder.delivery_address?.state} — {mainOrder.delivery_address?.pincode}</p>
                            </div>
                            <div className='space-y-1'>
                                <p className='text-[9px] font-black text-blue-400 uppercase tracking-widest'>Contact Number</p>
                                <p className='text-base font-black text-gray-800 leading-tight'>{mainOrder.delivery_address?.mobile}</p>
                            </div>
                        </div>
                    </section>

                    <section className='space-y-6'>
                        <div className='flex items-center justify-between px-2'>
                            <h2 className='text-[11px] font-black text-gray-400 uppercase tracking-[4px]'>Order Content</h2>
                            <span className='bg-gray-100 px-3 py-1 rounded-full text-[9px] font-black text-gray-500 uppercase'>{orderItems.length} ITEMS</span>
                        </div>
                        <div className='space-y-4'>
                            {orderItems.map((item, idx) => (
                                <motion.div 
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    key={item._id}
                                    className='group bg-white rounded-[2.5rem] p-6 flex items-center gap-8 border border-gray-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50/50 transition-all'
                                >
                                    <div className='w-24 h-24 bg-gray-50 rounded-3xl overflow-hidden p-4 shrink-0 transition-transform group-hover:scale-105'>
                                        <img 
                                            src={getImageUrl(item.product_details?.image)} 
                                            alt={item.product_details?.name}
                                            className='w-full h-full object-contain'
                                        />
                                    </div>
                                    <div className='flex-1'>
                                        <h3 className='font-black text-gray-900 text-lg leading-tight mb-2'>{item.product_details?.name}</h3>
                                        <div className='flex items-center gap-4'>
                                            <p className='text-[11px] font-black text-gray-400 uppercase bg-gray-50 px-3 py-1 rounded-lg tracking-widest'>QTY: {item.product_details?.quantity || 1}</p>
                                        </div>
                                    </div>
                                    <div className='text-right'>
                                        <p className='text-xl font-black text-gray-900 tracking-tighter'>₹{item.subTotalAmt}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </section>
                </div>

                <div className='space-y-10'>
                    <section className='bg-gray-950 rounded-[3rem] p-10 text-white shadow-2xl shadow-gray-200 relative overflow-hidden'>
                        <div className='absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl' />
                        <div className='flex items-center gap-3 mb-10 opacity-40'>
                            <FaReceipt size={12}/>
                            <h2 className='text-[9px] font-black uppercase tracking-[3px]'>Billing Intelligence</h2>
                        </div>
                        <div className='space-y-6'>
                            <div className='flex justify-between items-center opacity-50'>
                                <p className='text-[10px] font-bold uppercase tracking-widest'>Subtotal</p>
                                <p className='text-sm font-black'>₹{totalAmount}</p>
                            </div>
                            <div className='h-[1px] bg-white/5' />
                            <div>
                                <p className='text-[10px] font-black text-gray-500 uppercase tracking-[2px] mb-2'>Total Amount Paid</p>
                                <p className='text-5xl font-black text-white tracking-tighter'>₹{totalAmount}</p>
                            </div>
                            <div className='pt-6'>
                                <div className='bg-white/5 border border-white/10 w-full px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[2px] flex items-center justify-center gap-3'>
                                    <FaCheckCircle className='text-green-400' size={14}/>
                                    Verified Payment
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className='bg-white rounded-[3rem] p-10 border border-gray-100 shadow-sm'>
                        <h2 className='text-[11px] font-black text-gray-400 uppercase tracking-[4px] mb-8 px-2'>Quick Actions</h2>
                        <div className='space-y-3'>
                            {statusSteps.map(s => (
                                <button 
                                    key={s} 
                                    onClick={() => updateStatus(s)}
                                    className={`w-full py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${
                                        mainOrder.status === s 
                                        ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' 
                                        : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default AdminOrderDetails;
