// src/features/PackageItem/components.js
import React, { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Spin } from "antd";
import { SlideArrow } from "../../../components";
import { formatRupees } from "../../../utils/helpers";
import { selectConfigLs } from "../../../redux/selector/orderSlector";

export const PackageCategorySlider = ({
	subMenu,
	selectedMenu,
	onPackageMenuSelection,
	loading,
}) => {
	const listRef = useRef();
	const [currentIndex, setCurrentIndex] = React.useState(0);
	const totalPages = Math.ceil(subMenu?.length / 8);

	return (
		<div className="flex h-fit items-center gap-1">
			<SlideArrow
				direction="left"
				height="100%"
				width="40px"
				refVariable={listRef}
				totalPages={totalPages}
				currentIndex={currentIndex}
				setCurrentIndex={setCurrentIndex}
			/>
			<div className="flex overflow-auto w-full scrollbar-hidden" ref={listRef}>
				{loading && subMenu.length === 0 ? (
					<div className="w-full text-center p-1">
						<Spin />
					</div>
				) : (
					Array.from({ length: totalPages }, (_, pageIndex) => (
						<div
							className="grid grid-cols-8 items-center gap-1 w-full shrink-0"
							key={pageIndex}>
							{subMenu
								.slice(pageIndex * 8, (pageIndex + 1) * 8)
								.map((category) => (
									<button
										key={category.packagedtlid}
										className={`${
											selectedMenu?.packagedtlid === category.packagedtlid
												? "bg-success text-white"
												: "bg-outlet"
										} rounded-lg p-2 font-[600] w-full h-full text-xs sm:text-sm md:text-base`}
										onClick={() => onPackageMenuSelection(category)}
										disabled={loading}>
										{category.packagesubmenu}
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
	);
};

export const PackageSubItemsList = ({
	packageData,
	checkItemSelected,
	handlePackageItemClick,
	activeQtyTarget,
	loading,
}) => {
	const config = selectConfigLs;
	return (
		<div className="bg-[#F2EDED] rounded-lg p-2 mt-1 flex-grow overflow-hidden">
			<div className="grid grid-cols-5 border-b py-1 border-[#B6A1A1] text-[#A69393] font-[500] text-xs sm:text-sm mb-2 sticky top-0 bg-[#F2EDED] z-10">
				<div className="col-span-3 border-[#B6A1A1] border-e pl-1">{t("PACKAGE.ITEMS")}</div>
				<div className="border-[#B6A1A1] border-e text-center">{t("PACKAGE.QTY")}</div>
				<div className="text-center pr-1">{t("PACKAGE.RATE")}</div>
			</div>
			<div className="h-[calc(100%-2.5rem)] overflow-y-auto scrollbar-hide flex flex-col gap-2">
				{loading && packageData.length === 0 ? (
					<div className="w-full h-full flex justify-center items-center">
						<Spin />
					</div>
				) : (
					packageData.map((item) => {
						const selectedInstance = checkItemSelected(item);
						const displayItem = selectedInstance || item;
						const isQtyTarget =
							activeQtyTarget?.type === "packageItem" &&
							activeQtyTarget.submenuid === displayItem.submenuid;
						return (
							<button
								key={item.submenuid}
								className={`grid grid-cols-5 py-1 text-xs sm:text-sm ${
									selectedInstance
										? "bg-success text-white"
										: "bg-[#E8DCDC] text-[#A69393]"
								} ${
									isQtyTarget ? "ring-2 ring-blue-500" : ""
								} font-[500] w-full rounded-lg`}
								onClick={() =>
									handlePackageItemClick(item, !!selectedInstance)
								}>
								<div className="col-span-3 border-e text-start px-2 truncate">
									{displayItem.submenudesc}
								</div>
								<div className="border-e text-center">
									{displayItem.submenuqty}
								</div>
								<div className="text-center px-1 truncate">
									{formatRupees(
										Number(displayItem.submenuprice),
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
	);
};

export const CustomizationsList = ({
	customizeData,
	checkItemSelectedCustom,
	addCustomItem,
	activeQtyTarget,
	setActiveQtyTarget,
	customizationContextPackageItem,
	loading,
}) => {
	const config = selectConfigLs;
	return (
		<div className="bg-[#F2EDED] rounded-lg p-2 mt-1 flex-grow overflow-auto scrollbar-hide">
			{/* Header */}
			<div className="grid grid-cols-5 border-b py-1 border-[#B6A1A1] text-[#A69393] font-[500] text-xs sm:text-sm mb-2 sticky top-0 bg-[#F2EDED] z-10">
				<div className="col-span-3 border-[#B6A1A1] border-e pl-1">{t("PACKAGE.ITEMS")}</div>
				<div className="col-span-1 text-center border-[#B6A1A1] border-e">
					Qty
				</div>
				<div className="col-span-1 text-center pr-1">{t("PACKAGE.RATE")}</div>
			</div>
			<div className="h-60 overflow-auto scrollbar-hidden flex flex-col gap-2">
				{loading ? (
					<div className="w-full h-full flex justify-center items-center">
						<Spin />
					</div>
				) : customizeData.length === 0 ? (
					<div className="text-center text-gray-500 py-4 text-xs sm:text-sm">
						{customizationContextPackageItem
							? t("PACKAGE.NO_CUSTOMIZATIONS")
							: t("PACKAGE.SELECT_ITEM_FOR_CUSTOM")}
					</div>
				) : (
					customizeData.map((customItem) => {
						const isSelected = checkItemSelectedCustom(customItem);
						const isQtyTarget =
							activeQtyTarget?.type === "customItem" &&
							activeQtyTarget.customizemenuid === customItem.customizemenuid;
						return (
							<button
								key={customItem.customizemenuid}
								className={`grid grid-cols-5 py-1 text-xs sm:text-sm ${
									isSelected
										? "bg-success text-white"
										: "bg-[#E8DCDC] text-[#A69393]"
								} ${
									isQtyTarget ? "ring-2 ring-blue-500" : ""
								} font-[500] w-full rounded-lg`}
								onClick={() => {
									addCustomItem(customItem, !isSelected);
									setActiveQtyTarget({
										type: "customItem",
										parentSubmenuId: customizationContextPackageItem.submenuid,
										customizemenuid: customItem.customizemenuid,
									});
								}}>
								<div className="col-span-3 border-e text-start px-2 truncate">
									{customItem.customizemenudesc}
								</div>
								<div className="col-span-1 text-center border-e px-2">
									{isSelected?.qty || 1}
								</div>
								<div className="col-span-1 text-center px-2 truncate">
									{formatRupees(
										Number(customItem.customizemenuprice),
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
	);
};

export const Numpad = ({ manageQty }) => {
	return (
		<div className="grid grid-cols-4 sm:grid-cols-5 p-1 gap-1 sm:gap-2 mt-2">
			{[1, 2, 3, 4, 5, 6, 7, 8, 9, 0, "+", "-", "C", "<"].map((key) => (
				<button
					key={key}
					className={`rounded-md p-2 flex justify-center items-center text-black text-xl font-[500] ${
						key === "+"
							? "bg-green-300"
							: key === "-"
							? "bg-red-300"
							: key === "C"
							? "bg-yellow-300"
							: key === "<"
							? "bg-gray-300"
							: "bg-outlet"
					}`}
					onClick={() => manageQty(key.toString())}>
					{key}
				</button>
			))}
		</div>
	);
};

export const OrderSummary = ({ freeItem, paidItem, totalPrice }) => {
	const config = selectConfigLs;
	const { t } = useTranslation();
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
