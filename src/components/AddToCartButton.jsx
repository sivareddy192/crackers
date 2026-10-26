import React, { useEffect, useState } from 'react'
import { useGlobalContext } from '../provider/GlobalProvider'
import toast from 'react-hot-toast'
import AxiosToastError from '../utils/AxiosToastError'
import ButtonLoading from './ButtonLoading'
import { useSelector } from 'react-redux'
import { FaCartShopping, FaMinus, FaPlus } from "react-icons/fa6";
import { FiShoppingBag } from 'react-icons/fi';

const AddToCartButton = ({ data, variant = "green-pill" }) => {
    const { addItemToCart, updateCartItem, deleteCartItem } = useGlobalContext()
    const [loading, setLoading] = useState(false)
    const cartItem = useSelector(state => state.cartItem.cart)
    const [isAvailableCart, setIsAvailableCart] = useState(false)
    const [qty, setQty] = useState(0)
    const [cartItemDetails, setCartItemsDetails] = useState(null)
    const isHomeOutline = variant === "home-outline"
    const cartToastId = `cart-item-${data?._id || data?.id}-${(data?.unit || "").replace(/\s+/g, "").toLowerCase()}`

    const handleADDTocart = async (e) => {
        e.preventDefault()
        e.stopPropagation()

        try {
            setLoading(true)
            const res = await addItemToCart(data);
            if (res && res.success) {
                const message = res.message === "Item already in cart"
                    ? "This item is already in your cart"
                    : "Added to cart"
                toast.success(message, { id: cartToastId })
            }
        } catch (error) {
            AxiosToastError(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!data || !cartItem) {
            setIsAvailableCart(prev => prev === false ? prev : false)
            setQty(prev => prev === 0 ? prev : 0)
            setCartItemsDetails(prev => prev === null ? prev : null)
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
            setIsAvailableCart(prev => prev === true ? prev : true)
            setQty(prev => prev === product.quantity ? prev : product.quantity)
            setCartItemsDetails(prev => (prev?._id === product._id && prev?.quantity === product.quantity) ? prev : product)
        } else {
            setIsAvailableCart(prev => prev === false ? prev : false)
            setQty(prev => prev === 0 ? prev : 0)
            setCartItemsDetails(prev => prev === null ? prev : null)
        }
    }, [data?._id, data?.id, data?.unit, cartItem])

    const increaseQty = async (e) => {
        e.preventDefault()
        e.stopPropagation()

        try {
            setLoading(true)
            const response = await updateCartItem(cartItemDetails?._id, qty + 1)
            if (response && response.success) {
                toast.success("Cart updated", { id: cartToastId })
            }
        } catch (error) {
            AxiosToastError(error)
        } finally {
            setLoading(false)
        }
    }

    const decreaseQty = async (e) => {
        e.preventDefault()
        e.stopPropagation()

        try {
            setLoading(true)
            if (qty === 1) {
                await deleteCartItem(cartItemDetails?._id)
            } else {
                const response = await updateCartItem(cartItemDetails?._id, qty - 1)
                if (response && response.success) {
                    toast.success("Cart updated", { id: cartToastId })
                }
            }
        } catch (error) {
            AxiosToastError(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className='w-full select-none'>
            {isAvailableCart ? (
                <div
                    className={
                        isHomeOutline
                            ? `flex h-9 items-center justify-between overflow-hidden rounded-lg border border-orange-500 bg-white text-orange-600 transition-all hover:bg-orange-50 ${loading ? 'opacity-75' : ''}`
                            : variant === "orange-full"
                                ? `flex items-center justify-between bg-gradient-to-r from-indigo-600 via-indigo-600 to-blue-600 text-white rounded-xl overflow-hidden h-10 shadow-md shadow-indigo-600/20 border border-indigo-500/40 transition-all ${loading ? 'opacity-75' : ''}`
                                : `flex items-center justify-between bg-gradient-to-r from-indigo-600 via-indigo-600 to-blue-600 text-white rounded-full overflow-hidden h-9 shadow-md shadow-indigo-600/20 border border-indigo-500/40 transition-all ${loading ? 'opacity-75' : ''}`
                    }
                >
                    <button
                        onClick={decreaseQty}
                        disabled={loading}
                        aria-label="Decrease quantity"
                        className={`w-10 h-full flex items-center justify-center transition-all active:scale-90 disabled:opacity-50 cursor-pointer ${isHomeOutline ? 'hover:bg-orange-100' : 'hover:bg-black/15'}`}
                    >
                        <FaMinus size={11} className="drop-shadow-xs" />
                    </button>
                    <span className='flex-1 text-center font-extrabold text-sm tabular-nums tracking-tight'>
                        {qty}
                    </span>
                    <button
                        onClick={increaseQty}
                        disabled={loading}
                        aria-label="Increase quantity"
                        className={`w-10 h-full flex items-center justify-center transition-all active:scale-90 disabled:opacity-50 cursor-pointer ${isHomeOutline ? 'hover:bg-orange-100' : 'hover:bg-black/15'}`}
                    >
                        <FaPlus size={11} className="drop-shadow-xs" />
                    </button>
                </div>
            ) : (
                variant === "orange-full" || isHomeOutline ? (
                    <button
                        onClick={handleADDTocart}
                        disabled={loading}
                        className={`w-full font-extrabold transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 disabled:opacity-70 cursor-pointer tracking-wide ${
                            isHomeOutline
                                ? 'h-9 rounded-lg border border-orange-500 bg-white text-[11px] text-slate-900 hover:bg-orange-50'
                                : 'h-10 bg-gradient-to-r from-indigo-600 via-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl text-xs shadow-md shadow-indigo-600/25 hover:shadow-lg hover:shadow-indigo-600/35'
                        }`}
                    >
                        {loading ? (
                            <ButtonLoading />
                        ) : (
                            <>
                                {isHomeOutline
                                    ? <FaCartShopping size={14} className="text-orange-600" />
                                    : <FiShoppingBag size={14} className="stroke-[2.5]" />
                                }
                                <span>Add to Cart</span>
                            </>
                        )}
                    </button>
                ) : (
                    <button
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