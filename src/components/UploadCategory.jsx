import React, { useState } from 'react'
import { IoClose } from "react-icons/io5";
import uploadImage from '../utils/UploadImage';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import toast from 'react-hot-toast'
import AxiosToastError from '../utils/AxiosToastError';

const UploadCategoryModel = ({ close, fetchData }) => {

  const [data, setData] = useState({
    name: "",
    image: ""
  });

  const [loading, setLoading] = useState(false);

  const handleOnChange = (e) => {
    const { name, value } = e.target;

    setData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUploadCategoryImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading(true);

      const response = await uploadImage(file);
      const { data: ImageResponse } = response;
      setData(prev => ({ ...prev, image: ImageResponse?.data || "" }));

    } catch (error) {
      AxiosToastError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!data.name || !data.image) return;

    try {
      setLoading(true);

      const response = await Axios({
        ...SummaryApi.uploadcategory,
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
      <div className='bg-white max-w-4xl w-full p-4 rounded'>

        <div className='flex items-center justify-between'>
          <h1 className='font-semibold'>Category</h1>
          <button
            onClick={close}
            className='hover:text-red-500 w-fit ml-auto'
          >
            <IoClose size={25} />
          </button>
        </div>

        <form className='my-3 grid gap-2' onSubmit={handleSubmit}>

          {/* NAME */}
          <div className='grid gap-1'>
            <label htmlFor='categoryName'>Name</label>
            <input
              type='text'
              id='categoryName'
              name='name'
              placeholder='Enter category name'
              value={data.name}
              onChange={handleOnChange}
              className='bg-blue-50 p-2 border border-blue-100 outline-none focus-within:border-primary-200 rounded'
            />
          </div>

          {/* IMAGE */}
          <div className='grid gap-1'>
            <p>Image</p>

            <div className='flex gap-4 flex-col lg:flex-row items-center'>

              <div className='border bg-blue-50 h-36 w-full lg:w-36 flex items-center justify-center rounded overflow-hidden'>
                {
                  data.image ? (
                    <img
                      src={data.image}
                      alt='category'
                      className='w-full h-full object-scale-down'
                    />
                  ) : (
                    <p className='text-sm text-neutral-500'>No Image</p>
                  )
                }
              </div>

              <label htmlFor='uploadCategoryImage'>
                <div
                  className={`
                    ${
                      !data.name
                        ? "bg-gray-300 cursor-not-allowed"
                        : "border-primary-200 hover:bg-primary-100 cursor-pointer"
                    }
                    px-4 py-2 border rounded font-medium
                  `}
                >
                  {loading ? "Uploading..." : "Upload Image"}
                </div>

                <input
                  disabled={!data.name}
                  onChange={handleUploadCategoryImage}
                  type='file'
                  id='uploadCategoryImage'
                  className='hidden'
                />
              </label>

            </div>
          </div>

          {/* SUBMIT */}
          <button
            className={`
              py-2 font-semibold
              ${
                data.name && data.image
                  ? "bg-green-200 hover:bg-green-100"
                  : "bg-gray-300 cursor-not-allowed"
              }
            `}
          >
            Add Category
          </button>

        </form>

      </div>
    </section>
  );
};

export default UploadCategoryModel;
