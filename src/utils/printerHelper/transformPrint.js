export function transformOrderData(data) {
	if (!data || data.length === 0) {
		return [];
	}

	// Group data by printername
	const groupedByPrinter = data.reduce((acc, item) => {
		const printerName = item.printername;
		if (!acc[printerName]) {
			acc[printerName] = [];
		}
		acc[printerName].push(item);
		return acc;
	}, {});

	const result = [];

	for (const printerName in groupedByPrinter) {
		const itemsForPrinter = groupedByPrinter[printerName];
		if (itemsForPrinter.length === 0) continue;

		const firstItem = itemsForPrinter[0]; // Use first item for common header details

		const printerOutput = {
			Koh_VehicleNo_V: firstItem.Koh_VehicleNo_V,
			Koh_PickUpReferNo_V: firstItem.Koh_PickUpReferNo_V,
			Koh_VoidNotes_V: firstItem.Koh_VoidNotes_V,
			// Kod_Notes_V is item specific, will be in menu. Here we can take overall Koh_Notes_V
			Koh_Order_Notes_V: firstItem.Koh_Notes_V, // Renamed to avoid confusion with item Kod_Notes_V
			Koh_ContactNo_V: firstItem.Koh_ContactNo_V,
			Cus_Address: firstItem.Cus_Address,
			Koh_KOTCreatedDtl_V: firstItem.Koh_KOTCreatedDtl_V,
			Koh_Status_N: firstItem.Koh_Status_N,
			Koh_DeliveryReq_N: firstItem.Koh_DeliveryReq_N,
			Koh_DeliveryDate_D: firstItem.Koh_DeliveryDate_D,
			Cus_Mobile_V: firstItem.Cus_Mobile_V,
			Koh_Type_N: firstItem.Koh_Type_N,
			Koh_NoOfPersons_N: firstItem.Koh_NoOfPersons_N,
			Koh_Customer_V: firstItem.Koh_Customer_V,
			Koh_ReferNo_V: firstItem.Koh_ReferNo_V,
			// Kod_Desc_V is item specific, will be in menu.
			Koh_TableCode_V: firstItem.Koh_TableCode_V,
			printername: printerName,
			Koh_ID_N: firstItem.Koh_ID_N,
			Koh_Amount_N_OrderLevel: firstItem.Koh_Amount_N, // Order level amount
			menu: [],
		};

		let currentParentMenuEntry = null;

		itemsForPrinter.forEach((item) => {
			// Common fields for any menu item (parent or child)
			const menuItemFields = {
				Ctg_Desc_V: item.Ctg_Desc_V,
				Kod_ReferNo_V: item.Kod_ReferNo_V, // This is crucial for parent/child logic
				Ctg_ID_N: item.Ctg_ID_N,
				// Koh_Amount_N is generally an order-level total.
				// If there's an item-specific price, it should be used. Assuming Kod_Amount_N might exist or use Koh for now.
				Item_Amount_N: item.Koh_Amount_N, // Placeholder, assuming this is the best available price context for an item
				Kod_Desc_V: item.Kod_Desc_V, // This is Stm_SalesDesc_V or Kod_Desc_V based on requirement
				Kod_QtyDes_N: item.Kod_QtyDes_N,
				Kod_Notes_V: item.Kod_Notes_V,
				Stm_ASalesDesc_V: item.Stm_ASalesDesc_V,
				Stm_SalesDesc_V: item.Stm_SalesDesc_V,
				SlNo_V: item.SlNo, // Keep SlNo for reference if needed, not in requested output but useful for debugging
			};

			if (item.Kod_ReferNo_V === "-1") {
				// This is a parent item
				currentParentMenuEntry = {
					...menuItemFields,
					children: [],
				};
				printerOutput.menu.push(currentParentMenuEntry);
			} else if (item.Kod_ReferNo_V === "0" && currentParentMenuEntry) {
				// This is a child item, and it's consecutive to the last parent (-1)
				// Add to the children of the current parent
				currentParentMenuEntry.children.push(menuItemFields);
			} else {
				// This item is not a direct child of the immediately preceding "-1" parent via "0" rule.
				// Or it's a child whose Kod_ReferNo_V points to a specific parent SlNo (more complex)
				// For the stated rule "children who has 0 all the menu that has 0 consecutive to the -1",
				// these items will be treated as new "top-level" entries in the menu.
				// They will appear as parent-like entries without children *by this specific rule*.

				// Example: GO WRAP SANDWICH NORMAL has Kod_ReferNo_V: "13". It doesn't follow "-1" then "0".
				// So, it becomes a top-level menu item here.
				const standaloneMenuEntry = {
					...menuItemFields,
					children: [], // Per structure, even "standalone" items get a children array.
				};
				printerOutput.menu.push(standaloneMenuEntry);
				currentParentMenuEntry = null; // Reset current parent, as this item broke the consecutive sequence
			}
		});
		result.push(printerOutput);
	}

	return result;
}
