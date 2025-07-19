// src/hooks/useOrderPrinter.js
import { useState, useCallback } from "react";
// Assuming processOrderDataForPrinting is correctly typed and exported from this path
import { processOrderDataForPrinting } from "../../../utils/printerHelper/convertPrintData.js"; // Your provided path
import orderModel from "../../../plugins/models/orderModel.js";

const PRINT_API_URL = "http://localhost:3030/api/print";
const ORDER_DETAILS_API_URL =
	"http://your-backend-api.com/api/getOrderDetailsByKot"; // Replace

/**
 * @typedef {object} RawItemFromAPI // Define this based on your API response structure
 * @property {string} printername
 * // ... other properties
 */

/**
 * @typedef {object} ChelokababTemplateData // Define this based on what your template expects
 * @property {string} storeName
 * @property {Array<object>} items // Hierarchical items
 * // ... other properties
 */

/**
 * @typedef {object} UseOrderPrinterProps
 * @property {string|null|undefined} kotReferenceNo
 * @property {string[]} templateTypesToPrint // Array of template type strings to print for ALL printers found
 * @property {() => void} [onPrintInitiated]
 * @property {(printerName: string, templateType: string, message: string) => void} [onPrintSuccess]
 * @property {(printerName: string | null, templateType: string | null, error: string) => void} [onPrintError]
 * @property {(results: Array<{printerName: string, templateType?: string, success: boolean, message?: string, error?: string}>) => void} [onAllPrintsAttempted]
 */

/**
 * @typedef {object} PrintStatus
 * @property {boolean} isLoading
 * @property {string|null} error
 * @property {Array<{printerName: string, templateType: string, success: boolean, message?: string, error?: string}>} printResults
 */

/**
 * Custom hook to fetch order data, process it by printer, and send print jobs.
 * @param {UseOrderPrinterProps} props
 * @returns {[() => Promise<void>, PrintStatus]}
 */

function getKotFilter(kotNumber, shouldUpdate) {
	const baseFilter = `Koh_ReferNo_V = '${kotNumber}'`;

	if (shouldUpdate) {
		return {
			strfilter: `${baseFilter} AND ISNULL(c.Kod_Staus_N,0) IN (0,2)`,
		};
	} else {
		return {
			strfilter: baseFilter,
		};
	}
}

