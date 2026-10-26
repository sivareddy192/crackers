import React from 'react'
import monkey from '../assets/monkey-2.avif'

const NoData = () => {
  return (
    <div className='flex flex-col items-center justify-center p-4 gap-2'>
      <img
        src={monkey}
        alt='No data found'
        width='144'
        height='144'
        loading='lazy'
        decoding='async'
        className='w-36 h-auto' 
      />
      <p className='text-slate-500 font-medium text-sm'>No Data</p>
    </div>
  )
}

export default NoData
