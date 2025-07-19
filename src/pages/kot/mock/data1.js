// mockData.js
export const mockReceiptData = {
	storeName: "TW KITCHEN",
	orderType: "TAKEAWAY",
	customerName: "sangeetha",
	mobileNo: "14521212",
	deliveryTime: "15-May-2025 9:21 am",
	orderNo: "TWK-KIT2501882",
	date: "15-May-2025",
	time: "9:21 am",
	pax: 1.0,
	items: [
		{ qty: 11, name: "subway bread" },
		{ qty: 12, name: "SPICY SOUSE" },
		{ qty: 15, name: "Robe spicy" },
	],
	servedBy: {
		id: "0465",
		name: "KARIM MOHAMED",
		secondaryName: "KAMAL MOHAMED",
	},
	notes: "ordering type takeaway",
};

export const noData = null; // To test the conditional logic
