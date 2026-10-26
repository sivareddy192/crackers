import React, { useState, useEffect } from 'react'
import { IoSearch } from "react-icons/io5";
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaArrowLeft } from "react-icons/fa";
import useMobile from '../hooks/useMobile';

const PLACEHOLDERS = [
    'Search "firecrackers"',
    'Search "sparklers"',
    'Search "flower pots"',
    'Search "ground chakkars"',
    'Search "sky shots"',
    'Search "celebration packs"',
    'Search crackers'
];

const Search = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const isSearchPage = location.pathname === "/search"
    const [isMobile] = useMobile()
    const searchText = new URLSearchParams(location.search).get('q') || ''
    const [placeholderIndex, setPlaceholderIndex] = useState(0)

    useEffect(() => {
        if (isSearchPage) return
        const timer = setInterval(() => {
            setPlaceholderIndex(prev => (prev + 1) % PLACEHOLDERS.length)
        }, 2600)
        return () => clearInterval(timer)
    }, [isSearchPage])

    const redirectToSearchPage = () => {
        navigate("/search")
    }

    const handleOnChange = (e) => {
        const value = e.target.value
        const url = `/search?q=${encodeURIComponent(value)}`
        navigate(url)
    }

    return (
        <div className='w-full min-w-[280px] lg:min-w-[420px] h-11 lg:h-12 rounded-2xl border border-slate-200/80 overflow-hidden flex items-center text-slate-500 bg-slate-100/70 hover:bg-slate-100 focus-within:bg-white focus-within:border-orange-500 focus-within:ring-3 focus-within:ring-orange-500/15 transition-all duration-200 shadow-xs'>
            <div>
                {(isMobile && isSearchPage) ? (
                    <Link to={"/"} aria-label="Back to home" className='flex justify-center items-center h-full p-2 m-1 text-slate-600 hover:text-orange-600 bg-white rounded-full shadow-xs active:scale-90 transition-transform'>
                        <FaArrowLeft size={16} aria-hidden="true" />
                    </Link>
                ) : (
                    <button type="button" aria-label="Search" className='flex justify-center items-center h-full px-3.5 text-slate-400 group-focus-within:text-orange-600 transition-colors'>
                        <IoSearch size={20} className='stroke-[2]' aria-hidden="true" />
                    </button>
                )}
            </div>
            <div className='w-full h-full text-xs lg:text-sm font-medium'>
                {!isSearchPage ? (
                    <div onClick={redirectToSearchPage} className='w-full h-full flex items-center cursor-pointer text-slate-400 select-none'>
                        <span className='transition-opacity duration-300' key={placeholderIndex}>
                            {PLACEHOLDERS[placeholderIndex]}
                        </span>
                    </div>
                ) : (
                    <div className='w-full h-full'>
                        <input
                            type='text'
                            id='search'
                            placeholder='Search crackers, sparklers, fireworks...'
                            autoFocus
                            defaultValue={searchText}
                            className='bg-transparent w-full h-full outline-none text-slate-800 placeholder:text-slate-400 font-medium'
                            onChange={handleOnChange}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}

export default Search
