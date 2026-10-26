import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useSelector } from "react-redux"
import {
  FaCheck,
  FaChevronRight,
  FaCircleCheck,
  FaGift,
  FaShieldHalved,
  FaTrashCan,
  FaTruckFast
} from "react-icons/fa6"
import { IoClose } from "react-icons/io5"
import { useGlobalContext } from "../provider/GlobalProvider"
import AddToCartButton from "../components/AddToCartButton"
import ProductBox from "../components/ProductBox"
import ProductLoading from "../components/ProductLoading"
import Axios from "../utils/Axios"
import SummaryApi from "../common/SummaryApi"
import AxiosToastError from "../utils/AxiosToastError"
import { DisplayPriceInRupees } from "../utils/DisplayPriceInRupees"
import { getImageUrl } from "../utils/getImageUrl"
import { getDiscountPercent } from "../utils/PriceWithDiscount"
import { valideURLConvert } from "../utils/valideURLConvert"
import imageEmpty from "../assets/empty_cart.avif"
import toast from "react-hot-toast"

const FREE_DELIVERY_THRESHOLD = 199

const CartMobile = () => {
  const navigate = useNavigate()
  const cartItems = useSelector(state => state.cartItem.cart || [])
  const user = useSelector(state => state.user)
  const {
    totalQty,
    totalPrice,
    notDiscountTotalPrice,
    deliveryCharge,
    handlingCharge,
    couponDiscount,
    appliedCoupon,
    setAppliedCoupon,
    deleteCartItem,
    fetchCartItem
  } = useGlobalContext()

  const [selectedIds, setSelectedIds] = useState([])
  const [couponCode, setCouponCode] = useState("")
  const [availableCoupons, setAvailableCoupons] = useState([])
  const [allRecommended, setAllRecommended] = useState([])
  const [loadingRecommendations, setLoadingRecommendations] = useState(false)
  const [loadingCoupon, setLoadingCoupon] = useState(false)
  const [removingSelected, setRemovingSelected] = useState(false)
  const [showDeliveryBanner, setShowDeliveryBanner] = useState(true)

  const validItems = useMemo(
    () => cartItems.filter(item => item?.productId),
    [cartItems]
  )
  const selectedCount = validItems.filter(item => selectedIds.includes(item._id)).length
  const allSelected = validItems.length > 0 && selectedCount === validItems.length
  const amountToFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - totalPrice)
  const deliveryProgress = Math.min(100, (totalPrice / FREE_DELIVERY_THRESHOLD) * 100)
  const grandTotal = totalPrice + deliveryCharge + handlingCharge - couponDiscount

  useEffect(() => {
    setSelectedIds(previous => {
      const currentIds = validItems.map(item => item._id)
      const previousIds = new Set(previous)
      const nextIds = currentIds.filter(id => previousIds.has(id))
      const knownIds = new Set(previous)
      currentIds.forEach(id => {
        if (!knownIds.has(id)) nextIds.push(id)
      })
      return nextIds
    })
  }, [validItems])

  const fetchRecommendations = useCallback(async () => {
    try {
      setLoadingRecommendations(true)
      const response = await Axios({
        ...SummaryApi.searchProduct,
        data: { page: 1, limit: 12, sort: "featured" }
      })
      if (response.data?.success && Array.isArray(response.data?.data)) {
        setAllRecommended(response.data.data)
      }
    } catch (error) {
      // Quiet fail so cart experience is never affected
    } finally {
      setLoadingRecommendations(false)
    }
  }, [])

  useEffect(() => {
    fetchRecommendations()
  }, [fetchRecommendations])

  const recommendations = useMemo(() => {
    const cartProductIds = new Set(validItems.map(item => item.productId?._id))
    return allRecommended.filter(product => !cartProductIds.has(product._id)).slice(0, 8)
  }, [allRecommended, validItems])

  useEffect(() => {
    let active = true
    const fetchCoupons = async () => {
      try {
        const response = await Axios(SummaryApi.coupon_list)
        if (!response.data.success) {
          throw new Error(response.data.message || "Could not load coupons")
        }
        const usedCoupons = user?.usedCoupons || []
        const coupons = (response.data.coupons || []).filter(coupon =>
          coupon.isActive && !coupon.isExpired && !usedCoupons.includes(coupon.code)
        )
        if (active) setAvailableCoupons(coupons)
      } catch (error) {
        if (active) AxiosToastError(error)
      }
    }
    fetchCoupons()
    return () => {
      active = false
    }
  }, [user?.usedCoupons])

  const getItemPricing = (item) => {
    const product = item.productId
    const variant = product?.variants?.find(option => option.unit === item.unit)
    const price = Number(variant?.price ?? product?.price ?? 0)
    const mrp = Number(variant?.mrp ?? product?.mrp ?? price)
    const discount = getDiscountPercent(mrp, price)
    const stock = Number(variant?.stock ?? product?.stock ?? 0)
    return { price, mrp, discount, stock, unit: item.unit || product?.unit || "" }
  }

  const toggleItem = (id) => {
    setSelectedIds(previous => previous.includes(id)
      ? previous.filter(selectedId => selectedId !== id)
      : [...previous, id]
    )
  }

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? [] : validItems.map(item => item._id))
  }

  const removeSelected = async () => {
    const itemsToRemove = validItems.filter(item => selectedIds.includes(item._id))
    if (!itemsToRemove.length) return
    try {
      setRemovingSelected(true)
      for (const item of itemsToRemove) {
        const response = await Axios({
          ...SummaryApi.deleteCartItem,
          data: { _id: item._id }
        })
        if (!response.data.success) {
          throw new Error(response.data.message || `Could not remove ${item.productId?.name}`)
        }
      }
      await fetchCartItem()
      toast.success("Selected items removed")
    } catch (error) {
      AxiosToastError(error)
      await fetchCartItem()
    } finally {
      setRemovingSelected(false)
    }
  }

  const applyCoupon = async (code = couponCode) => {
    const normalizedCode = code.trim().toUpperCase()
    if (!normalizedCode) {
      toast.error("Enter a coupon code")
      return
    }
    try {
      setLoadingCoupon(true)
      const response = await Axios({
        ...SummaryApi.coupon_apply,
        data: { code: normalizedCode, totalAmount: totalPrice }
      })
      if (!response.data.success) {
        throw new Error(response.data.message || "This coupon could not be applied")
      }
      setAppliedCoupon(response.data.coupon)
      setCouponCode("")
      toast.success("Coupon applied successfully")
    } catch (error) {
      AxiosToastError(error)
    } finally {
      setLoadingCoupon(false)
    }
  }

  const proceedToCheckout = () => {
    if (!validItems.length) return
    if (!user?._id) {
      toast("Please sign in to continue to checkout")
      navigate("/login")
      return
    }
    navigate("/checkout")
  }

  const continueShopping = () => navigate("/products")

  return (
    <section className="min-h-screen bg-[#fffdfb] text-slate-900">
      <div className="mx-auto max-w-[1440px] px-3 py-5 sm:px-5 lg:px-8 lg:py-7">
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link to="/" className="hover:text-orange-600">Home</Link>
          <FaChevronRight className="h-2.5 w-2.5 text-slate-300" />
          <span className="text-slate-900">Cart</span>
        </nav>

        <div className="mb-5 grid items-center gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(360px,.9fr)]">
          <div>
            <h1 className="font-heading text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Your Cart <span className="text-orange-600">({totalQty} items)</span>
            </h1>
            <p className="mt-1 text-sm text-slate-500">Review your items and proceed to checkout.</p>
          </div>
          {showDeliveryBanner && validItems.length > 0 && (
            <div className="relative rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 pr-10">
              <button
                type="button"
                onClick={() => setShowDeliveryBanner(false)}
                aria-label="Dismiss delivery message"
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-700"
              >
                <IoClose size={18} />
              </button>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <FaTruckFast className="text-xl" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-extrabold text-emerald-800">
                    {amountToFreeDelivery ? `Add ${DisplayPriceInRupees(amountToFreeDelivery)} for free delivery` : "You qualify for free delivery"}
                  </p>
                  <div className="mt-1.5 flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-emerald-100">
                      <div className="h-full rounded-full bg-orange-500 transition-all" style={{ width: `${deliveryProgress}%` }} />
                    </div>
                    <span className="shrink-0 text-[10px] font-bold text-slate-600">
                      {DisplayPriceInRupees(totalPrice)} / {DisplayPriceInRupees(FREE_DELIVERY_THRESHOLD)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {validItems.length === 0 ? (
          <div className="flex min-h-[48vh] flex-col items-center justify-center rounded-2xl border border-orange-100 bg-white px-5 text-center">
            <img src={imageEmpty} alt="" className="mb-4 w-48 max-w-full opacity-90" />
            <h2 className="font-heading text-2xl font-black text-slate-900">Your cart is empty</h2>
            <p className="mt-2 text-sm text-slate-500">Add a few products and they will appear here.</p>
            <button type="button" onClick={continueShopping} className="mt-5 rounded-xl bg-orange-500 px-7 py-3 text-sm font-extrabold text-white hover:bg-orange-600">
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_322px] xl:gap-6">
            <div className="min-w-0 space-y-3">
              {validItems.map(item => {
                const product = item.productId
                const pricing = getItemPricing(item)
                const itemPrice = pricing.price
                const image = getImageUrl(product.image)
                const productUrl = `/product/${valideURLConvert(product.name)}-${product._id}`
                return (
                  <article key={`${item._id}-${item.unit || ""}`} className="grid grid-cols-[22px_72px_minmax(0,1fr)] gap-x-2 gap-y-2 rounded-xl border border-orange-100 bg-white p-3 sm:grid-cols-[28px_88px_minmax(0,1fr)_116px_90px_24px] sm:items-center sm:gap-3 sm:p-3.5">
                    <label className="row-span-1 flex items-center justify-start sm:justify-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item._id)}
                        onChange={() => toggleItem(item._id)}
                        aria-label={`Select ${product.name}`}
                        className="h-4 w-4 accent-orange-500"
                      />
                    </label>
                    <Link to={productUrl} className="flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-xl bg-orange-50/50 p-1.5 sm:h-[84px] sm:w-[88px] sm:p-2">
                      <img src={image} alt={product.name} className="h-full w-full object-contain" />
                    </Link>
                    <div className="min-w-0">
                      <Link to={productUrl} className="line-clamp-1 text-sm font-extrabold text-slate-900 hover:text-orange-600">
                        {product.name}
                      </Link>
                      <p className="mt-1 line-clamp-1 text-xs text-slate-500">{product.description || "Quality product from Trace"}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {pricing.unit && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">{pricing.unit}</span>}
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${pricing.stock > 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                          {pricing.stock > 0 ? "In Stock" : "Out of Stock"}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="font-heading text-base font-black">{DisplayPriceInRupees(itemPrice)}</span>
                        {pricing.discount > 0 && (
                          <>
                            <span className="text-xs font-semibold text-slate-400 line-through">{DisplayPriceInRupees(pricing.mrp)}</span>
                            <span className="rounded-md bg-emerald-500 px-2 py-0.5 text-[9px] font-black text-white">{pricing.discount}% OFF</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="col-start-2 row-start-2 w-24 sm:col-auto sm:row-auto sm:w-28">
                      <AddToCartButton
                        data={{
                          ...product,
                          unit: item.unit || product.unit,
                          price: product.price,
                          stock: product.stock
                        }}
                        variant="home-outline"
                      />
                    </div>
                    <p className="col-start-3 row-start-2 text-right font-heading text-sm font-black text-slate-900 sm:col-auto sm:row-auto">
                      {DisplayPriceInRupees(itemPrice * Number(item.quantity || 1))}
                    </p>
                    <button
                      type="button"
                      onClick={() => deleteCartItem(item._id)}
                      aria-label={`Remove ${product.name}`}
                      className="col-start-1 row-start-2 flex h-8 w-8 items-center justify-center rounded-lg text-orange-600 transition hover:bg-orange-50 hover:text-red-600 sm:col-auto sm:row-auto"
                    >
                      <FaTrashCan />
                    </button>
                  </article>
                )
              })}

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-orange-100 bg-white px-4 py-3">
                <label className="flex cursor-pointer items-center gap-2 text-xs font-extrabold text-slate-800">
                  <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="h-4 w-4 accent-orange-500" />
                  Select All <span className="font-semibold text-slate-500">({validItems.length} items)</span>
                </label>
                <button
                  type="button"
                  disabled={!selectedCount || removingSelected}
                  onClick={removeSelected}
                  className="flex items-center gap-2 text-xs font-extrabold text-orange-600 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <FaTrashCan /> {removingSelected ? "Removing..." : `Remove Selected${selectedCount ? ` (${selectedCount})` : ""}`}
                </button>
              </div>

              <section className="mt-4 rounded-xl border border-orange-100 bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-heading text-base font-black text-slate-900">You Might Also Like</h2>
                  <Link to="/products" className="text-xs font-extrabold text-orange-600 hover:text-orange-700">View All →</Link>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                  {loadingRecommendations && new Array(4).fill(null).map((_, index) => (
                    <div key={`recommend-loading-${index}`} className="w-40 shrink-0">
                      <ProductLoading />
                    </div>
                  ))}
                  {!loadingRecommendations && recommendations.map(product => (
                    <ProductBox key={product._id} data={product} />
                  ))}
                  {!loadingRecommendations && recommendations.length === 0 && (
                    <p className="py-6 text-sm text-slate-500">No recommendations available right now.</p>
                  )}
                </div>
              </section>
            </div>

            <aside className="space-y-3 lg:sticky lg:top-24">
              <section className="rounded-xl border border-orange-100 bg-white p-4">
                <h2 className="mb-3 font-heading text-lg font-black text-slate-900">Order Summary</h2>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between gap-3 text-slate-600">
                    <span>Subtotal ({totalQty} items)</span>
                    <span className="font-bold text-slate-800">{DisplayPriceInRupees(notDiscountTotalPrice)}</span>
                  </div>
                  {notDiscountTotalPrice > totalPrice && (
                    <div className="flex justify-between gap-3 text-slate-600">
                      <span>Discount</span>
                      <span className="font-bold text-emerald-600">- {DisplayPriceInRupees(notDiscountTotalPrice - totalPrice)}</span>
                    </div>
                  )}
                  <div className="flex justify-between gap-3 text-slate-600">
                    <span>Delivery Charge</span>
                    <span className={`font-bold ${deliveryCharge === 0 ? "text-emerald-600" : "text-slate-800"}`}>
                      {deliveryCharge === 0 ? "FREE" : DisplayPriceInRupees(deliveryCharge)}
                    </span>
                  </div>
                  {handlingCharge > 0 && (
                    <div className="flex justify-between gap-3 text-slate-600">
                      <span>Handling Charge</span>
                      <span className="font-bold text-slate-800">{DisplayPriceInRupees(handlingCharge)}</span>
                    </div>
                  )}
                  {couponDiscount > 0 && (
                    <div className="flex items-center justify-between gap-2 rounded-lg bg-orange-50 px-2.5 py-2 text-orange-700">
                      <span className="flex items-center gap-1.5"><FaGift /> Coupon {appliedCoupon?.code}</span>
                      <span className="flex items-center gap-2 font-bold">
                        - {DisplayPriceInRupees(couponDiscount)}
                        <button type="button" aria-label="Remove coupon" onClick={() => setAppliedCoupon(null)}><IoClose /></button>
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                    <span className="text-sm font-black text-slate-900">Total</span>
                    <span className="font-heading text-2xl font-black text-orange-600">{DisplayPriceInRupees(grandTotal)}</span>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-orange-100 bg-white p-4">
                <h2 className="mb-3 font-heading text-sm font-black text-slate-900">Apply Coupon Code</h2>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between gap-2 rounded-lg bg-emerald-50 p-3 text-emerald-700">
                    <div className="flex items-center gap-2">
                      <FaCircleCheck />
                      <div>
                        <p className="text-xs font-extrabold">{appliedCoupon.code} applied</p>
                        <p className="text-[10px]">You saved {DisplayPriceInRupees(couponDiscount)}.</p>
                      </div>
                    </div>
                    <button type="button" aria-label="Remove coupon" onClick={() => setAppliedCoupon(null)} className="text-slate-500"><IoClose /></button>
                  </div>
                ) : (
                  <form
                    onSubmit={event => {
                      event.preventDefault()
                      applyCoupon()
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      value={couponCode}
                      onChange={event => setCouponCode(event.target.value.toUpperCase())}
                      placeholder="Enter coupon code"
                      className="h-10 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-orange-400"
                    />
                    <button type="submit" disabled={loadingCoupon} className="rounded-lg bg-orange-500 px-4 text-xs font-extrabold text-white hover:bg-orange-600 disabled:opacity-50">
                      {loadingCoupon ? "..." : "Apply"}
                    </button>
                  </form>
                )}
                {!appliedCoupon && availableCoupons.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {availableCoupons.slice(0, 3).map(coupon => (
                      <button key={coupon._id} type="button" onClick={() => applyCoupon(coupon.code)} className="rounded-full border border-dashed border-orange-300 px-2.5 py-1 text-[10px] font-bold text-orange-700 hover:bg-orange-50">
                        {coupon.code} · {coupon.discountPercent}% off
                      </button>
                    ))}
                  </div>
                )}
              </section>

              <div className="space-y-2 rounded-xl border border-orange-100 bg-white p-3">
                <button
                  type="button"
                  onClick={proceedToCheckout}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-sm font-extrabold text-white transition hover:from-orange-600 hover:to-orange-700"
                >
                  <FaShieldHalved /> Proceed to Checkout <FaChevronRight />
                </button>
                <button
                  type="button"
                  onClick={continueShopping}
                  className="h-10 w-full rounded-lg border border-orange-500 text-xs font-extrabold text-slate-800 transition hover:bg-orange-50"
                >
                  Continue Shopping
                </button>
              </div>

              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-orange-100 bg-orange-100">
                {[
                  ["Secure Payment", "Safe & secure"],
                  ["Fireworks Safety", "Read our handling guide"],
                  ["Free Delivery", `On orders above ${DisplayPriceInRupees(FREE_DELIVERY_THRESHOLD)}`],
                  ["Customer Support", "Help with your order"]
                ].map(([title, subtitle]) => (
                  <div key={title} className="flex min-h-16 items-center gap-2 bg-white p-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-600">
                      {title === "Secure Payment" ? <FaShieldHalved /> : null}
                      {title === "Fireworks Safety" ? <FaShieldHalved /> : null}
                      {title === "Free Delivery" ? <FaTruckFast /> : null}
                      {title === "Customer Support" ? <FaCheck /> : null}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[10px] font-extrabold text-slate-900">{title}</p>
                      <p className="text-[9px] leading-3 text-slate-500">{subtitle}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link to='/safety-tips' className='mt-2 block text-center text-xs font-bold text-orange-700 hover:text-orange-800'>
                View fireworks safety guidelines
              </Link>
            </aside>
          </div>
        )}
      </div>
    </section>
  )
}

export default CartMobile
