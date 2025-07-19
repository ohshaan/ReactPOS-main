import {
	Button,
	DatePicker,
	Divider,
	Modal,
	Select,
	Space,
	TimePicker,
} from "antd";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from 'react-i18next';
import { ScreenKeyBoard, SlideArrow } from "../../../components";
import { customerModel, userModel } from "../../../plugins/models";
import Swal from "sweetalert2";
import moment from "moment";
import { formatRupees } from "../../../utils/helpers";
import { useSelector } from "react-redux";
import {
	// selectConfig,
	selectConfigLs,
	selectTotal,
} from "../../../redux/selector/orderSlector";
import {
	getValidMoment,
	isoToFormattedDateAndTimeParts,
} from "../../../utils/helpers/dateTimeConverter";
import CurrencyInput from "react-currency-input-field";
import { NumericFormat } from "react-number-format";
import { getCurrentDaateTime } from "../../../utils/helpers/logoutChecker";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

const toDayjsObject = (value) => {
	if (!value) {
		return null; // Return null if input is null, undefined, or empty string
	}
	if (dayjs.isDayjs(value)) {
		return value; // It's already a dayjs object, return it
	}
	if (typeof value === "string") {
		// Attempt to parse the string into a dayjs object.
		const parsed = dayjs(value, "h:mm a"); // Parses formats like "4:30 pm"
		// Return the object if valid, otherwise null
		return parsed.isValid() ? parsed : null;
	}
	// If it's some other unexpected type, return null
	return null;
};

const MAX_VALUE = 99999999.99;

const DEFAULT_DECIMALS = 2; //todo

const showWarning = (title, text = "") => {
	Swal.fire({ icon: "warning", title, text });
};
const showError = (title, text = "") => {
	Swal.fire({ icon: "error", title, text });
};

const validateDateTime = (
	dateString, // e.g., "20-Jun-2025"
	timeString, // e.g., "2:30 pm"
	orderDateTime, // This is expected to be a valid moment object (current server date/time)
	typeLabel,
	isRequired,
	isEditing
) => {
	if (isRequired && (!dateString || !timeString)) {
		showWarning(
			t('VALIDATION.DATE_TIME_MISSING_TITLE'),
			t('VALIDATION.DATE_TIME_MISSING_TEXT', { field: t(`ADVANCE_ORDER.${typeLabel.toUpperCase()}`) })
		);
		return false;
	}

	// Only proceed with further validation if both date and time strings are provided
	// and we are not in edit mode
	if (dateString && timeString && !isEditing) {
		//console.log(`Validating ${typeLabel}:`, {
		// 	dateString,
		// 	timeString,
		// 	orderDateTime: orderDateTime.format(),
		// });

		// 1. Parse the input date string into a moment object.
		const parsedDate = moment(dateString, "DD-MMM-YYYY", true); // true for strict parsing

		// 2. Parse the input time string into a moment object.
		// Handle both 12-hour formats: "h:mm a" and "hh:mm a"
		let parsedTime = moment(timeString, "h:mm a", true);
		if (!parsedTime.isValid()) {
			parsedTime = moment(timeString, "hh:mm a", true);
		}
		if (!parsedTime.isValid()) {
			parsedTime = moment(timeString, "h:mm A", true); // Try with capital AM/PM
		}
		if (!parsedTime.isValid()) {
			parsedTime = moment(timeString, "hh:mm A", true);
		}

		if (!parsedDate.isValid()) {
			console.warn(`Invalid ${typeLabel} date string:`, dateString);
			showWarning(
				t('VALIDATION.INVALID_DATE_FORMAT_TITLE'),
				t('VALIDATION.INVALID_DATE_FORMAT_TEXT', { field: t(`ADVANCE_ORDER.${typeLabel.toUpperCase()}`), format: 'DD-MMM-YYYY' })
			);
			return false;
		}

		if (!parsedTime.isValid()) {
			console.warn(`Invalid ${typeLabel} time string:`, timeString);
			showWarning(
				t('VALIDATION.INVALID_TIME_FORMAT_TITLE'),
				t('VALIDATION.INVALID_TIME_FORMAT_TEXT', { field: t(`ADVANCE_ORDER.${typeLabel.toUpperCase()}`), format: 'h:mm a' })
			);
			return false;
		}

		// 3. Combine the parsed date and time into a single moment object.
		const combinedDateTime = parsedDate.clone().set({
			hour: parsedTime.hour(),
			minute: parsedTime.minute(),
			second: 0,
			millisecond: 0,
		});

		//console.log(`Combined ${typeLabel} DateTime:`, combinedDateTime.format());

		// Ensure the combined object is also valid
		if (!combinedDateTime.isValid()) {
			console.warn(
				`Could not combine ${typeLabel} date and time:`,
				dateString,
				timeString
			);
			showWarning(
				t('VALIDATION.DATETIME_BEFORE_NOW_TITLE'),
				t('VALIDATION.DATETIME_BEFORE_NOW_TEXT', { field: t(`ADVANCE_ORDER.${typeLabel.toUpperCase()}`) })
			);
			return false;
		}

		// Ensure orderDateTime is a valid moment object
		if (
			!orderDateTime ||
			!moment.isMoment(orderDateTime) ||
			!orderDateTime.isValid()
		) {
			console.error(
				orderDateTime
			);
			showError(
				t('VALIDATION.SYSTEM_ERROR_TITLE'),
				t('VALIDATION.ERROR_FETCH_SERVER_TIME')
			);
			return false;
		}

		//console.log("Comparison:", {
		// 	combinedDateTime: combinedDateTime.format("DD-MMM-YYYY HH:mm:ss"),
		// 	orderDateTime: orderDateTime.format("DD-MMM-YYYY HH:mm:ss"),
		// 	isBefore: combinedDateTime.isBefore(orderDateTime),
		// });

		// 4. Compare with orderDateTime
		if (combinedDateTime.isBefore(orderDateTime)) {
			showWarning(
				t('VALIDATION.DATETIME_BEFORE_NOW_TITLE'),
				t('VALIDATION.DATETIME_BEFORE_NOW_TEXT', { field: t(`ADVANCE_ORDER.${typeLabel.toUpperCase()}`) })
			);
			return false;
		}
	}

	return true;
};