export const useOrderPrinter = ({
	kotReferenceNo,
	templateTypesToPrint,
	onPrintInitiated,
	onPrintSuccess,
	onPrintError,
	onAllPrintsAttempted,
}) => {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);
	const [printResults, setPrintResults] = useState([]);

	const triggerPrintProcess = useCallback(
		async (params = {}) => {
			const { isUpdate = false, isCancel = false } = params;

			//console.log("⚡⚡⚡", isUpdate);

			if (!kotReferenceNo) {
				//console.log("useOrderPrinter: No KOT reference provided.");
				return;
			}
			if (!templateTypesToPrint || templateTypesToPrint.length === 0) {
				console.warn("useOrderPrinter: No templateTypesToPrint provided.");
				onPrintError?.(
					"Configuration",
					null,
					"No template types configured for printing."
				);
				return;
			}

			setIsLoading(true);
			setError(null);
			setPrintResults([]);
			onPrintInitiated?.();

			let allRawOrderItems = [];
			try {
				//console.log(
				// 	`useOrderPrinter: Fetching order details for KOT: ${kotReferenceNo}`
				// );

				const responseData = await orderModel.getkotprint(
					getKotFilter(kotReferenceNo, isUpdate)
				);

				//console.log("PRInt api res", responseData);

				if (responseData?.status === "true" && responseData.data) {
					allRawOrderItems = responseData.data; // Assuming responseData.data contains the array of items
					if (
						!allRawOrderItems ||
						!Array.isArray(allRawOrderItems) ||
						allRawOrderItems.length === 0
					) {
						throw new Error(
							`No order items found or invalid format in orderModel response for KOT: ${kotReferenceNo}`
						);
					}
					//console.log(
					// 	`useOrderPrinter: Fetched ${allRawOrderItems.length} raw order items via orderModel.`
					// );
				} else {
					// Handle cases where status is not "true" or data is missing
					const errorMessage =
						responseData?.message ||
						`Failed to fetch order details via orderModel for KOT: ${kotReferenceNo}. Status: ${responseData?.status}`;
					throw new Error(errorMessage);
				}
			} catch (fetchError) {
				console.error(
					"useOrderPrinter: Error fetching order details:",
					fetchError
				);
				setError(fetchError.message);
				setIsLoading(false);
				onPrintError?.(null, null, fetchError.message);
				onAllPrintsAttempted?.([
					{
						printerName: "DataFetch",
						success: false,
						error: fetchError.message,
					},
				]);
				return;
			}

			// Use your existing function to process and group data
			// processOrderDataForPrinting should return a Map<string, ChelokababTemplateData>
			const processedDataMap = processOrderDataForPrinting(allRawOrderItems);
			const currentRunResults = [];

			if (processedDataMap.size === 0) {
				//console.log(
				// 	"useOrderPrinter: No printers found in order data after processing."
				// );
				setIsLoading(false);
				onAllPrintsAttempted?.([]); // No jobs to attempt
				// You might want to set an error or specific message if no printers are found
				setError("No printers identified for this order.");
				onPrintError?.(
					"Processing",
					null,
					"No printers identified for this order."
				);
				return;
			}
			//console.log(
			// 	`useOrderPrinter: Data processed for ${processedDataMap.size} printers.`
			// );

			// Iterate through the Map returned by processOrderDataForPrinting
			for (const [
				printerName,
				templateDataForThisPrinter,
			] of processedDataMap) {
				// For each templateType specified in the hook's props
				for (const templateType of templateTypesToPrint) {
					const printerOptions = {
						// Default options
						characterSet: "UTF_8",
					};

					const finalTemplateData = {
						...templateDataForThisPrinter,
						followUpStatus: isUpdate && "====Follow Up====",
						cancel: isCancel ? true : false,
					};

					const printJobPayload = {
						printerName: printerName,
						templateType: templateType,
						templateData: finalTemplateData, // Use the pre-processed data for this printer
						printerOptions: printerOptions,
					};

					try {
						//console.log(
						// 	`useOrderPrinter: Sending job to ${printerName} (Template: ${templateType})`
						// );
						const printResponse = await fetch(PRINT_API_URL, {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify(printJobPayload),
						});
						const printResult = await printResponse.json();

						if (!printResponse.ok) {
							const errMsg =
								printResult.error ||
								`Print API Error: ${printResponse.statusText}`;
							console.error(
								`useOrderPrinter: Error printing to ${printerName} [${templateType}]:`,
								errMsg
							);
							onPrintError?.(printerName, templateType, errMsg);
							currentRunResults.push({
								printerName,
								templateType,
								success: false,
								error: errMsg,
							});
						} else {
							//console.log(
							// 	`useOrderPrinter: Job for ${printerName} [${templateType}] sent successfully: ${printResult.message}`
							// );
							onPrintSuccess?.(printerName, templateType, printResult.message);
							currentRunResults.push({
								printerName,
								templateType,
								success: true,
								message: printResult.message,
							});
						}
					} catch (printFetchError) {
						console.error(
							`useOrderPrinter: Network error printing to ${printerName} [${templateType}]:`,
							printFetchError
						);
						const errMsg =
							printFetchError.message || "Network error during printing.";
						onPrintError?.(printerName, templateType, errMsg);
						currentRunResults.push({
							printerName,
							templateType,
							success: false,
							error: errMsg,
						});
					}
				} // End of templateTypesToPrint loop
			} // End of processedDataMap loop

			setPrintResults(currentRunResults);
			setIsLoading(false);
			onAllPrintsAttempted?.(currentRunResults);

			// eslint-disable-next-line react-hooks/exhaustive-deps
		},
		[kotReferenceNo, templateTypesToPrint /* , stable callbacks if needed */]
	);

	// No auto-trigger useEffect; component calls triggerPrintProcess.

	return [triggerPrintProcess, { isLoading, error, printResults }];
};
