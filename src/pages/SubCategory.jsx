import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import UploadSubCategory from '../components/UploadSubCategory';
import AxiosToastError from '../utils/AxiosToastError';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import DisplayTable from '../components/DisplayTable';
import { createColumnHelper } from '@tanstack/react-table';
import ViewImage from '../components/ViewImage';
import { MdDelete } from "react-icons/md";
import { HiPencil } from "react-icons/hi";
import EditSubCategory from '../components/EditSubCategory';
import ConfirmBox from '../components/ConfirmBox';
import toast from 'react-hot-toast';
import { getImageUrl } from '../utils/getImageUrl';
import Loading from '../components/Loading';
import { setAllSubCategory } from '../store/productSlice';
import { invalidateClientCatalog } from '../utils/apiCache';

const SubCategoryPage = () => {
  const dispatch = useDispatch();
  const [openAddSubCategory, setOpenAddSubCategory] = useState(false);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const columnHelper = createColumnHelper();
  const [ImageURL, setImageURL] = useState("");
  const [openEdit, setOpenEdit] = useState(false);
  const [editData, setEditData] = useState({ _id: "" });
  const [deleteSubCategory, setDeleteSubCategory] = useState({ _id: "" });
  const [openDeleteConfirmBox, setOpenDeleteConfirmBox] = useState(false);
  

  const fetchSubCategory = async () => {
    try {
      setLoading(true);
      const response = await Axios({
        ...SummaryApi.getSubCategory,
        params: { t: Date.now() },
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
      }); 

      const { data: responseData } = response;
      

      if (responseData.success) {
        setData(responseData.data);
        dispatch(setAllSubCategory(responseData.data));
      }
    } catch (error) {
      AxiosToastError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubCategory();
  }, []);

  const column = [
    columnHelper.accessor('name', {
      header: "Name"
    }),

    columnHelper.accessor('image', {
      header: "Image",
      cell: ({ row }) => (
        <div className='flex justify-center items-center'>
          <img
            src={getImageUrl(row.original.image)}
            alt={row.original.name}
            className='w-8 h-8 cursor-pointer rounded-md'
            onClick={() => setImageURL(getImageUrl(row.original.image))}
          />

        </div>
      )
    }),

    columnHelper.accessor("category", {
      header: "Category",
      cell: ({ row }) => {
        const categories = row.original.category;
        if (Array.isArray(categories) && categories.length > 0 && typeof categories[0] === "object") {
          return categories.map((c, i) => (
            <p key={i} className='shadow px-2 py-1 inline-block rounded bg-gray-100 m-1'>
              {c?.name || "Unknown"}
            </p>
          ));
        }

        if (Array.isArray(categories)) {
          return categories.map((id, i) => (
            <p key={i} className='text-gray-500 italic'>
              ID: {id}
            </p>
          ));
        }

        return <p className='text-gray-400 italic'>No category</p>;
      }
    }),

    columnHelper.accessor("_id", {
      header: "Action",
      cell: ({ row }) => (
        <div className='flex justify-center gap-3'>

          <button
            onClick={() => {
              setOpenEdit(true);
              setEditData(row.original);
            }}
            className='p-2 bg-green-100 rounded-full hover:text-green-600'
          >
            <HiPencil size={20} />
          </button>

          <button
            onClick={() => {
              setOpenDeleteConfirmBox(true);
              setDeleteSubCategory(row.original);
            }}
            className='p-2 bg-red-100 rounded-full text-red-500 hover:text-red-600'
          >
            <MdDelete size={20} />
          </button>
        </div>
      )
    })
  ];
  

  const handleDeleteSubCategory = async () => {
    const targetId = deleteSubCategory?._id;
    if (!targetId) return;

    try {
      // Optimistic update
      const updated = data.filter(s => s._id !== targetId);
      setData(updated);
      dispatch(setAllSubCategory(updated));
      invalidateClientCatalog();
      setOpenDeleteConfirmBox(false);

      const response = await Axios({
        ...SummaryApi.deleteSubCategory,
        data: { _id: targetId },
        params: { _id: targetId }
      });

      const { data: responseData } = response;

      if (responseData.success) {
        toast.success(responseData.message || "Subcategory deleted successfully");
        invalidateClientCatalog();
        fetchSubCategory();
        setDeleteSubCategory({ _id: "" });
      } else {
        toast.error(responseData.message || "Failed to delete subcategory");
        fetchSubCategory();
      }
    } catch (error) {
      AxiosToastError(error);
      fetchSubCategory();
    }
  };

  

  return (
    <section>
      <div className='p-4 bg-white shadow-md flex justify-between items-center'>
        <button
          onClick={() => setOpenAddSubCategory(true)}
          className='text-sm border-2 font-black uppercase tracking-widest border-gray-900 hover:bg-gray-900 hover:text-white text-gray-900 px-6 py-2.5 rounded-xl transition-all active:scale-95'
        >
          Add Sub Category
        </button>
        <h2 className='font-black text-xl text-gray-900 uppercase tracking-tighter'>Sub Category</h2>
      </div>

      <div className='p-4 min-h-[70vh] flex flex-col'>
        {loading ? (
            <Loading type="table" />
        ) : (
            <div className='overflow-auto w-full max-w-[95vw]'>
                <DisplayTable
                    data={data}
                    column={column}
                    loading={loading}
                />
            </div>
        )}
      </div>

      {openAddSubCategory && (
        <UploadSubCategory
          close={() => setOpenAddSubCategory(false)}
          fetchData={fetchSubCategory}
        />
      )}

      {ImageURL && (
        <ViewImage
          url={getImageUrl(ImageURL)}
          close={() => setImageURL("")}
        />
      )}


      {openEdit && (
        <EditSubCategory
          data={editData}
          close={() => setOpenEdit(false)}
          fetchData={fetchSubCategory}
        />
      )}

      {openDeleteConfirmBox && (
        <ConfirmBox
          cancel={() => setOpenDeleteConfirmBox(false)}
          close={() => setOpenDeleteConfirmBox(false)}
          confirm={handleDeleteSubCategory}
        />
      )}
    </section>
  );
};

export default SubCategoryPage;
