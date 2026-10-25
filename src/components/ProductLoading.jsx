import React from 'react'

const ProductLoading = () => {
  return (
    <div className='bg-white rounded-xl p-3 lg:p-4 w-full h-full border border-gray-100 shadow-sm animate-pulse'>
      {/* Image Skeleton */}
      <div className='aspect-square w-full rounded-lg bg-gray-50 mb-3' />
      
      {/* Badge/Time Skeleton */}
      <div className='h-3 w-12 bg-gray-50 rounded mb-2' />
      
      {/* Title Skeleton */}
      <div className='space-y-1 mb-4'>
        <div className='h-4 w-full bg-gray-100 rounded' />
        <div className='h-4 w-4/5 bg-gray-100 rounded' />
      </div>

      {/* Unit Skeleton */}
      <div className='h-3 w-10 bg-gray-50 rounded mb-4' />

      {/* Footer (Price + Button) */}
      <div className='mt-auto flex items-center justify-between pt-2 border-t border-gray-50'>
        <div className='space-y-1'>
            <div className='h-4 w-12 bg-gray-100 rounded' />
            <div className='h-2 w-8 bg-gray-50 rounded' />
        </div>
        <div className='h-8 w-16 lg:w-20 bg-gray-100 rounded-lg' />
      </div>
    </div>
  )
}


export default ProductLoading

