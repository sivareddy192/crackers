import React from 'react'
import { IoClose } from 'react-icons/io5'

const ViewVideo = ({ url, close }) => {
  return (
    <div className='fixed inset-0 bg-black/80 z-[100] flex justify-center items-center p-4 backdrop-blur-sm animate-in fade-in duration-300'>
        <div className='relative w-full max-w-4xl bg-black rounded-3xl overflow-hidden shadow-2xl'>
            <button 
                onClick={close}
                className='absolute top-4 right-4 z-10 w-10 h-10 bg-white/20 hover:bg-white/40 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-90'
            >
                <IoClose size={24} />
            </button>
            <div className='aspect-video'>
                <video 
                    src={url} 
                    controls 
                    autoPlay
                    className='w-full h-full object-contain'
                />
            </div>
        </div>
    </div>
  )
}

export default ViewVideo
