import React from 'react'
import { IoClose } from "react-icons/io5";

const AddFieldComponent = ({ close, value, onChange, submit }) => {
  return (
    <section className='fixed top-0 bottom-0 right-0 left-0 bg-neutral-900 bg-opacity-70 z-50 flex justify-center items-center p-4'>
      <div className='bg-white rounded p-4 w-full max-w-md'>
        <div className='flex items-center justify-between gap-3'>
          <h1 className='font-semibold'>Add Field</h1>
          <button onClick={close} type="button">
            <IoClose size={25} />
          </button>
        </div>
        <input
          className='bg-blue-50 my-3 p-2 border outline-none focus-within:border-green-100 rounded w-full'
          placeholder='Enter field name (e.g. Product Specifications)'
          value={value}
          onChange={onChange}
          autoFocus
        />
        <div className='flex flex-wrap gap-1.5 mb-4'>
          <span className='text-[11px] text-gray-500 font-medium w-full'>Quick Suggestions:</span>
          {["Product Specifications", "Brand", "Quantity", "Occasions", "Packaging", "Safety Guidelines"].map(suggestion => (
            <button
              type="button"
              key={suggestion}
              onClick={() => onChange({ target: { value: suggestion } })}
              className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                value === suggestion 
                  ? 'bg-green-500 text-white border-green-500 font-bold'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-green-100 hover:text-green-800'
              }`}
            >
              + {suggestion}
            </button>
          ))}
        </div>
        <button
          onClick={submit}
          type="button"
          className='bg-green-200 hover:bg-green-300 font-semibold px-4 py-2 rounded mx-auto w-fit block transition-colors'
        >
          Add Field
        </button>
      </div>
    </section>
  )
}

export default AddFieldComponent;
