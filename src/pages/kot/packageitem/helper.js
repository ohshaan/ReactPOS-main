import { toast } from "react-toastify";

// --- PRICE CALCULATION HELPER ---
export function calculateSubItemTotalAdditionalCost(subItem) {
	if (!subItem) return 0;

	const subItemUnitCost =
		parseFloat(subItem.submenuprice_base || subItem.submenuprice) || 0;
	const subItemQty = parseInt(subItem.submenuqty || 1, 10);
	const subItemItselfCost = subItemUnitCost * subItemQty;

	const customsCost = (subItem.custom || []).reduce((total, customItem) => {
		const customItemUnitCost = parseFloat(customItem.customizemenuprice) || 0;
		const customItemQty = parseInt(customItem.qty || 1, 10);
		return total + customItemUnitCost * customItemQty;
	}, 0);

	return subItemItselfCost + customsCost;
}

// --- QUANTITY LOGIC HELPERS ---
function isNumericKey(key) {
	return /^\d$/.test(key);
}

function handleBackspace(currentQty, defaultQty, isFree) {
	const qtyStr = currentQty.toString();
	if (qtyStr.length === 0) return currentQty;
	let newQty = Number(qtyStr.slice(0, -1)) || 0;
	if (isFree) return Math.max(1, Math.min(newQty, defaultQty));
	if (newQty === 0 && defaultQty > 0) return defaultQty;
	return Math.max(0, newQty);
}

function handleIncrement(
	currentQty,
	defaultQty,
	isFree,
	totalQtyAcrossInstances = 0
) {
	if (isFree) {
		const newTotalQty = totalQtyAcrossInstances - currentQty + (currentQty + 1);
		if (newTotalQty > defaultQty && defaultQty > 0) {
			const remaining = defaultQty - (totalQtyAcrossInstances - currentQty);
			if (remaining <= 0) {
				toast.info(
					`Max quantity (${defaultQty}) for this free item already selected.`
				);
			} else {
				toast.info(
					`You can only add ${remaining} more of this free item. Total limit: ${defaultQty}`
				);
			}
			return currentQty;
		}
		return Math.min(currentQty + 1, defaultQty);
	}
	return Math.min(currentQty + 1, 999);
}

function handleDecrement(currentQty, defaultQty, isFree) {
	if (isFree) return Math.max(1, currentQty - 1);
	const newQty = Math.max(0, currentQty - 1);
	if (newQty === 0 && defaultQty > 0) return defaultQty;
	return newQty;
}

function handleNumericInput(
	key,
	currentQty,
	defaultQty,
	isFree,
	totalQtyAcrossInstances = 0
) {
	const typedNum = Number(key);
	if (isNaN(typedNum)) return currentQty;

	if (isFree) {
		const newTotalQty = totalQtyAcrossInstances - currentQty + typedNum;
		if (newTotalQty > defaultQty && defaultQty > 0) {
			const remaining = defaultQty - (totalQtyAcrossInstances - currentQty);
			if (remaining <= 0) {
				toast.info(
					`Max quantity (${defaultQty}) for this free item already selected.`
				);
				return currentQty;
			}
			toast.info(
				`Max quantity is ${defaultQty}. You can only set ${remaining} more.`
			);
			return Math.min(typedNum, remaining);
		}
		if (typedNum < 1 && defaultQty > 0) return 1;
		if (defaultQty === 0 && typedNum < 0) return 0;
		return typedNum;
	}

	const qtyStr = currentQty.toString();
	let potentialNewQtyStr = currentQty === 0 && key !== "0" ? key : qtyStr + key;
	if (potentialNewQtyStr.startsWith("0") && potentialNewQtyStr.length > 1) {
		potentialNewQtyStr = potentialNewQtyStr.substring(1);
	}
	if (potentialNewQtyStr.length > 3 || Number(potentialNewQtyStr) > 999) {
		return currentQty;
	}
	let newQty = Number(potentialNewQtyStr);
	if (newQty === 0 && defaultQty > 0) return defaultQty;
	return Math.max(0, newQty);
}

export function handleQuantityChange(
	key,
	currentQty,
	defaultQty,
	isFree,
	totalQtyAcrossInstances = 0
) {
	switch (key) {
		case "C":
			return defaultQty;
		case "<":
			return handleBackspace(currentQty, defaultQty, isFree);
		case "+":
			return handleIncrement(
				currentQty,
				defaultQty,
				isFree,
				totalQtyAcrossInstances
			);
		case "-":
			return handleDecrement(currentQty, defaultQty, isFree);
		default:
			if (isNumericKey(key)) {
				return handleNumericInput(
					key,
					currentQty,
					defaultQty,
					isFree,
					totalQtyAcrossInstances
				);
			}
			return currentQty;
	}
}

export function calculateTotalFreeItemQuantity(
	packages,
	currentPkg,
	targetSubmenuid
) {
	if (!packages) return 0;
	return packages.reduce((total, pkg) => {
		const isSameItem =
			pkg.submenuid === targetSubmenuid ||
			pkg.submenuid === currentPkg.submenuid ||
			(pkg.submenuname === currentPkg.submenuname &&
				pkg.submenuprice_base === currentPkg.submenuprice_base);
		if (isSameItem) return total + (Number(pkg.submenuqty) || 0);
		return total;
	}, 0);
}
