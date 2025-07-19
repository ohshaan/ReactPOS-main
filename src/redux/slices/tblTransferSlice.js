import { createSlice } from "@reduxjs/toolkit";

const initialState = {
	tableTransferStatus: false,
	orderhdrid: null
};

const tblTransferSlice = createSlice({
	name: "tabletransfer",
	initialState,
	reducers: {
		updateTransferStatus: (state, action) => {
			state.tableTransferStatus = action?.payload;
		},
		updateOrderhdrid: (state, action) => {
			state.orderhdrid = action?.payload;
		}
	},
});
export const { updateTransferStatus, updateOrderhdrid } = tblTransferSlice.actions;

export default tblTransferSlice.reducer;
