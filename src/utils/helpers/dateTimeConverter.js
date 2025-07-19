import moment from "moment";
import "moment-timezone";

/**
 * Separates a datetime string into date and time objects using Moment.js
 * @param {string} dateTimeString - The datetime string to separate (e.g. "24-Apr-2025 12:02:06")
 * @returns {Object} An object containing the separated date and time as moment objects
 */
export const dateTimeSeperator = (dateTimeString) => {
	// Parse the input string using moment
	const momentDateTime = moment(
		new Date(dateTimeString),
		"DD-MMM-YYYY HH:mm:ss"
	);

	//console.log({ momentDateTime });

	// Extract date component (resets time to 00:00:00)
	const dateObj = moment(momentDateTime).startOf("day");
	//console.log({ dateObj });

	// Extract time component (sets date to today but preserves time)
	const timeObj = moment(momentDateTime).set({
		year: moment().year(),
		month: moment().month(),
		date: moment().date(),
	});

	//console.log({ timeObj });

	return {
		dateObj,
		timeObj,
		// Also return formatted strings for convenience
		formattedDate: dateObj.format("DD-MMM-YYYY"),
		formattedTime: timeObj.format("HH:mm:ss"),
	};
};

export function parseDateTime(input) {
	//console.log({ input });
	const [datePart, timePart] = input.split(" ");

	const date = moment(datePart, "DD-MMM-YYYY"); // e.g., "17-May-2025"
	const time = moment(timePart, "HH:mm:ss"); // e.g., "12:17:20"

	const formateDate = new Date(date);
	const formateTime = new Date(time);

	//console.log({ formateDate, formateTime });

	return { formateDate, formateTime };
}

// export const getValidMoment = (input) => {
// 	if (!input) return null;
// 	//console.log({ input });
// 	const m = moment(input);
// 	return m.isValid() ? m : null;
// };

export const getValidMoment = (timeValue, format = "h:mm a") => {
	if (!timeValue) {
		return null; // Handle null, undefined, or empty string
	}
	//console.log("time value", timeValue);
	// //console.log("getValidMoment called with:", timeValue);
	if (moment.isMoment(timeValue)) {
		//console.log("Input is already a moment object");
		return timeValue.isValid() ? timeValue : null;
	}
	// Try to parse if it's a string
	if (typeof timeValue === "string") {
		//console.log("stirng time value", timeValue);
		const m = moment(timeValue, format, true); // true for strict parsing
		//console.log("stirct parseing", m, m.isValid());
		return m.isValid() ? m : null;
	}
	// Could also handle Date objects if necessary
	// if (timeValue instanceof Date) {
	//   const m = moment(timeValue);
	//   return m.isValid() ? m : null;
	// }
	return null; // Fallback for other invalid types
};

export function stringToISOString(inputString, inputFormat) {
	// Basic validation for inputString
	if (typeof inputString !== "string" || inputString.trim() === "") {
		// console.warn("Input string must be a non-empty string.");
		return null;
	}

	let m;

	if (inputFormat && typeof inputFormat === "string") {
		// Use strict parsing if a format string is provided
		// The 'true' as the third argument enables strict parsing.
		m = moment(inputString, inputFormat, true);
	} else {
		// Let Moment.js attempt to parse using its built-in heuristics
		// This includes ISO 8601 formats and other common date/time representations.
		m = moment(inputString);
	}

	if (m.isValid()) {
		// .toISOString() converts the moment object to UTC and then formats it
		// according to the ISO 8601 standard (e.g., "2023-10-27T10:30:00.000Z").
		return m.toISOString();
	} else {
		// console.warn(`Failed to parse input string: "${inputString}"` +
		//              (inputFormat ? ` with format: "${inputFormat}"` : ``) +
		//              ".");
		return null;
	}
}

/**
 * Converts an ISO 8601 string to formatted UTC and local date & time strings.
 *
 * @param {string} isoString - The ISO 8601 string.
 * @param {object} [options] - Optional formatting options.
 * @param {string} [options.utcTimeFormat="h:mm A [UTC]"] - Moment.js format for UTC time.
 * @param {string} [options.utcDateFormat="YYYY-MM-DD [UTC]"] - Moment.js format for UTC date.
 * @param {string} [options.localTimeFormat] - Moment.js format for local time.
 *                                           Defaults to "h:mm A [DetectedZone/Local]".
 * @param {string} [options.localDateFormat] - Moment.js format for local date.
 *                                           Defaults to "YYYY-MM-DD [DetectedZone/Local]".
 * @returns {{
 *   utcTime: string|null,
 *   utcDate: string|null,
 *   localTime: string|null,
 *   localDate: string|null,
 *   detectedLocalTimezone: string|null
 * }|null}
 *          An object with formatted strings. Returns null if initial ISO parsing fails.
 *          Individual properties can be null if specific conversions fail.
 */
export function isoToFormattedDateAndTimeParts(isoString, options = {}) {
	if (typeof isoString !== "string" || isoString.trim() === "") {
		return null;
	}

	const {
		utcTimeFormat = "h:mm a [UTC]",
		utcDateFormat = "DD-MMM-YYYY [UTC]",
	} = options; // Local formats will be determined later

	const m = moment(isoString);

	if (!m.isValid()) {
		return {
			utcTime: null,
			utcDate: null,
			localTime: null,
			localDate: null,
			detectedLocalTimezone: null,
		};
	}

	// UTC Parts
	const utcMoment = m.clone().utc(); // Work with a UTC-mode moment
	const utcTime = utcMoment.format(utcTimeFormat);
	const utcDate = utcMoment.format(utcDateFormat);

	// Local Parts
	let localTime = null;
	let localDate = null;
	let detectedTimezone = null;
	let localMoment = m.clone(); // Start with a clone of the original moment (which will be in local by default after parsing ISO)

	if (
		typeof moment.tz === "function" &&
		typeof moment.tz.guess === "function"
	) {
		try {
			detectedTimezone = moment.tz.guess(true);
			if (detectedTimezone) {
				localMoment = m.clone().tz(detectedTimezone); // Convert to the specific IANA timezone
			} else {
				detectedTimezone = "SystemLocal_GuessFailed";
				// localMoment remains as m.clone(), which will format to system local
			}
		} catch (e) {
			console.error("Error with moment.tz.guess or .tz():", e);
			detectedTimezone = "SystemLocal_ErrorInTz";
			// localMoment remains as m.clone()
		}
	} else {
		detectedTimezone = "SystemLocal_NoMomentTz";
		// localMoment remains as m.clone()
	}

	// Determine local format strings, incorporating the detected zone if possible
	const zoneLabel =
		detectedTimezone && !detectedTimezone.startsWith("SystemLocal")
			? detectedTimezone
			: "Local";

	const actualLocalTimeFormat =
		options.localTimeFormat || `h:mm a [${zoneLabel}]`;
	const actualLocalDateFormat =
		options.localDateFormat || `DD-MMM-YYYY [${zoneLabel}]`;

	if (localMoment.isValid()) {
		localTime = localMoment.format(actualLocalTimeFormat);
		localDate = localMoment.format(actualLocalDateFormat);
	}

	return {
		utcTime,
		utcDate,
		localTime,
		localDate,
		detectedLocalTimezone: detectedTimezone,
	};
}
