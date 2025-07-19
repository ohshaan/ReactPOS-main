// src/store/selectors/orderSelectors.ts
import { createSelector } from "reselect";
// adjust the path as per your setup

const selectOrderState = (state) => state.order;

// Basic selectors
export const selectOrderType = createSelector(
	[selectOrderState],
	(order) => order.orderType
);

export const selectTable = createSelector(
	[selectOrderState],
	(order) => order.table
);

export const selectSelectedMenuList = createSelector(
	[selectOrderState],
	(order) => order.selectedMenuList
);

export const selectDefaultMenuList = createSelector(
	[selectOrderState],
	(order) => order.defaultMenuList
);

export const selectConfig = createSelector(
	[selectOrderState],
	(order) => order.config
);

export const selectConfigLs = JSON.parse(localStorage.getItem("config"));

export const selectCurrentDateLs = localStorage.getItem("currentDate");

export const selectOrderDate = createSelector(
	[selectOrderState],
	(order) => order.date
);

// Derived selector: Total Amount
export const selectTotalAmount = createSelector(
	[selectSelectedMenuList],
	(menuList) =>
		menuList.reduce((sum, dish) => sum + Number(dish?.amount || 0), 0)
);

// Derived selector: Total Quantity
export const selectTotalQuantity = createSelector(
	[selectSelectedMenuList],
	(menuList) => menuList.reduce((sum, dish) => sum + Number(dish?.qty || 0), 0)
);

export const selectTotal = createSelector(
	[selectOrderState],
	(order) => order.total
);

export const selectAdvanceOrder = createSelector(
	[selectOrderState],
	(order) => order.advanceOrder
);

export const selectKotDetails = createSelector(
	[selectOrderState],
	(order) => order.kotDetail
);

export const selectKotEdit = createSelector(
	[selectOrderState],
	(order) => order.edit
);

export const selectKotPrev = createSelector(
	[selectOrderState],
	(order) => order.prev
);

export const selectKotCust = createSelector(
	[selectOrderState],
	(order) => order.updateCus
);

export const selectKotTableUp = createSelector(
	[selectOrderState],
	(order) => order.updateTable
);

export const selectPreviousId = createSelector(
	[selectOrderState],
	(order) => order.previousOrderId
);

export const selectCusotmerOrderMod = createSelector(
	[selectOrderState],
	(order) => order.customerOrderMod
);

export const selectNotes = createSelector(
	[selectOrderState],
	(order) => order.notes
);
