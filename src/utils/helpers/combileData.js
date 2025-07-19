import moment from "moment";

/**
 * Combines a date and time from two Date objects into an ISO-like string (YYYY-MM-DDTHH:mm:ss).
 *
 * @param {Date | string | number | null} dateObj - A value representing the date.
 * @param {Date | string | number | null} timeObj - A value representing the time.
 * @returns {string|null} A formatted datetime string or null if inputs are invalid.
 */
export function combineDateTime(dateObj, timeObj) {
	// ✅ BEST PRACTICE: Add initial guards for falsy inputs.
	// This immediately handles null, undefined, "", etc.
	if (!dateObj || !timeObj) {
		console.error("Invalid input: date or time object is null or undefined.");
		return null;
	}

	const date = new Date(dateObj);
	const time = new Date(timeObj);

	// This check is still good for catching things like `new Date("not a real date")`
	if (isNaN(date.getTime())) {
		console.error("Invalid date object provided:", dateObj);
		return null;
	}

	if (isNaN(time.getTime())) {
		console.error("Invalid time object provided:", timeObj);
		return null;
	}

	// Since moment can also check validity, we can rely on it for a final check.
	const momentDate = moment(date);
	const momentTime = moment(time);

	if (!momentDate.isValid() || !momentTime.isValid()) {
		console.error("Moment failed to parse date or time");
		return null;
	}

	return momentDate
		.set({
			hour: momentTime.hour(),
			minute: momentTime.minute(),
			second: momentTime.second(),
		})
		.format("YYYY-MM-DDTHH:mm:ss");
}
