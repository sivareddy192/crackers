import React, { useEffect, useState } from 'react'
import { IoClose } from "react-icons/io5"
import { useDispatch } from 'react-redux'
import uploadImage from '../utils/UploadImage'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import toast from 'react-hot-toast'
import AxiosToastError from '../utils/AxiosToastError'
import { setAllSubCategory } from '../store/productSlice'
import { invalidateClientCatalog } from '../utils/apiCache'

const UploadSubCategoryModel = ({ close, fetchData }) => {
  const dispatch = useDispatch()
  const [subCategoryData, setSubCategoryData] = useState({
    name: "",
    image: "",
    category: []
  })

  const [allCategory, setAllCategory] = useState([])

  useEffect(() => {
    const fetchAllCategories = async () => {
      try {
        const response = await Axios({
          ...SummaryApi.getCategory,
          params: { t: Date.now() },
          headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
        })
        const { data: responseData } = response
        if (responseData.success) {
          const valid = (responseData.data || []).filter(c => c && c._id && c.name)
          setAllCategory(valid)
        }
      } catch (error) {
        AxiosToastError(error)
      }
    }

    fetchAllCategories()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target

    if (name === "name") {
      Axios({ ...SummaryApi.getSubCategory }).then(response => {
        const { data: res } = response
        if (res.success) {
          const exists = res.data.some(
            item => item.name.toLowerCase() === value.toLowerCase()
          )
          if (exists) toast.error("Subcategory name already exists!")
        }
      })
    }

    setSubCategoryData(prev => ({ ...prev, [name]: value }))
  }

  const handleUploadSubCategoryImage = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      const response = await uploadImage(file)
      const imageUrl = response?.data?.data?.url || response?.data?.data

      if (!imageUrl) {
        throw new Error(response?.data?.message || "Failed to upload image")
      }

      setSubCategoryData(prev => ({
        ...prev,
        image: imageUrl
      }))
    } catch (error) {
      AxiosToastError(error)
    } finally {
      if (e.target) e.target.value = ""
    }
  }

  const handleRemoveCategorySelected = (categoryId) => {
    setSubCategoryData(prev => ({
      ...prev,
      category: prev.category.filter(el => el._id !== categoryId)
    }))
  }

  const handleSubmitSubCategory = async (e) => {
    e.preventDefault()
    try {
      const response = await Axios({
        ...SummaryApi.createSubCategory,
        data: subCategoryData
      })
      const { data: responseData } = response

      if (responseData.success) {
        toast.success(responseData.message)
        invalidateClientCatalog()

        // Fetch fresh subcategories and sync Redux store
        try {
          const freshSub = await Axios({
            ...SummaryApi.getSubCategory,
            params: { t: Date.now() },
            headers: { 'Cache-Control': 'no-cache' }
          })
          if (freshSub.data?.success) {
            dispatch(setAllSubCategory(freshSub.data.data))
          }
        } catch {}

        close && close()
        fetchData && fetchData()
      }
    } catch (error) {
      AxiosToastError(error)
    }
  }

  return (
    <section className='fixed top-0 right-0 bottom-0 left-0 bg-neutral-800 bg-opacity-70 z-50 flex items-center justify-center p-4'>
      <div className='w-full max-w-5xl bg-white p-4 rounded'>
        <div className='flex items-center justify-between gap-3'>
          <h1 className='font-semibold'>Add Sub Category</h1>
          <button onClick={close}><IoClose size={25} /></button>
        </div>

        <form className='my-3 grid gap-3' onSubmit={handleSubmitSubCategory}>


          <div className='grid gap-1'>
            <label htmlFor='name'>Name</label>
            <input
              id='name'
              name='name'
              value={subCategoryData.name}
              onChange={handleChange}
              className='p-3 bg-blue-50 border outline-none focus-within:border-green-200 rounded'
            />
          </div>


          <div className='grid gap-1'>
            <p>Image</p>
            <div className='flex flex-col lg:flex-row items-center gap-3'>
              <div className='border h-36 w-full lg:w-36 bg-blue-50 flex items-center justify-center'>
                {!subCategoryData.image
                  ? <p className='text-sm text-neutral-400'>No Image</p>
                  : <img
                      alt='subCategory'
                      src={subCategoryData.image}
                      className='w-full h-full object-scale-down'
                    />}
              </div>

              <label htmlFor='uploadSubCategoryImage'>
                <div className='px-4 py-1 border border-green-300 rounded hover:bg-green-500 hover:text-white cursor-pointer'>
                  Upload Image
                </div>
                <input
                  type='file'
                  id='uploadSubCategoryImage'
                  className='hidden'
                  onChange={handleUploadSubCategoryImage}
                />
              </label>
            </div>
          </div>


          <div className='grid gap-1'>
            <label>Select Category</label>

            <div className='border focus-within:border-green-200 rounded'>
              <div className='flex flex-wrap gap-2 p-1'>

                {subCategoryData.category.map(cat => (
                  <div
                    key={cat._id + "selected"}
                    className='bg-white shadow-md px-2 m-1 flex items-center gap-2 rounded'
                  >
                    <span>{cat.name}</span>

                    <button
                      type='button'
                      className='cursor-pointer hover:text-red-600'
                      onClick={() => handleRemoveCategorySelected(cat._id)}
                    >
                      <IoClose size={18} />
                    </button>
                  </div>
                ))}

              </div>

              <select
                className='w-full p-2 bg-transparent outline-none border'
                onChange={(e) => {
                  const value = e.target.value
                  const categoryDetails = allCategory.find(el => el._id === value)

                  if (categoryDetails &&
                      !subCategoryData.category.some(el => el._id === value)) {
                    setSubCategoryData(prev => ({
                      ...prev,
                      category: [...prev.category, categoryDetails]
                    }))
                  }
                }}
              >
                <option value={""}>Select Category</option>

                {allCategory.map(category => (
                  <option value={category._id} key={category._id}>
                    {category.name}
                  </option>
                ))}

              </select>
            </div>
          </div>


          <button
            className={`px-4 py-2 border rounded font-semibold
              ${subCategoryData?.name && subCategoryData?.image && subCategoryData?.category[0]
                ? "bg-white border-green-300 hover:text-white hover:bg-green-400"
                : "bg-gray-200"}
            `}
          >
            Submit
          </button>

        </form>
      </div>
    </section>
  )
}

export default UploadSubCategoryModel
