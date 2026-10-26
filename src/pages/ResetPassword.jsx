import React, { useEffect, useState } from 'react'
import { FaRegEye, FaRegEyeSlash } from 'react-icons/fa6'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import SummaryApi from '../common/SummaryApi'
import toast from 'react-hot-toast'
import AxiosToastError from '../utils/AxiosToastError'
import Axios from '../utils/Axios'

const ResetPassword = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const [data, setData] = useState({
    email: "",
    newPassword: "",
    confirmPassword: ""
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [passwordError, setPasswordError] = useState("")
  const [confirmError, setConfirmError] = useState("")

  const [strength, setStrength] = useState(0)

  const valideValue = Object.values(data).every(el => el)
  const isStrongPassword = strength === 4 && !passwordError

  useEffect(() => {
    if (!(location?.state?.data?.success)) {
      navigate("/")
    }

    if (location?.state?.email) {
      setData((prev) => ({
        ...prev,
        email: location?.state?.email
      }))
    }
  }, [])

  const strengthNames = ["Very Weak", "Weak", "Medium", "Strong"]
  const strengthColors = ["#ff0000", "#ff5e00", "#ffcc00", "#00c853"]

  const handleChange = (e) => {
    const { name, value } = e.target

    setData((prev) => ({
      ...prev,
      [name]: value
    }))

    if (name === "newPassword") {
      let score = 0

      if (value.length >= 8) score++
      if (/^[A-Z]/.test(value)) score++
      if (/[0-9]/.test(value)) score++
      if (/[!@#$%^&*]/.test(value)) score++

      setStrength(score)

      if (!value) {
        setPasswordError("Password cannot be empty.")
      } else if (!/^[A-Z]/.test(value[0])) {
        setPasswordError("First letter must be uppercase.")
      } else if (!/[0-9]/.test(value)) {
        setPasswordError("Password must contain at least one number.")
      } else if (!/[!@#$%^&*]/.test(value)) {
        setPasswordError("Password must contain at least one special character (!@#$%^&*).")
      } else if (value.length < 8) {
        setPasswordError("Password must be at least 8 characters long.")
      } else {
        setPasswordError("")
      }

      if (data.confirmPassword) {
        if (value === data.confirmPassword) {
          setConfirmError("Passwords match ✔")
        } else {
          setConfirmError("Passwords do not match ✘")
        }
      }
    }

    if (name === "confirmPassword") {
      if (!value) {
        setConfirmError("")
      } else if (value !== data.newPassword) {
        setConfirmError("Passwords do not match ✘")
      } else {
        setConfirmError("Passwords match ✔")
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!isStrongPassword) {
      toast.error("Password is not strong enough.")
      return
    }

    if (data.newPassword !== data.confirmPassword) {
      toast.error("New Password and Confirm Password must be same.")
      return
    }

    try {
      const response = await Axios({
        ...SummaryApi.resetPassword,
        data: data
      })

      if (response.data.error) {
        toast.error(response.data.message)
      }

      if (response.data.success) {
        toast.success(response.data.message)
        navigate("/login")
        setData({
          email: "",
          newPassword: "",
          confirmPassword: ""
        })
      }

    } catch (error) {
      AxiosToastError(error)
    }
  }

  return (
    <section className='w-full container mx-auto px-2'>
      <div className='bg-white my-4 w-full max-w-lg mx-auto rounded p-7'>
        <p className='font-semibold text-lg'>Enter Your Password</p>

        <form className='grid gap-4 py-4' onSubmit={handleSubmit}>

          <div className='grid gap-1'>
            <label htmlFor='newPassword'>New Password :</label>
            <div className='bg-blue-50 p-2 border rounded flex items-center focus-within:border-primary-200'>
              <input
                type={showPassword ? "text" : "password"}
                id='newPassword'
                className='w-full outline-none'
                name='newPassword'
                value={data.newPassword}
                onChange={handleChange}
                placeholder='Enter your new password'
              />
              <div onClick={() => setShowPassword(prev => !prev)} className='cursor-pointer'>
                {showPassword ? <FaRegEye /> : <FaRegEyeSlash />}
              </div>
            </div>

            {data.newPassword && (
              <>
                <div className='w-full h-2 bg-gray-300 rounded'>
                  <div
                    className='h-2 rounded transition-all duration-500 ease-out'
                    style={{
                      width: `${strength * 25}%`,
                      background: strengthColors[strength - 1] || "#ddd"
                    }}
                  ></div>
                </div>

                <p className='text-sm'>
                  Strength:{" "}
                  <span
                    className='font-semibold'
                    style={{ color: strengthColors[strength - 1] || "#555" }}
                  >
                    {strengthNames[strength - 1] || "None"}
                  </span>
                </p>
              </>
            )}

            {passwordError && (
              <p className='text-red-600 text-sm'>{passwordError}</p>
            )}
          </div>

          <div className='grid gap-1'>
            <label htmlFor='confirmPassword'>Confirm Password :</label>
            <div className='bg-blue-50 p-2 border rounded flex items-center focus-within:border-primary-200'>
              <input
                type={showConfirmPassword ? "text" : "password"}
                id='confirmPassword'
                className='w-full outline-none'
                name='confirmPassword'
                value={data.confirmPassword}
                onChange={handleChange}
                placeholder='Enter your confirm password'
              />
              <div onClick={() => setShowConfirmPassword(prev => !prev)} className='cursor-pointer'>
                {showConfirmPassword ? <FaRegEye /> : <FaRegEyeSlash />}
              </div>
            </div>

            {confirmError && (
              <p className={`${confirmError.includes("✔") ? "text-green-600" : "text-red-600"} text-sm`}>
                {confirmError}
              </p>
            )}
          </div>

          <button
            type="submit"
            className={`${valideValue && isStrongPassword ? "bg-green-800 hover:bg-green-700" : "bg-gray-500"} 
            text-white py-2 rounded font-semibold my-3 tracking-wide`}>
            Change Password
          </button>
        </form>

        <p>
          Already have account?{" "}
          <Link to={"/login"} className='font-semibold text-green-700 hover:text-green-800'>
            Login
          </Link>
        </p>
      </div>
    </section>
  )
}

export default ResetPassword
