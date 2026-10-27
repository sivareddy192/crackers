import { createSlice } from "@reduxjs/toolkit";

const getCachedCart = () => {
    try {
        const token = localStorage.getItem('accessToken');
        if (!token) return [];
        const cached = localStorage.getItem('cached_cart_items');
        if (!cached) return [];
        const parsed = JSON.parse(cached);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const saveCachedCart = (cart) => {
    try {
        if (Array.isArray(cart) && cart.length > 0) {
            localStorage.setItem('cached_cart_items', JSON.stringify(cart));
        } else {
            localStorage.removeItem('cached_cart_items');
        }
    } catch (e) {}
};

const initialState = {
    cart : getCachedCart()
}

const cartSlice = createSlice({
    name : "cartItem",
    initialState : initialState,
    reducers : {
        handleAddItemCart : (state,action)=>{
            const nextCart = Array.isArray(action.payload) ? [...action.payload] : [];
            state.cart = nextCart;
            saveCachedCart(nextCart);
        },
        updateCartItemQtyOptimistic : (state,action)=>{
            const { _id, qty } = action.payload;
            const index = state.cart.findIndex(item => item._id === _id);
            if(index !== -1){
                state.cart[index] = { ...state.cart[index], quantity : qty };
                saveCachedCart(state.cart);
            }
        },
        addCartItemOptimistic : (state,action)=>{
            state.cart.push(action.payload);
            saveCachedCart(state.cart);
        },
        removeCartItemOptimistic : (state,action)=>{
            const id = action.payload;
            state.cart = state.cart.filter(item => item._id !== id);
            saveCachedCart(state.cart);
        },
        clearCartItem : (state)=>{
            state.cart = [];
            try {
                localStorage.removeItem('cached_cart_items');
            } catch (e) {}
        }
    }
})

export const { handleAddItemCart, clearCartItem, updateCartItemQtyOptimistic, addCartItemOptimistic, removeCartItemOptimistic } = cartSlice.actions

export default cartSlice.reducer
