import React, { useEffect } from "react";
import { Icon } from "@iconify/react";

/**
 * The `SlideArrow` function in JavaScript React renders a button with left or right arrow icons that
 * trigger smooth scrolling in a specified direction when clicked.
 * @returns The `SlideArrow` component is returning a button element with a background color, rounded
 * corners, and flexbox properties. Inside the button, there is an `Icon` component that displays an
 * arrow icon based on the `direction` prop. The `onClick` event of the button triggers the
 * `scrollevent` function and the `actionOnClick` function.
 * @param {Object} param0
 * @param {string} [param0.leftArrow="icon-park-solid:left-one"] Add name for the Icon left arrow
 * @param {string} [param0.rightArrow="icon-park-solid:right-one"] Add name for the Icon right arrow
 * @param {*} param0.refVariable Pass the ref for the scrollbar to work on the div
 * @param {*} param0.actionOnClick Action to perdorm on the click
 * @param {string} param0.direction Mention the direction type
 * @param {string} param0.width To set width of the button
 * @param {string} param0.height To set height of the button
 * @param {string} param0.bgcolor To set the background color of the button
 * @param {number} param0.totalPages To set the total no. of pages
 * @param {number} param0.currentIndex Pass current index of the view
 * @param {*} param0.setCurrentIndex Function to set the current index
 */
function SlideArrow({
	leftArrow = "icon-park-solid:left-one",
	rightArrow = "icon-park-solid:right-one",
	refVariable,
	actionOnClick = () => {},
	direction,
	width = "48%",
	height,
	bgColor,
	totalPages,
	currentIndex,
	setCurrentIndex,
	disable = false,
}) {
	useEffect(() => {
		if (refVariable?.current) {
			const containerWidth = refVariable?.current.clientWidth;
			refVariable.current.scrollLeft = containerWidth * currentIndex;
		}
	}, [currentIndex]);

	const scrollToIndex = (index) => {
		if (refVariable?.current) {
			const containerWidth = refVariable?.current.clientWidth;
			refVariable?.current.scrollTo({
				left: containerWidth * index,
				behavior: "smooth",
			});
		}
	};

	const next = () => {
		if (currentIndex < totalPages - 1) {
			setCurrentIndex((prev) => prev + 1);
			scrollToIndex(currentIndex + 1);
		}
	};

	const prev = () => {
		if (currentIndex > 0) {
			setCurrentIndex((prev) => prev - 1);
			scrollToIndex(currentIndex - 1);
		}
	};

	return (
		<button
			className={`${
				bgColor || "bg-slide-button"
			} rounded-lg flex items-center justify-center disabled:bg-gray-400 `}
			disabled={disable}
			onClick={() => {
				direction === "left" ? prev() : next();
				actionOnClick();
			}}
			style={{ width: width, height: height }}>
			<Icon
				icon={direction === "left" ? leftArrow : rightArrow}
				width="30"
				height="30"
				color="#fff"
			/>
		</button>
	);
}

export default SlideArrow;
