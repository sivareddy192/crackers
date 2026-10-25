import React, { useState } from 'react'
import { IoClose } from "react-icons/io5";
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from '../utils/AxiosToastError';
import toast from 'react-hot-toast';

const EditUser = ({ data, close, fetchData }) => {
    const [userData, setUserData] = useState({
        userId: data._id,
        name: data.name,
        email: data.email,
        mobile: data.mobile || "",
        role: data.role,
        status: data.status || "Active"
    })

    const handleOnChange = (e) => {
        const { name, value } = e.target
        setUserData((prev) => {
            return {
                ...prev,
                [name]: value
            }
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const response = await Axios({
                ...SummaryApi.admin_update_user,
                data: userData
            })

            if (response.data.success) {
                toast.success(response.data.message)
                if (fetchData) fetchData()
                close()
            }
        } catch (error) {
            AxiosToastError(error)
        }
    }

    return (
        <section className='fixed top-0 bottom-0 left-0 right-0 z-50 bg-neutral-800 bg-opacity-70 p-4 flex items-center justify-center'>
            <div className='bg-white max-w-lg w-full p-4 rounded'>
                <div className='flex items-center justify-between'>
                    <h1 className='font-semibold'>Edit User</h1>
                    <button onClick={close} className='w-fit block ml-auto hover:text-red-600'>
                        <IoClose size={25} />
                    </button>
                </div>
                <form className='grid gap-3 py-4' onSubmit={handleSubmit}>
                    <div className='grid gap-1'>
                        <label htmlFor='name'>Name</label>
                        <input
                            type='text'
                            id='name'
                            name='name'
                            value={userData.name}
                            onChange={handleOnChange}
                            className='bg-blue-50 p-2 border outline-none focus:border-green-300 rounded'
                            required
                        />
                    </div>
                    <div className='grid gap-1'>
                        <label htmlFor='email'>Email</label>
                        <input
                            type='email'
                            id='email'
                            name='email'
                            value={userData.email}
                            onChange={handleOnChange}
                            className='bg-blue-50 p-2 border outline-none focus:border-green-300 rounded'
                            required
                        />
                    </div>
                    <div className='grid gap-1'>
                        <label htmlFor='mobile'>Mobile</label>
                        <input
                            type='text'
                            id='mobile'
                            name='mobile'
                            value={userData.mobile}
                            onChange={handleOnChange}
                            className='bg-blue-50 p-2 border outline-none focus:border-green-300 rounded'
                        />
                    </div>
                    <div className='grid gap-1'>
                        <label htmlFor='role'>Role</label>
                        <select
                            id='role'
                            name='role'
                            value={userData.role}
                            onChange={handleOnChange}
                            className='bg-blue-50 p-2 border outline-none focus:border-green-300 rounded'
                        >
                            <option value="USER">USER</option>
                            <option value="ADMIN">ADMIN</option>
                            <option value="DELIVERY_BOY">DELIVERY_BOY</option>
                        </select>
                    </div>

                    <div className='grid gap-1'>
                        <label htmlFor='status' className='font-medium'>Account Status</label>
                        <select
                            id='status'
                            name='status'
                            value={userData.status}
                            onChange={handleOnChange}
                            className='bg-blue-50 p-2 border outline-none focus:border-green-300 rounded'
                        >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="Suspended">Suspended</option>
                        </select>
                    </div>

                    <button
                        className='bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded mt-2'
                    >
                        Update User
                    </button>
                </form>
            </div>
        </section>
    )
}

export default EditUser
