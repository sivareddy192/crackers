import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import { IoClose, IoCopyOutline } from 'react-icons/io5';
import { getImageUrl } from '../utils/getImageUrl';
import AddToCartButton from './AddToCartButton';
import toast from 'react-hot-toast';

const WelcomeOffersPopup = () => {
  const user = useSelector((state) => state.user);
  const [isOpen, setIsOpen] = useState(false);
  const [coupon, setCoupon] = useState(null);
  const [productDeals, setProductDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (
      user?._id &&
      (!user.orderHistory || user.orderHistory.length === 0) &&
      (!user.usedCoupons || user.usedCoupons.length === 0)
    ) {
      const isShown = localStorage.getItem(`welcome_offers_shown_${user._id}`);
      if (!isShown) {
        fetchData();
      }
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [couponRes, dealsRes] = await Promise.all([
        Axios(SummaryApi.coupon_list),
        Axios(SummaryApi.product_offers)
      ]);

      if (couponRes.data.success) {
        const welcomeCoupon = couponRes.data.coupons?.find(c => c.isFirstOrderOnly && c.isActive);
        setCoupon(welcomeCoupon || null);
      }

      if (dealsRes.data.success) {
        setProductDeals(dealsRes.data.data || []);
      }

      if (
        (couponRes.data.success && couponRes.data.coupons?.some(c => c.isFirstOrderOnly && c.isActive)) ||
        (dealsRes.data.success && dealsRes.data.data?.length > 0)
      ) {
        setIsOpen(true);
        localStorage.setItem(`welcome_offers_shown_${user._id}`, 'true');
      }
    } catch (error) {
      console.error("Error loading welcome offers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCoupon = () => {
    if (!coupon) return;
    navigator.clipboard.writeText(coupon.code);
    setCopied(true);
    toast.success(`Coupon "${coupon.code}" copied to clipboard!`);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-99 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 md:p-6 overflow-y-auto animate-in fade-in duration-300">
      <div className="bg-white dark:bg-neutral-900 rounded-3xl w-full max-w-2xl shadow-2xl relative border border-slate-100 dark:border-neutral-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-500 scale-100 transition-all max-h-[90vh]">
        
        <div className="relative bg-linear-to-br from-orange-500 via-red-500 to-fuchsia-600 text-white px-6 py-8 md:py-12 text-center overflow-hidden shrink-0">
          
          <div className="absolute top-4 left-10 bg-yellow-300 w-2 h-2 rounded-full animate-pulse opacity-75" />
          <div className="absolute top-12 right-20 bg-teal-300 w-3 h-3 rounded-sm rotate-45 opacity-60" />
          <div className="absolute bottom-8 left-20 bg-pink-300 w-2 h-4 rounded opacity-80 animate-bounce" />
          <div className="absolute bottom-4 right-10 bg-white/30 w-12 h-12 rounded-full" />

          <button 
            onClick={() => setIsOpen(false)} 
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-all cursor-pointer z-10"
          >
            <IoClose size={24} />
          </button>

          <div className="inline-flex bg-white/20 backdrop-blur-md border border-white/30 text-xs font-black tracking-widest px-3 py-1 rounded-full uppercase mb-3 scale-95">
            Welcome Gift 🎁
          </div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter mb-2">
            Welcome to Trace, {user.name?.split(' ')[0]}!
          </h2>
          <p className="text-white/90 text-sm md:text-base font-medium max-w-md mx-auto opacity-90 leading-tight">
            We're thrilled to have you! To start your journey, we've prepared these exclusive introductory offers just for you.
          </p>
        </div>

        <div className="p-6 md:p-8 overflow-y-auto space-y-8 bg-slate-50 dark:bg-neutral-950 flex-1">
          
          {coupon && (
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-neutral-800 pb-2">
                <h3 className="font-black text-xs uppercase tracking-wider text-slate-400 dark:text-neutral-500">Exclusive Starter Promo</h3>
                <span className="text-xs font-bold text-red-500 animate-pulse">One-time Only!</span>
              </div>
              
              <div className="relative bg-white dark:bg-neutral-900 border-2 border-dashed border-orange-400 dark:border-orange-500/60 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-lg shadow-orange-500/5 transition-transform hover:scale-[1.01]">
                <div className="space-y-1">
                  <span className="text-2xl font-black text-slate-800 dark:text-neutral-100 tracking-tighter block">
                    Get {coupon.discountPercent}% OFF Your Order
                  </span>
                  <p className="text-slate-500 text-xs dark:text-neutral-400">
                    {coupon.minAmount > 0 ? `Applies on orders over ₹${coupon.minAmount}` : 'Applies to any cart value'}
                    {coupon.maxDiscount > 0 ? ` • Max savings ₹${coupon.maxDiscount}` : ''}
                  </p>
                </div>

                <button
                  onClick={handleCopyCoupon}
                  className="flex items-center justify-center gap-2 self-start sm:self-center bg-linear-to-r from-orange-500 to-pink-500 hover:opacity-90 text-white font-extrabold tracking-widest text-sm px-6 py-3 rounded-xl transition-all active:scale-95 select-none shadow-md cursor-pointer group uppercase"
                >
                  <span>{coupon.code}</span>
                  <IoCopyOutline size={16} className="group-hover:rotate-12 transition-transform" />
                </button>
              </div>
            </div>
          )}

          {productDeals.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-neutral-800 pb-2">
                <h3 className="font-black text-xs uppercase tracking-wider text-slate-400 dark:text-neutral-500">Hot Deals For You</h3>
                <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-widest border border-red-200 dark:border-red-800">Trending</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {productDeals.map((product) => {
                  const calculatedDiscount = product.mrp > 0 ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : product.discount;
                  
                  return (
                    <div key={product._id} className="bg-white dark:bg-neutral-900 border border-slate-100 dark:border-neutral-800 rounded-2xl p-3 flex flex-col shadow-xs hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-black/20 transition-all duration-300 group shrink-0 select-none">
                      
                      <div className="relative w-full aspect-square bg-slate-50 dark:bg-neutral-800 rounded-xl overflow-hidden flex items-center justify-center mb-2">
                        <img 
                          src={getImageUrl(product.image?.[0])} 
                          alt={product.name}
                          className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                        />
                        {calculatedDiscount > 0 && (
                          <span className="absolute top-1.5 left-1.5 bg-green-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm">
                            {calculatedDiscount}% OFF
                          </span>
                        )}
                      </div>

                      <div className="flex-1 flex flex-col mb-2">
                        <h4 className="text-xs font-extrabold text-slate-800 dark:text-neutral-100 line-clamp-2 tracking-tight min-h-[2rem] leading-tight uppercase">
                          {product.name}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-bold">{product.unit || '1 unit'}</span>
                        
                        <div className="mt-1.5 flex items-baseline gap-1">
                          <span className="text-sm font-black text-slate-900 dark:text-neutral-100">₹{product.price}</span>
                          {product.mrp > product.price && (
                            <span className="text-[10px] text-slate-400 line-through">₹{product.mrp}</span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 mt-auto">
                        <AddToCartButton data={product} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="text-center pt-4">
            <button 
              onClick={() => setIsOpen(false)}
              className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-white text-sm font-black px-8 py-4 rounded-2xl transition-all active:scale-95 uppercase tracking-widest cursor-pointer shadow-xl shadow-slate-900/10"
            >
              Start Shopping Now
            </button>
            <p className="text-[10px] text-slate-400 dark:text-neutral-500 font-medium mt-3">
              *Welcome discount applies automatically only on your very first order.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};

export default WelcomeOffersPopup;
