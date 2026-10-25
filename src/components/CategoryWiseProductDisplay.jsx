import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import AxiosToastError from '../utils/AxiosToastError'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import ProductLoading from './ProductLoading'
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import { useSelector } from 'react-redux'
import { valideURLConvert } from '../utils/valideURLConvert'
import ProductBox from './ProductBox'
import { HiArrowSmallRight } from "react-icons/hi2";

const CategoryWiseProductDisplay = ({ id, name, manualData }) => {
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(false)
    const containerRef = useRef()
    const subCategoryData = useSelector(state => state.product.allSubCategory)

    const loadingCardNumber = new Array(6).fill(null)

    const fetchCategoryWiseProduct = async () => {
        try {
            setLoading(true)
            const response = await Axios({
                ...SummaryApi.getProductByCategory,
                data: { id }
            })

            const { data: resData } = response

            if (resData.success) {
                setData(resData.data)
            }
        } catch (error) {
            AxiosToastError(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (manualData && manualData.length > 0) {
            setData(manualData)
        } else if (id) {
            fetchCategoryWiseProduct()
        }
    }, [id, manualData])

    const redirectURL = (() => {
        if (!subCategoryData?.length) return "#"

        const subcategory = subCategoryData.find(sub =>
            sub.category?.some(c => c._id == id)
        )

        if (!subcategory) return "#"

        return `/${valideURLConvert(name)}-${id}/${valideURLConvert(subcategory?.name)}-${subcategory?._id}`
    })()

    const handleScrollRight = () => {
        containerRef.current.scrollLeft += 240
    }

    const handleScrollLeft = () => {
        containerRef.current.scrollLeft -= 240
    }

    if (!loading && data.length === 0) {
        return null
    }

    return (
        <div className="py-2">
            <div className='container mx-auto px-4 py-4 flex items-center justify-between'>
                <div className='flex items-center gap-2.5'>
                    <span className="w-2.5 h-6 rounded-full bg-gradient-to-b from-indigo-600 to-blue-600 inline-block"></span>
                    <h3 className='font-black text-lg md:text-2xl text-slate-900 tracking-tight font-heading'>
                        {name || (manualData?.length > 0 ? "Related Products" : "")}
                    </h3>
                </div>

                {!manualData && (
                    <Link
                        to={redirectURL}
                        className='group inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 font-extrabold text-xs lg:text-sm bg-indigo-50/80 hover:bg-indigo-100/80 px-3.5 py-1.5 rounded-full border border-indigo-200/60 transition-all active:scale-95 shadow-xs'
                    >
                        <span>See All</span>
                        <HiArrowSmallRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                )}
            </div>

            <div className='relative flex items-center group/carousel'>
                <div
                    className='flex gap-4 md:gap-5 lg:gap-6 container mx-auto px-4 overflow-x-scroll scrollbar-none scroll-smooth py-2'
                    ref={containerRef}
                >
                    {loading && loadingCardNumber.map((_, index) => (
                        <ProductLoading key={"LoadingBox" + index} />
                    ))}

                    {!loading && data?.map((p, index) => (
                        <ProductBox
                            key={p._id + "CategoryProduct" + index}
                            data={p}
                        />
                    ))}
                </div>

                {/* Left/Right Floating Navigation Buttons */}
                <div className='w-full left-0 right-0 container mx-auto px-2 absolute hidden lg:flex justify-between pointer-events-none'>
                    <button
                        onClick={handleScrollLeft}
                        aria-label="Previous items"
                        className='pointer-events-auto z-10 bg-white/95 backdrop-blur-md hover:bg-white shadow-lg shadow-slate-900/10 hover:shadow-xl p-3 rounded-full text-slate-700 hover:text-indigo-600 border border-slate-200/80 hover:border-indigo-300 transition-all active:scale-90 cursor-pointer -ml-3'
                    >
                        <FaAngleLeft size={16} />
                    </button>

                    <button
                        onClick={handleScrollRight}
                        aria-label="Next items"
                        className='pointer-events-auto z-10 bg-white/95 backdrop-blur-md hover:bg-white shadow-lg shadow-slate-900/10 hover:shadow-xl p-3 rounded-full text-slate-700 hover:text-indigo-600 border border-slate-200/80 hover:border-indigo-300 transition-all active:scale-90 cursor-pointer -mr-3'
                    >
                        <FaAngleRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    )
}

export default CategoryWiseProductDisplay
