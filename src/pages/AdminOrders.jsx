import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Axios from "../utils/Axios";
import SummaryApi from "../common/SummaryApi";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { QRCodeSVG } from 'qrcode.react';
import { FaTrash, FaMotorcycle, FaCheckCircle, FaSearch, FaTimes, FaUserCheck } from 'react-icons/fa';

const statusSteps = ["Pending", "Confirmed", "Shipped", "Out for Delivery", "Delivered"];

const AdminOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const [assigningId, setAssigningId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [previewImage, setPreviewImage] = useState(null);

  const fetchDeliveryBoys = useCallback(async () => {
    try {
        const res = await Axios({ ...SummaryApi.deliveryBoy.getDeliveryBoys });
        setDeliveryBoys(res.data.data || []);
    } catch (err) {
        console.error("Fetch Delivery Boys Error:", err);
    }
  }, []);

  useEffect(() => {
    fetchDeliveryBoys();
  }, [fetchDeliveryBoys]);

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

  // Helper to verify if an ID is a valid 24-hex MongoDB ObjectId
  const isHex24 = (id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id.trim());

  // Group orders by orderId
  const groupedOrders = Object.values(
    orders.reduce((acc, order) => {
      const key = order.orderId || order._id;
      const screenshot = order.payment_screenshot || order.paymentScreenshot || "";
      if (!acc[key]) {
        acc[key] = {
          _id: isHex24(order._id) ? order._id : null,
          allItemIds: isHex24(order._id) ? [order._id] : [],
          orderId: order.orderId || order._id,
          createdAt: order.createdAt,
          status: order.status,
          user: order.userId?.name || "User",
          userId: order.userId,
          mobile: order.userId?.mobile || order.address?.phone || "N/A",
          payment_status: order.payment_status || "",
          payment_screenshot: screenshot,
          deliveryBoyId: order.deliveryBoyId?._id || order.deliveryBoyId,
          deliveryBoyName: order.deliveryBoyId?.name,
          deliveryDate: order.deliveryDate,
          totalAmt: order.totalAmt || 0,
          customerQuery: order.customerQuery || "",
        };
      } else {
        if (!acc[key].payment_screenshot && screenshot) {
          acc[key].payment_screenshot = screenshot;
        }
        if (!acc[key].customerQuery && order.customerQuery) {
          acc[key].customerQuery = order.customerQuery;
        }
        if (isHex24(order._id) && !acc[key].allItemIds.includes(order._id)) {
          acc[key].allItemIds.push(order._id);
        }
      }
      return acc;
    }, {})
  );

  // Filter orders by search term
  const filteredOrders = searchTerm.trim()
    ? groupedOrders.filter(o =>
        o.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.user?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.status?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : groupedOrders;

  const updateStatus = async (id, newStatus) => {
    try {
      await Axios({
        url: `${SummaryApi.admin.updateOrderStatus.url}/${id}`,
        method: SummaryApi.admin.updateOrderStatus.method,
        data: { status: newStatus },
      });
      fetchOrders();
      toast.success(`Status → ${newStatus}`);
    } catch (err) {
      toast.error("Update failed");
    }
  };

  // Delete order using only valid MongoDB ObjectIds to prevent Mongoose CastError on deployed server
  const handleDeleteOrder = async (order, e) => {
    e.stopPropagation();
    const orderDisplayId = order.orderId || order._id;
    if (!window.confirm(`Delete order #${orderDisplayId.slice(-6)}? This will remove ALL items in this order.`)) return;
    setDeletingId(orderDisplayId);
    try {
        let idsToDelete = (order.allItemIds || []).filter(isHex24);
        if (isHex24(order._id) && !idsToDelete.includes(order._id)) {
            idsToDelete.push(order._id);
        }

        // If we don't have valid MongoDB ObjectIds yet (e.g. only orderId string was in table),
        // fetch the actual order items from /api/order/order-items/:orderId first
        if (idsToDelete.length === 0 && order.orderId) {
            try {
                const itemRes = await Axios({
                    url: `${SummaryApi.order.getOrderItems.url}/${order.orderId}`,
                    method: SummaryApi.order.getOrderItems.method,
                });
                const fetched = itemRes.data?.data || [];
                if (Array.isArray(fetched)) {
                    idsToDelete = fetched.map(it => it._id).filter(isHex24);
                }
            } catch (fetchErr) {
                console.warn("Could not fetch items by orderId prior to delete:", fetchErr);
            }
        }

        let hasSuccess = false;

        if (idsToDelete.length > 0) {
            // Delete each item by its valid MongoDB ObjectId so Mongoose never fails with Cast to ObjectId
            const deletePromises = idsToDelete.map(async (id) => {
                try {
                    return await Axios({
                        url: SummaryApi.admin.deleteOrder.url.replace(":id", id),
                        method: SummaryApi.admin.deleteOrder.method,
                    });
                } catch (initialErr) {
                    if (initialErr?.response?.status === 404) {
                        const fallbackUrl = SummaryApi.admin.deleteOrder.url.includes('/api/admin')
                            ? `/api/order/delete/${id}`
                            : `/api/admin/orders/${id}`;
                        return await Axios({
                            url: fallbackUrl,
                            method: 'delete',
                        });
                    }
                    throw initialErr;
                }
            });

            const results = await Promise.allSettled(deletePromises);
            hasSuccess = results.some(r => r.status === 'fulfilled' && (r.value?.data?.success || r.value?.status === 200));
        } else {
            // Fallback for updated backend routes that accept string orderId
            const targetId = order.orderId || order._id;
            try {
                const res = await Axios({
                    url: `/api/admin/orders/${targetId}`,
                    method: 'delete'
                });
                hasSuccess = res?.data?.success || res?.status === 200;
            } catch (fallbackErr) {
                const res2 = await Axios({
                    url: `/api/order/delete/${targetId}`,
                    method: 'delete'
                });
                hasSuccess = res2?.data?.success || res2?.status === 200;
            }
        }

        if (hasSuccess) {
            toast.success("Order deleted successfully");
            // Optimistically remove from UI immediately
            setOrders(prev => prev.filter(o => o.orderId !== order.orderId && o._id !== order._id && !idsToDelete.includes(o._id)));
            // Then re-fetch to confirm
            setTimeout(() => fetchOrders(), 500);
        } else {
            toast.error("Delete failed");
        }
    } catch (err) {
        console.error("Delete Error:", err);
        toast.error(err?.response?.data?.message || "Delete failed");
    } finally {
        setDeletingId(null);
    }
  };

  // Assign an active delivery boy with automatic endpoint fallback for Vercel vs Local
  const handleAssignDeliveryBoy = async (orderGroupId, orderId, deliveryBoyId, e) => {
    e.stopPropagation();
    if (!deliveryBoyId) return;
    setAssigningId(orderGroupId);
    try {
        let response;
        try {
            response = await Axios({
                url: SummaryApi.admin.assignOrder.url,
                method: SummaryApi.admin.assignOrder.method,
                data: { orderId: orderId, deliveryBoyId }
            });
        } catch (initialErr) {
            if (initialErr?.response?.status === 404) {
                // Try fallback route (/api/order/assign or /api/admin/orders/assign)
                const fallbackUrl = SummaryApi.admin.assignOrder.url.includes('/api/admin')
                    ? '/api/order/assign'
                    : '/api/admin/orders/assign';
                response = await Axios({
                    url: fallbackUrl,
                    method: 'post',
                    data: { orderId: orderId, deliveryBoyId }
                });
            } else {
                throw initialErr;
            }
        }

        if (response?.data?.success) {
            toast.success("Delivery boy assigned!");
            fetchOrders();
        } else {
            toast.error(response?.data?.message || "Assignment failed");
        }
    } catch (err) {
        toast.error(err?.response?.data?.message || "Assignment failed");
    } finally {
        setAssigningId(null);
    }
  };

  const getStatusIndex = (status) => {
    const normalized = normalizeStatus(status);
    return statusSteps.findIndex((step) => normalizeStatus(step) === normalized);
  };

  if (loading) return (
    <div className="p-8 space-y-4">
        <div className="h-10 bg-gray-200 rounded-2xl w-48 animate-pulse mb-6" />
        {[...Array(3)].map((_, i) => (
            <div key={i} className="h-56 bg-white rounded-[2.5rem] animate-pulse" />
        ))}
    </div>
  );

  return (
    <div className="p-4 lg:p-10 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="mb-8 px-2 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          <h2 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <span className="bg-indigo-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg text-xl">📦</span>
            Admin Orders
          </h2>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-2">
            {groupedOrders.length} total orders — {deliveryBoys.length} active delivery partners
          </p>
        </div>

        {/* Search bar */}
        <div className="relative w-full sm:w-72">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
          <input
            type="text"
            placeholder="Search orders, customers…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 bg-white text-xs font-bold text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-400 transition-all shadow-xs"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
              <FaTimes size={11} />
            </button>
          )}
        </div>
      </div>

      {filteredOrders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <span className="text-6xl mb-4">📭</span>
          <p className="text-gray-400 font-black uppercase tracking-widest text-sm">No orders found</p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {filteredOrders.map((order) => {
            const isCancelled = normalizeStatus(order.status) === "cancelled";
            const isDelivered = normalizeStatus(order.status) === "delivered";
            const activeIndex = getStatusIndex(order.status);
            const isDeleting = deletingId === order.orderId;
            const isAssigning = assigningId === order.orderId;

            return (
            <motion.div
                key={order.orderId}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-xl hover:shadow-indigo-50 transition-all ${isDeleting ? 'opacity-40 pointer-events-none' : ''}`}
                onClick={() => navigate(`/admin-portal/order/${order.orderId}`)}
            >
                {/* Card Header */}
                <div className="p-7 border-b border-gray-50">
                    <div className="flex justify-between items-start mb-5">
                        <div>
                            <div className="flex items-center gap-2.5 mb-1.5">
                                <h3 className="font-black text-2xl text-gray-900">#{order.orderId.slice(-6)}</h3>
                                <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${
                                    order.payment_status === 'CASH ON DELIVERY' 
                                        ? 'bg-orange-50 text-orange-600 border border-orange-100' 
                                        : 'bg-blue-50 text-blue-600 border border-blue-100'
                                }`}>
                                    {order.payment_status === 'CASH ON DELIVERY' ? 'COD' : 'ONLINE'}
                                </span>
                            </div>
                            <p className="text-sm font-bold text-gray-700 flex items-center gap-2">👤 {order.user}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">
                                📅 {new Date(order.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                            {order.deliveryDate && (
                                <p className="text-[10px] text-green-600 font-black uppercase mt-1">
                                    🚚 Delivery: {new Date(order.deliveryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </p>
                            )}
                            {order.customerQuery && (
                                <div className="mt-2.5 p-2.5 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-950 max-w-md">
                                    <span className="font-black text-[9px] uppercase tracking-wider text-amber-800 block mb-0.5">💬 Customer Query / Note:</span>
                                    <p className="line-clamp-2 italic font-medium">"{order.customerQuery}"</p>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {order.payment_screenshot && (
                                <a
                                    href={order.payment_screenshot}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors flex items-center gap-1"
                                    title="View Payment Screenshot"
                                >
                                    <span>📷 Receipt</span>
                                </a>
                            )}
                            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                isCancelled ? "bg-red-50 text-red-600 border border-red-100" : isDelivered ? "bg-green-50 text-green-700 border border-green-100" : "bg-indigo-50 text-indigo-700 border border-indigo-100"
                            }`}>
                                {order.status}
                            </div>
                        </div>
                    </div>

                    {/* Status stepper */}
                    <div className="px-2 py-6 bg-gray-50/60 rounded-[1.5rem] border border-gray-100">
                        <div className="flex items-center justify-between relative">
                            <div className="absolute top-2.5 left-[6%] w-[88%] h-[2px] bg-gray-200 z-0" />
                            {statusSteps.map((step, i) => {
                                const active = !isCancelled && i <= activeIndex;
                                return (
                                <div key={i} className="flex flex-col items-center flex-1 relative z-10">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                        active ? "bg-indigo-600 border-indigo-600" : "bg-white border-gray-300"
                                    }`}>
                                        {active && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                    </div>
                                    <p className={`text-[7px] font-black mt-2 text-center uppercase tracking-widest ${active ? "text-indigo-600" : "text-gray-300"}`}>
                                        {step}
                                    </p>
                                </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Payment Screenshot Verification Banner */}
                    {order.payment_screenshot && (
                        <div 
                            className="mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 flex items-center justify-between gap-3 transition-all hover:bg-amber-100/60"
                            onClick={(e) => {
                                e.stopPropagation();
                                setPreviewImage(order.payment_screenshot);
                            }}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-white border border-amber-300 shadow-xs shrink-0">
                                    <img 
                                        src={order.payment_screenshot} 
                                        alt="Payment Receipt" 
                                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                                    />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="px-2 py-0.5 rounded-md bg-amber-200 text-amber-900 text-[9px] font-black uppercase tracking-wider">
                                            📷 UPI Screenshot Attached
                                        </span>
                                        <span className="text-[10px] font-black text-gray-800">
                                            ₹{order.totalAmt || 0}
                                        </span>
                                    </div>
                                    <p className="text-xs font-bold text-gray-800 mt-1 truncate">
                                        Tap to inspect receipt & verify
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-[10px] font-black uppercase tracking-wider transition-all shadow-xs shrink-0 cursor-pointer flex items-center gap-1"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewImage(order.payment_screenshot);
                                }}
                            >
                                <span>Inspect</span>
                                <span>↗</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Card Footer - Controls */}
                <div className="p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
                    {/* Status Dropdown + Delete */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 relative">
                            <select
                                value={order.status}
                                disabled={isDelivered}
                                onChange={(e) => updateStatus(order._id, e.target.value)}
                                className="w-full appearance-none border border-gray-100 bg-white px-4 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest outline-none focus:border-indigo-500 transition-all cursor-pointer"
                            >
                                {statusSteps.concat("Cancelled").map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-[8px]">▼</div>
                        </div>

                        <button
                            onClick={(e) => handleDeleteOrder(order, e)}
                            disabled={isDeleting}
                            className="w-12 h-12 flex items-center justify-center bg-red-50 text-red-600 rounded-2xl font-black text-[10px] uppercase hover:bg-red-600 hover:text-white transition-all shrink-0 disabled:opacity-40"
                            title="Delete entire order"
                        >
                            {isDeleting ? (
                                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" className="opacity-75"/></svg>
                            ) : (
                                <FaTrash size={13} />
                            )}
                        </button>
                    </div>

                    {/* Delivery Boy Assignment Section */}
                    <div className="border-t border-gray-50 pt-4">
                        {order.deliveryBoyName ? (
                            /* Already assigned — show assigned delivery boy */
                            <div className="flex items-center gap-3 bg-indigo-50 px-5 py-3.5 rounded-2xl border border-indigo-100">
                                <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                                    <FaMotorcycle size={13} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Assigned Partner</p>
                                    <p className="text-sm font-black text-indigo-800 truncate">{order.deliveryBoyName}</p>
                                </div>
                                <FaCheckCircle className="text-indigo-400 shrink-0" size={16} />
                            </div>
                        ) : (
                            /* Not assigned — show QR + dropdown to assign */
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-white rounded-2xl border border-gray-100 shadow-sm shrink-0">
                                    <QRCodeSVG value={order.orderId} size={72} marginSize={1} />
                                </div>
                                <div className="flex-1 space-y-2">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Assign Delivery Partner</p>
                                    {deliveryBoys.length === 0 ? (
                                        <p className="text-[10px] text-amber-600 font-bold bg-amber-50 px-3 py-2 rounded-xl border border-amber-100">
                                            ⚠ No active delivery partners available
                                        </p>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <div className="relative flex-1">
                                                <select
                                                    defaultValue=""
                                                    onChange={(e) => {
                                                        if (e.target.value) {
                                                            handleAssignDeliveryBoy(order.orderId, order.orderId, e.target.value, { stopPropagation: () => {} });
                                                            e.target.value = "";
                                                        }
                                                    }}
                                                    disabled={isAssigning}
                                                    className="w-full appearance-none border border-gray-200 bg-white px-3 py-2.5 rounded-xl font-bold text-[10px] text-gray-700 outline-none focus:border-indigo-500 transition-all cursor-pointer disabled:opacity-50"
                                                >
                                                    <option value="">Select partner…</option>
                                                    {deliveryBoys.map(db => (
                                                        <option key={db._id} value={db._id}>
                                                            {db.name} {db.mobile ? `(${db.mobile})` : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-[8px]">▼</div>
                                            </div>
                                            {isAssigning && (
                                                <div className="w-7 h-7 flex items-center justify-center">
                                                    <svg className="animate-spin w-4 h-4 text-indigo-600" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" className="opacity-75"/></svg>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <p className="text-[9px] text-gray-400 font-bold">
                                        Only <span className="text-green-600">{deliveryBoys.length} active</span> partner{deliveryBoys.length !== 1 ? 's' : ''} shown
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
            );
        })}
      </div>

      {/* Payment Screenshot Modal */}
      {previewImage && (
        <div 
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setPreviewImage(null)}
        >
            <div 
                className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-wider text-gray-900">Payment Screenshot Verification</h3>
                        <p className="text-[10px] text-gray-400 font-bold">Review customer's uploaded UPI receipt</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <a
                            href={previewImage}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
                        >
                            <span>Open Original</span>
                            <span>↗</span>
                        </a>
                        <button
                            onClick={() => setPreviewImage(null)}
                            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center font-bold text-sm cursor-pointer"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto rounded-2xl bg-gray-50 border border-gray-100 p-2 flex items-center justify-center min-h-[300px]">
                    <img 
                        src={previewImage} 
                        alt="Payment Proof" 
                        className="max-h-[65vh] w-auto object-contain rounded-xl shadow-xs" 
                    />
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;