import React, { useEffect, useState } from 'react'
import SummaryApi from '../common/SummaryApi'
import AxiosToastError from '../utils/AxiosToastError'
import Axios from '../utils/Axios'
import Loading from '../components/Loading'
import AdminProduct from '../components/AdminProduct'
import { IoSearchOutline } from "react-icons/io5"
import { IoRefresh } from "react-icons/io5";

const ProductAdmin = () => {
  const [productData, setProductData] = useState([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [totalPageCount, setTotalPageCount] = useState(1)
  const [search, setSearch] = useState("")

  const fetchProductData = async () => {
    try {
      setLoading(true)
      const response = await Axios({
        ...SummaryApi.getProduct,
        params: { t: Date.now() },
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
        data: {
          page: page,
          limit: 12,
          search: search
        }
      })

      const { data: responseData } = response
      

      if (responseData.success) {
        setTotalPageCount(responseData.totalNoPage)
        setProductData(responseData.data || [])
      }
    } catch (error) {
      AxiosToastError(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProductData()
  }, [page])

  useEffect(() => {
    const handleInvalidate = () => {
      fetchProductData()
    }
    window.addEventListener("tracly:catalog_invalidated", handleInvalidate)
    return () => window.removeEventListener("tracly:catalog_invalidated", handleInvalidate)
  }, [])

  const handleNext = () => {
    if (page < totalPageCount) setPage(prev => prev + 1)
  }

  const handlePrevious = () => {
    if (page > 1) setPage(prev => prev - 1)
  }

  const handleOnChange = (e) => {
    const { value } = e.target
    setSearch(value)
    setPage(1)
  }

  useEffect(() => {
    const interval = setTimeout(() => {
      fetchProductData()
    }, 300)

    return () => clearTimeout(interval)
  }, [search])

  return (
    <section className=''>
      <div className='p-4 bg-white shadow-md flex items-center justify-between gap-4'>
        <h2 className='font-black text-xl text-gray-900 uppercase tracking-tighter'>Products</h2>

        <div className='h-11 min-w-24 max-w-md w-full ml-auto bg-gray-50 px-4 flex items-center gap-3 rounded-xl border border-gray-100 focus-within:border-gray-900 transition-all'>
          <IoSearchOutline size={20} className='text-gray-400' />
          <input
            type='text'
            placeholder='Search product here...'
            className='h-full w-full outline-none bg-transparent text-sm font-medium'
            value={search}
            onChange={handleOnChange}
          />
        </div>
      </div>

      <div className='p-4 bg-blue-50 min-h-[70vh] flex flex-col'>
        {loading ? (
            <Loading type="grid" />
        ) : (
            <>
                <div className='min-h-[55vh]'>
                <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4'>
                    {productData && productData.length > 0 ? (
                    productData.map((p, index) => (
                        <AdminProduct key={p._id || index} data={p} fetchProductData={fetchProductData} />
                    ))
                    ) : (
                    <p className='text-center font-bold mt-[30vh] col-span-full text-gray-500'>No products found</p>
                    )}
                </div>
                </div>

                <div className='flex justify-between my-4'>
                <button onClick={handlePrevious} className="border border-green-300 px-4 py-1 hover:text-white hover:bg-green-400">Previous</button>
                <button className='w-full bg-slate-100'>{page}/{totalPageCount}</button>
                <button onClick={handleNext} className="border border-green-300 px-4 py-1 hover:text-white hover:bg-green-400">Next</button>
                </div>
            </>
        )}
      </div>
    </section>
  )
}

export default ProductAdmin
