import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    cart : []
}

const cartSlice = createSlice({
    name : "cartItem",
    initialState : initialState,
    reducers : {
        handleAddItemCart : (state,action)=>{
           state.cart = [...action.payload]
        },
        updateCartItemQtyOptimistic : (state,action)=>{
            const { _id, qty } = action.payload;
            const index = state.cart.findIndex(item => item._id === _id);
            if(index !== -1){
                state.cart[index] = { ...state.cart[index], quantity : qty };
            }
        },
        addCartItemOptimistic : (state,action)=>{
            state.cart.push(action.payload);
        },
        clearCartItem : (state)=>{
            state.cart = []
        }
    }
})

export const { handleAddItemCart, clearCartItem, updateCartItemQtyOptimistic, addCartItemOptimistic } = cartSlice.actions

export default cartSlice.reducer
