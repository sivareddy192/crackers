import React, { useState } from 'react'
import { useForm } from "react-hook-form"
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import toast from 'react-hot-toast'
import AxiosToastError from '../utils/AxiosToastError'
import { IoClose, IoLocationOutline } from "react-icons/io5";
import { useGlobalContext } from '../provider/GlobalProvider'
import { FaSpinner } from 'react-icons/fa'

const AddAddress = ({close}) => {
    const { register, handleSubmit, reset, setValue } = useForm()
    const { fetchAddress } = useGlobalContext()
    const [locating, setLocating] = useState(false)
    const [coords, setCoords] = useState({ lat: null, lng: null })

    const handleGetCurrentLocation = () => {
        setLocating(true)
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords
                    setCoords({ lat: latitude, lng: longitude })
                    
                    try {
                        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`);
                        const result = await res.json();
                        
                        if (result && result.address) {
                            const addr = result.address;
                            
                            // Map OSM address fields to our form
                            const city = addr.city || addr.town || addr.village || addr.suburb || "";
                            const state = addr.state || "";
                            const country = addr.country || "India";
                            const pincode = addr.postcode || "";
                            const addressLine = result.display_name || "";

                            if (city) setValue("city", city);
                            if (state) setValue("state", state);
                            if (country) setValue("country", country);
                            if (pincode) setValue("pincode", pincode);
                            if (addressLine) setValue("addressline", addressLine);

                            toast.success("Address detected automatically!");
                        }
                    } catch (geoError) {
                        console.error("Reverse geocoding failed", geoError);
                        toast.success("Coordinates captured, but could not detect address text.");
                    } finally {
                        setLocating(false)
                    }
                },
                (error) => {
                    setLocating(false)
                    console.error("Location error", error)
                    if (error.code === 1) {
                        toast.error("Location permission denied. Please allow location access.")
                    } else if (error.code === 2) {
                        toast.error("Location unavailable. Try moving to an open area or enter manually.")
                    } else if (error.code === 3) {
                        toast.error("Location request timed out. Please try again.")
                    } else {
                        toast.error("Could not fetch location. Please enter manually.")
                    }
                },
                {
                    enableHighAccuracy: false,
                    timeout: 10000,
                    maximumAge: 0
                }
            )
        } else {
            setLocating(false)
            toast.error("Geolocation is not supported by your browser.")
        }
    }

    const onSubmit = async(data)=>{
        try {
            const response = await Axios({
                ...SummaryApi.createAddress,
                data : {
                    address_line :data.addressline,
                    city : data.city,
                    state : data.state,
                    country : data.country,
                    pincode : data.pincode,
                    mobile : data.mobile,
                    latitude: coords.lat,
                    longitude: coords.lng
                }
            })

            const { data : responseData } = response
            
            if(responseData.success){
                toast.success(responseData.message)
                if(close){
                    close()
                    reset()
                    fetchAddress()
                }
            }
        } catch (error) {
            AxiosToastError(error)
        }
    }

    const handlePincodeBlur = async (e) => {
        const pincode = e.target.value;
        if (pincode.length === 6) {
            try {
                const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
                const data = await res.json();
                if (data[0].Status === "Success") {
                    const postOffice = data[0].PostOffice[0];
                    setValue("city", postOffice.District);
                    setValue("state", postOffice.State);
                    setValue("country", "India");
                    toast.success(`Location detected: ${postOffice.District}, ${postOffice.State}`);
                }
            } catch (err) {
                console.error("Pincode fetch failed", err);
            }
        }
    }

  return (
    <section className='bg-black fixed top-0 left-0 right-0 bottom-0 z-50 bg-opacity-70 h-screen overflow-y-auto flex justify-center items-start sm:items-center p-4 py-8 custom-scrollbar'>
        <div className='bg-white p-6 w-full max-w-lg rounded-2xl shadow-2xl my-auto'>
            <div className='flex justify-between items-center gap-4 border-b pb-4'>
                <h2 className='font-black text-xl text-gray-800 uppercase tracking-tight'>Add New Address</h2>
                <button onClick={close} className='p-2 hover:bg-gray-100 rounded-full transition-colors'>
                    <IoClose size={25}/>
                </button>
            </div>

            <div className='mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4'>
                <div className='flex items-center gap-3'>
                    <IoLocationOutline className='text-blue-600 shrink-0' size={24} />
                    <div>
                        <p className='text-sm font-bold text-blue-800'>Exact Location Tracking</p>
                        <p className='text-[10px] text-blue-600 font-medium'>Capture your GPS coordinates for faster delivery.</p>
                    </div>
                </div>
                <button 
                    type="button"
                    onClick={handleGetCurrentLocation}
                    disabled={locating}
                    className={`px-4 py-2 w-full sm:w-auto rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${coords.lat ? 'bg-green-600 text-white shadow-md' : 'bg-blue-600 text-white hover:bg-blue-700'} flex items-center justify-center gap-2`}
                >
                    {locating ? <FaSpinner className='animate-spin' /> : (coords.lat ? "✓ Captured" : "Locate Me")}
                </button>
            </div>

            <form className='mt-6 grid gap-4' onSubmit={handleSubmit(onSubmit)}>
                <div className='grid gap-1'>
                    <label htmlFor='addressline' className='text-xs font-black text-gray-400 uppercase tracking-widest'>Address Line</label>
                    <input
                        type='text'
                        id='addressline' 
                        placeholder="House No, Building, Street"
                        className='border-2 border-gray-100 bg-gray-50 p-3 rounded-xl outline-none focus:border-green-300 transition-all font-medium'
                        {...register("addressline",{required : true})}
                    />
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <div className='grid gap-1'>
                        <label htmlFor='city' className='text-xs font-black text-gray-400 uppercase tracking-widest'>City</label>
                        <input
                            type='text'
                            id='city' 
                            className='border-2 border-gray-100 bg-gray-50 p-3 rounded-xl outline-none focus:border-green-300 transition-all font-medium w-full'
                            {...register("city",{required : true})}
                        />
                    </div>
                    <div className='grid gap-1'>
                        <label htmlFor='state' className='text-xs font-black text-gray-400 uppercase tracking-widest'>State</label>
                        <input
                            type='text'
                            id='state' 
                            className='border-2 border-gray-100 bg-gray-50 p-3 rounded-xl outline-none focus:border-green-300 transition-all font-medium w-full'
                            {...register("state",{required : true})}
                        />
                    </div>
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <div className='grid gap-1'>
                        <label htmlFor='pincode' className='text-xs font-black text-gray-400 uppercase tracking-widest'>Pincode</label>
                        <input
                            type='text'
                            id='pincode' 
                            className='border-2 border-gray-100 bg-gray-50 p-3 rounded-xl outline-none focus:border-green-300 transition-all font-medium w-full'
                            {...register("pincode",{required : true})}
                            onBlur={handlePincodeBlur}
                        />
                    </div>
                    <div className='grid gap-1'>
                        <label htmlFor='country' className='text-xs font-black text-gray-400 uppercase tracking-widest'>Country</label>
                        <input
                            type='text'
                            id='country' 
                            className='border-2 border-gray-100 bg-gray-50 p-3 rounded-xl outline-none focus:border-green-300 transition-all font-medium w-full'
                            {...register("country",{required : true})}
                        />
                    </div>
                </div>

                <div className='grid gap-1'>
                    <label htmlFor='mobile' className='text-xs font-black text-gray-400 uppercase tracking-widest'>Mobile No.</label>
                    <input
                        type='text'
                        id='mobile' 
                        className='border-2 border-gray-100 bg-gray-50 p-3 rounded-xl outline-none focus:border-green-300 transition-all font-medium'
                        {...register("mobile",{required : true})}
                    />
                </div>

                <button type='submit' className='bg-green-600 w-full py-4 rounded-2xl font-black text-white text-xs uppercase tracking-[3px] hover:bg-green-700 transition-all shadow-lg shadow-green-100 mt-2 active:scale-95'>
                    Save Address
                </button>
            </form>
        </div>
    </section>
  )
}

export default AddAddress
