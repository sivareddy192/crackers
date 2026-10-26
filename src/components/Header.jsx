import React, { useEffect, useState, useRef } from 'react'
import logoAvif from "../assets/trace-logo.avif"
import logoPng from "../assets/trace-logo.png"
import Search from './Search'
import { Link, useNavigate } from 'react-router-dom'
import { FaCartShopping } from "react-icons/fa6";
import { useSelector } from 'react-redux'
import { FaRegUserCircle } from "react-icons/fa";
import UserMenu from './UserMenu';
import { getImageUrl } from '../utils/getImageUrl';
import { useGlobalContext } from '../provider/GlobalProvider';

const Header = () => {
  const navigate = useNavigate()
  const user = useSelector((state) => state?.user)
  const [openUserMenu, setOpenUserMenu] = useState(false)
  const { totalQty } = useGlobalContext()
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setOpenUserMenu(false);
      }
    };

    if (openUserMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openUserMenu]);

  const redirectToLoginPage = () => {
    navigate("/login")
  }

  const handleCloseUserMenu = () => {
    setOpenUserMenu(false)
  }

  const handleMobileUser = () => {
    if (!user?._id) {
      navigate('/login')
      return
    }
    navigate('/user-menu')
  }

  return (
    <header className='h-28 lg:h-20 bg-white/90 backdrop-blur-xl fixed top-0 w-full z-50 flex flex-col justify-center border-b border-slate-200/80 shadow-xs transition-all duration-300'>
      <div className='container mx-auto px-3 sm:px-4'>
        <div className='flex items-center justify-between h-14 lg:h-20 gap-4'>

          {/* Logo Section */}
          <Link to={"/"} aria-label="Tracly Home" className='shrink-0 transition-transform active:scale-95 flex items-center'>
            <picture>
              <source srcSet={logoAvif} type="image/avif" />
              <img
                src={logoPng}
                width="144"
                height="72"
                className='w-[90px] sm:w-24 lg:w-36 h-auto transition-all duration-300 hover:brightness-105'
                alt='Tracly Logo'
                fetchPriority="high"
                decoding="async"
              />
            </picture>
          </Link>

          {/* Desktop Search */}
          <div className='hidden lg:block flex-1 max-w-xl mx-4'>
            <Search />
          </div>

          {/* Right Actions */}
          <div className='flex items-center gap-2 sm:gap-3 lg:gap-4'>

            {/* Mobile User Icon Only */}
            <div className='flex lg:hidden items-center gap-3'>
              <button
                type='button'
                onClick={() => navigate('/cart')}
                aria-label={`Open cart${totalQty ? `, ${totalQty} items` : ''}`}
                className='relative flex h-9 w-9 items-center justify-center text-slate-900 cursor-pointer'
              >
                <FaCartShopping size={21} aria-hidden="true" />
                {totalQty > 0 && (
                  <span className='absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] font-black text-white ring-2 ring-white'>
                    {totalQty > 99 ? '99+' : totalQty}
                  </span>
                )}
              </button>
              <button 
                type="button"
                onClick={handleMobileUser} 
                aria-label="User Account"
                className='rounded-full p-1 text-slate-800 transition-transform active:scale-90 cursor-pointer'
              >
                {user?._id && user?.avatar ? (
                  <img
                    src={getImageUrl(user.avatar, { width: 80, quality: 75 })}
                    alt={user.name || 'User'}
                    width="36"
                    height="36"
                    className='w-9 h-9 rounded-full object-cover ring-2 ring-orange-500/40 shadow-xs'
                  />
                ) : (
                  <div className='w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 ring-1 ring-slate-200'>
                    <FaRegUserCircle size={22} aria-hidden="true" />
                  </div>
                )}
              </button>
            </div>

            {/* Desktop Navigation & Actions */}
            <div className='hidden lg:flex items-center gap-4 justify-end'>
              <Link to='/safety-tips' className='whitespace-nowrap text-sm font-bold text-slate-600 transition-colors hover:text-orange-600'>
                Safety Tips
              </Link>
              
              {/* Desktop Cart Button */}
              <button
                type='button'
                onClick={() => navigate('/cart')}
                aria-label={`Open cart${totalQty ? `, ${totalQty} items` : ''}`}
                className='relative flex h-11 w-11 items-center justify-center rounded-full text-slate-900 transition-colors hover:bg-orange-50 hover:text-orange-600 active:scale-95 cursor-pointer'
              >
                <FaCartShopping size={23} aria-hidden="true" />
                {totalQty > 0 && (
                  <span className='absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] font-black text-white ring-2 ring-white'>
                    {totalQty > 99 ? '99+' : totalQty}
                  </span>
                )}
              </button>

              {/* User Section */}
              {user?._id ? (
                <div className='relative' ref={userMenuRef}>
                  <button
                    type='button'
                    onClick={() => setOpenUserMenu(prev => !prev)}
                    aria-label={`${user.name || 'Account'} menu`}
                    aria-expanded={openUserMenu}
                    className='flex h-11 w-11 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white text-slate-700 transition-all hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 active:scale-95'
                  >
                    {user.avatar ? (
                      <img
                        alt={user.name || 'User'}
                        src={getImageUrl(user.avatar, { width: 80, quality: 75 })}
                        width="44"
                        height="44"
                        className='h-full w-full rounded-full object-cover'
                      />
                    ) : (
                      <FaRegUserCircle size={22} aria-hidden='true' />
                    )}
                  </button>

                  {openUserMenu && (
                    <div className='absolute right-0 top-12 w-64 animate-in fade-in zoom-in-95 duration-150 z-50'>
                      <UserMenu close={handleCloseUserMenu} />
                    </div>
                  )}
                </div>
              ) : (
                localStorage.getItem('accessToken') ? (
                  <div className='flex items-center gap-3 animate-pulse'>
                    <div className='w-9 h-9 bg-slate-200 rounded-full'></div>
                    <div className='flex flex-col gap-1'>
                      <div className='w-12 h-2 bg-slate-200 rounded'></div>
                      <div className='w-16 h-3 bg-slate-200 rounded'></div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={redirectToLoginPage}
                    className='bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-extrabold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all shadow-md shadow-orange-500/20 active:scale-95 cursor-pointer'
                  >
                    Login
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Mobile Search - Bottom of Header */}
        <div className='lg:hidden pb-3'>
          <Search />
        </div>
      </div>

    </header>
  )
}

export default Header
