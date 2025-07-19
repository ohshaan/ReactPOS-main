// ReceiptPDF.tsx
import React from "react";
import {
	Font,
	Document,
	Page,
	Text,
	View,
	StyleSheet,
} from "@react-pdf/renderer";
import { ReceiptData } from "./types";

const RECEIPT_WIDTH_POINTS = 226; // Approx 80mm (226.77 pts for 80mm at 72dpi)
const MAX_POSSIBLE_HEIGHT_POINTS = 10000; // A very large height, adjust if needed
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

const styles = StyleSheet.create({
	page: {
		padding: 10,
		fontSize: 9,
		fontFamily: "Arimo",
		width: 226,
	},
	center: {
		textAlign: "center",
		marginBottom: 4,
	},
	header: {
		fontSize: 14,
		textAlign: "center",
		marginTop: 6,
		marginBottom: 8,
		fontWeight: "bold",
	},
	invoice: {
		fontSize: 12,
		textAlign: "center",
		fontWeight: "bold",
		marginBottom: 4,
		marginTop: 4,
	},
	bold: {
		fontWeight: "bold",
	},
	section: {
		marginBottom: 4,
	},
	row: {
		// width: "100%",
		gap: 6,
		flexDirection: "row",
		fontWeight: "bold",
		justifyContent: "space-between",
	},
	hr: {
		borderBottom: "1px dashed black",
		marginVertical: 4,
	},
	heading: {
		flexDirection: "row",
		justifyContent: "space-between",
		fontWeight: "medium",
		width: "100%",
	},
	dottedLine: {
		marginVertical: 4,
		borderBottom: "1px dotted black",
	},
	tableHeader: {
		fontSize: 7,
		flexDirection: "row",
		borderBottom: "1px dotted black",
		paddingBottom: 2,
		fontWeight: "bold",
	},
	infoRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 2,
		alignItems: "flex-start",
	},
	label: {
		fontWeight: "bold",
		fontSize: 9,
		flex: 1,
	},
	value: {
		fontSize: 9,
		flex: 1,
		textAlign: "right",
		// flexWrap: "wrap", // allow wrapping
		wordBreak: "break-word", // optional, helps long word
		maxWidth: "50%",
	},
	col: {
		flex: 1,
		textAlign: "left",
	},
	right: {
		textAlign: "right",
	},
	arabic: {
		fontFamily: "Noto Sans Arabic",
		fontSize: 6,
		textAlign: "right",
		padding: 0,
		width: "100%",
		// paddingLeft: 14,
		// direction: "rtl",
		// flexWrap: "wrap",
		// wordBreak: "break-word",
		// width: "50%",
		// flex: 1,
	},
	br: {
		marginBottom: 4,
	},

	gridRow: {
		flexDirection: "row",
		fontSize: 7,
		alignItems: "flex-start",
		paddingTop: 2,
	},
	gridCell: {
		paddingHorizontal: 2,
	},
	cellSerial: {
		width: 18,
		paddingLeft: 2,
		// border: "1px solid black",
	},
	cellDescription: {
		flex: 2,
		// border: "1px solid black",
	},
	cellQty: {
		flex: 1,
		textAlign: "right",
		paddingRight: 2,
		// border: "1px solid black",
	},
	cellAmount: {
		flex: 1,
		textAlign: "right",
		paddingRight: 2,
		// border: "1px solid black",
	},
	cellDiscount: {
		flex: 1,
		textAlign: "right",
		paddingRight: 2,
		// border: "1px solid black",
	},
	cellNet: {
		flex: 1,
		textAlign: "right",
		paddingRight: 2,
		// border: "1px solid black",
	},

	// gridRow: {
	// 	flexDirection: "row",
	// 	alignItems: "flex-start",
	// 	marginBottom: 2,
	// 	fontSize: 7,
	// },

	// cellSerial: {
	// 	width: 20,
	// },

	// cellDescription: {
	// 	flex: 2.5,
	// 	flexDirection: "column",
	// 	gap: 1,
	// },

	// cellQty: {
	// 	flex: 1,
	// 	textAlign: "right",
	// },

	// cellAmount: {
	// 	flex: 1,
	// 	textAlign: "right",
	// },
});

