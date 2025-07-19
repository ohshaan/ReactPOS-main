// export function transformOrderDataToArray(inputData) {
// 	// --- Helper Data (Maps are optional and may be empty) ---
// 	const menuCodeMap = {};
// 	const subMenuNoMap = {};
// 	const toppingDescMap = {};
// 	const freeItemCountMap = {};
// 	const sortingOrderMap = {};

// 	// --- Helper Functions (parseParentToppings, parseCustomToppings - unchanged) ---
// 	function parseParentToppings(toppingsString) {
// 		if (!toppingsString || toppingsString.trim() === "") return undefined;
// 		const toppingIds = toppingsString.split(",");
// 		const toppings = toppingIds
// 			.map((idStr) => {
// 				const id = parseInt(idStr.trim());
// 				if (isNaN(id)) return null;
// 				return { topping_id: id, toping_name: toppingDescMap[id] || "" };
// 			})
// 			.filter((t) => t !== null);
// 		return toppings.length > 0 ? toppings : undefined;
// 	}

// 	function parseCustomToppings(toppingsString, packageid, packagedtlid) {
// 		if (!toppingsString || toppingsString.trim() === "") return undefined;
// 		const customItems = [];
// 		const toppingPairs = toppingsString.split(",");
// 		for (const pair of toppingPairs) {
// 			const [idStr, qtyStr] = pair.split("-");
// 			if (idStr && qtyStr) {
// 				const id = parseInt(idStr.trim());
// 				const qty = parseInt(qtyStr.trim());
// 				if (!isNaN(id) && !isNaN(qty)) {
// 					// Assuming custom items don't need their own unique orderdtlid from input
// 					// They are derived from the child item's toppings string
// 					customItems.push({
// 						packageid: parseInt(packageid),
// 						packagedtlid: parseInt(packagedtlid),
// 						customizemenuid: id,
// 						customizemenudesc: toppingDescMap[id] || "",
// 						customizemenuprice: "0.0000",
// 						qty: qty,
// 					});
// 				}
// 			}
// 		}
// 		return customItems.length > 0 ? customItems : undefined;
// 	}

// 	// --- Main Transformation Logic ---

// 	const outputArray = [];
// 	let currentKey = 1;
// 	const items = [...inputData];

// 	const parentItems = items.filter((item) => item.orderdtlreferenceno === "");
// 	const childItems = items.filter((item) => item.orderdtlreferenceno !== "");

// 	for (const parent of parentItems) {
// 		const outputItem = {
// 			key: currentKey++,
// 			orderdtlid: parent.orderdtlid, // Parent's orderdtlid
// 			menuid: parent.menuid,
// 			menucode: menuCodeMap[parent.menuid] || "",
// 			menuname: parent.menudesc,
// 			salesprice:
// 				parent.menurate % 1 === 0
// 					? parent.menurate.toFixed(0)
// 					: parent.menurate.toFixed(4),
// 			qty: parent.menuqty,
// 			amount: parent.menuamount.toFixed(0),
// 		};

// 		const parentToppings = parseParentToppings(parent.menutoppings);
// 		if (parentToppings) {
// 			outputItem.topping = parentToppings;
// 		}

// 		let isActualPackage = false;
// 		let associatedChildren = [];
// 		let packageIdForChildren = null;

// 		// Identify potential packages
// 		if (parent.menuid === 1799) {
// 			packageIdForChildren = "22";
// 			associatedChildren = childItems.filter(
// 				(child) => child.menupackageid === packageIdForChildren
// 			);
// 			if (associatedChildren.length > 0) {
// 				isActualPackage = true;
// 			}
// 		}

// 		if (isActualPackage) {
// 			outputItem.menupackageitem = 1;
// 			outputItem.packages = [];

// 			const groupedChildren = associatedChildren.reduce((acc, child) => {
// 				const key = child.menupackagedtlid;
// 				if (!acc[key]) {
// 					acc[key] = {
// 						packageid: child.menupackageid,
// 						packagedtlid: child.menupackagedtlid,
// 						packagesubmenu: child.packagesubmenu,
// 						items: [],
// 					};
// 				}
// 				acc[key].items.push(child);
// 				return acc;
// 			}, {});

