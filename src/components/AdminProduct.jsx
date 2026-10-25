import React, { useState } from 'react'
import EditProductAdmin from './EditProductAdmin'
import { IoClose } from 'react-icons/io5'
import SummaryApi from '../common/SummaryApi'
import Axios from '../utils/Axios'
import AxiosToastError from '../utils/AxiosToastError'
import { getImageUrl } from '../utils/getImageUrl'
import toast from 'react-hot-toast'


const AdminProduct = ({ data = {}, fetchProductData }) => {

  const [editOpen, setEditOpen] = useState(false)
  const [openDelete, setOpenDelete] = useState(false)

  const handleDeleteCancel = () => {
    setOpenDelete(false)
  }

  const handleDelete = async () => {
    if (!data?._id) {
      toast.error("Invalid product ID")
      return
    }

    try {
      const response = await Axios({
        ...SummaryApi.deleteProduct,
        data: { _id: data._id }
      })

      const { data: responseData } = response

      if (responseData?.success) {
        toast.success(responseData.message)
        fetchProductData && fetchProductData()
        setOpenDelete(false)
      }

    } catch (error) {
      AxiosToastError(error)
    }
  }

  const imageUrl = getImageUrl(data?.image?.[0]) || "/placeholder.png"


  return (
    <div className='w-36 p-4 bg-white rounded shadow-sm hover:shadow-md'>

      <div className='w-full h-32 flex items-center justify-center bg-blue-50 rounded overflow-hidden'>
        <img
          src={imageUrl}
          alt={data?.name || "Product Image"}
          className='w-full h-full object-scale-down'
        />
      </div>

      <p className='text-ellipsis line-clamp-2 font-medium mt-2'>
        {data?.name || "Unnamed Product"}
      </p>

      <div className='flex items-center justify-between mt-1'>
        <p className='text-slate-400 text-xs font-bold uppercase'>
          {data?.unit || ""}
        </p>
        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border uppercase tracking-tighter ${
            (data?.stock || 0) <= 5 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-700 border-green-100'
        }`}>
            {data?.stock || 0} left
        </span>
      </div>

      <div className='grid grid-cols-2 gap-3 py-2'>
        <button
          onClick={() => setEditOpen(true)}
          className='border px-1 py-1 text-sm border-green-600 bg-green-100 text-green-800 hover:bg-green-200 rounded'
        >
          Edit
        </button>

        <button
          onClick={() => setOpenDelete(true)}
          className='border px-1 py-1 text-sm border-red-600 bg-red-100 text-red-600 hover:bg-red-200 rounded'
        >
          Delete
        </button>
      </div>

      {editOpen && (
        <EditProductAdmin
          fetchProductData={fetchProductData}
          data={data}
          close={() => setEditOpen(false)}
        />
      )}

      {openDelete && (
        <section className='fixed top-0 left-0 right-0 bottom-0 bg-neutral-600 bg-opacity-70 z-50 p-4 flex justify-center items-center'>
          <div className='bg-white p-4 w-full max-w-md rounded-md'>

            <div className='flex items-center justify-between'>
              <h3 className='font-semibold lg:ml-[15vh] lg:w-fit'>Permanent Delete</h3>
              <button onClick={() => setOpenDelete(false)}>
                <IoClose size={25} />
              </button>
            </div>

            <p className='my-4 lg:ml-[5vh]'>
              you want to delete this Product permanently?
            </p>

            <div className='flex justify-end gap-5  py-4'>
              <button
                onClick={handleDeleteCancel}
                className='px-4  py-1 border lg:ml-[15vh] rounded border-green-600 text-green-600 hover:bg-green-600 hover:text-white'
              >
                Cancel
              </button>

              <button
                onClick={handleDelete}
                className='px-4 py-1 lg:mr-[15vh]  border rounded border-red-600 text-red-600 hover:bg-red-600 hover:text-white'
              >
                Delete
              </button>
            </div>

          </div>
        </section>
      )}

    </div>
  )
}

export default AdminProduct
