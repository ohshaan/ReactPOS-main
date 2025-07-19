import moment from "moment";
/**
 * Transforms raw order items into the structured payload.
 *
 * @param {Object[]} items - Array of raw order detail objects.
 * @param {Object} headerDefaults - Object containing default header fields.
 * @returns {Object} - Payload ready for API.
 */
function transformOrder(items, headerDefaults) {
	// Calculate gross amount
	const grossamount = items.reduce((sum, it) => sum + it.menuamount, 0);

	// Map items to order_details
	const order_details = items.map((it) => {
		const isPackage = it.menupackagedtlid && it.menupackagedtlid !== "0";
		const base = {
			menuid: it.menuid,
			menudesc: it.menudesc,
			notes: it.orderdtlnotes || "",
			userid: headerDefaults.userid,
			toppingrate: it.toppingrate,
			salesprice: it.menuamount,
		};

		if (isPackage) {
			return {
				...base,
				orderqty: it.menuqty,
				orderrate: it.menurate.toFixed(4),
				orderdtlreferno: it.orderdtlreferenceno,
				menupackagedtlid: parseInt(it.menupackagedtlid, 10),
			};
		} else {
			return {
				...base,
				orderhdrid: headerDefaults.orderhdrid,
				orderdtlid: headerDefaults.orderhdrid,
				orderqty: String(it.menuqty),
				orderrate: it.menurate,
				toppings: "",
			};
		}
	});

	return {
		...headerDefaults,
		grossamount,
		netamount: 0,
		order_details,
	};
}

/**
 * Reconstructs the original mainData format from order_details array.
 *
 * @param {Object[]} order_details - Array of order detail entries.
 * @returns {Object[]} - Rebuilt mainData suitable for getOrderDetails.
 */
function reverseOrderDetails(order_details) {
	const mainData = [];

	order_details.forEach((detail) => {
		const ref = detail.orderdtlreferno;

		if (ref === undefined || ref === null || ref === "") {
			// Main item without a reference
			mainData.push({
				menuid: detail.menuid,
				qty: Number(detail.orderqty),
				salesprice: Number(detail.orderrate),
				menuname: detail.menudesc,
				topping: detail.toppings
					? detail.toppings.split(",").map((id) => ({ topping_id: id }))
					: [],
				packages: [],
			});
		} else {
			// Submenu item; find parent by index
			const parentIndex = Number(ref);
			const parent = mainData[parentIndex];
			if (!parent) return;

			// Initialize package container if missing
			if (!parent.packages.length) {
				parent.packages.push({ packages: [] });
			}

			// Append submenu under first package
			parent.packages[0].packages.push({
				submenuid: detail.menuid,
				submenuqty: Number(detail.orderqty),
				submenuprice: Number(detail.orderrate),
				submenudesc: detail.menudesc,
				packagedtlid: detail.menupackagedtlid,
				custom: detail.toppings
					? detail.toppings.split(",").map((t) => {
							const [customizemenuid, qty] = t.split("-");
							return { customizemenuid, qty: Number(qty) };
					  })
					: [],
			});
		}
	});
	//console.log("maindata --", mainData);
	const keyData = mainData.map((data, index) => ({
		...data,
		key: index + 1,
	}));
	//console.log("key data -- ", keyData);
	return keyData;
}

function extractHeaderDefaults(items) {
	const outletDetails = JSON.parse(localStorage.getItem("outletDetails"));
	const userDetails = JSON.parse(localStorage.getItem("user"));

	const first = items[0] || {};
	return {
		orderhdrid: first?.orderhdrid || 0,
		orderrefno: first?.orderreferenceno || "",
		ordertype: first?.ordertype || 0,
		customerid: first?.customerid || 0,
		customername: first?.customername || "",
		mobileno: first?.mobileno || "",
		orderstatus: first?.orderstatus || "",
		ordertablecode: first?.ordertablecode || "",
		outletid: Number(outletDetails?.outlet),
		companyid: outletDetails?.company,
		tableid: 0,
		userid: Number(userDetails?.userid),
		employeeid: Number(userDetails?.employeeid),
		pax: 0,
		discountamount: 0,
		bookingdate: moment().format("YYYY-MM-DDTHH:mm:ss"),
		mode: "INSERT",
		advanceamount: 0,
		advancecardamount: 0,
		advancecashamount: 0,
		bookingno: 0,
		ordernotes: "",
		cardtype: 0,
		deliverydate: null,
		fireorderdate: null,
		kotfireorderreq: 0,
		deliveryreq: 0,
		ordervehicleno: "",
		pickupreferno: "",
		ledgerid: 0,
		customeraddress: "",
	};
}

export function getRefactorData(items) {
	const headerData = extractHeaderDefaults(items);

	const transformOrderData = transformOrder(items, headerData);

	const orderDetails = reverseOrderDetails(
		transformOrderData?.order_details || []
	);

	return orderDetails;
}

export function getTotalAmtView(items) {
	const total = items.reduce((sum, item) => sum + (item.menuamount || 0), 0);
	return total;
}
