import React, { useEffect, useRef, useState } from "react";
import { Layout, SlideArrow } from "../../components";
import { useTranslation } from "react-i18next";
import { Icon } from "@iconify/react";
import { clearFromBack, resetDial } from "../../utils/helpers/dialpad";
import { userModel } from "../../plugins/models";
// import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
// import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { Spin } from "antd";
import moment from "moment";
import { toast } from "react-toastify";
// import { formatRupees } from "../../utils/helpers";
// import { useSelector } from "react-redux";
import {
	// selectConfig,
	selectConfigLs,
} from "../../redux/selector/orderSlector";
import { sortByProperty } from "../../utils/helpers/sorting";
import { NumericFormat } from "react-number-format";

let obj = {
	company: "",
	outlet: "",
};
function OutletSelection() {
	const [amount, setAmount] = useState("");
	const [company, setCompany] = useState([]);
	const [outlet, setOutlet] = useState([]);
	const [companyIndex, setCompanyIndex] = useState(0);
	const [outletIndex, setOutletIndex] = useState(0);
    const { t } = useTranslation();
	const scrollCompanyRef = useRef(null);
	const scrollOutletRef = useRef(null);
	const itemsPerPage = 6;
	const totalCompanyPages = Math.ceil(company?.length / itemsPerPage);
	const totalOutletPages = Math.ceil(outlet?.length / itemsPerPage);
	const [selectedData, setSelectedData] = useState(obj);
	// const  userDetails  = useSelector((state) => state?.user?.userData); Will Use in future when token willbe implemneted
	const userDetails = JSON.parse(localStorage.getItem("user"));
	const cmpDate = localStorage.getItem("dateTime");
	const navigate = useNavigate();
	// const config1 = useSelector(selectConfig);
	const config = selectConfigLs;
	const [loading, isLoading] = useState(false);

	const DEFAULT_DECIMALS = 2; //todo

	useEffect(() => {
		getCompany();
	}, []);

	useEffect(() => {
		setAmount("");
	}, [selectedData?.company, selectedData?.outlet]);

	useEffect(() => {
		localStorage.setItem("openOutlet", null);
	}, [selectedData?.company]);

	/**
	 * The function `handleAmountChange` updates the amount state by adding the provided data to the
	 * previous amount.
	 */
	// const handleAmountChange = (data) => setAmount((prev) => prev + data);
	const handleAmountChange = (input) => {
		//console.log("input &&", input);
		// setAmount((prev) => {
		// 	let floatPrev = parseFloat(prev);
		// 	let floatInput = parseFloat(input);
		// 	let newValue = (floatPrev + floatInput).replace(/[^0-9.]/g, ""); // allow only digits & dot
		// 	//console.log({ newValue, floatPrev, floatInput });
		// 	const parts = newValue.split(".");
		// 	// Only allow one dot
		// 	if (parts.length > 2) {
		// 		newValue = parts[0] + "." + parts.slice(1).join("");
		// 	}

		// 	// Limit to 2 decimal places
		// 	if (parts[1]?.length > 2) {
		// 		parts[1] = parts[1].slice(0, 2);
		// 		newValue = parts.join(".");
		// 	}

		// 	// Limit total length to 10
		// 	if (newValue.length > 10) {
		// 		newValue = newValue.slice(0, 10);
		// 	}

		// 	return newValue;
		// });
		setAmount((prev) => {
			const sanitize = (val) => val?.toString().replace(/[^0-9.]/g, "") || "0";
			const sanitizedInput = sanitize(input);
			const hasDecimal = sanitizedInput.includes(".");

			if (!prev) prev = ".00";
			let newValue = prev;

			if (hasDecimal) {
				// If input contains a decimal, perform float addition
				const sum = (parseFloat(prev) + parseFloat(sanitizedInput)).toFixed(2);
				newValue = sum;
			} else {
				// Append digits to integer part (removing leading zeros)
				let [intPart, decimalPart = "00"] = prev.split(".");
				intPart = intPart.replace(/^0+/, "") || ""; // remove leading zeros but keep at least one zero
				const combined = intPart + sanitizedInput;
				newValue = `${combined}.${decimalPart.slice(0, 2).padEnd(2, "0")}`;
			}

			// Limit total length
			if (newValue.length > 10) {
				newValue = newValue.slice(0, 10);
			}

			//console.log({ newValue });
			return newValue;
		});
	};

	/**
	 * The `updateData` function updates the selected data by setting a specific name to a new value.
	 */
	const updateData = (name, value) =>
		setSelectedData((prev) => ({ ...prev, [name]: value }));

	/**
	 * The function `getCompany` retrieves company details for a user and sets the company data if
	 * successful, logging an error message if there is an issue.
	 */
	const getCompany = () => {
		userModel
			?.getCompany({ userid: userDetails?.userid })
			.then(
				(data) =>
					data?.status && setCompany(sortByProperty(data?.data, "companycode"))
			)
			.catch((error) => {
				//console.log("Error while getting company details", error);
			});
	};

	/**
	 * The function `getOutlet` retrieves outlet details based on employee and company IDs.
	 */
	const getOutlet = (id) => {
		isLoading("outlet");
		userModel
			?.getOutlet({ employeeid: userDetails?.employeeid, companyid: id })
			.then((data) => {
				data?.status && setOutlet(sortByProperty(data?.data, "Shm_Prefix_V"));
				isLoading(false);
			})
			.catch((error) => {
				//console.log("Error while getting outlet details", error);
				isLoading(false);
			});
	};

	const getOpeningCash = (id) => {
		// isLoading("openCash");
		const payload = {
			outletid: id,
			openingdate: moment(cmpDate).format("DD-MMM-YYYY"),
			userid: Number(userDetails?.userid),
		};
		userModel
			?.getOpeningCash(payload)
			.then((data) => {
				if (data.status === "true") {
					setAmount(data.data[0]?.openingcash.toString());
				} else {
					setAmount("");
				}
			})
			.catch(() => {
				toast.error(t("OUTLET_SELECTION.OPENING_CASH_LOAD_FAILED"));
				// isLoading(false);
			});
	};

	/**
	 * The `onInputPinChange` function  ensures that the input value only contains
	 * digits
	 */
	const onInputPinChange = (value) => {
		let newValue = value.replace(/[^0-9.]/g, ""); // Allow only numbers and decimal

		// Ensure only one decimal point exists
		const parts = newValue.split(".");
		if (parts.length > 2) {
			newValue = parts[0] + "." + parts.slice(1).join("");
		}

		// Limit decimal places to 2
		if (parts[1]?.length > 2) {
			parts[1] = parts[1].slice(0, 2);
			newValue = parts.join(".");
		}

		// Limit total length to 10 characters
		if (newValue.length > 10) {
			newValue = newValue.slice(0, 10);
		}

		setAmount(newValue);
	};

	const onSubmit = () => {
		if (!selectedData?.company)
			Swal.fire({ icon: "warning", title: t("OUTLET_SELECTION.SELECT_COMPANY") });
		else if (!selectedData?.outlet)
			Swal.fire({ icon: "warning", title: t("OUTLET_SELECTION.SELECT_OUTLET") });
		else if (!amount)
			Swal.fire({ icon: "warning", title: t("OUTLET_SELECTION.PLEASE_ENTER_OPENING_CASH") });
		else {
			isLoading("submit");
			userModel
				.addOpeningCash({
					outletid: selectedData?.outlet,
					opening_cash: amount,
					userid: userDetails?.userid,
				})
				.then((data) => {
					if (data?.status) {
						localStorage.setItem(
							"outletDetails",
							JSON.stringify({ ...selectedData, amount: amount })
						);
						navigate("/kot");
					} else Swal.fire({ icon: "error", title: data?.message });
					isLoading(false);
				})
				.catch((error) => {
					isLoading(false);
					//console.log("Error while saving opening cash", error);
				});
		}
	};

	const onCancel = () => {
		setSelectedData(obj);
		setOutlet([]);
		setAmount("");
	};

	return (
		<Layout
			leftSection={
				<div className="lg:p-5 ">
					{/* Select Comapny Section */}
					<div className="">
						<div className="bg-primary p-2 rounded-lg text-center text-white font-[600]">
							{t("OUTLET_SELECTION.SELECT_COMPANY")}
						</div>
					</div>

					<div
						className="flex overflow-auto w-full scrollbar-hidden"
						ref={scrollCompanyRef}>
						{totalCompanyPages ? (
							Array.from({ length: totalCompanyPages }, (_, pageIndex) => (
								<div
									key={pageIndex}
									className="grid grid-cols-3 gap-4 w-full shrink-0 p-4">
									{company
										.slice(
											pageIndex * itemsPerPage,
											(pageIndex + 1) * itemsPerPage
										)
										.map((company, index) => (
											<button
												className={`rounded-lg p-2 flex items-center max-h-10  justify-center text-black  border-[#C0C4C7] border-2 ${
													selectedData?.company === company?.companyid
														? "bg-secondary text-white"
														: "bg-outlet"
												} font-[600] `}
												key={index}
												onClick={() => {
													updateData("company", company?.companyid);
													getOutlet(company?.companyid);
												}}>
												{company?.companycode}
											</button>
										))}
								</div>
							))
						) : (
							<span className="col-span-3 flex items-center justify-center text-[#C0C4C7] w-full p-4 my-[50px]">
								{t("OUTLET_SELECTION.NO_COMPANY_FOUND")}
							</span>
						)}
					</div>
					<div className="flex justify-between items-center">
						<SlideArrow
							direction="left"
							refVariable={scrollCompanyRef}
							totalPages={totalCompanyPages}
							currentIndex={companyIndex}
							setCurrentIndex={setCompanyIndex}
							height="40px"
						/>
						<SlideArrow
							direction="right"
							refVariable={scrollCompanyRef}
							totalPages={totalCompanyPages}
							currentIndex={companyIndex}
							setCurrentIndex={setCompanyIndex}
							height="40px"
						/>
					</div>
					{/* Select the outlet */}
					<div className="mt-5">
						<div className="bg-primary p-2 rounded-lg text-center text-white font-[600]">
							{t("OUTLET_SELECTION.SELECT_OUTLET")}
						</div>
						{loading !== "outlet" ? (
							<div
								className="flex overflow-auto w-full scrollbar-hidden"
								ref={scrollOutletRef}>
								{totalOutletPages ? (
									Array.from({ length: totalOutletPages }, (_, pageIndex) => (
										<div
											key={pageIndex}
											className="grid grid-cols-3 gap-4 w-full shrink-0 p-4 ">
											{outlet
												.slice(
													pageIndex * itemsPerPage,
													(pageIndex + 1) * itemsPerPage
												)
												.map((item, index) => (
													<button
														className={`rounded-lg p-2  flex items-center justify-center max-h-10 border-[#C0C4C7] border-2 text-black ${
															selectedData?.outlet === item?.Shm_ID_N
																? "bg-secondary text-white"
																: "bg-outlet  "
														} font-[600]`}
														key={index}
														onClick={() => {
															//console.log("OSEL", item);
															updateData("outlet", item?.Shm_ID_N);
															localStorage.setItem(
																"openOutlet",
																JSON.stringify(item)
															);
															getOpeningCash(item?.Shm_ID_N);
															// handleOutletClick(item);
														}}>
														{item?.Shm_Prefix_V}
													</button>
												))}
										</div>
									))
								) : (
									<span className="col-span-3 flex items-center justify-center text-[#C0C4C7] w-full p-4 my-[50px]">
										{t("OUTLET_SELECTION.NO_OUTLET_FOUND")}
									</span>
								)}
							</div>
						) : (
							<span className="flex items-center justify-center  w-full p-4 my-[50px]">
								<Spin />
							</span>
						)}
						<div className="flex justify-between items-center mt-2">
							<SlideArrow
								direction="left"
								refVariable={scrollOutletRef}
								totalPages={totalCompanyPages}
								currentIndex={outletIndex}
								setCurrentIndex={setOutletIndex}
								height="40px"
							/>
							<SlideArrow
								direction="right"
								refVariable={scrollOutletRef}
								totalPages={totalCompanyPages}
								currentIndex={outletIndex}
								setCurrentIndex={setOutletIndex}
								height="40px"
							/>
						</div>
					</div>
				</div>
			}
			rightSection={
				<div className="p-2   mb-5   lg:flex lg:justify-center lg:items-center h-[90%] ">
					<div className="grid grid-cols-4 gap-2 lg:w-[60%] w-[80%] m-auto ">
						<div className="col-span-4 bg-[#355364] h-20 rounded-md p-2 flex justify-center items-center">
							{/* <input
								type="text"
								value={amount}
								className="text-white p-2 text-xl focus:outline-0 [&::-webkit-inner-spin-button]:appearance-none text-center"
								onChange={(e) => onInputPinChange(e?.target?.value)}
								onFocus={(e) => e.target.select()}
								onBlur={() => {
									setAmount(
										formatRupees(Number(amount), config?.amount, false)
									);
								}}
								placeholder="Opening Cash"
							/> */}

							<NumericFormat
								className="text-white p-2 text-xl focus:outline-0 [&::-webkit-inner-spin-button]:appearance-none text-center"
								id="otherAmount"
								name="otherAmount"
								decimalScale={config?.amount || DEFAULT_DECIMALS}
								thousandSeparator=","
								fixedDecimalScale
								allowLeadingZeros={false}
								maxLength={14}
								value={amount}
								placeholder={t("OUTLET_SELECTION.OPENING_CASH")}
								onFocus={(e) => e.target.select()}
								onValueChange={(values, event) => {
									if (!event?.event) return; // ✅ Guard clause to prevent undefined access

									// const target = event.event.target;
									// const { name } = target;
									const { value } = values;

									// if (value.length > 7) return;
									// onChange({ target: { name, value } });
									onInputPinChange(value);
									// onChange(, name);
								}}
							/>
						</div>
						{[1, 2, 3, 4, 5, 6, 7, 8]?.map((item) => {
							return (
								<button
									key={item}
									className="rounded-md p-2 flex justify-center items-center text-white h-15 text-xl font-bold bg-[#355364] "
									onClick={() => handleAmountChange(item.toString())}>
									{item}
								</button>
							);
						})}

						{/* Section consist of Submit /Cancel button */}
						<div className="col-span-4 gap-2 flex">
							{[
								9,
								0,
								"C",
								<Icon icon="mdi:arrow-left" width="24" height="24" />,
							]?.map((item, index) => {
								return (
									<button
										key={index}
										className={`rounded-md p-2 flex justify-center items-center text-white h-15  text-xl font-bold ${
											item === 9
												? "w-[25%] bg-[#355364]"
												: item === 0
												? "w-[35%] bg-[#355364]"
												: "w-[20%] bg-[#5F7887]"
										} `}
										onClick={() =>
											!isNaN(item)
												? handleAmountChange(item.toString())
												: item === "C"
												? resetDial(setAmount)
												: clearFromBack(setAmount)
										}>
										{item}
									</button>
								);
							})}
						</div>
						{/* Section consist of Submit /Cancel button */}
						<div className="col-span-4 gap-2 flex">
							<button
								className="rounded-md p-2 flex justify-center items-center text-white h-20 bg-danger w-[50%] text-xl font-bold"
								onClick={() => onCancel()}>
								{t("COMMON.CANCEL")}
							</button>
							<button
								className="rounded-md p-2 flex justify-center items-center text-white h-20 bg-success w-[50%] text-xl font-bold"
								onClick={() => {
									//console.log("clcc");
									onSubmit();
								}}
								disabled={loading}>
								{loading === "submit" ? <Spin /> : t("COMMON.SUBMIT")}
							</button>
						</div>
					</div>
				</div>
			}
			footer={true}
		/>
	);
}

export default OutletSelection;
