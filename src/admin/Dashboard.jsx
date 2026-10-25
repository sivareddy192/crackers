import React from 'react'
import UserMenu from '../components/UserMenu'
import { Outlet, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

const Dashboard = () => {
  const user = useSelector(state => state.user)
  const token = localStorage.getItem('accessToken')

  if (!token && !user?._id) {
    return <Navigate to="/login" replace />
  }

  return (
    <section className='bg-white'>
        <div className='container mx-auto p-3 grid lg:grid-cols-2 '>
                {/**left for menu */}
                <div className='py-4 lg:ml-[-9vh] sticky max-w-70  top-24 max-h-[calc(100vh-96px)] border-r  overflow-y-auto hidden lg:block'>
                    <UserMenu/>
                </div>


                {/**right for content */}
                <div className='bg-white  lg:ml-[-50vh] lg:w-265  lg:min-h-[75vh] min-h-[75vh]'>
                    <Outlet/>
                </div>
        </div>
    </section>
  )
}

export default Dashboard
