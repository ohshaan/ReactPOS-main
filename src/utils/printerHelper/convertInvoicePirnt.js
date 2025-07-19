// src/utils/invoicePrintUtils.js (or add to existing printUtils.js)

import moment from "moment";

/**
 * @typedef {object} RawInvoiceItemFromAPI
 * @property {string} menudesc
 * @property {string} menuarabicdesc
 * @property {string} invoiceqty
 * @property {string} invunitprice
 * @property {string} invoiceamount // This seems to be qty * unitprice
 * @property {string} orderdtlnotes
 * // Header/Footer level fields (repeated in each item, take from first)
 * @property {string} ordercreatedemployee
 * @property {string} invoicehdrid
 * @property {string} orderclosedbyuser
 * @property {string} invoicereferid
 * @property {string} orderreferenceno // KOT No
 * @property {string} ordercreatedon
 * @property {string} invoiceregisterdate // Invoice Date/Time
 * @property {string} invoicepostdiscountper
 * @property {string} invdiscountamount // Item level discount
 * @property {string} invoicedeliverycharge
 * @property {string} invoicegrossamount // Gross amount for the whole invoice
 * @property {string} invoicelpodetails
 * @property {string} ledgername // Payment method like "Snoonu"
 * @property {string} customerzone
 * @property {string} customerunit
 * @property {string} customerlandmark
 * @property {string} customerbuildingno
 * @property {string} customerstreet
 * @property {string} ordercontractno // Customer Mobile
 * @property {string} pax
 * @property {string} orderdeliverydate
 * @property {string} customername
 * @property {string} ppdpaymenttypeid
 * @property {string} pydamountpaid
 * @property {string} pydbalance
 * @property {string} ppdcardno2
 * @property {string} ppdcardamount2
 * @property {string} ppdcardtype2desc
 * @property {string} ppdvouchernodesc
 * // Add all other fields from your raw data
 * @property {any} [key: string]
 */

/**
 * @typedef {object} InvoiceTemplateItem
 * @property {string|number} qty
 * @property {string} name
 * @property {string} [nameAr]
 * @property {string|number} unitPrice // Price per unit
 * @property {string|number} amount    // Total for this line (qty * unitPrice)
 * @property {string} [notes]
 */

/**
 * @typedef {object} DetailedInvoiceTemplateData
 * @property {string} [logoPath]
 * @property {string} storeName // Not directly in sample, assume fixed or from elsewhere
 * @property {string} orderType // Not directly in sample
 * @property {string} tel // Not in sample
 * @property {string} fax // Not in sample
 * @property {string} invoiceDate
 * @property {string} invoiceTime
 * @property {string} billNo // invoicereferid or invoicehdrid
 * @property {string|number} pax
 * @property {string} kotNo
 * @property {string} deliveryDateTime
 * @property {string} staffName // ordercreatedemployee or orderclosedbyuser
 * @property {string} customerName
 * @property {string} customerMobile
 * @property {InvoiceTemplateItem[]} items
 * @property {string|number} grossAmount // Sum of item invoiceamount before main discount
 * @property {string} [discountPercentage] // invoicepostdiscountper
 * @property {string|number} discountAmountTotal // Main discount on gross
 * @property {string|number} amountAfterDiscount
 * @property {string|number} deliveryCharge
 * @property {string|number} netAmount // Final amount to pay
 * @property {string|number} paidAmount // pydamountpaid
 * @property {string|number} balanceAmount // pydbalance
 * @property {Array<{method: string, amount: string|number, cardNo?: string}>} settlements
 * @property {string} [thankYouMessage]
 * @property {string} [invoiceLpoDetails] // From invoicelpodetails
 * @property {string} [deliveryAddress]
 * // Add other common fields used by the invoice template
 */

/**
 * Processes a flat list of raw invoice items into a structured object for the invoice template.
 * @param {RawInvoiceItemFromAPI[]} rawInvoiceItems - The flat list of all items for this invoice.
 * @returns {DetailedInvoiceTemplateData | null} - Processed data or null if input is invalid.
 */
