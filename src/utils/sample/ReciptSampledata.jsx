// ThermalReceiptDocument.tsx
import React from "react";
import {
	Font,
	Document,
	Page,
	Text,
	View,
	StyleSheet,
	Image, // Import Image for logo
} from "@react-pdf/renderer";
// import { ReceiptData } from "./types"; // Assuming you have a types file

// ---- IMPORTANT: Font Registration ----
// Ensure these font files are in your `public/fonts/` directory or adjust paths.
// Using a generic "Monospace" and an Arabic font.
// "Courier" is a standard PDF font, often available.
// For Arabic, NotoSansArabic is a good choice if embedded.

Font.register({
	family: "Noto Sans Arabic", // The name you use in styles
	fonts: [
		{
			// Path relative to the 'public' folder root
			src: "/fonts/Cairo-Regular.ttf",
			// src: "/fonts/NotoSansArabic-Regular.ttf",
			fontWeight: "normal", // or 400
		},
		{
			// Path relative to the 'public' folder root
			src: "/fonts/NotoSansArabic-Bold.ttf",
			// src: "/fonts/NotoSansArabic-Bold.ttf",
			fontWeight: "bold", // or 700
		},
		// Add other weights if you copied them and need them
		// { src: '/fonts/Cairo-Light.ttf', fontWeight: 'light' }, // or 300
	],
});

Font.register({
	family: "Arimo",
	fonts: [
		{
			src: "/fonts/Arimo-Regular.ttf",
			fontWeight: "normal",
		},
		{
			src: "/fonts/Arimo-Bold.ttf",
			fontWeight: "bold",
		},
	],
});

Font.registerHyphenationCallback((word) => [word]);

// --- Styles ---
// All dimensions here are in points (default for @react-pdf/renderer)
// 1 inch = 72 points
// 80mm approx 226.77 points
// 76mm approx 215.43 points (common content width for 80mm paper)
const RECEIPT_CONTENT_WIDTH_PT = 210; // Content area width (e.g. 74mm)
const PAGE_PADDING = 8; // Approx 3mm padding in points

const styles = StyleSheet.create({
	page: {
		padding: PAGE_PADDING,
		fontSize: 9, // Base font size
		fontFamily: "Arimo", // Default font for the receipt
		width: RECEIPT_CONTENT_WIDTH_PT + 2 * PAGE_PADDING, // Total page width
		flexDirection: "column",
	},
	center: {
		textAlign: "center",
		alignItems: "center", // For Image centering
	},
	headerText: {
		fontSize: 11,
		fontWeight: "bold",
		textAlign: "center",
		marginBottom: 3,
	},
	subHeaderText: {
		fontSize: 8,
		textAlign: "center",
		marginBottom: 1,
	},
	arabicTextSmall: {
		fontFamily: "Noto Sans Arabic",
		fontSize: 7.5, // Smaller for Arabic sub-text
		textAlign: "right",
	},
	arabicTextRegular: {
		fontFamily: "Noto Sans Arabic",
		fontSize: 8.5,
		textAlign: "right",
	},
	infoRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		fontSize: 8.5,
		marginBottom: 1,
	},
	infoLabel: {
		// No specific style, relies on default
	},
	infoValue: {
		textAlign: "left", // Values typically left aligned unless numbers
	},
	hr: {
		borderBottomColor: "#000000",
		borderBottomWidth: 0.5,
		borderBottomStyle: "dashed",
		marginVertical: 5,
	},
	itemsHeaderRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		borderBottomColor: "#000000",
		borderBottomWidth: 0.75,
		paddingBottom: 2,
		marginBottom: 3,
		fontSize: 8,
		fontWeight: "bold",
	},
	itemsRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 2,
		fontSize: 8.5,
	},
	itemNameCol: {
		width: "55%", // Adjust based on typical item name length
		textAlign: "left",
	},
	itemQtyCol: {
		width: "15%",
		textAlign: "right",
	},
	itemAmountCol: {
		width: "30%",
		textAlign: "right",
	},
	subItemRow: {
		// For package sub-items
		flexDirection: "row",
		justifyContent: "space-between",
		fontSize: 8, // Slightly smaller for sub-items
		paddingLeft: 8, // Indent
		marginBottom: 1,
	},
	totalsRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginTop: 3,
		fontSize: 9,
	},
	totalsLabel: {
		textAlign: "right",
		fontWeight: "bold",
		width: "65%", // Give more space for "Label : العربي"
	},
	totalsAmount: {
		textAlign: "right",
		fontWeight: "bold",
		width: "35%",
	},
	netAmountLabel: {
		textAlign: "right",
		fontWeight: "bold",
		fontSize: 10,
		width: "65%",
	},
	netAmountValue: {
		textAlign: "right",
		fontWeight: "bold",
		fontSize: 10,
		width: "35%",
	},
	netAmountRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		borderTopColor: "#000000",
		borderTopWidth: 0.75,
		paddingTop: 3,
		marginTop: 3,
	},
	thankYouText: {
		textAlign: "center",
		fontWeight: "bold",
		marginVertical: 10,
		fontSize: 8.5,
	},
	footerText: {
		fontSize: 8,
		marginTop: 5,
		lineHeight: 1.1, // For dotted lines
	},
	logoImage: {
		maxHeight: 40, // Points
		maxWidth: "70%",
		marginBottom: 3,
		alignSelf: "center", // if parent is View with alignItems: 'center'
	},
});

