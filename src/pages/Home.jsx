import { useEffect, useState, useMemo, lazy, Suspense } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { getImageUrl } from "../utils/getImageUrl"
import Skeleton from "../components/Skeleton"
import { IoSparklesSharp } from "react-icons/io5"
import toast from "react-hot-toast"
import Axios from "../utils/Axios"
import SummaryApi from "../common/SummaryApi"
import BannerDisplay from "../components/BannerDisplay"
import { HiSparkles } from "react-icons/hi2"
import { FaCrown, FaHeadset, FaLock, FaTruckFast } from "react-icons/fa6"
import ProductBox from "../components/ProductBox"
import AxiosToastError from "../utils/AxiosToastError"
import { setAllCategory, setAllSubCategory } from "../store/productSlice"
import { getApiCache, setApiCache } from "../utils/apiCache"

const WelcomeOffersPopup = lazy(() => import("../components/WelcomeOffersPopup"))

const Home = () => {
  const categoryData = useSelector(state => state.product.allCategory)
  const user = useSelector(state => state.user)

  const [homeFeed, setHomeFeed] = useState(() => {
    const mem = getApiCache("home_feed")
    if (mem) return mem
    try {
      const raw = localStorage.getItem("tracly_home_feed")
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })
  const [loadingHomeFeed, setLoadingHomeFeed] = useState(() => !homeFeed)
  const [activeProductFilter, setActiveProductFilter] = useState("all")

  const dispatch = useDispatch()
  const navigate = useNavigate()

  const welcomeCoupon = homeFeed?.welcomeCoupon
  const festivalOffers = homeFeed?.festivalOffers || []
  const featuredProducts = homeFeed?.featuredProducts || []
  const isCategoryLoading = loadingHomeFeed && categoryData.length === 0
  const shouldShowTopBanner = !!welcomeCoupon

  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()

    const hydrateCatalogFallback = async () => {
      const [categoryResult, subCategoryResult] = await Promise.allSettled([
        Axios({ ...SummaryApi.getCategory, signal: controller.signal }),
        Axios({ ...SummaryApi.getSubCategory, signal: controller.signal })
      ])

      if (!isMounted) return false

      let recovered = false
      if (categoryResult.status === "fulfilled" && categoryResult.value.data?.success) {
        const categories = [...(categoryResult.value.data.data || [])]
          .sort((a, b) => a.name.localeCompare(b.name))
        dispatch(setAllCategory(categories))
        recovered = true
      }

      if (subCategoryResult.status === "fulfilled" && subCategoryResult.value.data?.success) {
        const subCategories = [...(subCategoryResult.value.data.data || [])]
          .sort((a, b) => a.name.localeCompare(b.name))
        dispatch(setAllSubCategory(subCategories))
        recovered = true
      }

      return recovered
    }

    const fetchHomeFeed = async () => {
      try {
        let feed = null

        // Leverage early prefetch initiated in index.html if available
        if (window.__TRACLY_PREFETCH__) {
          try {
            const prefetchData = await window.__TRACLY_PREFETCH__
            window.__TRACLY_PREFETCH__ = null
            if (prefetchData?.success && prefetchData?.data) {
              feed = prefetchData.data
            }
          } catch {
            window.__TRACLY_PREFETCH__ = null
          }
        }

        if (!feed) {
          const response = await Axios({ ...SummaryApi.getHomeFeed, signal: controller.signal })
          feed = response.data?.data
        }

        if (!feed) {
          throw new Error("Unable to load homepage data.")
        }

        if (!isMounted) return

        const categories = [...(feed.categories || [])].sort((a, b) => a.name.localeCompare(b.name))
        const subCategories = [...(feed.subCategories || [])].sort((a, b) => a.name.localeCompare(b.name))
        dispatch(setAllCategory(categories))
        dispatch(setAllSubCategory(subCategories))
        const finalFeed = { ...feed, categories, subCategories }
        setHomeFeed(finalFeed)
        setApiCache("home_feed", finalFeed, 300)
        try {
          localStorage.setItem("tracly_home_feed", JSON.stringify(finalFeed))
        } catch {}
      } catch (error) {
        if (error?.code === "ERR_CANCELED" || !isMounted) return

        const recovered = await hydrateCatalogFallback()
        if (!recovered && isMounted && !homeFeed) AxiosToastError(error)
      } finally {
        if (isMounted) {
          setLoadingHomeFeed(false)
        }
      }
    }

    fetchHomeFeed()
    return () => {
      isMounted = false
      controller.abort()
    }
  }, [dispatch])

  const filteredProducts = useMemo(() => {
    if (activeProductFilter === "offers") {
      return featuredProducts.filter(product => Number(product.discount) > 0)
    }
    if (activeProductFilter === "new") {
      return [...featuredProducts].sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      )
    }
    return featuredProducts
  }, [activeProductFilter, featuredProducts])

  return (
    <section className="home-page min-h-screen bg-white transition-colors duration-300">
      <h1 className="sr-only">Tracly — Crackers &amp; Fireworks Online Store | Safe Celebrations</h1>

      {user?._id && (
        <Suspense fallback={null}>
          <WelcomeOffersPopup />
        </Suspense>
      )}

      {shouldShowTopBanner && (
        <div 
          onClick={() => {
            navigator.clipboard.writeText(welcomeCoupon.code)
            toast.success(`Welcome Coupon "${welcomeCoupon.code}" copied to clipboard!`)
          }}
          className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 text-white py-2.5 px-4 text-center text-[11px] md:text-xs font-black tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer transition-all hover:brightness-105 select-none relative shadow-xs"
        >
          <IoSparklesSharp className="animate-bounce text-amber-200" aria-hidden="true" />
          <span>SPECIAL OFFER: GET {welcomeCoupon.discountPercent}% OFF YOUR FIRST ORDER! USE CODE: <strong className="underline font-extrabold ml-1 bg-white/20 px-2 py-0.5 rounded-md">{welcomeCoupon.code}</strong> 🎁 (TAP TO COPY)</span>
        </div>
      )}
      
      <div className="relative group">
        <BannerDisplay banners={homeFeed?.banners || []} loading={loadingHomeFeed} />
      </div>

      <div className="home-benefits container mx-auto grid grid-cols-4 border-y border-slate-100 bg-orange-50/40 px-1.5 py-3 lg:px-10 lg:py-4">
        {[
          { icon: <FaCrown className="shrink-0 text-xl text-orange-600 lg:text-2xl" aria-hidden="true" />, title: "Crackers & Fireworks", detail: "Browse celebration products" },
          { icon: <FaLock className="shrink-0 text-xl text-orange-600 lg:text-2xl" aria-hidden="true" />, title: "Safe Celebrations", detail: "Read our fireworks safety tips" },
          { icon: <FaTruckFast className="shrink-0 text-xl text-orange-600 lg:text-2xl" aria-hidden="true" />, title: "Delivery: ₹500 - ₹1,000", detail: "Pay after delivery • Price via Gmail" },
          { icon: <FaHeadset className="shrink-0 text-xl text-orange-600 lg:text-2xl" aria-hidden="true" />, title: "Customer Support", detail: "Help with orders and products" }
        ].map(benefit => (
          <div key={benefit.title} className="flex flex-col items-center justify-center gap-1 px-0.5 py-1 text-center lg:flex-row lg:gap-3 lg:px-2 lg:py-2 lg:text-left lg:border-r lg:border-slate-200 last:border-r-0">
            {benefit.icon}
            <div>
              <p className="text-[9px] font-extrabold leading-tight text-slate-900 sm:text-[10px] lg:text-sm">{benefit.title}</p>
              <p className="hidden text-[10px] font-semibold leading-tight text-slate-600 sm:block lg:text-xs">{benefit.detail}</p>
            </div>
          </div>
        ))}
      </div>

      {festivalOffers.length > 0 && (
        <div className="container mx-auto px-4 mt-8 lg:mt-12 relative z-10">
          <div className="flex items-center gap-2 mb-4 lg:mb-6">
             <HiSparkles className="w-6 h-6 text-amber-500 animate-pulse" aria-hidden="true" />
             <h2 className="font-black text-xl lg:text-3xl text-slate-900 tracking-tight uppercase font-heading">
               Festive Special Deals
             </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
             {festivalOffers.map(offer => (
                <div 
                  key={offer._id}
                  onClick={() => {
                      if (!offer.link) return;
                      if (offer.link.startsWith("http://") || offer.link.startsWith("https://")) {
                          window.open(offer.link, "_blank", "noopener,noreferrer");
                      } else {
                          navigate(offer.link);
                      }
                  }}
                  className={`relative aspect-[21/9] md:aspect-[16/9] overflow-hidden rounded-3xl shadow-md hover:shadow-xl transition-all duration-300 group border border-slate-200/80 bg-slate-100 ${
                      offer.link 
                        ? "cursor-pointer hover:scale-[1.01] hover:-translate-y-0.5" 
                        : "cursor-default"
                  }`}
                >
                   {offer.image && (
                      <img 
                        src={getImageUrl(offer.image, { width: 640, quality: 75 })}
                        srcSet={`${getImageUrl(offer.image, { width: 360, quality: 75 })} 360w, ${getImageUrl(offer.image, { width: 640, quality: 75 })} 640w`}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        alt={offer.title || "Festive Offer"}
                        width="640"
                        height="360"
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                      />
                   )}
                   <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent flex flex-col justify-end p-5 text-white">
                       <div className="transform translate-y-0.5 group-hover:translate-y-0 transition-all duration-300">
                           {offer.discountPercent > 0 && (
                              <span className="bg-gradient-to-r from-rose-600 to-amber-600 text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md inline-block mb-1.5 shadow-md">
                                 {offer.discountPercent}% Off Deal
                              </span>
                           )}
                           <h3 className="font-black text-lg lg:text-xl leading-tight tracking-tight uppercase text-amber-300 group-hover:text-amber-200 transition-colors select-none drop-shadow-md truncate font-heading" title={offer.title}>
                             {offer.title}
                           </h3>
                           {offer.subTitle && (
                              <p className="text-xs text-slate-200 font-medium mt-0.5 select-none drop-shadow-xs line-clamp-1 opacity-90">
                                {offer.subTitle}
                              </p>
                           )}
                           
                           {offer.couponCode && (
                             <div className="mt-2.5 flex items-center gap-2 border-t border-white/15 pt-2">
                                <span className="text-[9px] text-slate-300 uppercase font-extrabold tracking-wider">Use Code:</span>
                                <span className="bg-white text-slate-900 font-black text-[10px] tracking-widest uppercase px-2.5 py-0.5 rounded-md border border-dashed border-slate-400 shadow-xs">
                                   {offer.couponCode}
                                </span>
                             </div>
                           )}
                       </div>
                   </div>
                </div>
             ))}
          </div>
        </div>
      )}

      <div id="home-categories" className="container mx-auto px-3 pt-5 lg:px-4 lg:pt-8 relative z-10 scroll-mt-24">
        <div className="flex items-center justify-between mb-3 lg:mb-4">
          <div className="flex items-center gap-2.5">
            <h2 className="font-black text-lg sm:text-xl lg:text-2xl text-slate-900 tracking-tight font-heading">
              Shop by Category
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigate("/categories")}
            aria-label="View all categories"
            className="text-xs lg:text-sm font-extrabold text-orange-700 hover:text-orange-800 transition-colors"
          >
            View all <span aria-hidden="true">→</span>
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
          {isCategoryLoading
            ? new Array(4).fill(null).map((_, index) => (
                <div key={index} className="flex flex-col gap-2">
                    <Skeleton className="home-category-image w-full aspect-square rounded-xl border border-slate-200/70 lg:aspect-[2/1]" />
                    <Skeleton className="h-3 w-3/4 rounded-full self-center" />
                </div>
              ))

            : categoryData?.slice(0, 4).map(cat => (
                <div
                  key={cat._id}
                  className="home-category-item group flex min-w-0 flex-col items-center gap-1.5 cursor-pointer transition-all duration-300 active:scale-[0.98]"
                  onClick={() => navigate(`/products?category=${encodeURIComponent(cat._id)}`)}
                >
                  <div className="home-category-image w-full aspect-square bg-orange-50/50 rounded-xl flex items-center justify-center overflow-hidden border border-orange-200/80 group-hover:border-orange-400 group-hover:shadow-md group-hover:shadow-orange-500/10 transition-all duration-300 group-hover:-translate-y-0.5 lg:aspect-[2/1]">
                    <img
                      src={getImageUrl(cat.image, { width: 180, quality: 75 })}
                      srcSet={`${getImageUrl(cat.image, { width: 120, quality: 75 })} 120w, ${getImageUrl(cat.image, { width: 180, quality: 75 })} 180w`}
                      sizes="(max-width: 640px) 25vw, 180px"
                      alt={cat.name}
                      width="180"
                      height="180"
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <p className="w-full min-h-8 px-1 text-center text-[10px] font-bold leading-snug tracking-normal text-slate-950 line-clamp-2 transition-colors group-hover:text-orange-700 sm:text-xs lg:text-sm">
                    {cat.name}
                  </p>
                </div>
              ))}
        </div>
      </div>

      <section id="home-featured" className="container mx-auto px-3 pt-6 pb-16 lg:px-4 lg:pt-8 scroll-mt-24">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 sm:mb-4">
          <h2 className="font-black text-lg sm:text-xl lg:text-2xl text-slate-900 tracking-tight font-heading">
              Featured Products
          </h2>
          <button
            type="button"
            onClick={() => navigate("/products")}
            aria-label="View all featured products"
            className="text-[10px] sm:text-xs lg:text-sm font-extrabold text-orange-700 hover:text-orange-800 transition-colors"
          >
            View all <span aria-hidden="true">→</span>
          </button>
        </div>

        <div className="mb-3 flex w-full items-center gap-2 overflow-x-auto no-scrollbar sm:mb-4">
          {[
            { id: "all", label: "All" },
            { id: "new", label: "New Arrivals" },
            { id: "offers", label: "Offers" }
          ].map(filter => (
            <button
              type="button"
              key={filter.id}
              onClick={() => setActiveProductFilter(filter.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-[10px] sm:text-xs font-extrabold transition-colors ${
                activeProductFilter === filter.id
                  ? "bg-orange-500 text-white shadow-sm shadow-orange-500/20"
                  : "bg-slate-100 text-slate-700 hover:bg-orange-50 hover:text-orange-700"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="home-featured-products grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3.5">
          {loadingHomeFeed && categoryData.length === 0 && new Array(6).fill(null).map((_, index) => (
            <div key={`featured-loading-${index}`} className="aspect-[1/1.3] w-full rounded-2xl bg-slate-100 animate-pulse" />
          ))}
          {filteredProducts.slice(0, 6).map((product, index) => (
            <ProductBox key={product._id} data={product} priority={index < 4} />
          ))}
        </div>
        {!loadingHomeFeed && filteredProducts.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center">
            <p className="text-sm font-semibold text-slate-600">
              {activeProductFilter === "offers" ? "No offers available right now." : "Products will appear here soon."}
            </p>
          </div>
        )}
      </section>
    </section>
  )
}

export default Home
