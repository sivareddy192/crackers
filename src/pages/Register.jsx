import React, { useState } from 'react'
import { FaRegEyeSlash, FaRegEye } from "react-icons/fa6";
import toast from 'react-hot-toast';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from '../utils/AxiosToastError';
import { Link, useNavigate } from 'react-router-dom';
import image from "../assets/trace-logo.avif";
import { FiLock, FiMail, FiUser } from 'react-icons/fi';

const Register = () => {
  const [data, setData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const [passwordError, setPasswordError] = useState("")
  const [confirmError, setConfirmError] = useState("")
  const [strength, setStrength] = useState(0)

  const navigate = useNavigate()

  const calculateStrength = (pwd) => {
    let score = 0;
    if (pwd.length >= 8) score += 25;
    if (/^[A-Z]/.test(pwd)) score += 25;
    if (/[0-9]/.test(pwd)) score += 25;
    if (/[!@#$%^&*]/.test(pwd)) score += 25;
    return score;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setData((prev) => ({
      ...prev,
      [name]: value
    }));

    if (name === "password") {
      setStrength(calculateStrength(value));

      if (!value) {
        setPasswordError("Password cannot be empty.");
      }
      else if (!/^[A-Z]/.test(value)) {
        setPasswordError("First letter must be uppercase.");
      }
      else if (!/[0-9]/.test(value)) {
        setPasswordError("Password must contain at least one number.");
      }
      else if (!/[!@#$%^&*]/.test(value)) {
        setPasswordError("Password must contain at least one special character.");
      }
      else if (value.length < 8) {
        setPasswordError("Password must be at least 8 characters long.");
      }
      else {
        setPasswordError("");
      }

      if (data.confirmPassword) {
        if (value === data.confirmPassword) {
          setConfirmError("Passwords match");
        } else {
          setConfirmError("Passwords do not match");
        }
      }
    }

    if (name === "confirmPassword") {
      if (!value) {
        setConfirmError("");
      }
      else if (value !== data.password) {
        setConfirmError("Passwords do not match");
      }
      else {
        setConfirmError("Passwords match");
      }
    }
  };

  const isStrongPassword = strength === 100 && !passwordError;
  const valideValue = Object.values(data).every(el => el)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!isStrongPassword) {
      toast.error("Password is not strong enough!");
      return;
    }

    if (data.password !== data.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setLoading(true)
      const response = await Axios({
        ...SummaryApi.register,
        data: data
      })

      if (response.data.error) {
        toast.error(response.data.message)
      }

      if (response.data.success) {
        toast.success("Verification mail sent to your mail", { duration: 5000 })
        setData({
          name: "",
          email: "",
          password: "",
          confirmPassword: ""
        })
        navigate("/login")
      }

    } catch (error) {
      AxiosToastError(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className='w-full min-h-[80vh] flex items-center justify-center container mx-auto px-4 py-8'>
      <div className='bg-white my-4 w-full max-w-md mx-auto rounded-3xl p-8 border border-slate-200/80 shadow-xl shadow-slate-900/5 transition-all'>
        <div className='flex flex-col items-center text-center mb-6'>
          <img src={image} alt="Trace" className='w-32 h-auto mb-3' />
          <h2 className='text-2xl font-black text-slate-900 tracking-tight font-heading'>Create Account</h2>
          <p className='text-xs font-medium text-slate-500 mt-1'>Join Trace to explore crackers and fireworks for your celebrations</p>
        </div>

        <form className='grid gap-4' onSubmit={handleSubmit}>
          <div className='space-y-1.5'>
            <label htmlFor='name' className='text-xs font-bold text-slate-700'>Full Name</label>
            <div className='bg-slate-50/70 border border-slate-200 rounded-2xl flex items-center px-3.5 focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-3 focus-within:ring-indigo-500/15 transition-all'>
              <FiUser className='text-slate-400 mr-2 shrink-0' size={17} />
              <input
                type='text'
                id='name'
                name='name'
                autoComplete='name'
                className='w-full py-3 bg-transparent outline-none text-sm text-slate-800 placeholder:text-slate-400 font-medium'
                value={data.name}
                onChange={handleChange}
                placeholder='John Doe'
                autoFocus
                required
              />
            </div>
          </div>

          <div className='space-y-1.5'>
            <label htmlFor='email' className='text-xs font-bold text-slate-700'>Email Address</label>
            <div className='bg-slate-50/70 border border-slate-200 rounded-2xl flex items-center px-3.5 focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-3 focus-within:ring-indigo-500/15 transition-all'>
              <FiMail className='text-slate-400 mr-2 shrink-0' size={17} />
              <input
                type='email'
                id='email'
                name='email'
                autoComplete='email'
                className='w-full py-3 bg-transparent outline-none text-sm text-slate-800 placeholder:text-slate-400 font-medium'
                value={data.email}
                onChange={handleChange}
                placeholder='name@example.com'
                required
              />
            </div>
          </div>

          <div className='space-y-1.5'>
            <label htmlFor='password' className='text-xs font-bold text-slate-700'>Password</label>
            <div className='bg-slate-50/70 border border-slate-200 rounded-2xl flex items-center px-3.5 focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-3 focus-within:ring-indigo-500/15 transition-all'>
              <FiLock className='text-slate-400 mr-2 shrink-0' size={17} />
              <input
                type={showPassword ? "text" : "password"}
                id='password'
                name='password'
                autoComplete='new-password'
                className='w-full py-3 bg-transparent outline-none text-sm text-slate-800 placeholder:text-slate-400 font-medium'
                value={data.password}
                onChange={handleChange}
                placeholder='Create a password'
                required
              />
              <button
                type='button'
                onClick={() => setShowPassword(prev => !prev)}
                className='cursor-pointer text-slate-400 hover:text-slate-600 transition-colors ml-2'
              >
                {showPassword ? <FaRegEye size={16} /> : <FaRegEyeSlash size={16} />}
              </button>
            </div>

            {data.password && (
              <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full transition-all duration-300 rounded-full"
                  style={{
                    width: `${strength}%`,
                    backgroundColor:
                      strength < 50 ? "#EF4444" :
                      strength < 75 ? "#F59E0B" :
                      "#4F46E5"
                  }}
                ></div>
              </div>
            )}

            {passwordError ? (
              <p className='text-rose-500 text-[11px] font-semibold mt-1'>{passwordError}</p>
            ) : (
              data.password && <p className='text-indigo-600 text-[11px] font-bold mt-1'>✓ Strong password</p>
            )}
          </div>

          <div className='space-y-1.5'>
            <label htmlFor='confirmPassword' className='text-xs font-bold text-slate-700'>Confirm Password</label>
            <div className='bg-slate-50/70 border border-slate-200 rounded-2xl flex items-center px-3.5 focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-3 focus-within:ring-indigo-500/15 transition-all'>
              <FiLock className='text-slate-400 mr-2 shrink-0' size={17} />
              <input
                type={showConfirmPassword ? "text" : "password"}
                id='confirmPassword'
                name='confirmPassword'
                autoComplete='new-password'
                className='w-full py-3 bg-transparent outline-none text-sm text-slate-800 placeholder:text-slate-400 font-medium'
                value={data.confirmPassword}
                onChange={handleChange}
                placeholder='Confirm password'
                required
              />
              <button
                type='button'
                onClick={() => setShowConfirmPassword(prev => !prev)}
                className='cursor-pointer text-slate-400 hover:text-slate-600 transition-colors ml-2'
              >
                {showConfirmPassword ? <FaRegEye size={16} /> : <FaRegEyeSlash size={16} />}
              </button>
            </div>

            {confirmError && (
              <p className={`${confirmError.includes("match") && !confirmError.includes("not") ? "text-indigo-600" : "text-rose-500"} text-[11px] font-bold mt-1`}>
                {confirmError}
              </p>
            )}
          </div>

          <button
            disabled={!valideValue || !isStrongPassword || loading}
            className={`w-full py-3.5 rounded-2xl font-extrabold text-xs uppercase tracking-wider transition-all active:scale-[0.98] shadow-md mt-2 ${
              valideValue && isStrongPassword && !loading
                ? "bg-gradient-to-r from-indigo-600 via-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-indigo-600/25 hover:shadow-lg hover:shadow-indigo-600/30 cursor-pointer"
                : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
            }`}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className='mt-6 pt-6 border-t border-slate-100 text-center text-xs text-slate-500'>
          Already have an account?{" "}
          <Link to={"/login"} className='font-bold text-indigo-600 hover:text-indigo-700 transition-colors ml-1'>
            Log In
          </Link>
        </div>
      </div>
    </section>
  )
}

export default Register;
