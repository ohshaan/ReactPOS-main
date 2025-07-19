// Example API request body
export const sampleData = {
	printerName: "Your_Thermal_Printer_Name",
	templateType: "GO_CRISPY_THERMAL",
	templateData: {
		logoPath: "/path/to/your/fixed/logo.png",
		storeName: "GO CRISPY GHARAFA",
		tel: "12345678",
		telArabic: "الهاتف",
		fax: "87654321",
		faxArabic: "الفاكس",
		date: "23-Jun-2025",
		time: "12:44 pm",
		billNo: "Sample Invoice",
		pax: 1,
		kotNo: "GOCG/KOT2500223(9:44AM)",
		deliveryDateTime: "23-Jun-2025 9:44 am",
		customerName: "basheer",
		customerMobile: "9851231",
		// "numberedLines": ["1", "2", "3", "4", "5"], // Optional, if you use them
		// "deliverySectionTitle": "*** Delivery ***", // Optional
		items: [
			{ qty: 2, name: "APPLE JUICEeee", nameAr: "عصير تفاح", amount: 6.0 },
			{ qty: 1, name: "BLUEBERRY JUICE.", nameAr: "عصير توت", amount: 3.0 },
			{
				qty: 1,
				name: "GO MOJITO STAWBERRY",
				nameAr: "جو موهيتو ستروبيري",
				amount: 12.0,
			},
			{ qty: 1, name: "MINERAL WATERrrr", nameAr: "مياه معدنية", amount: 3.0 },
			{
				name: "GO 11ee",
				nameAr: "جو ١١",
				qty: 1,
				amount: 97.0,
				subItems: [
					{
						name: "11 PC CHICKEN NORMAL.",
						nameAr: "11 PC CHICKEN NORMAL.",
						qty: 1,
						amount: 0.0,
					},
					{
						name: "CHEESY FRIES",
						nameAr: "بطاطا بالجبن",
						qty: 3,
						amount: 21.0,
					}, // This has a price, so it's a priced sub-item/add-on
					{
						name: "FRENCH FRIES FAMILY",
						nameAr: "بطاطا مقلية حجم عائلي",
						qty: 1,
						amount: 0.0,
					},
				],
			},
			{
				qty: 4,
				name: "CHOCOLATE CHIPS COOKIES",
				nameAr: "شوكلت كوكيز",
				amount: 20.0,
			},
		],
		totalAmount: 162.0, // (6+3+12+3+97+21+20 = 162)
		totalAmountArabic: "مجموع",
		deliveryCharge: 6.0,
		deliveryChargeArabic: "رسوم التوصيل",
		netAmount: 168.0, // (162 + 6)
		netAmountArabic: "المبلغ الإجمالي",
		thankYouMessage: "**THANK YOU FOR DINING WITH US **",
		commentsLabel: "Comments.......................................",
		signLabel: "Sign..........................................",
	},
	printerOptions: { characterSet: "UTF_8" },
};
