import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { setAllCategory } from '../store/productSlice'
import UploadCategory from '../components/UploadCategory'
import Loading from '../components/Loading'
import NoData from '../components/NoData'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import EditCategory from '../components/EditCategory'
import ConfirmBox from '../components/ConfirmBox'
import toast from 'react-hot-toast'
import AxiosToastError from '../utils/AxiosToastError'
import { getImageUrl } from '../utils/getImageUrl'

const CategoryPage = () => {
    const dispatch = useDispatch()
    const [openUploadCategory, setOpenUploadCategory] = useState(false)
    const [loading, setLoading] = useState(false)
    const [categoryData, setCategoryData] = useState([])
    const [openEdit, setOpenEdit] = useState(false)
    const [editData, setEditData] = useState({
        name: "",
        image: "",
    })
    const [openConfirmBoxDelete, setOpenConfirmBoxDelete] = useState(false)
    const [deleteCategory, setDeleteCategory] = useState({
        _id: ""
    })

    const fetchCategory = async (newOrUpdatedCategory = null) => {
        // Optimistic injection if passed from upload/edit
        if (newOrUpdatedCategory && newOrUpdatedCategory._id) {
            setCategoryData(prev => {
                const index = prev.findIndex(c => c._id === newOrUpdatedCategory._id);
                let updated;
                if (index !== -1) {
                    updated = [...prev];
                    updated[index] = newOrUpdatedCategory;
                } else {
                    updated = [newOrUpdatedCategory, ...prev];
                }
                dispatch(setAllCategory(updated));
                return updated;
            });
        }

        try {
            if (!newOrUpdatedCategory) {
                setLoading(true);
            }
            const response = await Axios({
                ...SummaryApi.getCategory,
                params: { t: Date.now() },
                headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
            })
            const { data: responseData } = response

            if (responseData.success) {
                setCategoryData(responseData.data)
                dispatch(setAllCategory(responseData.data))
            }
        } catch (error) {
            AxiosToastError(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCategory()
    }, [])

    const handleDeleteCategory = async () => {
        const targetId = deleteCategory?._id;
        if (!targetId) return;

        try {
            // Optimistically remove from UI and Redux immediately
            setCategoryData(prev => prev.filter(c => c._id !== targetId));
            dispatch(setAllCategory(categoryData.filter(c => c._id !== targetId)));
            setOpenConfirmBoxDelete(false);

            const response = await Axios({
                ...SummaryApi.deleteCategory,
                data: { _id: targetId },
                params: { _id: targetId }
            });

            const { data: responseData } = response;

            if (responseData.success) {
                toast.success(responseData.message || "Category deleted successfully");
                fetchCategory();
            } else {
                toast.error(responseData.message || "Failed to delete category");
                fetchCategory();
            }
        } catch (error) {
            AxiosToastError(error);
            fetchCategory();
        }
    }

    return (
        <section className=''>
            <div className='p-4 bg-white shadow-md flex items-center justify-between'>
                <button onClick={() => setOpenUploadCategory(true)} className='text-sm border-2 font-black uppercase tracking-widest border-gray-900 hover:bg-gray-900 hover:text-white text-gray-900 px-6 py-2.5 rounded-xl transition-all active:scale-95'>Add Category</button>
                <h2 className='font-black text-xl text-gray-900 uppercase tracking-tighter'>Category</h2>
            </div>

            <div className='p-4 min-h-[70vh] flex flex-col'>
                {loading ? (
                    <Loading type="grid" />
                ) : (
                    <>
                        {categoryData.length === 0 ? (
                            <NoData />
                        ) : (
                            <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6'>
                                {categoryData.map((category) => (
                                    <div className='bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col group' key={category._id}>
                                        <div className='aspect-square mb-4 overflow-hidden rounded-xl bg-gray-50 flex items-center justify-center p-4'>
                                            <img
                                                alt={category.name}
                                                src={getImageUrl(category.image)}
                                                className='w-full h-full object-contain group-hover:scale-110 transition-transform duration-300'
                                            />
                                        </div>

                                        <p className='text-sm font-bold text-gray-800 text-center mb-4 truncate'>{category.name}</p>

                                        <div className='flex gap-2'>
                                            <button onClick={() => {
                                                setOpenEdit(true)
                                                setEditData(category)
                                            }} className='flex-1 bg-green-50 text-green-600 text-xs font-bold py-2 rounded-lg hover:bg-green-600 hover:text-white transition-colors'>
                                                Edit
                                            </button>
                                            <button onClick={() => {
                                                setOpenConfirmBoxDelete(true)
                                                setDeleteCategory(category)
                                            }} className='flex-1 bg-red-50 text-red-600 text-xs font-bold py-2 rounded-lg hover:bg-red-600 hover:text-white transition-colors'>
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {
                openUploadCategory && (
                    <UploadCategory fetchData={fetchCategory} close={() => setOpenUploadCategory(false)} />
                )
            }

            {
                openEdit && (
                    <EditCategory data={editData} close={() => setOpenEdit(false)} fetchData={fetchCategory} />
                )
            }

            {
                openConfirmBoxDelete && (
                    <ConfirmBox close={() => setOpenConfirmBoxDelete(false)} cancel={() => setOpenConfirmBoxDelete(false)} confirm={handleDeleteCategory} />
                )
            }
        </section>
    )
}

export default CategoryPage
