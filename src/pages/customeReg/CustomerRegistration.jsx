import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";

import { Empty, Input, Spin, Table } from "antd";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { customerModel } from "../../plugins/models";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { useDispatch, useSelector } from "react-redux";
import { updateCustomerData } from "../../redux/slices/customerSlice";
import { ScreenKeyBoard, ListSlider, SlideArrow } from "../../components";
import aggregatorModel from "../../plugins/models/agrregatorModel";
import { selectCustomer } from "../../redux/selector/cuatomerSelector";
import { convertToFormattedDate } from "../../utils/helpers";
import {
	customerOrderMod,
	emptyDishList,
	kotCust,
	kotEdit,
	kotPRev,
} from "../../redux/slices/orderSlice";
import QuickSearch from "./components/QuickSearch";
import {
	getIsDayClosed,
	userLogoutChecker,
} from "../../utils/helpers/logoutChecker";

let obj = {
	vehicle_no: "",
	ref_no: "",
	customer_name: "",
	code: "",
	mobile_no: "",
	email_id: "",
	zone: "",
	buildingno: "",
	street: "",
	unit: "",
	landmark: "",
	city: "",
	remarks: "",
	aggregator: "",
	reference_no: "",
	customeraddressdtlid: null,
};
function CustomerRegistration() {
	const { type } = useParams();
	const aggregatorRef = useRef(null);
	const userDetails = JSON.parse(localStorage.getItem("user"));
	const outletDetails = JSON.parse(localStorage.getItem("outletDetails"));
	const [customerData, setCustomerData] = useState(obj);
	const [customerList, setCustomerList] = useState([]);
	const [prevOrder, setPrevOrder] = useState([]);
	const [mobile, setMobile] = useState("");
	const [tempMno, setTempMno] = useState("");
	const [selectedOrder, setSelectedOrder] = useState(null);
	const navigate = useNavigate();
	const dispatch = useDispatch();
    const { t } = useTranslation();

	const customer = useSelector(selectCustomer);
	const tableColumn = [
		{
			title: t("CUSTOMER_REG.NAME"),
			dataIndex: "customer_name",
			key: "customer_name",
			render: (text) => <span>{text}</span>,
		},
		{
			title: t("CUSTOMER_REG.MOBILE_NO"),
			dataIndex: "mobile_no",
			key: "mobile_no",
			render: (text) => (
				<span className="flex justify-center pr-4">{text}</span>
			),
		},
		{
			title: t("CUSTOMER_REG.ZONE"),
			dataIndex: "zone",
			key: "zone",
			render: (text) => <span>{text}</span>,
		},
		{
			title: t("CUSTOMER_REG.BUILDING_NO"),
			dataIndex: "buildingno",
			key: "buildingno",
			render: (text) => <span>{text}</span>,
		},
		{
			title: t("CUSTOMER_REG.STREET"),
			dataIndex: "street",
			key: "street",
			render: (text) => <span>{text}</span>,
		},
		{
			title: t("CUSTOMER_REG.UNIT"),
			dataIndex: "unit",
			key: "unit",
			render: (text) => <span>{text}</span>,
		},
		{
			title: t("CUSTOMER_REG.LANDMARK"),
			dataIndex: "landmark",
			key: "landmark",
			render: (text) => <span>{text}</span>,
		},
		{
			title: t("CUSTOMER_REG.CITY"),
			dataIndex: "city",
			key: "city",
			render: (text) => <span>{text}</span>,
		},
	];
	const [loading, isLoading] = useState(false);
	const [name, setName] = useState();
	const [aggregatorIndex, setAggregatorIndex] = useState(0);
	const [selected, setSelectedData] = useState();
	const [aggregator, setAggregator] = useState([]);
	const [aggLoaidng, setAggLoading] = useState(false);
	const [qsOpen, setQsOpen] = useState(false);

	const totalAggregator = Math.ceil(aggregator?.length / 5);

	const keyboard = useRef();

	const titles = {
		delivery: t("CUSTOMER_REG.DELIVERY"),
		pickup: t("CUSTOMER_REG.PICKUP"),
		carhop: t("CUSTOMER_REG.CARHOP"),
	};

	const titleText = !type
		? t("CUSTOMER_REG.CUSTOMER_REGISTRATION")
		: `${t("CUSTOMER_REG.CUSTOMER_REGISTRATION")} (${titles[type]})`;

	const prevColumn = [
		// {
		//   title: "Select",
		//   dataIndex: "description",
		//   key: "description",

		//   render: (text) => <span>{text}</span>,
		// },
		{
			title: t("CUSTOMER_REG.KOT_DATE"),
			dataIndex: "kot_date",
			key: "kot_date",
			render: (text) => <span>{convertToFormattedDate(text)}</span>,
		},
		{
			title: t("CUSTOMER_REG.REFERENCE_NO"),
			dataIndex: "reference_no",
			key: "reference_no",
			render: (text) => <span>{text}</span>,
		},
		{
			title: t("CUSTOMER_REG.DESCRIPTION"),
			dataIndex: "description_details",
			key: "description_details",
			render: (text) => <span>{text}</span>,
		},
	];

	useEffect(() => {
		getAggregatorList();
	}, []);

	useEffect(() => {
		if (customer) {
			setCustomerData(customer);
			setMobile(customer.mobile_no);
			getCustomerByMobile(customer.mobile_no);
			setSelectedData({
				id: customer.aggregator,
				aggregatorid: customer.aggregator,
			});
			//console.log("agg!!", customer.aggregator);
		}
	}, [customer]);

	useEffect(() => {
		//console.log({ selected });
	}, [selected]);

	useEffect(() => {
		//console.log("seelcted chagnes, selectedOrder", selectedOrder);
	}, [selectedOrder]);

	/**
	 * The function `manageMobile` limits the input value to 10 characters and only allows numeric values.
	 */
	const manageMobile = (e) => {
		let value = e?.target?.value;
		value = value?.slice(0, 10);
		if (value === "" || /^\d+$/.test(value)) {
			setMobile(value);
		}
		keyboard?.current.setInput(value);
	};

	/**
	 * The function `getCustomerByMobile` retrieves customer data based on a mobile number input and
	 * displays success or error messages accordingly.
	 */
	const getCustomerByMobile = (mno) => {
		const numberToSearch = mno || mobile;

		if (!numberToSearch) {
			Swal.fire({
				icon: "warning",
				title: t("CUSTOMER_REG.ENTER_MOBILE_NO"),
			});
			return;
		}

		isLoading("search");

		customerModel
			.getCustomerByMobile({ mobile: numberToSearch })
			.then((data) => {
				if (data?.status === "true") {
					setCustomerList(data?.data);
				} else {
					Swal.fire({
						icon: "error",
						title: data?.Error?.Error_Msg || t("CUSTOMER_REG.SOMETHING_WENT_WRONG"),
					});
				}
			})
			.catch((error) => {
				console.error("Error while getting data by mobile no.", error);
				Swal.fire({
					icon: "error",
					title: t("CUSTOMER_REG.NETWORK_ERROR"),
				});
			})
			.finally(() => {
				setTempMno("");
				isLoading(false);
			});
	};

	const getAggregatorList = () => {
		setAggLoading(true);
		aggregatorModel
			.getAggregator({
				outletid: outletDetails?.outlet,
			})
			.then((data) => {
				if (data?.status === "true") {
					setAggregator(data?.data);
				} else {
					setAggregator([]);
					toast.error(data?.message || t("CUSTOMER_REG.SOMETHING_WENT_WRONG"));
				}
				setAggLoading(false);
			})
			.catch((error) => {
				//console.log("Something went wrong", error);
			});
	};

	/**
	 * The function `getPreviousOrder` retrieves the previous order of a customer using their ID and
	 * handles the response accordingly.
	 */
	const getPreviousOrder = (id) => {
		customerModel
			.getPrevOrderByCustomer({
				customerid: id,
			})
			.then((data) => {
				if (data?.status === "true") {
					setPrevOrder(data?.data);
					setSelectedOrder(null);
				} else {
					// Swal.fire({
					// 	icon: "error",
					// 	title: data?.Error?.Error_Msg,
					// });
					setPrevOrder([]);
					setSelectedOrder(null);
					//console.log("get previous lsit error", data?.Error?.Error_Msg);
				}
			})
			.catch((error) => {
				//console.log("Error while getting pervious order", error)
			});
	};

	/**
	 * The `addNewCustomer` function adds a new customer to the customer model with specific data and
	 * handles success and error responses accordingly.
	 */
	const addNewCustomer = () => {
		isLoading("add");

		if (userLogoutChecker()) {
			isLoading(false);
			return;
		}

		customerModel
			.addCustomer({
				...customerData,
				mode: "INSERT",
				companyid: outletDetails?.company,
				userid: userDetails?.userid,
			})
			.then((data) => {
				if (data?.status === "true") {
					setCustomerData(obj);
					Swal.fire({
						icon: "success",
						title: data?.message,
					}).then((result) => {
						if (result.isConfirmed) {
							//console.log("Call mno agian!");
							getCustomerByMobile(tempMno);
						}
					});
				} else {
					if (data?.Error)
						Swal.fire({
							icon: "error",
							title: data?.Error?.Error_Msg,
						});
					else
						Swal.fire({
							icon: "error",
							title: data?.message,
						});
				}
				isLoading(false);
			})
			.catch((error) => {
				isLoading(false);
				toast.error(t("CUSTOMER_REG.SOMETHING_WENT_WRONG"));
				//console.log("Error while adding Customer", error);
			});
	};

	/**
	 * The function `updateCustomer` updates customer data in a customer model and handles success and
	 * error responses accordingly.
	 */
	const updateCustomer = async () => {
		const { result, error } = await getIsDayClosed();

		if (!result) {
			Swal.fire({
				icon: "warning",
				title: error ? error : t("CUSTOMER_REG.DAY_CLOSED"),
				text: !error && t("CUSTOMER_REG.CANNOT_PAY_INVOICE"),
			});
			return;
		}
		isLoading("add");
		customerModel
			.addCustomer({
				...customerData,
				mode: "UPDATE",
				companyid: outletDetails?.company,
				userid: userDetails?.userid,
			})
			.then((data) => {
				if (data?.status === "true") {
					Swal.fire({
						icon: "success",
						title: t("CUSTOMER_REG.DATA_UPDATED"),
					});
				} else
					Swal.fire({
						icon: "error",
						title: data?.Error?.Error_Msg,
					});
				isLoading(false);
			})
			.catch((error) => {
				isLoading(false);
				toast.error(t("CUSTOMER_REG.SOMETHING_WENT_WRONG"));
				//console.log("Error while adding Customer", error);
			});
	};

	const handleDuplicate = async () => {
		if (!selectedOrder) {
			return;
		}

		if (userLogoutChecker()) {
			return;
		}

		const { result, error } = await getIsDayClosed();

		if (!result) {
			Swal.fire({
				icon: "warning",
				title: error ? error : t("CUSTOMER_REG.DAY_CLOSED"),
				text: !error && t("CUSTOMER_REG.CANNOT_PAY_INVOICE"),
			});
			return;
		}

		//console.log("duplicate clicked");
		dispatch(customerOrderMod(selectedOrder));
		navigate("/kot");
		dispatch(kotEdit(false));
		dispatch(kotPRev(true));
		dispatch(emptyDishList());
		// setSelectedOrder(selectedOrder);
		// orderModel.getKotDetails()
	};

	const handleOnChange = (e) => {
		let { value, name } = e.target;
		if (name === "mobile_no") {
			value = value.replace(/\D/g, "");
			value = value?.slice(0, 10);
			setTempMno(value);
		}
		setCustomerData((prev) => ({
			...prev,
			[name]: value,
		}));

		keyboard?.current.setInput(value);
	};

	const handleSelectAggregator = () => {
		//console.log("seelcted aggregated", selected);
		setCustomerData((prev) => ({
			...prev,
			aggregator: selected?.aggregatorid,
		}));
	};

	const onClear = () => {
		setCustomerData(obj);
		setCustomerList([]);
		setPrevOrder([]);
		setSelectedOrder(null);
		setMobile("");
	};

	const onProceedToOrder = async () => {
		//console.log("asdasd", type);
		//console.log("customer data", customerData);

		if (userLogoutChecker()) {
			return;
		}

		const { result, error } = await getIsDayClosed();

		if (!result) {
			Swal.fire({
				icon: "warning",
				title: error ? error : t("CUSTOMER_REG.DAY_CLOSED"),
				text: !error && t("CUSTOMER_REG.CANNOT_PAY_INVOICE"),
			});
			return;
		}

		if (type === "carhop") {
			if (customerData?.vehicle_no === "") {
				Swal.fire({
					icon: "warning",
					title: t("CUSTOMER_REG.PROVIDE_VEHICLE_NUMBER"),
				});
				return;
			}
		}

		if (type === "pickup") {
			if (customerData?.vehicle_no === "" || customerData?.aggregator === "") {
				Swal.fire({
					icon: "warning",
					title: t("CUSTOMER_REG.PROVIDE_VEHICLE_NUMBER_OR_SELECT_LEDGER"),
				});
				return;
			}
		}

		if (type === "carhop" || type === "pickup" || customerData?.customer_id) {
			//console.log("laod customer", customerData);
			dispatch(updateCustomerData(customerData));
			dispatch(kotCust(true));
			navigate("/kot");
		} else
			Swal.fire({
				icon: "warning",
				title: t("CUSTOMER_REG.SELECT_CUSTOMER_TO_PROCEED"),
			});
	};
	const handleFocus = (e) => {
		const { value, name } = e.target;
		setName(name);
		keyboard?.current.setInput(value);
	};

	const handleQs = () => {
		setQsOpen(true);
	};

	const handleOnLoad = (data) => {
		//console.log("Data laoded form modal", data);
		setCustomerList([data]);
		setCustomerData(data);
		loadFormData(data, true);
		setMobileNonFetch(data);
	};

	const setMobileNonFetch = (data) => {
		setMobile(data?.mobile_no || "");
		getCustomerByMobile(data?.mobile_no);
	};

	const loadFormData = (data, exclude) => {
		setCustomerData({
			customer_name: data?.customer_name || "",
			mobile_no: data?.mobile_no || "",
			email_id: data?.email_id || "",
			zone: data?.zone || "",
			buildingno: data?.buildingno || "",
			street: data?.street || "",
			unit: data?.unit || "",
			landmark: data?.landmark || "",
			city: data?.city || "",
			remarks: data?.remarks || "",
			reference_no: exclude ? "" : data?.customer_code || "",
			customeraddressdtlid: data?.customeraddressdtlid || "",
		});
	};

	return (
		<div className="p-2 flex flex-col h-screen overflow-auto lg:overflow-hidden gap-1 relative">
			{/* Top Header section */}
			<div className="flex justify-between items-center">
				<span className="font-[600] text-lg w-11/12 text-center">
					{titleText}
				</span>
				<Icon
					icon="carbon:close-filled"
					width="30"
					height="30"
					className="cursor-pointer"
					onClick={() => navigate(-1)}
				/>
			</div>

			{/* Car Hop - Pick up - Delivery */}
			{type && type === "carhop" && (
				<div className="flex flex-wrap items-center gap-1 pb-1">
					<div className="flex items-center gap-1">
						{t("CUSTOMER_REG.VEHICLE_NO")}:
						<div className="bg-[#D9D9D9] p-2 rounded-lg flex items-center gap-2 w-50">
							<Input
								placeholder= {t("CUSTOMER_REG.VEHICLE_NO_PLACEHOLDER")}
								type="text"
								name="vehicle_no"
								value={customerData?.vehicle_no}
								onChange={(e) => handleOnChange(e)}
								onFocus={(e) => handleFocus(e)}
								style={{ backgroundColor: "#D9D9D9", border: "none" }}
							/>
						</div>
					</div>
				</div>
			)}

			{type && type === "pickup" && (
				<div className="flex flex-wrap items-center gap-1 pb-1">
					{/* Vehicle No */}
					<div className="flex items-center gap-1">
						{t("CUSTOMER_REG.VEHICLE_NO")}:
						<div className="bg-[#D9D9D9] p-2 rounded-lg flex items-center gap-2 w-50">
							<Input
								placeholder={t("CUSTOMER_REG.VEHICLE_NO_PLACEHOLDER")}
								type="text"
								name="vehicle_no"
								value={customerData?.vehicle_no}
								onChange={(e) => handleOnChange(e)}
								onFocus={(e) => handleFocus(e)}
								style={{ backgroundColor: "#D9D9D9", border: "none" }}
							/>
						</div>
					</div>
					{/* Ref No */}
					<div className="flex items-center gap-1">
						placeholder={t("CUSTOMER_REG.REF_NO_PLACEHOLDER")}

						<div className="bg-[#D9D9D9] p-2 rounded-lg flex items-center gap-2 w-50">
							<Input
								placeholder={t("CUSTOMER_REG.REF_NO_PLACEHOLDER")}
								type="text"
								name="ref_no"
								value={customerData?.ref_no}
								onChange={(e) => handleOnChange(e)}
								onFocus={(e) => handleFocus(e)}
								style={{ backgroundColor: "#D9D9D9", border: "none" }}
							/>
						</div>
					</div>

					<div className="flex flex-1 h-fit items-center justify-between  ">
						<SlideArrow
							direction="left"
							currentIndex={aggregatorIndex}
							setCurrentIndex={setAggregatorIndex}
							width="50px"
							height="100%"
							refVariable={aggregatorRef}
							totalPages={totalAggregator}
						/>
						{aggLoaidng ? (
							<Spin />
						) : (
							<ListSlider
								componentRef={aggregatorRef}
								itemsPerPage={5}
								mainData={aggregator}
								totalPages={totalAggregator}
								buttonClass="h-10"
								name="aggregatorname"
								id="aggregatorid"
								setSelectedData={setSelectedData}
								selected={selected}
								action={handleSelectAggregator}
							/>
						)}
						<SlideArrow
							direction="right"
							currentIndex={aggregatorIndex}
							setCurrentIndex={setAggregatorIndex}
							width="50px"
							height="100%"
							refVariable={aggregatorRef}
							totalPages={totalAggregator}
						/>
					</div>
				</div>
			)}

			{/* Top Buttons Section */}
			<div className="flex flex-wrap items-center gap-1">
				<div className="flex items-center gap-1 flex-2">
					{t("CUSTOMER_REG.MOBILE_NO")}:
					<div className="bg-[#D9D9D9] p-2 rounded-lg flex items-center gap-2 flex-1">
						<Input
							placeholder={t("CUSTOMER_REG.MOBILE_NO_PLACEHOLDER")}
							style={{ backgroundColor: "#D9D9D9", border: "none" }}
							value={mobile}
							onChange={(e) => manageMobile(e)}
							name="searchMob"
							onFocus={(e) => handleFocus(e)}
						/>
					</div>
				</div>

				<button
					className="bg-success text-white p-2 rounded-lg flex-1"
					onClick={() => getCustomerByMobile(null)}
					disabled={loading === "search" ? true : false}>
					{loading === "search" ? <Spin /> : t("CUSTOMER_REG.SEARCH")}
				</button>
				<button
					className="bg-success text-white p-2 rounded-lg flex-1 max-h-10 "
					onClick={handleQs}>
					{t("CUSTOMER_REG.QUICK_SEARCH")}
				</button>
				{customerData?.customer_id ? (
					<button
						className="bg-success text-white p-2 rounded-lg flex-1"
						onClick={updateCustomer}
						disabled={loading === "add" ? true : false}>
						{loading === "add" ? <Spin /> : t("CUSTOMER_REG.UPDATE")}
					</button>
				) : (
					<button
						className="bg-success text-white p-2 rounded-lg flex-1"
						onClick={addNewCustomer}
						disabled={loading === "add" ? true : false}>
						{loading === "add" ? <Spin /> : t("CUSTOMER_REG.ADD_NEW")}
					</button>
				)}
				<button
					className="bg-danger text-white p-2 rounded-lg flex-1"
					onClick={onClear}>
					{t("COMMON.CLEAR")}
				</button>
			</div>

			{/* Table Section */}
			<div className="bg-[#F2EDED] rounded-lg pb-1 flex-grow lg:overflow-auto h-[350px]">
				<Table
					className="lg:w-full overflow-auto"
					columns={tableColumn}
					dataSource={customerList}
					pagination={false}
					locale={{
						emptyText: (
							<div className="w-full h-full flex items-center justify-center bg-[#F2EDED] py-4">
								<Empty description={t("CUSTOMER_REG.NO_CUSTOMERS_FOUND")} />

							</div>
						),
					}}
					components={{
						header: {
							cell: (props) => (
								<th
									{...props}
									style={{ backgroundColor: "#DED6D6", textAlign: "center" }}
								/>
							),
						},
						body: {
							wrapper: (props) => (
								<tbody {...props} className="bg-[#F2EDED] w-full h-full" />
							),
							cell: (props) => (
								<td
									{...props}
									className=" p-0 py-1 pl-4 text-left"
									style={{
										borderBottom: "1px solid #DED6D6",
									}}
								/>
							),
						},
					}}
					onRow={(record) => ({
						className: `${
							record?.customer_id === customerData?.customer_id
								? "bg-[#DED6D6]"
								: "bg-[#F2EDED]"
						} cursor-pointer hover:bg-gray-300`,
						onClick: () => {
							setCustomerData(record);
							getPreviousOrder(record?.customer_id);
						},
					})}
				/>
			</div>
			{/* Details Section */}
			<div className="flex flex-col lg:flex-row flex-grow lg:overflow-hidden gap-1">
				<div className="lg:w-4/12  overflow-auto  ">
					<div className="bg-[#F7F3F3] p-2 rounded-lg ">
						<div className="grid grid-cols-[auto_1fr] gap-1 items-center text-black">
							<label className="font-[500]">{t("CUSTOMER_REG.NAME")} :</label>
							<input
								className="bg-[#D9D9D9] p-1 rounded w-full"
								type="text"
								name="customer_name"
								value={customerData?.customer_name}
								onChange={(e) => handleOnChange(e)}
								onFocus={(e) => handleFocus(e)}
							/>
							<label className="font-[500]">{t("CUSTOMER_REG.MOBILE_NO")} :</label>
							<input
								className="bg-[#D9D9D9] p-1 rounded w-full"
								type="text"
								name="mobile_no"
								value={customerData?.mobile_no}
								onChange={(e) => handleOnChange(e)}
								onFocus={(e) => handleFocus(e)}
							/>

							<label className="font-[500]">{t("CUSTOMER_REG.EMAIL")} :</label>
							<input
								className="bg-[#D9D9D9] p-1 rounded w-full"
								type="text"
								name="email_id"
								value={customerData?.email_id}
								onChange={(e) => handleOnChange(e)}
								onFocus={(e) => handleFocus(e)}
							/>
						</div>
					</div>
					<div className="bg-[#F7F3F3] mt-1 p-2 rounded-lg  ">
						<div className="grid grid-cols-[auto_1fr] gap-1 items-center text-black">
							<label className="font-[500]">{t("CUSTOMER_REG.ZONE")} :</label>
							<input
								className="bg-[#D9D9D9] p-1 rounded w-full"
								type="text"
								name="zone"
								value={customerData?.zone}
								onChange={(e) => handleOnChange(e)}
								onFocus={(e) => handleFocus(e)}
							/>

							<label className="font-[500]">{t("CUSTOMER_REG.BUILDING_NO")} :</label>
							<input
								className="bg-[#D9D9D9] p-1 rounded w-full"
								type="text"
								name="buildingno"
								value={customerData?.buildingno}
								onChange={(e) => handleOnChange(e)}
								onFocus={(e) => handleFocus(e)}
							/>

							<label className="font-[500]">{t("CUSTOMER_REG.STREET")} :</label>
							<input
								className="bg-[#D9D9D9] p-1 rounded w-full"
								type="text"
								name="street"
								value={customerData?.street}
								onChange={(e) => handleOnChange(e)}
								onFocus={(e) => handleFocus(e)}
							/>
							<label className="font-[500]">{t("CUSTOMER_REG.UNIT")} :</label>
							<input
								className="bg-[#D9D9D9] p-1 rounded w-full"
								type="text"
								name="unit"
								value={customerData?.unit}
								onChange={(e) => handleOnChange(e)}
								onFocus={(e) => handleFocus(e)}
							/>

							<label className="font-[500]">{t("CUSTOMER_REG.LANDMARK")} :</label>
							<input
								className="bg-[#D9D9D9] p-1 rounded w-full"
								type="text"
								name="landmark"
								value={customerData?.landmark}
								onChange={(e) => handleOnChange(e)}
								onFocus={(e) => handleFocus(e)}
							/>

							<label className="font-[500]">{t("CUSTOMER_REG.CITY")} :</label>
							<input
								className="bg-[#D9D9D9] p-1 rounded w-full"
								type="text"
								name="city"
								value={customerData?.city}
								onChange={(e) => handleOnChange(e)}
								onFocus={(e) => handleFocus(e)}
							/>
							<label className="font-[500]">{t("CUSTOMER_REG.REMARKS")} :</label>
							<input
								className="bg-[#D9D9D9] p-1 rounded w-full"
								type="text"
								name="remarks"
								value={customerData?.remarks}
								onChange={(e) => handleOnChange(e)}
								onFocus={(e) => handleFocus(e)}
							/>
							<label className="font-[500]">{t("CUSTOMER_REG.ORDER_REFERENCE_NO")} :</label>
							<input
								className="bg-[#D9D9D9] p-1 rounded w-full"
								type="text"
								name="reference_no"
								value={customerData?.reference_no}
								onChange={(e) => handleOnChange(e)}
								onFocus={(e) => handleFocus(e)}
							/>
						</div>
					</div>
				</div>
				<div className="lg:w-8/12 flex flex-col overflow-hidden gap-1">
					<div className="bg-primary text-center w-full rounded-lg p-1 text-white">
						{t("CUSTOMER_REG.PREVIOUS_ORDER_DETAILS")}
					</div>
					<div className="bg-[#F2EDED] rounded-lg  pb-1 flex-grow overflow-auto">
						<Table
							className="w-full"
							scroll={{ y: 200 }}
							columns={prevColumn}
							dataSource={prevOrder}
							pagination={false}
							components={{
								header: {
									cell: (props) => (
										<th
											{...props}
											style={{
												backgroundColor: "#DED6D6",
											}}
										/>
									),
								},
								body: {
									wrapper: (props) => (
										<tbody {...props} className="bg-[#F2EDED] w-full h-full" />
									),
									cell: (props) => (
										<td
											{...props}
											className=" p-0 py-1 pl-4"
											style={{
												borderBottom: "1px solid #DED6D6",
											}}
										/>
									),
								},
							}}
							onRow={(item) => ({
								className: `${
									item?.reference_no === selectedOrder?.reference_no
										? "bg-[#DED6D6]"
										: "bg-[#F2EDED]"
								} cursor-pointer hover:bg-gray-300`,
								onClick: () => {
									//console.log("order clicked", item, selectedOrder);
									setSelectedOrder(item);
								},
							})}
						/>
					</div>
					<div className="flex items-center gap-2 ">
						<button
							className={`rounded-lg flex-[1]   p-3 cursor-pointer ${
								selectedOrder ? "bg-primary " : "bg-gray-300"
							} ${selectedOrder ? "text-white" : "text-gray-500"} ${
								selectedOrder ? "cursor-pointer" : "cursor-not-allowed"
							}`}
							disabled={!selectedOrder}
							onClick={handleDuplicate}>
							{t("CUSTOMER_REG.DUPLICATE")}

						</button>
						<button
							className="rounded-lg flex-[1] bg-success text-white p-3  "
							onClick={onProceedToOrder}>
							{t("CUSTOMER_REG.PROCEED_TO_ORDER")}
						</button>
					</div>
				</div>
			</div>
			<div className="hidden lg:block ">
				{" "}
				<ScreenKeyBoard
					onChange={name === "searchMob" ? manageMobile : handleOnChange}
					name={name}
					keyboard={keyboard}
					type={name === "searchMob"}
					className="mt-2"
				/>{" "}
			</div>

			<QuickSearch
				isModalOpen={qsOpen}
				setIsModalOpen={setQsOpen}
				onLoad={handleOnLoad}
			/>
		</div>
	);
}

export default CustomerRegistration;
