import React, { useState } from 'react'
import { FaRegUserCircle } from 'react-icons/fa'
import { useDispatch, useSelector } from 'react-redux'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import AxiosToastError from '../utils/AxiosToastError'
import { updatedAvatar } from '../store/userSlice'
import { IoClose } from "react-icons/io5";
import { getImageUrl } from '../utils/getImageUrl'
import toast from 'react-hot-toast'

const AvatarEdit = ({ close }) => {

  const user = useSelector(state => state.user)
  const dispatch = useDispatch()
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
  }

  const handleUploadAvatarImage = async (e) => {
    const file = e.target.files[0]

    if (!file) return

    const formData = new FormData()
    formData.append('avatar', file)

    try {
      setLoading(true)

      const response = await Axios({
        ...SummaryApi.uploadAvatar,
        data: formData
      })

      const { data: responseData } = response
      
      // Check nested data object first, then directly on responseData body
      let avatarUrl = null;
      if (responseData?.data?.avatar) {
        avatarUrl = responseData.data.avatar;
      } else if (responseData?.avatar) {
        avatarUrl = responseData.avatar;
      } else if (typeof responseData?.data === 'string' && (responseData.data.startsWith('http') || responseData.data.includes('res.cloudinary'))) {
        avatarUrl = responseData.data;
      }

      if (avatarUrl) {
        dispatch(updatedAvatar(avatarUrl))
        toast.success("Profile photo updated!");
        if (close) close();
      } else {
        console.error("Server response structure invalid. Full object:", JSON.stringify(responseData, null, 2));
        const finalMessage = responseData?.message || "Unexpected response from server.";
        toast.error(finalMessage);
      }

    } catch (error) {
      AxiosToastError(error)

    } finally {
      setLoading(false)
    }
  }

  const avatarURL = user?.avatar || ""

  return (
    <section className='fixed inset-0 bg-gray-900/40 backdrop-blur-sm p-4 flex items-center justify-center z-100 animate-in fade-in duration-300'>

      <div className='bg-white max-w-sm w-full rounded-[2.5rem] p-8 flex flex-col items-center justify-center relative shadow-2xl animate-in zoom-in-95 duration-300'>

        <button
          onClick={close}
          className='absolute top-6 right-6 p-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-900 transition-all'
        >
          <IoClose size={20} />
        </button>

        <h3 className='font-black text-xl text-gray-900 mb-6'>Profile Photo</h3>

        <div className='w-32 h-32 bg-gray-50 flex items-center justify-center rounded-4xl overflow-hidden border-4 border-white shadow-xl mb-6'>

          {avatarURL ? (
            <img
              alt={user?.name || "avatar"}
              src={getImageUrl(avatarURL)}
              className='w-full h-full object-cover'
            />
          ) : (
            <div className='text-gray-200'>
                <FaRegUserCircle size={80}/>
            </div>
          )}

        </div>

        <form onSubmit={handleSubmit} className='w-full'>
          <label htmlFor='uploadProfile' className='block w-full'>
            <div className='w-full bg-gray-900 hover:bg-gray-800 text-white font-black text-xs uppercase tracking-widest py-4 rounded-2xl flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-lg shadow-gray-200'>
              {loading ? "UPLOADING..." : "Change Photo"}
            </div>

            <input
              onChange={handleUploadAvatarImage}
              type='file'
              id='uploadProfile'
              className='hidden'
              accept="image/*"
            />
          </label>
        </form>

        <p className='mt-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest'>JPG, PNG OR WEBP • MAX 2MB</p>

      </div>
    </section>
  )
}

export default AvatarEdit
