// src/features/PackageItem/index.js
import React from "react";
import { Modal, Spin } from "antd";
import { usePackageItem } from "../packageitem/usePackageItem";
import { useCustomItemCounter } from "../../../utils/helpers/summaryCount";
import { formatRupees } from "../../../utils/helpers";
import { selectConfigLs } from "../../../redux/selector/orderSlector";
import {
	PackageCategorySlider,
	PackageSubItemsList,
	CustomizationsList,
	Numpad,
	OrderSummary,
} from "";

function PackageItem({ setPackageItem, menuData, update, setUpdate }) {
	const {
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
		checkItemSelected,
		checkItemSelectedCustom,
	} = usePackageItem(menuData, update, setPackageItem, setUpdate);

	const counts = useCustomItemCounter({
		data: subMenu,
		selectedPackageDtlId: selectedMenu?.packagedtlid,
	});

	const config = selectConfigLs;

	const handleCancel = () => {
		setPackageItem(false);
		setUpdate(false);
	};

	return (
		<Modal
			title={<h1 className="text-xl text-center">Create Your Own Package !</h1>}
			open={true}
			width={"100%"}
			footer={false}
			style={{ top: 1, paddingBottom: "10px" }}
			onCancel={handleCancel}>
			<div className="flex flex-col gap-2 h-[calc(100vh-70px)] md:h-[calc(100vh-80px)]">
				<div className="text-center text-xl font-medium">
					{`${menuData?.menuname} - ${formatRupees(
						Number(menuData?.salesprice),
						config?.amount,
						false
					)}`}
				</div>

				<PackageCategorySlider
					subMenu={subMenu}
					selectedMenu={selectedMenu}
					onPackageMenuSelection={onPackageMenuSelection}
					loading={loading}
				/>

				<div className="flex gap-2 flex-col md:flex-row flex-grow min-h-0">
					{/* Left Side */}
					<div className="md:w-6/12 flex flex-col justify-between">
						<div className="flex flex-col flex-grow min-h-0">
							<div className="bg-primary rounded-lg text-center text-white p-2 text-sm sm:text-base">
								Select Items
								{selectedMenu?.freeitemcount > 0 &&
									` (Choose ${selectedMenu.freeitemcount})`}
							</div>
							<PackageSubItemsList
								packageData={packageData}
								checkItemSelected={checkItemSelected}
								handlePackageItemClick={handlePackageItemClick}
								activeQtyTarget={activeQtyTarget}
								loading={loadingSm}
							/>
						</div>
						<OrderSummary
							freeItem={counts.currentCategoryFreeSubItemsQty}
							paidItem={counts.currentCategoryPaidSubItemsQty}
							totalPrice={counts.grandOverallTotalPrice}
						/>
						<div>
							{subMenu.length > 0 && (
								<button
									className="rounded-lg bg-primary p-2 h-20 w-40 text-lg font-[600] text-white mt-2"
									onClick={onLoad}
									disabled={loading}>
									{loading ? (
										<Spin />
									) : update ? (
										"Update Package"
									) : (
										"Load Package"
									)}
								</button>
							)}
						</div>
					</div>

					{/* Right Side */}
					<div className="md:w-6/12 flex flex-col">
						<div className="flex flex-col flex-grow min-h-0">
							<div className="bg-primary rounded-lg text-center text-white p-2 text-sm sm:text-base">
								Customize Your Meals
							</div>
							<CustomizationsList
								customizeData={customizeData}
								checkItemSelectedCustom={checkItemSelectedCustom}
								addCustomItem={addCustomItem}
								activeQtyTarget={activeQtyTarget}
								setActiveQtyTarget={setActiveQtyTarget}
								customizationContextPackageItem={
									customizationContextPackageItem
								}
								loading={loadingSm}
							/>
						</div>
						<Numpad manageQty={manageQty} />
					</div>
				</div>
			</div>
		</Modal>
	);
}

export default PackageItem;
