import React, { useState } from 'react'
import { IoClose } from "react-icons/io5";
import uploadImage from '../utils/UploadImage';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import toast from 'react-hot-toast'
import AxiosToastError from '../utils/AxiosToastError';

const EditBanner = ({ close, fetchData, data: editData }) => {
  const [data, setData] = useState({
    _id: editData._id,
    name: editData.name,
    imageDesktop: editData.imageDesktop,
    imageMobile: editData.imageMobile,
    isActive: editData.isActive,
    link: editData.link || ""
  });
  const [loading, setLoading] = useState(false);
  const [uploadingField, setUploadingField] = useState("");

  const handleOnChange = (e) => {
    const { name, value, type, checked } = e.target;
    setData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleUploadImage = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      setUploadingField(field);
      const response = await uploadImage(file);
      const { data: ImageResponse } = response;

      setData(prev => ({
        ...prev,
        [field]: ImageResponse?.data || ""
      }));
    } catch (error) {
      AxiosToastError(error);
    } finally {
      setLoading(false);
      setUploadingField("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!data.imageDesktop) {
        toast.error("Please upload a desktop banner image")
        return;
    }

    try {
      setLoading(true);
      const response = await Axios({
        ...SummaryApi.updateBanner,
        data
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
    <section className='fixed top-0 bottom-0 left-0 right-0 p-4 bg-neutral-800 bg-opacity-60 flex items-center justify-center z-50'>
      <div className='bg-white max-w-4xl w-full p-4 rounded overflow-y-auto max-h-[90vh]'>
        <div className='flex items-center justify-between'>
          <h1 className='font-semibold text-lg'>Edit Banner</h1>
          <button onClick={close} className='hover:text-red-500 w-fit ml-auto'>
            <IoClose size={25} />
          </button>
        </div>

        <form className='my-3 grid gap-4' onSubmit={handleSubmit}>
          <div className='grid gap-1'>
            <label htmlFor='bannerName' className='font-medium'>Name (Optional)</label>
            <input
              type='text'
              id='bannerName'
              name='name'
              placeholder='Enter banner name'
              value={data.name}
              onChange={handleOnChange}
              className='bg-blue-50 p-2 border border-blue-100 outline-none focus-within:border-primary-200 rounded'
            />
          </div>

          <div className='grid gap-2'>
            <p className='font-medium'>Desktop Banner Image</p>
            <div className='flex gap-4 flex-col lg:flex-row items-center'>
              <div className='border bg-blue-50 h-36 w-full lg:w-64 flex items-center justify-center rounded overflow-hidden'>
                {
                  data.imageDesktop ? (
                    <img
                      src={data.imageDesktop}
                      alt='banner-desktop'
                      className='w-full h-full object-cover'
                    />
                  ) : (
                    <p className='text-sm text-neutral-500'>No Desktop Image</p>
                  )
                }
              </div>
              <label htmlFor='editBannerDesktop'>
                <div className='border-primary-200 hover:bg-primary-100 cursor-pointer px-4 py-2 border rounded font-medium text-sm'>
                  {loading && uploadingField === "imageDesktop" ? "Uploading..." : "Change Desktop Image"}
                </div>
                <input
                  onChange={(e) => handleUploadImage(e, "imageDesktop")}
                  type='file'
                  id='editBannerDesktop'
                  className='hidden'
                />
              </label>
            </div>
          </div>

          <div className='grid gap-2'>
            <p className='font-medium'>Mobile Banner Image</p>
            <div className='flex gap-4 flex-col lg:flex-row items-center'>
              <div className='border bg-blue-50 h-36 w-full lg:w-48 flex items-center justify-center rounded overflow-hidden'>
                {
                  data.imageMobile ? (
                    <img
                      src={data.imageMobile}
                      alt='banner-mobile'
                      className='w-full h-full object-cover'
                    />
                  ) : (
                    <p className='text-sm text-neutral-500'>No Mobile Image</p>
                  )
                }
              </div>
              <label htmlFor='editBannerMobile'>
                <div className='border-primary-200 hover:bg-primary-100 cursor-pointer px-4 py-2 border rounded font-medium text-sm'>
                  {loading && uploadingField === "imageMobile" ? "Uploading..." : "Change Mobile Image"}
                </div>
                <input
                  onChange={(e) => handleUploadImage(e, "imageMobile")}
                  type='file'
                  id='editBannerMobile'
                  className='hidden'
                />
              </label>
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <input
                type='checkbox'
                id='isActive'
                name='isActive'
                checked={data.isActive}
                onChange={handleOnChange}
                className='w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500'
            />
            <label htmlFor='isActive' className='font-medium'>Is Active</label>
          </div>

          <div className='grid gap-1'>
            <label htmlFor='bannerLink' className='font-medium'>Banner Link (URL)</label>
            <input
              type='text'
              id='bannerLink'
              name='link'
              placeholder='Enter target URL (e.g. /product/milk...)'
              value={data.link}
              onChange={handleOnChange}
              className='bg-blue-50 p-2 border border-blue-100 outline-none focus-within:border-primary-200 rounded'
            />
          </div>

          <button
            className={`py-2 mt-2 font-semibold rounded ${data.imageDesktop ? "bg-green-200 hover:bg-green-300" : "bg-gray-300 cursor-not-allowed"}`}
            disabled={!data.imageDesktop || loading}
          >
            Update Banner
          </button>
        </form>
      </div>
    </section>
  )
}

export default EditBanner
