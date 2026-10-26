import React, { useEffect, useState } from 'react'
import { IoClose, IoTicketOutline, IoTrashOutline } from 'react-icons/io5'
import { Link, useNavigate } from 'react-router-dom'
import { useGlobalContext } from '../provider/GlobalProvider'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import { FaCaretRight, FaCheckCircle, FaPercentage } from "react-icons/fa";
import { useSelector } from 'react-redux'
import AddToCartButton from './AddToCartButton'
import { getDiscountPercent } from '../utils/PriceWithDiscount'
import imageEmpty from '../assets/empty_cart.avif'
import toast from 'react-hot-toast'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import AxiosToastError from '../utils/AxiosToastError'
import { createPortal } from 'react-dom'

const DisplayCartItem = ({ close }) => {

    const { 
        notDiscountTotalPrice, 
        totalPrice, 
        totalQty, 
        deliveryCharge, 
        handlingCharge, 
        couponDiscount, 
        appliedCoupon, 
        setAppliedCoupon,
        deleteCartItem
    } = useGlobalContext()
    const cartItem = useSelector(s => s.cartItem.cart)
    const user = useSelector(s => s.user)
    const addressList = useSelector(s => s.addresses?.addressList || [])
    const navigate = useNavigate()

    const getCartDeliveryDate = () => {
        const primaryAddress = addressList?.[0];
        const pin = primaryAddress?.pincode;
        const firstDigit = pin ? pin.charAt(0) : '';
        let baseStart = 3;
        
        if (firstDigit === '1') {
          baseStart = 3;
        } else if (firstDigit === '2') {
          baseStart = 4;
        } else if (firstDigit === '3') {
          baseStart = 5;
        } else if (firstDigit === '4') {
          baseStart = 4;
        } else if (firstDigit === '5') {
          baseStart = 3;
        } else if (firstDigit === '6') {
          baseStart = 2;
        } else {
          baseStart = 3;
        }

        // Dynamic Delivery Speed based on Cart Quantity: Less items -> slower, More items (>1) OR same item qty >= 2 -> faster delivery
        const hasSameItemSpeedup = cartItem.some(item => (item.quantity || 1) >= 2);
        const cartQtyOffset = (totalQty <= 1 && !hasSameItemSpeedup) ? 3 : 0;
        const startOffset = baseStart + cartQtyOffset;

        const deliveryDate = new Date(Date.now() + startOffset * 24 * 60 * 60 * 1000);
        return deliveryDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const [couponCode, setCouponCode] = useState("")
    const [availableCoupons, setAvailableCoupons] = useState([])
    const [loadingCoupons, setLoadingCoupons] = useState(false)

    useEffect(() => {
        document.body.style.overflow = "hidden";
        fetchAvailableCoupons();
        
        return () => {
            document.body.style.overflow = "auto";
        }
    }, []);

    const fetchAvailableCoupons = async () => {
        try {
            setLoadingCoupons(true)
            const response = await Axios(SummaryApi.coupon_list)
            if (response.data.success) {
                // Filter active and valid coupons
                let active = (response.data.coupons || []).filter(c => c.isActive && !c.isExpired)
                
                // 🔥 REMOVE USED COUPONS
                if (user?.usedCoupons) {
                    active = active.filter(c => !user.usedCoupons.includes(c.code));
                }

                setAvailableCoupons(active)
            }
        } catch (error) {
            console.error("Error fetching coupons", error)
        } finally {
            setLoadingCoupons(false)
        }
    }

    const grandTotal = totalPrice + deliveryCharge + handlingCharge - couponDiscount;

    const handleApplyCoupon = async (code) => {
        const targetCode = code || couponCode;
        if (!targetCode) return;

        try {
            const response = await Axios({
                ...SummaryApi.coupon_apply,
                data: { code: targetCode, totalAmount: totalPrice }
            })
            if (response.data.success) {
                setAppliedCoupon(response.data.coupon)
                toast.success("Coupon applied!")
                setCouponCode("")
            } else {
                toast.error(response.data.message || "Invalid Coupon")
            }
        } catch (error) {
            AxiosToastError(error)
        }
    }

    const applyBestCoupon = () => {
        if (!availableCoupons.length) return;

        let best = null;
        let maxDiscount = -1;

        availableCoupons.forEach(coupon => {
            // Basic validation
            if (totalPrice >= (coupon.minAmount || 0)) {
                let discount = (totalPrice * coupon.discountPercent) / 100;
                if (coupon.maxDiscount && discount > coupon.maxDiscount) {
                    discount = coupon.maxDiscount;
                }

                if (discount > maxDiscount) {
                    maxDiscount = discount;
                    best = coupon;
                }
            }
        });

        if (best) {
            handleApplyCoupon(best.code);
        } else {
            toast.error("No applicable coupons found for this order amount");
        }
    }

    const redirectToCheckoutPage = () => {
        if (user?._id) {
            navigate("/checkout")
            close && close()
        } else {
            toast("Please Login")
        }
    }

    return createPortal(
        <section className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-end">

            <div className="bg-white dark:bg-neutral-900 w-full max-w-md h-full flex flex-col shadow-2xl animate-slide-in transition-colors duration-300">

                <div className="flex items-center justify-between p-5 border-b dark:border-neutral-800 bg-white dark:bg-neutral-900 sticky top-0 z-40">
                    <div className='flex items-center gap-2'>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">My Cart</h2>
                        <span className='bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full text-xs font-bold'>{totalQty} Items</span>
                    </div>
                    <button onClick={close ? close : () => navigate(-1)} className='p-1 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition text-gray-800 dark:text-gray-200'>
                        <IoClose size={28} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-neutral-950 space-y-4 custom-scrollbar">

                    {totalQty === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <img src={imageEmpty} className="w-64 opacity-90 mb-4" />
                            <h3 className='text-lg font-semibold text-gray-700'>Your cart is empty</h3>
                            <p className='text-gray-500 text-sm mb-6'>Add some items to start shopping!</p>
                            <Link 
                                onClick={close} 
                                to="/" 
                                className="bg-green-600 hover:bg-green-700 px-8 py-3 rounded-xl text-white font-bold transition shadow-lg shadow-green-200">
                                Start Shopping
                            </Link>
                        </div>
                    ) : (
                        <>
                            {/* Delivery Banner */}
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-emerald-950/20 dark:to-green-950/20 p-4 rounded-2xl border border-green-100 dark:border-green-900/30 flex items-center gap-3">
                                <div className='bg-green-600 p-2 rounded-lg text-white'>
                                    <FaCheckCircle />
                                </div>
                                <div>
                                    <p className="font-bold text-green-800 dark:text-green-300 text-sm">
                                        {deliveryCharge === 0 ? "Yay! Free Delivery Unlocked" : "Add ₹" + (199 - totalPrice) + " more for Free Delivery"}
                                    </p>
                                    <p className="text-green-600 dark:text-green-400 text-xs mt-0.5 font-medium">
                                        Arriving at your doorstep by {getCartDeliveryDate()}
                                    </p>
                                </div>
                            </div>

                            {/* 🎫 Coupon Section */}
                            <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800 space-y-4 transition-colors">
                                <div className='flex items-center justify-between'>
                                    <div className='flex items-center gap-2'>
                                        <IoTicketOutline className='text-xl text-green-600 dark:text-green-400' />
                                        <p className="font-bold text-gray-800 dark:text-gray-200 text-sm tracking-tight uppercase">Coupens & Offers</p>
                                    </div>
                                    {!appliedCoupon && availableCoupons.length > 0 && (
                                        <button 
                                            onClick={applyBestCoupon}
                                            className='text-xs font-bold text-green-600 hover:text-green-700 underline decoration-2'
                                        >
                                            Apply Best
                                        </button>
                                    )}
                                </div>

                                {!appliedCoupon ? (
                                    <div className='space-y-4'>
                                        <div className="flex gap-2 p-1 bg-gray-50 dark:bg-neutral-950 rounded-xl border border-gray-200 dark:border-neutral-800 focus-within:border-green-400 transition-all">
                                            <input 
                                                type="text" 
                                                placeholder="Enter Coupon Code"
                                                value={couponCode}
                                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                                className="bg-transparent flex-1 px-3 py-2 text-sm rounded outline-none uppercase font-bold text-gray-700 dark:text-gray-200"
                                            />
                                            <button 
                                                onClick={() => handleApplyCoupon()}
                                                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-bold text-xs transition"
                                            >
                                                APPLY
                                            </button>
                                        </div>

                                        {/* Available Coupons List */}
                                        <div className='flex gap-3 overflow-x-auto pb-2 scrollbar-none'>
                                            {availableCoupons.map((c) => (
                                                <div 
                                                    key={c._id} 
                                                    onClick={() => handleApplyCoupon(c.code)}
                                                    className='min-w-[140px] bg-white dark:bg-neutral-900 border-2 border-dashed border-green-200 dark:border-green-900/50 p-3 rounded-xl cursor-pointer hover:border-green-500 hover:bg-green-50 dark:hover:bg-neutral-800 transition-all'
                                                >
                                                    <p className='font-black text-green-700 dark:text-green-400 text-xs bg-green-100 dark:bg-green-900/30 w-fit px-2 py-0.5 rounded mb-1'>{c.code}</p>
                                                    <p className='text-[10px] font-bold text-gray-800 dark:text-gray-200'>{c.discountPercent}% OFF</p>
                                                    <p className='text-[9px] text-gray-500 mt-1 line-clamp-1'>Above ₹{c.minAmount}</p>
                                                </div>
                                            ))}
                                            {availableCoupons.length === 0 && !loadingCoupons && (
                                                <p className='text-xs text-gray-400 font-medium italic'>No active coupons available right now.</p>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-center bg-green-50 p-3 rounded-xl border border-green-200 animate-pulse-once">
                                        <div className='flex items-center gap-3'>
                                            <div className='bg-green-600 text-white p-2 rounded-lg'>
                                                <FaPercentage />
                                            </div>
                                            <div>
                                                <p className="text-green-800 font-black text-sm tracking-wider">{appliedCoupon.code}</p>
                                                <p className="text-[10px] text-green-600 font-bold uppercase tracking-tighter">Applied successfully!</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setAppliedCoupon(null)}
                                            className="text-red-500 text-xs font-black hover:text-red-600 transition"
                                        >
                                            REMOVE
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Cart Items */}
                            <div className="bg-white dark:bg-neutral-900 p-6 rounded-[2rem] shadow-xl shadow-gray-100/50 dark:shadow-none border border-gray-50 dark:border-neutral-800 space-y-6 transition-colors">
                                <h3 className='text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-1'>Cart Summary</h3>
                                <div className='space-y-5'>
                                    {cartItem.filter(item => item.productId).map((item) => {
                                        const variant = item.productId?.variants?.find(option => option.unit === item.unit)
                                        const price = variant?.price ?? item.productId?.price ?? 0
                                        const mrp = variant?.mrp ?? item.productId?.mrp ?? price
                                        return (
                                        <div key={item._id + (item.unit || "")} className="flex items-center gap-4 group">
                                            <div className='relative shrink-0'>
                                                <div className='w-20 h-20 rounded-2xl bg-gray-50 dark:bg-neutral-950 border border-gray-100 dark:border-neutral-800 overflow-hidden flex items-center justify-center p-2 group-hover:border-green-200 transition-all'>
                                                    <img
                                                        src={item.productId?.image?.[0]}
                                                        className="w-full h-full object-contain"
                                                    />
                                                </div>
                                                <span className='absolute -top-2 -right-2 bg-gray-900 dark:bg-neutral-100 text-white dark:text-neutral-900 w-6 h-6 rounded-full text-[10px] flex items-center justify-center font-black border-4 border-white dark:border-neutral-900 shadow-lg'>{item.quantity}</span>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <p className="font-black text-gray-900 dark:text-gray-100 text-sm leading-tight line-clamp-2 uppercase tracking-tight">{item.productId?.name}</p>
                                                <p className="text-gray-400 dark:text-neutral-500 text-[10px] font-black uppercase mt-1 tracking-wider">{item.unit || item.productId?.unit}</p>
                                                <div className='flex items-center gap-2 mt-2'>
                                                    <p className="font-black text-indigo-600 dark:text-indigo-400 text-sm">
                                                        {DisplayPriceInRupees(price)}
                                                    </p>
                                                    {getDiscountPercent(mrp, price) > 0 && (
                                                        <span className='text-[9px] line-through text-gray-300 font-bold'>{DisplayPriceInRupees(mrp)}</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className='flex items-center gap-2 shrink-0'>
                                                <div className='w-24'>
                                                    <AddToCartButton data={{
                                                        ...item.productId,
                                                        unit: item.unit, // ✅ CRITICAL: Use raw cart item unit so lookup inside AddToCartButton succeeds perfectly
                                                        price: item.productId?.price, // Base price, button handles lookup if needed or uses passed data
                                                        _id: item.productId?._id // Use product ID for API calls
                                                    }} />
                                                </div>
                                                <button
                                                    onClick={() => deleteCartItem(item._id)}
                                                    className='p-2 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl transition-all active:scale-95 shadow-sm'
                                                    title="Delete Product"
                                                >
                                                    <IoTrashOutline size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    )})}
                                </div>
                            </div>

                            {/* Bill Details */}
                            <div className="p-8 rounded-[2.5rem] bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 shadow-2xl shadow-gray-200 dark:shadow-none border border-gray-50 dark:border-neutral-800 space-y-5 relative overflow-hidden transition-colors">
                                {/* Decorative elements */}
                                <div className='absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl' />
                                <div className='absolute bottom-0 left-0 w-24 h-24 bg-green-500/10 rounded-full -ml-12 -mb-12 blur-2xl' />

                                <h3 className="text-[10px] font-black text-gray-900 dark:text-gray-100 uppercase tracking-[0.3em] mb-6">Order Details</h3>

                                <div className="space-y-4">
                                    <div className="flex justify-between text-xs font-bold">
                                        <p className='text-gray-900 dark:text-gray-100 uppercase tracking-wider'>Items Total</p>
                                        <div className='text-right'>
                                            <span className="line-through text-gray-500 text-[10px] mr-2 italic">
                                                {DisplayPriceInRupees(notDiscountTotalPrice)}
                                            </span>
                                            <span className='text-gray-900 dark:text-gray-100'>{DisplayPriceInRupees(totalPrice)}</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between text-xs font-bold">
                                        <p className='text-gray-900 dark:text-gray-100 uppercase tracking-wider'>Delivery</p>
                                        {deliveryCharge === 0 ? (
                                            <p className="text-green-400">FREE</p>
                                        ) : (
                                            <p className='text-gray-900 dark:text-gray-100'>{DisplayPriceInRupees(deliveryCharge)}</p>
                                        )}
                                    </div>

                                    {handlingCharge > 0 && (
                                        <div className="flex justify-between text-xs font-bold">
                                            <p className='text-gray-900 dark:text-gray-100 uppercase tracking-wider'>Handling</p>
                                            <p className='text-gray-900 dark:text-gray-100'>{DisplayPriceInRupees(handlingCharge)}</p>
                                        </div>
                                    )}

                                    {couponDiscount > 0 && (
                                        <div className="flex justify-between text-xs font-black text-green-400 bg-green-400/10 p-3 rounded-2xl border border-green-400/20">
                                            <div className='flex items-center gap-2'>
                                                <IoTicketOutline size={14}/>
                                                <p className='uppercase tracking-widest'>Discount</p>
                                            </div>
                                            <p>- {DisplayPriceInRupees(couponDiscount)}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-6 border-t border-white/10 flex justify-between items-end mt-4">
                                    <div>
                                        <p className='text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1'>To Pay</p>
                                        <p className='text-3xl font-black text-gray-900 dark:text-white tracking-tighter'>{DisplayPriceInRupees(grandTotal)}</p>
                                    </div>
                                    <div className='bg-green-500/20 text-green-400 px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest border border-green-500/30'>
                                        Savings: {DisplayPriceInRupees(notDiscountTotalPrice - totalPrice + couponDiscount)}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {totalQty > 0 && (
                    <div className="p-4 pb-24 lg:pb-4 border-t dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] sticky bottom-0 z-40 transition-colors duration-300">
                        <button 
                            onClick={redirectToCheckoutPage} 
                            className="w-full bg-gradient-to-r from-indigo-600 via-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white px-6 py-4 rounded-2xl flex justify-between items-center transition-all active:scale-[0.98] shadow-lg shadow-indigo-600/25"
                        >
                            <div className='flex flex-col items-start'>
                                <span className='text-[10px] font-bold text-indigo-200 uppercase tracking-widest'>Grand Total</span>
                                <span className="font-black text-xl leading-none">
                                    {DisplayPriceInRupees(grandTotal)}
                                </span>
                            </div>
                            <div className='flex items-center gap-2 bg-white/20 px-4 py-2 rounded-xl font-bold'>
                                <span>Proceed</span>
                                <FaCaretRight />
                            </div>
                        </button>
                    </div>
                )}
            </div>
        </section>,
        document.body
    )
}

export default DisplayCartItem