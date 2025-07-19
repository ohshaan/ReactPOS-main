import { createSlice } from "@reduxjs/toolkit";

const initialState = {
	slab: null,
};

const paySlice = createSlice({
	name: "pay",
	initialState,
	reducers: {
		updateSlab: (state, action) => {
			state.slab = action?.payload;
		},
	},
});

export const { updateSlab } = paySlice.actions;

export default paySlice.reducer;
