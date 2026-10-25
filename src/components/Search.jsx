import React from 'react'
import { IoSearch } from "react-icons/io5";
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { TypeAnimation } from 'react-type-animation';
import { FaArrowLeft } from "react-icons/fa";
import useMobile from '../hooks/useMobile';

const Search = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const isSearchPage = location.pathname === "/search"
    const [isMobile] = useMobile()
    const searchText = new URLSearchParams(location.search).get('q') || ''

    const redirectToSearchPage = () => {
        navigate("/search")
    }

    const handleOnChange = (e) => {
        const value = e.target.value
        const url = `/search?q=${value}`
        navigate(url)
    }

    return (
        <div className='w-full min-w-[280px] lg:min-w-[420px] h-11 lg:h-12 rounded-2xl border border-slate-200/80 overflow-hidden flex items-center text-slate-500 bg-slate-100/70 hover:bg-slate-100 focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-3 focus-within:ring-indigo-500/15 transition-all duration-200 shadow-xs'>
            <div>
                {(isMobile && isSearchPage) ? (
                    <Link to={"/"} className='flex justify-center items-center h-full p-2 m-1 text-slate-600 hover:text-indigo-600 bg-white rounded-full shadow-xs active:scale-90 transition-transform'>
                        <FaArrowLeft size={16} />
                    </Link>
                ) : (
                    <button className='flex justify-center items-center h-full px-3.5 text-slate-400 group-focus-within:text-indigo-600 transition-colors'>
                        <IoSearch size={20} className='stroke-[2]' />
                    </button>
                )}
            </div>
            <div className='w-full h-full text-xs lg:text-sm font-medium'>
                {!isSearchPage ? (
                    <div onClick={redirectToSearchPage} className='w-full h-full flex items-center cursor-pointer text-slate-400 select-none'>
                        <TypeAnimation
                            sequence={[
                                'Search "firecrackers"',
                                1600,
                                'Search "sparklers"',
                                1600,
                                'Search "flower pots"',
                                1600,
                                'Search "ground chakkars"',
                                1600,
                                'Search "sky shots"',
                                1600,
                                'Search "celebration packs"',
                                1600,
                                'Search crackers',
                                1600,
                            ]}
                            wrapper="span"
                            speed={45}
                            style={{ display: 'inline-block' }}
                            repeat={Infinity}
                        />
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
