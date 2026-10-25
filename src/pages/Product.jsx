import React, { useEffect, useState } from 'react'
import SummaryApi from '../common/SummaryApi'
import AxiosToastError from '../utils/AxiosToastError'
import Axios from '../utils/Axios'

const Product = () => {

  const [productData, setProductData] = useState([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  const fetchProductData = async () => {
    try {
      setLoading(true)
      const response = await Axios({
        ...SummaryApi.getProduct,
        data: {
          page: page,
        }
      })

      const { data: responseData } = response

      if (responseData?.success) {
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

  return (
    <div className='p-4'>

      <h2 className='text-xl font-semibold mb-3'>Products</h2>

      {loading && (
        <div className="space-y-3 animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-full" />
          <div className="h-10 bg-gray-200 rounded w-full" />
          <div className="h-10 bg-gray-200 rounded w-full" />
        </div>
      )}

      {!loading && productData.length === 0 && (
        <p className='text-neutral-500'>No products found</p>
      )}

      {!loading && productData.length > 0 && (
        <div className='grid gap-3'>
          {productData.map((item, index) => (
            <div
              key={item?._id || index}
              className='border p-3 rounded bg-white shadow'
            >
              {item?.name || "Untitled Product"}
            </div>
          ))}
        </div>
      )}

    </div>
  )
}

export default Product
