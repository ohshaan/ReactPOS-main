import { selectConfigLs } from "../../redux/selector/orderSlector";

export function formatRoundedNumber(num) {
	const decimals = selectConfigLs?.amount || 2;
	return Math.round(num).toFixed(decimals);
}

export function formatRoundedRupees(num, showPrefix = true) {
	const decimals = selectConfigLs?.amount || 2;
	const rounded = Math.round(num).toFixed(decimals);

	return new Intl.NumberFormat("en-IN", {
		style: showPrefix ? "currency" : "decimal",
		currency: "INR",
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals,
	}).format(Number(rounded));
}
