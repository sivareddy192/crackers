import React, { useState, useEffect } from 'react'
import { useGlobalContext } from '../provider/GlobalProvider'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import { getDiscountPercent } from '../utils/PriceWithDiscount'
import AddAddress from '../components/AddAddress'
import EditAddress from '../components/EditAddress'
import { useSelector } from 'react-redux'
import AxiosToastError from '../utils/AxiosToastError'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import {
  Truck,
  ShieldCheck,
  Headphones,
  CreditCard,
  Banknote,
  Smartphone,
  Pencil,
  Plus,
  ArrowRight
} from 'lucide-react'

const CheckoutPage = () => {
  const { 
    notDiscountTotalPrice, 
    totalPrice, 
    totalQty, 
    deliveryCharge, 
    handlingCharge, 
    couponDiscount, 
    appliedCoupon,
    setAppliedCoupon,
    fetchCartItem, 
    fetchOrder,
    fetchUser,
    fetchAddress
  } = useGlobalContext()
  
  const [openAddress, setOpenAddress] = useState(false)
  const [openEditAddress, setOpenEditAddress] = useState(false)
  const [editAddressData, setEditAddressData] = useState(null)
  const [processing, setProcessing] = useState(false)
  const addressList = useSelector(state => state.addresses?.addressList || [])
  const [selectAddress, setSelectAddress] = useState(null)
  const cartItemsList = useSelector(state => state.cartItem?.cart || [])
  const totalCartQty = cartItemsList.reduce((sum, item) => sum + (item.quantity || 1), 0)
  const navigate = useNavigate()
  const token = localStorage.getItem('accessToken')

  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true })
    }
  }, [token, navigate])

  useEffect(() => {
    if (fetchAddress) fetchAddress()
  }, [])

  // Auto-select first address if available
  useEffect(() => {
    if (addressList && addressList.length > 0 && selectAddress === null) {
      const activeIdx = addressList.findIndex(a => a.status !== false)
      setSelectAddress(activeIdx !== -1 ? activeIdx : 0)
    }
  }, [addressList, selectAddress])

  const getCheckoutDeliveryDate = (pin, totalQty) => {
    const firstDigit = pin ? pin.charAt(0) : ''
    let baseStart = 3
    
    if (firstDigit === '1') {
      baseStart = 3
    } else if (firstDigit === '2') {
      baseStart = 4
    } else if (firstDigit === '3') {
      baseStart = 5
    } else if (firstDigit === '4') {
      baseStart = 4
    } else if (firstDigit === '5') {
      baseStart = 3
    } else if (firstDigit === '6') {
      baseStart = 2
    } else {
      baseStart = 3
    }
    const hasSameItemSpeedup = cartItemsList.some(item => (item.quantity || 1) >= 2)
    const cartQtyOffset = (totalQty <= 1 && !hasSameItemSpeedup) ? 3 : 0
    const startOffset = baseStart + cartQtyOffset

    const deliveryDate = new Date(Date.now() + startOffset * 24 * 60 * 60 * 1000)
    return deliveryDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const grandTotal = totalPrice + deliveryCharge + handlingCharge - couponDiscount

  // Helper to extract variant and price for each item
  const getItemDetails = (item) => {
    let price = Number(item.productId?.price || 0)
    let mrp = Number(item.productId?.mrp || price)
    if (item.unit && item.productId?.variants?.length > 0) {
      const variant = item.productId.variants.find(v => v.unit === item.unit)
      if (variant) {
        price = Number(variant.price || 0)
        mrp = Number(variant.mrp || price)
      }
    }
    const discount = getDiscountPercent(mrp, price)
    return { price: mrp, discountedPrice: price, discount }
  }

  const handleCashOnDelivery = async () => {
    if (processing) return
    try {
      if (selectAddress === null || !addressList[selectAddress]) {
        toast.error("Please select a delivery address")
        return
      }
      setProcessing(true)
      toast.loading("Placing order...", { id: "cod-load" })

      const response = await Axios({
        ...SummaryApi.CashOnDeliveryOrder,
        data: {
          list_items: cartItemsList,
          addressId: addressList[selectAddress]?._id,
          subTotalAmt: totalPrice,
          totalAmt: grandTotal,
          discountAmt: couponDiscount,
          couponCode: appliedCoupon?.code || "",
          deliveryCharge: deliveryCharge,
          handlingCharge: handlingCharge,
        }
      })

      const { data: responseData } = response

      if (responseData.success) {
        toast.success(responseData.message)
        if (setAppliedCoupon) setAppliedCoupon(null)
        if (fetchCartItem) fetchCartItem()
        if (fetchOrder) fetchOrder()
        if (fetchUser) fetchUser()

        navigate('/success', {
          state: { text: "Order" }
        })
      }

    } catch (error) {
      AxiosToastError(error)
    } finally {
      setProcessing(false)
      toast.dismiss("cod-load")
    }
  }

  const handleOnlinePayment = async () => {
    if (processing) return
    try {
      if (selectAddress === null || !addressList[selectAddress]) {
        toast.error("Please select a delivery address")
        return
      }
      setProcessing(true)
      toast.loading("Loading Stripe Checkout...", { id: "stripe-load" })

      const response = await Axios({
        ...SummaryApi.payment_url,
        data: {
          list_items: cartItemsList,
          addressId: addressList[selectAddress]?._id,
          subTotalAmt: totalPrice,
          totalAmt: grandTotal,
          deliveryCharge: deliveryCharge,
          handlingCharge: handlingCharge,
          couponDiscount: couponDiscount,
          couponId: appliedCoupon?._id
        },
      })

      toast.dismiss()
      const session = response.data

      if (!session.url) {
        toast.error("Stripe Checkout URL missing")
        return
      }

      window.location.href = session.url

    } catch (error) {
      AxiosToastError(error)
    } finally {
      setProcessing(false)
      toast.dismiss("stripe-load")
    }
  }

  // Free delivery threshold (₹3,500 based on the design mockup)
  const FREE_DELIVERY_THRESHOLD = 3500
  const deliveryProgress = Math.min(100, Math.round((totalPrice / FREE_DELIVERY_THRESHOLD) * 100))

  return (
    <div className='bg-[#f4f7fb] min-h-screen pb-16 pt-3'>
      <div className='container mx-auto px-4 max-w-7xl'>

        {/* ─── Top Stepper ──────────────────────────────────────────────── */}
        <div className='w-full max-w-xl mx-auto pt-2 pb-6 px-4'>
          <div className='flex items-center justify-between relative'>
            {/* Step 1: Cart */}
            <div className='flex flex-col items-center z-10'>
              <div className='w-8 h-8 rounded-full border border-gray-300 bg-white text-gray-700 font-semibold text-xs flex items-center justify-center shadow-xs'>
                1
              </div>
              <span className='text-xs font-medium text-gray-600 mt-1.5'>Cart</span>
            </div>

            {/* Line 1 -> 2 (Active Orange) */}
            <div className='flex-1 h-0.5 bg-orange-500 -mt-5 mx-1.5'></div>

            {/* Step 2: Checkout (Active) */}
            <div className='flex flex-col items-center z-10'>
              <div className='w-8 h-8 rounded-full bg-orange-500 text-white font-bold text-xs flex items-center justify-center shadow-xs shadow-orange-300'>
                2
              </div>
              <span className='text-xs font-bold text-orange-600 mt-1.5'>Checkout</span>
            </div>

            {/* Line 2 -> 3 (Gray) */}
            <div className='flex-1 h-0.5 bg-gray-300 -mt-5 mx-1.5'></div>

            {/* Step 3: Payment */}
            <div className='flex flex-col items-center z-10'>
              <div className='w-8 h-8 rounded-full border border-gray-300 bg-white text-gray-400 font-semibold text-xs flex items-center justify-center shadow-xs'>
                3
              </div>
              <span className='text-xs font-medium text-gray-400 mt-1.5'>Payment</span>
            </div>

            {/* Line 3 -> 4 (Gray) */}
            <div className='flex-1 h-0.5 bg-gray-300 -mt-5 mx-1.5'></div>

            {/* Step 4: Complete */}
            <div className='flex flex-col items-center z-10'>
              <div className='w-8 h-8 rounded-full border border-gray-300 bg-white text-gray-400 font-semibold text-xs flex items-center justify-center shadow-xs'>
                4
              </div>
              <span className='text-xs font-medium text-gray-400 mt-1.5'>Complete</span>
            </div>
          </div>
        </div>

        {/* ─── Main 2-Column Content ─────────────────────────────────────── */}
        <div className='flex flex-col lg:flex-row gap-6 items-start justify-between'>

          {/* Left Column (Address & Trust Info) */}
          <div className='w-full lg:flex-1 space-y-5'>

            {/* Choose Delivery Address Section */}
            <div className='bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-gray-100'>
              
              {/* Header */}
              <div className='flex items-center justify-between pb-5 border-b border-gray-100'>
                <div className='flex items-center gap-3'>
                  <div className='w-8 h-8 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-xs'>
                    1
                  </div>
                  <div>
                    <h2 className='text-lg sm:text-xl font-bold text-gray-900 tracking-tight'>
                      Choose Delivery Address
                    </h2>
                    <p className='text-xs sm:text-sm text-gray-500 font-normal mt-0.5'>
                      Select a delivery address for your order
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setOpenAddress(true)}
                  className='border border-orange-500 text-orange-600 hover:bg-orange-50 active:scale-95 px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-1 cursor-pointer shrink-0'
                >
                  <Plus size={16} />
                  <span>Add New Address</span>
                </button>
              </div>

              {/* Address List */}
              <div className='space-y-4 pt-5'>
                {addressList.length === 0 ? (
                  <div className='py-8 text-center text-gray-500'>
                    <p className='font-medium text-sm'>No addresses found in your account.</p>
                    <p className='text-xs text-gray-400 mt-1'>Add a new delivery address to proceed with your order.</p>
                  </div>
                ) : (
                  addressList.map((address, index) => {
                    if (address.status === false) return null
                    const isSelected = selectAddress === index

                    return (
                      <div
                        key={address._id || index}
                        onClick={() => setSelectAddress(index)}
                        className={`rounded-2xl p-4 sm:p-5 cursor-pointer relative transition-all duration-200 ${
                          isSelected
                            ? 'border-2 border-emerald-500 bg-emerald-50/20 shadow-xs'
                            : 'border border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className='flex items-start gap-3.5 sm:gap-4'>
                          {/* Radio Button */}
                          <div className='pt-0.5 shrink-0'>
                            {isSelected ? (
                              <div className='w-5 h-5 rounded-full border-2 border-emerald-500 flex items-center justify-center'>
                                <div className='w-2.5 h-2.5 rounded-full bg-emerald-500' />
                              </div>
                            ) : (
                              <div className='w-5 h-5 rounded-full border-2 border-gray-300' />
                            )}
                          </div>

                          {/* Address Details */}
                          <div className='flex-1 min-w-0 pr-12'>
                            <p className='font-bold text-gray-900 text-sm sm:text-base leading-snug'>
                              {address.address_line}
                            </p>
                            <p className='text-xs sm:text-sm text-gray-500 font-medium mt-1'>
                              {address.city}{address.city && address.state ? ', ' : ''}{address.state}
                            </p>
                            <p className='text-xs sm:text-sm text-gray-500 font-medium'>
                              {address.country || 'India'} - {address.pincode}
                            </p>

                            {/* Mobile Number */}
                            {address.mobile && (
                              <p className='text-xs sm:text-sm font-semibold text-gray-700 mt-2 flex items-center gap-1.5'>
                                <Smartphone size={15} className='text-gray-600 shrink-0' />
                                <span>{address.mobile}</span>
                              </p>
                            )}

                            {/* Estimated Delivery Badge */}
                            <div className='mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-bold uppercase tracking-wider rounded-full border border-emerald-100'>
                              <span className='w-1.5 h-1.5 bg-emerald-500 rounded-full' />
                              <span>ESTIMATED DELIVERY: {getCheckoutDeliveryDate(address.pincode, totalCartQty).toUpperCase()}</span>
                            </div>
                          </div>

                          {/* Edit Button */}
                          <button
                            type='button'
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditAddressData(address)
                              setOpenEditAddress(true)
                            }}
                            className='absolute top-4 right-4 sm:top-5 sm:right-5 flex items-center gap-1 text-xs sm:text-sm font-semibold text-gray-600 hover:text-orange-600 px-2 py-1 rounded-lg hover:bg-gray-100/70 transition'
                          >
                            <Pencil size={14} />
                            <span>Edit</span>
                          </button>
                        </div>
                      </div>
                    )
                  })
                )}

                {/* Dashed Add Address Box */}
                <div
                  onClick={() => setOpenAddress(true)}
                  className='border-2 border-dashed border-blue-200/90 bg-blue-50/30 hover:bg-blue-50/70 rounded-2xl py-4 flex items-center justify-center cursor-pointer transition text-blue-600 font-bold text-xs uppercase tracking-wider gap-1.5 mt-2'
                >
                  <Plus size={16} />
                  <span>ADD NEW ADDRESS</span>
                </div>
              </div>
            </div>

            {/* Free Delivery Banner Card */}
            <div className='bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
              <div className='flex items-center gap-3.5'>
                <div className='w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0'>
                  <Truck size={24} />
                </div>
                <div>
                  <h3 className='font-bold text-emerald-800 text-sm sm:text-base'>
                    Congrats! You get FREE delivery
                  </h3>
                  <p className='text-xs text-gray-600 font-medium mt-0.5'>
                    {totalPrice >= FREE_DELIVERY_THRESHOLD || deliveryCharge === 0
                      ? 'Free delivery applied on this order.'
                      : `Add items worth ${DisplayPriceInRupees(FREE_DELIVERY_THRESHOLD - totalPrice)} more to get free delivery.`
                    }
                  </p>
                  
                  {/* Progress Bar */}
                  <div className='w-full sm:w-72 md:w-80 h-2 bg-emerald-200/60 rounded-full overflow-hidden mt-2.5'>
                    <div 
                      className='h-full bg-emerald-500 rounded-full transition-all duration-500'
                      style={{ width: `${deliveryProgress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Progress Count */}
              <div className='text-right shrink-0 sm:self-center font-bold text-xs sm:text-sm text-gray-800 pl-2'>
                {DisplayPriceInRupees(totalPrice)} / {DisplayPriceInRupees(FREE_DELIVERY_THRESHOLD)}
              </div>
            </div>

            {/* Trust Badges */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-3.5'>
              {/* Badge 1 */}
              <div className='bg-white rounded-2xl border border-gray-100 p-4 shadow-2xs flex items-center gap-3.5'>
                <div className='w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0'>
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <p className='font-bold text-xs sm:text-sm text-gray-900'>Secure Payment</p>
                  <p className='text-[11px] text-gray-400 font-medium'>100% Safe & Secure</p>
                </div>
              </div>

              {/* Badge 2 */}
              <div className='bg-white rounded-2xl border border-gray-100 p-4 shadow-2xs flex items-center gap-3.5'>
                <div className='w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center shrink-0'>
                  <Truck size={20} />
                </div>
                <div>
                  <p className='font-bold text-xs sm:text-sm text-gray-900'>Free Delivery</p>
                  <p className='text-[11px] text-gray-400 font-medium'>On orders above ₹3,500</p>
                </div>
              </div>

              {/* Badge 3 */}
              <div className='bg-white rounded-2xl border border-gray-100 p-4 shadow-2xs flex items-center gap-3.5'>
                <div className='w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center shrink-0'>
                  <Headphones size={20} />
                </div>
                <div>
                  <p className='font-bold text-xs sm:text-sm text-gray-900'>24/7 Support</p>
                  <p className='text-[11px] text-gray-400 font-medium'>We're here to help</p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column (Bill Summary) */}
          <div className='w-full lg:w-[410px] bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-gray-100 sticky top-24'>
            
            {/* Header */}
            <div className='flex items-center justify-between pb-4 border-b border-gray-100'>
              <h3 className='text-xs font-extrabold text-gray-900 uppercase tracking-widest'>
                Bill Summary
              </h3>
              <span className='bg-blue-50 text-blue-600 font-semibold text-xs px-2.5 py-0.5 rounded-full'>
                {totalCartQty} {totalCartQty === 1 ? 'item' : 'items'}
              </span>
            </div>

            {/* Cart Items List */}
            <div className='divide-y divide-gray-100 max-h-72 overflow-y-auto pr-1 py-2'>
              {cartItemsList.length === 0 ? (
                <p className='text-xs text-gray-400 py-4 text-center'>Your cart is empty</p>
              ) : (
                cartItemsList.map((item, index) => {
                  const { price, discountedPrice, discount } = getItemDetails(item)
                  const itemTotal = discountedPrice * (item.quantity || 1)
                  const originalTotal = price * (item.quantity || 1)
                  const productImage = item.productId?.image?.[0]
                  const productName = item.productId?.name || 'Product'
                  const variantOrUnit = item.unit || item.productId?.unit

                  return (
                    <div key={item._id || index} className='flex items-center gap-3 py-3'>
                      {/* Product Thumbnail */}
                      <div className='w-14 h-14 rounded-xl bg-gray-50 border border-gray-100 p-1 flex items-center justify-center overflow-hidden shrink-0'>
                        {productImage ? (
                          <img
                            src={productImage}
                            alt={productName}
                            className='w-full h-full object-contain'
                          />
                        ) : (
                          <span className='text-[10px] text-gray-300 font-medium'>No Img</span>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className='flex-1 min-w-0'>
                        <h4 className='text-xs sm:text-sm font-bold text-gray-900 truncate'>
                          {productName}
                        </h4>
                        {variantOrUnit && (
                          <p className='text-[11px] text-gray-400 font-medium truncate'>
                            {variantOrUnit}
                          </p>
                        )}
                        <p className='text-[11px] text-gray-500 font-medium mt-0.5'>
                          Qty: {item.quantity || 1}
                        </p>
                      </div>

                      {/* Product Pricing */}
                      <div className='text-right shrink-0'>
                        <p className='text-xs sm:text-sm font-bold text-gray-900'>
                          {DisplayPriceInRupees(itemTotal)}
                        </p>
                        {discount > 0 && originalTotal > itemTotal && (
                          <p className='text-[11px] text-gray-400 line-through'>
                            {DisplayPriceInRupees(originalTotal)}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Calculations Breakdown */}
            <div className='border-t border-gray-100 pt-4 space-y-3'>
              
              {/* Items Total */}
              <div className='flex justify-between items-center text-xs sm:text-sm font-medium'>
                <span className='text-gray-700'>Items Total ({totalCartQty} items)</span>
                <span className='text-gray-900 font-bold'>{DisplayPriceInRupees(totalPrice)}</span>
              </div>

              {/* Discount / Coupon */}
              {couponDiscount > 0 && (
                <div className='flex justify-between items-center text-xs sm:text-sm font-medium'>
                  <span className='text-gray-700'>
                    Discount ({appliedCoupon?.code || 'COUPON'})
                  </span>
                  <span className='text-emerald-500 font-bold'>
                    - {DisplayPriceInRupees(couponDiscount)}
                  </span>
                </div>
              )}

              {/* Delivery Charge */}
              <div className='flex justify-between items-center text-xs sm:text-sm font-medium'>
                <span className='text-gray-700'>Delivery Charge</span>
                <span>
                  {deliveryCharge === 0 ? (
                    <span className='text-emerald-500 font-bold'>FREE</span>
                  ) : (
                    <span className='text-gray-900 font-bold'>{DisplayPriceInRupees(deliveryCharge)}</span>
                  )}
                </span>
              </div>

              {/* Handling Charge */}
              <div className='flex justify-between items-center text-xs sm:text-sm font-medium'>
                <span className='text-gray-700'>Handling Charge</span>
                <span className='text-gray-900 font-bold'>
                  ₹{Number(handlingCharge || 0).toFixed(2)}
                </span>
              </div>

              {/* Grand Total */}
              <div className='border-t border-gray-100 pt-4'>
                <p className='text-xs font-semibold text-gray-500'>Grand Total</p>
                <p className='text-3xl font-extrabold text-gray-900 tracking-tight mt-1'>
                  ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>

            </div>

            {/* Action Buttons */}
            <div className='space-y-3 pt-6'>
              {selectAddress === null && (
                <p className='text-rose-500 text-xs font-semibold text-center'>
                  {addressList.length === 0 ? "Please add an address first" : "Please select an address to proceed"}
                </p>
              )}

              {/* Pay Online (Stripe) */}
              <button
                type='button'
                onClick={handleOnlinePayment}
                disabled={selectAddress === null || processing || cartItemsList.length === 0}
                className={`w-full py-3.5 px-4 rounded-xl text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer ${
                  selectAddress === null || processing || cartItemsList.length === 0
                    ? 'bg-blue-300 cursor-not-allowed shadow-none'
                    : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.99] shadow-blue-500/20'
                }`}
              >
                <CreditCard size={18} />
                <span>{processing ? 'Processing...' : 'Pay Online (Stripe)'}</span>
                <ArrowRight size={16} />
              </button>

              {/* Cash on Delivery */}
              <button
                type='button'
                onClick={handleCashOnDelivery}
                disabled={selectAddress === null || processing || cartItemsList.length === 0}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 border cursor-pointer ${
                  selectAddress === null || processing || cartItemsList.length === 0
                    ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                    : 'border-gray-200 text-gray-800 bg-white hover:bg-gray-50 active:scale-[0.99] shadow-2xs'
                }`}
              >
                <Banknote size={18} />
                <span>{processing ? 'Processing...' : 'Cash on Delivery'}</span>
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* ─── Address Modals ───────────────────────────────────────────── */}
      {openAddress && (
        <AddAddress close={() => {
          setOpenAddress(false)
          if (fetchAddress) fetchAddress()
        }} />
      )}

      {openEditAddress && editAddressData && (
        <EditAddress
          data={editAddressData}
          close={() => {
            setOpenEditAddress(false)
            setEditAddressData(null)
            if (fetchAddress) fetchAddress()
          }}
        />
      )}
    </div>
  )
}

export default CheckoutPage