const validateDateTimeWithDayjs = (
	dateString,
	timeString,
	orderDateTimeDayjs,
	typeLabel,
	isRequired,
	isEditing
) => {
	// ... (The top part for isRequired remains the same)

	if (dateString && timeString && !isEditing) {
		// 1. Parse date and time with Day.js
		const parsedDate = dayjs(dateString, "DD-MMM-YYYY", true);
		let parsedTime = dayjs(timeString, "h:mm a", true);
		if (!parsedTime.isValid()) parsedTime = dayjs(timeString, "hh:mm a", true);
		if (!parsedTime.isValid()) parsedTime = dayjs(timeString, "h:mm A", true);
		if (!parsedTime.isValid()) parsedTime = dayjs(timeString, "hh:mm A", true);

		// ... (The validation checks for parsedDate and parsedTime remain the same)

		// 3. Combine with Day.js
		const combinedDateTime = parsedDate
			.hour(parsedTime.hour())
			.minute(parsedTime.minute())
			.second(0)
			.millisecond(0);

		// ... (The validity checks for combinedDateTime and orderDateTimeDayjs remain the same)

		// 4. Compare with Day.js
		if (combinedDateTime.isBefore(orderDateTimeDayjs)) {
			showWarning(
				"Invalid Date/Time",
				`${typeLabel} date & time (${combinedDateTime.format(
					"DD-MMM-YYYY h:mm a"
				)}) must be greater than or equal to the current order date & time (${orderDateTimeDayjs.format(
					"DD-MMM-YYYY h:mm a"
				)}).`
			);
			return false;
		}
	}
	return true;
};

