import React from "react";
import { useTranslation } from "react-i18next";

/**
 * Number rows for the numeric keypad section.
 * @type {string[][]}
 */
const numberRows = [
	["1", "2", "3", "4", "5", "6"],
	["7", "8", "9", "0", "00"],
];

/**
 * QWERTY-style keys for the main keyboard section.
 * @type {string[][]}
 */
const qwertyRows = [
	["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
	["A", "S", "D", "F", "G", "H", "J", "K", "L", "."],
	["Z", "X", "C", "V", "B", "N", "M", "/", "Clear"],
	["Space"],
];

/**
 * Renders the numeric keypad section with a side Clear button.
 *
 * @component
 * @param {Object} props - Component props.
 * @param {function(string): void} props.onKeyPress - Callback when a key is pressed.
 * @returns {JSX.Element} Number section UI.
 */
function NumberSection({ onKeyPress }) {
	const { t } = useTranslation();  
	return (
		<div className="flex w-full gap-2 items-stretch">
			<div className="grid grid-cols-6 gap-2 flex-1">
				{numberRows.flat().map((key) => (
					<button
						key={key}
						onClick={() => onKeyPress(key)}
						className={`bg-slate-700 hover:bg-slate-600 text-white text-lg font-medium rounded h-12 ${
							key === "00" ? "col-span-2" : ""
						}`}>
						{key}
					</button>
				))}
			</div>
			<button
				onClick={() => onKeyPress("Clear")}
				className="bg-red-500 hover:bg-red-600 text-white text-lg font-medium rounded w-30">
				{t("COMMON.CLEAR")}
			</button>
		</div>
	);
}

/**
 * Renders rows of alphabet and symbols for the main keyboard section.
 *
 * @component
 * @param {Object} props - Component props.
 * @param {function(string): void} props.onKeyPress - Callback when a key is pressed.
 * @returns {JSX.Element[]} Rendered key rows.
 */
function QwertySection({ onKeyPress }) {
	const { t } = useTranslation();          // ① grab the translator
	return qwertyRows.map((row, rowIndex) => (
		<div key={rowIndex} className="flex justify-center gap-2">
			{row.map((key) => (
				<button
					key={key + rowIndex}
					onClick={() => onKeyPress(key)}
					className={`flex-1 px-4 py-1 text-lg font-medium rounded ${
						key === "Clear"
							? "bg-red-500 hover:bg-red-600"
							: key === "Space"
							? "bg-slate-600 hover:bg-slate-700 w-full"
							: "bg-slate-700 hover:bg-slate-600"
					}`}>
					{key === "Clear" ? t("COMMON.CLEAR") : key}
				</button>
			))}
		</div>
	));
}

/**
 * Virtual keyboard component combining number and QWERTY sections.
 *
 * @component
 * @param {Object} props - Component props.
 * @param {{ current: { getInput: () => string, setInput: (val: string) => void } }} props.keyboardRef - Ref to manage input value.
 * @param {function(string, string, Event): void} props.onChange - Callback to propagate updated input value.
 * @param {string} props.inputName - Name of the input field (used to identify in callback).
 * @returns {JSX.Element} Virtual keyboard component.
 */

const numericFields = new Set([
	"deliveryCharge",
	"discountAmt",
	"discountPercent",
	"totalAmt",
	"change",
	"tips",
	"paidAmt",
	"cardAmt",
	"tipsCard",
	"staffAmt",
	"staffAmtWastage",
	"opAmount",
	"osAmount",
]);
function VirtualKeyboard({ keyboardRef, onChange }) {
	const decimalScale = 2; // Assuming fixed decimal scale of 2 for numeric fields
	const handleKeyPress = (key) => {
		const inputElement = keyboardRef.current;
		if (!inputElement) return;

		//console.log({ key });

		const name = inputElement.name;
		const isNumericField = numericFields.has(name);

		// Get the current actual UNFORMATTED value from the NumericFormat component.
		// This requires the parent to pass the unformatted value.
		// For now, we'll continue to infer and construct.
		// Let's assume `onChange` in the parent sets the *unformatted* value back to NumericFormat
		// So, inputElement.value is the *formatted* value.
		const currentFormattedValue = inputElement.value || "";
		let nextUnformattedValue = "";

		//console.log("VKEY currentFormattedValue", currentFormattedValue);

		if (isNumericField) {
			// Try to derive the current unformatted parts (integer, decimal)
			// This is tricky from formatted string but we can try:
			let [currentFormattedIntPart] = currentFormattedValue.split(".");
			let unformattedInt = (currentFormattedIntPart || "0").replace(/,/g, "");
			// The decimal part from a formatted "0.00" would be "00".
			// We need to track if user is actively typing decimal part.
			// This state is usually managed INTERNALLY by NumericFormat or in parent component's state.

			// For virtual keyboard, it's easier if we maintain our own sense of current input intent
			// based on key presses for decimal.

			// A flag to indicate if we are currently typing the decimal part
			// This is a simplified local state. A more robust way is for parent to control this
			// or pass more detailed unformatted parts.
			let isTypingDecimal = keyboardRef.current._isTypingDecimal || false;
			let unformattedDecimal = keyboardRef.current._unformattedDecimal || "";

			if (key === "Clear") {
				// Backspace logic
				if (isTypingDecimal && unformattedDecimal.length > 0) {
					unformattedDecimal = unformattedDecimal.slice(0, -1);
					if (unformattedDecimal.length === 0) {
						// If all decimals cleared, user is no longer "typing decimal" unless they press '.' again
						isTypingDecimal = false; // Or based on '.' existing.
					}
				} else {
					// Clearing integer part
					unformattedInt = unformattedInt.slice(0, -1);
					isTypingDecimal = false; // No longer typing decimal if int part is changed
					unformattedDecimal = ""; // Reset decimal part when clearing int part
				}
				if (unformattedInt === "" && unformattedDecimal === "") {
					nextUnformattedValue = ""; // Becomes 0.00 via NumericFormat
				} else {
					nextUnformattedValue =
						unformattedInt +
						(unformattedDecimal ? "." + unformattedDecimal : "");
				}
			} else if (key === ".") {
				// If already typing decimal (e.g. "12." then "." is pressed), or decimal already full, ignore
				if (
					isTypingDecimal ||
					(unformattedDecimal && unformattedDecimal.length >= decimalScale)
				) {
					// Construct based on what we have, no new dot
					nextUnformattedValue =
						unformattedInt +
						(unformattedDecimal ? "." + unformattedDecimal : ".");
				} else {
					isTypingDecimal = true; // Now explicitly typing decimal part
					unformattedDecimal = ""; // Reset decimal part ready for new digits
					nextUnformattedValue = (unformattedInt || "0") + "."; // e.g. "123."
				}
			} else if (/^[0-9]$/.test(key) || key === "00") {
				// Digits '0'-'9' or "00"
				let digitsToAppend = key;

				if (isTypingDecimal) {
					if ((unformattedDecimal + digitsToAppend).length <= decimalScale) {
						unformattedDecimal += digitsToAppend;
					}
					// else: decimal scale limit reached for append, ignore extra digits for decimal
					nextUnformattedValue = unformattedInt + "." + unformattedDecimal;
				} else {
					// Appending to integer part
					if (
						unformattedInt === "0" &&
						digitsToAppend !== "0" &&
						digitsToAppend !== "00"
					) {
						unformattedInt = digitsToAppend; // Replace "0" with new non-zero digit(s)
					} else if (
						unformattedInt === "0" &&
						(digitsToAppend === "0" || digitsToAppend === "00")
					) {
						// If "0" and press "0" or "00", stays "0"
						unformattedInt = "0";
					} else if (unformattedInt.length + digitsToAppend.length <= 9) {
						// Max 9 integer digits
						unformattedInt += digitsToAppend;
					}
					// If already "0" and "0" or "00" is pressed, unformattedInt remains "0".

					// Construct value; decimal part is not being typed yet.
					// NumericFormat will add ".00" based on its fixedDecimalScale if decimal part is absent
					nextUnformattedValue = unformattedInt;
					// No, this is wrong. If user just types "123", nextUnformattedValue should be "123", not "123.00"
					// If isTypingDecimal became true earlier from pressing ".", then this won't be hit.
				}
			} else if (key === "Space") {
				return; // Ignore space for numeric fields
			} else {
				return; // Any other non-numeric/non-command key from QWERTY
			}

			// Update internal tracking for next key press
			keyboardRef.current._isTypingDecimal = isTypingDecimal;
			keyboardRef.current._unformattedDecimal = unformattedDecimal;

			// Ensure constructed value makes sense. If int part is empty after manipulations, treat as "0" if decimals exist.
			let [finalInt, finalDec] = nextUnformattedValue.split(".");
			if (finalInt === "" && finalDec !== undefined) {
				// e.g. ".50" came from clearing int "1.50" to ".50"
				nextUnformattedValue = "0." + finalDec;
			} else if (finalInt === "" && finalDec === undefined) {
				// " " cleared to nothing
				nextUnformattedValue = ""; // This usually means 0 to NumericFormat
			}

			onChange(nextUnformattedValue, name, inputElement);
		} else {
			// Non-numeric fields (logic remains the same)
			let currentTextValue = currentFormattedValue;
			if (key === "Clear") {
				nextUnformattedValue = currentTextValue.slice(0, -1);
			} else if (key === "Space") {
				nextUnformattedValue = currentTextValue + " ";
			} else {
				nextUnformattedValue = currentTextValue + key;
			}
			onChange(nextUnformattedValue, name, inputElement);
		}
	};

	return (
		<div className="bg-slate-900 text-white rounded-lg space-y-2 p-2 w-full mx-auto">
			<NumberSection onKeyPress={handleKeyPress} />
			<QwertySection onKeyPress={handleKeyPress} />
		</div>
	);
}

export default VirtualKeyboard;
