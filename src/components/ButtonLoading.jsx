import React from 'react'

const ButtonLoading = () => {
  return (
    <div className='flex items-center justify-center w-full h-full scale-50'>
      <div className="relative flex items-center justify-center">
        {/* Outer Ring */}
        <div className="w-10 h-10 rounded-full border-4 border-gray-100 border-t-green-500 animate-spin"></div>
        
        {/* Inner Pulsing Circle */}
        <div className="absolute w-5 h-5 bg-green-500/10 rounded-full animate-pulse flex items-center justify-center">
            <div className='w-1 h-1 bg-green-500 rounded-full'></div>
        </div>
      </div>
    </div>
  )
}

export default ButtonLoading
