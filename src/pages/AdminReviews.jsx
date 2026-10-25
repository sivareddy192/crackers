import React, { useEffect, useState } from 'react'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import AxiosToastError from '../utils/AxiosToastError'
import toast from 'react-hot-toast'
import { MdDelete, MdEdit } from "react-icons/md";
import { getImageUrl } from '../utils/getImageUrl'
import Loading from '../components/Loading'

const AdminReviews = () => {
    const [reviews, setReviews] = useState([])
    const [loading, setLoading] = useState(false)
    const [editData, setEditData] = useState(null)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)

    const fetchAllReviews = async () => {
        try {
            setLoading(true)
            const response = await Axios({
                ...SummaryApi.review_get_all
            })
            if (response.data.success) {
                setReviews(response.data.data)
            }
        } catch (error) {
            AxiosToastError(error)
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteReview = async (reviewId) => {
        if (!window.confirm("Are you sure you want to delete this review?")) return

        try {
            const response = await Axios({
                ...SummaryApi.review_delete,
                data: { _id: reviewId }
            })
            if (response.data.success) {
                toast.success(response.data.message)
                fetchAllReviews()
            }
        } catch (error) {
            AxiosToastError(error)
        }
    }

    const handleUpdateReview = async (e) => {
        e.preventDefault()
        try {
            const response = await Axios({
                ...SummaryApi.review_update,
                data: editData
            })
            if (response.data.success) {
                toast.success(response.data.message)
                setIsEditModalOpen(false)
                fetchAllReviews()
            }
        } catch (error) {
            AxiosToastError(error)
        }
    }

    useEffect(() => {
        fetchAllReviews()
    }, [])

    return (
        <section className='p-4 lg:p-6'>
            <div className='bg-white p-4 rounded shadow-sm mb-6 flex items-center justify-between'>
                <h2 className='font-bold text-lg'>Manage Customer Reviews</h2>
                <div className='text-sm text-gray-500'>Total Reviews: {reviews.length}</div>
            </div>

            {loading ? (
                <Loading type="list" />
            ) : (
                <div className='grid gap-4'>
                    {reviews.map((review, index) => (
                        <div key={review._id} className='bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4'>
                            <div className='flex-1'>
                                <div className='flex items-center justify-between mb-2'>
                                    <div className='flex items-center gap-2'>
                                        <div className='w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs'>
                                            {review.userName?.[0]?.toUpperCase()}
                                        </div>
                                        <span className='font-bold text-gray-900'>{review.userName}</span>
                                    </div>
                                    <div className='flex items-center gap-1 text-yellow-400'>
                                        {[...Array(5)].map((_, i) => (
                                            <svg key={i} className={`w-3 h-3 fill-current ${i >= review.rating ? 'text-gray-200' : ''}`} viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        ))}
                                    </div>
                                </div>
                                <p className='text-sm text-gray-600 mb-3 italic'>"{review.comment}"</p>
                                {review.image && (
                                    <div className='mb-3'>
                                        <img src={getImageUrl(review.image)} className='w-20 h-20 object-cover rounded-lg border' alt="review" />
                                    </div>
                                )}
                                <div className='flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase tracking-wider'>
                                    <span>Product ID: {review.productId}</span>
                                    <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div className='flex md:flex-col justify-end gap-2'>
                                <button 
                                    onClick={() => {
                                        setEditData(review)
                                        setIsEditModalOpen(true)
                                    }}
                                    className='p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all'
                                >
                                    <MdEdit size={20} />
                                </button>
                                <button 
                                    onClick={() => handleDeleteReview(review._id)}
                                    className='p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all'
                                >
                                    <MdDelete size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isEditModalOpen && (
                <div className='fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000] flex items-center justify-center p-4'>
                    <div className='bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl'>
                        <h3 className='font-bold text-lg mb-4'>Edit Review</h3>
                        <form onSubmit={handleUpdateReview} className='space-y-4'>
                            <div>
                                <label className='block text-xs font-bold text-gray-400 uppercase mb-1'>Rating</label>
                                <div className='flex gap-2'>
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <button 
                                            key={i}
                                            type="button"
                                            onClick={() => setEditData(prev => ({ ...prev, rating: i }))}
                                            className={`w-10 h-10 rounded-lg flex items-center justify-center border-2 transition-all ${editData.rating === i ? 'border-yellow-400 bg-yellow-50 text-yellow-600' : 'border-gray-100 text-gray-300'}`}
                                        >
                                            {i}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className='block text-xs font-bold text-gray-400 uppercase mb-1'>Comment</label>
                                <textarea 
                                    className='w-full border rounded-xl p-3 text-sm h-32 outline-none focus:border-blue-500'
                                    value={editData.comment}
                                    onChange={(e) => setEditData(prev => ({ ...prev, comment: e.target.value }))}
                                />
                            </div>
                            <div className='flex gap-3 pt-2'>
                                <button 
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className='flex-1 py-3 font-bold text-gray-500 bg-gray-100 rounded-xl'
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className='flex-1 py-3 font-bold text-white bg-blue-600 rounded-xl shadow-lg shadow-blue-100'
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    )
}

export default AdminReviews
