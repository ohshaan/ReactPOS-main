import html2pdf from "html2pdf.js";
import { createRoot } from "react-dom/client";
import ThermalReceiptLayout from "./ThermalReceiptLayout";
import React from "react";

export const useThermalPrinter = () => {
	const generateAndPrintPdf = async (receiptData, options = {}) => {
		if (!receiptData) {
			console.error("Receipt data is missing.");
			return null;
		}

		const container = document.createElement("div");
		container.id = "thermal-pdf-print-source";
		container.style.width = "76mm";
		container.style.position = "absolute";
		container.style.left = "-10000px";
		container.style.top = "-10000px";
		document.body.appendChild(container);

		const root = createRoot(container);

		try {
			await new Promise((resolve, reject) => {
				try {
					root.render(<ThermalReceiptLayout receiptData={receiptData} />);
					requestAnimationFrame(() => {
						requestAnimationFrame(() => {
							if (
								container.offsetHeight === 0 &&
								container.scrollHeight === 0 &&
								receiptData.items?.length > 0
							) {
								console.warn(
									"Rendered container has zero height. Content might be invisible or layout incorrect."
								);
							}
							resolve();
						});
					});
				} catch (renderError) {
					console.error(
						"Error rendering React component for PDF:",
						renderError
					);
					reject(renderError);
				}
			});

			const defaultPdfOptions = {
				margin: [2, 2, 2, 2],
				filename: `receipt-${Date.now()}.pdf`,
				image: { type: "jpeg", quality: 0.98 },
				html2canvas: {
					scale: 3,
					useCORS: true,
					logging: false, // Default to false, user can override via options
					backgroundColor: "#ffffff",
				},
				jsPDF: {
					unit: "mm",
					orientation: "portrait",
				},
				pagebreak: { mode: ["avoid-all", "css", "legacy"] },
			};

			let pdfOptions = { ...defaultPdfOptions, ...options }; // Initial shallow merge

			// Deep merge for nested objects
			if (options.jsPDF) {
				pdfOptions.jsPDF = { ...defaultPdfOptions.jsPDF, ...options.jsPDF };
			} else {
				pdfOptions.jsPDF = { ...defaultPdfOptions.jsPDF }; // Ensure it's a copy
			}

			if (options.html2canvas) {
				pdfOptions.html2canvas = {
					...defaultPdfOptions.html2canvas,
					...options.html2canvas,
				};
			} else {
				pdfOptions.html2canvas = { ...defaultPdfOptions.html2canvas }; // Ensure it's a copy
			}

			// Handle specific top-level options that might be objects/arrays themselves
			pdfOptions.margin =
				options.margin && Array.isArray(options.margin)
					? options.margin
					: defaultPdfOptions.margin;
			pdfOptions.image = options.image
				? { ...defaultPdfOptions.image, ...options.image }
				: { ...defaultPdfOptions.image };
			pdfOptions.pagebreak = options.pagebreak
				? { ...defaultPdfOptions.pagebreak, ...options.pagebreak }
				: { ...defaultPdfOptions.pagebreak };
			pdfOptions.filename =
				typeof options.filename === "string"
					? options.filename
					: defaultPdfOptions.filename;

			//console.log("Generating PDF with options:", pdfOptions);
			// //console.log("Source element for PDF:", container);

			const worker = html2pdf().from(container).set(pdfOptions);
			const blob = await worker.outputPdf("blob");

			// //console.log("Generated PDF Blob:", blob);

			if (blob?.size > 0) {
				const url = URL.createObjectURL(blob);
				// //console.log("PDF URL created:", url);
				const win = window.open(url, "_blank");
				if (!win) {
					// Popup blocked
					console.warn(
						"Popup blocked. Could not open PDF for printing. Initiating download fallback."
					);
					const link = document.createElement("a");
					link.href = url;
					link.download = pdfOptions.filename;
					document.body.appendChild(link);
					link.click();
					document.body.removeChild(link);
					URL.revokeObjectURL(url);
				}
				return blob;
			} else {
				console.error(
					"Empty PDF blob generated. Check html2canvas logs and element rendering."
				);
				return null;
			}
		} catch (err) {
			console.error("PDF generation process error:", err);
			return null;
		} finally {
			try {
				root.unmount();
			} catch (unmountError) {
				console.warn(
					"Error unmounting React root for PDF container:",
					unmountError
				);
			}
			if (document.body.contains(container)) {
				document.body.removeChild(container);
			}
		}
	};

	return { generateAndPrintPdf };
};
