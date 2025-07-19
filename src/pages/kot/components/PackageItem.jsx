import { Modal, Spin } from "antd";
import { useTranslation } from "react-i18next";
import React, { useCallback, useEffect, useRef, useState } from "react"; // Added useCallback
import { SlideArrow } from "../../../components";
import { productModel } from "../../../plugins/models";
import Swal from "sweetalert2";
import { useDispatch } from "react-redux";
import { addDish, updateDishFull } from "../../../redux/slices/orderSlice";
import { formatRupees } from "../../../utils/helpers";
import {
	// selectConfig,
	selectConfigLs,
} from "../../../redux/selector/orderSlector";
import { toast } from "react-toastify";
import { useCustomItemCounter } from "../../../utils/helpers/summaryCount";

function calculateTotalFreeItemQuantity(packages, currentPkg, targetSubmenuid) {
	if (!packages) return 0;
	return packages.reduce((total, pkg) => {
		const isSameItem =
			pkg.submenuid === targetSubmenuid ||
			pkg.submenuid === currentPkg.submenuid ||
			(pkg.submenuname === currentPkg.submenuname &&
				pkg.submenuprice_base === currentPkg.submenuprice_base);
		if (isSameItem) {
			return total + (Number(pkg.submenuqty) || 0);
		}
		return total;
	}, 0);
}

// Helper function to handle quantity changes
function handleQuantityChange(
	key,
	currentQty,
	defaultQty,
	isFree,
	totalQtyAcrossInstances = 0
) {
	switch (key) {
		case "C":
			return defaultQty;
		case "<":
			return handleBackspace(currentQty, defaultQty, isFree);
		case "+":
			return handleIncrement(
				currentQty,
				defaultQty,
				isFree,
				totalQtyAcrossInstances
			);
		case "-":
			return handleDecrement(currentQty, defaultQty, isFree);
		default:
			if (isNumericKey(key)) {
				return handleNumericInput(
					key,
					currentQty,
					defaultQty,
					isFree,
					totalQtyAcrossInstances
				);
			}
			return currentQty;
	}
}

function handleBackspace(currentQty, defaultQty, isFree) {
	const qtyStr = currentQty.toString();
	if (qtyStr.length === 0) return currentQty;
	let newQty = Number(qtyStr.slice(0, -1)) || 0;
	if (isFree) return Math.max(1, Math.min(newQty, defaultQty));
	if (newQty === 0 && defaultQty > 0) return defaultQty;
	return Math.max(0, newQty);
}

function handleIncrement(
	currentQty,
	defaultQty,
	isFree,
	totalQtyAcrossInstances = 0
) {
	if (isFree) {
		const newTotalQty = totalQtyAcrossInstances - currentQty + (currentQty + 1);
		if (newTotalQty > defaultQty && defaultQty > 0) {
			const remaining = defaultQty - (totalQtyAcrossInstances - currentQty);
			toast.info(
				remaining <= 0
					? t("PACKAGE.ERROR_MAX_SELECTED", { max: defaultQty })
							: t("PACKAGE.ERROR_ADD_MORE", { remaining, total: defaultQty })
			);
			return currentQty;
		}
		return Math.min(currentQty + 1, defaultQty);
	}
	return Math.min(currentQty + 1, 999);
}

function handleDecrement(currentQty, defaultQty, isFree) {
	if (isFree) return Math.max(1, currentQty - 1);
	const newQty = Math.max(0, currentQty - 1);
	if (newQty === 0 && defaultQty > 0) return defaultQty;
	return newQty;
}

function handleNumericInput(
	key,
	currentQty,
	defaultQty,
	isFree,
	totalQtyAcrossInstances = 0
) {
	const typedNum = Number(key);
	if (isNaN(typedNum)) return currentQty;

	if (isFree) {
		const newTotalQty = totalQtyAcrossInstances - currentQty + typedNum;
		if (newTotalQty > defaultQty && defaultQty > 0) {
			const remaining = defaultQty - (totalQtyAcrossInstances - currentQty);
			if (remaining <= 0) {
				toast.info(t("PACKAGE.ERROR_MAX_SELECTED", { max: defaultQty }));

				return currentQty;
			}
			toast.info(t("PACKAGE.ERROR_ADD_MORE", { remaining, total: defaultQty }));

			return Math.min(typedNum, remaining);
		}
		if (typedNum < 1 && defaultQty > 0) return 1;
		return typedNum;
	}

	const qtyStr = currentQty.toString();
	let potentialNewQtyStr = currentQty === 0 && key !== "0" ? key : qtyStr + key;
	if (potentialNewQtyStr.startsWith("0") && potentialNewQtyStr.length > 1) {
		potentialNewQtyStr = potentialNewQtyStr.substring(1);
	}
	if (potentialNewQtyStr.length > 3 || Number(potentialNewQtyStr) > 999) {
		return currentQty;
	}
	let newQty = Number(potentialNewQtyStr);
	if (newQty === 0 && defaultQty > 0) return defaultQty;
	return Math.max(0, newQty);
}

function isNumericKey(key) {
	return /^\d$/.test(key);
}

