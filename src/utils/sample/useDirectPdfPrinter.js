// src/hooks/useDirectPdfPrinter.ts (or .js if you prefer JavaScript)

import { useState, useCallback } from "react";

const PRINT_PDF_DIRECT_API_URL = "http://localhost:3030/api/print-pdf-direct";

// interface UseDirectPdfPrinterProps {
//     onPrintInitiated?: () => void;
//     onPrintSuccess?: (message: string, printerName: string) => void;
//     onPrintError?: (error: string, printerName?: string) => void;
// }

// interface DirectPdfPrintStatus {
//     isLoading: boolean;
//     error: string | null;
//     successMessage: string | null;
// }

// interface TriggerPrintPdfParams {
//     pdfFile: File | Blob | null;
//     targetPrinterName: string;
//     printerOptions?: Record<string, any>; // Optional printer options
// }

// Helper function to convert File/Blob to Base64 string (pure base64 part)
const getBase64FromFile = (file) => {
	return new Promise((resolve, reject) => {
		if (!file) {
			resolve(null);
			return;
		}
		const reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = () => {
			const base64StringWithPrefix = reader.result;
			if (
				base64StringWithPrefix &&
				typeof base64StringWithPrefix === "string"
			) {
				const base64String = base64StringWithPrefix.split(",")[1];
				resolve(base64String);
			} else {
				resolve(null); // Or reject if this case is an error
			}
		};
		reader.onerror = (error) => reject(error);
	});
};

export const useDirectPdfPrinter = ({
	onPrintInitiated,
	onPrintSuccess,
	onPrintError,
}) => {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);
	const [successMessage, setSuccessMessage] = useState(null);

	const triggerPrintPdf = useCallback(
		async ({ pdfFile, targetPrinterName, printerOptions = {} }) => {
			if (!pdfFile) {
				const errMsg = "No PDF file provided to print.";
				console.warn("useDirectPdfPrinter:", errMsg);
				setError(errMsg);
				onPrintError?.(errMsg, targetPrinterName);
				return;
			}
			if (!targetPrinterName) {
				const errMsg = "No target printer name specified.";
				console.warn("useDirectPdfPrinter:", errMsg);
				setError(errMsg);
				onPrintError?.(errMsg);
				return;
			}

			setIsLoading(true);
			setError(null);
			setSuccessMessage(null);
			onPrintInitiated?.();

			try {
				//console.log(
					`useDirectPdfPrinter: Preparing PDF for printer: ${targetPrinterName}...`
				);
				const pdfBase64String = await getBase64FromFile(pdfFile);

				if (!pdfBase64String) {
					throw new Error("Failed to convert PDF to Base64 string.");
				}

				const payload = {
					printerName: targetPrinterName,
					pdfBase64: pdfBase64String,
					printerOptions: printerOptions,
				};

				//console.log(
					`useDirectPdfPrinter: Sending PDF to printer: ${targetPrinterName}`
				);
				const response = await fetch(PRINT_PDF_DIRECT_API_URL, {
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

				const successMsg = `PDF sent successfully to ${targetPrinterName}: ${result.message}`;
				//console.log("useDirectPdfPrinter: Print API success:", result);
				setSuccessMessage(successMsg);
				onPrintSuccess?.(successMsg, targetPrinterName);
			} catch (err) {
				const errorMsg =
					err.message || "An unknown error occurred during PDF printing.";
				console.error(
					"useDirectPdfPrinter: Error during PDF print process:",
					err
				);
				setError(errorMsg);
				onPrintError?.(errorMsg, targetPrinterName);
			} finally {
				setIsLoading(false);
			}
		},
		[onPrintInitiated, onPrintSuccess, onPrintError]
	); // Dependencies for useCallback

	return [triggerPrintPdf, { isLoading, error, successMessage }];
};
