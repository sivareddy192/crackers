import React, { useEffect, useState } from 'react';
import UploadCoupon from '../components/UploadCoupon';
import EditCoupon from '../components/EditCoupon';
import ConfirmBox from '../components/ConfirmBox';
import DisplayTable from '../components/DisplayTable';
import { createColumnHelper } from '@tanstack/react-table';
import { HiPencil } from "react-icons/hi";
import { MdDelete } from "react-icons/md";
import { FiMail } from "react-icons/fi";
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from '../utils/AxiosToastError';
import toast from 'react-hot-toast';
import Loading from '../components/Loading';

const Coupons = () => {
  const [openAddCoupon, setOpenAddCoupon] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editData, setEditData] = useState({ _id: "" });
  const [openDeleteConfirmBox, setOpenDeleteConfirmBox] = useState(false);
  const [deleteCouponData, setDeleteCouponData] = useState({ _id: "" });
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const columnHelper = createColumnHelper();

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await Axios({ ...SummaryApi.coupon_list });
      const { data: responseData } = response;
      if (responseData.success) {
        setData(responseData.coupons || []);
      } else {
        toast.error(responseData.message || "Failed to fetch coupons");
      }
    } catch (err) {
      AxiosToastError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const toggleStatus = async (coupon) => {
    try {
      await Axios({
        ...SummaryApi.coupon_update(coupon._id),
        data: { isActive: !coupon.isActive }
      });

      toast.success(coupon.isActive ? "Coupon Disabled" : "Coupon Activated", { duration: 1200 });
      fetchCoupons();
    } catch (err) {
      AxiosToastError(err);
    }
  };

  const handleDeleteCoupon = async () => {
    try {
      const response = await Axios(SummaryApi.coupon_delete(deleteCouponData._id));
      const { data: responseData } = response;
      if (responseData.success) {
        toast.success(responseData.message || "Coupon deleted");
        fetchCoupons();
        setOpenDeleteConfirmBox(false);
        setDeleteCouponData({ _id: "" });
      }
    } catch (err) {
      AxiosToastError(err);
    }
  };

  const handleDirectBroadcast = async (coupon) => {
    try {
      setBroadcastLoading(true);
      const loadingToast = toast.loading(`Broadcasting ${coupon.code} to all users...`);

      const response = await Axios({
        ...SummaryApi.coupon_send_email,
        data: {
          couponId: coupon._id,
          subject: `🎉 Special Offer! Get ${coupon.discountPercent}% OFF on Trace!`,
          headline: `Exclusive ${coupon.discountPercent}% OFF Just For You!`,
          description: "Celebrate with Trace! Use the code below at checkout to save on crackers and fireworks for your next occasion.",
        }
      });

      toast.dismiss(loadingToast);
      const { data: responseData } = response;

      if (responseData.success) {
        toast.success(responseData.message || "Email broadcast initiated successfully!", { duration: 4000 });
      } else {
        toast.error(responseData.message || "Failed to initiate broadcast.");
      }
    } catch (err) {
      AxiosToastError(err);
    } finally {
      setBroadcastLoading(false);
    }
  };

  const column = [
    columnHelper.accessor('code', { header: "Code" }),
    columnHelper.accessor('discountPercent', { header: "Discount", cell: info => `${info.getValue()}%` }),
    columnHelper.accessor('minAmount', { header: "Min Amount", cell: info => `₹${info.getValue() || 0}` }),
    columnHelper.accessor('maxDiscount', { header: "Max Discount", cell: info => `₹${info.getValue() || 0}` }),
    columnHelper.accessor('expiryDate', {
      header: "Expiry",
      cell: ({ row }) => (row.original.expiryDate ? row.original.expiryDate.slice(0, 10) : "-")
    }),
    columnHelper.accessor('isActive', {
      header: "Status",
      cell: ({ row }) => {
        const c = row.original;
        return (
          <button
            onClick={() => toggleStatus(c)}
            className={`px-4 py-1 rounded-full text-sm font-semibold ${
              c.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
          >
            {c.isActive ? "Active" : "Inactive"}
          </button>
        );
      }
    }),
    columnHelper.accessor('_id', {
      header: "Actions",
      cell: ({ row }) => (
        <div className='flex gap-2'>
          <button
            onClick={() => handleDirectBroadcast(row.original)}
            disabled={broadcastLoading}
            className='p-2 bg-orange-100 rounded text-orange-600 hover:text-orange-700 transition-all active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed'
            title="Send to all Gmail"
          >
            <FiMail size={18} />
          </button>

          <button
            onClick={() => {
              setEditData(row.original);
              setOpenEdit(true);
            }}
            className='p-2 bg-blue-100 rounded hover:text-blue-600'
          >
            <HiPencil size={18} />
          </button>

          <button
            onClick={() => {
              setDeleteCouponData(row.original);
              setOpenDeleteConfirmBox(true);
            }}
            className='p-2 bg-red-100 rounded text-red-600 hover:text-red-700'
          >
            <MdDelete size={18} />
          </button>
        </div>
      )
    })
  ];

  return (
    <section className=''>
      <div className='p-4 bg-white shadow-md flex justify-between items-center mb-6'>
        <button
          onClick={() => setOpenAddCoupon(true)}
          className='text-sm border-2 font-black uppercase tracking-widest border-gray-900 hover:bg-gray-900 hover:text-white text-gray-900 px-6 py-2.5 rounded-xl transition-all active:scale-95'
        >
          Add Coupon
        </button>
        <h2 className='font-black text-xl text-gray-900 uppercase tracking-tighter'>Coupons</h2>
      </div>

      <div className='p-4 min-h-[70vh] flex flex-col'>
        {loading ? (
            <Loading type="table" />
        ) : (
            <div className='overflow-auto w-full max-w-[95vw]'>
                <DisplayTable
                    data={data}
                    column={column}
                    loading={loading}
                />
            </div>
        )}
      </div>

      {openAddCoupon && (
        <UploadCoupon
          close={() => setOpenAddCoupon(false)}
          fetchData={fetchCoupons}
        />
      )}

      {openEdit && (
        <EditCoupon
          data={editData}
          close={() => setOpenEdit(false)}
          fetchData={fetchCoupons}
        />
      )}

      {openDeleteConfirmBox && (
        <ConfirmBox
          cancel={() => setOpenDeleteConfirmBox(false)}
          close={() => setOpenDeleteConfirmBox(false)}
          confirm={handleDeleteCoupon}
        />
      )}
    </section>
  );
};

export default Coupons;
