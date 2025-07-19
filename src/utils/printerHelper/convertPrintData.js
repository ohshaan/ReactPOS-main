// src/utils/dataProcessor.js

/**
 * Transforms raw order item data into a hierarchical structure suitable for templates.
 * @param {Array<object>} rawItems - The flat list of items from the API.
 * @returns {Array<TemplateItem>} - Hierarchical list of items.
 */
function buildItemTree(rawItems) {
	const itemMap = new Map(); // To quickly find items by their original index/identifier
	const rootItems = [];

	// First pass: Create a map and identify potential root items
	// We need a stable identifier for parents. Let's assume 'slno' can be used or derive an index.
	// The provided data has 'slno' but it's not always sequential or unique for parent referencing.
	// 'orderdtlid' seems to be unique for each line item.
	// The 'orderdtlreferno' refers to the 0-based index of the parent in the *original flat list*.

	rawItems.forEach((rawItem, index) => {
		const templateItem = {
			qty: rawItem.orderdtlqtydesc || rawItem.orderqty || "1", // Prioritize orderdtlqtydesc
			name: rawItem.menudesc || rawItem.orderdtldesc || "Unknown Item",
			nameAr: rawItem.menuarabicname,
			// Amount in the image is on the item line, seems to be item's own rate, not total.
			// The example data's 'orderrate' seems to be the item price.
			amount: parseFloat(rawItem.orderrate || "0").toFixed(2),
			description:
				rawItem.categorydesc !== rawItem.menudesc
					? rawItem.categorydesc
					: undefined, // Use category as desc if different, or pass another field
			subItems: [],
			// Store original data for reference if needed, and its original index
			_originalIndex: index, // Store the original index from the flat list
			_originalOrderDtlId: rawItem.orderdtlid,
			_orderdtlreferno: parseInt(rawItem.orderdtlreferno, 10),
		};
		itemMap.set(index, templateItem); // Map by original index
	});

	// Second pass: Build the tree structure
	itemMap.forEach((item, index) => {
		if (item._orderdtlreferno === -1) {
			rootItems.push(item);
		} else {
			// The parent is identified by its original index in the rawItems list
			const parentItem = itemMap.get(item._orderdtlreferno);
			if (parentItem) {
				parentItem.subItems.push(item);
			} else {
				// Orphaned item, add as a root for now, or handle as an error
				console.warn(
					`Orphaned sub-item found, original index: ${index}, refers to parent index: ${item._orderdtlreferno}`
				);
				rootItems.push(item);
			}
		}
	});

	// Clean up temporary properties
	rootItems.forEach(function cleanup(item) {
		delete item._originalIndex;
		delete item._originalOrderDtlId;
		delete item._orderdtlreferno;
		if (item.subItems && item.subItems.length > 0) {
			item.subItems.forEach(cleanup);
		} else {
			delete item.subItems; // Remove empty subItems array for cleaner output
		}
	});

	return rootItems;
}

/**
 * Splits and processes order data by printer name.
 * @param {Array<object>} allOrderData - The raw flat list of all order items from the API.
 * @returns {Map<string, ChelokababTemplateData>} - A Map where keys are printer names
 *                                                  and values are the processed template data.
 */
export function processOrderDataForPrinting(allOrderData) {
	if (!allOrderData || allOrderData.length === 0) {
		return new Map();
	}

	const groupedByPrinter = new Map();

	// Group items by printername
	allOrderData.forEach((rawItem) => {
		const printerName = rawItem.printername || "Unknown Printer";
		if (!groupedByPrinter.has(printerName)) {
			groupedByPrinter.set(printerName, []);
		}
		groupedByPrinter.get(printerName).push(rawItem);
	});

	const processedDataByPrinter = new Map();

	groupedByPrinter.forEach((rawItemsForPrinter, printerName) => {
		// All items for a given printer will share header/footer info, take from the first
		const firstItem = rawItemsForPrinter[0];
		const deliveryDateTime = firstItem.orderdeliveryndate
			? new Date(firstItem.orderdeliveryndate)
			: new Date();

		const templateData = {
			// logoPath: set by printService.js
			storeName: firstItem.outletname || "TW KITCHEN", // Use outletname
			orderType:
				firstItem.ordertype === "2"
					? "Takeaway"
					: firstItem.ordertype === "1"
					? "Dine-In"
					: firstItem.ordertype === "4"
					? "Delivery"
					: firstItem.ordertype === "3"
					? "Advance order"
					: firstItem.ordertype === "6"
					? "Car Hop"
					: firstItem.ordertype === "7"
					? "Pick Up"
					: "Order", // Example mapping
			customerName: firstItem.ordercustomer,
			customerMobile: firstItem.customermobile || firstItem.ordercontactno, // Use customermobile or ordercontactno
			// Example: use header or detail notes for follow up
			deliveryTime:
				deliveryDateTime
					.toLocaleDateString("en-GB", {
						day: "2-digit",
						month: "short",
						year: "numeric",
					})
					.replace(/ /g, "-") +
				" " +
				deliveryDateTime.toLocaleTimeString("en-US", {
					hour: "numeric",
					minute: "2-digit",
					hour12: true,
				}),
			orderNumber: firstItem.orderreferenceno,
			orderDate: deliveryDateTime
				.toLocaleDateString("en-GB", {
					day: "2-digit",
					month: "short",
					year: "numeric",
				})
				.replace(/ /g, "-"),
			orderTime: deliveryDateTime.toLocaleTimeString("en-US", {
				hour: "numeric",
				minute: "2-digit",
				hour12: true,
			}),
			pax: firstItem.noofpersons,

			// Transform flat items to hierarchical tree
			items: buildItemTree(rawItemsForPrinter),

			// Calculate totalAmount from items (sum of orderrate * orderdtlqtydesc for root items)
			// This needs careful thought: is 'orderrate' the item price or line total?
			// Assuming 'orderrate' is unit price and 'orderdtlqtydesc' is qty.
			// The image shows 'amount' per line which seems to be rate * qty.
			// The 'orderamount' on each raw item is the *grand total* of the whole order.
			// The 'Total' in the image (90.00) is sum of displayed item amounts.
			totalAmount: rawItemsForPrinter
				.reduce((sum, item) => {
					// Only sum amounts of items that are displayed with a price (orderdtlreferno === -1 or specific logic)
					// And if their orderrate is not 0 (for main priced items)
					// if(item.orderdtlreferno === "-1" || parseFloat(item.orderrate) > 0) { // Or just sum all 'orderrate'
					return (
						sum +
						parseFloat(item.orderrate || "0") *
							parseFloat(item.orderdtlqtydesc || "1")
					);
					// }
					// return sum;
				}, 0)
				.toFixed(2),

			totalAmountArabic: "مجموع", // Static for now, or from data if available

			servedByLabel: "Sbl :", // As per image
			servedBy: firstItem.ordercreatedemployee,
			notes: firstItem.orderhdrnotes || firstItem.orderdtlnotes, // Use header notes, fallback to detail notes
			deliveryAddress: firstItem.customeraddress, // Assuming this is the formatted address
		};
		processedDataByPrinter.set(printerName, templateData);
	});

	return processedDataByPrinter;
}
