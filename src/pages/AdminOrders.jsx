import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Axios from "../utils/Axios";
import SummaryApi from "../common/SummaryApi";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { QRCodeSVG } from 'qrcode.react';

const statusSteps = ["Pending", "Confirmed", "Shipped", "Out for Delivery", "Delivered"];

const AdminOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deliveryBoys, setDeliveryBoys] = useState([]);

  const fetchDeliveryBoys = async () => {
    try {
        const res = await Axios({ ...SummaryApi.deliveryBoy.getDeliveryBoys });
        setDeliveryBoys(res.data.data || []);
    } catch (err) {
        console.error("Fetch Delivery Boys Error:", err);
    }
  }

  useEffect(() => {
    fetchDeliveryBoys();
  }, []);

  const normalizeStatus = (status) => status?.toLowerCase() || "";

  const fetchOrders = useCallback(async () => {
    try {
      const res = await Axios({ ...SummaryApi.admin.getOrders });
      const data = res?.data?.data || res?.data || [];
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Admin Fetch Error:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const groupedOrders = Object.values(
    orders.reduce((acc, order) => {
      const key = order.orderId || order._id;
      if (!acc[key]) {
        acc[key] = {
          _id: order._id,
          orderId: order.orderId || order._id,
          createdAt: order.createdAt,
          status: order.status,
          user: order.userId?.name || "User",
          mobile: order.userId?.mobile || order.address?.phone || "N/A",
          payment_status: order.payment_status || "",
          deliveryBoyId: order.deliveryBoyId?._id || order.deliveryBoyId,
          deliveryBoyName: order.deliveryBoyId?.name,
          deliveryDate: order.deliveryDate,
        };
      }
      return acc;
    }, {})
  );

  const updateStatus = async (id, newStatus) => {
    try {
      await Axios({
        url: `${SummaryApi.admin.updateOrderStatus.url}/${id}`,
        method: SummaryApi.admin.updateOrderStatus.method,
        data: { status: newStatus },
      });
      fetchOrders();
      toast.success("Status updated");
    } catch (err) {
      toast.error("Update failed");
    }
  };

  const handleDeleteOrder = async (id) => {
    try {
        const response = await Axios({
            ...SummaryApi.order.deleteOrder,
            url: SummaryApi.order.deleteOrder.url.replace(":id", id)
        })
        if(response.data.success) {
            fetchOrders();
            toast.success("Order deleted");
        }
    } catch (err) {
        toast.error("Delete failed");
    }
  }

  const getStatusIndex = (status) => {
    const normalized = normalizeStatus(status);
    return statusSteps.findIndex((step) => normalizeStatus(step) === normalized);
  };

  if (loading) return (
    <div className="p-8 space-y-4">
        <div className="h-10 bg-gray-200 rounded-2xl w-48 animate-pulse mb-6" />
        {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-white rounded-[2.5rem] animate-pulse" />
        ))}
    </div>
  );

  return (
    <div className="p-4 lg:p-10 bg-gray-50 min-h-screen">
      <div className="mb-10 px-2">
          <h2 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <span className="bg-indigo-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg">📦</span>
            Admin Orders
          </h2>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-2">Manage customer shipments</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {groupedOrders.map((order) => {
            const isCancelled = normalizeStatus(order.status) === "cancelled";
            const isDelivered = normalizeStatus(order.status) === "delivered";
            const activeIndex = getStatusIndex(order.status);

            return (
            <motion.div
                key={order.orderId}
                layout
                className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-xl hover:shadow-indigo-50 transition-all active:scale-[0.99]"
                onClick={() => navigate(`/admin-portal/order/${order.orderId}`)}
            >
                <div className="p-8 border-b border-gray-50">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-black text-2xl text-gray-900">#{order.orderId.slice(-6)}</h3>
                                <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${
                                    order.payment_status === 'CASH ON DELIVERY' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                                }`}>
                                    {order.payment_status === 'CASH ON DELIVERY' ? 'COD' : 'ONLINE'}
                                </span>
                            </div>
                            <p className="text-sm font-bold text-gray-700 flex items-center gap-2">👤 {order.user}</p>
                             <p className="text-[11px] text-gray-400 font-bold uppercase mt-1">📅 {new Date(order.createdAt).toLocaleString()}</p>
                             {order.deliveryDate && (
                               <p className="text-[11px] text-green-600 font-bold uppercase mt-1">🚚 Delivery: {new Date(order.deliveryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                             )}
                        </div>
                        <div className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            isCancelled ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"
                        }`}>
                            {order.status}
                        </div>
                    </div>

                    <div className="px-4 py-8 bg-gray-50/50 rounded-[2rem]">
                        <div className="flex items-center justify-between relative px-2">
                            <div className="absolute top-2 left-[10%] w-[80%] h-[2px] bg-gray-200 z-0"></div>
                            {statusSteps.map((step, i) => {
                                const active = !isCancelled && i <= activeIndex;
                                return (
                                <div key={i} className="flex flex-col items-center flex-1 relative z-10">
                                    <div className={`w-5 h-5 rounded-full border-2 transition-all duration-500 flex items-center justify-center
                                    ${active ? "bg-green-500 border-green-500" : "bg-white border-gray-300"}`}>
                                        {active && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                    </div>
                                    <p className={`text-[8px] font-black mt-3 text-center uppercase tracking-widest ${active ? "text-green-600" : "text-gray-300"}`}>
                                        {step}
                                    </p>
                                </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="p-8 flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex-1 relative">
                        <select
                            value={order.status}
                            disabled={isDelivered}
                            onChange={(e) => updateStatus(order._id, e.target.value)}
                            className="w-full appearance-none border border-gray-100 bg-white px-5 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest outline-none focus:border-indigo-600 transition-all cursor-pointer"
                        >
                            {statusSteps.concat("Cancelled").map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-[8px]">▼</div>
                    </div>

                    <button
                        onClick={() => { if(window.confirm("Are you sure?")) handleDeleteOrder(order._id) }}
                        className="px-8 py-4 bg-red-50 text-red-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all"
                    >
                        Delete
                    </button>

                    {order.deliveryBoyName ? (
                        <div className="px-6 py-4 bg-indigo-50 text-indigo-700 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 border border-indigo-100 shadow-sm">
                            <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></span>
                            {order.deliveryBoyName}
                        </div>
                    ) : (
                        <div className="p-2 bg-white rounded-2xl border border-gray-100 shadow-sm hover:scale-105 transition-transform">
                            <QRCodeSVG value={order.orderId} size={158} marginSize={2} />
                        </div>
                    )}
                </div>
            </motion.div>
            );
        })}
      </div>
    </div>
  );
};

export default AdminOrders;