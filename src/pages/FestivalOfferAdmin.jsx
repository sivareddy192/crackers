import React, { useEffect, useState } from 'react'
import UploadFestivalOffer from '../components/UploadFestivalOffer'
import EditFestivalOffer from '../components/EditFestivalOffer'
import ConfirmBox from '../components/ConfirmBox'
import Loading from '../components/Loading'
import NoData from '../components/NoData'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import toast from 'react-hot-toast'
import AxiosToastError from '../utils/AxiosToastError'
import { IoGiftSharp, IoPencil, IoTrash, IoAddCircleOutline, IoPaperPlaneSharp } from 'react-icons/io5'

const FestivalOfferAdmin = () => {
    const [loading, setLoading] = useState(false)
    const [offers, setOffers] = useState([])
    const [openUpload, setOpenUpload] = useState(false)
    const [openEdit, setOpenEdit] = useState(false)
    const [editData, setEditData] = useState(null)
    const [openConfirmDelete, setOpenConfirmDelete] = useState(false)
    const [deleteId, setDeleteId] = useState("")
    const [blastingOffers, setBlastingOffers] = useState({})

    const handleTriggerEmailBlast = async (offer) => {
        try {
            setBlastingOffers(prev => ({ ...prev, [offer._id]: true }))
            const response = await Axios({
                ...SummaryApi.festivalOffer.sendBlast,
                data: { _id: offer._id }
            })
            if (response.data?.success) {
                toast.success(response.data.message || "Email broadcast dispatching!", {
                    icon: '🚀',
                    duration: 4000
                })
            }
        } catch (error) {
            AxiosToastError(error)
        } finally {
            setBlastingOffers(prev => ({ ...prev, [offer._id]: false }))
        }
    }

    const fetchOffers = async () => {
        try {
            setLoading(true)
            const response = await Axios({
                ...SummaryApi.festivalOffer.get
            })
            if (response.data?.success) {
                setOffers(response.data.data || [])
            }
        } catch (error) {
            AxiosToastError(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchOffers()
    }, [])

    const handleDeleteConfirm = async () => {
        try {
            const response = await Axios({
                ...SummaryApi.festivalOffer.delete,
                data: { _id: deleteId }
            })
            if (response.data?.success) {
                toast.success(response.data.message)
                fetchOffers()
                setOpenConfirmDelete(false)
            }
        } catch (error) {
            AxiosToastError(error)
        }
    }

    return (
        <section className='flex flex-col min-h-screen bg-slate-50 dark:bg-neutral-950 pb-10'>
            {/* Premium Navigation Header */}
            <div className='p-5 bg-white dark:bg-neutral-900 shadow-sm flex items-center justify-between border-b border-slate-200 dark:border-neutral-800 sticky top-0 z-20'>
                <div className='flex flex-col'>
                    <div className='flex items-center gap-2 text-orange-600'>
                        <IoGiftSharp size={22} />
                        <h2 className='font-black text-xl text-gray-900 dark:text-white uppercase tracking-tighter leading-none mt-0.5'>Festival Offers</h2>
                    </div>
                    <p className='text-xs text-slate-500 dark:text-neutral-400 font-semibold uppercase tracking-wider mt-1'>Manage Homepage Festive Campaigns</p>
                </div>
                <button 
                    onClick={() => setOpenUpload(true)} 
                    className='text-xs bg-linear-to-r from-orange-600 to-pink-600 hover:opacity-95 text-white font-black uppercase tracking-widest px-6 py-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-orange-500/20 flex items-center gap-2 cursor-pointer select-none'
                >
                    <IoAddCircleOutline size={18} />
                    <span>Add Festival Offer</span>
                </button>
            </div>

            {/* Dashboard Container */}
            <div className='p-6 flex-1 flex flex-col'>
                {loading ? (
                    <Loading type="grid" />
                ) : offers.length === 0 ? (
                    <div className='flex-1 bg-white dark:bg-neutral-900 rounded-3xl shadow-sm border border-slate-100 dark:border-neutral-800 p-12 flex flex-col items-center justify-center text-center my-10'>
                        <div className='w-16 h-16 bg-orange-50 dark:bg-orange-950/30 text-orange-500 rounded-full flex items-center justify-center mb-4 animate-bounce'>
                            <IoGiftSharp size={32} />
                        </div>
                        <h3 className='font-black text-xl text-gray-900 dark:text-white tracking-tight uppercase'>No Festival Campaigns Found</h3>
                        <p className='text-slate-500 text-sm max-w-md mt-2 mb-6'>Create exclusive festival discount cards that link straight to specific categories on your storefront Home Page.</p>
                        <button 
                            onClick={() => setOpenUpload(true)}
                            className='text-xs bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-black uppercase tracking-widest px-6 py-3 rounded-xl transition-all hover:opacity-90 active:scale-95 select-none'
                        >
                            Launch First Campaign
                        </button>
                    </div>
                ) : (
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                        {offers.map((offer) => (
                            <div 
                                key={offer._id} 
                                className='bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden border border-slate-200/70 dark:border-neutral-800 shadow-sm hover:shadow-xl hover:border-orange-200 dark:hover:border-orange-500/20 transition-all group relative flex flex-col h-full'
                            >
                                {/* Active/Inactive Badge Overlay */}
                                <div className='absolute top-3 right-3 z-10'>
                                    <span className={`text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full shadow-sm border ${offer.isActive ? "bg-green-100 border-green-200 text-green-700 dark:bg-green-950/50 dark:border-green-800 dark:text-green-400" : "bg-slate-100 border-slate-200 text-slate-600 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-400"}`}>
                                        {offer.isActive ? "ACTIVE" : "INACTIVE"}
                                    </span>
                                </div>

                                {/* Offer Banner Display */}
                                <div className='w-full aspect-video bg-slate-100 dark:bg-neutral-800 relative overflow-hidden shrink-0 border-b border-slate-100 dark:border-neutral-800'>
                                    {offer.image ? (
                                        <img
                                            alt={offer.title}
                                            src={offer.image}
                                            className='w-full h-full object-cover transition-transform duration-700 group-hover:scale-105'
                                        />
                                    ) : (
                                        <div className='w-full h-full flex items-center justify-center text-slate-400'>No Image Loaded</div>
                                    )}

                                    {/* Discount Overlay Ribbon */}
                                    {offer.discountPercent > 0 && (
                                        <div className='absolute bottom-3 left-3 bg-linear-to-r from-red-600 to-orange-600 text-white text-[10px] font-black uppercase tracking-widest px-3.5 py-1.5 rounded-lg shadow-md shadow-orange-500/20'>
                                            {offer.discountPercent}% OFF
                                        </div>
                                    )}
                                </div>

                                {/* Content Space */}
                                <div className='p-5 flex flex-col flex-1 justify-between'>
                                    <div>
                                        <h4 className='font-black text-lg text-gray-900 dark:text-white tracking-tight leading-snug truncate' title={offer.title}>
                                            {offer.title || "Untitled Campaign"}
                                        </h4>
                                        {offer.subTitle && (
                                            <p className='text-slate-500 dark:text-neutral-400 text-xs font-medium tracking-normal mt-1 line-clamp-2 leading-relaxed min-h-[2rem]'>
                                                {offer.subTitle}
                                            </p>
                                        )}

                                        <div className='mt-4 space-y-2 border-t border-slate-100 dark:border-neutral-800 pt-3'>
                                            {offer.couponCode && (
                                                <div className='flex items-center justify-between text-xs'>
                                                    <span className='text-slate-400 font-semibold uppercase tracking-wider text-[10px]'>Promo Code:</span>
                                                    <span className='bg-slate-100 dark:bg-neutral-800 text-slate-900 dark:text-white border border-dashed border-slate-300 dark:border-neutral-700 rounded-lg px-2.5 py-0.5 font-black tracking-widest uppercase'>{offer.couponCode}</span>
                                                </div>
                                            )}
                                            {offer.link && (
                                                <div className='flex flex-col text-[10px] gap-0.5'>
                                                    <span className='text-slate-400 font-semibold uppercase tracking-wider'>Redirection URL:</span>
                                                    <span className='text-slate-600 dark:text-neutral-300 truncate font-medium max-w-full'>{offer.link}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* 🚀 "One-Click Send to All Users Mail" Blast Action */}
                                    <div className='mt-5 border-t border-slate-100 dark:border-neutral-800 pt-4 flex flex-col'>
                                        <button
                                            onClick={() => handleTriggerEmailBlast(offer)}
                                            disabled={blastingOffers[offer._id]}
                                            className={`w-full font-black uppercase tracking-widest text-[10px] py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md select-none relative overflow-hidden ${
                                                blastingOffers[offer._id]
                                                  ? "bg-slate-100 dark:bg-neutral-800 text-slate-400 border border-slate-200/40 dark:border-neutral-700 cursor-not-allowed"
                                                  : "bg-linear-to-r from-amber-500 via-orange-500 to-pink-500 hover:opacity-95 text-white shadow-orange-500/10 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                                            }`}
                                        >
                                            <IoPaperPlaneSharp className={`${blastingOffers[offer._id] ? "animate-ping" : "animate-bounce"}`} size={12} />
                                            <span>{blastingOffers[offer._id] ? "DISPATCHING MAILS..." : "🚀 SEND EMAIL BLAST TO ALL USERS"}</span>
                                        </button>
                                    </div>

                                    {/* Actions Footer */}
                                    <div className='flex gap-3 mt-4 border-t border-slate-100 dark:border-neutral-800 pt-4'>
                                        <button 
                                            onClick={() => {
                                                setEditData(offer)
                                                setOpenEdit(true)
                                            }} 
                                            className='flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-white font-black uppercase tracking-widest text-[10px] py-2.5 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5 border border-slate-200/40 dark:border-neutral-700'
                                        >
                                            <IoPencil size={12} />
                                            Edit
                                        </button>
                                        <button 
                                            onClick={() => {
                                                setDeleteId(offer._id)
                                                setOpenConfirmDelete(true)
                                            }} 
                                            className='flex-1 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/30 dark:hover:bg-red-950/50 dark:text-red-400 font-black uppercase tracking-widest text-[10px] py-2.5 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5 border border-red-200/20'
                                        >
                                            <IoTrash size={12} />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal Overlays */}
            {openUpload && (
                <UploadFestivalOffer 
                    close={() => setOpenUpload(false)} 
                    fetchData={fetchOffers} 
                />
            )}

            {openEdit && editData && (
                <EditFestivalOffer 
                    data={editData} 
                    close={() => {
                        setOpenEdit(false)
                        setEditData(null)
                    }} 
                    fetchData={fetchOffers} 
                />
            )}

            {openConfirmDelete && (
                <ConfirmBox 
                    close={() => setOpenConfirmDelete(false)} 
                    cancel={() => setOpenConfirmDelete(false)} 
                    confirm={handleDeleteConfirm} 
                />
            )}
        </section>
    )
}

export default FestivalOfferAdmin
