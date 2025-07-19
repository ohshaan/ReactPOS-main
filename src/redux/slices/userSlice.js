import { createSlice } from "@reduxjs/toolkit";

const initialState = {
	isLoggedIn: false,
	userData: null,
	comapnyLogoApi: null,
};

const userSlice = createSlice({
	name: "user",
	initialState,
	reducers: {
		updateLogin: (state, action) => {
			state.isLoggedIn = action?.payload;
		},
		updateCompanyLogo: (state, action) => {
			state.comapnyLogoApi = action?.payload;
		},
		updateUserDetails: (state, action) => {
			state.userData = action?.payload;
		},
	},
});
export const { updateLogin, updateCompanyLogo, updateUserDetails } =
	userSlice.actions;

export default userSlice.reducer;
