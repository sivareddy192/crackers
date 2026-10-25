import { createContext, useContext, useEffect, useState } from "react";
import Axios from "../utils/Axios";
import SummaryApi from "../common/SummaryApi";
import { useDispatch, useSelector } from "react-redux";
import {
  clearCartItem,
  handleAddItemCart,
  updateCartItemQtyOptimistic,
  addCartItemOptimistic,
} from "../store/cartProduct";
import AxiosToastError from "../utils/AxiosToastError";
import toast from "react-hot-toast";
import { clearAddress, handleAddAddress } from "../store/addressSlice";
import { clearOrder, setOrder } from "../store/orderSlice";
import { setUserDetails } from "../store/userSlice";

export const GlobalContext = createContext(null);
export const useGlobalContext = () => useContext(GlobalContext);

const GlobalProvider = ({ children }) => {
  const dispatch = useDispatch();

  const [totalPrice, setTotalPrice] = useState(0);
  const [notDiscountTotalPrice, setNotDiscountTotalPrice] = useState(0);
  const [totalQty, setTotalQty] = useState(0);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [handlingCharge, setHandlingCharge] = useState(0);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const cartItem = useSelector((state) => state.cartItem.cart);
  const user = useSelector((state) => state?.user);

  // ✅ FETCH USER
  const fetchUser = async () => {
    try {
      const response = await Axios({
        ...SummaryApi.userDetails,
      });
      const { data: responseData } = response;
      if (responseData.success) {
        dispatch(setUserDetails(responseData.data));
      }
    } catch (error) {
      console.log("Error fetching user details:", error);
    }
  };

  // ✅ FETCH CART
  const fetchCartItem = async () => {
    try {
      const response = await Axios({
        ...SummaryApi.getCartItem,
      });

      const { data: responseData } = response;

      if (responseData.success) {
        dispatch(handleAddItemCart(responseData.data));
      }
    } catch (error) {
      console.log("Error fetching cart items:", error);
    }
  };

  // ✅ ADD ITEM TO CART
  const addItemToCart = async (product) => {
      if(!product?._id) return;
      
      // ⚡ 1. OPTIMISTIC RENDER: Create synthetic temporary cart item and push immediately!
      const tempId = "temp_" + Date.now();
      const syntheticItem = {
          _id: tempId,
          productId: product, // Object containing details needed by components
          quantity: 1,
          unit: product.unit || ""
      };
      
      dispatch(addCartItemOptimistic(syntheticItem));

      try {
          const response = await Axios({
              ...SummaryApi.addTocart,
              data: {
                  productId: product._id.toString(),
                  unit: product.unit?.toString() || ""
              }
          });

          const { data: responseData } = response;
          
          // Always refresh true state from DB once settled to finalize correct IDs
          fetchCartItem(); 
          
          return responseData;
      } catch (error) {
          fetchCartItem(); // Revert synthetic UI on error by hard refresh
          AxiosToastError(error);
          return error;
      }
  };

  // ✅ UPDATE CART QTY
  const updateCartItem = async (id, qty) => {
    // 🚀 OPTIMISTIC UI UPDATE: Push instantly so UI reacts in 1ms
    dispatch(updateCartItemQtyOptimistic({ _id: id, qty: qty }));

    try {
      const response = await Axios({
        ...SummaryApi.updateCartItemQty,
        data: {
          _id: id,
          qty: qty,
        },
      });

      const { data: responseData } = response;

      if (responseData.success) {
        // No need to do an extra network hit fetchCartItem() anymore!
        return responseData;
      } else {
          // If backend explicitly rejects (e.g., stock issue), revert to truth
          fetchCartItem();
      }
    } catch (error) {
      // On network failure, revert UI
      fetchCartItem();
      AxiosToastError(error);
      return error;
    }
  };

  // ✅ DELETE CART ITEM
  const deleteCartItem = async (cartId) => {
    try {
      const response = await Axios({
        ...SummaryApi.deleteCartItem,
        data: {
          _id: cartId,
        },
      });

      const { data: responseData } = response;

      if (responseData.success) {
        toast.success(responseData.message);
        fetchCartItem();
      }
    } catch (error) {
      AxiosToastError(error);
    }
  };

  // ✅ CALCULATIONS
  useEffect(() => {
    if (!cartItem || !Array.isArray(cartItem)) return;

    // Filter valid items once for all calculations
    const validItems = cartItem.filter(item => item?.productId);

    // Total Quantity
    const qty = validItems.reduce((prev, curr) => prev + (curr.quantity || 0), 0);
    setTotalQty(qty);

    // Subtotal (with product discount)
    const subtotal = validItems.reduce((prev, curr) => {
      let price = curr?.productId?.price || 0;

      // If item is a variant, find its specific price/discount
      if (curr.unit && curr.unit !== curr.productId?.unit) {
        const variant = curr.productId?.variants?.find(v => v.unit === curr.unit);
        if (variant) {
          price = variant.price;
        }
      }

      return prev + price * (curr.quantity || 0);
    }, 0);
    setTotalPrice(subtotal);

    // Total without any discount (for comparison)
    const originalPrice = validItems.reduce((prev, curr) => {
      let price = curr?.productId?.price || 0;
      let mrp = curr?.productId?.mrp || curr?.productId?.price || 0;
      if (curr.unit && curr.unit !== curr.productId?.unit) {
        const variant = curr.productId?.variants?.find(v => v.unit === curr.unit);
        if (variant) mrp = variant.mrp;
      }
      return prev + mrp * (curr.quantity || 0);
    }, 0);
    setNotDiscountTotalPrice(originalPrice);

    // Charges logic
    if (qty > 0) {
      setDeliveryCharge(subtotal < 199 ? 30 : 0);
      setHandlingCharge(subtotal > 199 ? 9 : 0);
    } else {
      setDeliveryCharge(0);
      setHandlingCharge(0);
    }

    // Reset coupon if minAmount not met
    if (appliedCoupon && subtotal < (appliedCoupon.minAmount || 0)) {
        setAppliedCoupon(null);
        setCouponDiscount(0);
        toast.error(`Coupon removed: Minimum order of ₹${appliedCoupon.minAmount} required`);
    } else if (appliedCoupon) {
        let discount = Math.ceil((subtotal * appliedCoupon.discountPercent) / 100);
        if (appliedCoupon.maxDiscount && discount > appliedCoupon.maxDiscount) {
            discount = appliedCoupon.maxDiscount;
        }
        setCouponDiscount(discount);
    } else {
        setCouponDiscount(0);
    }
  }, [cartItem, appliedCoupon]);

  // ✅ FETCH ADDRESS
  const fetchAddress = async () => {
    try {
      const response = await Axios({
        ...SummaryApi.getAddress,
      });

      const { data: responseData } = response;

      if (responseData.success) {
        dispatch(handleAddAddress(responseData.data));
      }
    } catch (error) {}
  };

  // ✅ FETCH ORDERS
  const fetchOrder = async () => {
    try {
      const response = await Axios({
        ...SummaryApi.getOrderItems,
      });

      const { data: responseData } = response;

      if (responseData.success) {
        dispatch(setOrder(responseData.data));
      }
    } catch (error) {
      console.log(error);
    }
  };

  // ✅ INITIAL LOAD
  useEffect(() => {
    if (!user?._id) {
      dispatch(clearCartItem());
      dispatch(clearAddress());
      dispatch(clearOrder());
      return;
    }

    fetchCartItem();
    fetchAddress();
    fetchOrder();
  }, [user]);

  // 🔥🔥🔥 NEW: LISTEN FOR CART UPDATE EVENT
  useEffect(() => {
    const handleCartUpdate = () => {
      fetchCartItem();
    };

    window.addEventListener("cartUpdated", handleCartUpdate);

    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdate);
    };
  }, []);

  return (
    <GlobalContext.Provider
      value={{
        fetchCartItem,
        addItemToCart,
        updateCartItem,
        deleteCartItem,
        deliveryCharge,
        handlingCharge,
        couponDiscount,
        appliedCoupon,
        setAppliedCoupon,
        totalPrice,
        totalQty,
        notDiscountTotalPrice,
        fetchOrder,
        fetchUser,
        fetchAddress,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export default GlobalProvider;