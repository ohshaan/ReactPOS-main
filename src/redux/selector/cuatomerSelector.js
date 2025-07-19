import { createSelector } from "reselect";
// adjust the path as per your setup

const selectCustomerState = (state) => state.customer;

export const selectCustomer = createSelector(
	[selectCustomerState],
	(customer) => customer.customer
);
