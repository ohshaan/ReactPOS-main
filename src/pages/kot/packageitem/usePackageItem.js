// src/features/PackageItem/usePackageItem.js
import { useState, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { productModel } from "../../../plugins/models";
import { addDish, updateDishFull } from "../../../redux/slices/orderSlice";
import {
	handleQuantityChange,
	calculateSubItemTotalAdditionalCost,
	calculateTotalFreeItemQuantity,
} from "./helper";

export const usePackageItem = (menuData, update, setPackageItem, setUpdate) => {
	const dispatch = useDispatch();
	const [subMenu, setSubMenu] = useState([]);
	const [selectedMenu, setSelectedMenu] = useState(null);
	const [packageData, setPackageData] = useState([]);
	const [customizeData, setCustomizeData] = useState([]);
	const [loading, setLoading] = useState(false);
	const [loadingSm, setLoadingSm] = useState(false);
	const [activeQtyTarget, setActiveQtyTarget] = useState(null);
	const [customizationContextPackageItem, setCustomizationContextPackageItem] =
		useState(null);

	// Fetch initial package categories
	const getPackageMenu = useCallback(() => {
		setLoading(true);
		productModel
			.getPackageMenu({ menuid: menuData?.menuid })
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
						title: data?.Error?.Error_Msg || "Error",
					});
				}
			})
			.catch((error) => {
				console.error("error fetching package menu", error);
				Swal.fire({
					icon: "error",
					title: "Error",
					text: "Failed to fetch package menu.",
				});
			})
			.finally(() => setLoading(false));
	}, [menuData?.menuid]);

	// Fetch customizations for a selected package item
	const getMenuCustomization = useCallback(
		(packageItemForContext) => {
			if (!packageItemForContext?.submenuid || !selectedMenu?.packagedtlid) {
				setCustomizeData([]);
				return;
			}

			if (
				customizationContextPackageItem?.submenuid ===
					packageItemForContext.submenuid &&
				!update
			) {
				return; // Avoid refetching for the same context
			}

			setLoadingSm(true);
			setCustomizationContextPackageItem(packageItemForContext);
			productModel
				.getPackageMenuCustomize({
					submenuid: packageItemForContext.submenuid,
					packagedtlid: packageItemForContext.packagedtlid,
				})
				.then((data) => {
					if (data?.status === "true") {
						setCustomizeData(
							(data.data || []).map((i) => ({ ...i, qty: i.defaultqty || 1 }))
						);
					} else {
						setCustomizeData([]);
					}
				})
				.catch((error) => {
					console.error("Error fetching customizations", error);
					setCustomizeData([]);
				})
				.finally(() => setLoadingSm(false));
		},
		[selectedMenu, customizationContextPackageItem, update]
	);

	// Fetch sub-items for a selected category
	const getPackageSubMenu = useCallback(
		(categoryData) => {
			setLoadingSm(true);
			productModel
				.getPackageSubMenu({
					menuid: menuData?.menuid,
					packagedtlid: categoryData?.packagedtlid,
				})
				.then((response) => {
					if (response?.status === "true") {
						setPackageData(
							(response.data || []).map((item) => ({
								...item,
								submenuqty: item.submenuqty || 1,
							}))
						);
					} else {
						Swal.fire({
							icon: "error",
							title: response?.Error?.Error_Msg || "Error",
						});
					}
				})
				.catch((error) =>
					console.error("error fetching package sub-menu", error)
				)
				.finally(() => setLoadingSm(false));
		},
		[menuData?.menuid]
	);

	// Handle selecting a category
	const onPackageMenuSelection = useCallback(
		(categoryItem) => {
			setSelectedMenu(categoryItem);
			if (selectedMenu?.packagedtlid !== categoryItem.packagedtlid) {
				setCustomizeData([]);
				setCustomizationContextPackageItem(null);
			}
			getPackageSubMenu(categoryItem);
			setActiveQtyTarget(null);
		},
		[selectedMenu, getPackageSubMenu]
	);

	// Handle adding/removing a package sub-item
	const handlePackageItemClick = (itemToToggle, isCurrentlySelected) => {
		setSubMenu((prevSubMenu) => {
			return prevSubMenu.map((cat) => {
				if (cat.packagedtlid !== selectedMenu.packagedtlid) return cat;

				let updatedPackages = [...(cat.packages || [])];
				const isSingleSelectMode = cat.freeitemcount === 1;
				const isFree = Number(itemToToggle.submenuprice) === 0;

				if (isCurrentlySelected) {
					updatedPackages = updatedPackages.filter(
						(p) => p.submenuid !== itemToToggle.submenuid
					);
				} else {
					const newItem = { ...itemToToggle, submenuqty: 1, custom: [] };
					if (isSingleSelectMode && isFree) {
						const paidItems = updatedPackages.filter(
							(p) => Number(p.submenuprice) !== 0
						);
						updatedPackages = [...paidItems, newItem];
					} else {
						updatedPackages.push(newItem);
					}
				}

				return { ...cat, packages: updatedPackages };
			});
		});
	};

	// Handle adding/removing a custom item
	const addCustomItem = useCallback(
		(customItemData, select) => {
			if (!customizationContextPackageItem) return;

			setSubMenu((prev) =>
				prev.map((mainCategory) => {
					if (mainCategory.packagedtlid !== selectedMenu.packagedtlid)
						return mainCategory;

					const updatedPackages = mainCategory.packages.map((pkgItem) => {
						if (pkgItem.submenuid !== customizationContextPackageItem.submenuid)
							return pkgItem;

						let updatedCustomList = [...(pkgItem.custom || [])];
						if (select) {
							if (
								!updatedCustomList.find(
									(c) => c.customizemenuid === customItemData.customizemenuid
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

						const updatedPkgItem = { ...pkgItem, custom: updatedCustomList };
						const newTotalCost =
							calculateSubItemTotalAdditionalCost(updatedPkgItem);
						return {
							...updatedPkgItem,
							subitem_total_additional_cost: newTotalCost,
						};
					});
					return { ...mainCategory, packages: updatedPackages };
				})
			);
		},
		[selectedMenu, customizationContextPackageItem]
	);

	// Handle quantity changes via numpad
	const manageQty = useCallback(
		(key) => {
			if (!activeQtyTarget) {
				toast.info("Please select an item first to change its quantity.");
				return;
			}

			setSubMenu((prevSubMenu) =>
				prevSubMenu.map((mainCategory) => {
					if (mainCategory.packagedtlid !== activeQtyTarget.packagedtlid)
						return mainCategory;

					const updatedPackages = mainCategory.packages.map((pkgItem) => {
						let pkgToUpdate = { ...pkgItem };
						let needsRecalculation = false;

						if (
							activeQtyTarget.type === "packageItem" &&
							pkgItem.submenuid === activeQtyTarget.submenuid
						) {
							const isFree =
								Number(
									pkgToUpdate.submenuprice_base || pkgToUpdate.submenuprice
								) === 0;
							const defaultQty =
								Number(pkgToUpdate.freeitemcount) || (isFree ? 1 : 0);
							const totalAcrossInstances = isFree
								? calculateTotalFreeItemQuantity(
										mainCategory.packages,
										pkgToUpdate,
										pkgToUpdate.submenuid
								  )
								: 0;
							pkgToUpdate.submenuqty = handleQuantityChange(
								key,
								pkgToUpdate.submenuqty,
								defaultQty,
								isFree,
								totalAcrossInstances
							);
							needsRecalculation = true;
						}

						if (
							activeQtyTarget.type === "customItem" &&
							pkgItem.submenuid === activeQtyTarget.parentSubmenuId
						) {
							pkgToUpdate.custom = (pkgToUpdate.custom || []).map((custom) => {
								if (
									custom.customizemenuid === activeQtyTarget.customizemenuid
								) {
									const isFree = Number(custom.customizemenuprice) === 0;
									const defaultQty =
										Number(custom.defaultqty) || (isFree ? 1 : 0);
									custom.qty = handleQuantityChange(
										key,
										custom.qty,
										defaultQty,
										false
									); // Custom items generally don't have shared limits
								}
								return custom;
							});
							needsRecalculation = true;
						}

						if (needsRecalculation) {
							pkgToUpdate.subitem_total_additional_cost =
								calculateSubItemTotalAdditionalCost(pkgToUpdate);
						}

						return pkgToUpdate;
					});

					return { ...mainCategory, packages: updatedPackages };
				})
			);
		},
		[activeQtyTarget]
	);

	// Handle final submission to Redux
	const onLoad = () => {
		// ... (your validation logic can stay here) ...
		const isAnyItemSelected = subMenu.some(
			(cat) => cat.packages && cat.packages.length > 0
		);
		if (!isAnyItemSelected && !update) {
			toast.error("Please select at least one item.");
			return;
		}

		if (!update) {
			dispatch(
				addDish({ ...menuData, packages: subMenu, packageId: menuData.menuid })
			);
		} else {
			dispatch(updateDishFull({ subMenu, menuData }));
		}
		setPackageItem(false);
	};

	// Main effect to manage data fetching and state initialization
	useEffect(() => {
		if (update && menuData?.packages) {
			// Recalculate costs for existing packages on load
			const initialPackages = menuData.packages.map((cat) => ({
				...cat,
				packages: (cat.packages || []).map((p) => ({
					...p,
					subitem_total_additional_cost: calculateSubItemTotalAdditionalCost(p),
				})),
			}));
			setSubMenu(initialPackages);
		} else {
			getPackageMenu();
		}
	}, [update, menuData, getPackageMenu]);

	// Effect to set the first category as active
	useEffect(() => {
		if (!selectedMenu && subMenu.length > 0) {
			onPackageMenuSelection(subMenu[0]);
		}
	}, [subMenu, selectedMenu, onPackageMenuSelection]);

	// Effect to manage the customization context based on selections
	useEffect(() => {
		if (!selectedMenu) return;
		const currentCategory = subMenu.find(
			(cat) => cat.packagedtlid === selectedMenu.packagedtlid
		);
		const selectedItems = currentCategory?.packages || [];

		let newContext = null;
		if (selectedItems.length > 0) {
			// Prefer the item that is the current Qty target
			const targetItem =
				activeQtyTarget?.type === "packageItem" &&
				selectedItems.find((p) => p.submenuid === activeQtyTarget.submenuid);
			newContext = targetItem || selectedItems[0];
		}

		if (
			newContext &&
			newContext.submenuid !== customizationContextPackageItem?.submenuid
		) {
			getMenuCustomization(newContext);
		} else if (!newContext) {
			setCustomizeData([]);
			setCustomizationContextPackageItem(null);
		}
	}, [
		subMenu,
		selectedMenu,
		activeQtyTarget,
		getMenuCustomization,
		customizationContextPackageItem,
	]);

	return {
		subMenu,
		selectedMenu,
		packageData,
		customizeData,
		loading,
		loadingSm,
		activeQtyTarget,
		customizationContextPackageItem,
		onPackageMenuSelection,
		handlePackageItemClick,
		addCustomItem,
		manageQty,
		onLoad,
		setActiveQtyTarget,
		checkItemSelected: (item) =>
			subMenu
				.find((c) => c.packagedtlid === selectedMenu?.packagedtlid)
				?.packages.find((p) => p.submenuid === item.submenuid),
		checkItemSelectedCustom: (customItem) =>
			subMenu
				.find((c) => c.packagedtlid === selectedMenu?.packagedtlid)
				?.packages.find(
					(p) => p.submenuid === customizationContextPackageItem?.submenuid
				)
				?.custom.find((c) => c.customizemenuid === customItem.customizemenuid),
	};
};
