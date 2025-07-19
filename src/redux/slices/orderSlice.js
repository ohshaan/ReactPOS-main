import { createSlice } from "@reduxjs/toolkit";
import Swal from "sweetalert2";
import { selectConfigLs } from "../selector/orderSlector";

const calculateUpdatedSalesPrice = (payload, configAmountCfg) => {
	const mainItemQty = parseInt(payload?.qty || 1, 10);
	const configAmount = configAmountCfg ?? 2; // Use nullish coalescing for cleaner default

	// Check if the item is a package
	if (payload?.menupackageitem && payload?.packages) {
		// Start with the main package's base price * its quantity
		let finalLineItemAmount =
			parseFloat(payload?.salesprice || 0) * mainItemQty;

		// Add the cost of all selected sub-items and their customizations
		payload.packages.forEach((category) => {
			if (category?.packages) {
				category.packages.forEach((selectedSubItem) => {
					// Get the BASE price of the sub-item itself (no longer includes custom prices)
					const subItemBasePrice = parseFloat(
						selectedSubItem.submenuprice || 0
					);
					const subItemQty = parseInt(selectedSubItem.submenuqty || 0, 10);

					// Add the total cost of this sub-item (price * quantity)
					finalLineItemAmount += subItemBasePrice * subItemQty;

					// NOW, add the total cost of all attached custom items
					if (selectedSubItem.custom && selectedSubItem.custom.length > 0) {
						selectedSubItem.custom.forEach((customItem) => {
							const customItemPrice = parseFloat(
								customItem.customizemenuprice || 0
							);
							const customItemQty = parseInt(customItem.qty || 1, 10);
							finalLineItemAmount += customItemPrice * customItemQty;
						});
					}
				});
			}
		});

		return parseFloat(finalLineItemAmount.toFixed(configAmount));
	} else {
		// For regular, non-package items, the logic is simple
		const regularItemAmount =
			parseFloat(payload?.salesprice || 0) * mainItemQty;
		return parseFloat(regularItemAmount.toFixed(configAmount));
	}
};

const recalculateTotal = (menuList) => {
	const decimalAmount = selectConfigLs?.amount || 2; // Default to 2 decimal places if not set
	if (menuList.length === 0) return 0;
	return menuList.reduce((sum, item) => {
		return (
			sum + parseFloat(calculateUpdatedSalesPrice(item, decimalAmount) || 0)
		);
	}, 0);
};

const getBaseSubmenuQty = (defaultDish, packagePathIndexes) => {
	if (!defaultDish || !defaultDish.packages) return 0;
	let currentLevel = defaultDish.packages;
	for (let i = 0; i < packagePathIndexes.length; i++) {
		const index = packagePathIndexes[i];
		if (
			!currentLevel[index] ||
			(i < packagePathIndexes.length - 1 && !currentLevel[index].packages)
		) {
			return 0; // Path doesn't exist or structure is wrong
		}
		if (i === packagePathIndexes.length - 1) {
			// Last index is for the submenu item itself
			return currentLevel[index]?.submenuqty || 0;
		}
		currentLevel = currentLevel[index].packages;
	}
	return 0; // Should ideally be found by the loop
};
export const initialState = {
	orderType: { id: 2, name: "Takeaway" },
	table: null,
	selectedMenuList: [],
	config: null,
	date: null,
	incrementCount: 0,
	defaultMenuList: [],
	notes: "",
	total: 0,
	pax: "1",
	advanceOrder: null,
	kotDetail: null,
	edit: false,
	prev: false,
	updateCus: false,
	updateTable: false,
	previousOrderId: null,
	customerOrderMod: null,
};

