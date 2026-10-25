import React, { useEffect, useState } from 'react'
import UploadBanner from '../components/UploadBanner'
import Loading from '../components/Loading'
import NoData from '../components/NoData'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import EditBanner from '../components/EditBanner'
import ConfirmBox from '../components/ConfirmBox'
import toast from 'react-hot-toast'
import AxiosToastError from '../utils/AxiosToastError'
import { IoRefresh } from "react-icons/io5";

const BannerAdmin = () => {
    const [openUploadBanner, setOpenUploadBanner] = useState(false)
    const [loading, setLoading] = useState(false)
    const [bannerData, setBannerData] = useState([])
    const [openEdit, setOpenEdit] = useState(false)
    const [editData, setEditData] = useState({
        name: "",
        image: "",
        isActive: true
    })
    const [openConfirmBoxDelete, setOpenConfirmBoxDelete] = useState(false)
    const [deleteBanner, setDeleteBanner] = useState({
        _id: ""
    })

    const fetchBanner = async () => {
        try {
            setLoading(true)
            const response = await Axios({
                ...SummaryApi.getBanner
            })
            const { data: responseData } = response

            if (responseData.success) {
                setBannerData(responseData.data)
            }
        } catch (error) {
            AxiosToastError(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchBanner()
    }, [])

    const handleDeleteBanner = async () => {
        try {
            const response = await Axios({
                ...SummaryApi.deleteBanner,
                data: deleteBanner
            })

            const { data: responseData } = response

            if (responseData.success) {
                toast.success(responseData.message)
                fetchBanner()
                setOpenConfirmBoxDelete(false)
            }
        } catch (error) {
            AxiosToastError(error)
        }
    }

    return (
        <section className=''>
            <div className='p-4 bg-white shadow-md flex items-center justify-between'>
                <button onClick={() => setOpenUploadBanner(true)} className='text-sm border-2 font-black uppercase tracking-widest border-gray-900 hover:bg-gray-900 hover:text-white text-gray-900 px-6 py-2.5 rounded-xl transition-all active:scale-95'>Add Banner</button>
                <h2 className='font-black text-xl text-gray-900 uppercase tracking-tighter'>Banners</h2>
            </div>

            <div className='p-4 min-h-[70vh] flex flex-col'>
                {loading ? (
                    <Loading type="grid" />
                ) : (
                    <>
                        {bannerData.length === 0 ? (
                            <NoData />
                        ) : (
                            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                                {bannerData.map((banner) => (
                                    <div className='rounded shadow-md bg-white overflow-hidden' key={banner._id}>
                                        {banner.imageDesktop && (
                                            <img
                                                alt={banner.name}
                                                src={banner.imageDesktop}
                                                className='w-full h-40 object-cover'
                                            />
                                        )}
                                        <div className='p-2 flex flex-col gap-2'>
                                            <div className='flex items-center justify-between'>
                                                <p className='font-medium truncate'>{banner.name || "Untitled Banner"}</p>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${banner.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                                    {banner.isActive ? "Active" : "Inactive"}
                                                </span>
                                            </div>
                                            <div className='flex gap-2'>
                                                <button onClick={() => {
                                                    setOpenEdit(true)
                                                    setEditData(banner)
                                                }} className='flex-1 bg-green-100 hover:bg-green-200 text-green-600 font-medium py-1 rounded'>
                                                    Edit
                                                </button>
                                                <button onClick={() => {
                                                    setOpenConfirmBoxDelete(true)
                                                    setDeleteBanner(banner)
                                                }} className='flex-1 bg-red-100 hover:bg-red-200 text-red-600 font-medium py-1 rounded'>
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {
                openUploadBanner && (
                    <UploadBanner fetchData={fetchBanner} close={() => setOpenUploadBanner(false)} />
                )
            }

            {
                openEdit && (
                    <EditBanner data={editData} close={() => setOpenEdit(false)} fetchData={fetchBanner} />
                )
            }

            {
                openConfirmBoxDelete && (
                    <ConfirmBox close={() => setOpenConfirmBoxDelete(false)} cancel={() => setOpenConfirmBoxDelete(false)} confirm={handleDeleteBanner} />
                )
            }
        </section>
    )
}

export default BannerAdmin
