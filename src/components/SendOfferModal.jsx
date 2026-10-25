import React, { useState } from 'react';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from '../utils/AxiosToastError';
import toast from 'react-hot-toast';
import { IoClose } from "react-icons/io5";
import { FiSend, FiMail, FiFileText, FiCheck } from "react-icons/fi";

const SendOfferModal = ({ close, couponData }) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    subject: `🎉 Special Offer! Get ${couponData.discountPercent}% OFF on Trace!`,
    headline: `Exclusive ${couponData.discountPercent}% OFF Just For You!`,
    description: "Celebrate with Trace! Use the code below at checkout to save on crackers and fireworks for your next occasion.",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSend = async () => {
    if (!form.subject.trim() || !form.headline.trim() || !form.description.trim()) {
      toast.error("Please fill out all fields to broadcast the offer!");
      return;
    }

    try {
      setLoading(true);
      const response = await Axios({
        ...SummaryApi.coupon_send_email,
        data: {
          couponId: couponData._id,
          ...form
        }
      });

      const { data } = response;
      if (data.success) {
        toast.success(data.message || "Broadcast initiated successfully!");
        close();
      } else {
        toast.error(data.message || "Failed to initiate email sending");
      }
    } catch (error) {
      AxiosToastError(error);
    } finally {
      setLoading(false);
    }
  };

  const formattedDate = couponData.expiryDate 
    ? new Date(couponData.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) 
    : 'Limited Time';

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300'>
      <div className='bg-white rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col md:flex-row overflow-hidden border border-slate-100 transition-transform scale-95 md:scale-100 duration-300'>
        
        {/* Form / Inputs Section */}
        <div className='flex-1 flex flex-col p-6 md:p-8 border-r border-slate-100'>
          <div className='flex justify-between items-center mb-6'>
            <div>
              <span className='text-xs font-bold tracking-widest text-orange-500 uppercase bg-orange-50 px-3 py-1 rounded-full border border-orange-100'>Admin Portal</span>
              <h3 className='text-2xl font-black text-slate-800 mt-2 tracking-tight flex items-center gap-2'>
                <FiMail className="text-orange-500" /> Broadcast Offer
              </h3>
            </div>
            <button onClick={close} className='p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-800 rounded-full transition-colors'>
              <IoClose size={24} />
            </button>
          </div>

          <p className='text-slate-500 text-sm mb-6 leading-relaxed'>
            Design and customize your promotional newsletter for this coupon. We'll send a tailored, personalized copy to all your registered Gmail users.
          </p>

          <div className='space-y-5 flex-1'>
            <div className='flex flex-col gap-2'>
              <label className='text-sm font-bold text-slate-700 flex items-center gap-2'>
                <FiMail size={14} /> Email Subject Line
              </label>
              <input 
                name="subject" 
                value={form.subject} 
                onChange={handleChange} 
                placeholder="Enter Subject" 
                className='px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none text-slate-700 transition-all text-sm'
              />
            </div>

            <div className='flex flex-col gap-2'>
              <label className='text-sm font-bold text-slate-700 flex items-center gap-2'>
                <FiFileText size={14} /> Banner Title / Headline
              </label>
              <input 
                name="headline" 
                value={form.headline} 
                onChange={handleChange} 
                placeholder="E.g., Big Weekend Sale!" 
                className='px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none text-slate-700 transition-all text-sm'
              />
            </div>

            <div className='flex flex-col gap-2'>
              <label className='text-sm font-bold text-slate-700 flex items-center gap-2'>
                <FiFileText size={14} /> Email Message / Description
              </label>
              <textarea 
                name="description" 
                value={form.description} 
                onChange={handleChange} 
                rows={4}
                placeholder="Tell users why they should buy today..." 
                className='px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none text-slate-700 transition-all resize-none text-sm'
              />
            </div>
          </div>

          <div className='flex gap-4 justify-end mt-8 pt-4 border-t border-slate-100'>
            <button 
              onClick={close} 
              disabled={loading}
              className='px-6 py-3 rounded-xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50 transition active:scale-95 text-sm disabled:opacity-50'
            >
              Cancel
            </button>
            <button 
              onClick={handleSend} 
              disabled={loading}
              className='px-8 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold shadow-lg shadow-orange-500/20 hover:opacity-90 transition active:scale-95 flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {loading ? (
                <>Processing...</>
              ) : (
                <>
                  <FiSend /> Send to all Gmail
                </>
              )}
            </button>
          </div>
        </div>

        {/* Real-time Preview Section */}
        <div className='w-full md:w-96 bg-slate-50 p-6 md:p-8 flex flex-col items-center justify-center select-none'>
          <span className='text-xs font-bold tracking-widest text-slate-400 uppercase mb-4'>Visual Mockup Preview</span>
          
          {/* Mock Email Card */}
          <div className='bg-white w-full rounded-2xl shadow-md overflow-hidden border border-slate-200 flex flex-col text-[11px] leading-normal text-slate-600 relative max-w-[300px]'>
            {/* Gradient Header */}
            <div className='bg-gradient-to-br from-orange-500 to-fuchsia-500 p-4 text-center text-white'>
              <h4 className='font-extrabold tracking-wider uppercase opacity-90 m-0 text-[9px]'>TRACE</h4>
              <h5 className='font-bold mt-2 mb-1 text-white text-xs line-clamp-1'>{form.headline || 'Banner Headline'}</h5>
              <p className='text-[8px] opacity-75 m-0'>Premium Quality Foods</p>
            </div>

            {/* Content */}
            <div className='p-4 space-y-3'>
              <p className='font-bold text-slate-800 text-[10px] m-0'>Hi Customer Name,</p>
              <p className='text-slate-500 line-clamp-3 m-0 leading-relaxed'>{form.description || 'Email body text preview will appear here...'}</p>
              
              {/* Coupon visual container */}
              <div className='bg-orange-50/50 border border-dashed border-orange-400 rounded-lg p-3 text-center my-2'>
                <span className='text-[7px] text-orange-500 font-bold tracking-widest block uppercase'>YOUR EXCLUSIVE CODE</span>
                <div className='bg-white inline-block px-3 py-1 border border-slate-200 rounded font-extrabold text-slate-800 tracking-widest text-[11px] my-1 uppercase shadow-sm'>
                  {couponData.code}
                </div>
                <div className='font-bold text-slate-800 text-[10px]'>{couponData.discountPercent}% Discount Applied</div>
                <div className='text-[8px] text-slate-400'>
                  {couponData.minAmount > 0 ? `Min. ₹${couponData.minAmount}` : 'No Min.'} 
                  {couponData.maxDiscount > 0 ? ` | Max ₹${couponData.maxDiscount}` : ''}
                </div>
              </div>

              {/* Button & Expiry */}
              <div className='text-center pt-1'>
                <span className='inline-block bg-orange-500 text-white font-bold rounded-full px-4 py-1.5 shadow-md shadow-orange-500/20 text-[9px]'>
                  Shop & Save Now
                </span>
                <p className='text-[8px] text-red-500 font-semibold mt-2 mb-0'>
                  ⚠️ Ends on {formattedDate}
                </p>
              </div>
            </div>

            {/* Mock Footer */}
            <div className='p-3 bg-slate-50 border-t border-slate-100 text-center text-[8px] text-slate-400 space-y-1'>
              <p className='m-0'>Need help? Reply to this mail</p>
              <p className='m-0'>&copy; {new Date().getFullYear()} Trace Grocery</p>
            </div>
          </div>

          {/* Feature points below mockup */}
          <div className='mt-6 space-y-2 w-full max-w-[300px]'>
            <div className='flex items-start gap-2 text-xs text-slate-600'>
              <div className='mt-0.5 bg-green-100 text-green-600 rounded-full p-0.5'>
                <FiCheck size={12} />
              </div>
              <span>Responsive & dynamic HTML rendered automatically.</span>
            </div>
            <div className='flex items-start gap-2 text-xs text-slate-600'>
              <div className='mt-0.5 bg-green-100 text-green-600 rounded-full p-0.5'>
                <FiCheck size={12} />
              </div>
              <span>Individually addressed using customer's name.</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SendOfferModal;