const orderSlice = createSlice({
	name: "order",
	initialState,
	reducers: {
		updateOrderType: (state, action) => {
			state.orderType = action?.payload;
		},
		updateTable: (state, action) => {
			state.table = action.payload;
		},
		updateConfig: (state, action) => {
			state.config = action?.payload;
		},
		updateDate: (state, action) => {
			state.date = action?.payload;
		},

		addDish: (state, action) => {
			const payload = action.payload;
			const isPackageItemFromPayload = !!payload?.packages;

			const existingIndex = state.selectedMenuList.findIndex(
				(item) => item.menuid === payload.menuid
			);

			if (existingIndex !== -1 && !isPackageItemFromPayload) {
				// --- ITEM EXISTS AND IS NOT A PACKAGE ---
				const existingItem = state.selectedMenuList[existingIndex];
				if (parseFloat(existingItem.salesprice || 0) > 0) {
					existingItem.qty = (existingItem.qty || 0) + 1;
				}
			} else {
				// --- ITEM DOES NOT EXIST OR IS A PACKAGE ---
				let key = 1;
				if (state.selectedMenuList.length > 0) {
					const maxKey = Math.max(
						...state.selectedMenuList.map((i) => parseInt(i?.key || 0, 10))
					);
					key = maxKey + 1;
				}

				const newItem = {
					key: key,
					...payload,
					qty: parseInt(payload.qty || 1, 10),
					amount: 1 * payload.salesprice,
				};

				state.selectedMenuList.push(newItem);
				state.defaultMenuList.push(JSON.parse(JSON.stringify(newItem)));
			}
		},
		updateDish: (state, action) => {
			const { key, menupackageitem } = action.payload;
			const dishIndex = state.selectedMenuList.findIndex(
				(item) => item.key === key
			);

			if (
				dishIndex === -1 ||
				parseFloat(state.selectedMenuList[dishIndex].salesprice || 0) <= 0
			) {
				return; // Do nothing if item not found or price is not positive
			}

			const item = state.selectedMenuList[dishIndex];
			const newQty = (item.qty || 0) + 1;
			const newAmount = newQty * item.salesprice;

			let updatedPackages = item.packages;
			if (menupackageitem && item.packages) {
				const defaultDish = state.defaultMenuList.find((d) => d.key === key);
				if (defaultDish) {
					updatedPackages = item.packages.map(
						(packageGroup, pkgGroupIndex) => ({
							...packageGroup,
							packages: packageGroup.packages?.map((submenu, submenuIndex) => ({
								...submenu,
								submenuqty:
									getBaseSubmenuQty(defaultDish, [
										pkgGroupIndex,
										submenuIndex,
									]) * newQty,
							})),
						})
					);
				}
			}
			state.selectedMenuList[dishIndex] = {
				...item,
				qty: newQty,
				amount: newAmount,
				packages: updatedPackages,
			};
		},
		removeDish: (state, action) => {
			//console.log("remove dish action", action);
			const { key, menupackageitem } = action.payload;

			const dishIndex = state.selectedMenuList.findIndex((i) => i?.key === key);
			if (dishIndex === -1) return; // Dish not found

			const dish = state.selectedMenuList[dishIndex];

			// --- ADDED CHECK HERE ---
			if (parseFloat(dish.salesprice || 0) <= 0) {
				//console.log(`Item ${key} has salesprice <= 0, not removing quantity.`);
				// If you want to allow full removal even if price is 0,
				// you might need a different condition or a flag in payload (e.g. action.payload.forceRemove)
				// For now, based on your request, quantity change is skipped.
				return; // Do not modify if salesprice is not > 0
			}

			// If quantity is 1, and the intention is just to "decrement", do nothing.
			// To actually remove it, you might need a separate action or a flag in payload.
			if (dish.qty === 1) {
				// As per original logic: "If quantity is exactly 1, do nothing."
				// If you want to remove it when qty is 1, this logic needs to change.
				// For example, check for action.payload.forceRemove
				//console.log(
				// 	`Dish ${key} quantity is 1, not decrementing further based on original logic.`
				// );
				return;
			}

			if (dish.qty > 1) {
				const newQty = dish.qty - 1;
				const newAmount = newQty * dish.salesprice;
				const newIncrementCount = (dish.incrementCount || 0) - 1; // Symmetrical decrement

				let updatedPackages = dish.packages;
				if (menupackageitem && dish.packages) {
					const defaultDish = state.defaultMenuList.find((d) => d.key === key);
					if (defaultDish) {
						// Only proceed if defaultDish is found
						updatedPackages = dish.packages.map(
							(packageGroup, pkgGroupIndex) => ({
								...packageGroup,
								packages: packageGroup.packages?.map(
									(submenu, submenuIndex) => {
										const baseSubmenuQty = getBaseSubmenuQty(defaultDish, [
											pkgGroupIndex,
											submenuIndex,
										]);
										return {
											...submenu,
											submenuqty: baseSubmenuQty * newQty, // Recalculate based on new main item quantity
										};
									}
								),
							})
						);
					} else {
						console.warn(
							`Default dish for key ${key} not found. Submenu quantities might not be updated correctly for package item.`
						);
						// Keep existing submenu quantities or set to 0 if default is missing?
						// For now, keeping existing if default is not found, but this indicates a data consistency issue.
					}
				}

				// Create a new array for selectedMenuList with the updated item
				state.selectedMenuList = [
					...state.selectedMenuList.slice(0, dishIndex),
					{
						...dish,
						qty: newQty,
						amount: newAmount,
						incrementCount: newIncrementCount,
						packages: updatedPackages,
					},
					...state.selectedMenuList.slice(dishIndex + 1),
				];
			} else {
				// dish.qty <= 0 (or some other unexpected state, e.g., if qty was not 1 and not > 1)
				// This case handles removal if quantity drops to 0 or below.
				// Given the `dish.qty === 1` check above, this branch would be hit
				// if the initial quantity was 0 or negative (bad state) or if the logic
				// for `qty === 1` was to proceed to decrement to 0.
				// Since original logic for qty === 1 is "do nothing", this branch handles
				// items that should be removed because their qty is already <=0.
				state.selectedMenuList = state.selectedMenuList.filter(
					(item) => item.key !== key
				);
			}

			// state.total = recalculateTotal(state.selectedMenuList, state.config?.amount);
		},
		removeFullDish: (state, action) => {
			state.selectedMenuList = state.selectedMenuList.filter(
				(i) => i?.key !== action.payload.key
			);

			// state.total = recalculateTotal(
			// 	state.selectedMenuList,
			// 	state.config?.amount
			// );
		},
		// addTopping: (state, action) => {
		// 	const id = action.payload.id;
		// 	if (id) {
		// 		state.selectedMenuList = state.selectedMenuList.map((item) => {
		// 			if (item?.key === id) {
		// 				const toppingExists = (item?.topping || []).some(
		// 					(i) => i?.topping_id === action.payload?.data?.topping_id
		// 				);

		// 				if (toppingExists) {
		// 					Swal.fire({
		// 						icon: "warning",
		// 						title: "Topping already exists!",
		// 					});
		// 					return item;
		// 				}

		// 				return {
		// 					...item,
		// 					topping: [...(item?.topping || []), action.payload?.data],
		// 				};
		// 			}
		// 			return item;
		// 		});
		// 	} else {
		// 		Swal.fire({
		// 			icon: "warning",
		// 			title: "Please select dish to proceed",
		// 		});
		// 	}
		// },

		addTopping: (state, action) => {
			const { id, data: newToppingData } = action.payload;

			// 1. Check if a dish is selected. If not, show an alert and do nothing.
			if (!id) {
				Swal.fire({
					icon: "warning",
					title: "Please select a dish to add a topping.",
				});
				return;
			}

			const dishIndex = state.selectedMenuList.findIndex(
				(item) => item.key === id
			);

			// 2. Check if the selected dish actually exists in the list.
			if (dishIndex === -1) {
				console.error(`addTopping: Dish with key ${id} not found.`);
				return;
			}

			const originalItem = state.selectedMenuList[dishIndex];

			// 3. Check if the topping already exists on this dish.
			const toppingExists = (originalItem.topping || []).some(
				(t) => t.topping_id === newToppingData.topping_id
			);

			if (toppingExists) {
				Swal.fire({
					icon: "warning",
					title: "Topping already exists!",
				});
				return; // Do nothing if topping is already there.
			}

			// --- NEW LOGIC STARTS HERE ---

			// 4. Create a new item object with the topping added.
			// This is done for both package and non-package items.
			const updatedItem = {
				...originalItem,
				topping: [...(originalItem.topping || []), newToppingData],
			};

			// 5. CONDITION: Check if the item is NOT a package item.
			// `menupackageitem` being false or null/undefined means it's a regular item.
			if (!originalItem.menupackageitem) {
				// It's a regular item, so we update its salesprice.
				// const configAmount = state.config?.amount ?? 2;
				const currentPrice = parseFloat(originalItem.salesprice || 0);
				const toppingPrice = parseFloat(newToppingData.topping_rate || 0);
				const newPrice = currentPrice + toppingPrice;

				// Update the salesprice on our new item object.
				// Use toFixed for precision, consistent with your other calculations.
				updatedItem.salesprice = newPrice;
				updatedItem.amount = originalItem.qty * newPrice;
			}
			// If it IS a package item, we do nothing to the price, just add the topping.

			// 6. Replace the old item with the new one in the list.
			state.selectedMenuList[dishIndex] = updatedItem;
		},

		manageQtyKeyboard: (state, action) => {
			state.selectedMenuList = state?.selectedMenuList?.map((item) => {
				if (item?.key !== action.payload?.selectedDish?.key) {
					return item;
				}
				// --- ADDED CHECK HERE ---
				if (parseFloat(item.salesprice || 0) <= 0) {
					//console.log(
					// 	`Item ${item.key} has salesprice <= 0, not managing keyboard quantity.`
					// );
					return item; // Do not modify if salesprice is not > 0
				}
				return item?.key === action.payload?.selectedDish?.key
					? {
							...item,
							packages: action?.payload?.selectedDish?.menupackageitem
								? item?.packages?.map((i) => ({
										...i,
										packages: i?.packages?.map((pkg) => ({
											...pkg,
											submenuqty:
												action?.payload?.value === "C"
													? ""
													: action?.payload?.value === "bk"
													? pkg?.submenuqty
															?.toString()
															?.slice(0, pkg?.submenuqty.length - 1)
													: pkg?.submenuqty + action?.payload?.value,
										})),
								  }))
								: item?.packages,
							qty:
								action?.payload?.value === "C"
									? ""
									: action?.payload?.value === "bk"
									? item?.qty?.toString()?.slice(0, item?.qty.length - 1)
									: item?.qty + action?.payload?.value,
							amount:
								(action?.payload?.value === "C"
									? 0
									: action?.payload?.value === "bk"
									? item?.qty?.toString()?.slice(0, item?.qty.length - 1)
									: item?.qty + action?.payload?.value) * item?.salesprice,
					  }
					: item;
			});
			// state.total = recalculateTotal(
			// 	state.selectedMenuList,
			// 	state.config?.amount
			// );
		},

		updateDishFull: (state, action) => {
			const { menuData, subMenu } = action.payload;
			const dishIndex = state.selectedMenuList.findIndex(
				(item) => item.key === menuData.key
			);

			if (dishIndex !== -1) {
				state.selectedMenuList[dishIndex] = {
					...state.selectedMenuList[dishIndex],
					packages: subMenu, // Simply replace the package configuration
				};
			}
		},

		addAllDish: (state, action) => {
			state.selectedMenuList = action.payload.items;
			state.defaultMenuList = action.payload.items;
		},
		emptyDishList: (state) => {
			state.selectedMenuList = [];
			state.total = 0;
		},
		kotPax: (state, action) => {
			state.pax = action.payload;
		},
		kotAdvance: (state, action) => {
			state.advanceOrder = action.payload;
		},
		kotDetails: (state, action) => {
			state.kotDetail = action.payload;
		},
		kotEdit: (state, action) => {
			state.edit = action.payload;
		},
		kotPRev: (state, action) => {
			state.prev = action.payload;
		},
		kotCust: (state, action) => {
			state.updateCus = action.payload;
		},
		kotTableIpdate: (state, action) => {
			state.updateTable = action.payload;
		},
		kotPreviousId: (state, action) => {
			state.previousOrderId = action.payload;
		},
		customerOrderMod: (state, action) => {
			state.customerOrderMod = action.payload;
		},

		notesReducer: (state, action) => {
			state.notes = action.payload;
		},
		resetOrder: () => initialState,
	},
	extraReducers: (builder) => {
		// This matcher will run after ANY action that modifies selectedMenuList
		builder.addMatcher(
			(action) => {
				// List of actions that modify selectedMenuList
				const actionsToWatch = [
					"order/addDish",
					"order/updateDish",
					"order/removeDish",
					"order/removeFullDish",
					"order/manageQtyKeyboard",
					"order/updateDishFull",
					"order/addAllDish",
					"order/addTopping",
				];
				// //console.log("actions =", actionsToWatch.includes(action.type));
				return actionsToWatch.includes(action.type);
			},
			(state) => {
				const total = recalculateTotal(state.selectedMenuList);

				//console.log("total reducer watch", total);
				// Recalculate total whenever selectedMenuList is modified
				state.total = recalculateTotal(state.selectedMenuList);
			}
		);
	},
});
export const {
	updateOrderType,
	updateTable,
	addDish,
	updateDish,
	removeDish,
	removeFullDish,
	emptyDishList,
	addTopping,
	manageQtyKeyboard,
	resetMenu,
	notesReducer,
	updateConfig,
	updateDishFull,
	addAllDish,
	updateDate,
	kotPax,
	kotAdvance,
	kotDetails,
	kotEdit,
	kotPRev,
	kotCust,
	kotTableIpdate,
	kotPreviousId,
	customerOrderMod,
	resetOrder,
} = orderSlice.actions;
export default orderSlice.reducer;
