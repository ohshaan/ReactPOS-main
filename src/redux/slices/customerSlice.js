import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  customer: null,
};

const customerSlice = createSlice({
  name: "customer",
  initialState,
  reducers: {
    updateCustomerData: (state, action) => {
      state.customer = action?.payload;
    },
  },
});
export const { updateCustomerData } =
customerSlice.actions;

export default customerSlice.reducer;
