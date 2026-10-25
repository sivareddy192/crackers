import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Axios from "../utils/Axios";
import SummaryApi from "../common/SummaryApi";
import { motion, AnimatePresence } from "framer-motion";
import { getImageUrl } from "../utils/getImageUrl";
import Skeleton from "../components/Skeleton";
import { useGlobalContext } from "../provider/GlobalProvider";
import AxiosToastError from "../utils/AxiosToastError";
import toast from "react-hot-toast";


const statusSteps = [

  "Pending",
  "Confirmed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
];

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);
  const { fetchCartItem } = useGlobalContext();
  const navigate = useNavigate();



  const normalizeStatus = (status) => status?.toLowerCase() || "";



  // ✅ FETCH
  const fetchOrders = useCallback(async () => {
    try {
      const res = await Axios({ ...SummaryApi.order.getOrders });
      const data = res?.data?.data || res?.data || [];
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch Orders Error:", err);
      showToast("Failed to fetch orders", "error");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ✅ FIXED INTERVAL (NO SPAM)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // ✅ GROUPING
  const groupedOrders = Object.values(
    orders.reduce((acc, order) => {
      const key = new Date(order.createdAt).toLocaleString();

      if (!acc[key]) {
        acc[key] = {
          _id: order._id,
          orderId: order.orderId ?? order._id,
          createdAt: order.createdAt,
          status: order.status,
          items: [],
          totalAmt: order.totalAmt || 0,
          subTotalAmt: order.subTotalAmt || 0,
          discountAmt: order.discountAmt || 0,
          couponCode: order.couponCode || "",
          deliveryCharge: order.deliveryCharge || 0,
          handlingCharge: order.handlingCharge || 0,
          deliveryDate: order.deliveryDate,
        };
      }

      const product =
        order.product_details ||
        order.productId ||
        order.product ||
        {};

      const item = {
        name: product?.name || "Unknown Product",
        image: getImageUrl(
          product?.image || product?.images || order?.image
        ),
        quantity: order.quantity || 1,
        price: order.subTotalAmt || product?.price || 0,
      };

      acc[key].items.push(item);

      return acc;
    }, {})
  );

  // ✅ CANCEL
  const cancelOrder = async (id) => {
    try {
      await Axios({
        url: `/api/order/cancel/${id}`,
        method: "put",
      });

      toast.success("Order cancelled");
      fetchOrders();
    } catch (err) {
      AxiosToastError(err);
    }
  };

  // ✅ 🔥 REORDER WITH ITEM COUNT
  const reorder = async (order) => {
    try {
      const id = order.orderId || order._id;

      if (!id) {
        toast.error("Invalid order");
        return;
      }

      const res = await Axios({
        ...SummaryApi.order.reorder,
        data: { orderId: id },
      });

      if (res.data.success) {
        toast.success(res.data.message || "Items added to cart");
        if (fetchCartItem) await fetchCartItem();
        navigate("/cart");
      }
    } catch (err) {
      AxiosToastError(err);
    }
  };

  const getStatusIndex = (status) => {
    const normalized = normalizeStatus(status);
    return statusSteps.findIndex(
      (step) => normalizeStatus(step) === normalized
    );
  };

  if (loading) return (
    <div className="p-4 bg-gray-100 min-h-screen space-y-6">
        <Skeleton className="h-8 w-48 mb-6" />
        {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50 space-y-4">
                <div className="flex justify-between items-center">
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                    <Skeleton className="h-8 w-24 rounded-full" />
                </div>
                <div className="flex justify-between gap-4 pt-4">
                    {[1, 2, 3, 4, 5].map(j => (
                        <div key={j} className="flex-1 flex flex-col items-center gap-2">
                            <Skeleton className="w-4 h-4 rounded-full" />
                            <Skeleton className="h-2 w-full" />
                        </div>
                    ))}
                </div>
            </div>
        ))}
    </div>
  );


  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <div className="flex items-center gap-3 mb-8">
        <h2 className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
          My Orders
          <span className="flex items-center gap-1.5 px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-bold rounded-full border border-green-100">
            <span className="w-1.5 h-1.5 bg-green-600 rounded-full animate-pulse" />
            LIVE
          </span>
        </h2>
      </div>

      {groupedOrders.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No orders found</p>
        </div>
      )}

      {groupedOrders.map((order) => {
        const isCancelled = normalizeStatus(order.status) === "cancelled";
        const activeIndex = getStatusIndex(order.status);

        return (
          <motion.div
            key={order._id}
            layout
            className="bg-white rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 p-5 mb-5 border border-gray-50 overflow-hidden group"
          >
            {/* HEADER */}
            <div className="flex justify-between items-start mb-6">
              <div className="cursor-pointer" onClick={() => navigate(`/dashboard/order-details/${order.orderId}`)}>
                <h3 className="font-black text-gray-900 text-lg group-hover:text-green-700 transition-colors">
                  Order #{String(order.orderId || "").slice(-6).toUpperCase()}
                </h3>
                <p className="text-gray-400 text-[11px] font-bold uppercase tracking-wider mt-1">
                  {order.createdAt ? (
                    <>
                      {new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </>
                  ) : "N/A"}
                </p>
                {order.deliveryDate && (
                  <p className="text-green-600 text-[11px] font-black uppercase tracking-wider mt-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-600 rounded-full animate-pulse" />
                    🚚 Expected Delivery: {new Date(order.deliveryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                )}
              </div>

              <span
                className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg shadow-sm border ${
                  isCancelled 
                  ? "bg-red-50 text-red-600 border-red-100" 
                  : "bg-green-50 text-green-600 border-green-100"
                }`}
              >
                {order.status}
              </span>
            </div>

            {/* TIMELINE */}
            <div className="relative flex items-center justify-between mb-8 px-2">
                {/* Background Connecting Line */}
                <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-0.5 bg-gray-100" />
                
                {statusSteps.map((step, i) => {
                    const active = !isCancelled && i <= activeIndex;
                    const isCurrent = !isCancelled && i === activeIndex;

                    return (
                        <div key={i} className="relative z-10 flex flex-col items-center">
                            <div
                                className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-500 ${
                                    active 
                                    ? "bg-green-600 border-white ring-4 ring-green-50 shadow-sm" 
                                    : "bg-white border-gray-200"
                                } ${isCurrent ? 'scale-125' : ''}`}
                            />
                            <p className={`absolute top-6 whitespace-nowrap text-[8px] font-black uppercase tracking-tighter transition-colors duration-300 ${
                                active ? "text-green-700" : "text-gray-300"
                            }`}>
                                {step === "Out for Delivery" ? "Out" : step}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* QUICK ACTIONS */}
            <div className="flex items-center justify-between mt-10 pt-4 border-t border-gray-50">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setExpanded(expanded === order._id ? null : order._id)
                    }}
                    className="flex items-center gap-1.5 text-blue-600 text-[11px] font-black uppercase tracking-wider hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all"
                >
                    {expanded === order._id ? "Hide details" : "View details"}
                    <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${expanded === order._id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                <div className="flex gap-2">
                    <button 
                        onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/order-details/${order.orderId}`) }}
                        className="bg-gray-50 text-gray-900 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border border-gray-100 hover:bg-white hover:shadow-sm transition-all"
                    >
                        Track
                    </button>
                </div>
            </div>

            {/* DETAILS */}
            <AnimatePresence>
              {expanded === order._id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4"
                >
                  {order.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center py-3 border-b"
                    >
                      <div className="flex items-center gap-4">
                        <img
                          src={item.image}
                          className="w-14 h-14 rounded-xl object-contain bg-gray-100 p-2"
                        />

                        <div>
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-gray-500">
                            Qty: {item.quantity}
                          </p>
                        </div>
                      </div>

                      <span className="font-semibold">
                        ₹{item.price}
                      </span>
                    </div>
                  ))}

                  {/* BILL SUMMARY */}
                  <div className="mt-4 pt-4 border-t space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-medium text-black">₹{order.items.reduce((a, b) => a + (b.price * b.quantity), 0)}</span>
                    </div>

                    {order.deliveryCharge > 0 && (
                      <div className="flex justify-between">
                        <span>Delivery Charge</span>
                        <span className="text-black">₹{order.deliveryCharge}</span>
                      </div>
                    )}

                    {order.handlingCharge > 0 && (
                      <div className="flex justify-between">
                        <span>Handling Charge</span>
                        <span className="text-black">₹{order.handlingCharge}</span>
                      </div>
                    )}

                    {order.discountAmt > 0 && (
                      <div className="flex justify-between text-green-600 font-bold">
                        <span>Coupon Discount ({order.couponCode})</span>
                        <span>- ₹{order.discountAmt}</span>
                      </div>
                    )}
                  </div>

                  {/* TOTAL */}
                  <div className="flex justify-between mt-4 pt-4 border-t-2 border-dashed text-lg font-black text-gray-900">
                    <span>Grand Total</span>
                    <span>₹{order.totalAmt}</span>
                  </div>

                  {/* BUTTONS */}
                  <div className="flex gap-3 mt-4">
                    {normalizeStatus(order.status) === "pending" && (
                      <button
                        onClick={() => cancelOrder(order._id)}
                        className="bg-red-500 text-white px-5 py-2 rounded-lg"
                      >
                        Cancel
                      </button>
                    )}

                    <button
                      onClick={() => reorder(order)}
                      className="bg-green-500 text-white px-5 py-2 rounded-lg"
                    >
                      Reorder
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}

      {/* TOAST component removed as we use react-hot-toast now */}
    </div>
  );
};

export default MyOrders;