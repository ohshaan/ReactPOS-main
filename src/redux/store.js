import { configureStore } from "@reduxjs/toolkit";
import {
	customerReducer,
	orderReducer,
	userReducer,
	payReducer,
	tblTransferReducer
} from "./slices";

const store = configureStore({
	reducer: {
		user: userReducer,
		order: orderReducer,
		customer: customerReducer,
		pay: payReducer,
		tbltransfer:tblTransferReducer
	},
});

export default store;
