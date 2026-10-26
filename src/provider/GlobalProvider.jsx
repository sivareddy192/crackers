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

  const addItemToCart = async (product) => {
      if(!product?._id) return;
      
      const tempId = "temp_" + Date.now();
      const syntheticItem = {
          _id: tempId,
          productId: product,
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
          
          fetchCartItem(); 
          
          return responseData;
      } catch (error) {
          fetchCartItem();
          AxiosToastError(error);
          return error;
      }
  };

  const updateCartItem = async (id, qty) => {
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
        return responseData;
      } else {
          fetchCartItem();
      }
    } catch (error) {
      fetchCartItem();
      AxiosToastError(error);
      return error;
    }
  };

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

  useEffect(() => {
    if (!cartItem || !Array.isArray(cartItem)) return;

    const validItems = cartItem.filter(item => item?.productId);

    const qty = validItems.reduce((prev, curr) => prev + (curr.quantity || 0), 0);
    setTotalQty(qty);

    const subtotal = validItems.reduce((prev, curr) => {
      let price = curr?.productId?.price || 0;

      if (curr.unit && curr.unit !== curr.productId?.unit) {
        const variant = curr.productId?.variants?.find(v => v.unit === curr.unit);
        if (variant) {
          price = variant.price;
        }
      }

      return prev + price * (curr.quantity || 0);
    }, 0);
    setTotalPrice(subtotal);

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

    if (qty > 0) {
      setDeliveryCharge(subtotal < 199 ? 30 : 0);
      setHandlingCharge(subtotal > 199 ? 9 : 0);
    } else {
      setDeliveryCharge(0);
      setHandlingCharge(0);
    }

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

  useEffect(() => {
    const hasToken = Boolean(localStorage.getItem('accessToken'));

    if (!user?._id && !hasToken) {
      dispatch(clearCartItem());
      dispatch(clearAddress());
      dispatch(clearOrder());
      return;
    }

    if (user?._id || hasToken) {
      fetchCartItem();
      fetchAddress();
      fetchOrder();
    }
  }, [user?._id]);

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