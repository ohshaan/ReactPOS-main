// src/hooks/useInvoiceDetailPrinter.js
import { useState, useCallback } from "react";
// Assuming processRawInvoiceData is correctly typed and exported
import { processRawInvoiceData } from "../../../utils/printerHelper/convertInvoicePirnt.js";
import payModel from "../../../plugins/models/payModel.js";

const PRINT_API_URL = "http://localhost:3030/api/print";

/**
 * @typedef {object} RawInvoiceItemFromAPI // Define this based on your API response for invoice details
 * @property {string} menudesc
 * // ... other properties similar to the sample you provided
 */

/**
 * @typedef {object} DetailedInvoiceTemplateData // Define this based on what your invoice template expects
 * @property {string} storeName
 * @property {Array<object>} items // Flat items, as invoice template usually handles structure
 * // ... other properties
 */

/**
 * @typedef {object} UseInvoicePrinterProps
 * @property {string|null|undefined} invoiceIdToPrint // ID to fetch invoice data
 * @property {string} printerName                   // The specific printer to send this invoice to
 * @property {string} templateType                  // The specific template type to use (e.g., "GO_CRISPY_INVOICE")
 * @property {() => void} [onPrintInitiated]
 * @property {(message: string) => void} [onPrintSuccess]
 * @property {(error: string) => void} [onPrintError]
 */

/**
 * @typedef {object} InvoicePrintStatus
 * @property {boolean} isLoading
 * @property {string|null} error
 * @property {string|null} successMessage
 */

/**
 * Custom hook to fetch invoice data and send a single print job.
 * @param {UseInvoicePrinterProps} props
 * @returns {[() => Promise<void>, InvoicePrintStatus]}
 */
export const useInvoiceDetailPrinter = ({
	invoiceIdToPrint,
	printerName,
	templateType,
	onPrintInitiated,
	onPrintSuccess,
	onPrintError,
}) => {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);
	const [successMessage, setSuccessMessage] = useState(null);

	const triggerInvoicePrint = useCallback(async () => {
		if (!invoiceIdToPrint) {
			//console.log("useInvoiceDetailPrinter: No invoiceIdToPrint provided.");
			return;
		}
		if (!printerName) {
			console.warn("useInvoiceDetailPrinter: No printerName provided.");
			onPrintError?.("Configuration: printerName missing.");
			return;
		}
		if (!templateType) {
			console.warn("useInvoiceDetailPrinter: No templateType provided.");
			onPrintError?.("Configuration: templateType missing.");
			return;
		}

		setIsLoading(true);
		setError(null);
		setSuccessMessage(null);
		onPrintInitiated?.();

		let rawInvoiceItems = [];
		try {
			//console.log(
			// 	`useInvoiceDetailPrinter: Fetching invoice details for ID: ${invoiceIdToPrint}`
			// );
			// Replace 'getInvoicePrintDetails' with your actual method in orderModel
			// Pass the correct parameter name your backend expects, e.g., { invoiceReferId: invoiceIdToPrint }
			const responseData = await payModel.getinvoiceprint({
				// invoicereferid: invoiceIdToPrint,
				invoicereferno: invoiceIdToPrint,
			});

			// //console.log("Invoice API res", responseData); // For debugging

			if (responseData?.status === "true" && responseData.data) {
				rawInvoiceItems = responseData.data;
				if (
					!rawInvoiceItems ||
					!Array.isArray(rawInvoiceItems) ||
					rawInvoiceItems.length === 0
				) {
					throw new Error(
						`No items found or invalid format in invoice response for ID: ${invoiceIdToPrint}`
					);
				}
				//console.log(
				// 	`useInvoiceDetailPrinter: Fetched ${rawInvoiceItems.length} raw items for invoice.`
				// );
			} else {
				const errorMessage =
					responseData?.message ||
					`Failed to fetch invoice details for ID: ${invoiceIdToPrint}. Status: ${responseData?.status}`;
				throw new Error(errorMessage);
			}
		} catch (fetchError) {
			console.error(
				"useInvoiceDetailPrinter: Error fetching invoice details:",
				fetchError
			);
			setError(fetchError.message);
			setIsLoading(false);
			onPrintError?.(fetchError.message);
			return;
		}

		// Process the fetched raw data into the structure the template expects
		const finalTemplateData = processRawInvoiceData(rawInvoiceItems);

		if (!finalTemplateData) {
			const errMsg =
				"Failed to process fetched invoice data into template format.";
			console.error("useInvoiceDetailPrinter:", errMsg);
			setError(errMsg);
			setIsLoading(false);
			onPrintError?.(errMsg);
			return;
		}

		const printerOptions = {
			characterSet: "UTF_8", // Default, adjust if needed
		};

		const printJobPayload = {
			printerName: printerName,
			templateType: templateType,
			templateData: finalTemplateData,
			printerOptions: printerOptions,
		};

		try {
			//console.log(
			// 	`useInvoiceDetailPrinter: Sending invoice to ${printerName} (Template: ${templateType})`
			// );
			const printResponse = await fetch(PRINT_API_URL, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(printJobPayload),
			});
			const printResult = await printResponse.json();

			if (!printResponse.ok) {
				const errMsg =
					printResult.error || `Print API Error: ${printResponse.statusText}`;
				throw new Error(errMsg);
			} else {
				//console.log(
				// 	`useInvoiceDetailPrinter: Invoice for ${printerName} [${templateType}] sent: ${printResult.message}`
				// );
				setSuccessMessage(printResult.message);
				onPrintSuccess?.(printResult.message);
			}
		} catch (printError) {
			console.error(
				`useInvoiceDetailPrinter: Error printing invoice to ${printerName} [${templateType}]:`,
				printError
			);
			setError(printError.message);
			onPrintError?.(printError.message);
		} finally {
			setIsLoading(false);
		}

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		invoiceIdToPrint,
		printerName,
		templateType /*, orderModel (if it can change), stable callbacks */,
	]);

	// Note: No automatic useEffect trigger here.
	// The component using this hook will call triggerInvoicePrint when needed.

	return [triggerInvoicePrint, { isLoading, error, successMessage }];
};
