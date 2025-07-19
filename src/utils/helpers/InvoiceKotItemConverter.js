import { selectConfigLs } from "../../redux/selector/orderSlector";

export function transformOrderDataWithFullPackagePrice(sourceData) {
	return sourceData.map((item, index) => {
		// Start with the base sales price of the main item
		let calculatedAmount = parseFloat(item.salesprice || 0);

		// If it's a package item, iterate through all nested sub-items and add their cost
		if (item.menupackageitem === 1 && Array.isArray(item.packages)) {
			// Loop through each category in the main 'packages' array
			item.packages.forEach((category) => {
				// Check if this category has its own 'packages' array (the actual sub-items)
				if (Array.isArray(category.packages)) {
					// Loop through each sub-item within the category
					category.packages.forEach((subItem) => {
						const subPrice = parseFloat(subItem.submenuprice || 0);
						const subQty = subItem.submenuqty || 0; // Get quantity, default to 0 if missing

						// Add the cost of this sub-item (price * quantity) to the total
						calculatedAmount += subPrice * subQty;
					});
				}
			});
		}

		// Construct the menu description including toppings
		let description = item.menuname || "Unknown Item";
		if (Array.isArray(item.topping) && item.topping.length > 0) {
			const toppingNames = item.topping.map((t) => t.toping_name).join(", ");
			description += ` (${toppingNames})`;
		}

		// Return the transformed object
		return {
			// orderreferencehdrid: null, //todo
			orderdtlid: item.orderdtlid || null,
			menuid: item.menuid,
			mrenuslno: index, // Use the array index as the serial number
			menudesc: description,
			menuqty: item.qty || 0, // Parent item quantity
			menusalesprice: parseFloat(item.salesprice || 0), // Base price of parent
			menuamount: calculatedAmount, // Final calculated amount (base + all sub-items)
		};
	});
}

// export function transformOrderDataWithFullPackagePriceAndFlatten(sourceData) {
// 	const flattenedList = [];

// 	sourceData.forEach((item, index) => {
// 		// --- Process the Main Item ---
// 		let mainItemCalculatedAmount = parseFloat(item.salesprice || 0);
// 		let mainItemDescription = item.menuname || "Unknown Item";

// 		if (Array.isArray(item.topping) && item.topping.length > 0) {
// 			const toppingNames = item.topping.map((t) => t.toping_name).join(", ");
// 			mainItemDescription += ` (${toppingNames})`;
// 		}

// 		let sumOfSubItemPricesForMainPackage = 0;
// 		if (item.menupackageitem === 1 && Array.isArray(item.packages)) {
// 			item.packages.forEach((category) => {
// 				if (Array.isArray(category.packages)) {
// 					category.packages.forEach((subItem) => {
// 						const subPrice = parseFloat(subItem.submenuprice || 0);
// 						const subQty = parseInt(subItem.submenuqty || 0, 10);
// 						sumOfSubItemPricesForMainPackage += subPrice * subQty;
// 					});
// 				}
// 			});
// 		}

// 		if (item.menupackageitem === 1) {
// 			mainItemCalculatedAmount += sumOfSubItemPricesForMainPackage;
// 		}

// 		flattenedList.push({
// 			orderdtlid: item.orderdtlid || null, // Main item's orderdtlid
// 			menuid: item.menuid,
// 			mrenuslno: index,
// 			menudesc: mainItemDescription,
// 			menuqty: item.qty || 0,
// 			menusalesprice: parseFloat(item.salesprice || 0),
// 			menuamount: mainItemCalculatedAmount,
// 		});

// 		// --- Process Sub-Items for Packages ---
// 		if (item.menupackageitem === 1 && Array.isArray(item.packages)) {
// 			// let subItemLocalIndex = 0; // Renamed for clarity within the main item's scope

// 			item.packages.forEach((category) => {
// 				if (Array.isArray(category.packages)) {
// 					category.packages.forEach((subItem) => {
// 						const subPrice = parseFloat(subItem.submenuprice || 0);
// 						const subQty = parseInt(subItem.submenuqty || 0, 10);
// 						let subItemDescription = subItem.submenudesc || "Unknown Sub-Item";

// 						if (Array.isArray(subItem.custom) && subItem.custom.length > 0) {
// 							const customNames = subItem.custom
// 								.map((c) => {
// 									return `${c.customizemenuid} (Qty: ${c.qty})`;
// 								})
// 								.join(", ");
// 							subItemDescription += ` [Custom: ${customNames}]`;
// 						}

