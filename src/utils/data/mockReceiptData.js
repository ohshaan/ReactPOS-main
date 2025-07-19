// Example: mockReceiptData.js
export const mockReceiptData = {
	logoUrl: "URL_OR_BASE64_STRING_OF_YOUR_LOGO", // Replace with your actual logo
	restaurantName: "GO CRISPY GHARAFA",
	tel: "XXXXXXX", // Replace with actual Tel
	fax: "XXXXXXX", // Replace with actual Fax
	date: "23-Jun-2025",
	time: "12:44 pm",
	billType: "Sample Invoice",
	pax: "1",
	kotNumber: "GOCG/KOT2500223(9:44AM)",
	deliveryDateTime: "23-Jun-2025 9:44 am",
	customerName: "basheer",
	mobileNumber: "9851231",
	currency: "QAR",
	items: [
		{
			name: "APPLE JUICEeee",
			nameAr: "عصير تفاح",
			qty: 2,
			amount: 6.0,
			isPackageSubItem: false,
		},
		{
			name: "BLUEBERRY JUICE.",
			nameAr: "عصير توت",
			qty: 1,
			amount: 3.0,
			isPackageSubItem: false,
		},
		{
			name: "GO MOJITO STAWBERRY",
			nameAr: "جو موهيتو ستروبيري",
			qty: 1,
			amount: 12.0,
			isPackageSubItem: false,
		},
		{
			name: "MINERAL WATERrr",
			nameAr: "مياه معدنية",
			qty: 1,
			amount: 3.0,
			isPackageSubItem: false,
		},
		{
			name: "GO 11ee", // Main Package Item Name
			nameAr: "جو 11",
			qty: 1, // Qty of the main package
			amount: 97.0, // Price of the main package "container" or base
			isPackageSubItem: false,
			subItems: [
				// Sub-items selected within this package
				{
					name: "- 11 PC CHICKEN NORMAL.",
					nameAr: "11 PC CHICKEN NORMAL.",
					qty: 1,
					amount: 0.0,
					isPackageSubItem: true,
				},
				{
					name: "- CHEESY FRIES",
					nameAr: "بطاطا بالجبن",
					qty: 3,
					amount: 21.0,
					isPackageSubItem: true,
				},
				{
					name: "- FRENCH FRIES FAMILY",
					nameAr: "بطاطا مقلية حجم عائلي",
					qty: 1,
					amount: 0.0,
					isPackageSubItem: true,
				},
			],
		},
		{
			name: "CHOCOLATE CHIPS COOKIES",
			nameAr: "شوكلت كوكيز",
			qty: 4,
			amount: 20.0,
			isPackageSubItem: false,
		},
	],
	total: 162.0,
	deliveryCharge: 6.0,
	netAmount: 168.0,
	thankYouMessage: "**THANK YOU FOR DINING WITH US**",
	commentsLabel: "Comments",
	commentsPlaceholder:
		"........................................................",
	signLabel: "Sign",
	signPlaceholder:
		"............................................................",
};