function AdvanceOrder({
	onChange,
	advanceOrderData,
	keyRef,
	defaultObj,
	setAdvanceOrder,
	isModalOpen,
	setIsModalOpen,
	isEdit,
	onLoadOk,
	otherPayment: otherPaymentOptions,
}) {
	// const [isModalOpen, setIsModalOpen] = useState(true);
	const [card, setCard] = useState([]);
    const { t } = useTranslation();
	const [currentIndex, setCurrentIndex] = useState(0);
	const totalPages = Math.ceil(card?.length / 3);
	const cardRef = useRef();
	const [name, setName] = useState(null);
	// const [date, setDate] = useState(null);
	const [, isLoading] = useState(false);

	const [kotDate, setKotDate] = useState(null);
	const [kotTime, setKotTime] = useState(null);
	const [deliverDate, setDeliverDate] = useState(null);
	const [deliverTime, setDeliverTime] = useState(null);

	const [, setVirtualKeyboardInput] = useState("");
	const [isValidTime, setIsValidTime] = useState(true);

	// const config1 = useSelector(selectConfig);
	const config = selectConfigLs;
	const total = useSelector(selectTotal);

	useEffect(() => {
		getCardDetails();
	}, []);

	useEffect(() => {
		if (isModalOpen) {
			//console.log("ismodal open ♨️♨️♨️♨️♨️♨️♨️", isModalOpen);
		}
	}, [isModalOpen]);
	const handleCancel = () => {
		Swal.fire({
			title: t('SWAL.CANCEL_CONFIRM_TITLE'),
			text: t('SWAL.CANCEL_CONFIRM_TEXT'),
			icon: "warning",
			showCancelButton: true,
			confirmButtonColor: "#d33",
			cancelButtonColor: "#3085d6",
			confirmButtonText: t('COMMON.OK'),
			cancelButtonText: t('COMMON.CANCEL')

		}).then((result) => {
			if (result.isConfirmed) {
				// Logout logic
				setDeliverTime(null);
				setKotTime(null);
				setDeliverDate(null);
				setKotDate(null);
				setIsModalOpen(false);
				setAdvanceOrder(defaultObj); // typo: make sure it's spelled `navigate`
			}
		});
	};

	const getCardDetails = () => {
		customerModel
			.getCardDetails()
			.then((data) => {
				if (data?.status === "true") {
					setCard(data?.data);
				}
			})
			.catch((error) => {
				//console.log("Error while getting card details", error));
			});
	};

	const onFous = (e) => {
		const { name, value } = e.target;
		keyRef?.current?.setInput(value);
		setName(name);
	};

	const handleKotDateChange = (dateObj, dateString) => {
		setKotDate(dateString);
	};

	const handleTImePicker = (momentObject, timeString) => {
		// setAdvanceOrder((prev) => ({ ...prev, kotTime: timeData }));
		// //console.log("KOT timeData", momentObject);
		// //console.log("KOT timestring", timeString);
		setKotTime(momentObject);

		// setVirtualKeyboardInput(momentObject || "");
		// if (keyRef.current) {
		// 	keyRef.current.setInput(momentObject || "");
		// }
	};

	const handleDelDateChange = (dateObj, dateString) => {
		setDeliverDate(dateString);
	};

	const handleDelTimePicker = (momentObject, timeString) => {
		//console.log("DEL timeData", momentObject);
		// //console.log("DEL timestring", timeString);
		setDeliverTime(momentObject);

		setVirtualKeyboardInput(momentObject || "");
		if (keyRef.current) {
			keyRef.current.setInput(momentObject || "");
		}
	};

	const handleKeyboardInput = (inputValue) => {
		setVirtualKeyboardInput(inputValue);
		const trimmedInput = inputValue.trim();

		//console.log("Processing virtual keyboard input:", trimmedInput);

		// Real-time validation feedback
		if (!trimmedInput) {
			setIsValidTime(true); // Empty is valid
			return true;
		}

		// Check if input matches expected pattern
		// const isValidFormat = /^\d{1,2}:\d{2}\s?(am|pm)$/i.test(trimmedInput);

		// if (isValidFormat) {
		// 	// Try to parse with moment
		// 	const parsed = moment(trimmedInput, "h:mm a", true);
		// 	if (parsed.isValid()) {
		// 		//console.log("Valid time entered:", parsed);
		// 		//console.log("	setDeliverTime(trimmedInput);", trimmedInput);
		// 		setDeliverTime(trimmedInput);
		// 		setDeliverTime(parsed);
		// 		setIsValidTime(true);
		// 		return true;
		// 	}
		// }

		// Partial input validation (for real-time feedback)
		// const partialPatterns = [
		// 	/^\d{1,2}$/, // Just hours
		// 	/^\d{1,2}:$/, // Hours with colon
		// 	/^\d{1,2}:\d{1,2}$/, // Hours and minutes
		// 	/^\d{1,2}:\d{2}\s?$/, // Complete time without am/pm
		// 	/^\d{1,2}:\d{2}\s?(a|p|am|pm?)$/i, // Partial am/pm
		// ];

		// const isPartiallyValid = partialPatterns.some((pattern) =>
		// 	pattern.test(trimmedInput)
		// );
		// setIsValidTime(isPartiallyValid || isValidFormat);

		// return isValidFormat;
	};
	const validateCard = () => {
		const { card, cardType, otherpayment, otherAmount, ref } = advanceOrderData;

		// Case 1: Card is entered but card type is missing
		if (
			card &&
			(cardType === "" || cardType === null || cardType === undefined)
		) {
			return {
				isValid: false,
				message: t('VALIDATION.SELECT_CARD_TYPE'),
			};
		}

		// Case 2: Card type is entered (string or object) but card number is missing
		if (
			(cardType && typeof cardType === "object" && cardType.cardid !== "") ||
			(typeof cardType === "string" && cardType !== "")
		) {
			if (!card || card === "") {
				return {
					isValid: false,
					message: t('VALIDATION.PROVIDE_CARD_AMOUNT'),
				};
			}
		}

		const errors = [];

		const isAnyFieldFilled = otherpayment || otherAmount || ref;

		if (isAnyFieldFilled) {
			if (!otherpayment) {
				errors.push(t('VALIDATION.SELECT_OTHER_PAYMENT_TYPE'));
			}
			if (!otherAmount) {
				errors.push(t('VALIDATION.PROVIDE_OTHER_PAYMENT_AMOUNT'));
			}
			if (!ref) {
				errors.push(t('VALIDATION.PROVIDE_REFERENCE_NUMBER'));
			}
		}

		if (errors.length > 0) {
			return {
				isValid: false,
				message: errors.join(", "),
			};
		}

		// Valid
		return {
			isValid: true,
			message: "",
		};
	};

	// const onOk = async () => {
	// 	// //console.log({ advanceOrderData });
	// 	if (!advanceOrderData?.bookOrderNo) {
	// 		showWarning("Input Missing", "Provide Book Order No.");
	// 		return;
	// 	}

	// 	if (
	// 		!advanceOrderData?.deliveryReq ||
	// 		deliverDate === "" ||
	// 		deliverTime === ""
	// 	) {
	// 		showWarning("Delivery Date and Time is required");
	// 		return;
	// 	}

	// 	const { isValid, message } = validateCard();

	// 	if (!isValid) {
	// 		Swal.fire({
	// 			icon: "warning",
	// 			title: message,
	// 		});
	// 		return;
	// 	}

	// 	const totalAmount = parseFloat(total);
	// 	const advanceTotal = parseFloat(advanceOrderData?.total);
	// 	const isTotalValid = !isNaN(totalAmount);
	// 	const isAdvanceValid = !isNaN(advanceTotal);
	// 	// //console.log({ totalAmount, advanceTotal });
	// 	// //console.log({ isTotalValid, isAdvanceValid });

	// 	if (isTotalValid && isAdvanceValid && advanceTotal > totalAmount) {
	// 		Swal.fire({
	// 			icon: "error",
	// 			title: "Amount exceeds",
	// 			text: `Advance total amount cannot exceed total amount - ${formatRupees(
	// 				totalAmount,
	// 				config?.amount,
	// 				false
	// 			)}`,
	// 		});
	// 		return;
	// 	}

	// 	const currentDateStr = await getCurrentDaateTime();

	// 	if (!currentDateStr) {
	// 		Swal.fire({
	// 			icon: "error",
	// 			title: "Failed to fetch current date.",
	// 		});
	// 		return;
	// 	}

	// 	const orderDate = moment(currentDateStr, "DD-MMM-YYYY HH:mm:ss");

	// 	if (advanceOrderData?.deliveryReq) {
	// 		if (
	// 			!validateDateTime(
	// 				deliverDate,
	// 				deliverTime,
	// 				orderDate,
	// 				"Delivery",
	// 				true,
	// 				isEdit
	// 			)
	// 		) {
	// 			return;
	// 		}
	// 	}

	// 	// Validate KOT Fire Date and Time

	// 	if (advanceOrderData?.kotReq) {
	// 		if (
	// 			!validateDateTime(kotDate, kotTime, orderDate, "KOT Fire", true, isEdit)
	// 		) {
	// 			return;
	// 		}
	// 	}

	// 	// If all validations pass:
	// 	// const finalDeliverDateStr =
	// 	// 	advanceOrderData?.deliveryReq && deliverDate
	// 	// 		? deliverDate.format("DD-MMM-YYYY")
	// 	// 		: null;
	// 	// const finalDeliverTimeStr =
	// 	// 	advanceOrderData?.deliveryReq && deliverTime
	// 	// 		? deliverTime.format("h:mm a")
	// 	// 		: null;
	// 	// const finalKotDateStr =
	// 	// 	advanceOrderData?.kotReq && kotDate
	// 	// 		? kotDate.format("DD-MMM-YYYY")
	// 	// 		: null;
	// 	// const finalKotTimeStr =
	// 	// 	advanceOrderData?.kotReq && kotTime ? kotTime.format("h:mm a") : null;

	// 	// //console.log({ deliverDate, deliverTime, kotDate, kotTime });
	// 	onLoadOk(true, deliverDate, deliverTime, kotDate, kotTime);
	// 	setDeliverDate(null);
	// 	setDeliverTime(null);
	// 	setKotDate(null);
	// 	setKotTime(null);
	// 	setIsModalOpen(false);
	// };

	const onOk = async () => {
		// --- 1. Initial Guard Clauses for Basic Inputs ---
		if (!advanceOrderData?.bookOrderNo) {
			showWarning(
				t('VALIDATION.INPUT_MISSING_TITLE'),
				t('ADVANCE_ORDER.ERROR_PROVIDE_BOOK_ORDER_NO')
			);
			return;
		}

		// Logic correction: Check for missing date/time ONLY IF delivery is required.
		// Also check for falsy values (null) instead of just empty strings.
		if (!advanceOrderData.deliveryReq && (!deliverDate || !deliverTime)) {
			showWarning(
				t('VALIDATION.INPUT_MISSING_TITLE'),
				t('ADVANCE_ORDER.ERROR_DELIVERY_DATE_TIME_REQUIRED')
			);
			return;
		}

		const { isValid, message } = validateCard();
		if (!isValid) {
			Swal.fire({ icon: "warning", title: message });
			return;
		}

		const totalAmount = parseFloat(total);
		const advanceTotal = parseFloat(advanceOrderData?.total);
		if (
			!isNaN(totalAmount) &&
			!isNaN(advanceTotal) &&
			advanceTotal > totalAmount
		) {
			Swal.fire({
				icon: "error",
				title: t('VALIDATION.ERROR_AMOUNT_EXCEEDS_TITLE'),
				text: t('VALIDATION.ERROR_AMOUNT_EXCEEDS_TEXT', {
					total: formatRupees(totalAmount, config?.amount, false)
				}),
			});
			return;
		}

		// --- 2. Fetch Server Time for Comparison ---
		const currentDateStr = await getCurrentDaateTime(); // Using your function name
		if (!currentDateStr) {
			showError(
				t('VALIDATION.SYSTEM_ERROR_TITLE'),
				t('VALIDATION.ERROR_FETCH_SERVER_TIME')
			);
			return;
		}
		const orderDate = moment(currentDateStr, "DD-MMM-YYYY HH:mm:ss");

		// --- 3. Centralized Formatting (The Core Fix) ---
		// Convert the dayjs objects from state back into the string format
		// that your validateDateTime function expects.
		const finalDeliverTimeStr = deliverTime
			? dayjs(deliverTime).format("h:mm a")
			: null;
		const finalKotTimeStr = kotTime ? dayjs(kotTime).format("h:mm a") : null;

		// --- 4. Call Validation with Correctly Formatted Data ---
		if (advanceOrderData.deliveryReq) {
			if (
				!validateDateTime(
					deliverDate, // This is already a string
					finalDeliverTimeStr, // Pass the formatted string here
					orderDate,
					"Delivery",
					true,
					isEdit
				)
			) {
				return; // Stop if validation fails
			}
		}

		if (advanceOrderData.kotReq) {
			if (
				!validateDateTime(
					kotDate, // This is already a string
					finalKotTimeStr, // Pass the formatted string here
					orderDate,
					"KOT Fire",
					true,
					isEdit
				)
			) {
				return; // Stop if validation fails
			}
		}

		// --- 5. Final Callback and Cleanup ---
		// If all validations pass, call the parent callback with the consistent string data.
		onLoadOk(true, deliverDate, finalDeliverTimeStr, kotDate, finalKotTimeStr);

		// Reset state and close the modal
		setDeliverDate(null);
		setDeliverTime(null);
		setKotDate(null);
		setKotTime(null);
		setIsModalOpen(false);
	};

	useEffect(() => {
		if (deliverTime && keyRef.current) {
			keyRef.current.setInput(deliverTime);
			setVirtualKeyboardInput(deliverTime);
		}
	}, [deliverTime]);

	useEffect(() => {
		if (!advanceOrderData?.deliveryReq) {
			//console.log("this chagnesd");
			onChange({
				target: { name: "deliverDate", value: "" },
			});
			onChange({
				target: { name: "deliverTime", value: "" },
			});
		}
		if (!advanceOrderData?.kotReq) {
			//console.log("this is also changed");
			onChange({ target: { name: "kotDate", value: "" } });
			onChange({ target: { name: "kotTime", value: "" } });
		}
	}, [advanceOrderData?.deliveryReq, advanceOrderData?.kotReq]);

	// useEffect(() => {
	// 	// Only attempt to populate if the modal is open and we have advanceOrderData
	// 	if (isModalOpen && advanceOrderData) {
	// 		// //console.log(
	// 		// 	"Populating dates/times from advanceOrderData:",
	// 		// 	advanceOrderData
	// 		// );
	// 		// --- Delivery Date/Time ---
	// 		if (advanceOrderData.deliverDate) {
	// 			// //console.log("data parts", advanceOrderData.deliverDate);
	// 			const parts = isoToFormattedDateAndTimeParts(
	// 				advanceOrderData.deliverDate,
	// 				{
	// 					localDateFormat: "DD-MMM-YYYY", // Get a clean date string parsable by default moment
	// 				}
	// 			);
	// 			if (parts && parts.localDate) {
	// 				// To match DatePicker's DD-MMM-YYYY, reformat it if necessary or ensure getValidMoment handles YYYY-MM-DD
	// 				// setDeliverDate(parts.localDate);
	// 				// //console.log("parts.localDate LOC!@@", parts.localDate);
	// 				setDeliverDate(parts.localDate);
	// 			} else {
	// 				setDeliverDate(null);
	// 			}
	// 		} else {
	// 			setDeliverDate(null); // Clear if not present in advanceOrderData
	// 		}
	// 		if (advanceOrderData.deliverTime) {
	// 			const parts = isoToFormattedDateAndTimeParts(
	// 				advanceOrderData.deliverTime,
	// 				{
	// 					localTimeFormat: "h:mm a",
	// 				}
	// 			);
	// 			if (parts && parts.localTime) {
	// 				setDeliverTime(parts.localTime);
	// 			} else {
	// 				setDeliverTime(null);
	// 			}
	// 		} else {
	// 			setDeliverTime(null);
	// 		}
	// 		// --- KOT Date/Time (Corrected) ---
	// 		if (advanceOrderData.kotDate) {
	// 			const parts = isoToFormattedDateAndTimeParts(advanceOrderData.kotDate, {
	// 				localDateFormat: "DD-MMM-YYYY",
	// 			});
	// 			if (parts && parts.localDate) {
	// 				//console.log("parts.localDate LOC", parts.localDate);
	// 				setKotDate(parts.localDate); // CORRECTED
	// 			} else {
	// 				setKotDate(null);
	// 			}
	// 		} else {
	// 			setKotDate(null);
	// 		}
	// 		if (advanceOrderData.kotTime) {
	// 			const parts = isoToFormattedDateAndTimeParts(advanceOrderData.kotTime, {
	// 				localTimeFormat: "h:mm a",
	// 			});
	// 			if (parts && parts.localTime) {
	// 				setKotTime(parts.localTime); // CORRECTED
	// 			} else {
	// 				setKotTime(null);
	// 			}
	// 		} else {
	// 			setKotTime(null);
	// 		}
	// 	}
	// 	// eslint-disable-next-line react-hooks/exhaustive-deps
	// }, [isModalOpen, advanceOrderData, isEdit]);

	// useEffect(() => {
	// 	const handler = setTimeout(() => {
	// 		const cardRaw = advanceOrderData?.card;
	// 		const cashRaw = advanceOrderData?.advanceCash;

	// 		//console.log({ cardRaw, cashRaw });
	// 		const card = parseFloat(cardRaw);
	// 		const cash = parseFloat(cashRaw);

	// 		//console.log({ card, cash });

	// 		const isCardValid = card !== 0 && !isNaN(card);
	// 		const isCashValid = cash !== 0 && !isNaN(cash);

	// 		let total = 0;

	// 		if (isCardValid && isCashValid) {
	// 			total = card + cash;
	// 		} else if (isCardValid) {
	// 			total = card;
	// 		} else if (isCashValid) {
	// 			total = cash;
	// 		}

	// 		//console.log({ total });

	// 		onChange({
	// 			target: {
	// 				name: "total",
	// 				value: total !== null && !isNaN(total) ? total : "",
	// 			},
	// 		});
	// 	}, 300); // Adjust debounce delay (ms) as needed

	// 	return () => clearTimeout(handler);
	// }, [advanceOrderData?.card, advanceOrderData?.advanceCash]);

	// useEffect(() => {
	// 	const valueDate = moment(new Date(advanceOrderData?.deliverDate)).format(
	// 		"DD-MMM-YYYY"
	// 	);
	// 	const valueTime = moment(new Date(advanceOrderData?.deliverTime)).format(
	// 		"hh:mm:ss A"
	// 	);

	// 	// //console.log({ valueDate, valueTime });
	// 	// //console.log("advanceOrderData?.deliverDate", advanceOrderData?.deliverDate);
	// 	// //console.log("advanceOrderData?.deliverTime", advanceOrderData?.deliverTime);
	// }, [advanceOrderData]);

	// Effect for Delivery Date and Time
	// useEffect(() => {
	// 	if (isModalOpen && advanceOrderData) {
	// 		if (advanceOrderData.deliveryReq) {
	// 			if (advanceOrderData.deliverDate) {
	// 				const parts = isoToFormattedDateAndTimeParts(
	// 					advanceOrderData.deliverDate,
	// 					{ localDateFormat: "DD-MMM-YYYY" }
	// 				);
	// 				// Only update if the incoming value is different from the current state
	// 				// This prevents re-setting if parts.localDate is the same as deliverDate
	// 				if (parts && parts.localDate && parts.localDate !== deliverDate) {
	// 					setDeliverDate(parts.localDate);
	// 				} else if (parts && !parts.localDate && deliverDate !== null) {
	// 					// ISO was valid but resulted in no localDate
	// 					setDeliverDate(null);
	// 				}
	// 			} else if (deliverDate !== null) {
	// 				// deliverDate in advanceOrderData is falsy, clear local state
	// 				setDeliverDate(null);
	// 			}

	// 			if (advanceOrderData.deliverTime) {
	// 				const parts = isoToFormattedDateAndTimeParts(
	// 					advanceOrderData.deliverTime,
	// 					{ localTimeFormat: "h:mm a" }
	// 				);
	// 				if (parts && parts.localTime && parts.localTime !== deliverTime) {
	// 					//console.log(
	// 					// 	"setDeliverTime(parts.localTime); ==>",
	// 					// 	parts.localTime
	// 					// );
	// 					setDeliverTime(parts.localTime);
	// 				} else if (parts && !parts.localTime && deliverTime !== null) {
	// 					setDeliverTime(null);
	// 				}
	// 			} else if (deliverTime !== null) {
	// 				setDeliverTime(null);
	// 			}
	// 		}
	// 		// If advanceOrderData.deliveryReq is false, this effect does nothing,
	// 		// allowing the other useEffect (that calls props.onChange) to handle clearing.
	// 	}
	// 	// eslint-disable-next-line react-hooks/exhaustive-deps
	// }, [
	// 	isModalOpen,
	// 	isEdit, // To re-evaluate when modal opens in edit mode
	// 	advanceOrderData?.deliveryReq,
	// 	advanceOrderData?.deliverDate, // Source ISO string for deliver date
	// 	advanceOrderData?.deliverTime, // Source ISO string for deliver time
	// 	// Removed direct state dependencies like 'deliverDate' from here
	// 	// to avoid loop if not careful with condition `parts.localDate !== deliverDate`
	// ]);

	useEffect(() => {
		// Only run logic if the modal is open and we have data to sync from.
		if (isModalOpen && advanceOrderData) {
			// --- Case 1: Delivery is NOT required ---
			// If the checkbox is unchecked, ensure the state is cleared.
			if (!advanceOrderData.deliveryReq) {
				// Add checks to prevent redundant state updates.
				if (deliverDate !== null) setDeliverDate(null);
				if (deliverTime !== null) setDeliverTime(null);
				return; // Exit early
			}

			// --- Case 2: Delivery IS required ---
			// Sync the date string (your date logic was mostly fine, just simplified here).
			const dateParts = isoToFormattedDateAndTimeParts(
				advanceOrderData.deliverDate,
				{ localDateFormat: "DD-MMM-YYYY" }
			);
			const incomingDateString = dateParts?.localDate || null;
			if (incomingDateString !== deliverDate) {
				setDeliverDate(incomingDateString);
			}

			// Sync the time (THE CORE FIX IS HERE)
			const timeParts = isoToFormattedDateAndTimeParts(
				advanceOrderData.deliverTime,
				{ localTimeFormat: "h:mm a" }
			);
			const incomingTimeString = timeParts?.localTime || null;

			// To prevent infinite loops, we compare the incoming string with the
			// formatted version of our current state (which is a dayjs object).
			const currentFormattedTime = deliverTime
				? dayjs(deliverTime).format("h:mm a")
				: null;

			if (incomingTimeString !== currentFormattedTime) {
				// If they are different, we set the state by converting the
				// INCOMING STRING into a proper dayjs object.
				setDeliverTime(toDayjsObject(incomingTimeString));
			}
		}
		// The dependency array is correct as is.
	}, [
		isModalOpen,
		isEdit,
		advanceOrderData?.deliveryReq,
		advanceOrderData?.deliverDate,
		advanceOrderData?.deliverTime,
	]);

	useEffect(() => {
		//console.log(advanceOrderData);
	}, []);

	// Effect for KOT Date and Time
	// useEffect(() => {
	// 	if (isModalOpen && advanceOrderData) {
	// 		//console.log("advance Data ✅✅", advanceOrderData);
	// 		if (advanceOrderData.kotReq) {
	// 			if (advanceOrderData.kotDate) {
	// 				const parts = isoToFormattedDateAndTimeParts(
	// 					advanceOrderData.kotDate,
	// 					{ localDateFormat: "DD-MMM-YYYY" }
	// 				);
	// 				if (parts && parts.localDate && parts.localDate !== kotDate) {
	// 					setKotDate(parts.localDate);
	// 				} else if (parts && !parts.localDate && kotDate !== null) {
	// 					setKotDate(null);
	// 				}
	// 			} else if (kotDate !== null) {
	// 				setKotDate(null);
	// 			}

	// 			if (advanceOrderData.kotTime) {
	// 				//console.log("kot time", advanceOrderData.kotTime);
	// 				const parts = isoToFormattedDateAndTimeParts(
	// 					advanceOrderData.kotTime,
	// 					{ localTimeFormat: "h:mm a" }
	// 				);
	// 				if (parts && parts.localTime && parts.localTime !== kotTime) {
	// 					//console.log("KOT setKotTime(parts.localTime);", parts.localTime);
	// 					setKotTime(parts.localTime);
	// 				} else if (parts && !parts.localTime && kotTime !== null) {
	// 					setKotTime(null);
	// 				}
	// 			} else if (kotTime !== null) {
	// 				setKotTime(null);
	// 			}
	// 		}
	// 		// If advanceOrderData.kotReq is false, this effect does nothing.
	// 	}
	// 	// eslint-disable-next-line react-hooks/exhaustive-deps
	// }, [
	// 	isModalOpen,
	// 	isEdit, // To re-evaluate when modal opens in edit mode
	// 	advanceOrderData?.kotReq,
	// 	advanceOrderData?.kotDate, // Source ISO string for KOT date
	// 	advanceOrderData?.kotTime, // Source ISO string for KOT time
	// ]);

	useEffect(() => {
		// Only run logic if the modal is open and we have data to sync from.
		if (isModalOpen && advanceOrderData) {
			// --- Case 1: KOT Fire is NOT required ---
			// If the checkbox is unchecked, ensure the KOT state is cleared.
			if (!advanceOrderData.kotReq) {
				// Add checks to prevent redundant state updates.
				if (kotDate !== null) setKotDate(null);
				if (kotTime !== null) setKotTime(null);
				return; // Exit early
			}

			// --- Case 2: KOT Fire IS required ---
			// Sync the date string.
			const dateParts = isoToFormattedDateAndTimeParts(
				advanceOrderData.kotDate,
				{ localDateFormat: "DD-MMM-YYYY" }
			);
			const incomingDateString = dateParts?.localDate || null;
			if (incomingDateString !== kotDate) {
				setKotDate(incomingDateString);
			}

			// Sync the time (THE CORE FIX IS HERE)
			const timeParts = isoToFormattedDateAndTimeParts(
				advanceOrderData.kotTime,
				{ localTimeFormat: "h:mm a" }
			);
			const incomingTimeString = timeParts?.localTime || null;

			// To prevent infinite loops, we compare the incoming string with the
			// formatted version of our current state (which is a dayjs object).
			const currentFormattedTime = kotTime
				? dayjs(kotTime).format("h:mm a")
				: null;

			if (incomingTimeString !== currentFormattedTime) {
				// If they are different, we set the state by converting the
				// INCOMING STRING into a proper dayjs object.
				setKotTime(toDayjsObject(incomingTimeString));
			}
		}
		// The dependency array is correct as is.
	}, [
		isModalOpen,
		isEdit,
		advanceOrderData?.kotReq,
		advanceOrderData?.kotDate,
		advanceOrderData?.kotTime,
	]);

	const handleNowClick = async (type) => {
		const timeRes = await getCurrentDaateTime(); //"04-Jul-2025 14:16:37"
		if (timeRes) {
			const serverTimeObject = dayjs(timeRes, "DD-MMM-YYYY HH:mm:ss");

			const today = dayjs();

			const normalizedTimeObject = today
				.hour(serverTimeObject.hour())
				.minute(serverTimeObject.minute())
				.second(serverTimeObject.second());

			if (type === "del") {
				setDeliverTime(normalizedTimeObject);
			} else if (type === "kot") {
				setKotTime(normalizedTimeObject);
			}
		} else {
			console.warn("Failed to get current date time.");
		}
	};

	// const momentKotTime = getValidMoment(kotTime, "h:mm a");
	// //console.log({ momentKotTime, kotTime });
	// //console.log({ momentKotTime });
	const momentKotDate = getValidMoment(kotDate, "DD-MMM-YYYY");

	// const momentDeliverTime = getValidMoment(deliverTime, "h:mm a");
	const momentDeliverDate = getValidMoment(deliverDate, "DD-MMM-YYYY");

	return (
		<div className="">
			<Modal
				title={<h1 className="text-xl">{t('ADVANCE_ORDER.TITLE')}</h1>}
				open={isModalOpen}
				className=""
				width={{
					xs: "90%",
					sm: "90%",
					md: "90%",
					lg: "90%",
					xl: "50%",
					xxl: "40%",
				}}
				footer={false}
				style={{ top: 1, height: "80" }}
				// onOk={handleOk}
				onCancel={handleCancel}>
				<div className="flex flex-col lg:grid  lg:grid-cols-2 gap-1">
					<div className="flex items-center ">
						<label htmlFor="orderNo" className="w-[40%]">
							{t('ADVANCE_ORDER.BOOK_ORDER_NO')} :

						</label>
						<input
							id="orderNo"
							type="text"
							name="bookOrderNo"
							maxLength={9}
							value={advanceOrderData?.bookOrderNo}
							className="p-1 border border-gray-300 rounded-lg w-[60%]"
							onChange={onChange}
							onFocus={(e) => onFous(e)}
						/>
					</div>

					<div className="flex items-center ">
						<label htmlFor="advanceCash" className="w-[40%]">
							{t('ADVANCE_ORDER.ADVANCE_CASH')} :
						</label>

						<NumericFormat
							className="p-1 border border-gray-300 rounded-lg w-[60%] text-right"
							id="advanceCash"
							name="advanceCash"
							decimalScale={config?.amount || DEFAULT_DECIMALS}
							thousandSeparator=","
							fixedDecimalScale
							maxLength={14}
							value={advanceOrderData?.advanceCash}
							onFocus={(e) => {
								e.target.select();
								onFous?.(e);
							}}
							onValueChange={(values, event) => {
								if (!event?.event) return; // ✅ Guard clause to prevent undefined access

								const target = event.event.target;
								const { name } = target;
								const { value } = values;

								// if (value.length > 7) return;
								onChange({ target: { name, value } });
								// onChange(, name);
							}}
						/>
					</div>
					<div className="flex items-center col-span-2 gap-1 ">
						<label htmlFor="orderNo" className="w-[20%]">
							{t('ADVANCE_ORDER.CARD_TYPE')} :
						</label>
						<div className="flex flex-grow gap-1 items-center h-fit">
							<SlideArrow
								direction="left"
								height="100%"
								width="50px"
								refVariable={cardRef}
								totalPages={totalPages}
								currentIndex={currentIndex}
								setCurrentIndex={setCurrentIndex}
							/>
							<div
								className="flex overflow-auto w-full scrollbar-hidden"
								ref={cardRef}>
								{" "}
								{Array.from({ length: totalPages }, (_, pageIndex) => (
									<div
										className="grid grid-cols-3 items-center gap-1 w-full shrink-0 "
										key={pageIndex}>
										{card
											?.slice(pageIndex * 3, (pageIndex + 1) * 3)
											?.map((item) => {
												return (
													<button
														className={`p-1 rounded-lg ${
															item?.cardid ===
															advanceOrderData?.cardType?.cardid
																? "bg-success"
																: "bg-secondary"
														} text-white`}
														onClick={() =>
															onChange({
																target: { name: "cardType", value: item },
															})
														}>
														{item?.carddesc}
													</button>
												);
											})}
									</div>
								))}
							</div>
							<SlideArrow
								direction="right"
								height="100%"
								width="50px"
								refVariable={cardRef}
								totalPages={totalPages}
								currentIndex={currentIndex}
								setCurrentIndex={setCurrentIndex}
							/>
						</div>
					</div>
					<div className="flex items-center ">
						<label htmlFor="card" className="w-[40%]">
							{t('ADVANCE_ORDER.CARD')} :

						</label>

						<NumericFormat
							className="p-1 border border-gray-300 rounded-lg w-[60%] text-right"
							id="card"
							name="card"
							decimalScale={config?.amount || DEFAULT_DECIMALS}
							thousandSeparator=","
							fixedDecimalScale
							maxLength={14}
							value={advanceOrderData?.card}
							onFocus={(e) => {
								e.target.select();
								onFous?.(e);
							}}
							onValueChange={(values, event) => {
								if (!event?.event) return; // ✅ Guard clause to prevent undefined access

								const target = event.event.target;
								const { name } = target;
								const { value } = values;

								// if (value.length > 7) return;
								onChange({ target: { name, value } });
								// onChange(, name);
							}}
						/>
					</div>

					{/* <div className="flex items-center col-span-3 gap-1 "> */}
					<div className="flex items-center w-[100%]">
						<label htmlFor="card" className="w-[40%]">
							{t('ADVANCE_ORDER.OTHER_PAYMENT')} :

						</label>

						<Select
							id="reotherpaymentf"
							value={advanceOrderData?.otherpayment || undefined}
							onChange={(value) =>
								onChange({ target: { name: "otherpayment", value } })
							}
							onFocus={onFous}
							className="w-[60%] "
							options={otherPaymentOptions}
							placeholder={t('COMMON.SELECT_PLACEHOLDER')}

						/>
					</div>
					<div className="flex items-center col-span-2 w-[100%] gap-1">
						<div className="flex items-center w-[50%]">
							<label htmlFor="card" className="w-[40%]">
								{t('ADVANCE_ORDER.REF_NO')} :

							</label>

							<input
								id="ref"
								type="text"
								name="ref"
								maxLength={9}
								value={advanceOrderData?.ref}
								className="p-1 border border-gray-300 rounded-lg w-[60%]"
								onChange={onChange}
								onFocus={(e) => onFous(e)}
							/>
						</div>
						<div className="flex items-center w-[50%]">
							<label htmlFor="card" className="w-[40%]">
								{t('ADVANCE_ORDER.OTHER_AMOUNT')} :

							</label>

							<NumericFormat
								className="p-1 border border-gray-300 rounded-lg w-[60%] text-right"
								id="otherAmount"
								name="otherAmount"
								decimalScale={config?.amount || DEFAULT_DECIMALS}
								thousandSeparator=","
								fixedDecimalScale
								maxLength={14}
								value={advanceOrderData?.otherAmount}
								onFocus={(e) => {
									e.target.select();
									onFous?.(e);
								}}
								onValueChange={(values, event) => {
									if (!event?.event) return; // ✅ Guard clause to prevent undefined access

									const target = event.event.target;
									const { name } = target;
									const { value } = values;

									// if (value.length > 7) return;
									onChange({ target: { name, value } });
									// onChange(, name);
								}}
							/>
						</div>
					</div>
					<div className="flex items-center ">
						<label htmlFor="total" className="w-[40%]">
							{t('ADVANCE_ORDER.TOTAL')} :

						</label>
						<input
							id="total"
							type="text"
							className="p-1 border border-gray-300 rounded-lg w-[60%] text-right"
							inputMode="decimal"
							pattern="^\d*\.?\d{0,2}$"
							readOnly={true}
							name="total"
							value={formatRupees(
								Number(advanceOrderData?.total),
								config?.amount,
								false
							)}
							onFocus={(e) => onFous(e)}
						/>
					</div>
					{/* </div> */}
					{/* <div className="flex items-center col-span-2 ">
						<label htmlFor="notes" className="w-[20%]">
							Notes :
						</label>
						<textarea
							id="notes"
							type="text"
							className="p-1 border border-gray-300 rounded-lg w-[80%] max-h-15 resize-none"
							maxLength={250}
							name="notes"
							value={advanceOrderData?.notes}
							onChange={onChange}
							onFocus={(e) => onFous(e)}
						/>
					</div> */}
					<div className="flex items-center gap-2 col-span-2 ">
						{" "}
						<p className="flex items-center gap-1 ">
							{" "}
							<input
								type="checkbox"
								checked={advanceOrderData?.kotReq}
								name="kotReq"
								onChange={(e) =>
									onChange({
										target: { name: "kotReq", value: e?.target?.checked },
									})
								}
							/>{" "}
							{t('ADVANCE_ORDER.KOT_FIRE_ORDER')} {` ${advanceOrderData?.kotReq ? ": " : ""}`}
						</p>
						{/* {` ${advanceOrderData?.kotReq && ": "}`} */}
						{advanceOrderData?.kotReq && (
							<div className=" flex items-center">
								{
									<div className="flex gap-1">
										{" "}
										<DatePicker
											format="DD-MMM-YYYY"
											name="kotDate"
											value={momentKotDate}
											onChange={handleKotDateChange}
										/>
										<TimePicker
											use12Hours
											format="h:mm a"
											name="kotTime"
											allowClear
											onFocus={(e) => {
												e.target.select();
												onFous?.(e);
											}}
											value={toDayjsObject(kotTime)} //todo has time string - 4:11 am
											onChange={handleTImePicker}
											showNow={false}
											renderExtraFooter={() => (
												<Button
													type="link"
													size="small"
													onClick={() => handleNowClick("kot")}>
													{t('COMMON.NOW')}
												</Button>
											)}
											popupClassName="
											[&_.ant-picker-footer]:flex 
											[&_.ant-picker-footer]:justify-between 
											[&_.ant-picker-footer]:items-center
										  "
										/>{" "}
									</div>
								}
							</div>
						)}
					</div>
					<div className="flex items-center gap-2 col-span-2">
						{" "}
						<p className="flex items-center gap-1">
							{" "}
							<input
								type="checkbox"
								checked={advanceOrderData?.deliveryReq}
								name="deliveryReq"
								onChange={(e) =>
									onChange({
										target: { name: "deliveryReq", value: e?.target?.checked },
									})
								}
							/>{" "}
							{t('ADVANCE_ORDER.DELIVERY_REQUIRED')}{" "}
							{` ${advanceOrderData?.deliveryReq ? ": " : ""}`}
						</p>
						{advanceOrderData?.deliveryReq && (
							<div className=" flex items-center">
								<label htmlFor="orderNo" className="">
									{t('ADVANCE_ORDER.DELIVERY_DATE')} :{" "}
								</label>
								{
									<div className="flex gap-1 w-[60%] lg:w-[70%]">
										{" "}
										<DatePicker
											format="DD-MMM-YYYY"
											name="deliverDate"
											value={momentDeliverDate}
											onChange={handleDelDateChange}
										/>
										<TimePicker
											use12Hours
											format="h:mm a"
											name="deliverTime"
											allowClear
											onFocus={(e) => {
												e.target.select();
												onFous?.(e);
											}}
											value={toDayjsObject(deliverTime)}
											onChange={handleDelTimePicker}
											showNow={false}
											renderExtraFooter={() => (
												<Button
													type="link"
													size="small"
													onClick={() => handleNowClick("del")}>
													{t('COMMON.NOW')}

												</Button>
											)}
											popupClassName="
											[&_.ant-picker-footer]:flex 
											[&_.ant-picker-footer]:justify-between 
											[&_.ant-picker-footer]:items-center
										  "
										/>{" "}
									</div>
								}
							</div>
						)}
						<button
							className="rounded-lg p-2 bg-secondary w-20 text-white"
							onClick={onOk}>
							{t('COMMON.OK')}
						</button>
						<button
							className="rounded-lg p-2 bg-secondary w-20 text-white"
							onClick={handleCancel}>
							{t('COMMON.CANCEL')}
						</button>
					</div>
				</div>
				<div className="hidden lg:block">
					<ScreenKeyBoard
						keyboard={keyRef}
						position={"relative"}
						width="100%"
						disabled={true}
						className="mt-2"
						name={name}
						onChange={(e) => {
							if (name === "deliverTime") {
								handleKeyboardInput(e.target.value);
							}
							onChange(e);
						}}
						// type={name === "card" || name === "advanceCash"}
						hideAble={false}
					/>
				</div>
			</Modal>
		</div>
	);
}

export default AdvanceOrder;
