import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import {
  FaArrowRightFromBracket,
  FaBoxOpen,
  FaLocationDot,
  FaRegCircleUser,
  FaShieldHalved
} from 'react-icons/fa6'
import { getImageUrl } from '../utils/getImageUrl'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import { logout } from '../store/userSlice'
import { clearCartItem } from '../store/cartProduct'
import { clearAddress } from '../store/addressSlice'
import { clearOrder } from '../store/orderSlice'
import toast from 'react-hot-toast'
import AxiosToastError from '../utils/AxiosToastError'
import isAdmin from '../utils/isAdmin'

const UserMenu = ({ close }) => {
  const user = useSelector(state => state.user)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      const response = await Axios({ ...SummaryApi.logout })

      if (response?.data?.success) {
        close?.()
        dispatch(logout())
        dispatch(clearCartItem())
        dispatch(clearAddress())
        dispatch(clearOrder())
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        toast.success(response.data.message)
        navigate('/')
      }
    } catch (error) {
      AxiosToastError(error)
    }
  }

  const displayName = user?.name || user?.mobile || 'Your account'
  const menuItems = [
    { label: 'My orders', description: 'Track and manage orders', to: '/dashboard/myorders', icon: <FaBoxOpen aria-hidden='true' /> },
    { label: 'Saved addresses', description: 'Manage delivery locations', to: '/dashboard/address', icon: <FaLocationDot aria-hidden='true' /> },
    { label: 'Account privacy', description: 'Password and security', to: '/dashboard/privacy', icon: <FaShieldHalved aria-hidden='true' /> }
  ]

  return (
    <div className='w-full max-w-[340px] overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 animate-in fade-in zoom-in-95 duration-150'>
      <div className='bg-gradient-to-br from-orange-50 via-white to-amber-50 p-4'>
        <div className='flex items-center gap-3'>
          {user?.avatar ? (
            <img
              src={getImageUrl(user.avatar)}
              alt=''
              className='h-12 w-12 shrink-0 rounded-full border-2 border-white object-cover shadow-sm'
            />
          ) : (
            <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-white bg-orange-100 text-orange-600 shadow-sm'>
              {user?.name
                ? <span className='text-lg font-black'>{user.name.charAt(0).toUpperCase()}</span>
                : <FaRegCircleUser size={23} aria-hidden='true' />
              }
            </div>
          )}
          <div className='min-w-0 flex-1'>
            <p className='truncate text-sm font-extrabold'>{displayName}</p>
            <p className='mt-0.5 truncate text-xs text-slate-500'>{user?.email || user?.mobile || 'Welcome to Trace'}</p>
          </div>
        </div>
        <button
          type='button'
          onClick={() => {
            navigate('/dashboard/profile')
            close?.()
          }}
          className='mt-3 flex w-full items-center justify-between rounded-xl border border-orange-200 bg-white px-3 py-2 text-xs font-bold text-orange-700 transition hover:border-orange-300 hover:bg-orange-50'
        >
          View profile
          <span aria-hidden='true'>→</span>
        </button>
      </div>

      <nav className='p-2' aria-label='Account menu'>
        {isAdmin(user?.role) && (
          <Link
            onClick={close}
            to='/admin-portal/dashboard'
            className='mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-indigo-700 transition hover:bg-indigo-50'
          >
            <span className='flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600'>
              <FaShieldHalved aria-hidden='true' />
            </span>
            <span>Admin dashboard</span>
          </Link>
        )}
        {menuItems.map(({ label, description, to, icon }) => (
          <Link
            key={to}
            onClick={close}
            to={to}
            className='group flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-slate-50'
          >
            <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition group-hover:bg-orange-100 group-hover:text-orange-600'>
              {icon}
            </span>
            <span className='min-w-0 flex-1'>
              <span className='block text-sm font-bold text-slate-800'>{label}</span>
              <span className='mt-0.5 block truncate text-[11px] text-slate-500'>{description}</span>
            </span>
          </Link>
        ))}
      </nav>

      <div className='border-t border-slate-100 p-2'>
        <button
          type='button'
          onClick={handleLogout}
          className='flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-rose-600 transition hover:bg-rose-50'
        >
          <span className='flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50'>
            <FaArrowRightFromBracket aria-hidden='true' />
          </span>
          Sign out
        </button>
      </div>
    </div>
  )
}

export default UserMenu