// 						// **Assign orderdtlid for sub-item if it exists**
// 						// Priority:
// 						// 1. subItem.orderdtlid (if such a field directly exists for a specific detail line)
// 						// 2. subItem.packagedtlid (as a unique identifier for the package detail line)
// 						// 3. null (if neither specific ID is present)
// 						const subItemOrderDetailId = subItem.orderdtlid || null;

// 						flattenedList.push({
// 							orderdtlid: subItemOrderDetailId, // Using the determined ID
// 							menuid: subItem.submenuid,
// 							mrenuslno: index,
// 							menudesc: subItemDescription,
// 							menuqty: subQty,
// 							menusalesprice: subPrice,
// 							menuamount: subPrice * subQty,
// 						});
// 					});
// 				}
// 			});
// 		}
// 	});

// 	// Optional: Re-index mrenuslno for a flat continuous sequence
// 	// return flattenedList.map((entry, idx) => ({ ...entry, mrenuslno: idx }));

// 	return flattenedList;
// }

// Your input data (same as before)
// const sourceData = [
// 	{
// 		key: 1,
// 		menuid: 1799,
// 		menucode: "GOC009",
// 		menuname: "FESTIVE BUCKET",
// 		salesprice: "85.00",
// 		menupackageitem: 1,
// 		categorycolor: "",
// 		packages: [
// 			{
// 				menuid: 1799,
// 				packageid: 22,
// 				freeitemcount: 1,
// 				sortingorder: 1,
// 				packagedtlid: 1355,
// 				packagesubmenu: "CHICKEN FLAVOUR",
// 				menudesc: "FESTIVE BUCKET",
// 				packageprice: 85,
// 				packages: [
// 					{
// 						packageid: 22,
// 						packagedtlid: 1355,
// 						submenuid: 3397,
// 						submenuno: "PKG001",
// 						submenudesc: "10 PCS CRISPY CHICKEN NORMAL",
// 						submenuprice: "0.0000",
// 						submenuqty: 1,
// 						submenudefault: 1,
// 						freeitemcount: null,
// 						custom: [
// 							/* ... */
// 						],
// 					},
// 				], // Cost: 1 * 0.00 = 0.00
// 			},
// 			{
// 				menuid: 1799,
// 				packageid: 22,
// 				freeitemcount: 1,
// 				sortingorder: 2,
// 				packagedtlid: 1356,
// 				packagesubmenu: "TENDER FLAVOUR",
// 				menudesc: "FESTIVE BUCKET",
// 				packageprice: 85,
// 				packages: [
// 					{
// 						packageid: 22,
// 						packagedtlid: 1356,
// 						submenuid: 3023,
// 						submenuno: "PKG006",
// 						submenudesc: "10 PC CHICKEN TENDER NORMAL",
// 						submenuprice: "0.0000",
// 						submenuqty: 1,
// 						submenudefault: 1,
// 						freeitemcount: null,
// 					},
// 				], // Cost: 1 * 0.00 = 0.00
// 			},
// 			{
// 				menuid: 1799,
// 				packageid: 22,
// 				freeitemcount: 1,
// 				sortingorder: 3,
// 				packagedtlid: 1357,
// 				packagesubmenu: "FRIES",
// 				menudesc: "FESTIVE BUCKET",
// 				packageprice: 85,
// 				packages: [
// 					{
// 						packageid: 22,
// 						packagedtlid: 1357,
// 						submenuid: 2780,
// 						submenuno: "GOC071",
// 						submenudesc: "FRENCH FRIES FAMILY",
// 						submenuprice: "0.0000",
// 						submenuqty: 1,
// 						submenudefault: 1,
// 						freeitemcount: null,
// 					},
// 				], // Cost: 1 * 0.00 = 0.00
// 			},
// 			{
// 				menuid: 1799,
// 				packageid: 22,
// 				freeitemcount: 3,
// 				sortingorder: 4,
// 				packagedtlid: 1358,
// 				packagesubmenu: "SAUCE",
// 				menudesc: "FESTIVE BUCKET",
// 				packageprice: 85,
// 				packages: [
// 					{
// 						packageid: 22,
// 						packagedtlid: 1358,
// 						submenuid: 2885,
// 						submenuno: "GOC082",
// 						submenudesc: "RANCH SAUCE",
// 						submenuprice: "5.0000",
// 						submenuqty: 3,
// 						submenudefault: 1,
// 						freeitemcount: null,
// 					},
// 				], // Cost: 3 * 5.00 = 15.00
// 			},
// 			{
// 				menuid: 1799,
// 				packageid: 22,
// 				freeitemcount: 3,
// 				sortingorder: 5,
// 				packagedtlid: 1359,
// 				packagesubmenu: "BUN",
// 				menudesc: "FESTIVE BUCKET",
// 				packageprice: 85,
// 				packages: [
// 					{
// 						packageid: 22,
// 						packagedtlid: 1359,
// 						submenuid: 1802,
// 						submenuno: "PKG004",
// 						submenudesc: "BUN",
// 						submenuprice: "0.0000",
// 						submenuqty: 3,
// 						submenudefault: 1,
// 						freeitemcount: null,
// 					},
// 				], // Cost: 3 * 0.00 = 0.00
// 			},
// 			{
// 				menuid: 1799,
// 				packageid: 22,
// 				freeitemcount: 0,
// 				sortingorder: 6,
// 				packagedtlid: 2557,
// 				packagesubmenu: "ADD ON SIDES AND CHICKEN",
// 				menudesc: "FESTIVE BUCKET",
// 				packageprice: 85,
// 				packages: [], // Cost: 0.00
// 			},
// 			{
// 				menuid: 1799,
// 				packageid: 22,
// 				freeitemcount: 0,
// 				sortingorder: 8,
// 				packagedtlid: 2744,
// 				packagesubmenu: "YOUR CHOICE OF DIPPING SAUCE",
// 				menudesc: "FESTIVE BUCKET",
// 				packageprice: 85,
// 				packages: [], // Cost: 0.00
// 			},
// 		],
// 		qty: 1,
// 		amount: "85.00", // Original amount field ignored for calculation
// 		topping: [
// 			{ topping_id: 97, toping_name: "WITH OUT LETTUCE" },
// 			{ topping_id: 99, toping_name: "PLAIN" },
// 		],
// 	},
// 	{
// 		key: 2,
// 		menuid: 2883,
// 		menucode: "GOC002",
// 		menuname: "PASSION FRUIT MOJITO",
// 		salesprice: "12.0000",
// 		menupackageitem: 0,
// 		categorycolor: "",
// 		qty: 1,
// 		amount: "12.00",
// 	},
// 	{
// 		key: 3,
// 		menuid: 2882,
// 		menucode: "GOC0223",
// 		menuname: "ORANGE JUICE",
// 		salesprice: "3.0000",
// 		menupackageitem: 0,
// 		categorycolor: "",
// 		qty: 1,
// 		amount: "3.00",
// 	},
// ];

