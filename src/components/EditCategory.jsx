import React, { useState } from 'react'
import { IoClose } from "react-icons/io5";
import uploadImage from '../utils/UploadImage';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import toast from 'react-hot-toast'
import AxiosToastError from '../utils/AxiosToastError';

const EditCategory = ({ close, fetchData, data: CategoryData }) => {

  const [data, setData] = useState({
    _id: CategoryData?._id || "",
    name: CategoryData?.name || "",
    image: CategoryData?.image || ""
  })

  const [loading, setLoading] = useState(false)

  const handleOnChange = (e) => {
    const { name, value } = e.target

    setData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleUploadCategoryImage = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      setLoading(true)
      const response = await uploadImage(file)
      const { data: ImageResponse } = response

      setData(prev => ({
        ...prev,
        image: ImageResponse?.data || ""
      }))

    } catch (error) {
      AxiosToastError(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!data.name || !data.image) return

    try {
      setLoading(true)

      const response = await Axios({
        ...SummaryApi.updateCategory,
        data
      })

      const { data: responseData } = response

      if (responseData.success) {
        toast.success(responseData.message)
        close && close()
        fetchData && fetchData()
      }

    } catch (error) {
      AxiosToastError(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className='fixed top-0 bottom-0 left-0 right-0 p-4 bg-neutral-800 bg-opacity-60 flex items-center justify-center z-50'>
      <div className='bg-white max-w-4xl w-full p-4 rounded'>

        <div className='flex items-center justify-between'>
          <h1 className='font-semibold'>Update Category</h1>
          <button onClick={close} className='w-fit ml-auto hover:text-red-500'>
            <IoClose size={25} />
          </button>
        </div>

        <form className='my-3 grid gap-2' onSubmit={handleSubmit}>

          <div className='grid gap-1'>
            <label htmlFor='categoryName'>Name</label>
            <input
              type='text'
              id='categoryName'
              name='name'
              value={data.name}
              placeholder='Enter category name'
              onChange={handleOnChange}
              className='bg-blue-50 p-2 border border-blue-100 outline-none focus-within:border-green-300 rounded'
            />
          </div>

          <div className='grid gap-1'>
            <p>Image</p>

            <div className='flex gap-4 flex-col lg:flex-row items-center'>

              <div className='border bg-blue-50 h-36 w-full lg:w-36 rounded flex items-center justify-center overflow-hidden'>
                {data.image ? (
                  <img
                    src={data.image}
                    alt="category"
                    className='w-full h-full object-scale-down'
                  />
                ) : (
                  <p className='text-sm text-neutral-500'>No Image</p>
                )}
              </div>

              <label htmlFor='uploadCategoryImage'>
                <div
                  className={`
                    ${
                      !data.name 
                        ? "bg-gray-300 cursor-not-allowed"
                        : "border-green-300 hover:bg-green-400 hover:text-white cursor-pointer"
                    }
                    px-4 py-2 rounded border font-medium
                  `}
                >
                  {loading ? "Loading..." : "Upload Image"}
                </div>

                <input
                  id='uploadCategoryImage'
                  type='file'
                  disabled={!data.name}
                  onChange={handleUploadCategoryImage}
                  className='hidden'
                />
              </label>

            </div>
          </div>

          <button
            className={`
              ${
                data.name && data.image
                  ? "bg-green-200 hover:text-white hover:bg-green-400"
                  : "bg-gray-300 cursor-not-allowed"
              }
              py-2 font-semibold
            `}
          >
            Update Category
          </button>

        </form>

      </div>
    </section>
  )
}

export default EditCategory
