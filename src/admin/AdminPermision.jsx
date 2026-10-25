import React from 'react'
import { useSelector } from 'react-redux'
import isAdmin from '../utils/isAdmin'
import monkey from "../assets/monkey-2.jpg"

const AdminPermision = ({ children }) => {

  const user = useSelector(state => state.user)

  const allow = isAdmin(user?.role)

  return (
    <>
      {allow
        ? children
        : (
          <div className='flex flex-col mt-[210px] items-center justify-center p-4 gap-2'>
            <img
              src={monkey}
              alt='no data'
              className='w-56 h-56'
            />
            <p className='text-red-500 font-bold'>Do not have permission</p>
          </div>
          
        )
      }
    </>
  )
}

export default AdminPermision