// // Run the transformation
// const transformedData = transformOrderDataWithFullPackagePrice(sourceData);

// // Display the result
// //console.log(JSON.stringify(transformedData, null, 2));

export function transformOrderDataWithFullPackagePriceAndFlatten(sourceData) {
	// Renamed for clarity
	const flattenedList = [];
	const config = selectConfigLs;

	sourceData.forEach((item, index) => {
		// --- Process the Main Item ---
		const mainItemPrice = parseFloat(item.salesprice || 0);
		const mainItemQty = parseInt(item.qty || 1, 10); // Ensure qty is at least 1 if not defined
		let mainItemDescription = item.menuname || "Unknown Item";

		if (Array.isArray(item.topping) && item.topping.length > 0) {
			const toppingNames = item.topping.map((t) => t.toping_name).join(", ");
			mainItemDescription += ` (${toppingNames})`;
		}

		// Calculate main item's amount based on its own price and qty ONLY
		const mainItemCalculatedAmount = mainItemPrice * mainItemQty;

		flattenedList.push({
			orderdtlid: item.orderdtlid || null,
			menuid: item.menuid,
			mrenuslno: index, // This represents the original item's index
			menudesc: mainItemDescription,
			menuqty: mainItemQty,
			menusalesprice: mainItemPrice,
			menuamount: mainItemCalculatedAmount, // Main item's own total amount
			// You might want to add a flag or parent identifier for sub-items
			parentMenucode: null, // For main items, parent is null
			parentMrenuslno: null,
			isSubItem: false,
		});

		// --- Process Sub-Items for Packages ---
		if (item.menupackageitem === 1 && Array.isArray(item.packages)) {
			item.packages.forEach((category) => {
				if (Array.isArray(category.packages)) {
					category.packages.forEach((subItem) => {
						// const subPrice = parseFloat(subItem.submenuprice || 0);
						const basePrice = subItem?.submenuprice * subItem?.submenuqty;

						const basePriceWithoutQty = subItem?.submenuprice;

						const customeTotalWithoutQty = subItem?.custom
							? subItem.custom.reduce((sum, customItem) => {
									const itemPrice = parseFloat(customItem.customizemenuprice);
									return sum + itemPrice;
							  }, 0)
							: 0;

						const customTotal = subItem?.custom
							? subItem.custom.reduce((sum, customItem) => {
									const itemPrice =
										customItem.qty * parseFloat(customItem.customizemenuprice);
									return sum + itemPrice;
							  }, 0)
							: 0;

						const totalUnitSalePrice =
							parseFloat(basePriceWithoutQty) + customeTotalWithoutQty;
						const totalSalesPrice = basePrice + customTotal;

						const subQty = parseInt(subItem.submenuqty || 0, 10);
						let subItemDescription = subItem.submenudesc || "Unknown Sub-Item";

						if (Array.isArray(subItem.custom) && subItem.custom.length > 0) {
							const customNames = subItem.custom
								.map((c) => {
									// Using customizemenudesc if available, else customizemenuid
									const desc = c.customizemenudesc || `ID:${c.customizemenuid}`;
									return `${desc} (Qty: ${parseInt(c.qty || 1, 10)})`;
								})
								.join(", ");
							subItemDescription += ` [Custom: ${customNames}]`;
						}

						const subItemOrderDetailId = subItem.orderdtlid || null;

						flattenedList.push({
							orderdtlid: subItemOrderDetailId,
							menuid: subItem.submenuid, // Sub-item's own ID
							mrenuslno: index, // Link to the original parent package item's index
							menudesc: subItemDescription,
							menuqty: subQty,
							menusalesprice: totalUnitSalePrice,
							menuamount: totalSalesPrice, // Sub-item's own total amount
							parentMenucode: item.menucode || item.menuid.toString(), // ID of the parent package
							parentMrenuslno: index,
							isSubItem: true,
						});
					});
				}
			});
		}
	});

	// Optional: If you want mrenuslno to be a truly flat sequence for the entire flattened list
	// you can map it at the end. Otherwise, mrenuslno currently links sub-items to their parent's original index.
	// Example for truly flat mrenuslno:
	// return flattenedList.map((entry, idx) => ({ ...entry, mrenuslno: idx }));

	return flattenedList;
}

