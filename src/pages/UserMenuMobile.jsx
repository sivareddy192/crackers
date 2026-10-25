import React from 'react'
import UserMenu from '../components/UserMenu'
import { IoClose } from "react-icons/io5";

const UserMenuMobile = () => {
  return (
    <section className='bg-gray-50 dark:bg-neutral-950 min-h-screen w-full transition-colors duration-300'>
        <div className='bg-white dark:bg-neutral-900 px-4 py-6 flex items-center justify-between shadow-sm sticky top-0 z-10 transition-colors duration-300'>
            <h2 className='font-black text-2xl text-gray-900 dark:text-gray-100'>Account Settings</h2>
            <button 
                onClick={()=>window.history.back()} 
                className='w-10 h-10 bg-gray-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-2xl flex items-center justify-center active:scale-90 transition-transform'
            >
                <IoClose size={24}/>
            </button>
        </div>

        <div className='p-4 max-w-md mx-auto'>
           {/* We reuse the UserMenu but remove the fixed width for mobile */}
           <div className='[&>div]:max-w-none [&>div]:shadow-none [&>div]:border-none [&>div]:bg-transparent [&>div]:p-0'>
              <UserMenu/>
           </div>
        </div>

        <p className='text-center text-[10px] font-black text-gray-300 uppercase tracking-widest pb-10'>
            Trace v1.0.4
        </p>
    </section>
  )
}

export default UserMenuMobile