// 			for (const packagedtlid in groupedChildren) {
// 				const group = groupedChildren[packagedtlid];
// 				const groupDtlId = parseInt(packagedtlid);
// 				if (isNaN(groupDtlId)) continue;

// 				const packageGroup = {
// 					menuid: parent.menuid,
// 					packageid: parseInt(group.packageid),
// 					freeitemcount:
// 						freeItemCountMap[groupDtlId] !== undefined
// 							? freeItemCountMap[groupDtlId]
// 							: 0,
// 					sortingorder:
// 						sortingOrderMap[groupDtlId] !== undefined
// 							? sortingOrderMap[groupDtlId]
// 							: 0,
// 					packagedtlid: groupDtlId,
// 					packagesubmenu: group.packagesubmenu,
// 					menudesc: parent.menudesc,
// 					packages: [], // This holds the sub-items (grandchildren)
// 				};

// 				// Process the actual child items (which become grandchildren in the output)
// 				for (const item of group.items) {
// 					const subMenuItem = {
// 						orderdtlid: item.orderdtlid, // <-- ADDED child's orderdtlid HERE
// 						packageid: parseInt(item.menupackageid),
// 						packagedtlid: parseInt(item.menupackagedtlid),
// 						submenuid: item.menuid,
// 						submenuno: subMenuNoMap[item.menuid] || "",
// 						submenudesc: item.menudesc,
// 						submenuprice: item.menurate.toFixed(4),
// 						submenuqty: item.menuqty,
// 						submenudefault: 1, // Assuming 1
// 						custom: parseCustomToppings(
// 							item.menutoppings,
// 							item.menupackageid,
// 							item.menupackagedtlid
// 						),
// 					};
// 					// Remove custom array if empty/undefined
// 					if (subMenuItem.custom === undefined) delete subMenuItem.custom;

// 					// Add the grandchild item to the current group's packages
// 					packageGroup.packages.push(subMenuItem);
// 				}

// 				// Only add the group if it has actual sub-items
// 				if (packageGroup.packages.length > 0) {
// 					outputItem.packages.push(packageGroup);
// 				}
// 			}

// 			// Add Missing Empty Groups (Hardcoded)
// 			if (parent.menuid === 1799) {
// 				const existingDtlIds = new Set(
// 					outputItem.packages.map((p) => p.packagedtlid)
// 				);
// 				const packageIdForParent = parseInt(packageIdForChildren);
// 				if (!existingDtlIds.has(2557)) {
// 					outputItem.packages.push({
// 						menuid: parent.menuid,
// 						packageid: packageIdForParent,
// 						freeitemcount:
// 							freeItemCountMap[2557] !== undefined ? freeItemCountMap[2557] : 0,
// 						sortingorder:
// 							sortingOrderMap[2557] !== undefined ? sortingOrderMap[2557] : 990,
// 						packagedtlid: 2557,
// 						packagesubmenu: "ADD ON SIDES AND CHICKEN",
// 						menudesc: parent.menudesc,
// 						packages: [],
// 					});
// 				}
// 				if (!existingDtlIds.has(2744)) {
// 					outputItem.packages.push({
// 						menuid: parent.menuid,
// 						packageid: packageIdForParent,
// 						freeitemcount:
// 							freeItemCountMap[2744] !== undefined ? freeItemCountMap[2744] : 0,
// 						sortingorder:
// 							sortingOrderMap[2744] !== undefined ? sortingOrderMap[2744] : 991,
// 						packagedtlid: 2744,
// 						packagesubmenu: "YOUR CHOICE OF DIPPING SAUCE",
// 						menudesc: parent.menudesc,
// 						packages: [],
// 					});
// 				}
// 			}