export function processRawInvoiceData(rawInvoiceItems) {
	if (
		!rawInvoiceItems ||
		!Array.isArray(rawInvoiceItems) ||
		rawInvoiceItems.length === 0
	) {
		return null;
	}

	const firstItem = rawInvoiceItems[0]; // Common data is taken from the first item

	const items = rawInvoiceItems.map((raw) => ({
		qty: raw.invoiceqty || "1",
		name: raw.menudesc || "Unknown Item",
		nameAr: raw.menuarabicdesc,
		unitPrice: parseFloat(raw.invunitprice || "0").toFixed(2),
		amount: parseFloat(raw.invoiceamount || "0").toFixed(2), // This is item_line_total
		notes: raw.orderdtlnotes,
	}));

	// Calculate Gross Amount from item line totals
	const calculatedGrossAmount = items.reduce(
		(sum, item) => sum + parseFloat(item.amount),
		0
	);

	// Invoice date and time
	const invDateTime = firstItem.invoiceregisterdate
		? new Date(firstItem.invoiceregisterdate)
		: new Date();
	const invoiceDate = moment(invDateTime).format("DD-MMM-YYYY");
	const invoiceTime = moment(invDateTime).format("hh:mm a");
	// const invoiceTime = invDateTime.toLocaleTimeString("en-US", {
	// 	hour: "numeric",
	// 	minute: "2-digit",
	// 	hour12: true,
	// });

	// Delivery date and time
	// let deliveryDate = "";
	// let deliveryTime = "";
	// if (firstItem.orderdeliverydate) {
	// 	const [date, time, am] = firstItem.orderdeliverydate.split(" ");

	// 	// deliveryDate = moment(date).format("DD-MMM-YYYY");
	// 	deliveryTime = `${time} ${am}`;
	// }

	// Construct delivery address
	const addressParts = [
		firstItem?.customerstreet?.trim(),
		firstItem?.customerbuildingno?.trim(),
		firstItem?.customerunit?.trim(),
		firstItem?.customerlandmark?.trim(),
		firstItem?.customerzone?.trim(),
	].filter((part) => part && part.length > 0); // Filter out empty, null, undefined, or whitespace

	const deliveryAddress = addressParts;

	// Settlement details - this is a simplified mapping.
	// Your data has many ppd fields. You'll need to map them based on ppdpaymenttypeid.
	const settlements = [];
	if (parseFloat(firstItem.pydcardamount || "0") > 0) {
		settlements.push({
			method: firstItem.cardtypedesc || "Card",
			amount: parseFloat(firstItem.pydcardamount).toFixed(2),
			cardNo: firstItem.pydcardno,
		});
	}
	if (parseFloat(firstItem.pydcashamount || "0") > 0) {
		settlements.push({
			method: "Cash",
			amount: parseFloat(firstItem.pydcashamount).toFixed(2),
		});
	}
	// Add other payment types (voucher, cheque, staff, other) based on your logic and ppdpaymenttypeid
	if (parseFloat(firstItem.ppdvoucheramount || "0") > 0) {
		settlements.push({
			method: firstItem.ppdvouchernodesc || "Voucher",
			amount: parseFloat(firstItem.ppdvoucheramount).toFixed(2),
		});
	}
	if (parseFloat(firstItem.ppdothersettlementamount || "0") > 0) {
		settlements.push({
			method: firstItem.ppdothersettlementdesc || "Other settlement",
			amount: parseFloat(firstItem.ppdothersettlementamount).toFixed(2),
		});
	}

	// if()

	if (parseFloat(firstItem.ppdotherpaymentamount || "0") > 0) {
		settlements.push({
			method: firstItem.ppdotherpaymentdesc || "Other payement",
			amount: parseFloat(firstItem.ppdotherpaymentamount).toFixed(2),
		});
	}
	// if (parseFloat(firstItem.ppdothersettlementamount)) {
	// 	settlements.push({
	// 		method: firstItem.ppdothersettlementdesc || "Other settlement",
	// 		amount: parseFloat(firstItem.ppdothersettlementamount).toFixed(2),
	// 	});
	// }

	if (
		parseFloat(firstItem.pydamountpaid || "0") > 0 &&
		settlements.length === 0
	) {
		// Generic paid amount if no specific type is broken down above but pydamountpaid has a value
		settlements.push({
			method: firstItem.ledgername || "Paid",
			amount: parseFloat(firstItem.pydamountpaid).toFixed(2),
		});
	}

	// Main discount (invoicepostdiscountper is not a value in sample, invdiscountamount is item level)
	// Let's assume there's a main discount field for the whole invoice if it exists,
	// or sum item-level discounts. For now, using a placeholder.
	// This part needs clarification from your data's meaning of discount fields.
	// The sample shows invoicegrossamount (65) and invoicedeliverycharge (0).
	// Total amount for items seems to be invoicegrossamount.
	const totalDiscountAmount = rawInvoiceItems.reduce(
		(sum, item) => sum + parseFloat(item.invdiscountamount || "0"),
		0
	);
	const amountAfterDiscount = calculatedGrossAmount - totalDiscountAmount;
	const finalNetAmount =
		amountAfterDiscount + parseFloat(firstItem.invoicedeliverycharge || "0");

	return {
		// logoPath: will be set by printService
		storeName: firstItem.outletname || "STORE NAME", // This should come from config or a more global part of firstItem
		orderType: firstItem.orderbilltype, // Or derive from data if available
		currentdate:
			firstItem.currentdate || moment(new Date()).format("DD-MMM-YYY hh:mm a"),
		// tel: "Your Tel",
		// fax: "Your Fax",
		invoiceDate: invoiceDate,
		invoiceTime: invoiceTime,
		billNo: firstItem.invoiceno,
		pax: firstItem.pax || "1",
		kotNo: firstItem.orderreferenceno,
		deliveryDateTime: firstItem.orderdeliverydate,
		// deliveryTime: deliveryTime,
		staffName: firstItem.ordercreatedemployee, // or orderclosedbyuser
		customerName: firstItem.customername,
		customerMobile: firstItem.ordercontractno, // Use ordercontractno for mobile
		items: items,
		grossAmount: calculatedGrossAmount.toFixed(2),
		discountPercentage: firstItem.invoicepostdiscountper, // This is often a string like "5%"
		discountAmountTotal: totalDiscountAmount.toFixed(2), // Sum of item discounts, or a header-level discount field
		amountAfterDiscount: amountAfterDiscount.toFixed(2),
		deliveryCharge: parseFloat(firstItem.invoicedeliverycharge || "0").toFixed(
			2
		),
		netAmount: finalNetAmount.toFixed(2), // invoicegrossamount might already be net if no further charges/discounts
		paidAmount: parseFloat(firstItem.pydamountpaid || "0").toFixed(2),
		balanceAmount: parseFloat(firstItem.pydbalance || "0").toFixed(2),
		settlements: settlements,
		invoiceLpoDetails: firstItem.invoicelpodetails,
		deliveryAddress: deliveryAddress,
		total: parseFloat(firstItem.invoicegrossamount).toFixed(2),
		// netAmount: firstItem.invoicegrossamount,
		commentsLabel: "comments_________________________________________",
		signLabel: "Sign_________________________________________________",
		thankYouMessage: "** THANK YOU FOR DINING WITH US **", // Default
		close: "Close",
	};
}
