import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link, useNavigate, useParams, useLocation } from "react-router-dom"
import {
  FaBolt,
  FaBoxOpen,
  FaChevronRight,
  FaCircleCheck,
  FaHeart,
  FaShareNodes,
  FaShieldHalved,
  FaStar,
  FaTruckFast,
  FaXmark
} from "react-icons/fa6"
import { AnimatePresence, motion as framerMotion } from "framer-motion"
import toast from "react-hot-toast"
import SummaryApi from "../common/SummaryApi"
import Axios from "../utils/Axios"
import AxiosToastError from "../utils/AxiosToastError"
import { DisplayPriceInRupees } from "../utils/DisplayPriceInRupees"
import { getDiscountPercent } from "../utils/PriceWithDiscount"
import { getImageUrl } from "../utils/getImageUrl"
import { useGlobalContext } from "../provider/GlobalProvider"
import AddToCartButton from "../components/AddToCartButton"
import CategoryWiseProductDisplay from "../components/CategoryWiseProductDisplay"
import ProductLoading from "../components/ProductLoading"
import ReviewsSection from "../components/ReviewsSection"
import { getCachedProduct, setCachedProduct } from "../utils/productCache"

const detailTabs = ["Description", "Specifications", "Reviews", "FAQs"]
const MotionDiv = framerMotion.div
const MotionImage = framerMotion.img

