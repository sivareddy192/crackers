import React from 'react'
import { useGlobalContext } from '../provider/GlobalProvider'
import { FaCartShopping } from 'react-icons/fa6'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import { Link } from 'react-router-dom'
import { FaCaretRight } from "react-icons/fa";
import { useSelector } from 'react-redux'

const CartMobileLink = () => {
    const { totalPrice, totalQty } = useGlobalContext()
    const cartItem = useSelector(state => state.cartItem.cart)

    return (
        <>
            {
                cartItem[0] && (
                    <div className='fixed bottom-6 left-4 right-4 z-50 pointer-events-none lg:hidden'>
                        <Link 
                            to={"/cart"} 
                            className='bg-green-700 w-full px-5 py-4 rounded-2xl text-white flex items-center justify-between shadow-2xl shadow-green-200 pointer-events-auto active:scale-95 transition-transform'
                        >
                            <div className='flex items-center gap-4'>
                                <div className='bg-white/20 p-2.5 rounded-xl'>
                                    <FaCartShopping size={18} />
                                </div>
                                <div className='flex flex-col'>
                                    <span className='text-[10px] font-black uppercase tracking-widest text-green-200 leading-none mb-1'>{totalQty} {totalQty > 1 ? 'items' : 'item'}</span>
                                    <span className='text-lg font-black leading-none'>{DisplayPriceInRupees(totalPrice)}</span>
                                </div>
                            </div>

                            <div className='flex items-center gap-2 bg-white text-green-700 px-4 py-2 rounded-xl font-black text-sm uppercase tracking-wider'>
                                <span>View Cart</span>
                                <FaCaretRight size={16} />
                            </div>
                        </Link>
                    </div>
                )
            }
        </>
    )
}

export default CartMobileLink
