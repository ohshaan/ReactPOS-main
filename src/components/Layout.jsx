import React from "react";
import { Footer, LeftHeader, RightHeader } from "../components";

/**
 * The `Layout` function in JavaScript React renders a custom container with left and right sections,
 * along with a footer component.
 * @returns The `Layout` function is returning a JSX element that consists of a custom container with
 * two sections - a left section and a right section. The left section is contained within a `div` with
 * a class of `w-4/12 bg-amber-300`, and the right section is contained within a `div` with a class of
 * `w-6/12 bg-amber-600
 * @param {Object} param0
 * @param {*} param0.leftSection Component which ned to be displayed on the left side of the layout. Accepts components
 * @param {*} param0.rightSection Component which ned to be displayed on the right side of the layout. Accepts components
 * @param {*} param0.className For parent layout
 * @param {*} param0.footer Boolean is enbale or not
 */
function Layout({ leftSection, rightSection, className, footer }) {
	const userDetails = JSON.parse(localStorage.getItem("user"));

	return (
		<>
			<div className={`lg:h-screen`}>
				<div
					className={`${
						footer ? "lg:h-[90%]" : "lg:h-full"
					} w-full flex flex-col lg:flex-row container m-auto ${className} px-2 md:px-5 lg:px-0 overflow-hidden flex-shrink`}>
					<div className="lg:w-6/12  p-2 flex flex-col bg-white">
						{userDetails &&
							window.location.pathname !== "/outletSelection" &&
							window.location.pathname !== "/" && <LeftHeader />}
						{leftSection}
					</div>
					<div className="lg:w-6/12 bg-primary rounded-t-xl lg:rounded-t-none lg:rounded-tl-4xl p-2 mt-5 lg:mt-0 h-full   ">
						{userDetails && window.location.pathname !== "/" && (
							<RightHeader userDetails={userDetails} />
						)}
						{rightSection}
					</div>
				</div>
				{footer && <Footer />}
			</div>
		</>
	);
}

export default Layout;
