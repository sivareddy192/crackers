import React, { useState, useEffect } from 'react'
import { IoClose } from "react-icons/io5";
import uploadImage from '../utils/UploadImage';
import { useSelector, useDispatch } from 'react-redux';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import toast from 'react-hot-toast';
import AxiosToastError from '../utils/AxiosToastError';
import { setAllCategory } from '../store/productSlice'; // ✅ Ensure this exists in your Redux slice

const EditSubCategory = ({ close, data, fetchData }) => {
  const [subCategoryData, setSubCategoryData] = useState({
    _id: data._id,
    name: data.name,
    image: data.image,
    category: data.category || []
  });

  const dispatch = useDispatch();
  const allCategory = useSelector(state => state.product.allCategory);

  //Fetch categories if not already loaded
  useEffect(() => {
    const fetchAllCategories = async () => {
      try {
        if (!allCategory || allCategory.length === 0) {
          const response = await Axios({ ...SummaryApi.getCategory });
          const { data: responseData } = response;
          if (responseData.success) {
            dispatch(setAllCategory(responseData.data));
          }
        }
      } catch (error) {
        AxiosToastError(error);
      }
    };
    fetchAllCategories();
  }, [allCategory, dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSubCategoryData(prev => ({ ...prev, [name]: value }));
  };

  const handleUploadSubCategoryImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const response = await uploadImage(file);
    const { data: ImageResponse } = response;

    setSubCategoryData(prev => ({
      ...prev,
      image: ImageResponse.data
    }));
  };

  const handleRemoveCategorySelected = (categoryId) => {
    const updatedCategories = subCategoryData.category.filter(el => el._id !== categoryId);
    setSubCategoryData(prev => ({ ...prev, category: updatedCategories }));
  };

  const handleSubmitSubCategory = async (e) => {
    e.preventDefault();

    try {
      const response = await Axios({
        ...SummaryApi.updateSubCategory,
        data: subCategoryData
      });

      const { data: responseData } = response;
      if (responseData.success) {
        toast.success(responseData.message);
        if (close) close();
        if (fetchData) fetchData();
      }
    } catch (error) {
      AxiosToastError(error);
    }
  };

  return (
    <section className='fixed top-0 right-0 bottom-0 left-0 bg-neutral-800 bg-opacity-70 z-50 flex items-center justify-center p-4'>
      <div className='w-full max-w-5xl bg-white p-4 rounded'>
        <div className='flex items-center justify-between gap-3'>
          <h1 className='font-semibold text-lg'>Edit Sub Category</h1>
          <button onClick={close}>
            <IoClose size={25} />
          </button>
        </div>

        <form className='my-3 grid gap-3' onSubmit={handleSubmitSubCategory}>
          {/* Name */}
          <div className='grid gap-1'>
            <label htmlFor='name'>Name</label>
            <input
              id='name'
              name='name'
              autoComplete='name'
              value={subCategoryData.name}
              onChange={handleChange}
              className='p-3 bg-blue-50 border outline-none focus-within:border-green-200 rounded'
            />
          </div>

          {/* Image */}
          <div className='grid gap-1'>
            <p>Image</p>
            <div className='flex flex-col lg:flex-row items-center gap-3'>
              <div className='border h-36 w-full lg:w-36 bg-blue-50 flex items-center justify-center'>
                {!subCategoryData.image ? (
                  <p className='text-sm text-neutral-400'>No Image</p>
                ) : (
                  <img
                    alt='subCategory'
                    
                    src={subCategoryData.image}
                    className='w-full h-full object-scale-down'
                  />
                )}
              </div>
              <label htmlFor='uploadSubCategoryImage' >
                <div className='px-4 font-bold py-1 border border-green-300 text-netrual-900 rounded hover:bg-green-400 hover:text-white cursor-pointer'>
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

          {/* Select Category */}
          <div className='grid gap-1'>
            <label>Select Category</label>
            <div className='border focus-within:border-green-200 rounded'>
              {/* Display selected categories */}
              <div className='flex flex-wrap gap-2 p-2'>
                {subCategoryData.category.length === 0 && (
                  <p className='text-sm text-gray-400'>No categories selected</p>
                )}
                {subCategoryData.category.map((cat) => (
                  <div
                    key={cat._id + "selectedValue"}
                    className='bg-white shadow-md px-2 py-1 m-1 flex items-center gap-2 rounded'
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

              {/* Dropdown */}
              <select
                id="categorySelect"
                name="category"
                className='w-full p-2 bg-transparent outline-none border-t'
                onChange={(e) => {
                  const value = e.target.value;
                  const categoryDetails = allCategory.find(el => el._id === value);
                  if (categoryDetails && !subCategoryData.category.some(el => el._id === value)) {
                    setSubCategoryData(prev => ({
                      ...prev,
                      category: [...prev.category, categoryDetails]
                    }));
                  }
                  e.target.value = ""; // reset dropdown
                }}
              >
                <option value="">Select Category</option>
                {allCategory.map((category) => (
                  <option value={category._id} key={category._id + "subcategory"}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type='submit'
            className={`px-4 py-2 border mt-2 rounded
              ${subCategoryData?.name && subCategoryData?.image && subCategoryData?.category[0]
                ? "bg-green-200 hover:bg-green-400"
                : "bg-gray-200 "} font-semibold`}
          >
            Submit
          </button>
        </form>
      </div>
    </section>
  );
};

export default EditSubCategory;