const ReceiptPDF = ({ data }) => {
	return (
		<Document>
			<Page
				size={[RECEIPT_WIDTH_POINTS, MAX_POSSIBLE_HEIGHT_POINTS]}
				wrap={false}
				style={styles.page}>
				{/* <Page size={[styles.page.width, "auto"]} style={styles.page}> */}
				{/* Header */}
				<View style={styles.center}>
					<Text style={styles.header}>{data.comanyName}</Text>
					<Text style={styles.bold}>{`Tel : ${data.cmpPhone}`}</Text>
					<Text style={styles.bold}>{`Email ID: ${data.cmpEmail}`}</Text>
					<Text style={styles.bold}>{data.dateTime}</Text>
					<Text style={styles.invoice}># {data.invoiceNumber}</Text>
				</View>

				{/* Student Info */}
				<View style={styles.section}>
					<View style={styles.infoRow}>
						<Text style={styles.label}>Admission Number:</Text>
						<Text style={styles.value}>{data.admissionNumber}</Text>
					</View>
					<View style={styles.infoRow}>
						<Text style={styles.label}>Name:</Text>
						<Text style={styles.value}>{data.name}</Text>
					</View>
					<View style={styles.infoRow}>
						<Text style={styles.label}>Grade/Dept:</Text>
						<Text style={styles.value}>{data.grade}</Text>
					</View>
				</View>

				<View style={styles.hr} />

				{/* Table Header */}
				{/* <View style={styles.tableHeader}>
					<Text style={{ width: 20 }}>##</Text>
					<Text style={{ flex: 2.5 }}>Description</Text>
					<Text style={{ flex: 1, textAlign: "right" }}>Qty</Text>
					<Text style={{ flex: 1, textAlign: "right" }}>Amount</Text>
					<Text style={{ flex: 1, textAlign: "right" }}>Discount</Text>
					<Text style={{ flex: 1, textAlign: "right" }}>Net</Text>
				</View> */}

				<View style={[styles.gridRow, styles.tableHeader]}>
					<Text style={[styles.gridCell, styles.cellSerial]}>##</Text>
					<Text style={[styles.gridCell, styles.cellDescription]}>
						Description
					</Text>
					<Text style={[styles.gridCell, styles.cellQty]}>Qty</Text>
					<Text style={[styles.gridCell, styles.cellAmount]}>Amount</Text>
					<Text style={[styles.gridCell, styles.cellDiscount]}>
						Discount Amount
					</Text>
					<Text style={[styles.gridCell, styles.cellNet]}>Net Amount</Text>
				</View>

				{/* <View style={styles.hr} /> */}

				{/* Items */}
				{/* {data.items.map((item) => {
					return (
						<View key={item.serialNo} style={{ marginBottom: 2 }}>
							<View style={{ flexDirection: "row", marginTop: 2, fontSize: 7 }}>
								<Text style={{ width: 20 }}>{item.serialNo}</Text>
								<View style={{ flex: 2 }}>
									<Text>{item.description}</Text>
									{item.arabicDescription && (
										<Text style={styles.arabic}>{item.arabicDescription}</Text>
									)}
								</View>

								<Text style={{ flex: 1, textAlign: "right" }}>
									{item.quantity}
								</Text>
								<Text style={{ flex: 1, textAlign: "right" }}>
									{item.amount.toFixed(2)}
								</Text>
								<Text style={{ flex: 1, textAlign: "right" }}>
									{item.discount.toFixed(2)}
								</Text>
								<Text style={{ flex: 1, textAlign: "right" }}>
									{item.netAmount.toFixed(2)}
								</Text>
							</View>
						</View>
					);
				})} */}

				{data.items.map((item) => (
					<View key={item.serialNo} style={styles.gridRow}>
						<Text style={styles.cellSerial}>{item.serialNo}</Text>

						<View style={styles.cellDescription}>
							<Text>{item.description}</Text>
							{item.arabicDescription && (
								<Text style={styles.arabic}>{item.arabicDescription}</Text>
							)}
						</View>

						<Text style={styles.cellQty}>{item.quantity}</Text>
						<Text style={styles.cellAmount}>{item.amount.toFixed(2)}</Text>
						<Text style={styles.cellAmount}>{item.discount.toFixed(2)}</Text>
						<Text style={styles.cellAmount}>{item.netAmount.toFixed(2)}</Text>
					</View>
				))}

				<View style={styles.hr} />

				{/* Summary */}
				<View style={styles.row}>
					<Text>Net Amount(QAR) :</Text>
					<Text>{data.netAmount.toFixed(2)}</Text>
				</View>

				<View style={styles.hr} />

				{/* <View style={styles.row}>
					<Text>Cash :</Text>
					<Text>{data.cash.toFixed(2)}</Text>
				</View> */}
				<View style={styles.row}>
					{data.payments.map((payment) => (
						<View key={payment.label} style={styles.row}>
							<Text>{payment.label} :</Text>
							<Text>{payment.amount.toFixed(2)}</Text>
						</View>
					))}
				</View>

				<View style={styles.br} />

				<Text style={{ fontWeight: "bold" }}>
					You have been served by : {data.servedBy}
				</Text>

				<View style={styles.hr} />

				{/* Footer */}
				<View style={styles.center}>
					<Text>
						Thank You - <Text style={styles.arabic}>شكراً</Text>
					</Text>
				</View>

				<View style={styles.hr} />
			</Page>
		</Document>
	);
};

export default ReceiptPDF;