// Helper for formatting currency, ensure it's robust
const formatCurrency = (value, decimals = 2) => {
	const num = parseFloat(value);
	return isNaN(num) ? "0.00" : num.toFixed(decimals);
};

const ThermalReceiptDocument = ({ data }) => {
	if (!data)
		return (
			<Document>
				<Page>
					<Text>No receipt data provided.</Text>
				</Page>
			</Document>
		);

	// Use a default if currency is missing
	const currencySymbol = data.currency || "QAR";

	return (
		<Document author="Your Company" title={`Receipt ${data.kotNumber || ""}`}>
			<Page
				size={[RECEIPT_CONTENT_WIDTH_PT + 2 * PAGE_PADDING, 280]}
				style={styles.page}
				wrap={false}>
				{/* Logo */}
				{data.logoUrl && (
					<View style={styles.center}>
						<Image src={data.logoUrl} style={styles.logoImage} />
					</View>
				)}

				{/* Header */}
				<Text style={styles.headerText}>
					{data.restaurantName || data.comanyName}
				</Text>
				<Text style={styles.subHeaderText}>
					الهاتف : {data.tel || data.cmpPhone}
				</Text>
				<Text style={{ ...styles.subHeaderText, marginBottom: 6 }}>
					الفاكس : {data.fax}
				</Text>

				{/* Date, Time, Bill, Pax */}
				<View style={styles.infoRow}>
					<Text>Date : {data.date}</Text>
					<Text>Time : {data.time}</Text>
				</View>
				<View style={{ ...styles.infoRow, marginBottom: 3 }}>
					<Text>Bill : {data.billType}</Text>
					<Text>Pax : {data.pax}</Text>
				</View>

				<Text style={{ fontSize: 8.5 }}>KOT No. : {data.kotNumber}</Text>
				{data.deliveryDateTime && (
					<Text style={{ fontSize: 8.5, marginBottom: 6 }}>
						Delivery Date/Time : {data.deliveryDateTime}
					</Text>
				)}

				<View style={styles.hr} />

				{/* Customer Info */}
				{data.customerName && (
					<Text style={{ fontSize: 8.5 }}>
						Customer Name : {data.customerName}
					</Text>
				)}
				{data.mobileNumber && (
					<Text style={{ fontSize: 8.5, marginBottom: 6 }}>
						Mobile Number : {data.mobileNumber}
					</Text>
				)}
				{(data.customerName || data.mobileNumber) && <View style={styles.hr} />}

				{/* Items Table Header */}
				<View style={styles.itemsHeaderRow}>
					<Text style={styles.itemNameCol}>Menu</Text>
					<Text style={styles.itemQtyCol}>Qty</Text>
					<Text style={styles.itemAmountCol}>Amount({currencySymbol})</Text>
				</View>

				{/* Items */}
				{(data.items || []).map((item, index) => (
					<React.Fragment key={`item-${index}-${item.name}`}>
						<View style={styles.itemsRow}>
							<View style={styles.itemNameCol}>
								<Text>{item.name}</Text>
								{item.nameAr && (
									<Text style={styles.arabicTextSmall}>{item.nameAr}</Text>
								)}
							</View>
							<Text style={styles.itemQtyCol}>{item.qty}</Text>
							<Text style={styles.itemAmountCol}>
								{formatCurrency(item.amount)}
							</Text>
						</View>
						{(item.subItems || []).map((subItem, subIndex) => (
							<View
								style={styles.subItemRow}
								key={`sub-${index}-${subIndex}-${subItem.name}`}>
								<View style={styles.itemNameCol}>
									<Text>{subItem.name}</Text>
									{subItem.nameAr && (
										<Text style={styles.arabicTextSmall}>{subItem.nameAr}</Text>
									)}
								</View>
								<Text style={styles.itemQtyCol}>{subItem.qty}</Text>
								<Text style={styles.itemAmountCol}>
									{formatCurrency(subItem.amount)}
								</Text>
							</View>
						))}
					</React.Fragment>
				))}

				<View style={styles.hr} />

				{/* Totals */}
				<View style={styles.totalsRow}>
					<Text style={styles.totalsLabel}>
						Total : <Text style={styles.arabicTextRegular}>مجموع</Text>
					</Text>
					<Text style={styles.totalsAmount}>{formatCurrency(data.total)}</Text>
				</View>

				{data.deliveryCharge !== undefined && data.deliveryCharge > 0 && (
					<View style={styles.totalsRow}>
						<Text style={styles.totalsLabel}>
							Delivery Charge :{" "}
							<Text style={styles.arabicTextRegular}>رسوم التوصيل</Text>
						</Text>
						<Text style={styles.totalsAmount}>
							{formatCurrency(data.deliveryCharge)}
						</Text>
					</View>
				)}

				<View style={styles.netAmountRow}>
					<Text style={styles.netAmountLabel}>
						Net Amount :{" "}
						<Text style={{ ...styles.arabicTextRegular, fontSize: 9 }}>
							المبلغ الإجمالي
						</Text>
					</Text>
					<Text style={styles.netAmountValue}>
						{formatCurrency(data.netAmount)}
					</Text>
				</View>

				{/* Footer */}
				<Text style={styles.thankYouText}>{data.thankYouMessage}</Text>
				<Text style={styles.footerText}>
					{data.commentsLabel || "Comments"}
					{data.commentsPlaceholder ||
						".........................................."}
				</Text>
				<Text style={styles.footerText}>
					{data.signLabel || "Sign"}
					{data.signPlaceholder || ".........................................."}
				</Text>
			</Page>
		</Document>
	);
};

export default ThermalReceiptDocument;
