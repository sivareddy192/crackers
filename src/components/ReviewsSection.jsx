import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import AxiosToastError from '../utils/AxiosToastError'
import { getImageUrl } from '../utils/getImageUrl'
import { FaCamera, FaXmark } from 'react-icons/fa6'

const ReviewsSection = ({ productId, reviews = [], setReviews, fetchReviews }) => {
    const [showReviewForm, setShowReviewForm] = useState(false)
    const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "", image: "" })
    const [uploading, setUploading] = useState(false)
    
    const user = useSelector(state => state?.user)
    const hasUserReviewed = reviews?.some(r => r.userId === user?._id)

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        try {
            const response = await Axios({
                ...SummaryApi.review_add,
                data: { 
                    productId, 
                    rating: reviewForm.rating, 
                    comment: reviewForm.comment,
                    image: reviewForm.image
                }
            })
            if (response.data.success) {
                setReviews(prev => [response.data.data, ...(prev || [])])
                setReviewForm({ rating: 5, comment: "", image: "" })
                setShowReviewForm(false)
            }
        } catch (error) {
            AxiosToastError(error)
        }
    }

    const handleImageUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        try {
            setUploading(true)
            const formData = new FormData()
            formData.append('image', file)

            const response = await Axios({
                ...SummaryApi.uploadImage,
                data: formData
            })

            if (response.data.success) {
                setReviewForm(prev => ({ ...prev, image: response.data.data }))
            }
        } catch (error) {
            AxiosToastError(error)
        } finally {
            setUploading(false)
        }
    }

    const [showAllReviews, setShowAllReviews] = useState(false);
    const displayedReviews = showAllReviews ? reviews : (reviews || []).slice(0, 2);

    const avg = (reviews || []).length ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : "0.0";

    return (
        <div className='space-y-12'>
            {/* Rating Summary Header */}
            <div>
                <h3 className='text-2xl font-black text-gray-900 mb-2'>Customer Reviews</h3>
                <div className='flex items-center gap-4 mb-6'>
                    <div className='flex text-yellow-400'>
                        {[1, 2, 3, 4, 5].map(i => (
                            <svg key={i} className={`w-5 h-5 fill-current ${i > Math.round(Number(avg)) ? 'text-gray-200' : ''}`} viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                        ))}
                    </div>
                    <span className='text-xl font-black text-gray-900'>
                        {avg} <span className='text-xs text-gray-400 font-bold'>/ 5</span>
                    </span>
                </div>
                
                <div className='grid grid-cols-1 gap-2 mb-8 max-w-md'>
                    {[5, 4, 3, 2, 1].map(star => {
                        const count = (reviews || []).filter(r => r.rating === star).length;
                        const perc = (reviews || []).length ? Math.round((count / reviews.length) * 100) : 0;
                        return (
                            <div key={star} className='flex items-center gap-4'>
                                <span className='text-[10px] font-bold text-gray-400 w-10'>{star} star</span>
                                <div className='flex-1 h-1.5 bg-gray-50 rounded-full overflow-hidden border border-gray-100'>
                                    <div className='h-full bg-green-500 rounded-full transition-all duration-1000' style={{ width: `${perc}%` }}></div>
                                </div>
                                <span className='text-[10px] font-bold text-gray-300 w-8 text-right'>{perc}%</span>
                            </div>
                        )
                    })}
                </div>

                {!showReviewForm ? (
                    !hasUserReviewed && (
                        <button 
                            onClick={() => setShowReviewForm(true)}
                            className='py-3 px-8 border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all'
                        >
                            Rate this Product
                        </button>
                    )
                ) : (
                    <form onSubmit={handleSubmitReview} className='bg-white p-6 rounded-3xl border border-gray-100 shadow-xl space-y-4 animate-slide-in'>
                        <div className='flex items-center justify-between'>
                            <h4 className='font-bold text-sm text-gray-900'>Your Rating</h4>
                            <div className='flex gap-1'>
                                {[1, 2, 3, 4, 5].map(i => (
                                    <button 
                                        key={i}
                                        type="button"
                                        onClick={() => setReviewForm(prev => ({ ...prev, rating: i }))}
                                        className={`transition-all hover:scale-110 ${i <= reviewForm.rating ? 'text-yellow-400' : 'text-gray-200'}`}
                                    >
                                        <svg className="w-6 h-6 fill-current" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <textarea 
                            required
                            placeholder="Share your experience..."
                            value={reviewForm.comment}
                            onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                            className='w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-xs focus:bg-white focus:border-gray-900 outline-none h-24 resize-none transition-all'
                        />

                        {/* Image Upload Area */}
                        <div className='flex flex-wrap gap-3'>
                            {reviewForm.image ? (
                                <div className='relative w-20 h-20 rounded-xl overflow-hidden border border-gray-100 shadow-sm'>
                                    <img src={getImageUrl(reviewForm.image)} className='w-full h-full object-cover' alt="review preview" />
                                    <button 
                                        type="button"
                                        onClick={() => setReviewForm(prev => ({ ...prev, image: "" }))}
                                        className='absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full backdrop-blur-sm'
                                    >
                                        <FaXmark size={12} />
                                    </button>
                                </div>
                            ) : (
                                <label className='w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-green-400 hover:bg-green-50/30 transition-all'>
                                    {uploading ? (
                                        <div className='w-full h-full bg-gray-100 animate-pulse rounded-xl flex items-center justify-center'>
                                            <div className='w-6 h-6 bg-gray-200 rounded-full' />
                                        </div>
                                    ) : (
                                        <>
                                            <FaCamera className='text-gray-400' size={18} />
                                            <span className='text-[8px] font-bold text-gray-400 uppercase'>Add Photo</span>
                                        </>
                                    )}
                                    <input type="file" className='hidden' accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                                </label>
                            )}
                        </div>
                        <div className='flex gap-2'>
                            <button 
                                type="button"
                                onClick={() => setShowReviewForm(false)}
                                className='flex-1 py-3 font-bold text-[10px] text-gray-500 bg-gray-50 rounded-xl uppercase tracking-widest'
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                className='flex-[2] py-3 bg-green-600 text-white font-black text-[10px] rounded-xl uppercase tracking-widest shadow-lg shadow-green-100'
                            >
                                Post Review
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* Recent Reviews List - Compact Small Box Style */}
            <div className='flex flex-col gap-3'>
                {(reviews || []).length === 0 ? (
                    <div className='text-center py-12 bg-gray-50 rounded-[32px] border border-dashed border-gray-200'>
                        <p className='text-gray-400 font-bold uppercase tracking-widest text-[10px]'>Be the first to review</p>
                    </div>
                ) : (
                    displayedReviews.map((review, i) => (
                        <div key={review._id} className='bg-white p-5 rounded-[20px] border border-gray-100 hover:border-green-100 hover:shadow-sm transition-all flex flex-col gap-3 group'>
                            <div className='flex items-center justify-between gap-3'>
                                <div className='flex items-center gap-3'>
                                    <div className='w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center text-white font-black text-xs uppercase shadow-sm group-hover:bg-green-600 transition-colors'>
                                        {review?.userName?.[0]?.toUpperCase() || "C"}
                                    </div>
                                    <div>
                                        <p className='font-bold text-gray-900 text-[11px] truncate max-w-[120px]'>{review?.userName || "Verified Customer"}</p>
                                        <div className='flex text-yellow-400'>
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <svg key={star} className={`w-2 h-2 fill-current ${star > review.rating ? 'text-gray-200' : ''}`} viewBox="0 0 20 20">
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <span className='text-[8px] text-gray-300 font-bold uppercase whitespace-nowrap'>{review?.createdAt ? new Date(review.createdAt).toLocaleDateString() : ""}</span>
                            </div>
                            <p className='text-gray-600 text-[11px] leading-relaxed line-clamp-2 font-medium'>"{review.comment}"</p>
                            
                            {review.image && (
                                <div className='mt-2 w-24 h-24 rounded-xl overflow-hidden border border-gray-100 shadow-sm cursor-pointer hover:scale-105 transition-transform'>
                                    <img 
                                        src={getImageUrl(review.image)} 
                                        className='w-full h-full object-cover' 
                                        alt="Customer review"
                                        onClick={() => window.open(getImageUrl(review.image), '_blank')}
                                    />
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>


            {/* Show More/Less Button */}
            {(reviews || []).length > 2 && (
                <div className='flex justify-center pt-4'>
                    <button 
                        onClick={() => setShowAllReviews(!showAllReviews)}
                        className='text-[10px] font-black text-green-600 uppercase tracking-widest border-b-2 border-green-600 pb-1 hover:text-green-700 hover:border-green-700 transition-all'
                    >
                        {showAllReviews ? "Show Less" : `See all ${reviews.length} reviews`}
                    </button>
                </div>
            )}
        </div>
    )
}

export default ReviewsSection

