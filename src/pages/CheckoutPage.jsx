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
import uploadImage from '../utils/UploadImage'
import upiQr1 from '../assets/upi-qr-1.jpg'
import upiQr2 from '../assets/upi-qr-2.jpg'
import {
  Truck,
  ShieldCheck,
  Headphones,
  CreditCard,
  Banknote,
  Smartphone,
  Pencil,
  Plus,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  QrCode,
  UploadCloud,
  Copy,
  Check,
  Lock,
  Image as ImageIcon,
  RefreshCw,
  ExternalLink,
  PhoneCall,
  MessageSquare,
  HelpCircle
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

  // UPI QR Code and Payment Screenshot state (Kept for reference, commented out in UI)
  const fileInputRef = React.useRef(null)
  const [selectedQr, setSelectedQr] = useState('qr1') // 'qr1' or 'qr2'
  const [paymentScreenshot, setPaymentScreenshot] = useState('')
  const [screenshotPreview, setScreenshotPreview] = useState('')
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false)
  const [transactionId, setTransactionId] = useState('')
  const [copiedUpi, setCopiedUpi] = useState(false)
  // Customer Query / Instructions state
  const [customerQuery, setCustomerQuery] = useState('')

  const upiOptions = [
    {
      id: 'qr1',
      name: 'Option 1 (SLC)',
      upiId: '7095736374siva@slc',
      image: upiQr1,
      appName: 'GPay / PhonePe / Paytm / BHIM'
    },
    {
      id: 'qr2',
      name: 'Option 2 (Navi / Axis)',
      upiId: '7095736374@naviaxis',
      image: upiQr2,
      appName: 'Any UPI App'
    }
  ]

  const activeQr = upiOptions.find(o => o.id === selectedQr) || upiOptions[0]

  const handleCopyUpi = (upiId) => {
    navigator.clipboard.writeText(upiId)
    setCopiedUpi(true)
    toast.success('UPI ID copied to clipboard!')
    setTimeout(() => setCopiedUpi(false), 2500)
  }

  const handleScreenshotUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, JPEG, WEBP).')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be under 10MB.')
      return
    }

    const localUrl = URL.createObjectURL(file)
    setScreenshotPreview(localUrl)

    try {
      setUploadingScreenshot(true)
      const uploadToastId = toast.loading('Uploading payment screenshot...', { id: 'upload-ss' })
      const res = await uploadImage(file)
      toast.dismiss('upload-ss')

      let uploadedUrl = res?.data?.data?.url || res?.data?.data || res?.data?.url
      if (!uploadedUrl && typeof res?.data?.data === 'string') {
        uploadedUrl = res.data.data
      }

      if (uploadedUrl) {
        setPaymentScreenshot(uploadedUrl)
        toast.success('Payment screenshot uploaded! You can now confirm your order.')
      } else {
        // Fallback: convert file to Base64 Data URL so user is never blocked
        const reader = new FileReader()
        reader.onloadend = () => {
          setPaymentScreenshot(reader.result)
          toast.success('Payment screenshot attached! You can now confirm your order.')
        }
        reader.readAsDataURL(file)
      }
    } catch (err) {
      console.error('Screenshot upload error:', err)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPaymentScreenshot(reader.result)
        toast.success('Payment screenshot attached! You can now confirm your order.')
      }
      reader.readAsDataURL(file)
    } finally {
      setUploadingScreenshot(false)
    }
  }

  const handleRemoveScreenshot = () => {
    setPaymentScreenshot('')
    setScreenshotPreview('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true })
    }
  }, [token, navigate])

  useEffect(() => {
    if (fetchAddress) fetchAddress()
  }, [])

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

  const handleConfirmUpiOrder = async () => {
    if (processing) return
    if (totalPrice < MIN_ORDER_VALUE) {
      toast.error(`Minimum order amount is ₹${MIN_ORDER_VALUE.toLocaleString('en-IN')}. Please add ₹${Number(MIN_ORDER_VALUE - totalPrice).toLocaleString('en-IN')} more to proceed.`)
      return
    }
    if (selectAddress === null || !addressList[selectAddress]) {
      toast.error('Please select a delivery address')
      return
    }

    try {
      setProcessing(true)
      toast.loading('Submitting your order & query...', { id: 'order-submit-load' })

      const response = await Axios({
        ...SummaryApi.upiOrder,
        data: {
          list_items: cartItemsList,
          addressId: addressList[selectAddress]?._id,
          subTotalAmt: totalPrice,
          totalAmt: grandTotal,
          discountAmt: couponDiscount,
          couponCode: appliedCoupon?.code || appliedCoupon?.couponCode || '',
          couponId: appliedCoupon?._id,
          deliveryCharge: deliveryCharge,
          handlingCharge: handlingCharge,
          customerQuery: customerQuery.trim(),
          payment_screenshot: '',
          payment_status: 'Query Submitted (Pending Call)',
          paymentId: `QUERY-${Date.now().toString().slice(-6)}`
        }
      })

      const { data: responseData } = response

      if (responseData.success) {
        toast.dismiss('order-submit-load')
        toast.success(responseData.message || 'Order & query submitted successfully! Our team will contact you shortly.')
        if (setAppliedCoupon) setAppliedCoupon(null)
        if (fetchCartItem) fetchCartItem()
        if (fetchOrder) fetchOrder()
        if (fetchUser) fetchUser()

        navigate('/success', {
          state: { 
            text: 'Order',
            subtext: 'Submit your query using Confirm Order. After that, our team will contact you and update you.'
          }
        })
      }
    } catch (error) {
      toast.dismiss('order-submit-load')
      AxiosToastError(error)
    } finally {
      setProcessing(false)
    }
  }

  // Stripe & COD payment handlers (kept defined so they can be re-enabled whenever needed)
  const handleCashOnDelivery = async () => {
    if (processing) return
    try {
      if (totalPrice < MIN_ORDER_VALUE) {
        toast.error(`Minimum order amount is ₹${MIN_ORDER_VALUE.toLocaleString('en-IN')}. Please add ₹${Number(MIN_ORDER_VALUE - totalPrice).toLocaleString('en-IN')} more to proceed.`)
        return
      }
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
      if (totalPrice < MIN_ORDER_VALUE) {
        toast.error(`Minimum order amount is ₹${MIN_ORDER_VALUE.toLocaleString('en-IN')}. Please add ₹${Number(MIN_ORDER_VALUE - totalPrice).toLocaleString('en-IN')} more to proceed.`)
        return
      }
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

  const MIN_ORDER_VALUE = 4500
  const amountToMinOrder = Math.max(0, MIN_ORDER_VALUE - totalPrice)
  const isBelowMinOrder = totalPrice < MIN_ORDER_VALUE
  const deliveryProgress = Math.min(100, Math.round((totalPrice / MIN_ORDER_VALUE) * 100))

  return (
    <div className='bg-[#f4f7fb] min-h-screen pb-16 pt-3'>
      <div className='container mx-auto px-4 max-w-7xl'>

        <div className='w-full max-w-xl mx-auto pt-2 pb-6 px-4'>
          <div className='flex items-center justify-between relative'>
            <div className='flex flex-col items-center z-10'>
              <div className='w-8 h-8 rounded-full border border-gray-300 bg-white text-gray-700 font-semibold text-xs flex items-center justify-center shadow-xs'>
                1
              </div>
              <span className='text-xs font-medium text-gray-600 mt-1.5'>Cart</span>
            </div>

            <div className='flex-1 h-0.5 bg-orange-500 -mt-5 mx-1.5'></div>

            <div className='flex flex-col items-center z-10'>
              <div className='w-8 h-8 rounded-full bg-orange-500 text-white font-bold text-xs flex items-center justify-center shadow-xs shadow-orange-300'>
                2
              </div>
              <span className='text-xs font-bold text-orange-600 mt-1.5'>Checkout</span>
            </div>

            <div className='flex-1 h-0.5 bg-gray-300 -mt-5 mx-1.5'></div>

            <div className='flex flex-col items-center z-10'>
              <div className='w-8 h-8 rounded-full border border-gray-300 bg-white text-gray-400 font-semibold text-xs flex items-center justify-center shadow-xs'>
                3
              </div>
              <span className='text-xs font-medium text-gray-400 mt-1.5'>Payment</span>
            </div>

            <div className='flex-1 h-0.5 bg-gray-300 -mt-5 mx-1.5'></div>

            <div className='flex flex-col items-center z-10'>
              <div className='w-8 h-8 rounded-full border border-gray-300 bg-white text-gray-400 font-semibold text-xs flex items-center justify-center shadow-xs'>
                4
              </div>
              <span className='text-xs font-medium text-gray-400 mt-1.5'>Complete</span>
            </div>
          </div>
        </div>

        <div className='flex flex-col lg:flex-row gap-6 items-start justify-between'>

          <div className='w-full lg:flex-1 space-y-5'>

            <div className='bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-gray-100'>
              
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
                          <div className='pt-0.5 shrink-0'>
                            {isSelected ? (
                              <div className='w-5 h-5 rounded-full border-2 border-emerald-500 flex items-center justify-center'>
                                <div className='w-2.5 h-2.5 rounded-full bg-emerald-500' />
                              </div>
                            ) : (
                              <div className='w-5 h-5 rounded-full border-2 border-gray-300' />
                            )}
                          </div>

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

                            {address.mobile && (
                              <p className='text-xs sm:text-sm font-semibold text-gray-700 mt-2 flex items-center gap-1.5'>
                                <Smartphone size={15} className='text-gray-600 shrink-0' />
                                <span>{address.mobile}</span>
                              </p>
                            )}

                            <div className='mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-bold uppercase tracking-wider rounded-full border border-emerald-100'>
                              <span className='w-1.5 h-1.5 bg-emerald-500 rounded-full' />
                              <span>ESTIMATED DELIVERY: {getCheckoutDeliveryDate(address.pincode, totalCartQty).toUpperCase()}</span>
                            </div>
                          </div>

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

                <div
                  onClick={() => setOpenAddress(true)}
                  className='border-2 border-dashed border-blue-200/90 bg-blue-50/30 hover:bg-blue-50/70 rounded-2xl py-4 flex items-center justify-center cursor-pointer transition text-blue-600 font-bold text-xs uppercase tracking-wider gap-1.5 mt-2'
                >
                  <Plus size={16} />
                  <span>ADD NEW ADDRESS</span>
                </div>
              </div>
            </div>

            <div className={`border rounded-2xl p-4 sm:p-5 flex flex-col gap-3 transition-all ${
              isBelowMinOrder ? 'bg-amber-50/80 border-amber-200' : 'bg-emerald-50/70 border-emerald-200'
            }`}>
              <div className='flex items-start gap-3.5'>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  isBelowMinOrder ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  <Truck size={24} />
                </div>
                <div className='flex-1'>
                  <div className='flex flex-wrap items-center justify-between gap-2'>
                    <h3 className={`font-bold text-sm sm:text-base ${
                      isBelowMinOrder ? 'text-amber-900' : 'text-emerald-900'
                    }`}>
                      Delivery Charges: ₹500 - ₹1,000 (Pay After Delivery)
                    </h3>
                    <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${
                      isBelowMinOrder ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      Min Order: ₹4,500
                    </span>
                  </div>
                  <p className='text-xs text-gray-700 font-medium mt-1 leading-relaxed'>
                    Delivery charges are to be paid upon receiving your order. We will send the exact delivery price to your registered Gmail based on your address and parcel weight.
                  </p>

                  {isBelowMinOrder ? (
                    <div className='mt-3 bg-white/90 border border-amber-200 p-3 rounded-xl'>
                      <div className='flex items-center justify-between text-xs font-bold text-amber-900 mb-1.5'>
                        <span className='flex items-center gap-1.5 text-rose-600'>
                          <AlertCircle size={14} />
                          Add {DisplayPriceInRupees(amountToMinOrder)} more to place order
                        </span>
                        <span>{DisplayPriceInRupees(totalPrice)} / {DisplayPriceInRupees(MIN_ORDER_VALUE)}</span>
                      </div>
                      <div className='w-full h-2 bg-amber-100 rounded-full overflow-hidden'>
                        <div 
                          className='h-full bg-amber-500 rounded-full transition-all duration-500'
                          style={{ width: `${deliveryProgress}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className='mt-2.5 text-xs text-emerald-700 font-bold flex items-center gap-1.5'>
                      <CheckCircle2 size={16} />
                      <span>Minimum order requirement of ₹4,500 met! ({DisplayPriceInRupees(totalPrice)})</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-3.5'>
              <div className='bg-white rounded-2xl border border-gray-100 p-4 shadow-2xs flex items-center gap-3.5'>
                <div className='w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0'>
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <p className='font-bold text-xs sm:text-sm text-gray-900'>Secure Payment</p>
                  <p className='text-[11px] text-gray-400 font-medium'>100% Safe & Secure</p>
                </div>
              </div>

              <div className='bg-white rounded-2xl border border-gray-100 p-4 shadow-2xs flex items-center gap-3.5'>
                <div className='w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center shrink-0'>
                  <Truck size={20} />
                </div>
                <div>
                  <p className='font-bold text-xs sm:text-sm text-gray-900'>Delivery: ₹500 - ₹1,000</p>
                  <p className='text-[11px] text-gray-400 font-medium'>Pay after delivery • Exact price via Gmail</p>
                </div>
              </div>

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

          <div className='w-full lg:w-[410px] bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-gray-100 sticky top-24'>
            
            <div className='flex items-center justify-between pb-4 border-b border-gray-100'>
              <h3 className='text-xs font-extrabold text-gray-900 uppercase tracking-widest'>
                Bill Summary
              </h3>
              <span className='bg-blue-50 text-blue-600 font-semibold text-xs px-2.5 py-0.5 rounded-full'>
                {totalCartQty} {totalCartQty === 1 ? 'item' : 'items'}
              </span>
            </div>

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

            <div className='border-t border-gray-100 pt-4 space-y-3'>
              
              <div className='flex justify-between items-center text-xs sm:text-sm font-medium'>
                <span className='text-gray-700'>Items Total ({totalCartQty} items)</span>
                <span className='text-gray-900 font-bold'>{DisplayPriceInRupees(totalPrice)}</span>
              </div>

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

              <div className='flex justify-between items-start text-xs sm:text-sm font-medium'>
                <div>
                  <span className='text-gray-700'>Delivery Charge</span>
                  <p className='text-[10px] text-amber-600 font-medium'>Pay after delivery • Exact price sent to Gmail</p>
                </div>
                <span className='text-amber-600 font-bold'>₹500 - ₹1,000</span>
              </div>

              {handlingCharge > 0 && (
                <div className='flex justify-between items-center text-xs sm:text-sm font-medium'>
                  <span className='text-gray-700'>Handling Charge</span>
                  <span className='text-gray-900 font-bold'>
                    ₹{Number(handlingCharge || 0).toFixed(2)}
                  </span>
                </div>
              )}

              <div className='border-t border-gray-100 pt-4'>
                <p className='text-xs font-semibold text-gray-500'>Grand Total (To Pay Now)</p>
                <p className='text-3xl font-extrabold text-gray-900 tracking-tight mt-1'>
                  ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className='text-[11px] text-amber-800 bg-amber-50 border border-amber-200/70 p-2.5 rounded-xl mt-3 font-medium leading-relaxed'>
                  ℹ️ Delivery charges (₹500 - ₹1,000) are to be paid after delivery. Exact price will be calculated and emailed to your Gmail.
                </p>
              </div>

            </div>

            <div className='pt-6 space-y-4'>
              {isBelowMinOrder ? (
                <div className='bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold p-3 rounded-xl text-center flex items-center justify-center gap-1.5'>
                  <AlertCircle size={15} />
                  <span>Minimum order of ₹4,500 required (Add {DisplayPriceInRupees(amountToMinOrder)} more)</span>
                </div>
              ) : selectAddress === null && (
                <p className='text-rose-500 text-xs font-semibold text-center'>
                  {addressList.length === 0 ? "Please add an address first" : "Please select an address to proceed"}
                </p>
              )}

              {/* Notice before placing order */}
              <div className='bg-amber-50 border border-amber-300/80 rounded-2xl p-4 text-center shadow-xs'>
                <p className='text-sm sm:text-base font-bold text-amber-950 leading-snug'>
                  Submit your query using Confirm Order. After that, our team will contact you and update you.
                </p>
              </div>

              {/* Confirm Order Button */}
              <div>
                <button
                  type='button'
                  onClick={handleConfirmUpiOrder}
                  disabled={selectAddress === null || processing || cartItemsList.length === 0 || isBelowMinOrder}
                  className={`w-full py-4 px-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                    selectAddress === null || processing || cartItemsList.length === 0 || isBelowMinOrder
                      ? 'bg-orange-300/40 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-500/30 active:scale-[0.99]'
                  }`}
                >
                  {processing ? (
                    <>
                      <RefreshCw size={15} className='animate-spin' />
                      <span>Placing Order...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Confirm Order</span>
                    </>
                  )}
                </button>

                {isBelowMinOrder ? (
                  <p className='text-[10px] text-rose-500 font-bold text-center mt-2'>
                    Minimum order amount is ₹{MIN_ORDER_VALUE.toLocaleString('en-IN')}. Please add items worth ₹{amountToMinOrder.toLocaleString('en-IN')} more.
                  </p>
                ) : selectAddress === null && (
                  <p className='text-[10px] text-rose-500 font-bold text-center mt-2'>
                    Please select or add a delivery address above to proceed.
                  </p>
                )}
              </div>

              {/* ========================================================
                  PAYMENT GATEWAYS & QR CODE (COMMENTED OUT AS REQUESTED)
                  ========================================================
                  The payment gateway QR code and payment proof upload have
                  been commented out as requested. Customers now submit their
                  query via "Confirm Order" and our team will contact them.
              */}
              {/*
              <div className='bg-gradient-to-br from-slate-900 via-gray-900 to-indigo-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-white/10'>
                <div className='flex items-center justify-between gap-2 border-b border-white/10 pb-4 mb-4'>
                  <div className='flex items-center gap-2.5'>
                    <div className='w-9 h-9 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400'>
                      <QrCode size={19} />
                    </div>
                    <div>
                      <h3 className='text-sm font-black uppercase tracking-wider text-white'>UPI QR Payment</h3>
                      <p className='text-[10px] text-gray-400 font-medium'>Scan with any UPI app to pay</p>
                    </div>
                  </div>
                  <span className='px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'>
                    Fast & Direct
                  </span>
                </div>

                <div className='bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center justify-between mb-4'>
                  <span className='text-xs text-gray-300 font-medium'>Amount to Pay Now:</span>
                  <span className='text-lg font-black text-orange-400 tracking-tight'>
                    ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className='mb-4'>
                  <label className='block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2'>
                    Choose Payment QR:
                  </label>
                  <div className='grid grid-cols-2 gap-2'>
                    {upiOptions.map((opt) => {
                      const isSelected = selectedQr === opt.id
                      return (
                        <button
                          key={opt.id}
                          type='button'
                          onClick={() => setSelectedQr(opt.id)}
                          className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-orange-500/20 border-orange-500 text-white shadow-md'
                              : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                          }`}
                        >
                          <p className={`text-[11px] font-bold ${isSelected ? 'text-orange-400' : 'text-gray-300'}`}>
                            {opt.name}
                          </p>
                          <p className='text-[9px] font-mono truncate mt-0.5 opacity-80'>{opt.upiId}</p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className='bg-white text-gray-900 rounded-2xl p-4 shadow-inner flex flex-col items-center'>
                  <div className='relative w-56 max-w-full aspect-square bg-white rounded-xl overflow-hidden border-2 border-gray-100 shadow-sm flex items-center justify-center p-2'>
                    <img
                      src={activeQr.image}
                      alt={activeQr.name}
                      className='w-full h-full object-contain'
                    />
                  </div>

                  <div className='w-full mt-3 bg-gray-50 border border-gray-200 rounded-xl p-2.5 flex items-center justify-between gap-2'>
                    <div className='min-w-0 flex-1'>
                      <p className='text-[9px] font-bold uppercase tracking-wider text-gray-400'>UPI ID</p>
                      <p className='text-xs font-mono font-bold text-gray-800 truncate select-all'>
                        {activeQr.upiId}
                      </p>
                    </div>
                    <button
                      type='button'
                      onClick={() => handleCopyUpi(activeQr.upiId)}
                      className='px-2.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0'
                    >
                      {copiedUpi ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <p className='text-[10px] text-gray-500 font-medium text-center mt-2.5'>
                    Supported on Google Pay, PhonePe, Paytm, BHIM, Cred & Banking apps
                  </p>
                </div>

                <div className='mt-5 pt-4 border-t border-white/10'>
                  <div className='flex items-center justify-between mb-1.5'>
                    <label className='text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5'>
                      <span>Upload Payment Screenshot</span>
                      <span className='text-rose-400 text-sm'>*</span>
                    </label>
                    {paymentScreenshot && (
                      <span className='text-[10px] font-bold text-emerald-400 flex items-center gap-1'>
                        <CheckCircle2 size={12} /> Ready
                      </span>
                    )}
                  </div>
                  <p className='text-[11px] text-gray-400 mb-3 leading-tight'>
                    Upload the screenshot of your completed UPI transaction to unlock the Confirm Order button.
                  </p>

                  <input
                    type='file'
                    ref={fileInputRef}
                    onChange={handleScreenshotUpload}
                    accept='image/*'
                    className='hidden'
                    id='payment-screenshot-input'
                  />

                  {!paymentScreenshot && !uploadingScreenshot && (
                    <label
                      htmlFor='payment-screenshot-input'
                      className='border-2 border-dashed border-white/20 hover:border-orange-500/60 bg-white/5 hover:bg-white/10 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group'
                    >
                      <div className='w-10 h-10 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center group-hover:scale-110 transition-transform'>
                        <UploadCloud size={20} />
                      </div>
                      <div className='text-center'>
                        <p className='text-xs font-bold text-white group-hover:text-orange-400 transition-colors'>
                          Tap to select payment screenshot
                        </p>
                        <p className='text-[10px] text-gray-400 mt-0.5'>Supports JPG, PNG, WEBP (Max 10MB)</p>
                      </div>
                    </label>
                  )}

                  {uploadingScreenshot && (
                    <div className='border border-white/10 bg-white/5 rounded-2xl p-6 flex flex-col items-center justify-center gap-2'>
                      <RefreshCw size={22} className='text-orange-400 animate-spin' />
                      <p className='text-xs font-bold text-gray-300'>Attaching payment proof...</p>
                    </div>
                  )}

                  {paymentScreenshot && !uploadingScreenshot && (
                    <div className='bg-white/10 border border-emerald-500/50 rounded-2xl p-3 flex items-center justify-between gap-3'>
                      <div className='flex items-center gap-3 min-w-0'>
                        <img
                          src={screenshotPreview || paymentScreenshot}
                          alt='Payment Receipt'
                          className='w-12 h-12 object-cover rounded-xl border border-white/20 shrink-0'
                        />
                        <div className='min-w-0'>
                          <p className='text-xs font-bold text-emerald-300 flex items-center gap-1 truncate'>
                            <CheckCircle2 size={13} /> Screenshot Attached
                          </p>
                          <p className='text-[10px] text-gray-400 truncate'>Confirm button unlocked!</p>
                        </div>
                      </div>
                      <button
                        type='button'
                        onClick={handleRemoveScreenshot}
                        className='text-[11px] font-bold text-gray-400 hover:text-rose-400 px-2.5 py-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer shrink-0'
                      >
                        Change
                      </button>
                    </div>
                  )}

                  <div className='mt-3'>
                    <input
                      type='text'
                      placeholder='UPI Reference / UTR Number (Optional)'
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      className='w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-xs focus:outline-hidden focus:border-orange-500 transition-colors'
                    />
                  </div>
                </div>

                <div className='mt-5 pt-3'>
                  <button
                    type='button'
                    onClick={handleConfirmUpiOrder}
                    disabled={selectAddress === null || processing || cartItemsList.length === 0 || isBelowMinOrder}
                    className='w-full py-4 px-4 rounded-2xl font-black text-xs uppercase tracking-widest bg-orange-500 text-white'
                  >
                    Confirm & Place Order
                  </button>
                </div>
              </div>
              */}
            </div>

          </div>

        </div>

      </div>

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
