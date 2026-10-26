import React, { useState } from 'react'
import { FaRegEyeSlash, FaRegEye } from "react-icons/fa6";
import toast from 'react-hot-toast';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from '../utils/AxiosToastError';
import { Link, useNavigate } from 'react-router-dom';
import fetchUserDetails from '../utils/fetchUserDetails';
import { useDispatch } from 'react-redux';
import { setUserDetails } from '../store/userSlice';
import image from "../assets/trace-logo.avif";
import { FiLock, FiMail } from 'react-icons/fi';

const Login = () => {
  const [data, setData] = useState({
    email: "",
    password: ""
  })
  const [showPassword, setShowPassword] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const handleChange = (e) => {
    const { name, value } = e.target

    setData((preve) => ({
      ...preve,
      [name]: value
    }))

    if (name === "password") {
      if (value.length < 8) {
        setPasswordError("Password must be at least 8 characters long.")
      } else if (!/^[A-Z]/.test(value)) {
        setPasswordError("Password must start with an uppercase letter.")
      } else if (!/[0-9]/.test(value)) {
        setPasswordError("Password must contain at least one number.")
      } else if (!/[!@#$%^&*]/.test(value)) {
        setPasswordError("Password must contain at least one special character (!@#$%^&*).")
      } else {
        setPasswordError("")
      }
    }
  }

  const valideValue = Object.values(data).every(el => el)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (passwordError) {
      toast.error("Please enter a strong password before Login.")
      return
    }

    try {
      setLoading(true)
      const response = await Axios({
        ...SummaryApi.login,
        data: data
      })

      if (response.data.error) {
        toast.error(response.data.message)
      }

      if (response.data.success) {
        toast.success(response.data.message)
        localStorage.setItem('accessToken', response.data.data.accessToken)
        localStorage.setItem('refreshToken', response.data.data.refreshToken)

        const userDetails = await fetchUserDetails()
        dispatch(setUserDetails(userDetails.data))

        setData({
          email: "",
          password: "",
        })

        if (userDetails.data.role === "ADMIN") {
          navigate("/dashboard/Admin-Orders")
        } else if (userDetails.data.role === "DELIVERY_BOY") {
          navigate("/dashboard/delivery-boy")
        } else {
          navigate("/")
        }
      }

    } catch (error) {
      AxiosToastError(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className='w-full min-h-[75vh] flex items-center justify-center container mx-auto px-4 py-8'>
      <div className='bg-white my-4 w-full max-w-md mx-auto rounded-3xl p-8 border border-slate-200/80 shadow-xl shadow-slate-900/5 transition-all'>
        <div className='flex flex-col items-center text-center mb-6'>
          <img src={image} alt="Trace" className='w-32 h-auto mb-3' />
          <h2 className='text-2xl font-black text-slate-900 tracking-tight font-heading'>Welcome Back</h2>
          <p className='text-xs font-medium text-slate-500 mt-1'>Log in to manage orders, cart & addresses</p>
        </div>

        <form className='grid gap-4' onSubmit={handleSubmit}>
          <div className='space-y-1.5'>
            <label htmlFor='email' className='text-xs font-bold text-slate-700'>Email Address</label>
            <div className='bg-slate-50/70 border border-slate-200 rounded-2xl flex items-center px-3.5 focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-3 focus-within:ring-indigo-500/15 transition-all'>
              <FiMail className='text-slate-400 mr-2 shrink-0' size={17} />
              <input
                type='email'
                id='email'
                className='w-full py-3 bg-transparent outline-none text-sm text-slate-800 placeholder:text-slate-400 font-medium'
                name='email'
                value={data.email}
                onChange={handleChange}
                placeholder='name@example.com'
                required
              />
            </div>
          </div>

          <div className='space-y-1.5'>
            <div className='flex items-center justify-between'>
              <label htmlFor='password' className='text-xs font-bold text-slate-700'>Password</label>
              <Link to={"/forgot-password"} className='text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors'>
                Forgot password?
              </Link>
            </div>
            <div className='bg-slate-50/70 border border-slate-200 rounded-2xl flex items-center px-3.5 focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-3 focus-within:ring-indigo-500/15 transition-all'>
              <FiLock className='text-slate-400 mr-2 shrink-0' size={17} />
              <input
                type={showPassword ? "text" : "password"}
                id='password'
                name='password'
                className='w-full py-3 bg-transparent outline-none text-sm text-slate-800 placeholder:text-slate-400 font-medium'
                value={data.password}
                onChange={handleChange}
                placeholder='Enter your password'
                required
              />
              <button
                type='button'
                onClick={() => setShowPassword(preve => !preve)}
                className='cursor-pointer text-slate-400 hover:text-slate-600 transition-colors ml-2'
              >
                {showPassword ? <FaRegEye size={16} /> : <FaRegEyeSlash size={16} />}
              </button>
            </div>

            {passwordError ? (
              <p className='text-rose-500 text-[11px] font-semibold mt-1'>{passwordError}</p>
            ) : (
              data.password && <p className='text-emerald-600 text-[11px] font-bold mt-1'>✓ Strong password</p>
            )}
          </div>

          <button
            disabled={!valideValue || loading}
            className={`w-full py-3.5 rounded-2xl font-extrabold text-xs uppercase tracking-wider transition-all active:scale-[0.98] shadow-md mt-2 ${
              valideValue && !loading
                ? "bg-gradient-to-r from-indigo-600 via-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-indigo-600/25 hover:shadow-lg hover:shadow-indigo-600/30 cursor-pointer"
                : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
            }`}
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <div className='mt-6 pt-6 border-t border-slate-100 text-center text-xs text-slate-500'>
          Don't have an account?{" "}
          <Link to={"/register"} className='font-bold text-indigo-600 hover:text-indigo-700 transition-colors ml-1'>
            Create Account
          </Link>
        </div>
      </div>
    </section>
  )
}

export default Login
