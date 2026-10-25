import { createSlice } from "@reduxjs/toolkit";

const getCachedUser = () => {
    try {
        const token = localStorage.getItem('accessToken');
        if (!token) return null;
        const cached = localStorage.getItem('cached_user');
        return cached ? JSON.parse(cached) : null;
    } catch {
        return null;
    }
};

const defaultInitialValue = {
    _id : "",
    name : "",
    email : "",
    avatar : "",
    mobile : "",
    verify_email : "",
    last_login_date : "",
    status : "",
    address_details : [],
    shopping_cart : [],
    orderHistory : [],
    role : "",
    usedCoupons : [],
};

const cachedUser = getCachedUser();
const initialValue = cachedUser ? { ...defaultInitialValue, ...cachedUser } : defaultInitialValue;

const userSlice = createSlice({
    name : 'user',
    initialState : initialValue,
    reducers : {
        setUserDetails : (state,action) =>{
            if (action.payload) {
                state._id = action.payload._id || "";
                state.name  = action.payload.name || "";
                state.email = action.payload.email || "";
                state.avatar = action.payload.avatar || "";
                state.mobile = action.payload.mobile || "";
                state.verify_email = action.payload.verify_email || "";
                state.last_login_date = action.payload.last_login_date || "";
                state.status = action.payload.status || "";
                state.address_details = action.payload.address_details || [];
                state.shopping_cart = action.payload.shopping_cart || [];
                state.orderHistory = action.payload.orderHistory || [];
                state.role = action.payload.role || "";
                state.usedCoupons = action.payload.usedCoupons || [];

                try {
                    localStorage.setItem('cached_user', JSON.stringify({
                        _id: state._id,
                        name: state.name,
                        email: state.email,
                        avatar: state.avatar,
                        mobile: state.mobile,
                        role: state.role,
                        status: state.status,
                        usedCoupons: state.usedCoupons
                    }));
                } catch (e) {}
            }
        },
        updatedAvatar : (state,action)=>{
            state.avatar = action.payload;
            try {
                const cached = getCachedUser();
                if (cached) {
                    cached.avatar = action.payload;
                    localStorage.setItem('cached_user', JSON.stringify(cached));
                }
            } catch (e) {}
        },
        logout : (state,action)=>{
            state._id = ""
            state.name  = ""
            state.email = ""
            state.avatar = ""
            state.mobile = ""
            state.verify_email = ""
            state.last_login_date = ""
            state.status = ""
            state.address_details = []
            state.shopping_cart = []
            state.orderHistory = []
            state.role = ""
            state.usedCoupons = []
            try {
                localStorage.removeItem('cached_user');
                localStorage.removeItem('cached_cart_items');
            } catch (e) {}
        },
    }
})

export const { setUserDetails, logout ,updatedAvatar} = userSlice.actions

export default userSlice.reducer