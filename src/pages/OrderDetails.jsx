import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import { FaChevronLeft, FaMotorcycle, FaMapMarkerAlt, FaPhoneAlt } from 'react-icons/fa'
import { getImageUrl } from '../utils/getImageUrl'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import Skeleton from '../components/Skeleton'

import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const deliveryIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2972/2972185.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
});

const RecenterMap = ({ coords }) => {
    const map = useMap();
    useEffect(() => {
        if (coords) {
            map.setView(coords, map.getZoom());
        }
    }, [coords]);
    return null;
}

const statusSteps = [
    "Pending",
    "Confirmed",
    "Shipped",
    "Out for Delivery",
    "Delivered",
];

const OrderDetails = () => {
    const { orderId } = useParams()
    const navigate = useNavigate()
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchOrderDetails = useCallback(async () => {
        try {
            const res = await Axios({ ...SummaryApi.order.getOrders })
            const allOrders = res?.data?.data || []
            const filteredOrders = allOrders.filter(o => (o.orderId === orderId || o._id === orderId))
            setOrders(filteredOrders)
        } catch (err) {
            console.error("Fetch Order Details Error:", err)
        } finally {
            setLoading(false)
        }
    }, [orderId])

    useEffect(() => {
        fetchOrderDetails()
        const interval = setInterval(fetchOrderDetails, 5000)
        return () => clearInterval(interval)
    }, [fetchOrderDetails])


    if (loading) return (
        <div className='bg-gray-50 min-h-screen p-4 md:p-8 animate-pulse'>
            <div className='max-w-4xl mx-auto'>
                <div className='h-6 w-32 bg-gray-200 rounded mb-6' />
                <div className='bg-white rounded-3xl p-6 md:p-8 border border-gray-100 space-y-8'>
                    <div className='flex justify-between items-center'>
                        <div className='space-y-2'>
                            <Skeleton className='h-7 w-48' />
                            <Skeleton className='h-4 w-32' />
                        </div>
                        <div className='flex gap-2'>
                            <Skeleton className='h-8 w-24 rounded-xl' />
                            <Skeleton className='h-8 w-24 rounded-xl' />
                        </div>
                    </div>
                    <Skeleton className='h-12 w-full rounded-xl' />
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-gray-100'>
                        <Skeleton className='h-40 w-full rounded-2xl' />
                        <Skeleton className='h-40 w-full rounded-2xl' />
                        <Skeleton className='h-40 w-full rounded-2xl' />
                    </div>
                </div>
            </div>
        </div>
    );

    if (orders.length === 0) return (
        <div className='p-10 text-center'>
            <p className='text-gray-500 mb-4'>Order not found</p>
            <button onClick={() => navigate(-1)} className='text-blue-500'>Go Back</button>
        </div>
    )

    const mainOrder = orders[0]
    const activeStatusIndex = statusSteps.indexOf(mainOrder.status)

    return (
        <div className='bg-gray-50 min-h-screen p-4 md:p-8'>
            <div className='max-w-4xl mx-auto'>
                <button 
                    onClick={() => navigate(-1)}
                    className='flex items-center gap-2 text-gray-600 hover:text-black mb-6 transition-colors'
                >
                    <FaChevronLeft /> Back to My Orders
                </button>

                <div className='bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100'>
                    <div className='p-5 md:p-8 bg-white border-b border-gray-100'>
                        <div className='flex flex-col md:flex-row md:items-center justify-between gap-6'>
                            <div>
                                <h1 className='text-2xl md:text-3xl font-black text-gray-900 tracking-tight'>Order #{orderId.slice(-6).toUpperCase()}</h1>
                                <p className='text-gray-400 mt-1 text-[11px] font-bold uppercase tracking-wider'>
                                    Ordered on {new Date(mainOrder.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </p>
                                {mainOrder.deliveryDate && (
                                    <p className='text-green-600 mt-1.5 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5'>
                                        <span className='w-1.5 h-1.5 bg-green-600 rounded-full animate-pulse' />
                                        🚚 Expected Delivery: {new Date(mainOrder.deliveryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </p>
                                )}
                            </div>
                            <div className='flex items-center gap-3'>
                                <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                                    mainOrder.payment_status === 'CASH ON DELIVERY' 
                                    ? 'bg-orange-50 text-orange-700 border-orange-100' 
                                    : 'bg-blue-50 text-blue-700 border-blue-100'
                                } shadow-sm`}>
                                    {mainOrder.payment_status === 'CASH ON DELIVERY' ? 'Cash on Delivery' : 'Paid Online'}
                                </span>
                                <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                                    mainOrder.status === 'Delivered' ? 'bg-green-50 text-green-700 border-green-100' : 
                                    mainOrder.status === 'Cancelled' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                                } shadow-sm`}>
                                    {mainOrder.status}
                                </span>
                            </div>
                        </div>

                        <div className='mt-12 mb-6 relative px-2'>
                            <div className='absolute top-2.5 left-6 right-6 h-0.5 bg-gray-100 rounded-full'>
                                <div 
                                    className='h-full bg-green-500 rounded-full transition-all duration-1000 ease-out'
                                    style={{ width: `${(activeStatusIndex / (statusSteps.length - 1)) * 100}%` }}
                                ></div>
                            </div>
                            <div className='relative flex justify-between'>
                                {statusSteps.map((step, index) => {
                                    const isActive = index <= activeStatusIndex
                                    const isCurrent = index === activeStatusIndex
                                    return (
                                        <div key={step} className='flex flex-col items-center group'>
                                            <div className={`w-5 h-5 rounded-full border-2 transition-all duration-500 flex items-center justify-center ${
                                                isActive ? 'bg-green-500 border-white ring-4 ring-green-50 shadow-sm' : 'bg-white border-gray-100'
                                            } ${isCurrent ? 'scale-125 z-10' : ''}`}>
                                                {isActive && (
                                                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>
                                            <span className={`mt-3 text-[8px] md:text-[10px] font-black uppercase tracking-tighter transition-colors duration-300 ${
                                                isActive ? 'text-green-700' : 'text-gray-300'
                                            }`}>
                                                {step === "Out for Delivery" ? "Out" : step}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {mainOrder.deliveryBoyId && mainOrder.status !== 'Delivered' && (
                        <div className='p-5 md:p-8 bg-white border-b border-gray-100'>
                            <div className='flex items-center justify-between mb-6'>
                                <div className='flex items-center gap-3'>
                                    <div className='w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-100'>
                                        <FaMotorcycle size={24} />
                                    </div>
                                    <div>
                                        <p className='text-[10px] font-black text-gray-400 uppercase tracking-widest'>Delivery Partner</p>
                                        <h3 className='font-black text-gray-800 text-base uppercase tracking-tight'>{mainOrder.deliveryBoyId?.name}</h3>
                                    </div>
                                </div>
                                <a href={`tel:${mainOrder.deliveryBoyId?.mobile}`} className='bg-blue-600 text-white p-3.5 rounded-2xl shadow-lg shadow-blue-100 hover:scale-105 active:scale-95 transition-all'>
                                    <FaPhoneAlt size={18} />
                                </a>
                            </div>

                            <div className='h-[300px] md:h-[400px] rounded-[2.5rem] overflow-hidden border-8 border-gray-50 shadow-inner relative z-10'>
                                <MapContainer 
                                    center={[mainOrder.deliveryBoyId?.currentLatitude || 20.5937, mainOrder.deliveryBoyId?.currentLongitude || 78.9629]} 
                                    zoom={15} 
                                    className='h-full w-full'
                                >
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                    
                                    {mainOrder.deliveryBoyId?.currentLatitude && (
                                        <Marker 
                                            position={[mainOrder.deliveryBoyId.currentLatitude, mainOrder.deliveryBoyId.currentLongitude]} 
                                            icon={deliveryIcon}
                                        >
                                            <Popup className='font-black text-xs uppercase'>Your Partner is here!</Popup>
                                        </Marker>
                                    )}

                                    {(mainOrder.delivery_address?.latitude || mainOrder.address?.latitude) && (
                                        <Marker position={[
                                            mainOrder.delivery_address?.latitude || mainOrder.address?.latitude, 
                                            mainOrder.delivery_address?.longitude || mainOrder.address?.longitude
                                        ]}>
                                            <Popup className='font-black text-xs uppercase'>Your Home</Popup>
                                        </Marker>
                                    )}

                                    <RecenterMap coords={
                                        mainOrder.deliveryBoyId?.currentLatitude 
                                        ? [mainOrder.deliveryBoyId.currentLatitude, mainOrder.deliveryBoyId.currentLongitude]
                                        : null
                                    } />
                                </MapContainer>
                            </div>
                            <p className='text-center mt-4 text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] flex items-center justify-center gap-2'>
                                <span className='w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping'></span>
                                Live Tracking Active
                            </p>
                        </div>
                    )}

                    <div className='p-5 md:p-8 bg-gray-50/30'>
                        <h2 className='text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6'>Items in this order</h2>
                        <div className='space-y-3'>
                            {orders.map((item, idx) => (
                                <div key={idx} className='bg-white p-3 rounded-2xl grid grid-cols-[64px_1fr_auto] items-center gap-4 border border-gray-100 shadow-sm hover:border-gray-200 transition-colors'>
                                    <div className='w-16 h-16 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center border border-gray-50 p-1'>
                                        <img 
                                            src={getImageUrl(item.product_details?.image || item.productId?.image)} 
                                            alt={item.product_details?.name}
                                            className='w-full h-full object-contain mix-blend-multiply'
                                        />
                                    </div>
                                    
                                    <div className='flex flex-col min-w-0'>
                                        <h3 className='font-black text-gray-900 text-[11px] md:text-sm leading-tight line-clamp-2 uppercase tracking-tight'>
                                            {item.product_details?.name}
                                        </h3>
                                        <p className='text-[9px] text-gray-400 font-bold uppercase mt-1 flex items-center gap-1'>
                                            <span className='w-1 h-1 bg-gray-300 rounded-full' />
                                            Qty: {item.product_details?.quantity || item.quantity || 1}
                                        </p>
                                    </div>

                                    <div className='text-right pl-2'>
                                        <p className='text-sm md:text-base font-black text-gray-900 whitespace-nowrap'>
                                            ₹{item.subTotalAmt || item.totalAmt}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className='p-5 md:p-8 bg-white border-t border-gray-100 grid md:grid-cols-2 gap-8'>
                        <div>
                            <h2 className='text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4'>Delivery Address</h2>
                            <div className='text-gray-600 text-xs leading-relaxed bg-gray-50 p-5 rounded-[2rem] border border-gray-100'>
                                <p className='font-black text-gray-900 text-sm mb-1'>{mainOrder.delivery_address?.address_line1 || mainOrder.address?.street}</p>
                                <p className='font-medium'>{mainOrder.delivery_address?.city || mainOrder.address?.city}, {mainOrder.delivery_address?.state || mainOrder.address?.state}</p>
                                <p className='font-medium'>{mainOrder.delivery_address?.pincode || mainOrder.address?.pincode}</p>
                                <div className='pt-3 mt-3 border-t border-gray-200/60 flex items-center gap-2 text-blue-600 font-bold'>
                                    <FaPhoneAlt size={10} />
                                    {mainOrder.delivery_address?.mobile || mainOrder.address?.phone || mainOrder.userId?.mobile}
                                </div>
                            </div>
                        </div>
                        <div className='flex flex-col justify-end'>
                            <div className='bg-gray-900 text-white p-6 rounded-[2.5rem] shadow-2xl shadow-gray-200 relative overflow-hidden'>
                                <div className='absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl' />
                                <div className='relative z-10 space-y-3'>
                                    <div className='flex justify-between items-center text-[10px] font-bold uppercase tracking-widest opacity-60'>
                                        <span>Subtotal</span>
                                        <span>₹{mainOrder.subTotalAmt}</span>
                                    </div>
                                    <div className='flex justify-between items-center text-[10px] font-bold uppercase tracking-widest opacity-60'>
                                        <span>Delivery Fee</span>
                                        <span className='text-green-400'>FREE</span>
                                    </div>
                                    <div className='pt-4 border-t border-white/10 flex justify-between items-center'>
                                        <div>
                                            <p className='text-[10px] font-black uppercase tracking-[0.2em] opacity-50 mb-1'>Grand Total</p>
                                            <p className='text-2xl font-black tracking-tight'>₹{mainOrder.totalAmt}</p>
                                        </div>
                                        <div className='bg-green-500 text-[10px] font-black px-3 py-1.5 rounded-lg shadow-lg shadow-green-900/20'>
                                            PAID
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default OrderDetails