export function getOrderDetails(mainData, isEdit, table, headers) {
	const userDetails = JSON.parse(localStorage.getItem("user"));

	const config = selectConfigLs;
	const order_details = [];
	mainData?.forEach((item) => {
		const mainIndex = order_details.length;

		order_details.push({
			orderhdrid: isEdit ? headers?.orderhdrid : 0,
			orderdtlid: isEdit ? item?.orderdtlid : 0,
			tableid: table?.tableDetails?.tableid || 0,
			menuid: Number(item?.menuid),
			orderqty: item?.qty.toString(),
			orderrate: Number(item?.salesprice),
			notes: "",
			userid: Number(userDetails?.userid),
			toppingrate: 0.0,
			salesprice: Number(item?.salesprice * item?.qty),
			menudesc: item?.menuname,
			// orderdtlreferno: null,
			// menupackagedtlid: null,
			toppings: item?.topping?.map((i) => i?.topping_id).toString() || "",
		});

		item?.packages?.forEach((pkg) => {
			pkg?.packages?.forEach((submenu) => {
				const basePrice = submenu?.submenuprice * submenu?.submenuqty;

				const basePriceWithoutQty = submenu?.submenuprice;

				const customeTotalWithoutQty = submenu?.custom
					? submenu.custom.reduce((sum, customItem) => {
							const itemPrice = parseFloat(customItem.customizemenuprice);
							return sum + itemPrice;
					  }, 0)
					: 0;

				// Calculate total from custom items
				const customTotal = submenu?.custom
					? submenu.custom.reduce((sum, customItem) => {
							const itemPrice =
								customItem.qty * parseFloat(customItem.customizemenuprice);
							return sum + itemPrice;
					  }, 0)
					: 0;

				// Calculate final total sales price
				const totalUnitSalePrice =
					parseFloat(basePriceWithoutQty) + customeTotalWithoutQty;
				const totalSalesPrice = basePrice + customTotal;

				order_details.push({
					tableid: table?.tableDetails?.tableid,
					menuid: submenu?.submenuid,
					orderqty: submenu?.submenuqty,
					orderrate: parseFloat(
						totalUnitSalePrice.toFixed(config?.amount || 2)
					),
					notes: "",
					userid: Number(userDetails?.userid),
					toppingrate: 0.0,
					salesprice: parseFloat(totalSalesPrice.toFixed(config?.amount || 2)),
					menudesc: submenu?.submenudesc,
					orderdtlreferno: `${mainIndex}`, // reference to main item
					menupackagedtlid: submenu?.packagedtlid,
					toppings: submenu?.custom
						?.map((i) => i?.customizemenuid + "-" + i?.qty)
						.toString(),
				});
			});
		});
	});

	return order_details;
}
