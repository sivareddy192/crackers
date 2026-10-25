import React from 'react'
import ProductLoading from './ProductLoading'

const AppSkeleton = () => {
  return (
    <div className='min-h-screen bg-white dark:bg-neutral-950 transition-colors duration-300'>
      {/* 1. Mock Header */}
      <header className='h-28 lg:h-20 bg-white dark:bg-neutral-900 fixed top-0 w-full z-50 flex flex-col justify-center border-b border-gray-100 dark:border-neutral-800 lg:shadow-md transition-colors duration-300 animate-pulse'>
        <div className='container mx-auto px-4'>
          <div className='flex items-center justify-between h-14 lg:h-20 gap-4'>
            {/* Logo placeholder */}
            <div className='w-24 lg:w-40 h-8 bg-gray-100 dark:bg-neutral-850 rounded-lg' />

            {/* Desktop Search placeholder */}
            <div className='hidden lg:block flex-1 max-w-xl h-11 bg-gray-100 dark:bg-neutral-850 rounded-xl' />

            {/* Right actions placeholder */}
            <div className='flex items-center gap-3 lg:gap-6'>
              {/* Desktop Cart Button placeholder */}
              <div className='hidden lg:block w-36 h-12 bg-gray-100 dark:bg-neutral-855 rounded-2xl' />
              
              {/* User profile / Login button placeholder */}
              <div className='w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-gray-100 dark:bg-neutral-850' />
            </div>
          </div>
        </div>
      </header>

      {/* 2. Mock Page Content */}
      <main className='min-h-[78vh] pt-28 pb-24 lg:pt-20 lg:pb-0'>
        {/* Banner Skeleton */}
        <div className='container mx-auto px-4 mt-4 lg:mt-6'>
          <div className='w-full aspect-[2.5/1] md:aspect-[3/1] lg:h-[350px] bg-gray-100 dark:bg-neutral-900 rounded-3xl animate-pulse' />
        </div>

        {/* Categories Section Skeleton */}
        <div className='container mx-auto px-4 mt-8 lg:mt-10'>
          <div className='h-6 w-48 bg-gray-100 dark:bg-neutral-900 rounded-md mb-6 animate-pulse' />
          
          <div className='grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3 lg:gap-5 px-1'>
            {new Array(8).fill(null).map((_, index) => (
              <div key={index} className='flex flex-col items-center gap-2 animate-pulse'>
                <div className='w-full aspect-square bg-gray-50 dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800' />
                <div className='h-3 w-12 bg-gray-50 dark:bg-neutral-900 rounded' />
              </div>
            ))}
          </div>
        </div>

        {/* Product Sections Skeleton */}
        <div className='container mx-auto px-4 mt-12 pb-20 space-y-12'>
          {new Array(2).fill(null).map((_, groupIndex) => (
            <div key={groupIndex} className='space-y-4'>
              <div className='h-6 w-60 bg-gray-100 dark:bg-neutral-900 rounded-md animate-pulse' />
              <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 lg:gap-5'>
                {new Array(6).fill(null).map((_, prodIndex) => (
                  <div key={prodIndex} className='min-h-[280px]'>
                    <ProductLoading />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

export default AppSkeleton
