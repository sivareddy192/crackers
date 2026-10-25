import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { FaRegUserCircle } from "react-icons/fa";
import AvatarEdit from '../components/AvatarEdit';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from '../utils/AxiosToastError';
import toast from 'react-hot-toast';
import { setUserDetails } from '../store/userSlice';
import fetchUserDetails from '../utils/fetchUserDetails';
import { getImageUrl } from '../utils/getImageUrl';


const Profile = () => {
    const user = useSelector(state => state.user)
    const [openAvatarEdit,setAvatarEdit] = useState(false)
    const [userData,setUserData] = useState({
        name : user.name || "",
        email : user.email || "",
        mobile : user.mobile || "",
    })
    const [loading,setLoading] = useState(false)
    const dispatch = useDispatch()

    useEffect(()=>{
        setUserData({
            name : user.name || "",
            email : user.email || "",
            mobile : user.mobile || "",
        })
    },[user])

    const handleOnChange  = (e)=>{
        const { name, value} = e.target 

        setUserData((preve)=>{
            return{
                ...preve,
                [name] : value
            }
        })
    }

    const handleSubmit = async(e)=>{
        e.preventDefault()
        
        try {
            setLoading(true)
            const response = await Axios({
                ...SummaryApi.updateUserDetails,
                data : userData
            })

            const { data : responseData } = response

            if(responseData.success){
                toast.success(responseData.message)
                const userData = await fetchUserDetails()
                dispatch(setUserDetails(userData.data))
            }

        } catch (error) {
            AxiosToastError(error)
        } finally{
            setLoading(false)
        }

    }
  return (
    <div className='p-6 max-w-4xl mx-auto'>
        <div className='bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 lg:p-12'>
            <h2 className='text-2xl font-black text-gray-900 mb-8 uppercase tracking-tighter'>Personal Details</h2>

            <div className='flex flex-col lg:flex-row gap-12 items-start'>
                {/**profile upload and display image */}
                <div className='flex flex-col items-center gap-4'>
                    <div className='w-40 h-40 bg-gray-50 flex items-center justify-center rounded-[2.5rem] overflow-hidden border-4 border-white shadow-xl'>
                        {
                            user.avatar ? (
                                <img 
                                  alt={user.name}
                                  src={getImageUrl(user.avatar)}
                                  className='w-full h-full object-cover'
                                />
                            ) : (
                                <FaRegUserCircle size={80} className='text-gray-200'/>
                            )
                        }
                    </div>
                    <button 
                        onClick={()=>setAvatarEdit(true)} 
                        className='text-[10px] font-black uppercase tracking-widest bg-gray-900 text-white px-6 py-2.5 rounded-xl hover:bg-gray-800 transition-all active:scale-95'
                    >
                        Edit Photo
                    </button>
                </div>
                
                {/**name, mobile , email, change password */}
                <form className='flex-1 grid gap-6 w-full' onSubmit={handleSubmit}>
                    <div className='grid gap-1.5'>
                        <label htmlFor='name' className='text-[10px] font-black text-gray-400 uppercase tracking-[2px] ml-1'>Full Name</label>
                        <input
                            type='text'
                            id='name'
                            name='name'
                            placeholder='Enter your name'
                            className='w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-gray-900 placeholder:text-gray-300 focus:bg-white focus:ring-2 focus:ring-gray-900/5 outline-none transition-all'
                            value={userData.name || ""}
                            onChange={handleOnChange}
                            autoComplete="name"
                            required
                        />
                    </div>

                    <div className='grid gap-1.5'>
                        <label htmlFor='email' className='text-[10px] font-black text-gray-400 uppercase tracking-[2px] ml-1'>Email Address</label>
                        <input
                            type='email'
                            id='email'
                            name='email'
                            placeholder='Enter your email'
                            className='w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-gray-400 cursor-not-allowed outline-none'
                            value={userData.email || ""}
                            onChange={handleOnChange}
                            readOnly
                            autoComplete="email"
                        />
                    </div>

                    <div className='grid gap-1.5'>
                        <label htmlFor='mobile' className='text-[10px] font-black text-gray-400 uppercase tracking-[2px] ml-1'>Mobile Number</label>
                        <input
                            type='tel'
                            id='mobile'
                            name='mobile'
                            placeholder='Enter your mobile'
                            className='w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-gray-900 placeholder:text-gray-300 focus:bg-white focus:ring-2 focus:ring-gray-900/5 outline-none transition-all'
                            value={userData.mobile || ""}
                            onChange={handleOnChange}
                            required
                            inputMode='numeric'
                            pattern='[0-9]*'
                            autoComplete="tel"
                        />
                    </div>

                    <button className='w-full bg-green-600 hover:bg-green-700 text-white font-black text-xs uppercase tracking-[2px] py-4 rounded-2xl transition-all active:scale-95 shadow-lg shadow-green-100 mt-4'>
                        {
                            loading ? "SAVING..." : "SAVE CHANGES"
                        }
                    </button>
                </form>
            </div>
        </div>

        {
            openAvatarEdit && (
                <AvatarEdit close={()=>setAvatarEdit(false)}/>
            )
        }
    </div>
  )
}

export default Profile
