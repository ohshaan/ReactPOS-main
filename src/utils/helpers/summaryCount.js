// src/utils/helpers/summaryCount.js
import { useMemo } from "react";

export const useCustomItemCounter = ({ data, selectedPackageDtlId }) => {
	//console.log("Calculated menu data", data);
	const result = useMemo(() => {
		let accumulatedSelectionsPrice = 0;
		let grandTotalFreeSubItemsQty = 0;
		let grandTotalPaidSubItemsQty = 0;

		let currentCategoryTotalPrice = 0;
		let currentCategoryFreeSubItemsQty = 0;
		let currentCategoryPaidSubItemsQty = 0;

		let derivedMainPackageBasePrice = 0;
		if (Array.isArray(data) && data.length > 0 && data[0]) {
			derivedMainPackageBasePrice =
				parseFloat(data[0].packageprice_base || data[0].packageprice) || 0;
		}

		if (!Array.isArray(data) || data.length === 0) {
			// Return default state
			return {
				grandOverallTotalPrice:
					derivedMainPackageBasePrice /* ...other zeroed values */,
			};
		}

		data.forEach((packageCategory) => {
			let priceForThisCategory = 0;
			let freeQtyForThisCategory = 0;
			let paidQtyForThisCategory = 0;

			if (Array.isArray(packageCategory.packages)) {
				packageCategory.packages.forEach((selectedSubItem) => {
					// Calculate price for the sub-item itself
					const subItemUnitPrice =
						parseFloat(
							selectedSubItem.submenuprice_base || selectedSubItem.submenuprice
						) || 0;
					const subItemQty = parseInt(selectedSubItem.submenuqty || 1, 10);

					if (subItemQty > 0) {
						priceForThisCategory += subItemUnitPrice * subItemQty;

						// Tally quantities based on the sub-item's base price
						if (subItemUnitPrice === 0) {
							freeQtyForThisCategory += subItemQty;
						} else {
							paidQtyForThisCategory += subItemQty;
						}

						// Add the cost of its attached custom items
						if (Array.isArray(selectedSubItem.custom)) {
							selectedSubItem.custom.forEach((customItem) => {
								const customItemUnitPrice =
									parseFloat(customItem.customizemenuprice) || 0;
								const customItemQty = parseInt(customItem.qty || 1, 10);
								if (customItemQty > 0) {
									priceForThisCategory += customItemUnitPrice * customItemQty;
								}
							});
						}
					}
				});
			}

			accumulatedSelectionsPrice += priceForThisCategory;
			grandTotalFreeSubItemsQty += freeQtyForThisCategory;
			grandTotalPaidSubItemsQty += paidQtyForThisCategory;

			if (packageCategory.packagedtlid === selectedPackageDtlId) {
				currentCategoryTotalPrice = priceForThisCategory;
				currentCategoryFreeSubItemsQty = freeQtyForThisCategory;
				currentCategoryPaidSubItemsQty = paidQtyForThisCategory;
			}
		});

		const finalGrandOverallTotalPrice =
			derivedMainPackageBasePrice + accumulatedSelectionsPrice;

		return {
			grandOverallTotalPrice: finalGrandOverallTotalPrice,
			grandTotalFreeSubItemsQty,
			grandTotalPaidSubItemsQty,
			currentCategoryTotalPrice,
			currentCategoryFreeSubItemsQty,
			currentCategoryPaidSubItemsQty,
		};
	}, [data, selectedPackageDtlId]);

	return result;
};