function PackageItem({ setPackageItem, menuData, update, setUpdate }) {
	const [isModalOpen, setIsModalOpen] = useState(true);
	const { t } = useTranslation();
	const [currentIndex, setCurrentIndex] = useState(0);
	const [subMenu, setSubMenu] = useState([]);
	const [selectedMenu, setSelectedMenu] = useState(null);
	const [packageData, setPackageData] = useState([]);
	const [customizeData, setCustomizeData] = useState([]);
	const [loading, isLoading] = useState(false);
	const [loadingSm, isLoadingSm] = useState(false);
	const [activeQtyTarget, setActiveQtyTarget] = useState(null);
	const [title, setTitle] = useState({ name: "", price: "" });

	// State to hold the package item for which customizations are currently displayed/loaded
	const [customizationContextPackageItem, setCustomizationContextPackageItem] =
		useState(null);

	const totalPages = Math.ceil(subMenu?.length / 8);
	const listRef = useRef();
	const dispatch = useDispatch();
	// const config1 = useSelector(selectConfig);
	const config = selectConfigLs;
	const counts = useCustomItemCounter({
		data: subMenu,
		selectedPackageDtlId: selectedMenu?.packagedtlid,
	});

	useEffect(() => {
		if (update && menuData?.packages) {
			const initializedPackages = menuData.packages.map((pkgCategory) => ({
				...pkgCategory,
				packages: (pkgCategory.packages || []).map((pItem) => ({
					...pItem,
					submenuqty: pItem.submenuqty || pItem.submenudefault || 1,
					custom: (pItem.custom || []).map((cItem) => ({
						...cItem,
						qty: cItem.qty || 1,
					})),
				})),
			}));
			setSubMenu(initializedPackages);
		} else {
			getPackageMenu();
		}
	}, [update, menuData]);

	const handleCancel = () => {
		setIsModalOpen(false);
		setPackageItem(false);
		setUpdate(false);
		setActiveQtyTarget(null);
		setCustomizationContextPackageItem(null);
	};

	const getPackageMenu = () => {
		isLoading("get");
		productModel
			?.getPackageMenu({ menuid: menuData?.menuid })
			.then((data) => {
				if (data?.status === "true") {
					const initializedData = (data.data || []).map((pkgCategory) => ({
						...pkgCategory,
						packages: (pkgCategory.packages || []).map((pItem) => ({
							...pItem,
							submenuqty: pItem.submenuqty || pItem.submenudefault || 1,
							custom: (pItem.custom || []).map((cItem) => ({
								...cItem,
								qty: cItem.qty || 1,
							})),
						})),
					}));
					setSubMenu(initializedData);
				} else {
					Swal.fire({
						icon: "error",
						title: data?.Error?.Error_Msg || t("COMMON.ERROR"),
						text: t("PACKAGE.ERROR_FETCHING_MENU"),
					});
				}
				isLoading(false);
			})
			.catch((error) => {
				//console.log("error fetching package menu", error);
				Swal.fire({
					icon: "error",
					title: t("COMMON.ERROR"),
					text: t("PACKAGE.ERROR_FETCHING_MENU"),
				});
				isLoading(false);
			});
	};

	const getMenuCustomization = (packageItemForContext) => {
		// //console.log("🚀🚀🚀🚀🚀", packageItemForContext, selectedMenu);
		if (
			!packageItemForContext ||
			!packageItemForContext.submenuid ||
			!selectedMenu?.packagedtlid
		) {
			// //console.log(
			// 	"call customise item agian",
			// 	packageItemForContext,
			// 	selectedMenu
			// );
			// setCustomizeData([]);
			if (!packageItemForContext && customizationContextPackageItem) {
				setCustomizationContextPackageItem(null);
			}
			return;
		}

		if (
			customizationContextPackageItem?.submenuid ===
				packageItemForContext.submenuid &&
			customizationContextPackageItem?.packagedtlid ===
				selectedMenu.packagedtlid &&
			!update
		) {
			return;
		}

		isLoading("getCustome");
		setCustomizationContextPackageItem(packageItemForContext);

		productModel
			?.getPackageMenuCustomize({
				submenuid: packageItemForContext.submenuid,
				packagedtlid: packageItemForContext.packagedtlid,
			})
			.then((data) => {
				if (data?.status === "true") {
					// //console.log("♨️♨️♨️🖍️", data.data);
					setCustomizeData(
						(data.data || []).map((i) => ({ ...i, qty: i.defaultqty || 1 }))
					);
				} else {
					// //console.log("api call else failed");
					setCustomizeData([]);
				}
				isLoading(false);
			})
			.catch((error) => {
				//console.log(
				// 	"Error while getting custom menu for " +
				// 		packageItemForContext.submenudesc,
				// 	error
				// );
				// //console.log("api call catch");
				setCustomizeData([]);
				isLoading(false);
			});
	};

	const getPackageSubMenu = (categoryData) => {
		// isLoading(categoryData?.packagedtlid);
		isLoadingSm("subMenu");
		// //console.log("categoryData?.packagedtlid", categoryData);
		productModel
			?.getPackageSubMenu({
				menuid: menuData?.menuid,
				packagedtlid: categoryData?.packagedtlid,
			})
			.then((response) => {
				if (response?.status === "true") {
					const itemsWithQty = (response.data || []).map((item) => ({
						...item,
						submenuqty: item.submenuqty || 1, //todo if need change to default
					}));
					setPackageData(itemsWithQty);

					// After fetching package items for the category, determine the context for customizations.
					const currentCategoryInSubMenu = subMenu.find(
						(i) => i.packagedtlid === categoryData.packagedtlid
					);

					// //console.log({ currentCategoryInSubMenu });
					let itemForCustomizationContext =
						currentCategoryInSubMenu?.packages?.[0]; // First selected in current category

					// //console.log(
					// 	"itemForCustomizationContext",
					// 	itemForCustomizationContext
					// );

					if (!itemForCustomizationContext && itemsWithQty.length > 0) {
						itemForCustomizationContext = itemsWithQty[0]; // First available if none selected
					}

					if (itemForCustomizationContext) {
						// Check if this context is different from the current one to avoid redundant calls
						if (
							customizationContextPackageItem?.submenuid !==
								itemForCustomizationContext.submenuid ||
							customizationContextPackageItem?.packagedtlid !==
								categoryData.packagedtlid
						) {
							getMenuCustomization(itemForCustomizationContext);
						} else if (
							customizeData.length === 0 &&
							customizationContextPackageItem?.submenuid ===
								itemForCustomizationContext.submenuid
						) {
							// If context is same but customizeData is empty (e.g. after deselecting all custom items),
							// still might want to re-fetch. This condition can be refined.
							// For now, if context is the same, we assume customizeData is correctly populated or empty.
						}
					} else {
						//console.log("itemForCustomizationContext not Found");
						setCustomizeData([]);
						setCustomizationContextPackageItem(null);
					}
				} else {
					Swal.fire({
						icon: "error",
						title: response?.Error?.Error_Msg || t("COMMON.ERROR"),
						text: t("PACKAGE.ERROR_FETCHING_CATEGORY"),
					});
				}
				isLoadingSm(false);
			})
			.catch((error) => {
				//console.log("error fetching package sub-menu", error);
				Swal.fire({
					icon: "error",
					title: t("COMMON.ERROR"),
					text: t("PACKAGE.ERROR_FETCHING_CATEGORY"),
				});
				isLoadingSm(false);
			});
	};

	const onPackageMenuSelection = (categoryItem) => {
		setSelectedMenu(categoryItem);

		// Clear previous customizations and context if category changes significantly
		// //console.log("selectedMenu", selectedMenu, categoryItem);
		if (selectedMenu?.packagedtlid !== categoryItem.packagedtlid) {
			// //console.log("selecte menu adn pack item not matcth");
			setCustomizeData([]);
			setCustomizationContextPackageItem(null);
		}

		getPackageSubMenu(categoryItem);
		setActiveQtyTarget(null);
	};

	const handlePackageItemClick = (itemFromPackageData, isCurrentlySelected) => {
		const mainCategoryRef = selectedMenu;
		if (!mainCategoryRef) return;
		const isSingleSelectMode = mainCategoryRef.freeitemcount === 1;

		let itemToBecomeContext = itemFromPackageData;

		if (isSingleSelectMode) {
			if (isCurrentlySelected) {
				manageItemSelected(itemFromPackageData, false);
				// No change in selection, but ensure it's QTY target and context
				// setActiveQtyTarget({
				// 	type: "packageItem",
				// 	packagedtlid: mainCategoryRef.packagedtlid,
				// 	submenuid: itemFromPackageData.submenuid,
				// });
				//console.log("ALREADY SELECTED, SET ACTIVE QTY TARGET");
				// `itemFromPackageData` here is the one from the list, might not have updated `custom` array.
				// We need the instance from `subMenu` if it exists.
				// const currentSelectedItemInstance = subMenu
				// 	.find((cat) => cat.packagedtlid === mainCategoryRef.packagedtlid)
				// 	?.packages.find((p) => p.submenuid === itemFromPackageData.submenuid);
				// itemToBecomeContext =
				// 	currentSelectedItemInstance || itemFromPackageData;
			} else {
				manageItemSelected(itemFromPackageData, true); // This will update subMenu
				// After manageItemSelected, the itemFromPackageData (with default custom: []) will be in subMenu.
				// So, itemToBecomeContext is correct.
			}
		} else {
			// Multi-select mode
			manageItemSelected(itemFromPackageData, !isCurrentlySelected);
			if (!isCurrentlySelected) {
				// If we just selected it
				// itemToBecomeContext is fine
			} else {
				// If we just deselected it
				// Need to find a new context, or clear if none left
				const categoryAfterDeselect = subMenu.find(
					(cat) => cat.packagedtlid === mainCategoryRef.packagedtlid
				);
				const remainingSelected =
					categoryAfterDeselect?.packages?.filter(
						(p) => p.submenuid !== itemFromPackageData.submenuid
					) || [];
				if (remainingSelected.length > 0) {
					itemToBecomeContext = remainingSelected[0]; // Default to first of remaining
				} else {
					itemToBecomeContext = null; // No items left selected
				}
			}
		}

		// Update customization context and active QTY target
		// Only call getMenuCustomization if the context item's submenuid has changed
		if (itemToBecomeContext) {
			if (
				customizationContextPackageItem?.submenuid !==
				itemToBecomeContext.submenuid
			) {
				getMenuCustomization(itemToBecomeContext); // This also sets customizationContextPackageItem inside
			}
			setActiveQtyTarget({
				type: "packageItem",
				packagedtlid: mainCategoryRef.packagedtlid,
				submenuid: itemToBecomeContext.submenuid,
			});
		} else {
			// //console.log("handle pack item click ");
			setCustomizeData([]);
			setCustomizationContextPackageItem(null);
			// Potentially clear activeQtyTarget or set it to a custom item if one was active
			if (
				activeQtyTarget?.type === "packageItem" &&
				activeQtyTarget.submenuid === itemFromPackageData.submenuid
			) {
				setActiveQtyTarget(null);
			}
		}
	};

	// const manageItemSelected = (itemToToggle, selectAction) => {
	// 	const mainCategoryRef = selectedMenu;
	// 	if (!mainCategoryRef) return;
	// 	const isSingleSelectMode = mainCategoryRef.freeitemcount === 1;

	// 	setSubMenu((prevSubMenu) =>
	// 		prevSubMenu.map((cat) => {
	// 			if (cat.packagedtlid === mainCategoryRef.packagedtlid) {
	// 				let currentSelectedItems = cat.packages || [];
	// 				let updatedSelectedItems;
	// 				const processedItemToToggle = {
	// 					...itemToToggle,
	// 					submenuqty:
	// 						itemToToggle.submenuqty || itemToToggle.submenudefault || 1,
	// 					custom: itemToToggle.custom || [],
	// 				};

	// 				if (selectAction) {
	// 					if (isSingleSelectMode) {
	// 						updatedSelectedItems = [
	// 							{ ...processedItemToToggle, custom: null },
	// 						]; // New item, clear customs
	// 					} else {
	// 						if (
	// 							currentSelectedItems.find(
	// 								(i) => i.submenuid === processedItemToToggle.submenuid
	// 							)
	// 						) {
	// 							updatedSelectedItems = currentSelectedItems;
	// 						} else {
	// 							const freeItemLimit = mainCategoryRef.freeitemcount || 0;
	// 							const isItemFree =
	// 								Number(processedItemToToggle.submenuprice) === 0;
	// 							if (isItemFree && freeItemLimit > 1) {
	// 								const currentFreeSelectedCount = currentSelectedItems.filter(
	// 									(i) => Number(i.submenuprice) === 0
	// 								).length;
	// 								if (currentFreeSelectedCount >= freeItemLimit) {
	// 									Swal.fire({
	// 										icon: "warning",
	// 										title: `You can only select ${freeItemLimit} free item(s).`,
	// 									});
	// 									return cat;
	// 								}
	// 							}
	// 							updatedSelectedItems = [
	// 								...currentSelectedItems,
	// 								processedItemToToggle,
	// 							];
	// 						}
	// 					}
	// 				} else {
	// 					updatedSelectedItems = currentSelectedItems.filter(
	// 						(i) => i.submenuid !== itemToToggle.submenuid
	// 					);
	// 				}
	// 				return { ...cat, packages: updatedSelectedItems };
	// 			}
	// 			return cat;
	// 		})
	// 	);
	// };

	const manageItemSelected = (itemToToggle, selectAction) => {
		const mainCategoryRef = selectedMenu; // The currently active category object
		if (!mainCategoryRef) return;

		// itemToToggle is the sub-menu item from packageData that was clicked.
		// selectAction is true if we intend to select it, false to deselect.

		const itemIsFree = Number(itemToToggle.submenuprice) === 0;
		const categoryFreeItemLimit = mainCategoryRef.freeitemcount || 0;

		setSubMenu((prevSubMenu) =>
			prevSubMenu.map((cat) => {
				// cat is a category from the overall subMenu state
				if (cat.packagedtlid === mainCategoryRef.packagedtlid) {
					// This is the category we're modifying
					let currentSelectedPkgItems = cat.packages || [];
					let updatedSelectedPkgItems;

					const processedItemToToggle = {
						// Ensure qty and custom array exist
						...itemToToggle,
						submenuqty:
							itemToToggle.submenuqty || itemToToggle.submenudefault || 1,
						custom: itemToToggle.custom || [], // Keep existing custom if re-selecting, or empty if new
					};

					if (selectAction) {
						// ---- TRYING TO SELECT itemToToggle ----
						const existingItemIndex = currentSelectedPkgItems.findIndex(
							(i) => i.submenuid === processedItemToToggle.submenuid
						);

						if (existingItemIndex !== -1) {
							// Item is already selected, do nothing for selection itself
							updatedSelectedPkgItems = currentSelectedPkgItems;
						} else {
							// Item is not yet selected, try to add it
							if (itemIsFree) {
								// --- Selecting a FREE item ---
								if (categoryFreeItemLimit === 1) {
									// Single free item mode: remove other free items, add this one.
									// Paid items remain untouched.
									const paidItems = currentSelectedPkgItems.filter(
										(p) => Number(p.submenuprice) !== 0
									);
									updatedSelectedPkgItems = [
										...paidItems,
										{ ...processedItemToToggle, custom: [] },
									]; // Add new free, reset its customs
								} else if (categoryFreeItemLimit > 1) {
									// Multi-free item mode (up to limit)
									const currentSelectedFreeItems =
										currentSelectedPkgItems.filter(
											(p) => Number(p.submenuprice) === 0
										);
									// Your onLoad validation handles sum of quantities. Here we just check count of distinct free items for selection.
									if (currentSelectedFreeItems.length < categoryFreeItemLimit) {
										updatedSelectedPkgItems = [
											...currentSelectedPkgItems,
											processedItemToToggle,
										];
									} else {
										// Swal.fire({
										// 	icon: "warning",
										// 	title: `You can select up to ${categoryFreeItemLimit} different free items in this category.`,
										// 	text: "To select this free item, please deselect another one first or adjust quantities.",
										// });
										updatedSelectedPkgItems = currentSelectedPkgItems; // No change
									}
								} else {
									// categoryFreeItemLimit is 0, cannot select free items (should not happen if itemIsFree is true unless price changed)
									// Swal.fire({
									// 	icon: "warning",
									// 	title: "No free items allowed in this category.",
									// });
									updatedSelectedPkgItems = currentSelectedPkgItems;
								}
							} else {
								// --- Selecting a PAID item ---
								// Paid items can always be multi-selected
								updatedSelectedPkgItems = [
									...currentSelectedPkgItems,
									processedItemToToggle,
								];
							}
						}
					} else {
						// ---- TRYING TO DESELECT itemToToggle ----
						updatedSelectedPkgItems = currentSelectedPkgItems.filter(
							(i) => i.submenuid !== itemToToggle.submenuid
						);
					}
					return { ...cat, packages: updatedSelectedPkgItems };
				}
				return cat;
			})
		);
	};

	const checkItemSelected = (itemFromPackageData) => {
		return subMenu
			.find((i) => i?.packagedtlid === selectedMenu?.packagedtlid)
			?.packages?.find((p) => p?.submenuid === itemFromPackageData?.submenuid);
	};

	const checkItemSelectedCustom = (customItemFromCustomizeData) => {
		const mainCategory = subMenu.find(
			(i) => i?.packagedtlid === selectedMenu?.packagedtlid
		);
		if (
			!mainCategory ||
			!mainCategory.packages ||
			!customizationContextPackageItem
		)
			return false;

		// Check against the specific package item that is the context for customizations
		const contextParentPackage = mainCategory.packages.find(
			(p) => p.submenuid === customizationContextPackageItem.submenuid
		);

		return contextParentPackage?.custom?.find(
			(c) => c.customizemenuid === customItemFromCustomizeData.customizemenuid
		);
	};

	const onLoad = () => {
		const isAnyItemSelectedInAnyCategory = subMenu.some(
			(cat) => cat.packages && cat.packages.length > 0
		);

		if (!isAnyItemSelectedInAnyCategory && !update) {
			toast.error(t("PACKAGE.ERROR_SELECT_ONE"));

			return;
		}

		// VALIDATION LOGIC STARTS HERE
		let validationPassed = true;
		for (const category of subMenu) {
			const selectedItemsInCategory = category.packages || [];
			const freeItemLimitForCategory = category.freeitemcount || 0;

			if (freeItemLimitForCategory > 0) {
				let totalQuantityOfSelectedFreeItems = 0;
				selectedItemsInCategory.forEach((item) => {
					// This validation correctly checks only the sub-item's own price,
					// not its custom items, which aligns with the business rule.
					if (Number(item.submenuprice) === 0) {
						totalQuantityOfSelectedFreeItems += Number(item.submenuqty || 1);
					}
				});

				if (totalQuantityOfSelectedFreeItems > freeItemLimitForCategory) {
					Swal.fire({
						icon: "error",
						title: t("PACKAGE.ERROR_LIMIT_EXCEEDED"),
						text: t("PACKAGE.ERROR_CATEGORY_LIMIT", {
							category: category.packagesubmenu,
							selected: totalQuantityOfSelectedFreeItems,
							limit: freeItemLimitForCategory,
						}),
					});
					validationPassed = false;
					break; // Exit the loop on the first validation failure.
				}
			}
		}

		if (!validationPassed) {
			return;
		}
		// VALIDATION LOGIC ENDS HERE

		if (!update) {
			dispatch(
				addDish({
					...menuData,
					packages: subMenu, // Dispatching the pure state
					packageId: menuData.menuid,
				})
			);
		} else {
			dispatch(updateDishFull({ subMenu, menuData })); // Dispatching the pure state
		}
		handleCancel();
	};

	const manageQty = useCallback(
		(key) => {
			if (!activeQtyTarget) {
				toast.info(t("PACKAGE.ERROR_SELECT_FIRST_ITEM"));
				return;
			}

			setSubMenu((prevSubMenu) =>
				prevSubMenu.map((mainCategory) => {
					if (mainCategory.packagedtlid !== activeQtyTarget.packagedtlid) {
						return mainCategory;
					}

					const updatedPackages = (mainCategory.packages || []).map(
						(pkgItem) => {
							// Target is a Package Sub-Item
							if (
								activeQtyTarget.type === "packageItem" &&
								pkgItem.submenuid === activeQtyTarget.submenuid
							) {
								const isFree =
									Number(pkgItem.submenuprice_base || pkgItem.submenuprice) ===
									0;
								const defaultQty =
									Number(pkgItem.freeitemcount) || (isFree ? 1 : 0);
								const totalAcrossInstances = isFree
									? calculateTotalFreeItemQuantity(
											mainCategory.packages,
											pkgItem,
											pkgItem.submenuid
									  )
									: 0;
								const newQty = handleQuantityChange(
									key,
									pkgItem.submenuqty,
									defaultQty,
									isFree,
									totalAcrossInstances
								);
								return { ...pkgItem, submenuqty: newQty };
							}

							// Target is a Custom Item
							if (
								activeQtyTarget.type === "customItem" &&
								pkgItem.submenuid === activeQtyTarget.parentSubmenuId
							) {
								const updatedCustom = (pkgItem.custom || []).map((custom) => {
									if (
										custom.customizemenuid === activeQtyTarget.customizemenuid
									) {
										const isFree = Number(custom.customizemenuprice) === 0;
										const defaultQty =
											Number(custom.defaultqty) || (isFree ? 1 : 0);
										const newQty = handleQuantityChange(
											key,
											custom.qty,
											defaultQty,
											false
										); // Custom items don't have shared limits
										return { ...custom, qty: newQty };
									}
									return custom;
								});
								return { ...pkgItem, custom: updatedCustom };
							}

							return pkgItem;
						}
					);

					return { ...mainCategory, packages: updatedPackages };
				})
			);
		},
		[activeQtyTarget]
	);

	const addCustomItem = useCallback(
		(customItemData, select) => {
			if (!customizationContextPackageItem) {
				toast.warn(t("PACKAGE.ERROR_SELECT_ITEM_FOR_CUSTOM"));
				return;
			}

			setSubMenu((prev) =>
				prev.map((mainCategory) => {
					if (mainCategory.packagedtlid !== selectedMenu.packagedtlid)
						return mainCategory;

					const updatedPackages = (mainCategory.packages || []).map(
						(pkgItem) => {
							if (
								pkgItem.submenuid === customizationContextPackageItem.submenuid
							) {
								let updatedCustomList = [...(pkgItem.custom || [])];
								if (select) {
									if (
										!updatedCustomList.find(
											(c) =>
												c.customizemenuid === customItemData.customizemenuid
										)
									) {
										updatedCustomList.push({
											...customItemData,
											qty: customItemData.defaultqty || 1,
										});
									}
								} else {
									updatedCustomList = updatedCustomList.filter(
										(c) => c.customizemenuid !== customItemData.customizemenuid
									);
								}
								return { ...pkgItem, custom: updatedCustomList };
							}
							return pkgItem;
						}
					);
					return { ...mainCategory, packages: updatedPackages };
				})
			);
		},
		[selectedMenu, customizationContextPackageItem]
	);
	useEffect(() => {
		if (!selectedMenu && subMenu.length > 0) {
			onPackageMenuSelection(subMenu[0]);
		}
	}, [subMenu, selectedMenu]);

	useEffect(() => {
		// 0. Handle no selected category
		if (!selectedMenu) {
			if (customizationContextPackageItem !== null) {
				// Prevent unnecessary state updates
				setCustomizationContextPackageItem(null);
				setCustomizeData([]);
			}
			if (activeQtyTarget && activeQtyTarget.packagedtlid) {
				// setActiveQtyTarget(null); // Or only if it's a packageItem
			}
			return;
		}

		const categoryFromSubMenu = subMenu.find(
			(cat) => cat.packagedtlid === selectedMenu.packagedtlid
		);
		const selectedPackageItemsInCurrentCategory =
			categoryFromSubMenu?.packages || [];

		let newContextCandidate = null;

		if (
			activeQtyTarget?.type === "packageItem" &&
			activeQtyTarget.packagedtlid === selectedMenu.packagedtlid
		) {
			newContextCandidate = selectedPackageItemsInCurrentCategory.find(
				(p) => p.submenuid === activeQtyTarget.submenuid
			);
		}

		if (!newContextCandidate && customizationContextPackageItem) {
			const currentContextStillValidAndSelected =
				customizationContextPackageItem.packagedtlid ===
					selectedMenu.packagedtlid &&
				selectedPackageItemsInCurrentCategory.some(
					(p) => p.submenuid === customizationContextPackageItem.submenuid
				);

			if (currentContextStillValidAndSelected) {
				newContextCandidate = customizationContextPackageItem; // Keep the current context
			}
		}
		if (
			!newContextCandidate &&
			selectedPackageItemsInCurrentCategory.length > 0
		) {
			newContextCandidate = selectedPackageItemsInCurrentCategory[0];
		}
		if (newContextCandidate) {
			// If the determined context is DIFFERENT from the current one, or if current context was null
			if (
				customizationContextPackageItem?.submenuid !==
					newContextCandidate.submenuid ||
				customizationContextPackageItem?.packagedtlid !==
					newContextCandidate.packagedtlid
			) {
				// Full check
				getMenuCustomization(newContextCandidate); // This will set customizationContextPackageItem internally and fetch
			}

			// Align activeQtyTarget to this package item context if:
			// 1. activeQtyTarget is not already this package item.
			// 2. AND activeQtyTarget is not a custom item that is a child of this newContextCandidate.
			// This helps keep focus visual consistent if context was derived (e.g., category change, item deselection).
			const isActiveTargetMisalignedOrNotChildCustom =
				(activeQtyTarget?.submenuid !== newContextCandidate.submenuid ||
					activeQtyTarget?.type !== "packageItem") &&
				!(
					activeQtyTarget?.type === "customItem" &&
					activeQtyTarget?.parentSubmenuId === newContextCandidate.submenuid
				);

			if (isActiveTargetMisalignedOrNotChildCustom) {
				setActiveQtyTarget({
					type: "packageItem",
					packagedtlid: selectedMenu.packagedtlid, // or newContextCandidate.packagedtlid
					submenuid: newContextCandidate.submenuid,
				});
			}
		} else {
			// No valid context could be determined (e.g., no items selected in category).
			// Clear customization context and data if it was previously set.
			if (customizationContextPackageItem !== null) {
				setCustomizationContextPackageItem(null);
				setCustomizeData([]);
			}
			// If activeQtyTarget was for a package item in this category which now has no context, clear activeQtyTarget.
			if (
				activeQtyTarget?.type === "packageItem" &&
				activeQtyTarget.packagedtlid === selectedMenu.packagedtlid
			) {
				setActiveQtyTarget(null);
			}
		}
		// Add getMenuCustomization (memoized) and setActiveQtyTarget to dependencies.
		// customizationContextPackageItem is already a dependency.
	}, [
		subMenu,
		selectedMenu,
		activeQtyTarget,
		customizationContextPackageItem,
		// getMenuCustomization,
		setActiveQtyTarget,
		setCustomizationContextPackageItem,
		setCustomizeData,
	]);

	useEffect(() => {
		// //console.log({ menuData, subMenu });
		if (menuData) {
			const { menuname, salesprice } = menuData;
			setTitle({ name: menuname, price: salesprice });
		} else {
			setTitle({ name: "", price: "" });
		}

		return () => {
			setTitle({ name: "", price: "" });
		};
	}, [menuData]);

	return (
		<Modal
			title={
				<h1 className="text-xl text-center">{t("PACKAGE.TITLE")}</h1>
			}
			open={isModalOpen}
			width={"100%"}
			footer={false}
			style={{ top: 1, paddingBottom: "10px" }} // Use paddingBottom for Modal content space
			onCancel={handleCancel}>
			{/* Overall container with fixed height for scrolling sections */}
			<div className="flex flex-col gap-2 h-[calc(100vh-70px)] md:h-[calc(100vh-80px)]">
				{" "}
				<div className="text-center text-xl font-medium">{`${title.name} - ${formatRupees(Number(title.price), config?.amount, false)}`}</div>
				{/* Adjusted height */}
				<div className="flex h-fit items-center gap-1">
					{" "}
					{/* Category Slider */}
					<SlideArrow
						direction="left"
						height="100%"
						width="40px"
						refVariable={listRef}
						totalPages={totalPages}
						currentIndex={currentIndex}
						setCurrentIndex={setCurrentIndex}
					/>
					<div
						className="flex overflow-auto w-full scrollbar-hidden"
						ref={listRef}>
						{loading === "get" && subMenu.length === 0 ? (
							<div className="w-full text-center p-1">
								<Spin />
							</div>
						) : (
							Array.from({ length: totalPages }, (_, pageIndex) => (
								<div
									className="grid grid-cols-8  items-center gap-1 w-full shrink-0 "
									key={pageIndex}>
									{subMenu
										?.slice(pageIndex * 8, (pageIndex + 1) * 8)
										?.map((category) => (
											<button
												key={category?.packagedtlid}
												className={`${
													selectedMenu?.packagedtlid === category?.packagedtlid
														? "bg-success text-white"
														: "bg-outlet"
												} rounded-lg p-2 font-[600] w-full h-full text-xs sm:text-sm md:text-base`}
												onClick={() => onPackageMenuSelection(category)}
												disabled={
													loading &&
													loading !== "get" &&
													loading !== category?.packagedtlid
												}>
												{loading === category?.packagedtlid ? (
													<Spin size="small" />
												) : (
													category?.packagesubmenu
												)}
											</button>
										))}
								</div>
							))
						)}
					</div>
					<SlideArrow
						direction="right"
						width="40px"
						height="100"
						refVariable={listRef}
						totalPages={totalPages}
						currentIndex={currentIndex}
						setCurrentIndex={setCurrentIndex}
					/>
				</div>
				{/* Main content area: Items and Customizations, side-by-side */}
				<div className="flex gap-2 flex-col md:flex-row flex-grow min-h-0">
					{" "}
					{/* flex-grow and min-h-0 allow children to scroll */}
					{/* Left Side: Package Items */}
					<div className="md:w-6/12 flex flex-col justify-between">
						{" "}
						{/* Main container for left side */}
						<div className="flex flex-col flex-grow min-h-0">
							{" "}
							{/* Inner container that allows item list to scroll */}
							<div className="bg-primary rounded-lg text-center text-white p-2 text-sm sm:text-base">
								{t("PACKAGE.SELECT_ANY")}
								{selectedMenu?.freeitemcount > 0 &&
									selectedMenu.freeitemcount === 1 &&
									` (${t("PACKAGE.CHOOSE_ONE")})`}
								{selectedMenu?.freeitemcount > 1 &&
									` (${t("PACKAGE.UP_TO_N_FREE", { count: selectedMenu.freeitemcount })})`}
							</div>
							<div className="bg-[#F2EDED] rounded-lg p-2 mt-1 flex-grow overflow-hidden">
								{" "}
								{/* Parent for scrollable list */}
								<div className="grid grid-cols-5 border-b py-1 border-[#B6A1A1] text-[#A69393] font-[500] text-xs sm:text-sm mb-2 sticky top-0 bg-[#F2EDED] z-10">
									<div className="col-span-3 border-[#B6A1A1] border-e pl-1">
										{t("PACKAGE.ITEMS")}
									</div>
									<div className="border-[#B6A1A1] border-e text-center">
										{t("PACKAGE.QTY")}
									</div>
									<div className="text-center pr-1">{t("PACKAGE.RATE")}</div>
								</div>
								<div className="h-[calc(100%-2.5rem)] overflow-y-auto scrollbar-hide flex flex-col gap-2">
									{" "}
									{/* Actual scrollable list */}
									{loadingSm === "subMenu" && packageData.length === 0 ? (
										<div className="w-full h-full flex justify-center items-center">
											<Spin />
										</div>
									) : (
										packageData?.map((item) => {
											const selectedItemInstance = checkItemSelected(item);
											const displayItem = selectedItemInstance || item;
											const isQtyTarget =
												activeQtyTarget?.type === "packageItem" &&
												activeQtyTarget?.submenuid === displayItem.submenuid;
											return (
												<button
													key={item?.submenuid}
													className={`grid grid-cols-5 py-1 text-xs sm:text-sm ${
														selectedItemInstance
															? "bg-success text-white"
															: "bg-[#E8DCDC] text-[#A69393]"
													} ${
														isQtyTarget ? "ring-2 ring-blue-500" : ""
													} font-[500] w-full rounded-lg`}
													onClick={() =>
														handlePackageItemClick(item, !!selectedItemInstance)
													}>
													<div className="col-span-3 border-e text-start px-2 truncate">
														{displayItem?.submenudesc}
													</div>
													<div className="border-e text-center">
														{displayItem?.submenuqty}
													</div>
													<div className="text-center px-1 truncate">
														{formatRupees(
															Number(displayItem?.submenuprice),
															config?.amount,
															false
														)}
													</div>
												</button>
											);
										})
									)}
								</div>
							</div>
						</div>
						<OrderSummary
							freeItem={counts.currentCategoryFreeSubItemsQty}
							paidItem={counts.currentCategoryPaidSubItemsQty}
							totalPrice={counts.grandOverallTotalPrice}
							open={true}
						/>
						<div>
							{" "}
							{/* Load/Update Button */}
							{loading !== "get" && subMenu.length > 0 && (
								<button
									className="rounded-lg bg-primary p-2 h-20 w-40 text-lg font-[600] text-white mt-2"
									onClick={onLoad}
									disabled={
										!!(
											loading &&
											loading !== "get" &&
											typeof loading === "string"
										)
									}>
									{loading &&
									loading !== "get" &&
									typeof loading === "string" ? (
										<Spin />
									) : update ? (
										t("PACKAGE.UPDATE_PACKAGE")
									) : (
										t("PACKAGE.LOAD_PACKAGE")
									)}
								</button>
							)}
						</div>
					</div>
					{/* Right Side: Customizations and Numpad */}
					<div className="md:w-6/12">
						{" "}
						{/* Main container for right side */}
						<div className="flex flex-col flex-grow min-h-0">
							{" "}
							{/* Inner container that allows customization list to scroll */}
							<div className="bg-primary rounded-lg text-center text-white p-2 text-sm sm:text-base">
								{t("PACKAGE.CUSTOMIZE_MIXED_MEALS")}
							</div>
							<div className="bg-[#F2EDED] rounded-lg p-2 mt-1 flex-grow overflow-auto scrollbar-hide">
								<div className="grid grid-cols-5 border-b py-1 border-[#B6A1A1] text-[#A69393] font-[500] text-xs sm:text-sm mb-2 sticky top-0 bg-[#F2EDED] z-10">
									<div className="col-span-3 border-[#B6A1A1] border-e pl-1">
										{t("PACKAGE.ITEMS")}
									</div>
									<div className="col-span-1 text-center border-[#B6A1A1] border-e">
										{t("PACKAGE.QTY")}
									</div>
									<div className="col-span-1 text-center pr-1">{t("PACKAGE.RATE")}</div>
								</div>
								<div className="h-60 overflow-auto scrollbar-hidden flex flex-col gap-2">
									{loading === "getCustome" ? (
										<div className="w-full h-full flex justify-center items-center">
											<Spin />
										</div>
									) : customizeData?.length === 0 ? (
										<div className="text-center text-gray-500 py-4 text-xs sm:text-sm">
											{customizationContextPackageItem
												? t("PACKAGE.NO_CUSTOMIZATIONS")
												: t("PACKAGE.SELECT_ITEM_FOR_CUSTOM")}
										</div>
									) : (
										customizeData.map((customApiItem) => {
											const isCustomSelected =
												checkItemSelectedCustom(customApiItem);
											let displayCustomItem = customApiItem;
											if (isCustomSelected && customizationContextPackageItem) {
												const parentPackageItemFromSubMenu = subMenu
													.find(
														(mc) =>
															mc.packagedtlid === selectedMenu?.packagedtlid
													)
													?.packages?.find(
														(p) =>
															p.submenuid ===
															customizationContextPackageItem.submenuid
													);
												const actual =
													parentPackageItemFromSubMenu?.custom?.find(
														(c) =>
															c.customizemenuid ===
															customApiItem.customizemenuid
													);
												if (actual) {
													displayCustomItem = actual;
												}
											}
											const isQtyTarget =
												activeQtyTarget?.type === "customItem" &&
												activeQtyTarget?.customizemenuid ===
													displayCustomItem.customizemenuid;
											return (
												<button
													key={customApiItem?.customizemenuid}
													className={`grid grid-cols-5 py-1 text-xs sm:text-sm ${
														isCustomSelected
															? "bg-success text-white"
															: "bg-[#E8DCDC] text-[#A69393]"
													} ${
														isQtyTarget ? "ring-2 ring-blue-500" : ""
													} font-[500] w-full rounded-lg`}
													onClick={() => {
														addCustomItem(customApiItem, !isCustomSelected);
														if (!isCustomSelected) {
															setActiveQtyTarget({
																type: "customItem",
																packagedtlid: selectedMenu?.packagedtlid,
																parentSubmenuId:
																	customizationContextPackageItem?.submenuid,
																customizemenuid: customApiItem.customizemenuid,
															});
														} else {
															if (
																activeQtyTarget?.type === "customItem" &&
																activeQtyTarget?.customizemenuid ===
																	customApiItem.customizemenuid
															) {
																setActiveQtyTarget(null);
															}
														}
													}}>
													<div className="col-span-3 border-[#B6A1A1] border-e text-start px-2 truncate">
														{displayCustomItem?.customizemenudesc}
													</div>
													<div className="col-span-1 text-center border-[#B6A1A1] border-e px-2">
														{displayCustomItem?.qty}
													</div>
													<div className="col-span-1 text-center px-2 truncate">
														{formatRupees(
															Number(displayCustomItem?.customizemenuprice),
															config?.amount,
															false
														)}
													</div>
												</button>
											);
										})
									)}
								</div>
							</div>
						</div>
						<div className="grid grid-cols-4 sm:grid-cols-5 p-1 gap-1 sm:gap-2 mt-2">
							{[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((keyVal) => (
								<button
									key={keyVal}
									className="rounded-md p-2 flex justify-center items-center text-black text-xl font-[500] bg-outlet  "
									onClick={() => manageQty(keyVal.toString())}>
									{keyVal}
								</button>
							))}

							{/* Action Keys */}
							<button // Increment Button
								key="+"
								className="rounded-md p-2 flex justify-center items-center text-black text-xl font-[500] bg-green-300 hover:bg-green-400 transition-colors" // Different color for +/-
								onClick={() => manageQty("+")}>
								+
							</button>
							<button // Decrement Button
								key="-"
								className="rounded-md p-2 flex justify-center items-center text-black text-xl font-[500] bg-red-300 hover:bg-red-400 transition-colors" // Different color for +/-
								onClick={() => manageQty("-")}>
								-
							</button>
							<button // Clear Button
								key="C"
								className="rounded-md p-2 flex justify-center items-center text-black text-xl font-[500] bg-yellow-300 hover:bg-yellow-400 transition-colors"
								onClick={() => manageQty("C")}>
								C
							</button>
							<button // Backspace Button
								key="<"
								className="rounded-md p-2 flex justify-center items-center text-black text-xl font-[500] bg-gray-300 hover:bg-gray-400 transition-colors"
								onClick={() => manageQty("<")}>
								{"<"}
							</button>
						</div>
					</div>
				</div>
			</div>
		</Modal>
	);
}

export default PackageItem;

const OrderSummary = ({ freeItem, paidItem, totalPrice, open }) => {
	// const configRe = useSelector(selectConfig);
	const config = selectConfigLs;
	const { t } = useTranslation();

	if (!open) return null;
	return (
		<div className="flex flex-col sm:flex-row justify-between items-center gap-1 sm:gap-2 p-1.5 sm:p-2 my-1 sm:my-1.5 bg-[#F2EDED] rounded-xl shadow-md w-full text-xs">
			<div className="flex-1 w-full sm:w-auto flex justify-between items-center bg-outlet border border-gray-100 rounded-lg p-1.5 sm:p-2">
				<span className="mr-1 sm:mr-2">{t("PACKAGE.FREE_ITEMS")}</span>
				<span className="text-sm sm:text-xl font-semibold">{freeItem}</span>
			</div>
			<div className="hidden sm:block w-px bg-gray-400 h-10 sm:h-12" />
			<div className="flex-1 w-full sm:w-auto flex justify-between items-center bg-outlet border border-gray-200 rounded-lg p-1.5 sm:p-2">
				<span className="mr-1 sm:mr-2">{t("PACKAGE.PAID_ITEMS")}</span>
				<span className="text-sm sm:text-xl font-semibold">{paidItem}</span>
			</div>
			<div className="hidden sm:block w-px bg-gray-400 h-10 sm:h-12" />
			<div className="flex-1 w-full sm:w-auto flex justify-between items-center bg-outlet border border-gray-200 rounded-lg p-1.5 sm:p-2">
				<span className="mr-1 sm:mr-2">{t("PACKAGE.TOTAL_PRICE")}</span>
				<span className="text-sm sm:text-xl font-semibold">
					{formatRupees(Number(totalPrice), config?.amount, false)}
				</span>
			</div>
		</div>
	);
};