// 			// Sort the top-level packages array within the item
// 			outputItem.packages.sort((a, b) => {
// 				const orderA =
// 					sortingOrderMap[a.packagedtlid] !== undefined
// 						? sortingOrderMap[a.packagedtlid]
// 						: 999;
// 				const orderB =
// 					sortingOrderMap[b.packagedtlid] !== undefined
// 						? sortingOrderMap[b.packagedtlid]
// 						: 999;
// 				return orderA === orderB
// 					? a.packagedtlid - b.packagedtlid
// 					: orderA - orderB;
// 			});

// 			// Reset sorting order field for hardcoded groups if necessary
// 			outputItem.packages.forEach((pkg) => {
// 				if (
// 					pkg.packagedtlid === 2557 &&
// 					pkg.sortingorder === 990 &&
// 					sortingOrderMap[2557] === undefined
// 				)
// 					pkg.sortingorder = 0;
// 				if (
// 					pkg.packagedtlid === 2744 &&
// 					pkg.sortingorder === 991 &&
// 					sortingOrderMap[2744] === undefined
// 				)
// 					pkg.sortingorder = 0;
// 			});

// 			// Remove packages property if it ended up empty
// 			if (outputItem.packages.length === 0) {
// 				delete outputItem.packages;
// 				outputItem.menupackageitem = 0;
// 			}
// 		} else {
// 			// Standalone item
// 			outputItem.menupackageitem = 0;
// 		}

// 		outputArray.push(outputItem);
// 	} // End loop through parent items

