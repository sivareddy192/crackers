import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useGlobalContext } from '../provider/GlobalProvider'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import { FaCheckCircle, FaSpinner } from 'react-icons/fa'

const Success = () => {
    const location = useLocation()
    const { fetchCartItem, setAppliedCoupon, fetchOrder, fetchUser } = useGlobalContext()
    const [verifying, setVerifying] = useState(false)

    // Extract session_id from URL
    const query = new URLSearchParams(location.search)
    const sessionId = query.get('session_id')

    useEffect(() => {
        const verifyAndRefresh = async () => {
            if (sessionId) {
                setVerifying(true)
                try {
                    await Axios({
                        ...SummaryApi.verify_payment,
                        data: { sessionId }
                    })
                } catch (error) {
                    console.error("Verification failed", error)
                } finally {
                    setVerifying(false)
                }
            }

            // Refresh state regardless of sessionId (for COD or safety)
            if (fetchCartItem) fetchCartItem();
            if (setAppliedCoupon) setAppliedCoupon(null);
            if (fetchOrder) fetchOrder();
            if (fetchUser) fetchUser();
        }

        verifyAndRefresh()
    }, [sessionId])

    return (
        <div className='min-h-[80vh] flex flex-col justify-center items-center p-4'>
            <div className='w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-green-50 flex flex-col items-center text-center space-y-6 animate-slide-in'>
                
                {verifying ? (
                    <div className='flex flex-col items-center gap-4 animate-pulse w-full'>
                        <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center'>
                            <div className='w-8 h-8 bg-gray-200 rounded-full' />
                        </div>
                        <div className='h-6 w-48 bg-gray-200 rounded' />
                        <div className='h-4 w-64 bg-gray-200 rounded' />
                    </div>
                ) : (
                    <>
                        <div className='bg-green-100 p-4 rounded-full'>
                            <FaCheckCircle className='text-6xl text-green-600' />
                        </div>
                        
                        <div className='space-y-2'>
                            <h2 className='text-3xl font-black text-gray-800'>Success!</h2>
                            <p className='text-gray-600 font-medium'>
                                {location?.state?.text === "Order" 
                                    ? "Your order has been placed successfully." 
                                    : "Payment received! Your items are on the way."
                                }
                            </p>
                        </div>

                        <div className='w-full pt-4 space-y-3'>
                            <Link 
                                to="/dashboard/myorders" 
                                className="block w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-green-100"
                            >
                                View My Orders
                            </Link>
                            <Link 
                                to="/" 
                                className="block w-full border-2 border-gray-100 hover:bg-gray-50 text-gray-600 font-bold py-4 rounded-2xl transition-all"
                            >
                                Continue Shopping
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default Success
