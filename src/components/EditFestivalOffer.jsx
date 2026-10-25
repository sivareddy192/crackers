import React, { useState, useEffect } from 'react'
import { IoClose } from "react-icons/io5";
import uploadImage from '../utils/UploadImage';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import toast from 'react-hot-toast'
import AxiosToastError from '../utils/AxiosToastError';

const EditFestivalOffer = ({ close, fetchData, data: initialData }) => {
  const [data, setData] = useState({
    _id: "",
    title: "",
    subTitle: "",
    image: "",
    discountPercent: 0,
    couponCode: "",
    isActive: true,
    link: ""
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
      if(initialData) {
          setData({
              _id: initialData._id || "",
              title: initialData.title || "",
              subTitle: initialData.subTitle || "",
              image: initialData.image || "",
              discountPercent: initialData.discountPercent || 0,
              couponCode: initialData.couponCode || "",
              isActive: initialData.isActive !== undefined ? initialData.isActive : true,
              link: initialData.link || ""
          })
      }
  }, [initialData])

  const handleOnChange = (e) => {
    const { name, value } = e.target;
    setData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleToggleActive = (val) => {
      setData(prev => ({
          ...prev,
          isActive: val
      }))
  }

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
      toast.success("Festival image swapped successfully");
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
        ...SummaryApi.festivalOffer.update,
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
              <span>✏️</span> Edit Festival Offer
          </h1>
          <button onClick={close} className='hover:text-red-500 w-fit transition-colors p-1 hover:bg-red-50 rounded-full'>
            <IoClose size={26} />
          </button>
        </div>

        <form className='my-4 grid gap-4' onSubmit={handleSubmit}>
          <div className='grid md:grid-cols-2 gap-4'>
              <div className='grid gap-1'>
                <label htmlFor='editOfferTitle' className='font-bold text-sm text-gray-700'>Offer Title *</label>
                <input
                  type='text'
                  id='editOfferTitle'
                  name='title'
                  value={data.title}
                  onChange={handleOnChange}
                  required
                  className='bg-slate-50 p-2.5 border border-slate-200 outline-none focus:border-orange-400 rounded-lg font-medium transition-all'
                />
              </div>

              <div className='grid gap-1'>
                <label htmlFor='editOfferSubtitle' className='font-bold text-sm text-gray-700'>Subtitle (Highlights)</label>
                <input
                  type='text'
                  id='editOfferSubtitle'
                  name='subTitle'
                  value={data.subTitle}
                  onChange={handleOnChange}
                  className='bg-slate-50 p-2.5 border border-slate-200 outline-none focus:border-orange-400 rounded-lg font-medium transition-all'
                />
              </div>
          </div>

          <div className='grid gap-2'>
            <p className='font-bold text-sm text-gray-700'>Festival Campaign Image *</p>
            <div className='flex gap-4 flex-col md:flex-row items-center'>
              <div className='border-2 border-dashed border-slate-300 bg-slate-50 h-32 w-full md:w-52 flex items-center justify-center rounded-xl overflow-hidden'>
                {
                  data.image ? (
                    <img
                      src={data.image}
                      alt='festival-campaign'
                      className='w-full h-full object-cover'
                    />
                  ) : (
                    <p className='text-xs text-slate-500'>No Image Loaded</p>
                  )
                }
              </div>
              <label htmlFor='editFestivalImg' className='w-full md:w-auto'>
                <div className='bg-orange-50 border border-orange-200 hover:bg-orange-100 cursor-pointer px-6 py-3 rounded-xl font-black text-xs text-orange-600 uppercase tracking-widest text-center transition-all'>
                  {uploading ? "Uploading..." : "Change Banner"}
                </div>
                <input
                  onChange={handleUploadImage}
                  type='file'
                  id='editFestivalImg'
                  className='hidden'
                  accept="image/*"
                />
              </label>
            </div>
          </div>

          <div className='grid md:grid-cols-2 gap-4 mt-2'>
              <div className='grid gap-1'>
                <label htmlFor='editDiscountPercent' className='font-bold text-sm text-gray-700'>Discount (%)</label>
                <input
                  type='number'
                  id='editDiscountPercent'
                  name='discountPercent'
                  value={data.discountPercent}
                  onChange={handleOnChange}
                  className='bg-slate-50 p-2.5 border border-slate-200 outline-none focus:border-orange-400 rounded-lg font-medium transition-all'
                />
              </div>

              <div className='grid gap-1'>
                <label htmlFor='editCouponCode' className='font-bold text-sm text-gray-700'>Coupon Code (Optional)</label>
                <input
                  type='text'
                  id='editCouponCode'
                  name='couponCode'
                  value={data.couponCode}
                  onChange={handleOnChange}
                  className='bg-slate-50 p-2.5 border border-slate-200 outline-none focus:border-orange-400 rounded-lg font-medium transition-all uppercase'
                />
              </div>
          </div>

          <div className='grid gap-1'>
            <label htmlFor='editOfferLink' className='font-bold text-sm text-gray-700'>Offer Redirection Link (Target Path)</label>
            <input
              type='text'
              id='editOfferLink'
              name='link'
              value={data.link}
              onChange={handleOnChange}
              className='bg-slate-50 p-2.5 border border-slate-200 outline-none focus:border-orange-400 rounded-lg font-medium transition-all'
            />
          </div>

          <div className='grid gap-2 my-2'>
              <span className='font-bold text-sm text-gray-700'>Offer Status:</span>
              <div className='flex items-center gap-4'>
                  <label className='flex items-center gap-2 cursor-pointer font-semibold text-sm'>
                      <input
                        type='radio'
                        name='isActive'
                        checked={data.isActive === true}
                        onChange={() => handleToggleActive(true)}
                        className='accent-green-600 w-4 h-4'
                      />
                      <span className='text-green-600'>Active</span>
                  </label>
                  <label className='flex items-center gap-2 cursor-pointer font-semibold text-sm'>
                      <input
                        type='radio'
                        name='isActive'
                        checked={data.isActive === false}
                        onChange={() => handleToggleActive(false)}
                        className='accent-red-600 w-4 h-4'
                      />
                      <span className='text-red-600'>Inactive</span>
                  </label>
              </div>
          </div>

          <div className='flex gap-3 mt-4 border-t pt-4'>
              <button
                type='button'
                onClick={close}
                className='flex-1 py-3 border-2 border-slate-200 hover:bg-slate-50 text-slate-700 font-black uppercase tracking-widest text-xs rounded-xl transition-all active:scale-95'
              >
                  Cancel
              </button>
              <button
                type='submit'
                className={`flex-1 py-3 font-black uppercase tracking-widest text-xs text-white rounded-xl transition-all active:scale-95 bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-500/20`}
                disabled={loading || uploading}
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
          </div>
        </form>
      </div>
    </section>
  )
}

export default EditFestivalOffer
