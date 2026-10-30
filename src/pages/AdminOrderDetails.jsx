import React, { useEffect, useState, useCallback } from 'react';
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
    FaTrash,
    FaBox,
    FaMotorcycle,
    FaEnvelope,
    FaCalendarAlt,
    FaClock,
    FaUserCheck
} from 'react-icons/fa';
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
    const [deliveryBoys, setDeliveryBoys] = useState([]);
    const [assigning, setAssigning] = useState(false);
    const [previewModal, setPreviewModal] = useState(null);

    const fetchOrderDetails = useCallback(async () => {
        if (!orderId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            let items = [];

            // 1. Query general order-items endpoint first (present on deployed Vercel and local backend)
            try {
                const res = await Axios({
                    url: `${SummaryApi.order.getOrderItems.url}/${orderId}`,
                    method: SummaryApi.order.getOrderItems.method
                });
                if (res.data?.success && Array.isArray(res.data?.data) && res.data.data.length > 0) {
                    items = res.data.data;
                }
            } catch (err) {
                // If not found, try admin specific routes
            }

            // 2. Try admin order endpoint if not found
            if (items.length === 0) {
                try {
                    const adminOrderRes = await Axios({
                        url: `${SummaryApi.admin.getOrderDetails.url}/${orderId}`,
                        method: SummaryApi.admin.getOrderDetails.method
                    });
                    if (adminOrderRes.data?.success && Array.isArray(adminOrderRes.data?.data) && adminOrderRes.data.data.length > 0) {
                        items = adminOrderRes.data.data;
                    }
                } catch (err) {
                    // Proceed to admin all orders fallback
                }
            }

            // 3. Fallback to all admin orders if needed
            if (items.length === 0) {
                const adminAllRes = await Axios({
                    url: SummaryApi.admin.getOrders.url,
                    method: SummaryApi.admin.getOrders.method
                });
                const allOrders = adminAllRes?.data?.data || adminAllRes?.data || [];
                if (Array.isArray(allOrders)) {
                    items = allOrders.filter(o => 
                        String(o.orderId || '').toLowerCase() === String(orderId).toLowerCase() || 
                        String(o._id || '').toLowerCase() === String(orderId).toLowerCase()
                    );
                }
            }

            setOrderItems(items);
            if (items.length > 0) {
                setMainOrder(items[0]);
            } else {
                setMainOrder({});
            }
        } catch (err) {
            console.error("Fetch Order Details Error:", err);
            toast.error("Failed to load order details");
        } finally {
            setLoading(false);
        }
    }, [orderId]);

    useEffect(() => {
        fetchOrderDetails();
    }, [fetchOrderDetails]);

    // Fetch only Active delivery boys
    const fetchDeliveryBoys = useCallback(async () => {
        try {
            const res = await Axios({ ...SummaryApi.deliveryBoy.getDeliveryBoys });
            setDeliveryBoys(res.data.data || []);
        } catch (err) {
            console.error("Fetch delivery boys error:", err);
        }
    }, []);

    useEffect(() => {
        fetchDeliveryBoys();
    }, [fetchDeliveryBoys]);

    const handleAssignDeliveryBoy = async (deliveryBoyId) => {
        if (!deliveryBoyId || !mainOrder?.orderId) return;
        setAssigning(true);
        try {
            let res;
            try {
                res = await Axios({
                    url: SummaryApi.admin.assignOrder.url,
                    method: SummaryApi.admin.assignOrder.method,
                    data: { orderId: mainOrder.orderId, deliveryBoyId }
                });
            } catch (initialErr) {
                if (initialErr?.response?.status === 404) {
                    const fallbackUrl = SummaryApi.admin.assignOrder.url.includes('/api/admin')
                        ? '/api/order/assign'
                        : '/api/admin/orders/assign';
                    res = await Axios({
                        url: fallbackUrl,
                        method: 'post',
                        data: { orderId: mainOrder.orderId, deliveryBoyId }
                    });
                } else {
                    throw initialErr;
                }
            }

            if (res?.data?.success) {
                toast.success('Delivery partner assigned!');
                fetchOrderDetails();
            } else {
                toast.error(res?.data?.message || 'Assignment failed');
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Assignment failed');
        } finally {
            setAssigning(false);
        }
    };

    const handleUpdateStatus = async (status) => {
        if (!mainOrder?._id) return;
        setUpdating(true);
        try {
            const response = await Axios({
                url: `${SummaryApi.admin.updateOrderStatus.url}/${mainOrder._id}`,
                method: SummaryApi.admin.updateOrderStatus.method,
                data: { status }
            });
            if (response.data?.success) {
                toast.success(`Status updated to ${status}`);
                fetchOrderDetails();
            }
        } catch (err) {
            console.error("Update Status Error:", err);
            toast.error(err?.response?.data?.message || "Status update failed");
        } finally {
            setUpdating(false);
        }
    };

    const isHex24 = (id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id.trim());

    const handleDeleteOrder = async () => {
        const displayId = mainOrder?.orderId || mainOrder?._id || orderId;
        if (!displayId) return;
        if (!window.confirm(`Are you sure you want to delete order #${displayId.slice(-6)}? This cannot be undone.`)) return;
        try {
            let idsToDelete = (orderItems || []).map(item => item._id).filter(isHex24);
            if (isHex24(mainOrder?._id) && !idsToDelete.includes(mainOrder._id)) {
                idsToDelete.push(mainOrder._id);
            }

            let hasSuccess = false;

            if (idsToDelete.length > 0) {
                const deletePromises = idsToDelete.map(async (id) => {
                    try {
                        return await Axios({
                            url: SummaryApi.admin.deleteOrder.url.replace(':id', id),
                            method: SummaryApi.admin.deleteOrder.method
                        });
                    } catch (initialErr) {
                        if (initialErr?.response?.status === 404) {
                            const fallbackUrl = SummaryApi.admin.deleteOrder.url.includes('/api/admin')
                                ? `/api/order/delete/${id}`
                                : `/api/admin/orders/${id}`;
                            return await Axios({
                                url: fallbackUrl,
                                method: 'delete'
                            });
                        }
                        throw initialErr;
                    }
                });

                const results = await Promise.allSettled(deletePromises);
                hasSuccess = results.some(r => r.status === 'fulfilled' && (r.value?.data?.success || r.value?.status === 200));
            } else {
                try {
                    const res = await Axios({
                        url: `/api/admin/orders/${displayId}`,
                        method: 'delete'
                    });
                    hasSuccess = res?.data?.success || res?.status === 200;
                } catch (fallbackErr) {
                    const res2 = await Axios({
                        url: `/api/order/delete/${displayId}`,
                        method: 'delete'
                    });
                    hasSuccess = res2?.data?.success || res2?.status === 200;
                }
            }

            if (hasSuccess) {
                toast.success('Order deleted successfully');
                navigate('/admin-portal/orders');
            } else {
                toast.error('Delete failed');
            }
        } catch (err) {
            console.error('Delete Order Error:', err);
            toast.error(err?.response?.data?.message || 'Delete failed');
        }
    };

    if (loading) {
        return (
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
    }

    if (!loading && orderItems.length === 0) {
        return (
            <div className='min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center'>
                <div className='w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center text-3xl shadow-sm mb-6'>
                    <FaBox />
                </div>
                <h1 className='text-3xl font-black text-gray-900 tracking-tight mb-2'>Order Not Found</h1>
                <p className='text-sm text-gray-500 max-w-md mb-8'>
                    We couldn't locate any items or records for order ID: <span className='font-mono font-bold text-gray-800'>#{orderId}</span>.
                </p>
                <button
                    onClick={() => navigate('/admin-portal/orders')}
                    className='px-8 py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg shadow-gray-200 flex items-center gap-3'
                >
                    <FaArrowLeft size={12} />
                    Back to All Orders
                </button>
            </div>
        );
    }

    const itemsSubtotal = orderItems.reduce((acc, curr) => acc + (Number(curr.subTotalAmt) || 0), 0);
    const totalAmount = mainOrder.totalAmt || itemsSubtotal;
    const isCancelled = (mainOrder.status || "").toLowerCase() === "cancelled";
    const activeIndex = statusSteps.findIndex(s => s.toLowerCase() === (mainOrder.status || "").toLowerCase());
    const screenshotUrl = mainOrder.payment_screenshot || mainOrder.paymentScreenshot || orderItems.find(i => i.payment_screenshot || i.paymentScreenshot)?.payment_screenshot || orderItems.find(i => i.payment_screenshot || i.paymentScreenshot)?.paymentScreenshot || "";

    const customerName = mainOrder.userId?.name || mainOrder.address?.name || "Customer";
    const customerEmail = mainOrder.userId?.email || "Not Provided";
    const customerMobile = mainOrder.userId?.mobile || mainOrder.delivery_address?.mobile || mainOrder.address?.phone || "N/A";
    const customerQuery = mainOrder.customerQuery || orderItems.find(i => i.customerQuery)?.customerQuery || "";

    const addressLine = mainOrder.delivery_address?.address_line || mainOrder.delivery_address?.address_line1 || mainOrder.address?.street || "N/A";
    const addressCity = mainOrder.delivery_address?.city || mainOrder.address?.city || "N/A";
    const addressState = mainOrder.delivery_address?.state || mainOrder.address?.state || "";
    const addressPincode = mainOrder.delivery_address?.pincode || mainOrder.address?.pincode || "";
    const addressMobile = mainOrder.delivery_address?.mobile || mainOrder.address?.phone || customerMobile;

    return (
        <div className='min-h-screen bg-gray-50/50 pb-32'>
            {/* Header */}
            <div className='bg-white px-6 lg:px-12 py-6 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40 border-b border-gray-100 shadow-xs'>
                <div className='flex items-center gap-4 lg:gap-6'>
                    <button 
                        onClick={() => navigate('/admin-portal/orders')} 
                        className='w-12 h-12 flex items-center justify-center bg-gray-50 hover:bg-gray-900 hover:text-white rounded-2xl transition-all shadow-xs shrink-0 cursor-pointer'
                        title="Back to Orders"
                    >
                        <FaArrowLeft size={14} />
                    </button>
                    <div>
                        <div className='flex items-center gap-3 flex-wrap'>
                            <h1 className='text-2xl font-black text-gray-900 tracking-tight'>
                                #{mainOrder.orderId || orderId}
                            </h1>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                isCancelled ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'
                            }`}>
                                {mainOrder.status || "Pending"}
                            </span>
                            <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                                mainOrder.payment_status === 'CASH ON DELIVERY' 
                                    ? 'bg-orange-50 text-orange-700 border border-orange-100' 
                                    : 'bg-blue-50 text-blue-700 border border-blue-100'
                            }`}>
                                {mainOrder.payment_status === 'CASH ON DELIVERY' ? 'Cash On Delivery' : 'Online Paid'}
                            </span>
                        </div>
                        <div className='flex items-center gap-4 text-[11px] text-gray-400 font-bold mt-1 flex-wrap'>
                            <span className='flex items-center gap-1.5'>
                                <FaCalendarAlt size={10} className='text-gray-400' />
                                {mainOrder.createdAt ? new Date(mainOrder.createdAt).toLocaleString('en-GB', { 
                                    day: '2-digit', 
                                    month: 'short', 
                                    year: 'numeric', 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                }) : "N/A"}
                            </span>
                            {mainOrder.deliveryDate && (
                                <span className='text-green-600 flex items-center gap-1.5 font-black uppercase tracking-wider'>
                                    <span className='w-1.5 h-1.5 bg-green-600 rounded-full animate-pulse' />
                                    🚚 Expected: {new Date(mainOrder.deliveryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className='flex items-center gap-3'>
                    <button 
                        onClick={handleDeleteOrder}
                        className='px-5 py-3 flex items-center gap-2 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all font-black text-xs uppercase tracking-wider cursor-pointer shadow-xs'
                        title="Delete Entire Order"
                    >
                        <FaTrash size={12} />
                        <span>Delete Order</span>
                    </button>
                </div>
            </div>

            <div className='p-6 lg:p-12 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8'>
                {/* Left 2 Columns */}
                <div className='lg:col-span-2 space-y-8'>
                    {/* Payment Screenshot Verification Card */}
                    {screenshotUrl && (
                        <div className='bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-white rounded-3xl p-6 lg:p-8 border-2 border-amber-300 shadow-sm relative overflow-hidden'>
                            <div className='flex items-center justify-between mb-5 flex-wrap gap-3'>
                                <div className='flex items-center gap-3'>
                                    <div className='w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-xl shadow-md shadow-amber-500/20'>
                                        📷
                                    </div>
                                    <div>
                                        <div className='flex items-center gap-2'>
                                            <h2 className='text-sm font-black text-gray-900 uppercase tracking-widest'>
                                                Payment Screenshot Proof
                                            </h2>
                                            <span className='px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300'>
                                                Verify Receipt
                                            </span>
                                        </div>
                                        <p className='text-[10px] text-gray-500 font-bold mt-0.5'>
                                            Customer attached this screenshot as proof of UPI payment
                                        </p>
                                    </div>
                                </div>
                                <div className='flex items-center gap-2'>
                                    <button
                                        type='button'
                                        onClick={() => setPreviewModal(screenshotUrl)}
                                        className='px-3.5 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-[10px] font-black uppercase tracking-wider shadow-xs transition-colors cursor-pointer'
                                    >
                                        🔍 Zoom Preview
                                    </button>
                                    <a
                                        href={screenshotUrl}
                                        target='_blank'
                                        rel='noopener noreferrer'
                                        className='px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black uppercase tracking-wider shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer'
                                    >
                                        <span>Open Full Image</span>
                                        <span>↗</span>
                                    </a>
                                </div>
                            </div>

                            {/* Prominent Image Preview */}
                            <div 
                                className='rounded-2xl overflow-hidden bg-gray-900/5 border border-gray-200/80 p-3 flex items-center justify-center cursor-pointer group relative'
                                onClick={() => setPreviewModal(screenshotUrl)}
                            >
                                <img 
                                    src={screenshotUrl} 
                                    alt='Customer Payment Screenshot' 
                                    className='max-h-96 w-auto object-contain rounded-xl shadow-md group-hover:scale-[1.01] transition-transform'
                                />
                                <div className='absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-2 backdrop-blur-xs rounded-2xl'>
                                    <span>🔍 Click to View Full Screen</span>
                                </div>
                            </div>

                            {/* Summary strip below image */}
                            <div className='mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-amber-200/70 text-center'>
                                <div>
                                    <p className='text-[9px] font-black uppercase tracking-wider text-gray-400'>Order Amount</p>
                                    <p className='text-sm font-black text-gray-900 mt-0.5'>₹{totalAmount}</p>
                                </div>
                                <div>
                                    <p className='text-[9px] font-black uppercase tracking-wider text-gray-400'>Payment Method</p>
                                    <p className='text-xs font-bold text-gray-800 mt-0.5'>{mainOrder.payment_status || "UPI"}</p>
                                </div>
                                <div>
                                    <p className='text-[9px] font-black uppercase tracking-wider text-gray-400'>Txn / Ref ID</p>
                                    <p className='text-xs font-mono font-bold text-gray-800 mt-0.5 truncate'>{mainOrder.paymentId || "N/A"}</p>
                                </div>
                                <div>
                                    <p className='text-[9px] font-black uppercase tracking-wider text-gray-400'>Customer Phone</p>
                                    <p className='text-xs font-bold text-gray-800 mt-0.5 truncate'>{customerMobile}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Status Stepper Card */}
                    <div className='bg-white rounded-3xl p-6 lg:p-8 border border-gray-100 shadow-xs'>
                        <h2 className='text-xs font-black text-gray-400 uppercase tracking-[3px] mb-6'>
                            Shipment Progress
                        </h2>
                        <div className='px-2 py-4'>
                            <div className='flex items-center justify-between relative'>
                                <div className='absolute top-3 left-[8%] w-[84%] h-[2px] bg-gray-200 z-0' />
                                {statusSteps.map((step, i) => {
                                    const active = !isCancelled && i <= activeIndex;
                                    return (
                                        <div key={step} className='flex flex-col items-center flex-1 relative z-10'>
                                            <div className={`w-6 h-6 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
                                                active ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-300 text-gray-300'
                                            }`}>
                                                {active && <div className='w-2 h-2 bg-white rounded-full' />}
                                            </div>
                                            <p className={`text-[9px] font-black mt-2 text-center uppercase tracking-wider ${
                                                active ? 'text-indigo-600' : 'text-gray-400'
                                            }`}>
                                                {step}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Customer & Delivery Cards Grid */}
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        {/* Customer Information */}
                        <section className='bg-white rounded-3xl p-8 border border-gray-100 shadow-xs relative overflow-hidden'>
                            <div className='flex items-center gap-3 mb-6'>
                                <div className='w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center'>
                                    <FaUser size={14} />
                                </div>
                                <div>
                                    <h2 className='text-xs font-black text-gray-900 uppercase tracking-widest'>Customer Details</h2>
                                    <p className='text-[10px] text-gray-400 font-bold'>Account profile</p>
                                </div>
                            </div>

                            <div className='space-y-4'>
                                <div>
                                    <p className='text-[9px] font-black text-gray-400 uppercase tracking-widest'>Full Name</p>
                                    <p className='text-base font-black text-gray-800 leading-tight mt-0.5'>{customerName}</p>
                                </div>
                                <div>
                                    <p className='text-[9px] font-black text-gray-400 uppercase tracking-widest'>Email Address</p>
                                    <p className='text-sm font-bold text-gray-700 leading-tight mt-0.5 flex items-center gap-2'>
                                        <FaEnvelope size={11} className='text-gray-400' />
                                        {customerEmail}
                                    </p>
                                </div>
                                <div>
                                    <p className='text-[9px] font-black text-gray-400 uppercase tracking-widest'>Phone Number</p>
                                    <p className='text-sm font-bold text-gray-700 leading-tight mt-0.5 flex items-center gap-2'>
                                        <FaPhoneAlt size={11} className='text-gray-400' />
                                        {customerMobile}
                                    </p>
                                </div>
                                {customerQuery && (
                                    <div className='mt-3 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl'>
                                        <p className='text-[9px] font-black text-amber-800 uppercase tracking-widest mb-1'>💬 Customer Query / Instructions</p>
                                        <p className='text-xs font-semibold text-amber-950 whitespace-pre-wrap leading-relaxed'>"{customerQuery}"</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Assigned Delivery Boy */}
                        <section className='bg-white rounded-3xl p-8 border border-gray-100 shadow-xs relative overflow-hidden'>
                            <div className='flex items-center gap-3 mb-6'>
                                <div className='w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center'>
                                    <FaMotorcycle size={16} />
                                </div>
                                <div>
                                    <h2 className='text-xs font-black text-gray-900 uppercase tracking-widest'>Delivery Partner</h2>
                                    <p className='text-[10px] text-gray-400 font-bold'>Logistics assignment</p>
                                </div>
                            </div>

                            {mainOrder.deliveryBoyId ? (
                                <div className='space-y-4'>
                                    <div className='flex items-center gap-3 bg-indigo-50 p-4 rounded-2xl border border-indigo-100'>
                                        <div className='w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 shrink-0'>
                                            <FaUserCheck size={14} />
                                        </div>
                                        <div className='flex-1'>
                                            <p className='text-[9px] font-black text-indigo-400 uppercase tracking-widest'>Assigned Partner</p>
                                            <p className='text-base font-black text-indigo-800 leading-tight'>
                                                {mainOrder.deliveryBoyId?.name || "Assigned Driver"}
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className='text-[9px] font-black text-gray-400 uppercase tracking-widest'>Contact</p>
                                        <p className='text-sm font-bold text-gray-700 leading-tight mt-0.5 flex items-center gap-2'>
                                            <FaPhoneAlt size={11} className='text-gray-400' />
                                            {mainOrder.deliveryBoyId?.mobile || "N/A"}
                                        </p>
                                    </div>
                                    {mainOrder.deliveryOTP && (
                                        <div>
                                            <p className='text-[9px] font-black text-gray-400 uppercase tracking-widest'>Delivery OTP</p>
                                            <span className='font-mono font-black text-sm bg-gray-100 text-gray-900 px-2.5 py-1 rounded-lg mt-0.5 inline-block'>
                                                {mainOrder.deliveryOTP}
                                            </span>
                                        </div>
                                    )}
                                    {/* Re-assign option */}
                                    {deliveryBoys.length > 0 && (
                                        <div className='pt-3 border-t border-gray-100'>
                                            <p className='text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2'>Re-assign to different partner</p>
                                            <div className='relative'>
                                                <select
                                                    defaultValue=""
                                                    disabled={assigning}
                                                    onChange={e => { if (e.target.value) handleAssignDeliveryBoy(e.target.value); e.target.value = ""; }}
                                                    className='w-full appearance-none border border-gray-200 bg-white px-4 py-3 rounded-2xl font-bold text-xs text-gray-700 outline-none focus:border-indigo-500 transition-all cursor-pointer'
                                                >
                                                    <option value="">Choose partner…</option>
                                                    {deliveryBoys.map(db => (
                                                        <option key={db._id} value={db._id}>{db.name} {db.mobile ? `(${db.mobile})` : ''}</option>
                                                    ))}
                                                </select>
                                                <div className='absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-[8px]'>▼</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className='space-y-4'>
                                    <div className='h-24 flex flex-col items-center justify-center text-center p-4 rounded-2xl bg-amber-50 border border-dashed border-amber-200'>
                                        <p className='text-xs font-black text-amber-600 uppercase tracking-wider'>⚠ No delivery partner assigned</p>
                                        <p className='text-[10px] text-amber-500 mt-1'>Assign one below</p>
                                    </div>
                                    {deliveryBoys.length === 0 ? (
                                        <p className='text-[10px] text-gray-500 font-bold bg-gray-50 px-4 py-3 rounded-2xl border border-gray-100'>
                                            No active delivery partners available. Activate a partner in Manage Users.
                                        </p>
                                    ) : (
                                        <div>
                                            <p className='text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2'>
                                                Assign Active Partner ({deliveryBoys.length} available)
                                            </p>
                                            <div className='relative'>
                                                <select
                                                    defaultValue=""
                                                    disabled={assigning}
                                                    onChange={e => { if (e.target.value) handleAssignDeliveryBoy(e.target.value); e.target.value = ""; }}
                                                    className='w-full appearance-none border border-indigo-200 bg-white px-4 py-4 rounded-2xl font-bold text-sm text-gray-700 outline-none focus:border-indigo-600 transition-all cursor-pointer shadow-xs'
                                                >
                                                    <option value="">Select a delivery partner…</option>
                                                    {deliveryBoys.map(db => (
                                                        <option key={db._id} value={db._id}>{db.name} {db.mobile ? `• ${db.mobile}` : ''}</option>
                                                    ))}
                                                </select>
                                                <div className='absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-[8px]'>▼</div>
                                            </div>
                                            {assigning && (
                                                <div className='flex items-center gap-2 mt-3 text-indigo-600 text-xs font-black'>
                                                    <FaSpinner className='animate-spin' size={12} /> Assigning…
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Shipping Address */}
                    <section className='bg-blue-50/40 rounded-3xl p-8 border border-blue-100/60 relative overflow-hidden'>
                        <div className='absolute top-0 right-0 p-8 opacity-10 pointer-events-none'>
                            <FaMapMarkerAlt size={120} className='text-blue-600' />
                        </div>
                        <div className='flex items-center gap-3 mb-6'>
                            <div className='w-10 h-10 rounded-2xl bg-blue-100/60 text-blue-700 flex items-center justify-center'>
                                <FaMapMarkerAlt size={15} />
                            </div>
                            <div>
                                <h2 className='text-xs font-black text-blue-900 uppercase tracking-widest'>Shipping Destination</h2>
                                <p className='text-[10px] text-blue-600/70 font-bold'>Delivery location</p>
                            </div>
                        </div>

                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10'>
                            <div className='space-y-1'>
                                <p className='text-[9px] font-black text-blue-500 uppercase tracking-widest'>Address Line</p>
                                <p className='text-base font-black text-gray-800 leading-tight'>{addressLine}</p>
                            </div>
                            <div className='space-y-1'>
                                <p className='text-[9px] font-black text-blue-500 uppercase tracking-widest'>City</p>
                                <p className='text-base font-black text-gray-800 leading-tight'>{addressCity}</p>
                            </div>
                            <div className='space-y-1'>
                                <p className='text-[9px] font-black text-blue-500 uppercase tracking-widest'>State & Pincode</p>
                                <p className='text-base font-black text-gray-800 leading-tight'>
                                    {addressState} {addressPincode ? `— ${addressPincode}` : ''}
                                </p>
                            </div>
                            <div className='space-y-1'>
                                <p className='text-[9px] font-black text-blue-500 uppercase tracking-widest'>Contact at Address</p>
                                <p className='text-base font-black text-gray-800 leading-tight flex items-center gap-2'>
                                    <FaPhoneAlt size={11} className='text-blue-500' />
                                    {addressMobile}
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Order Items */}
                    <section className='space-y-4'>
                        <div className='flex items-center justify-between px-2'>
                            <h2 className='text-xs font-black text-gray-400 uppercase tracking-[3px]'>Order Items</h2>
                            <span className='bg-white px-3 py-1 rounded-full text-[10px] font-black text-gray-600 uppercase border border-gray-100 shadow-xs'>
                                {orderItems.length} {orderItems.length === 1 ? 'ITEM' : 'ITEMS'}
                            </span>
                        </div>
                        <div className='space-y-3'>
                            {orderItems.map((item, idx) => {
                                const product = item.productId || {};
                                const name = item.product_details?.name || product.name || "Product Item";
                                const image = item.product_details?.image || product.image;
                                const quantity = item.product_details?.quantity || item.quantity || 1;
                                const price = item.subTotalAmt != null ? item.subTotalAmt : (product.price ? product.price * quantity : 0);

                                return (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        key={item._id || idx}
                                        className='bg-white rounded-3xl p-5 flex items-center gap-6 border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all'
                                    >
                                        <div className='w-20 h-20 bg-gray-50 rounded-2xl overflow-hidden p-2 shrink-0 border border-gray-100 flex items-center justify-center'>
                                            <img 
                                                src={getImageUrl(image)} 
                                                alt={name}
                                                className='w-full h-full object-contain'
                                                onError={(e) => { e.target.src = '/placeholder.png'; }}
                                            />
                                        </div>
                                        <div className='flex-1 min-w-0'>
                                            <h3 className='font-black text-gray-900 text-base leading-tight truncate mb-1'>{name}</h3>
                                            <div className='flex items-center gap-3 text-xs text-gray-400 font-bold'>
                                                <span className='bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider'>
                                                    QTY: {quantity}
                                                </span>
                                                {product.unit && (
                                                    <span className='text-[11px] text-gray-500'>Unit: {product.unit}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className='text-right shrink-0'>
                                            <p className='text-lg font-black text-gray-900 tracking-tight'>₹{price}</p>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </section>
                </div>

                {/* Right Column: Billing & Quick Actions */}
                <div className='space-y-8'>
                    {/* Billing Summary */}
                    <section className='bg-gray-950 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden'>
                        <div className='absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl' />
                        <div className='flex items-center gap-3 mb-8 opacity-60'>
                            <FaReceipt size={14} />
                            <h2 className='text-[10px] font-black uppercase tracking-[3px]'>Payment & Billing</h2>
                        </div>
                        <div className='space-y-4'>
                            <div className='flex justify-between items-center text-xs opacity-70'>
                                <span>Items Subtotal</span>
                                <span className='font-bold'>₹{itemsSubtotal}</span>
                            </div>
                            {mainOrder.deliveryCharge > 0 && (
                                <div className='flex justify-between items-center text-xs opacity-70'>
                                    <span>Delivery Charge</span>
                                    <span className='font-bold'>₹{mainOrder.deliveryCharge}</span>
                                </div>
                            )}
                            {mainOrder.handlingCharge > 0 && (
                                <div className='flex justify-between items-center text-xs opacity-70'>
                                    <span>Handling Charge</span>
                                    <span className='font-bold'>₹{mainOrder.handlingCharge}</span>
                                </div>
                            )}
                            {mainOrder.discountAmt > 0 && (
                                <div className='flex justify-between items-center text-xs text-green-400'>
                                    <span>Discount {mainOrder.couponCode ? `(${mainOrder.couponCode})` : ''}</span>
                                    <span className='font-bold'>- ₹{mainOrder.discountAmt}</span>
                                </div>
                            )}

                            <div className='h-[1px] bg-white/10 my-2' />

                            <div>
                                <p className='text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-1'>Total Amount</p>
                                <p className='text-4xl font-black text-white tracking-tight'>₹{totalAmount}</p>
                            </div>

                            <div className='pt-4'>
                                <div className='bg-white/5 border border-white/10 w-full px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[2px] flex items-center justify-center gap-3'>
                                    <FaCheckCircle className={mainOrder.payment_status === 'CASH ON DELIVERY' ? 'text-orange-400' : 'text-green-400'} size={14} />
                                    <span>{mainOrder.payment_status || "Pending Payment"}</span>
                                </div>
                            </div>
                            {mainOrder.paymentId && (
                                <p className='text-[10px] text-gray-400 font-mono text-center truncate'>
                                    Txn ID: {mainOrder.paymentId}
                                </p>
                            )}

                            {mainOrder.payment_screenshot && (
                                <div className='pt-3 border-t border-white/10'>
                                    <p className='text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-2'>
                                        Payment Screenshot Proof
                                    </p>
                                    <a
                                        href={mainOrder.payment_screenshot}
                                        target='_blank'
                                        rel='noopener noreferrer'
                                        className='block bg-white/10 hover:bg-white/15 p-2 rounded-2xl border border-white/15 transition-all group'
                                    >
                                        <div className='flex items-center gap-3'>
                                            <img
                                                src={mainOrder.payment_screenshot}
                                                alt='Payment Proof'
                                                className='w-14 h-14 object-cover rounded-xl border border-white/20 group-hover:scale-105 transition-transform'
                                            />
                                            <div className='min-w-0 flex-1'>
                                                <p className='text-xs font-bold text-white group-hover:text-indigo-300 transition-colors flex items-center gap-1'>
                                                    <span>View Screenshot</span>
                                                    <span>↗</span>
                                                </p>
                                                <p className='text-[10px] text-gray-400'>Click to open full image</p>
                                            </div>
                                        </div>
                                    </a>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Quick Status Actions */}
                    <section className='bg-white rounded-3xl p-8 border border-gray-100 shadow-xs'>
                        <div className='flex items-center justify-between mb-6 px-1'>
                            <h2 className='text-xs font-black text-gray-400 uppercase tracking-[3px]'>Update Status</h2>
                            {updating && (
                                <span className='flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest'>
                                    <FaSpinner className='animate-spin' size={12} /> Updating...
                                </span>
                            )}
                        </div>
                        <div className='space-y-2.5'>
                            {statusSteps.map(s => {
                                const isCurrent = (mainOrder.status || "").toLowerCase() === s.toLowerCase();
                                return (
                                    <button 
                                        key={s} 
                                        disabled={updating || isCurrent}
                                        onClick={() => handleUpdateStatus(s)}
                                        className={`w-full py-4 px-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-between ${
                                            isCurrent 
                                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' 
                                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                        } disabled:cursor-not-allowed`}
                                    >
                                        <span>{s}</span>
                                        {isCurrent && <FaCheckCircle size={12} />}
                                    </button>
                                );
                            })}
                            <button
                                disabled={updating || isCancelled}
                                onClick={() => {
                                    if (window.confirm("Are you sure you want to cancel this order?")) {
                                        handleUpdateStatus("Cancelled");
                                    }
                                }}
                                className={`w-full py-4 px-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-between mt-4 ${
                                    isCancelled
                                        ? 'bg-red-600 text-white shadow-md shadow-red-100'
                                        : 'bg-red-50 text-red-600 hover:bg-red-100'
                                } disabled:cursor-not-allowed`}
                            >
                                <span>Cancelled</span>
                                {isCancelled && <FaCheckCircle size={12} />}
                            </button>
                        </div>
                    </section>
                </div>
        </div>

        {/* Zoom Lightbox Modal */}
        {previewModal && (
            <div 
                className='fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4'
                onClick={() => setPreviewModal(null)}
            >
                <div 
                    className='bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl relative max-h-[92vh] flex flex-col'
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className='flex items-center justify-between pb-3 border-b border-gray-100 mb-4'>
                        <div>
                            <h3 className='text-sm font-black uppercase tracking-wider text-gray-900'>
                                Payment Screenshot #{mainOrder.orderId || orderId}
                            </h3>
                            <p className='text-[10px] text-gray-400 font-bold'>
                                Customer: {customerName} • Total: ₹{totalAmount}
                            </p>
                        </div>
                        <div className='flex items-center gap-2'>
                            <a
                                href={previewModal}
                                target='_blank'
                                rel='noopener noreferrer'
                                className='px-3.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors'
                            >
                                <span>Open Original</span>
                                <span>↗</span>
                            </a>
                            <button
                                onClick={() => setPreviewModal(null)}
                                className='w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center font-bold text-sm cursor-pointer'
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    <div className='flex-1 overflow-auto rounded-2xl bg-gray-50 border border-gray-100 p-2 flex items-center justify-center min-h-[350px]'>
                        <img 
                            src={previewModal} 
                            alt='Payment Proof Full' 
                            className='max-h-[70vh] w-auto object-contain rounded-xl shadow-xs' 
                        />
                    </div>
                </div>
            </div>
        )}
    </div>
    );
};

export default AdminOrderDetails;