const ProductDisplay = () => {
  const { product: productUrl } = useParams()
  const productId = productUrl?.split("-").pop()
  const navigate = useNavigate()
  const location = useLocation()
  const { addItemToCart } = useGlobalContext()
  const galleryRef = useRef(null)
  const purchaseRef = useRef(null)

  const initialProduct = location.state?.product || getCachedProduct(productId)

  const [data, setData] = useState(() => initialProduct ? {
    ...initialProduct,
    _original: {
      unit: initialProduct.unit,
      price: initialProduct.price,
      mrp: initialProduct.mrp,
      discount: initialProduct.discount,
      stock: initialProduct.stock
    }
  } : null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(() => !initialProduct)
  const [activeImage, setActiveImage] = useState(0)
  const [activeTab, setActiveTab] = useState("Description")
  const [showStickyBar, setShowStickyBar] = useState(false)
  const [isZoomOpen, setIsZoomOpen] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)

  const images = useMemo(
    () => (Array.isArray(data?.image) ? data.image.filter(Boolean) : []),
    [data?.image]
  )
  const averageRating = reviews.length
    ? reviews.reduce((total, review) => total + Number(review.rating || 0), 0) / reviews.length
    : 0
  const originalPrice = Number(data?.mrp || data?.price || 0)
  const currentPrice = Number(data?.price || 0)
  const details = Object.entries(data?.more_details || {}).filter(([, value]) => value !== "" && value != null)
  const category = Array.isArray(data?.category) ? data.category[0] : data?.category
  const isInStock = Number(data?.stock) > 0
  const discountPercent = getDiscountPercent(data?.mrp, data?.price)
  const hasDiscount = discountPercent > 0

  const slugTitle = useMemo(() => {
    try {
      const parts = (productUrl || "").split("-")
      parts.pop()
      const raw = parts.join(" ")
      return raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : "Celebration Crackers"
    } catch {
      return "Celebration Crackers"
    }
  }, [productUrl])

  const fetchProductDetails = useCallback(async () => {
    if (!productId) return
    try {
      let product = null

      if (window.__TRACLY_PRODUCT_PREFETCH__) {
        try {
          const prefetchData = await window.__TRACLY_PRODUCT_PREFETCH__
          window.__TRACLY_PRODUCT_PREFETCH__ = null
          if (prefetchData?.success && prefetchData?.data) {
            product = prefetchData.data
          }
        } catch {
          window.__TRACLY_PRODUCT_PREFETCH__ = null
        }
      }

      if (!product) {
        const response = await Axios({
          ...SummaryApi.getProductDetails,
          data: { productId }
        })
        if (response.data?.success && response.data?.data) {
          product = response.data.data
        }
      }

      if (product) {
        setCachedProduct(productId, product)
        setData({
          ...product,
          _original: {
            unit: product.unit,
            price: product.price,
            mrp: product.mrp,
            discount: product.discount,
            stock: product.stock
          }
        })
      }
    } catch (error) {
      if (!getCachedProduct(productId)) {
        AxiosToastError(error)
      }
    } finally {
      setLoading(false)
    }
  }, [productId])

  const fetchReviews = useCallback(async () => {
    if (!productId) return
    try {
      const response = await Axios(SummaryApi.review_get(productId))
      if (response.data.success) setReviews(response.data.data || [])
    } catch {
    }
  }, [productId])

  useEffect(() => {
    window.scrollTo(0, 0)
    setActiveTab("Description")
    setActiveImage(0)
    const cached = location.state?.product || getCachedProduct(productId)
    if (cached) {
      setData({
        ...cached,
        _original: {
          unit: cached.unit,
          price: cached.price,
          mrp: cached.mrp,
          discount: cached.discount,
          stock: cached.stock
        }
      })
      setLoading(false)
    } else {
      setLoading(true)
    }
    fetchProductDetails()

    const timer = setTimeout(() => {
      fetchReviews()
    }, 1500)
    return () => clearTimeout(timer)
  }, [productId, fetchProductDetails, fetchReviews])

  useEffect(() => {
    const purchaseElement = purchaseRef.current
    if (!purchaseElement || !("IntersectionObserver" in window)) return undefined
    const observer = new IntersectionObserver(([entry]) => {
      setShowStickyBar(!entry.isIntersecting)
    }, { threshold: 0 })
    observer.observe(purchaseElement)
    return () => observer.disconnect()
  }, [loading, Boolean(data)])

  useEffect(() => {
    const onKeyDown = event => {
      if (event.key === "Escape") setIsZoomOpen(false)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  const selectImage = (index) => {
    setActiveImage(index)
    if (galleryRef.current) {
      galleryRef.current.scrollTo({
        left: index * galleryRef.current.clientWidth,
        behavior: "smooth"
      })
    }
  }

  const selectVariant = (variant) => {
    setData(current => ({ ...current, ...variant }))
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success("Product link copied")
    } catch (error) {
      AxiosToastError(error)
    }
  }

  const handleBuyNow = async () => {
    if (!isInStock) return
    const result = await addItemToCart(data)
    if (result?.success) {
      navigate("/checkout")
    }
  }

  const handleGalleryScroll = () => {
    const gallery = galleryRef.current
    if (!gallery) return
    setActiveImage(Math.round(gallery.scrollLeft / gallery.clientWidth))
  }

  if (loading || !data) {
    return (
      <section className="min-h-screen bg-white pb-24 text-slate-900 lg:pb-10">
        <div className="mx-auto max-w-[1440px] px-3 py-4 sm:px-5 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 overflow-hidden whitespace-nowrap text-xs font-semibold text-slate-500">
            <Link to="/" className="shrink-0 hover:text-orange-600">Home</Link>
            <FaChevronRight className="h-2.5 w-2.5 shrink-0 text-slate-300" />
            <Link to="/products" className="shrink-0 hover:text-orange-600">Crackers</Link>
            <FaChevronRight className="h-2.5 w-2.5 shrink-0 text-slate-300" />
            <span className="truncate text-slate-900">{slugTitle}</span>
          </nav>

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)_minmax(260px,.78fr)] lg:gap-7">
            <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-[72px_minmax(0,1fr)] lg:gap-3">
              <div className="order-2 flex gap-2 overflow-x-auto pb-1 no-scrollbar sm:order-1 sm:max-h-[470px] sm:flex-col sm:overflow-y-auto sm:overflow-x-hidden">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-[62px] w-[62px] shrink-0 rounded-xl border border-slate-200 bg-slate-100 p-1 sm:h-[72px] sm:w-[72px]" />
                ))}
              </div>
              <div className="order-1 relative min-w-0 overflow-hidden rounded-2xl border border-orange-200 bg-orange-50/30 sm:order-2">
                <div className="flex aspect-square sm:aspect-[1/1.04] sm:max-h-[500px] items-center justify-center">
                  <div className="h-12 w-12 rounded-full bg-orange-200/50 animate-pulse" />
                </div>
              </div>
            </div>

            <div className="min-w-0">
              <span className="mb-2 inline-flex rounded-full bg-orange-500 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white">
                Special Offer
              </span>
              <h1 className="font-heading text-2xl font-black leading-tight tracking-tight text-slate-950 sm:text-3xl">
                {slugTitle}
              </h1>
              <div className="mt-3 flex items-center gap-2">
                <div className="h-4 w-28 rounded bg-slate-100" />
              </div>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-8 w-24 rounded bg-slate-200" />
              </div>
              <div className="mt-5 space-y-2">
                <div className="h-3.5 w-full rounded bg-slate-100" />
                <div className="h-3.5 w-4/5 rounded bg-slate-100" />
              </div>
              <div className="mt-6">
                <div className="h-11 w-full max-w-[280px] rounded-xl bg-orange-500" />
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
                <div className="h-6 w-32 rounded bg-slate-200 mb-4" />
                <div className="h-4 w-full rounded bg-slate-100 mb-2" />
                <div className="h-4 w-3/4 rounded bg-slate-100 mb-6" />
                <div className="h-11 w-full rounded-xl bg-orange-600" />
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="min-h-screen bg-white pb-24 text-slate-900 lg:pb-10">
      <div className="mx-auto max-w-[1440px] px-3 py-4 sm:px-5 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 overflow-hidden whitespace-nowrap text-xs font-semibold text-slate-500">
          <Link to="/" className="shrink-0 hover:text-orange-600">Home</Link>
          <FaChevronRight className="h-2.5 w-2.5 shrink-0 text-slate-300" />
          {category?.name && (
            <>
              <Link to={`/products?category=${encodeURIComponent(category._id)}`} className="max-w-32 truncate hover:text-orange-600">
                {category.name}
              </Link>
              <FaChevronRight className="h-2.5 w-2.5 shrink-0 text-slate-300" />
            </>
          )}
          <span className="truncate text-slate-900">{data.name}</span>
        </nav>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)_minmax(260px,.78fr)] lg:gap-7">
          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-[72px_minmax(0,1fr)] lg:gap-3">
            <div className="order-2 flex gap-2 overflow-x-auto pb-1 no-scrollbar sm:order-1 sm:max-h-[470px] sm:flex-col sm:overflow-y-auto sm:overflow-x-hidden">
              {images.map((image, index) => (
                <button
                  type="button"
                  key={`${image}-${index}`}
                  onClick={() => selectImage(index)}
                  aria-label={`Show product image ${index + 1}`}
                  aria-pressed={activeImage === index}
                  className={`h-[62px] w-[62px] shrink-0 overflow-hidden rounded-xl border-2 bg-white p-1 transition sm:h-[72px] sm:w-[72px] ${activeImage === index ? "border-orange-500" : "border-slate-200 hover:border-orange-200"}`}
                >
                  <img
                    src={getImageUrl(image, { width: 120, quality: 75 })}
                    alt={`Thumbnail ${index + 1}`}
                    width="72"
                    height="72"
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-contain"
                  />
                </button>
              ))}
            </div>

            <div className="order-1 relative min-w-0 overflow-hidden rounded-2xl border border-orange-200 bg-orange-50/30 sm:order-2">
              <div
                ref={galleryRef}
                onScroll={handleGalleryScroll}
                className="flex aspect-square snap-x snap-mandatory overflow-x-auto no-scrollbar sm:aspect-[1/1.04] sm:max-h-[500px]"
              >
                {images.length ? images.map((image, index) => (
                  <button
                    key={`${image}-large-${index}`}
                    type="button"
                    onClick={() => {
                      setActiveImage(index)
                      setIsZoomOpen(true)
                    }}
                    className="flex h-full w-full min-w-full snap-center items-center justify-center p-4 sm:p-8"
                    aria-label={`Zoom ${data.name}, image ${index + 1}`}
                  >
                    <img
                      src={getImageUrl(image, { width: 480, quality: 70 })}
                      srcSet={[360, 480, 640].map(w => `${getImageUrl(image, { width: w, quality: 70 })} ${w}w`).join(', ')}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 500px"
                      alt={`${data.name} ${index + 1}`}
                      width="500"
                      height="500"
                      loading={index === 0 ? "eager" : "lazy"}
                      fetchPriority={index === 0 ? "high" : "auto"}
                      decoding="async"
                      className="h-full w-full object-contain"
                    />
                  </button>
                )) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">No product image</div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsFavorite(value => !value)}
                aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:text-rose-500"
              >
                <FaHeart className={isFavorite ? "text-rose-500" : ""} />
              </button>
              <button
                type="button"
                onClick={handleShare}
                aria-label="Share product"
                className="absolute bottom-3 right-3 flex items-center gap-2 rounded-full bg-slate-900/75 px-3 py-2 text-xs font-bold text-white backdrop-blur transition hover:bg-slate-900"
              >
                <FaShareNodes /> Share
              </button>
              {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5 sm:hidden">
                  {images.map((_, index) => (
                    <span key={index} className={`h-1.5 rounded-full transition-all ${activeImage === index ? "w-5 bg-orange-500" : "w-1.5 bg-slate-300"}`} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="min-w-0">
            <span className="mb-2 inline-flex rounded-full bg-orange-500 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white">
              {hasDiscount ? "Special Offer" : "Featured Product"}
            </span>
            <h1 className="font-heading text-2xl font-black leading-tight tracking-tight text-slate-950 sm:text-3xl">
              {data.name}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <div className="flex items-center gap-0.5 text-orange-500" aria-label={`${averageRating.toFixed(1)} out of 5 stars`}>
                {[1, 2, 3, 4, 5].map(star => (
                  <FaStar key={star} className={star <= Math.round(averageRating) ? "" : "text-slate-200"} />
                ))}
              </div>
              <span className="font-semibold text-slate-700">
                {averageRating ? averageRating.toFixed(1) : "New"}
                {reviews.length > 0 && ` (${reviews.length} reviews)`}
              </span>
              {reviews.length > 0 && (
                <button type="button" onClick={() => setActiveTab("Reviews")} className="font-bold text-orange-600 hover:text-orange-700">
                  Read reviews
                </button>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <p className="font-heading text-3xl font-black tracking-tight text-slate-950">
                {DisplayPriceInRupees(currentPrice)}
              </p>
              {hasDiscount && (
                <>
                  <p className="text-sm font-semibold text-slate-400 line-through">{DisplayPriceInRupees(originalPrice)}</p>
                  <span className="rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-black text-white">{discountPercent}% OFF</span>
                </>
              )}
            </div>

            {data.description && (
              <p className="mt-4 line-clamp-4 text-sm leading-6 text-slate-600">{data.description}</p>
            )}

            {details.length > 0 && (
              <div className="mt-5 grid grid-cols-2 gap-2.5">
                {details.slice(0, 4).map(([label, value], index) => {
                  const icons = [FaBolt, FaBoxOpen, FaCircleCheck, FaShieldHalved]
                  const FeatureIcon = icons[index % icons.length]
                  return (
                    <div key={label} className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-600">
                        <FeatureIcon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-extrabold text-slate-800">{label}</p>
                        <p className="line-clamp-2 text-[10px] leading-4 text-slate-500">{String(value)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {Array.isArray(data.variants) && data.variants.length > 0 && (
              <div className="mt-5">
                <p className="mb-2 text-xs font-extrabold text-slate-800">Pack size</p>
                <div className="flex flex-wrap gap-2">
                  {[data._original, ...data.variants].filter((variant, index, variants) =>
                    variant?.unit && variants.findIndex(item => item?.unit === variant.unit) === index
                  ).map(variant => (
                    <button
                      type="button"
                      key={variant.unit}
                      onClick={() => selectVariant(variant)}
                      className={`rounded-xl border px-3 py-2 text-left transition ${data.unit === variant.unit ? "border-orange-500 bg-orange-50 text-orange-700" : "border-slate-200 bg-white text-slate-700 hover:border-orange-300"}`}
                    >
                      <span className="block text-xs font-extrabold">{variant.unit}</span>
                      <span className="mt-0.5 block text-[10px] font-bold">{DisplayPriceInRupees(variant.price)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {data.unit && <p className="mt-3 text-xs font-semibold text-slate-500">Selected pack: {data.unit}</p>}
          </div>

          <aside ref={purchaseRef} className="rounded-2xl border border-orange-200 bg-white p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-baseline gap-2">
              <span className="font-heading text-3xl font-black text-slate-950">{DisplayPriceInRupees(currentPrice)}</span>
              {hasDiscount && <span className="text-sm font-semibold text-slate-400 line-through">{DisplayPriceInRupees(originalPrice)}</span>}
              {hasDiscount && <span className="ml-auto rounded-full bg-emerald-500 px-2 py-1 text-[10px] font-black text-white">{discountPercent}% OFF</span>}
            </div>
            <div className="space-y-2.5">
              {isInStock ? (
                <>
                  <AddToCartButton data={data} variant="orange-full" />
                  <button
                    type="button"
                    onClick={handleBuyNow}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-orange-500 bg-white text-sm font-extrabold text-slate-900 transition hover:bg-orange-50"
                  >
                    <FaBolt className="text-orange-600" /> Buy Now
                  </button>
                </>
              ) : (
                <button disabled className="h-11 w-full rounded-xl bg-slate-100 text-sm font-extrabold text-slate-400">Out of Stock</button>
              )}
            </div>

            <div className="mt-5 space-y-4 border-t border-slate-100 pt-4">
              <div className="flex items-center gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-full ${isInStock ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                  <FaCircleCheck />
                </span>
                <div>
                  <p className="text-sm font-extrabold text-slate-900">{isInStock ? "In Stock" : "Out of Stock"}</p>
                  <p className="text-xs text-slate-500">{isInStock ? "Ready to ship" : "Currently unavailable"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 text-orange-600"><FaTruckFast /></span>
                <div>
                  <p className="text-sm font-extrabold text-slate-900">Free Delivery</p>
                  <p className="text-xs text-slate-500">Delivery options at checkout</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 text-orange-600"><FaShieldHalved /></span>
                <div>
                  <Link to="/safety-tips" className="text-sm font-extrabold text-slate-900 hover:text-orange-600">Fireworks Safety</Link>
                  <p className="text-xs text-slate-500">Read handling and use guidelines</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 text-orange-600"><FaShieldHalved /></span>
                <div>
                  <p className="text-sm font-extrabold text-slate-900">Secure Payment</p>
                  <p className="text-xs text-slate-500">Secure checkout</p>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <section className="mt-8 border-t border-slate-200 pt-3">
          <div role="tablist" aria-label="Product details" className="flex gap-5 overflow-x-auto border-b border-slate-200 no-scrollbar sm:gap-8">
            {detailTabs.map(tab => (
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`shrink-0 border-b-2 px-1 py-3 text-xs font-extrabold transition sm:text-sm ${activeTab === tab ? "border-orange-500 text-orange-600" : "border-transparent text-slate-600 hover:text-slate-900"}`}
              >
                {tab}{tab === "Reviews" && reviews.length > 0 ? ` (${reviews.length})` : ""}
              </button>
            ))}
          </div>
          <div className="min-h-36 py-5">
            {activeTab === "Description" && (
              <p className="max-w-4xl whitespace-pre-line text-sm leading-6 text-slate-600">
                {data.description || "Product details will be added soon."}
              </p>
            )}
            {activeTab === "Specifications" && (
              details.length ? (
                <dl className="grid max-w-4xl gap-x-10 sm:grid-cols-2">
                  {details.map(([label, value]) => (
                    <div key={label} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4 border-b border-slate-100 py-3 text-sm">
                      <dt className="font-bold text-slate-500">{label}</dt>
                      <dd className="break-words font-semibold text-slate-800">{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              ) : <p className="text-sm text-slate-500">No specifications are available.</p>
            )}
            {activeTab === "Reviews" && (
              <ReviewsSection
                productId={productId}
                reviews={reviews}
                setReviews={setReviews}
                fetchReviews={fetchReviews}
              />
            )}
            {activeTab === "FAQs" && (
              <div className="max-w-4xl divide-y divide-slate-100">
                {[
                  ["How do I place an order?", "Add the product to your cart and continue to checkout to complete your order."],
                  ["When will my order arrive?", "Available delivery information is shown during checkout for your address."],
                  ["How can I get help with this product?", "Contact our support team from the Contact page and include the product name."]
                ].map(([question, answer]) => (
                  <details key={question} className="group py-4">
                    <summary className="cursor-pointer list-none text-sm font-extrabold text-slate-800 marker:hidden">{question}</summary>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{answer}</p>
                  </details>
                ))}
              </div>
            )}
          </div>
        </section>

        {data.relatedProducts?.length > 0 || category?._id ? (
          <div className="mt-6" style={{ contentVisibility: 'auto', containIntrinsicSize: '360px' }}>
            <CategoryWiseProductDisplay
              id={category?._id}
              name="Related Products"
              manualData={data.relatedProducts}
            />
          </div>
        ) : null}

      </div>

      <AnimatePresence>
        {showStickyBar && (
          <MotionDiv
            initial={{ y: 90 }}
            animate={{ y: 0 }}
            exit={{ y: 90 }}
            className="fixed inset-x-0 bottom-16 z-40 flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 shadow-[0_-8px_24px_rgba(15,23,42,.08)] lg:hidden"
          >
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-slate-600">{data.name}</p>
              <p className="font-heading text-lg font-black">{DisplayPriceInRupees(currentPrice)}</p>
            </div>
            <div className="w-40 shrink-0">
              {isInStock ? <AddToCartButton data={data} variant="orange-full" /> : <span className="text-xs font-bold text-rose-600">Out of stock</span>}
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isZoomOpen && images[activeImage] && (
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsZoomOpen(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 p-4"
          >
            <button
              type="button"
              onClick={() => setIsZoomOpen(false)}
              aria-label="Close image viewer"
              className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-900"
            >
              <FaXmark />
            </button>
            <MotionImage
              initial={{ scale: 0.96 }}
              animate={{ scale: 1 }}
              src={getImageUrl(images[activeImage], { width: 1200, quality: 85 })}
              alt={data.name}
              onClick={event => event.stopPropagation()}
              className="max-h-[88vh] max-w-[90vw] object-contain"
            />
          </MotionDiv>
        )}
      </AnimatePresence>
    </section>
  )
}

export default ProductDisplay
