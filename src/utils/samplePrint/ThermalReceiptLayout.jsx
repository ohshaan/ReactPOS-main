// ThermalReceiptLayout.js
import React from "react";

// Helper for consistent currency formatting (can be moved to a utils file)
const formatReceiptCurrency = (value, decimals = 2) => {
	const num = parseFloat(value);
	if (isNaN(num)) return "0.00"; // Or handle error appropriately
	return num.toFixed(decimals);
};

const ThermalReceiptLayout = React.forwardRef(({ receiptData }, ref) => {
	if (!receiptData) {
		console.warn("ThermalReceiptLayout: receiptData is missing.");
		return null;
	}

	// Base styles - consider moving to a constants file or defining outside if component re-renders often
	const rootStyle = {
		width: "72mm", // Content width (76mm paper - 2*2mm padding)
		padding: "2mm", // Small padding, effectively making outer width 76mm
		fontFamily:
			'"Courier New", Courier, monospace, "Arabic Transparent", "Noto Sans Arabic"', // Added Arabic fallbacks
		fontSize: "9.5pt", // Common for thermal, adjust as needed
		lineHeight: "1.25",
		color: "#000000",
		backgroundColor: "#ffffff",
		boxSizing: "border-box", // Important if adding borders/padding to inner elements
	};

	const centeredTextStyle = { textAlign: "center" };
	const boldTextStyle = { fontWeight: "bold" };
	const smallFontSizeStyle = { fontSize: "8.5pt" }; // Slightly smaller for secondary info

	const flexRowSpaceBetween = {
		display: "flex",
		justifyContent: "space-between",
		width: "100%",
	};

	const itemRowSharedStyle = {
		...flexRowSpaceBetween,
		margin: "1px 0", // Tighter margin for item rows
	};

	const itemNameColStyle = {
		textAlign: "left",
		flexGrow: 1, // Takes remaining space
		paddingRight: "4px",
		wordBreak: "break-word",
	};

	const itemQtyColStyle = {
		textAlign: "right",
		width: "35px", // Fixed width for Qty column
		minWidth: "35px",
		paddingRight: "4px",
	};

	const itemAmountColStyle = {
		textAlign: "right",
		width: "70px", // Fixed width for Amount column
		minWidth: "70px",
	};

	const subItemRowStyle = {
		...itemRowSharedStyle,
		paddingLeft: "8px", // Indent for sub-items
	};

	const hrStyle = {
		border: "none",
		borderTop: "1px dashed #000000",
		margin: "6px 0",
	};

	// //console.log("Thermal Print Layout Data:", { receiptData }); // Keep for debugging

	return (
		<div ref={ref} style={rootStyle}>
			{receiptData.logoUrl && (
				<div style={{ ...centeredTextStyle, marginBottom: "5px" }}>
					<img
						src={receiptData.logoUrl}
						alt="Logo"
						style={{ maxHeight: "50px", maxWidth: "70%", objectFit: "contain" }}
					/>
				</div>
			)}
			<div
				style={{
					...centeredTextStyle,
					...boldTextStyle,
					fontSize: "10.5pt",
					marginBottom: "4px",
				}}>
				{receiptData.restaurantName}
			</div>

			<div
				style={{
					...centeredTextStyle,
					...smallFontSizeStyle,
					marginBottom: "6px",
				}}>
				<div>الهاتف : {receiptData.tel || "N/A"}</div>
				<div>الفاكس : {receiptData.fax || "N/A"}</div>
			</div>

			<div style={{ ...flexRowSpaceBetween, ...smallFontSizeStyle }}>
				<span>Date : {receiptData.date}</span>
				<span>Time : {receiptData.time}</span>
			</div>
			<div
				style={{
					...flexRowSpaceBetween,
					...smallFontSizeStyle,
					marginBottom: "4px",
				}}>
				<span>Bill : {receiptData.billType}</span>
				<span>Pax : {receiptData.pax}</span>
			</div>

			<div style={smallFontSizeStyle}>KOT No. : {receiptData.kotNumber}</div>
			{receiptData.deliveryDateTime && (
				<div style={{ ...smallFontSizeStyle, marginBottom: "6px" }}>
					Delivery Date/Time : {receiptData.deliveryDateTime}
				</div>
			)}

			<hr style={hrStyle} />

			{receiptData.customerName && (
				<div style={smallFontSizeStyle}>
					Customer Name : {receiptData.customerName}
				</div>
			)}
			{receiptData.mobileNumber && (
				<div style={{ ...smallFontSizeStyle, marginBottom: "6px" }}>
					Mobile Number : {receiptData.mobileNumber}
				</div>
			)}
			{(receiptData.customerName || receiptData.mobileNumber) && (
				<hr style={hrStyle} />
			)}

			{/* Items Header */}
			<div
				style={{
					...itemRowSharedStyle,
					...boldTextStyle,
					borderBottom: "1px solid #000000",
					paddingBottom: "2px",
					marginBottom: "3px",
				}}>
				<span style={{ ...itemNameColStyle, flexBasis: "auto" }}>Menu</span>{" "}
				{/* Adjusted flexBasis */}
				<span style={{ ...itemQtyColStyle, textAlign: "center" }}>Qty</span>
				<span style={{ ...itemAmountColStyle, textAlign: "right" }}>
					Amount({receiptData.currency || "CUR"})
				</span>
			</div>

			{/* Items List */}
			{(receiptData.items || []).map((item, index) => (
				<React.Fragment key={`item-${index}`}>
					<div style={itemRowSharedStyle}>
						<span style={itemNameColStyle}>
							{item.name}
							{item.nameAr && (
								<div dir="rtl" style={smallFontSizeStyle}>
									{item.nameAr}
								</div>
							)}
						</span>
						<span style={itemQtyColStyle}>{item.qty}</span>
						<span style={itemAmountColStyle}>
							{formatReceiptCurrency(item.amount)}
						</span>
					</div>
					{(item.subItems || []).map((subItem, subIndex) => (
						<div key={`subitem-${index}-${subIndex}`} style={subItemRowStyle}>
							<span style={itemNameColStyle}>
								{subItem.name}
								{subItem.nameAr && (
									<div dir="rtl" style={smallFontSizeStyle}>
										{subItem.nameAr}
									</div>
								)}
							</span>
							<span style={itemQtyColStyle}>{subItem.qty}</span>
							<span
								style={{
									...itemAmountColStyle,
									color: parseFloat(subItem.amount) > 0 ? "#000000" : "#4a4a4a", // Slightly dim zero-price sub-items
								}}>
								{formatReceiptCurrency(subItem.amount)}
							</span>
						</div>
					))}
				</React.Fragment>
			))}

			<hr style={hrStyle} />

			{/* Totals Section */}
			{/* Using a helper div for alignment of right-aligned text with potential Arabic inline */}
			{[
				{
					label: "Total",
					labelAr: "مجموع",
					value: receiptData.total,
					show: true,
				},
				{
					label: "Delivery Charge",
					labelAr: "رسوم التوصيل",
					value: receiptData.deliveryCharge,
					show: receiptData.deliveryCharge > 0,
				},
			].map(
				(field) =>
					field.show && (
						<div
							key={field.label}
							style={{ ...itemRowSharedStyle, marginTop: "3px" }}>
							<span
								style={{ flexGrow: 1, textAlign: "right", ...boldTextStyle }}>
								{field.label} :
								{field.labelAr && (
									<div
										dir="rtl"
										style={{
											...smallFontSizeStyle,
											display: "inline-block",
											marginLeft: "5px",
											fontWeight: "normal",
										}}>
										{field.labelAr}
									</div>
								)}
							</span>
							<span style={itemAmountColStyle}>
								{formatReceiptCurrency(field.value)}
							</span>
						</div>
					)
			)}

			<div
				style={{
					...itemRowSharedStyle,
					...boldTextStyle,
					fontSize: "10.5pt", // Slightly larger for Net Amount
					borderTop: "1px solid #000000",
					paddingTop: "3px",
					marginTop: "3px",
				}}>
				<span style={{ flexGrow: 1, textAlign: "right" }}>
					Net Amount :
					<div
						dir="rtl"
						style={{
							fontSize: "9.5pt",
							display: "inline-block",
							marginLeft: "5px",
						}}>
						المبلغ الإجمالي
					</div>
				</span>
				<span style={itemAmountColStyle}>
					{formatReceiptCurrency(receiptData.netAmount)}
				</span>
			</div>

			<div
				style={{
					...centeredTextStyle,
					...boldTextStyle,
					margin: "12px 0",
					...smallFontSizeStyle,
				}}>
				{receiptData.thankYouMessage}
			</div>

			<div
				style={{ ...smallFontSizeStyle, marginTop: "12px", lineHeight: "1.1" }}>
				{receiptData.commentsLabel || "Comments"}
				{receiptData.commentsPlaceholder ||
					"..................................."}
			</div>
			<div
				style={{
					...smallFontSizeStyle,
					marginTop: "8px",
					marginBottom: "8px",
					lineHeight: "1.1",
				}}>
				{receiptData.signLabel || "Sign"}
				{receiptData.signPlaceholder || "..................................."}
			</div>
		</div>
	);
});

ThermalReceiptLayout.displayName = "ThermalReceiptLayout";
export default ThermalReceiptLayout;
