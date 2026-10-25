import React, { useEffect, useState } from 'react'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import AxiosToastError from '../utils/AxiosToastError'
import Loading from '../components/Loading'
import NoData from '../components/NoData'
import toast from 'react-hot-toast'
import EditUser from '../components/EditUser'
import { MdEdit, MdDelete } from "react-icons/md";
import { IoRefresh } from "react-icons/io5";
import ConfirmBox from '../components/ConfirmBox'

const ManageUsers = () => {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [openEdit, setOpenEdit] = useState(false)
    const [editData, setEditData] = useState({})
    const [openConfirmBoxDelete, setOpenConfirmBoxDelete] = useState(false)
    const [deleteUserData, setDeleteUserData] = useState({
        _id: ""
    })

    const fetchUsers = async () => {
        try {
            setLoading(true)
            const response = await Axios({
                ...SummaryApi.all_users
            })
            if (response.data.success) {
                setUsers(response.data.data)
            }
        } catch (error) {
            AxiosToastError(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const handleDeleteUser = async () => {
        try {
            const response = await Axios({
                ...SummaryApi.delete_user,
                data: { userId: deleteUserData._id }
            })
            if (response.data.success) {
                toast.success(response.data.message)
                fetchUsers()
                setOpenConfirmBoxDelete(false)
            }
        } catch (error) {
            AxiosToastError(error)
        }
    }

    const handleRoleChange = async (userId, newRole) => {
        try {
            const response = await Axios({
                ...SummaryApi.update_user_role,
                data: { userId, role: newRole }
            })
            if (response.data.success) {
                toast.success(response.data.message)
                fetchUsers()
            }
        } catch (error) {
            AxiosToastError(error)
        }
    }

    const filteredUsers = users.filter(user => 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.mobile?.includes(searchTerm)
    )

    return (
        <section className='p-4'>
            <div className='bg-white shadow-md p-4 rounded-xl flex items-center justify-between mb-6 gap-4'>
                <div className='flex items-center gap-4'>
                    <h2 className='font-black text-xl text-gray-900 uppercase tracking-tighter'>Users</h2>
                    <span className='bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest'>Total: {users.length}</span>
                </div>
                <div className='flex items-center gap-4 w-full max-w-md'>
                    <input 
                        type="text" 
                        placeholder='Search by name, email or mobile...' 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className='bg-gray-50 border border-gray-100 px-4 py-2.5 rounded-xl outline-none focus:border-gray-900 w-full transition-all text-sm font-medium'
                    />
                    <button onClick={fetchUsers} className='p-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors'>
                        <IoRefresh size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            <div className='min-h-[70vh] flex flex-col'>
                {loading ? (
                    <Loading type="table" />
                ) : (
                    <>
                        {filteredUsers.length === 0 ? (
                            <NoData />
                        ) : (
                            <div className='overflow-x-auto bg-white rounded-lg shadow'>
                                <table className='w-full text-left border-collapse'>
                                    <thead>
                                        <tr className='bg-gray-100 border-b'>
                                            <th className='p-3 font-semibold'>S.No</th>
                                            <th className='p-3 font-semibold'>Name</th>
                                            <th className='p-3 font-semibold'>Email</th>
                                            <th className='p-3 font-semibold'>Mobile</th>
                                            <th className='p-3 font-semibold'>Role</th>
                                            <th className='p-3 font-semibold'>Joined At</th>
                                            <th className='p-3 font-semibold text-center'>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.map((user, index) => (
                                            <tr key={user._id} className='border-b hover:bg-gray-50'>
                                                <td className='p-3 text-sm font-medium text-gray-400'>{index + 1}</td>
                                                <td className='p-3 font-bold text-gray-900'>
                                                    <div className='flex flex-col gap-1'>
                                                        <span>{user.name}</span>
                                                        {user.delete_request && (
                                                            <span className='w-fit bg-red-100 text-red-700 text-[9px] font-black uppercase px-2 py-0.5 rounded-md animate-pulse tracking-wider'>
                                                                Delete Requested
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className='p-3'>{user.email}</td>
                                                <td className='p-3'>{user.mobile || "N/A"}</td>
                                                <td className='p-3'>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                        user.role === 'ADMIN' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                                    }`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className='p-3 text-sm text-gray-500'>
                                                    {new Date(user.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className='p-3 text-center flex items-center justify-center gap-2'>
                                                    <select 
                                                        value={user.role}
                                                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                                                        className='border rounded p-1 text-sm outline-none focus:border-green-500'
                                                    >
                                                        <option value="USER">USER</option>
                                                        <option value="ADMIN">ADMIN</option>
                                                        <option value="DELIVERY_BOY">DELIVERY_BOY</option>
                                                    </select>
                                                    <button 
                                                        onClick={() => {
                                                            setOpenEdit(true)
                                                            setEditData(user)
                                                        }}
                                                        className='bg-green-100 hover:bg-green-200 text-green-700 p-2 rounded transition-colors'
                                                        title="Edit User"
                                                    >
                                                        <MdEdit size={20} />
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            setOpenConfirmBoxDelete(true)
                                                            setDeleteUserData(user)
                                                        }}
                                                        className='bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded transition-colors'
                                                        title="Delete User"
                                                    >
                                                        <MdDelete size={20} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>

            {
                openEdit && (
                    <EditUser data={editData} close={() => setOpenEdit(false)} fetchData={fetchUsers} />
                )
            }

            {
                openConfirmBoxDelete && (
                    <ConfirmBox 
                        close={() => setOpenConfirmBoxDelete(false)} 
                        cancel={() => setOpenConfirmBoxDelete(false)} 
                        confirm={handleDeleteUser} 
                        message={`Are you sure you want to delete user ${deleteUserData.name}?`}
                    />
                )
            }
        </section>
    )
}

export default ManageUsers
