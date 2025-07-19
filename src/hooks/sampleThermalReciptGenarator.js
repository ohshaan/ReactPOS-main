// src/hooks/useThermalReceiptPrinter.js
import { useState, useCallback } from "react";

const PRINT_API_URL = "http://localhost:3030/api/print";

/**
 * @typedef {object} ReceiptTemplateData // Matches the structure your GO_CRISPY_THERMAL template expects
 * @property {string} [logoPath] // This will be overridden by the bridge if using a fixed logo there
 * @property {string} storeName
 * // ... Add ALL other properties your 'generateGoCrispyThermalReceipt' data param expects
 * @property {Array<object>} items
 */

/**
 * @typedef {object} UseThermalReceiptPrinterProps
 * @property {string} printerName - The OS name of the target thermal printer.
 * @property {string} templateType - E.g., "GO_CRISPY_THERMAL".
 * @property {() => void} [onPrintInitiated]
 * @property {(message: string) => void} [onPrintSuccess]
 * @property {(error: string) => void} [onPrintError]
 */

/**
 * @typedef {object} PrintStatus
 * @property {boolean} isLoading
 * @property {string|null} error
 * @property {string|null} successMessage
 */

/**
 * Custom hook to send data for thermal receipt printing.
 * @param {UseThermalReceiptPrinterProps} props
 * @returns {[ (dataToPrint: ReceiptTemplateData, options?: object) => Promise<void>, PrintStatus ]}
 */
export const useSampleThermalReceiptPrinter = ({
	printerName,
	templateType,
	onPrintInitiated,
	onPrintSuccess,
	onPrintError,
}) => {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);
	const [successMessage, setSuccessMessage] = useState(null);

	/**
	 * Triggers the print process for the given receipt data.
	 * @param {ReceiptTemplateData} receiptData - The actual data object for the receipt.
	 * @param {object} [printApiOptions={}] - Optional printerOptions for the API call.
	 */
	const triggerSamplePrint = useCallback(
		async (receiptData, printApiOptions = {}) => {
			if (!receiptData) {
				const errMsg = "No receipt data provided to print.";
				console.warn("useThermalReceiptPrinter:", errMsg);
				setError(errMsg);
				onPrintError?.(errMsg);
				return;
			}
			if (!printerName) {
				const errMsg = "No target printer name specified for the hook.";
				console.warn("useThermalReceiptPrinter:", errMsg);
				setError(errMsg);
				onPrintError?.(errMsg);
				return;
			}
			if (!templateType) {
				const errMsg = "No template type specified for the hook.";
				console.warn("useThermalReceiptPrinter:", errMsg);
				setError(errMsg);
				onPrintError?.(errMsg);
				return;
			}

			setIsLoading(true);
			setError(null);
			setSuccessMessage(null);
			onPrintInitiated?.();

			const defaultPrinterOptions = {
				characterSet: "UTF_8", // Good default for Arabic/mixed content
				...printApiOptions, // Allow overriding via passed options
			};

			const payload = {
				printerName: printerName,
				templateType: templateType,
				templateData: receiptData, // The actual data for the template
				printerOptions: defaultPrinterOptions,
			};

			try {
				//console.log(
				// 	`useThermalReceiptPrinter: Sending print job to ${printerName} (Template: ${templateType})`
				// );
				// //console.log("Payload:", JSON.stringify(payload, null, 2)); // For debugging

				const response = await fetch(PRINT_API_URL, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(payload),
				});

				const result = await response.json();

				if (!response.ok) {
					const errMsg =
						result.error || `Print API Error: ${response.statusText}`;
					throw new Error(errMsg);
				}

				const successMsg = `Receipt sent successfully to ${printerName}: ${result.message}`;
				//console.log("useThermalReceiptPrinter: Print API success:", result);
				setSuccessMessage(successMsg);
				onPrintSuccess?.(successMsg);
			} catch (err) {
				const errorMsg =
					err.message || "An unknown error occurred during printing.";
				console.error(
					"useThermalReceiptPrinter: Error during print process:",
					err
				);
				setError(errorMsg);
				onPrintError?.(errorMsg);
			} finally {
				setIsLoading(false);
			}
		},
		[printerName, templateType, onPrintInitiated, onPrintSuccess, onPrintError]
	); // Hook dependencies

	return [triggerSamplePrint, { isLoading, error, successMessage }];
};
