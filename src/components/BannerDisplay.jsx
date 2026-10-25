import React, { useEffect, useState } from 'react'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import AxiosToastError from '../utils/AxiosToastError'
import { FaChevronLeft, FaChevronRight } from "react-icons/fa"
import { getImageUrl } from '../utils/getImageUrl'
import { Link } from 'react-router-dom'

const BannerDisplay = () => {
    const [banners, setBanners] = useState([])
    const [loading, setLoading] = useState(false)
    const [currentImage, setCurrentImage] = useState(0)

    const fetchBanners = async () => {
        try {
            setLoading(true)
            const response = await Axios({
                ...SummaryApi.getBanner
            })
            if (response.data.success) {
                setBanners(response.data.data.filter(b => b.isActive))
            }
        } catch (error) {
            AxiosToastError(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchBanners()
    }, [])

    useEffect(() => {
        if (banners.length > 1) {
            const interval = setInterval(() => {
                setCurrentImage(prev => (prev + 1) % banners.length)
            }, 5000)
            return () => clearInterval(interval)
        }
    }, [banners])

    if (loading) {
        return (
            <div className='w-full px-0'>
                <div className='mx-3 mt-1 h-[clamp(230px,66vw,310px)] rounded-2xl bg-slate-200/70 animate-pulse lg:mx-0 lg:mt-0 lg:h-[clamp(340px,32vw,480px)] lg:rounded-none'></div>
            </div>
        )
    }

    if (banners.length === 0) {
        return (
            <div className='home-banner-frame home-hero-fallback relative mx-3 mt-1 flex h-[clamp(230px,66vw,310px)] items-center overflow-hidden rounded-2xl bg-gradient-to-r from-orange-50 via-white to-amber-100 px-5 lg:mx-0 lg:mt-0 lg:h-[clamp(340px,32vw,480px)] lg:rounded-none lg:px-[8.5%]'>
                <div className='relative z-10 max-w-xl'>
                    <p className='mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-orange-600 lg:text-xs'>
                        Crackers & fireworks for celebrations
                    </p>
                    <h1 className='font-heading text-3xl font-black leading-[1.05] tracking-tight text-slate-950 sm:text-4xl lg:text-5xl'>
                        Celebrate together.<br /><span className='text-orange-600'>Celebrate safely.</span>
                    </h1>
                    <p className='mt-2 max-w-sm text-xs font-medium text-slate-600 sm:text-sm'>
                        Explore crackers and fireworks for special occasions. Choose responsibly and follow every product safety instruction.
                    </p>
                    <Link to='/search' className='mt-4 inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600'>
                        Browse products <span aria-hidden='true'>→</span>
                    </Link>
                </div>
                <div className='pointer-events-none absolute -right-10 -top-20 h-72 w-72 rounded-full bg-orange-200/50 blur-3xl lg:right-[10%]' />
                <div className='pointer-events-none absolute -bottom-28 right-[18%] h-72 w-72 rounded-full bg-amber-200/50 blur-3xl' />
            </div>
        )
    }

    return (
        <div className='home-banner relative w-full px-3 pt-1 lg:px-0 lg:pt-0'>
            <div className='relative overflow-hidden rounded-2xl lg:rounded-none'>
                <div 
                    className='flex transition-transform duration-700 ease-in-out'
                    style={{ transform: `translateX(-${currentImage * 100}%)` }}
                >
                    {
                        banners.map((banner, index) => (
                            <div key={banner._id} className='min-w-full select-none'>
                                {banner.link ? (
                                    <Link to={banner.link} className='block w-full h-full'>
                                        {/* Desktop */}
                                        {banner.imageDesktop && (
                                            <img 
                                                src={getImageUrl(banner.imageDesktop)} 
                                                alt={banner.name || `Banner ${index + 1}`}
                                                loading={index === 0 ? "eager" : "lazy"}
                                                className='hidden lg:block aspect-[3.1/1] w-full object-cover object-center cursor-pointer'
                                            />
                                        )}
                                        {/* Mobile */}
                                        {(banner.imageMobile || banner.imageDesktop) && (
                                            <img 
                                                src={getImageUrl(banner.imageMobile || banner.imageDesktop)} 
                                                alt={banner.name || `Banner ${index + 1}-mobile`}
                                                loading={index === 0 ? "eager" : "lazy"}
                                                className='block h-auto w-full max-w-full cursor-pointer lg:hidden'
                                            />
                                        )}
                                    </Link>
                                ) : (
                                    <>
                                        {/* Desktop */}
                                        {banner.imageDesktop && (
                                            <img 
                                                src={getImageUrl(banner.imageDesktop)} 
                                                alt={banner.name || `Banner ${index + 1}`}
                                                loading={index === 0 ? "eager" : "lazy"}
                                                className='hidden lg:block aspect-[3.1/1] w-full object-cover object-center'
                                            />
                                        )}
                                        {/* Mobile */}
                                        {(banner.imageMobile || banner.imageDesktop) && (
                                            <img 
                                                src={getImageUrl(banner.imageMobile || banner.imageDesktop)} 
                                                alt={banner.name || `Banner ${index + 1}-mobile`}
                                                loading={index === 0 ? "eager" : "lazy"}
                                                className='block h-auto w-full max-w-full lg:hidden'
                                            />
                                        )}
                                    </>
                                )}
                            </div>
                        ))
                    }
                </div>

                {/* Animated Indicator Pills */}
                <div className='absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10 bg-black/25 backdrop-blur-md px-3 py-1.5 rounded-full'>
                    {
                        banners.map((_, index) => (
                            <button 
                                key={index}
                                onClick={() => setCurrentImage(index)}
                                aria-label={`Go to slide ${index + 1}`}
                                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${currentImage === index ? "bg-white w-6 shadow-xs" : "bg-white/50 w-1.5 hover:bg-white/80"}`}
                            />
                        ))
                    }
                </div>
                
                {
                    banners.length > 1 && (
                        <>
                            {/* Navigation Buttons */}
                            <button 
                                onClick={() => setCurrentImage(prev => (prev - 1 + banners.length) % banners.length)}
                                aria-label="Previous banner"
                                className='absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-md hover:bg-white text-orange-600 p-2.5 rounded-full shadow-md z-10 transition-all active:scale-90 cursor-pointer'
                            >
                                <FaChevronLeft size={13} />
                            </button>
                            <button 
                                onClick={() => setCurrentImage(prev => (prev + 1) % banners.length)}
                                aria-label="Next banner"
                                className='absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-md hover:bg-white text-orange-600 p-2.5 rounded-full shadow-md z-10 transition-all active:scale-90 cursor-pointer'
                            >
                                <FaChevronRight size={13} />
                            </button>
                        </>
                    )
                }
            </div>
        </div>
    )
}

export default BannerDisplay
