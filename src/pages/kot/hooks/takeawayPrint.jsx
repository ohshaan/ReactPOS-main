import React from "react";
import { useTranslation } from "react-i18next";

import {
	Printer,
	Text,
	Row,
	Line,
	Br,
	Cut,
	Barcode,
} from "react-thermal-printer"; // Added Barcode for completeness based on docs

const useThermalReceiptLayout = (receiptData) => {
	// Only proceed if receiptData is provided
	if (!receiptData) {
		return null; // Return null if no data, so the consuming component can handle it
	}

	// Destructure data for easier access
	const {
		storeName,
		orderType,
		customerName,
		mobileNo,
		deliveryTime,
		orderNo,
		date,
		time,
		pax,
		items,
		servedBy,
		notes,
	} = receiptData;

	const { t } = useTranslation();

	// The layout JSX using react-thermal-printer components
	const receiptLayoutJsx = (
		<Printer
			type="epson"
			width={42}
			characterSet="pc437_usa"
		>
			<Text align="center" bold size={{ width: 2, height: 2 }}>
				{storeName}
			</Text>
			<Text align="center">*** {orderType} ***</Text>
			<Br />

			<Text>{t("RECEIPT.CUSTOMER")} : {customerName}</Text>
			<Text>{t("RECEIPT.MOBILE_NO")} : {mobileNo}</Text>
			<Text>{t("RECEIPT.DELIVERY_TIME")} : {deliveryTime}</Text>
			<Br />

			<Text bold size={{ width: 2, height: 1 }}>
				{t("RECEIPT.ORDER_NO")} : {orderNo}
			</Text>
			<Br />

			<Row
				left={`${t("RECEIPT.DATE")} : ${date} ${time}`}
				right={`${t("RECEIPT.PAX")} : ${
					pax !== undefined && pax !== null ? pax.toFixed(2) : "N/A"
				}`}
			/>
			<Line character="-" />

			{/* Header Row for items */}
			<Row
				left={<Text bold>{t("RECEIPT.QTY")}</Text>}
				right={<Text bold>{t("RECEIPT.MENU")}</Text>}
			/>
			<Text>{t("RECEIPT.ADDON")}</Text>
			<Line character="." />

			{items.map((item, index) => (
				<React.Fragment key={index}>
					<Row
						left={
							<Text bold size={{ width: 1, height: 1 }}>
								{item.qty}
							</Text>
						}
						right={
							<Text bold size={{ width: 1, height: 1 }}>
								{item.name}
							</Text>
						}
					/>
					{index < items.length - 1 && <Line character="." />}
				</React.Fragment>
			))}
			<Line character="-" />
			<Br />

			<Text>
				{t("RECEIPT.SERVED_BY")} : {servedBy.id} - {servedBy.name}
			</Text>
			{servedBy.secondaryName && <Text>{servedBy.secondaryName}</Text>}

			<Text bold>{t("RECEIPT.NOTES")}</Text>
			<Text bold>{notes}</Text>
			<Line character="=" />
			{/* <Barcode type="CODE39" content="YOUR-BARCODE-DATA" align="center" /> */}
			<Cut />
		</Printer>
	);

	return receiptLayoutJsx;
};

export default useThermalReceiptLayout;
