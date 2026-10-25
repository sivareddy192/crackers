import React, { useState } from 'react';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from '../utils/AxiosToastError';
import toast from 'react-hot-toast';
import { IoClose } from "react-icons/io5";

const UploadCoupon = ({ close, fetchData }) => {
  const [form, setForm] = useState({
    code: "",
    discountPercent: "",
    minAmount: "",
    maxDiscount: "",
    startDate: new Date().toISOString().slice(0, 10),
    expiryDate: "",
    isFirstOrderOnly: false,
    usageLimitPerUser: 1,
    isActive: true
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleCheckbox = (e) => setForm({ ...form, [e.target.name]: e.target.checked });

  const handleCreate = async () => {
    if (!form.code || !form.discountPercent || !form.expiryDate) {
      toast.error("Please fill required fields (Code, Discount, Expiry)");
      return;
    }

    try {
      const response = await Axios({
        ...SummaryApi.coupon_create,
        data: form
      });
      const { data: responseData } = response;
      if (responseData.success) {
        toast.success(responseData.message || "Coupon created");
        fetchData();
        close();
      } else {
        toast.error(responseData.message || "Failed to create coupon");
      }
    } catch (err) {
      AxiosToastError(err);
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4'>
      <div className='bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden'>
        <div className='flex justify-between items-center px-6 py-4 border-b bg-gray-50'>
          <h3 className='text-xl font-bold text-gray-800'>Create New Coupon</h3>
          <button onClick={close} className='p-1 hover:bg-gray-200 rounded-full transition'>
            <IoClose size={24} />
          </button>
        </div>

        <div className='p-6 overflow-y-auto max-h-[80vh]'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='flex flex-col gap-1'>
              <label className='text-sm font-medium text-gray-700'>Coupon Code *</label>
              <input 
                name="code" 
                value={form.code} 
                onChange={handleChange} 
                placeholder="SAVE50" 
                className='p-2.5 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none uppercase' 
              />
            </div>
            
            <div className='flex flex-col gap-1'>
              <label className='text-sm font-medium text-gray-700'>Discount Percentage (%) *</label>
              <input 
                name="discountPercent" 
                value={form.discountPercent} 
                onChange={handleChange} 
                placeholder="10" 
                type="number" 
                className='p-2.5 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none' 
              />
            </div>

            <div className='flex flex-col gap-1'>
              <label className='text-sm font-medium text-gray-700'>Min Order Amount (₹)</label>
              <input 
                name="minAmount" 
                value={form.minAmount} 
                onChange={handleChange} 
                placeholder="500" 
                type="number" 
                className='p-2.5 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none' 
              />
            </div>

            <div className='flex flex-col gap-1'>
              <label className='text-sm font-medium text-gray-700'>Max Discount (₹)</label>
              <input 
                name="maxDiscount" 
                value={form.maxDiscount} 
                onChange={handleChange} 
                placeholder="200" 
                type="number" 
                className='p-2.5 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none' 
              />
            </div>

            <div className='flex flex-col gap-1'>
              <label className='text-sm font-medium text-gray-700'>Start Date</label>
              <input 
                name="startDate" 
                value={form.startDate} 
                onChange={handleChange} 
                type="date" 
                className='p-2.5 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none' 
              />
            </div>

            <div className='flex flex-col gap-1'>
              <label className='text-sm font-medium text-gray-700'>Expiry Date *</label>
              <input 
                name="expiryDate" 
                value={form.expiryDate} 
                onChange={handleChange} 
                type="date" 
                className='p-2.5 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none' 
              />
            </div>

            <div className='flex flex-col gap-1'>
              <label className='text-sm font-medium text-gray-700'>Usage Limit Per User</label>
              <input 
                name="usageLimitPerUser" 
                value={form.usageLimitPerUser} 
                onChange={handleChange} 
                type="number" 
                className='p-2.5 border rounded-xl focus:ring-2 focus:ring-green-500 outline-none' 
              />
            </div>

            <div className='flex items-center gap-6 md:col-span-2 mt-2'>
              <label className='flex items-center gap-2 cursor-pointer group'>
                <div className='relative flex items-center'>
                  <input 
                    type="checkbox" 
                    name="isFirstOrderOnly"
                    checked={form.isFirstOrderOnly} 
                    onChange={handleCheckbox}
                    className='w-5 h-5 accent-green-600 rounded cursor-pointer'
                  />
                </div>
                <span className='text-sm font-medium text-gray-700 group-hover:text-green-600 transition'>First Order Only</span>
              </label>

              <label className='flex items-center gap-2 cursor-pointer group'>
                <div className='relative flex items-center'>
                  <input 
                    type="checkbox" 
                    name="isActive"
                    checked={form.isActive} 
                    onChange={handleCheckbox}
                    className='w-5 h-5 accent-green-600 rounded cursor-pointer'
                  />
                </div>
                <span className='text-sm font-medium text-gray-700 group-hover:text-green-600 transition'>Active</span>
              </label>
            </div>
          </div>
        </div>

        <div className='flex gap-4 justify-end p-6 border-t bg-gray-50'>
          <button 
            onClick={close} 
            className='px-6 py-2.5 rounded-xl border border-gray-300 font-semibold text-gray-700 hover:bg-gray-100 transition'
          >
            Cancel
          </button>
          <button 
            onClick={handleCreate} 
            className='px-8 py-2.5 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 shadow-lg shadow-green-200 transition active:scale-95'
          >
            Create Coupon
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadCoupon;
