import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import toast from 'react-hot-toast'
import { FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa'

const VerifyEmail = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [status, setStatus] = useState('pending') // pending, success, error

    const params = new URLSearchParams(location.search)
    const code = params.get('code')

    const verifyEmail = async () => {
        if (!code) {
            setStatus('error')
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            const response = await Axios({
                ...SummaryApi.verifyEmail,
                data: { code }
            })

            if (response.data.success) {
                setStatus('success')
                toast.success(response.data.message)
                setTimeout(() => {
                    navigate('/login')
                }, 3000)
            } else {
                setStatus('error')
                toast.error(response.data.message)
            }
        } catch (error) {
            setStatus('error')
            const errorMessage = error?.response?.data?.message || "Verification failed."
            toast.error(errorMessage)
            console.log(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        verifyEmail()
    }, [code])

    return (
        <section className='min-h-[70vh] flex items-center justify-center p-4 bg-gray-50'>
            <div className='max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-xl text-center border border-gray-100 animate-in fade-in zoom-in duration-300'>
                {loading ? (
                    <div className='flex flex-col items-center gap-6 animate-pulse'>
                        <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center'>
                            <div className='w-8 h-8 bg-gray-200 rounded-full' />
                        </div>
                        <div className='space-y-2 w-full flex flex-col items-center'>
                            <div className='h-6 w-32 bg-gray-200 rounded' />
                            <div className='h-4 w-48 bg-gray-200 rounded' />
                        </div>
                    </div>
                ) : status === 'success' ? (
                    <div className='flex flex-col items-center gap-6'>
                        <FaCheckCircle size={80} className='text-green-600 animate-bounce' />
                        <div>
                            <h2 className='text-2xl font-black text-gray-900 uppercase tracking-tighter'>Email Verified!</h2>
                            <p className='text-gray-500 font-medium mt-2'>Your account is now secure. Redirecting to login...</p>
                        </div>
                        <button 
                            onClick={() => navigate('/login')}
                            className='mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-black text-xs uppercase tracking-widest py-4 rounded-2xl transition-all shadow-lg shadow-green-100'
                        >
                            Go to Login
                        </button>
                    </div>
                ) : (
                    <div className='flex flex-col items-center gap-6'>
                        <FaTimesCircle size={80} className='text-red-500' />
                        <div>
                            <h2 className='text-2xl font-black text-gray-900 uppercase tracking-tighter'>Verification Failed</h2>
                            <p className='text-gray-500 font-medium mt-2'>The verification link is invalid or has expired.</p>
                        </div>
                        <button 
                            onClick={() => navigate('/login')}
                            className='mt-4 w-full bg-gray-900 hover:bg-gray-800 text-white font-black text-xs uppercase tracking-widest py-4 rounded-2xl transition-all shadow-lg shadow-gray-200'
                        >
                            Back to Login
                        </button>
                    </div>
                )}
            </div>
        </section>
    )
}

export default VerifyEmail
