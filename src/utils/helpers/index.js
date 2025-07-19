import moment from "moment";

/**
 * Converts a date string into "D-MMM-YYYY h:mm:ss A" format.
 * @param inputDateString - The raw date string
 * @returns Formatted date string or "Invalid Date" if parsing fails
 */
export function convertToFormattedDate(inputDateString) {
	const outputFormat = "D-MMM-YYYY h:mm A";
	const momentDate = moment(new Date(inputDateString)); // Handles most formats robustly
	return momentDate.isValid()
		? momentDate.format(outputFormat)
		: "Invalid Date";
}

export const formatRupees = (amount, fractionDigits = 2, showPrefix = true) => {
	return new Intl.NumberFormat("en-IN", {
		style: showPrefix ? "currency" : "decimal",
		currency: "INR",
		minimumFractionDigits: fractionDigits,
		maximumFractionDigits: fractionDigits,
	}).format(amount);
};

// export const unformatRupees = (formattedValue) => {
// 	if (!formattedValue) return 0;

// 	//console.log({ formattedValue });

// 	// Remove everything except digits and decimal point
// 	const cleaned = formattedValue.replace(/[^0-9.]/g, "");

// 	// Parse it into a float
// 	const parsed = parseFloat(cleaned);

// 	return isNaN(parsed) ? 0 : parsed;
// };

export const unformatRupees = (str) => {
	if (str === null || str === undefined) return 0;

	const numeric = parseFloat(String(str).replace(/,/g, "").trim());

	return isNaN(numeric) ? 0 : numeric;
};

// export const formatRupees = (amount, fractionDigits = 2, showPrefix = true) => {
// 	const factor = Math.pow(10, fractionDigits);
// 	const truncated = Math.trunc(amount * factor) / factor;

// 	return new Intl.NumberFormat("en-IN", {
// 		style: showPrefix ? "currency" : "decimal",
// 		currency: "INR",
// 		minimumFractionDigits: fractionDigits,
// 		maximumFractionDigits: fractionDigits,
// 	}).format(truncated);
// };

export function filterByMultipleProperties(
	arr,
	conditions = {},
	strictExclude = false
) {
	if (!Array.isArray(arr) || !arr.length) return [];
	if (
		typeof conditions !== "object" ||
		conditions === null ||
		Array.isArray(conditions)
	)
		return [];

	const keys = Object.keys(conditions);
	if (keys.length === 0) return [];

	return arr.filter((item) => {
		if (typeof item !== "object" || item === null) return false;

		const matchFound = keys.some((key) => item?.[key] === conditions[key]);

		return strictExclude ? !matchFound : matchFound;
	});
}

/**
 * Parses a datetime string and returns separate formatted date and time strings.
 * Input format is assumed to be "DD-MMM-YYYY HH:mm:ss".
 *
 * @param {string} dateTimeString - The input datetime string (e.g., "13-Jun-2025 11:47:39").
 * @param {string} [outputDateFormat="YYYY-MM-DD"] - Optional. The desired format for the date part.
 * @param {string} [outputTimeFormat="HH:mm:ss"] - Optional. The desired format for the time part (24-hour).
 *                                                   Use "h:mm:ss a" for 12-hour with AM/PM.
 * @returns {{formateDate: string|null, formateTime: string|null}}
 *          An object containing formatted date and time, or null for parts if input is invalid.
 */
export const parseDateTime = (
	dateTimeString,
	outputDateFormat = "YYYY-MM-DD",
	outputTimeFormat = "HH:mm:ss"
) => {
	if (!dateTimeString || typeof dateTimeString !== "string") {
		return { formateDate: null, formateTime: null };
	}

	// Define the input format for Moment.js
	const inputFormat = "DD-MMM-YYYY HH:mm:ss";
	const m = moment(dateTimeString, inputFormat, true); // true for strict parsing

	if (m.isValid()) {
		return {
			formateDate: m.format(outputDateFormat),
			formateTime: m.format(outputTimeFormat),
		};
	} else {
		console.warn(
			`Failed to parse datetime string: "${dateTimeString}" with format "${inputFormat}"`
		);
		return { formateDate: null, formateTime: null };
	}
};
