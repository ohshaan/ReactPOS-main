// usePdfGenerator.js
import { pdf } from "@react-pdf/renderer";
import ThermalReceiptDocument from "./ReciptSampledata"; // Adjust path
import React from "react"; // Needed for JSX if an error occurs during PDF generation

export const usePdfGenerator = () => {
	const generatePdfBlob = async (receiptData) => {
		if (!receiptData) {
			console.error("Receipt data is missing for PDF generation.");
			return null;
		}

		try {
			//console.log("Generating PDF blob with data:", receiptData);
			const blob = await pdf(
				<ThermalReceiptDocument data={receiptData} />
			).toBlob();
			//console.log("PDF Blob generated, size:", blob.size);
			return blob;
		} catch (error) {
			console.error(
				"Error generating PDF blob with @react-pdf/renderer:",
				error
			);
			return null;
		}
	};

	const openPdfInNewTab = (blob, filename = "receipt.pdf") => {
		if (!blob || blob.size === 0) {
			console.error("Cannot open PDF: Blob is null or empty.");
			return;
		}
		try {
			const url = URL.createObjectURL(blob);
			const win = window.open(url, "_blank");
			if (!win) {
				console.warn("Popup blocked. Could not open PDF. Initiating download.");
				// Fallback to download
				const link = document.createElement("a");
				link.href = url;
				link.download = filename;
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				URL.revokeObjectURL(url); // Clean up blob URL after download initiated
			}
			// No need to revoke URL immediately if window.open succeeded, browser handles it.
			// However, if you want to be proactive, you could revoke after a delay or on window unload.
		} catch (error) {
			console.error("Error opening PDF in new tab:", error);
		}
	};

	return { generatePdfBlob, openPdfInNewTab };
};
