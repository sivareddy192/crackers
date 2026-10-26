import React, { useEffect, useState, useRef } from 'react'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import { Link, useParams } from 'react-router-dom'
import AxiosToastError from '../utils/AxiosToastError'
import Loading from '../components/Loading'
import ProductBox from '../components/ProductBox'
import ProductLoading from '../components/ProductLoading'
import { useSelector } from 'react-redux'
import { valideURLConvert } from '../utils/valideURLConvert'
import monkey from "../assets/monkey-2.avif"

const ProductList = () => {
  const [data, setData] = useState([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [totalPage, setTotalPage] = useState(1)

  const containerRef = useRef(null)
  const params = useParams()
  const AllSubCategory = useSelector(state => state.product.allSubCategory)
  const [DisplaySubCategory, setDisplaySubCategory] = useState([])

  const categoryId = params.category.split('-').slice(-1)[0]
  const subCategoryId = params.subCategory.split('-').slice(-1)[0]

  const subParts = params?.subCategory?.split('-')
  const subCategoryName = subParts.slice(0, subParts.length - 1).join(' ')

  const fetchProductdata = async () => {
    try {
      setLoading(true)

      const response = await Axios({
        ...SummaryApi.getProductByCategoryAndSubCategory,
        data: {
          categoryId,
          subCategoryId,
          page,
          limit: 8
        }
      })

      const { data: responseData } = response

      if (responseData.success) {
        if (page === 1) {
          setData(responseData.data)
        } else {
          setData(prev => [...prev, ...responseData.data])
        }
        setTotalPage(Math.ceil(responseData.totalCount / 8))
      }
    } catch (error) {
      AxiosToastError(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setPage(1)
  }, [params])

  useEffect(() => {
    fetchProductdata()
  }, [page, params])

  useEffect(() => {
    const sub = AllSubCategory.filter(s =>
      s.category.some(el => el._id === categoryId)
    )
    setDisplaySubCategory(sub)
  }, [AllSubCategory, params])

  // Scroll inner container and window to top when subcategory changes
  useEffect(() => {
    window.scrollTo(0, 0)
    if (containerRef.current) {
        containerRef.current.scrollTop = 0
    }
  }, [params])

  return (
    <section className='bg-gray-50 sticky top-28 lg:top-20'>
      <div className='container mx-auto grid grid-cols-[80px_1fr] md:grid-cols-[100px_1fr] lg:grid-cols-[140px_1fr] h-[calc(100vh-112px)] lg:h-[calc(100vh-80px)]'>

        {/* Sidebar - Subcategory List */}
        <div className='bg-white overflow-y-auto h-full border-r border-gray-100 no-scrollbar'>
            <div className='flex flex-col'>
                {DisplaySubCategory.map((s, idx) => {
                    const link = `/${valideURLConvert(s?.category[0]?.name)}-${s?.category[0]?._id}/${valideURLConvert(s.name)}-${s._id}`
                    const isActive = subCategoryId === s._id;
                    return (
                        <Link
                            key={idx}
                            to={link}
                            className={`group w-full relative py-3 px-1 flex flex-col items-center gap-2 transition-all duration-200 border-b border-gray-50
                                ${isActive ? 'bg-green-50/50' : 'hover:bg-gray-50'}`}
                        >
                            {/* Active Indicator Bar */}
                            {isActive && (
                                <div className='absolute left-0 top-0 bottom-0 w-1 bg-green-600' />
                            )}

                            <div className={`w-10 h-10 lg:w-14 lg:h-14 flex items-center justify-center rounded-xl lg:rounded-2xl transition-all duration-300 ${isActive ? 'bg-white shadow-sm' : ''}`}>
                                <img
                                    src={s.image}
                                    alt={s.name}
                                    className="w-8 h-8 lg:w-11 lg:h-11 object-contain"
                                />
                            </div>
                            <p className={`text-[9px] lg:text-[11px] font-bold text-center leading-tight px-1 ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                                {s.name}
                            </p>
                        </Link>
                    )
                })}
            </div>
        </div>


        {/* Main content Area */}
        <div ref={containerRef} className='bg-white overflow-y-auto h-full no-scrollbar border-l border-gray-100'>
          <div className='bg-white p-4 lg:p-6 sticky top-0 z-10 flex items-center justify-between border-b border-gray-100'>
            <div>
                <h2 className='text-sm lg:text-xl font-bold text-gray-800 tracking-tight'>
                    {subCategoryName && subCategoryName.charAt(0).toUpperCase() + subCategoryName.slice(1)}
                </h2>
                <p className='text-[10px] text-gray-400 font-medium'>
                    {data.length} Products
                </p>
            </div>
            
            <div className='flex items-center gap-4'>
                <select className='bg-gray-50 border border-gray-100 text-[10px] font-bold px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-green-500'>
                    <option>Relevance</option>
                    <option>Price (Low to High)</option>
                    <option>Price (High to Low)</option>
                </select>
            </div>
          </div>


          {/* Product Grid */}
          <div className='p-3 lg:p-10 pt-4 lg:pt-0'>
            <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 lg:gap-10'>

              {/* Skeletons while loading initial data */}
              {loading && data.length === 0 && (
                  new Array(8).fill(null).map((_, index) => (
                      <ProductLoading key={"InitialLoading" + index} />
                  ))
              )}

              {/* Product Items */}
              {data.map((p, index) => (
                <ProductBox
                  key={p._id + index}
                  data={p}
                />
              ))}

              {/* Skeletons while loading more data */}
              {loading && data.length > 0 && (
                  new Array(4).fill(null).map((_, index) => (
                      <ProductLoading key={"MoreLoading" + index} />
                  ))
              )}
            </div>

            {/* No Products Found UI (Only if not loading) */}
            {data.length === 0 && !loading && (
              <div className='col-span-full flex flex-col items-center justify-center py-16 lg:py-24 bg-gray-50/50 rounded-4xl lg:rounded-[3rem] border-2 border-dashed border-gray-100'>
                <div className='w-24 h-24 lg:w-40 lg:h-40 bg-white rounded-full flex items-center justify-center shadow-xl shadow-gray-100 mb-6 lg:mb-8'>
                  <img
                      src={monkey}
                      alt="No Products"
                      className="w-16 h-16 lg:w-24 lg:h-24 object-contain grayscale opacity-40"
                  />
                </div>
                <h3 className="text-lg lg:text-2xl font-black text-gray-900 uppercase tracking-widest">No Products</h3>
                <p className='text-[10px] lg:text-sm text-gray-400 mt-2 font-bold uppercase tracking-widest'>Try switching categories</p>
              </div>
            )}


            {/* Load More Button */}
            {page < totalPage && !loading && (
              <div className='flex justify-center mt-12 mb-8'>
                <button
                  onClick={() => setPage(prev => prev + 1)}
                  className='bg-gray-800 hover:bg-black text-white px-12 py-4 rounded-2xl font-black text-xs uppercase tracking-[3px] transition-all hover:shadow-2xl hover:shadow-gray-200 active:scale-95'
                >
                  Load More
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default ProductList
