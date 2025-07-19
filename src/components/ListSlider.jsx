import React from "react";

/**
 * The ListSlider function in JavaScript React is used to display a list of items with pagination and
 * selection capabilities.
 * @param {Object} param0
 * @param {React.RefObject} param0.componentRef - Pass the reference of the block
 * @param {number} param0.totalPages - The Total pages
 * @param {Array<Object>} param0.mainData - The data which has to be mapped
 * @param {number} param0.itemsPerPage - No of items to be displayed in the single page
 * @param {string} [param0.buttonClass='h-10'] - Add other button classes (e.g., height).
 * @param {string} param0.name - Custom key in item object to fetch the display name
 * @param {string} param0.id - Custom key in item object to fetch the unique identifier
 * @param {function} param0.setSelectedData - Function to set the selected data to state
 * @param {Object} param0.selected - The currently selected item's identifier container
 * @param {boolean} [param0.customeColor=false] - If true, for *selected* items, attempts to use item.categorycolor.
 * @param {boolean} [param0.menuColor=false] - If true and item.categorycolor is valid, sets button background to item.categorycolor as a base style.
 * @param {() => void} [param0.action=()=>{}] - Action to perform when a button is clicked
 * @param {string} [param0.bgColor='bg-slide-button'] - Tailwind class for non-selected background
 * @param {string} [param0.bgSelectedColor='bg-success'] - Tailwind class for selected background (when not using customColor for selection)
 */
function ListSlider({
	componentRef,
	totalPages,
	mainData,
	itemsPerPage,
	buttonClass = "h-10",
	name,
	id,
	caseType,
	setSelectedData,
	selected,
	action = () => {},
	bgColor = "bg-slide-button",
	bgSelectedColor = "bg-success",
	customeColor = false,
	menuColor = false,
	disable = false,
}) {
	if (typeof window !== "undefined" && window.screen.width <= 540) {
		itemsPerPage = Math.floor(itemsPerPage / 2) - 1;
		if (itemsPerPage < 1) itemsPerPage = 1;
		totalPages = mainData ? Math.ceil(mainData.length / itemsPerPage) : 0;
	}

	const onSelect = (itemName, value) => {
		setSelectedData((prev) => ({
			...prev,
			[itemName]: value,
		}));
	};

	return (
		<div
			className="flex overflow-auto w-full scrollbar-hidden"
			ref={componentRef}>
			{totalPages > 0 && mainData && mainData.length > 0 ? (
				Array.from({ length: totalPages }, (_, pageIndex) => {
					return (
						<div
							key={pageIndex}
							className="grid grid-cols-2 md:grid-cols-5 gap-2 w-full shrink-0 px-2 ">
							{mainData
								.slice(pageIndex * itemsPerPage, (pageIndex + 1) * itemsPerPage)
								.map((item, index) => {
									const isSelected = item?.[id] === selected?.[id];
									let buttonBgClass = "";
									let buttonInlineStyle = {};

									if (
										menuColor &&
										item.categorycolor &&
										item.categorycolor !== ""
									) {
										buttonInlineStyle = {
											backgroundColor: item.categorycolor,
										};
									}

									if (isSelected) {
										if (
											customeColor && // customeColor is specifically for selected items
											item.categorycolor &&
											item.categorycolor !== ""
										) {
											buttonInlineStyle = {
												backgroundColor: item.categorycolor,
											};
										} else if (Object.keys(buttonInlineStyle).length === 0) {
											buttonBgClass = bgSelectedColor;
										}
									} else {
										// Item is NOT selected
										if (Object.keys(buttonInlineStyle).length === 0) {
											buttonBgClass = bgColor;
										}
									}

									return (
										<button
											className={`rounded-lg p-2 flex items-center justify-center h-5 ${buttonBgClass} text-white text-[10px] font-semibold ${buttonClass} disabled:opacity-90 `}
											style={buttonInlineStyle}
											key={`${item?.[id] || "item"}-${pageIndex}-${index}`}
											disabled={disable}
											onClick={() => {
												onSelect(id, item?.[id]);
												action(item?.[id], item);
											}}>
											<span
												className="w-100 line-clamp-2 overflow-hidden"
												style={{
													textTransform: caseType ? caseType : undefined,
												}}>
												{" "}
												{item?.[name]}{" "}
											</span>
										</button>
									);
								})}
						</div>
					);
				})
			) : (
				<span className="col-span-full flex items-center justify-center text-[#C0C4C7] w-full p-4">
					No Data Found
				</span>
			)}
		</div>
	);
}

export default ListSlider;
