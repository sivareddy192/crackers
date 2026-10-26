import React, { useEffect, useState } from 'react'
import { FaChevronLeft, FaChevronRight } from "react-icons/fa"
import { getImageUrl } from '../utils/getImageUrl'
import { Link } from 'react-router-dom'

const BannerDisplay = ({ banners = [] }) => {
    const [currentImage, setCurrentImage] = useState(0)
    const [cachedBanners] = useState(() => {
        try {
            const rawSession = sessionStorage.getItem('tracly_cached_banners')
            if (rawSession) return JSON.parse(rawSession)
            const rawLocal = localStorage.getItem('tracly_cached_banners')
            if (rawLocal) return JSON.parse(rawLocal)
            return null
        } catch {
            return null
        }
    })

    const displayBanners = banners.length > 0 ? banners : (cachedBanners || [])
    const currentSlide = Math.min(currentImage, Math.max(displayBanners.length - 1, 0))

    // Persist banners in session and local storage for zero-delay paint on return/refresh
    useEffect(() => {
        if (banners.length > 0) {
            try {
                const slice = banners.slice(0, 3)
                sessionStorage.setItem('tracly_cached_banners', JSON.stringify(slice))
                localStorage.setItem('tracly_cached_banners', JSON.stringify(slice))

                // Save the first banner's mobile image URL to localStorage so the inline
                // script in index.html can inject a <link rel="preload"> on next page load,
                // enabling near-instant LCP on repeat visits.
                const firstBanner = banners[0]
                const firstMobileImage = firstBanner?.imageMobile || firstBanner?.imageDesktop
                if (firstMobileImage) {
                    // Use the getImageUrl transform for the width used in <img src={}>
                    const lcpUrl = getImageUrl(firstMobileImage, { width: 480, quality: 70 })
                    if (lcpUrl && lcpUrl.startsWith('https://res.cloudinary.com')) {
                        localStorage.setItem('tracly_lcp_banner', JSON.stringify({ url: lcpUrl, ts: Date.now() }))
                    }
                }
            } catch {
                // Ignore storage quota errors
            }
        }
    }, [banners])

    useEffect(() => {
        if (displayBanners.length > 1) {
            const interval = setInterval(() => {
                setCurrentImage(prev => (prev + 1) % displayBanners.length)
            }, 5500)
            return () => clearInterval(interval)
        }
    }, [displayBanners.length])

    // Immediate fallback hero with identical geometry to eliminate CLS and achieve sub-second LCP
    if (displayBanners.length === 0) {
        return (
            <div className='home-banner relative w-full px-3 pt-1 lg:px-0 lg:pt-0'>
                <div className='relative overflow-hidden rounded-2xl lg:rounded-none aspect-[2.4/1] lg:aspect-[3.1/1] w-full min-h-[175px] sm:min-h-[220px] lg:min-h-[340px] flex items-center bg-gradient-to-r from-orange-50 via-white to-amber-100 px-5 lg:px-[8.5%] border border-orange-100/60'>
                    <div className='relative z-10 max-w-xl'>
                        <p className='mb-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-orange-700 sm:text-xs'>
                            Crackers &amp; fireworks for celebrations
                        </p>
                        <h2 className='font-heading text-2xl font-black leading-[1.08] tracking-tight text-slate-950 sm:text-4xl lg:text-5xl'>
                            Celebrate together.<br /><span className='text-orange-600'>Celebrate safely.</span>
                        </h2>
                        <p className='mt-2 max-w-sm text-xs font-medium text-slate-600 sm:text-sm line-clamp-2'>
                            Explore crackers and fireworks for special occasions. Choose responsibly and follow every product safety instruction.
                        </p>
                        <Link to='/products' className='mt-3.5 inline-flex items-center gap-2 rounded-full bg-orange-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-md shadow-orange-600/20 transition hover:bg-orange-700 active:scale-95'>
                            Browse products <span aria-hidden='true'>→</span>
                        </Link>
                    </div>
                    <div className='pointer-events-none absolute -right-10 -top-20 h-72 w-72 rounded-full bg-orange-200/40 blur-3xl lg:right-[10%]' />
                    <div className='pointer-events-none absolute -bottom-28 right-[18%] h-72 w-72 rounded-full bg-amber-200/40 blur-3xl' />
                </div>
            </div>
        )
    }

    return (
        <div className='home-banner relative w-full px-3 pt-1 lg:px-0 lg:pt-0'>
            <div className='relative overflow-hidden rounded-2xl lg:rounded-none aspect-[2.4/1] lg:aspect-[3.1/1] w-full min-h-[175px] sm:min-h-[220px] lg:min-h-[340px]'>
                <div 
                    className='flex h-full w-full transition-transform duration-700 ease-in-out'
                    style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                    {
                        displayBanners.map((banner, index) => {
                            const isNearby = index === 0 || Math.abs(currentSlide - index) <= 1
                            const isLCP = index === 0

                            const desktopImage = banner.imageDesktop || banner.imageMobile
                            const mobileImage = banner.imageMobile || banner.imageDesktop

                            const desktopSrcSet = [960, 1280, 1600]
                                .map(w => `${getImageUrl(desktopImage, { width: w, quality: 75 })} ${w}w`)
                                .join(', ')
                            const mobileSrcSet = [360, 480, 720]
                                .map(w => `${getImageUrl(mobileImage, { width: w, quality: 70 })} ${w}w`)
                                .join(', ')

                            const image = isNearby ? (
                                <picture className='block h-full w-full'>
                                    {desktopImage && (
                                        <source
                                            media='(min-width: 1024px)'
                                            srcSet={desktopSrcSet}
                                            sizes='100vw'
                                        />
                                    )}
                                    {mobileImage && (
                                        <img
                                            src={getImageUrl(mobileImage, { width: 480, quality: 70 })}
                                            srcSet={mobileSrcSet}
                                            sizes='(max-width: 640px) 100vw, (max-width: 1024px) 768px, 1200px'
                                            alt={banner.name || `Tracly Celebration Banner ${index + 1}`}
                                            width='768'
                                            height='320'
                                            loading={isLCP ? 'eager' : 'lazy'}
                                            fetchPriority={isLCP ? 'high' : 'low'}
                                            decoding='async'
                                            className='block h-full w-full object-cover'
                                        />
                                    )}
                                </picture>
                            ) : (
                                <div className='h-full w-full bg-slate-100' />
                            )

                            return (
                                <div key={banner._id || index} className='h-full min-w-full select-none'>
                                    {banner.link ? (
                                        <Link to={banner.link} className='block h-full w-full'>
                                            {image}
                                        </Link>
                                    ) : (
                                        image
                                    )}
                                </div>
                            )
                        })
                    }
                </div>

                {/* Animated Indicator Pills */}
                {displayBanners.length > 1 && (
                    <div className='absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10 bg-black/25 backdrop-blur-md px-3 py-1.5 rounded-full'>
                        {
                            displayBanners.map((_, index) => (
                                <button 
                                    key={index}
                                    onClick={() => setCurrentImage(index)}
                                    aria-label={`Go to slide ${index + 1}`}
                                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${currentSlide === index ? "bg-white w-6 shadow-xs" : "bg-white/50 w-1.5 hover:bg-white/80"}`}
                                />
                            ))
                        }
                    </div>
                )}
                
                {
                    displayBanners.length > 1 && (
                        <>
                            {/* Navigation Buttons */}
                            <button 
                                onClick={() => setCurrentImage(prev => (prev - 1 + displayBanners.length) % displayBanners.length)}
                                aria-label="Previous banner"
                                className='absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-md hover:bg-white text-orange-600 p-2 rounded-full shadow-md z-10 transition-all active:scale-90 cursor-pointer sm:left-4 sm:p-2.5'
                            >
                                <FaChevronLeft size={13} aria-hidden="true" />
                            </button>
                            <button 
                                onClick={() => setCurrentImage(prev => (prev + 1) % displayBanners.length)}
                                aria-label="Next banner"
                                className='absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-md hover:bg-white text-orange-600 p-2 rounded-full shadow-md z-10 transition-all active:scale-90 cursor-pointer sm:right-4 sm:p-2.5'
                            >
                                <FaChevronRight size={13} aria-hidden="true" />
                            </button>
                        </>
                    )
                }
            </div>
        </div>
    )
}

export default BannerDisplay