// 	return outputArray;
// }
export function transformOrderDataToArray_ByIndex(inputData) {
	// --- Helper Data (Maps are optional - populate if needed) ---
	const menuCodeMap = {};
	const subMenuNoMap = {};
	const freeItemCountMap = {}; // Example: { 2557: 1, 1328: 0 }
	const sortingOrderMap = {}; // Example: { 1328: 10, 1329: 20, 2557: 990 }

	// --- Helper Functions (largely unchanged) ---
	function parseParentToppings(toppingsString, toppingsDescString) {
		if (!toppingsString || toppingsString.trim() === "") return undefined;
		const toppingIds = toppingsString.split(",");
		const toppingDescs = toppingsDescString
			? toppingsDescString.split(",")
			: [];

		if (toppingsDescString && toppingIds.length !== toppingDescs.length) {
			console.warn(
				"Mismatch between parent topping IDs and descriptions.",
				`IDs: "${toppingsString}"`,
				`Descs: "${toppingsDescString}"`
			);
		}

		const toppings = toppingIds
			.map((idStr, index) => {
				const id = parseInt(idStr.trim());
				if (isNaN(id)) return null;
				const desc = (toppingDescs[index] || "").trim();
				return { topping_id: id, toping_name: desc };
			})
			.filter((t) => t !== null);
		return toppings.length > 0 ? toppings : undefined;
	}

	function parseCustomToppings(
		toppingsString,
		toppingsDescString,
		packageid,
		packagedtlid
	) {
		if (!toppingsString || toppingsString.trim() === "") return undefined;
		const customItems = [];
		const toppingPairs = toppingsString.split(",");
		const toppingDescs = toppingsDescString
			? toppingsDescString.split(",")
			: [];

		if (toppingsDescString && toppingPairs.length !== toppingDescs.length) {
			console.warn(
				"Mismatch between custom topping pairs and descriptions.",
				`Pairs: "${toppingsString}"`,
				`Descs: "${toppingsDescString}"`
			);
		}

		for (let i = 0; i < toppingPairs.length; i++) {
			const pair = toppingPairs[i];
			const [idStr, qtyStr] = pair.split("-");
			if (idStr && qtyStr) {
				const id = parseInt(idStr.trim());
				const qty = parseInt(qtyStr.trim());
				if (!isNaN(id) && !isNaN(qty)) {
					const desc = (toppingDescs[i] || "").trim();
					customItems.push({
						packageid: parseInt(packageid),
						packagedtlid: parseInt(packagedtlid),
						customizemenuid: id,
						customizemenudesc: desc,
						customizemenuprice: "0.0000",
						qty: qty,
					});
				}
			}
		}
		return customItems.length > 0 ? customItems : undefined;
	}

	// --- Main Transformation Logic ---
	const outputArray = [];
	let currentKey = 1;
	const items = [...inputData]; // Use a copy

	items.forEach((parentCandidate, parentIndex) => {
		// Rule 1: An item is a parent if its orderdtlreferenceno is ""
		if (parentCandidate.orderdtlreferenceno === "") {
			const parent = parentCandidate;
			const parentIndexStr = String(parentIndex);

			const outputItem = {
				key: currentKey++,
				orderdtlid: parent.orderdtlid,
				menuid: parent.menuid,
				menucode: menuCodeMap[parent.menuid] || "",
				menuname: parent.menudesc,
				salesprice:
					parent.menurate % 1 === 0
						? parent.menurate.toFixed(0)
						: parent.menurate.toFixed(4),
				qty: parent.menuqty,
				amount: parent.menuamount.toFixed(2),
			};

			const parentToppings = parseParentToppings(
				parent.menutoppings,
				parent.toppingsdesc
			);
			if (parentToppings) {
				outputItem.topping = parentToppings;
			}

			// Rule 2: Find children whose orderdtlreferenceno matches the parent's index (as string)
			const associatedChildren = items.filter(
				(childCandidate, childIndex) =>
					parentIndex !== childIndex && // Ensure it's not the parent itself
					String(childCandidate.orderdtlreferenceno) === parentIndexStr
			);

			if (associatedChildren.length > 0) {
				outputItem.menupackageitem = 1;
				outputItem.packages = [];

				// Determine the package ID from the first child (assuming consistency among siblings)
				const firstChildPackageIdStr = associatedChildren[0]?.menupackageid;

				if (
					!firstChildPackageIdStr ||
					String(firstChildPackageIdStr).trim() === ""
				) {
					console.warn(
						`Parent item ${parent.orderdtlid} ("${parent.menudesc}") at index ${parentIndexStr} has children, but these children lack a 'menupackageid'. Treating parent as non-package.`
					);
					outputItem.menupackageitem = 0;
					delete outputItem.packages; // Clean up
				} else {
					const parentPackageIdNum = parseInt(firstChildPackageIdStr);
					if (isNaN(parentPackageIdNum)) {
						console.warn(
							`Parent item ${parent.orderdtlid} ("${parent.menudesc}") at index ${parentIndexStr} has children with an invalid 'menupackageid': "${firstChildPackageIdStr}". Treating parent as non-package.`
						);
						outputItem.menupackageitem = 0;
						delete outputItem.packages; // Clean up
					} else {
						// Group children by their menupackagedtlid
						const groupedChildren = associatedChildren.reduce((acc, child) => {
							if (
								String(child.menupackageid) !== String(firstChildPackageIdStr)
							) {
								console.warn(
									`Child item ${child.orderdtlid} ('menupackageid': ${child.menupackageid}) does not match expected package ID ${firstChildPackageIdStr} for parent at index ${parentIndexStr}. Skipping this child for this package group.`
								);
								return acc;
							}
							const groupKey = String(child.menupackagedtlid);
							if (!acc[groupKey]) {
								acc[groupKey] = {
									packagesubmenu: child.packagesubmenu,
									items: [],
								};
							}
							acc[groupKey].items.push(child);
							return acc;
						}, {});

						for (const packagedtlidStr in groupedChildren) {
							const groupData = groupedChildren[packagedtlidStr];
							const groupDtlId = parseInt(packagedtlidStr);

							if (isNaN(groupDtlId)) {
								// Handles non-numeric strings, including empty
								console.warn(
									`Invalid packagedtlid found: "${packagedtlidStr}" for parent at index ${parentIndexStr}. Skipping this group.`
								);
								continue;
							}

							const packageGroup = {
								menuid: parent.menuid,
								packageid: parentPackageIdNum, // Use the ID derived from children
								freeitemcount:
									freeItemCountMap[groupDtlId] !== undefined
										? freeItemCountMap[groupDtlId]
										: 0,
								sortingorder:
									sortingOrderMap[groupDtlId] !== undefined
										? sortingOrderMap[groupDtlId]
										: 0,
								packagedtlid: groupDtlId,
								packagesubmenu: groupData.packagesubmenu,
								packageprice: parent.menurate,
								menudesc: parent.menudesc,
								packages: [],
							};

							for (const item of groupData.items) {
								const subMenuItem = {
									orderdtlid: item.orderdtlid,
									packageid: parseInt(item.menupackageid), // Child's own packageid
									packagedtlid: parseInt(item.menupackagedtlid), // Child's own packagedtlid
									submenuid: item.menuid,
									submenuno: subMenuNoMap[item.menuid] || "",
									submenudesc: item.menudesc,
									submenuprice: item.menurate.toFixed(4),
									submenuqty: item.menuqty,
									submenudefault: 1,
									custom: parseCustomToppings(
										item.menutoppings,
										item.toppingsdesc,
										item.menupackageid,
										item.menupackagedtlid
									),
								};
								if (subMenuItem.custom === undefined) delete subMenuItem.custom;
								packageGroup.packages.push(subMenuItem);
							}
							if (packageGroup.packages.length > 0) {
								outputItem.packages.push(packageGroup);
							}
						}

						// --- Conditional Hardcoded Logic for specific package (e.g., menuid 1799, packageid 22) ---
						// This logic still depends on the parent's menuid and the determined packageId from children
						if (parent.menuid === 1799 && parentPackageIdNum === 22) {
							const existingDtlIds = new Set(
								outputItem.packages.map((p) => p.packagedtlid)
							);
							if (!existingDtlIds.has(2557)) {
								outputItem.packages.push({
									menuid: parent.menuid,
									packageid: parentPackageIdNum,
									freeitemcount:
										freeItemCountMap[2557] !== undefined
											? freeItemCountMap[2557]
											: 0,
									sortingorder:
										sortingOrderMap[2557] !== undefined
											? sortingOrderMap[2557]
											: 990,
									packagedtlid: 2557,
									packagesubmenu: "ADD ON SIDES AND CHICKEN",
									menudesc: parent.menudesc,
									packages: [],
								});
							}
							if (!existingDtlIds.has(2744)) {
								outputItem.packages.push({
									menuid: parent.menuid,
									packageid: parentPackageIdNum,
									freeitemcount:
										freeItemCountMap[2744] !== undefined
											? freeItemCountMap[2744]
											: 0,
									sortingorder:
										sortingOrderMap[2744] !== undefined
											? sortingOrderMap[2744]
											: 991,
									packagedtlid: 2744,
									packagesubmenu: "YOUR CHOICE OF DIPPING SAUCE",
									menudesc: parent.menudesc,
									packages: [],
								});
							}
						}

						outputItem.packages.sort((a, b) => {
							const orderA = a.sortingorder;
							const orderB = b.sortingorder;
							return orderA === orderB
								? a.packagedtlid - b.packagedtlid
								: orderA - orderB;
						});

						if (parent.menuid === 1799 && parentPackageIdNum === 22) {
							outputItem.packages.forEach((pkg) => {
								if (
									pkg.packagedtlid === 2557 &&
									pkg.sortingorder === 990 &&
									sortingOrderMap[2557] === undefined
								) {
									pkg.sortingorder = 0;
								}
								if (
									pkg.packagedtlid === 2744 &&
									pkg.sortingorder === 991 &&
									sortingOrderMap[2744] === undefined
								) {
									pkg.sortingorder = 0;
								}
							});
						}

						if (outputItem.packages.length === 0) {
							delete outputItem.packages;
							outputItem.menupackageitem = 0;
						}
					}
				}
			} else {
				// Parent has no children referencing its index
				outputItem.menupackageitem = 0;
			}
			outputArray.push(outputItem);
		}
		// If parentCandidate.orderdtlreferenceno !== "", it's a child or an item not following parent rules.
		// These items are only processed if they are picked up by a parent.
		// Standalone items with non-empty orderdtlreferenceno won't be added to outputArray unless linked.
	});
	return outputArray;
}
