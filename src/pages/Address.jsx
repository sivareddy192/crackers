import { useState } from 'react'
import { useSelector } from 'react-redux'
import AddAddress from '../components/AddAddress'
import { MdDelete, MdEdit } from "react-icons/md"
import EditAddress from '../components/EditAddress'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import toast from 'react-hot-toast'
import AxiosToastError from '../utils/AxiosToastError'
import { useGlobalContext } from '../provider/GlobalProvider'
import ConfirmBox from '../components/ConfirmBox'

const Address = () => {
  const addressList = useSelector(state => state.addresses.addressList)
  const [openAddress, setOpenAddress] = useState(false)
  const [OpenEdit, setOpenEdit] = useState(false)
  const [editData, setEditData] = useState({})
  const { fetchAddress } = useGlobalContext()

  const [openConfirmBox, setOpenConfirmBox] = useState(false)
  const [deleteId, setDeleteId] = useState("")

  const handleDisableAddress = async (id) => {
    try {
      const response = await Axios({
        ...SummaryApi.disableAddress,
        data: { _id: id }
      })
      if (response.data.success) {
        toast.success("Address Removed")
        fetchAddress?.()
      }
    } catch (error) {
      AxiosToastError(error)
    }
  }

  const confirmDelete = () => {
    handleDisableAddress(deleteId)
    setOpenConfirmBox(false)
    setDeleteId("")
  }

  return (
    <div>
      
      <div className='p-4 bg-white shadow-md flex justify-between items-center'>
        <button
          onClick={() => setOpenAddress(true)}
          className='border border-green-300 hover:bg-green-500 hover:text-white px-4 py-2 rounded'
        >
          Add Address
        </button>
        <h2 className='font-semibold text-xl'>Address</h2>
      </div>

      <div className='bg-blue-50 p-2 grid gap-4'>
        {addressList.map((address, index) => (
          <div
            key={address._id || index}
            className={`border rounded p-3 flex gap-3 bg-white ${!address.status ? 'hidden' : ''}`}
          >
            <div className='w-full'>
              <p>{address.address_line}</p>
              <p>{address.city}</p>
              <p>{address.state}</p>
              <p>{address.country} - {address.pincode}</p>
              <p>{address.mobile}</p>
            </div>
            <div className='grid gap-10'>
              <button
                onClick={() => {
                  setOpenEdit(true)
                  setEditData(address)
                }}
                className='bg-green-200 p-1 rounded hover:text-white hover:bg-green-600'
              >
                <MdEdit/>
              </button>

              <button
                onClick={() => {
                  setDeleteId(address._id)
                  setOpenConfirmBox(true)
                }}
                className='bg-red-200 p-1 rounded hover:text-white hover:bg-red-600'
              >
                <MdDelete size={20} />
              </button>
            </div>
          </div>
        ))}

        <div
          onClick={() => setOpenAddress(true)}
          className='h-16 bg-blue-50 border-2 border-dashed flex justify-center items-center cursor-pointer'
        >
          Add address
        </div>
      </div>

      {openAddress && (
        <AddAddress close={() => setOpenAddress(false)} />
      )}

      {OpenEdit && (
        <EditAddress data={editData} close={() => setOpenEdit(false)} />
      )}

      {openConfirmBox && (
        <ConfirmBox
          message="Are you sure you want to delete this address?"
          confirm={confirmDelete}
          cancel={() => setOpenConfirmBox(false)}
          close={() => setOpenConfirmBox(false)}
        />
      )}

    </div>
  )
}

export default Address
