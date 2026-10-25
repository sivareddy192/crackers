import React from 'react'

const ConfirmBox = ({cancel,confirm}) => {
  return (
    <div className='fixed top-0 bottom-0 left-0 right-0 bg-neutral-800 bg-opacity-60 p-4 flex items-center justify-center z-50'>
      <div className='bg-white max-w-sm w-full rounded p-4 flex flex-col items-center justify-center'>
        <div className='flex justify-between items-center gap-3'>
            <h1 className='font-semibold lg:items-center lg:w-fit'>Permanent Delete</h1>
        </div>
        <p className='my-4 lg:items-center'>Are you sure permanent delete ?</p>
        <div className='w-fit lg:ml-[-5vh] ml-[-5vh] gap-10  flex items-center '>
            <button onClick={cancel} className='px-4  py-1 border rounded border-green-600 text-green-600 hover:bg-green-600 hover:text-white'>Cancel</button>
            <button onClick={confirm} className='px-4 py-1  border rounded border-red-600 text-red-600 hover:bg-red-600 hover:text-white'>Confirm</button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmBox
