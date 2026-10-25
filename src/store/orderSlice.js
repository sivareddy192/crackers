import { createSlice } from "@reduxjs/toolkit";

const initialValue = {
    order: []
};

const orderSlice = createSlice({
    name: "order",
    initialState: initialValue,
    reducers: {
        setOrder: (state, action) => {
            state.order = [...action.payload];
        },
        clearOrder: (state) => {
            state.order = [];
        },

        updateOrderStatus: (state, action) => {
            const { orderId, status } = action.payload;

            state.order = state.order.map((ord) =>
                ord._id === orderId ? { ...ord, status } : ord
            );
        }
    }
});

export const { setOrder, clearOrder, updateOrderStatus } = orderSlice.actions;

export default orderSlice.reducer;
