import { createSlice } from "@reduxjs/toolkit";

const initialValue = {
    addressList : []
}

const addressSlice = createSlice({
    name : 'address',
    initialState : initialValue,
    reducers : {
        handleAddAddress : (state,action)=>{
            state.addressList = [...action.payload]
        },
        clearAddress : (state)=>{
            state.addressList = []
        }
    }
})

export const {handleAddAddress, clearAddress} = addressSlice.actions

export default addressSlice.reducer
