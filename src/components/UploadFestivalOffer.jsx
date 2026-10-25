import React, { useState } from 'react'
import { IoClose } from "react-icons/io5";
import uploadImage from '../utils/UploadImage';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import toast from 'react-hot-toast'
import AxiosToastError from '../utils/AxiosToastError';

const UploadFestivalOffer = ({ close, fetchData }) => {
  const [data, setData] = useState({
    title: "",
    subTitle: "",
    image: "",
    discountPercent: "",
    couponCode: "",
    link: ""
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleOnChange = (e) => {
    const { name, value } = e.target;
    setData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUploadImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const response = await uploadImage(file);
      const { data: ImageResponse } = response;

      setData(prev => ({
        ...prev,
        image: ImageResponse?.data || ""
      }));
      toast.success("Festival image uploaded successfully");
    } catch (error) {
      AxiosToastError(error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!data.image) {
        toast.error("Festival offer image is required")
        return;
    }

    try {
      setLoading(true);
      const response = await Axios({
        ...SummaryApi.festivalOffer.add,
        data: {
            ...data,
            discountPercent: Number(data.discountPercent) || 0
        }
      });

      const { data: responseData } = response;

      if (responseData.success) {
        toast.success(responseData.message);
        close && close();
        fetchData && fetchData();
      }
    } catch (error) {
      AxiosToastError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className='fixed inset-0 p-4 bg-neutral-800 bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm'>
      <div className='bg-white max-w-2xl w-full p-6 rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh] relative border-4 border-orange-100'>
        <div className='flex items-center justify-between border-b pb-3'>
          <h1 className='font-black text-xl text-gray-900 uppercase tracking-tighter flex items-center gap-2'>
              <span>🎉</span> Add Festival Offer
          </h1>
          <button onClick={close} className='hover:text-red-500 w-fit transition-colors p-1 hover:bg-red-50 rounded-full'>
            <IoClose size={26} />
          </button>
        </div>

        <form className='my-4 grid gap-4' onSubmit={handleSubmit}>
          <div className='grid md:grid-cols-2 gap-4'>
              <div className='grid gap-1'>
                <label htmlFor='offerTitle' className='font-bold text-sm text-gray-700'>Offer Title *</label>
                <input
                  type='text'
                  id='offerTitle'
                  name='title'
                  placeholder='e.g., Diwali Mega Sale'
                  value={data.title}
                  onChange={handleOnChange}
                  required
                  className='bg-slate-50 p-2.5 border border-slate-200 outline-none focus:border-orange-400 rounded-lg font-medium transition-all'
                />
              </div>

              <div className='grid gap-1'>
                <label htmlFor='offerSubtitle' className='font-bold text-sm text-gray-700'>Subtitle (Highlights)</label>
                <input
                  type='text'
                  id='offerSubtitle'
                  name='subTitle'
                  placeholder='e.g., Festive offers on crackers'
                  value={data.subTitle}
                  onChange={handleOnChange}
                  className='bg-slate-50 p-2.5 border border-slate-200 outline-none focus:border-orange-400 rounded-lg font-medium transition-all'
                />
              </div>
          </div>

          <div className='grid gap-2'>
            <p className='font-bold text-sm text-gray-700'>Festival Campaign Image *</p>
            <div className='flex gap-4 flex-col md:flex-row items-center'>
              <div className='border-2 border-dashed border-slate-300 bg-slate-50 h-32 w-full md:w-52 flex items-center justify-center rounded-xl overflow-hidden relative'>
                {
                  data.image ? (
                    <img
                      src={data.image}
                      alt='festival-campaign'
                      className='w-full h-full object-cover'
                    />
                  ) : (
                    <p className='text-xs text-slate-500 font-medium px-4 text-center'>Square/Horizontal Image Banner</p>
                  )
                }
              </div>
              <label htmlFor='uploadFestivalImg' className='w-full md:w-auto'>
                <div className='bg-orange-50 border border-orange-200 hover:bg-orange-100 cursor-pointer px-6 py-3 rounded-xl font-black text-xs text-orange-600 uppercase tracking-widest text-center transition-all'>
                  {uploading ? "Uploading..." : "Upload Banner"}
                </div>
                <input
                  onChange={handleUploadImage}
                  type='file'
                  id='uploadFestivalImg'
                  className='hidden'
                  accept="image/*"
                />
              </label>
            </div>
          </div>

          <div className='grid md:grid-cols-2 gap-4 mt-2'>
              <div className='grid gap-1'>
                <label htmlFor='discountPercent' className='font-bold text-sm text-gray-700'>Discount (%)</label>
                <input
                  type='number'
                  id='discountPercent'
                  name='discountPercent'
                  placeholder='e.g., 40'
                  value={data.discountPercent}
                  onChange={handleOnChange}
                  className='bg-slate-50 p-2.5 border border-slate-200 outline-none focus:border-orange-400 rounded-lg font-medium transition-all'
                />
              </div>

              <div className='grid gap-1'>
                <label htmlFor='couponCode' className='font-bold text-sm text-gray-700'>Coupon Code (Optional)</label>
                <input
                  type='text'
                  id='couponCode'
                  name='couponCode'
                  placeholder='e.g., DIWALI24'
                  value={data.couponCode}
                  onChange={handleOnChange}
                  className='bg-slate-50 p-2.5 border border-slate-200 outline-none focus:border-orange-400 rounded-lg font-medium transition-all uppercase'
                />
              </div>
          </div>

          <div className='grid gap-1'>
            <label htmlFor='offerLink' className='font-bold text-sm text-gray-700'>Offer Redirection Link (Target Path)</label>
            <input
              type='text'
              id='offerLink'
              name='link'
              placeholder='e.g., /sweet-treats-653... or any URL'
              value={data.link}
              onChange={handleOnChange}
              className='bg-slate-50 p-2.5 border border-slate-200 outline-none focus:border-orange-400 rounded-lg font-medium transition-all'
            />
          </div>

          <div className='flex gap-3 mt-4'>
              <button
                type='button'
                onClick={close}
                className='flex-1 py-3 border-2 border-slate-200 hover:bg-slate-50 text-slate-700 font-black uppercase tracking-widest text-xs rounded-xl transition-all active:scale-95'
              >
                  Cancel
              </button>
              <button
                type='submit'
                className={`flex-1 py-3 font-black uppercase tracking-widest text-xs text-white rounded-xl transition-all active:scale-95 ${data.image ? "bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-500/20" : "bg-gray-300 cursor-not-allowed"}`}
                disabled={!data.image || loading || uploading}
              >
                {loading ? "Saving..." : "Create Offer"}
              </button>
          </div>
        </form>
      </div>
    </section>
  )
}

export default UploadFestivalOffer
