import React from "react";
import { useSelector } from "react-redux";
import { companyLogo } from "../assets/images";
import { getStoredCompanyLogo } from "../utils/helpers";
// import { selectOrderType } from "../redux/selector/orderSlector";

function LeftHeader() {
	// const { comapnyLogoApi } = useSelector((state) => state?.user);
	const { customer } = useSelector((state) => state?.customer);
	const { table, orderType } = useSelector((state) => state?.order);

       const getCompanyLogo = getStoredCompanyLogo();

	return (
		<div className="bg-[#F2EDED] w-full rounded-lg p-2 flex items-center">
			<div className="w-4/12">
				<img
					src={getCompanyLogo}
					alt="company-logo"
					width={"100%"}
					height={"100%"}
					className="w-10"
				/>
			</div>
			<div className="w-8/12 rounded-lg bg-[#EDE0E0] p-2 text-end text-black">
				{customer?.customer_name} |{" "}
				{table?.tableDetails?.tablecode &&
					table?.tableDetails?.tablecode + " |"}{" "}
				{orderType?.name}
			</div>
		</div>
	);
}

export default LeftHeader;
