import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useGlobalContext } from '../provider/GlobalProvider'
import toast from 'react-hot-toast'
import AxiosToastError from '../utils/AxiosToastError'
import ButtonLoading from './ButtonLoading'
import { useSelector, useDispatch } from 'react-redux'
import { FaMinus, FaPlus, FaCartShopping } from "react-icons/fa6";
import { FiShoppingBag } from 'react-icons/fi';
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import { updateCartItemQtyOptimistic, removeCartItemOptimistic } from '../store/cartProduct'

const AddToCartButton = ({ data, variant = "green-pill" }) => {
    const { addItemToCart, deleteCartItem, fetchCartItem } = useGlobalContext()
    const dispatch = useDispatch()
    const [loading, setLoading] = useState(false)
    const cartItem = useSelector(state => state.cartItem.cart)
    const [isAvailableCart, setIsAvailableCart] = useState(false)
    const [qty, setQty] = useState(0)
    const [inputValue, setInputValue] = useState("0")
    const [cartItemDetails, setCartItemsDetails] = useState(null)

    const isHomeOutline = variant === "home-outline"
    const isOrangeFull = variant === "orange-full"
    const cartToastId = `cart-item-${data?._id || data?.id}-${(data?.unit || "").replace(/\s+/g, "").toLowerCase()}`

    const debounceTimeoutRef = useRef(null)
    const pendingQtyRef = useRef(null)
    const isFocusedRef = useRef(false)

    // Sync with Redux cart state when not actively typing
    useEffect(() => {
        if (!data || !cartItem) {
            if (!isFocusedRef.current) {
                setIsAvailableCart(false)
                setQty(0)
                setInputValue("0")
                setCartItemsDetails(null)
            }
            return
        }

        const productId = data._id || data.id
        if (!productId) return
        const normalize = (str) => (str || "").toString().replace(/\s+/g, "").toLowerCase()
        const currentUnit = normalize(data.unit)
        const product = cartItem.find(item => {
            const itemProductId = item.productId?._id || item.productId?.id || item.productId
            const idMatch = itemProductId?.toString() === productId?.toString()
            const unitMatch = normalize(item.unit) === currentUnit
            return idMatch && unitMatch
        })

        if (product) {
            setIsAvailableCart(true)
            setCartItemsDetails(product)
            if (!isFocusedRef.current && pendingQtyRef.current === null) {
                setQty(product.quantity)
                setInputValue(String(product.quantity))
            }
        } else {
            if (!isFocusedRef.current && pendingQtyRef.current === null) {
                setIsAvailableCart(false)
                setQty(0)
                setInputValue("0")
                setCartItemsDetails(null)
            }
        }
    }, [data?._id, data?.id, data?.unit, cartItem])

    // Cleanup debounce timer on unmount
    useEffect(() => {
        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        }
    }, [])

    // Debounced server sync
    const debouncedSyncQty = useCallback((cartId, targetQty) => {
        if (!cartId) return

        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current)
        }

        debounceTimeoutRef.current = setTimeout(async () => {
            try {
                const response = await Axios({
                    ...SummaryApi.updateCartItemQty,
                    data: {
                        _id: cartId,
                        qty: targetQty,
                    },
                })

                if (!response.data?.success) {
                    fetchCartItem()
                }
            } catch (error) {
                fetchCartItem()
                AxiosToastError(error)
            } finally {
                pendingQtyRef.current = null
            }
        }, 320)
    }, [fetchCartItem])

    // First time add to cart
    const handleADDTocart = async (e) => {
        e.preventDefault()
        e.stopPropagation()

        try {
            setLoading(true)
            // Instant optimistic update to 1
            setIsAvailableCart(true)
            setQty(1)
            setInputValue("1")
            pendingQtyRef.current = 1

            const res = await addItemToCart(data)
            if (res && res.success) {
                toast.success(res.message === "Item already in cart" ? "Item in cart" : "Added to cart", { id: cartToastId })
            } else if (res && !res.success) {
                setIsAvailableCart(false)
                setQty(0)
                setInputValue("0")
                pendingQtyRef.current = null
            }
        } catch (error) {
            setIsAvailableCart(false)
            setQty(0)
            setInputValue("0")
            pendingQtyRef.current = null
            AxiosToastError(error)
        } finally {
            setLoading(false)
            pendingQtyRef.current = null
        }
    }

    // Instant increase (+)
    const increaseQty = (e) => {
        e.preventDefault()
        e.stopPropagation()

        const current = pendingQtyRef.current !== null ? pendingQtyRef.current : qty
        const stock = data?.stock
        if (stock && current >= stock) {
            toast.error(`Max stock available: ${stock}`, { id: "max-stock-toast" })
            return
        }

        const nextQty = current + 1
        pendingQtyRef.current = nextQty
        setQty(nextQty)
        setInputValue(String(nextQty))

        if (cartItemDetails?._id) {
            dispatch(updateCartItemQtyOptimistic({ _id: cartItemDetails._id, qty: nextQty }))
            debouncedSyncQty(cartItemDetails._id, nextQty)
        }
    }

    // Instant decrease (-)
    const decreaseQty = (e) => {
        e.preventDefault()
        e.stopPropagation()

        const current = pendingQtyRef.current !== null ? pendingQtyRef.current : qty
        const nextQty = current - 1

        if (nextQty <= 0) {
            // Remove completely from cart immediately
            pendingQtyRef.current = 0
            setQty(0)
            setInputValue("0")
            setIsAvailableCart(false)

            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current)
            }

            if (cartItemDetails?._id) {
                dispatch(removeCartItemOptimistic(cartItemDetails._id))
                deleteCartItem(cartItemDetails._id)
            }
            return
        }

        pendingQtyRef.current = nextQty
        setQty(nextQty)
        setInputValue(String(nextQty))

        if (cartItemDetails?._id) {
            dispatch(updateCartItemQtyOptimistic({ _id: cartItemDetails._id, qty: nextQty }))
            debouncedSyncQty(cartItemDetails._id, nextQty)
        }
    }

    // Direct input change
    const handleDirectChange = (e) => {
        const raw = e.target.value
        if (raw === "") {
            setInputValue("")
            return
        }

        const digits = raw.replace(/\D/g, "")
        if (!digits) {
            setInputValue("")
            return
        }

        let parsed = parseInt(digits, 10)
        const stock = data?.stock
        if (stock && parsed > stock) {
            toast.error(`Max stock available: ${stock}`, { id: "max-stock-toast" })
            parsed = stock
        }

        setInputValue(String(parsed))
        setQty(parsed)
        pendingQtyRef.current = parsed

        if (cartItemDetails?._id) {
            dispatch(updateCartItemQtyOptimistic({ _id: cartItemDetails._id, qty: parsed }))
            debouncedSyncQty(cartItemDetails._id, parsed)
        }
    }

    // Direct input blur
    const handleInputBlur = () => {
        isFocusedRef.current = false
        const parsed = parseInt(inputValue, 10)

        if (!Number.isFinite(parsed) || parsed <= 0) {
            const fallback = qty > 0 ? qty : 1
            setInputValue(String(fallback))
            setQty(fallback)
            pendingQtyRef.current = fallback
            if (cartItemDetails?._id) {
                dispatch(updateCartItemQtyOptimistic({ _id: cartItemDetails._id, qty: fallback }))
                debouncedSyncQty(cartItemDetails._id, fallback)
            }
        } else {
            setInputValue(String(parsed))
            setQty(parsed)
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault()
            e.target.blur()
        } else if (e.key === "ArrowUp") {
            e.preventDefault()
            increaseQty(e)
        } else if (e.key === "ArrowDown") {
            e.preventDefault()
            decreaseQty(e)
        }
    }

    const isOrangeTheme = isHomeOutline || isOrangeFull

    return (
        <div className='w-full select-none'>
            {isAvailableCart ? (
                <div
                    onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                    }}
                    className={
                        isHomeOutline
                            ? 'flex h-9 sm:h-10 items-center justify-between overflow-hidden rounded-xl border-2 border-orange-500 bg-white text-orange-600 shadow-2xs transition-all'
                            : isOrangeFull
                                ? 'flex h-11 items-center justify-between overflow-hidden rounded-xl border-2 border-orange-500 bg-white text-orange-600 shadow-sm transition-all'
                                : 'flex h-9 items-center justify-between overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-600/20 border border-indigo-500/40 transition-all'
                    }
                >
                    <button
                        type="button"
                        onClick={decreaseQty}
                        aria-label="Decrease quantity"
                        className={`w-9 sm:w-10 h-full flex items-center justify-center transition-all active:scale-75 cursor-pointer shrink-0 ${
                            isOrangeTheme ? 'hover:bg-orange-100/70 text-orange-600' : 'hover:bg-black/15 text-white'
                        }`}
                    >
                        <FaMinus size={11} className="drop-shadow-xs" />
                    </button>

                    <div className="flex-1 flex items-center justify-center px-1 min-w-0">
                        <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={inputValue}
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                            }}
                            onFocus={(e) => {
                                isFocusedRef.current = true
                                e.target.select()
                            }}
                            onChange={handleDirectChange}
                            onBlur={handleInputBlur}
                            onKeyDown={handleKeyDown}
                            className={`w-full min-w-0 text-center font-black text-sm sm:text-base tabular-nums bg-transparent outline-none border-none p-0 focus:ring-0 select-text cursor-text [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                isOrangeTheme ? 'text-orange-600' : 'text-white'
                            }`}
                            aria-label="Product quantity input"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={increaseQty}
                        aria-label="Increase quantity"
                        className={`w-9 sm:w-10 h-full flex items-center justify-center transition-all active:scale-75 cursor-pointer shrink-0 ${
                            isOrangeTheme ? 'hover:bg-orange-100/70 text-orange-600' : 'hover:bg-black/15 text-white'
                        }`}
                    >
                        <FaPlus size={11} className="drop-shadow-xs" />
                    </button>
                </div>
            ) : (
                isOrangeTheme ? (
                    <button
                        type="button"
                        onClick={handleADDTocart}
                        disabled={loading}
                        className={`w-full font-extrabold transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 disabled:opacity-70 cursor-pointer tracking-wide ${
                            isHomeOutline
                                ? 'h-9 sm:h-10 rounded-xl border-2 border-orange-500 bg-white text-xs font-black text-orange-600 hover:bg-orange-50 shadow-2xs'
                                : 'h-11 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl text-sm font-black shadow-md shadow-orange-500/25 hover:shadow-lg'
                        }`}
                    >
                        {loading ? (
                            <ButtonLoading />
                        ) : (
                            <>
                                {isHomeOutline
                                    ? <FaCartShopping size={14} className="text-orange-600" />
                                    : <FiShoppingBag size={16} className="stroke-[2.5]" />
                                }
                                <span>Add to Cart</span>
                            </>
                        )}
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={handleADDTocart}
                        disabled={loading}
                        className='w-full h-9 bg-white text-indigo-600 border-2 border-indigo-600 hover:bg-indigo-600 hover:text-white font-extrabold rounded-full text-[11px] uppercase tracking-wider transition-all active:scale-[0.97] flex items-center justify-center gap-1 shadow-xs hover:shadow-md hover:shadow-indigo-600/20 disabled:opacity-70 cursor-pointer group'
                    >
                        {loading ? (
                            <ButtonLoading />
                        ) : (
                            <>
                                <FaPlus size={10} className="group-hover:rotate-90 transition-transform duration-300" />
                                <span>Add</span>
                            </>
                        )}
                    </button>
                )
            )}
        </div>
    )
}

export default AddToCartButton