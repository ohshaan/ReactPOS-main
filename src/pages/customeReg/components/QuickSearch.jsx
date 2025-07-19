import { Empty, Modal, Spin, Table } from "antd";
import { useTranslation } from "react-i18next";
import { useRef, useState, useEffect } from "react";
import Swal from "sweetalert2";
import { ScreenKeyBoard } from "../../../components"; // Assuming this path is correct
import { customerModel } from "../../../plugins/models";

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
};
const MOCK_CUSTOMER_DB = Array.from({ length: 25 }, (_, i) => ({
	customer_id: `CUST${1001 + i}`,
	customer_name: `Customer Name ${i + 1}`,
	mobile_no: `98765432${String(i).padStart(2, "0")}`.slice(0, 10),
	zone: `Zone ${String.fromCharCode(65 + (i % 5))}`,
	buildingno: `Bldg ${10 + i}`,
	street: `Street ${i + 1}`,
	unit: `Unit ${100 + i}`,
	landmark: `Near Park ${i % 3}`,
	city: i % 2 === 0 ? "Metropolis" : "Townsville",
	email_id: `customer${i}@example.com`,
	vehicle_no: `XYZ${100 + i}`,
	ref_no: `REF00${i}`,
	remarks: `Remark ${i}`,
	aggregator: i % 2 ? "Aggregator A" : "Aggregator B",
}));

const QuickSearch = ({ isModalOpen, setIsModalOpen, onLoad }) => {
	const keyboard = useRef(null);
	const { t } = useTranslation();
	const [inputValues, setInputValues] = useState({});
	const [focusedInputName, setFocusedInputName] = useState(null);
	const [customerData, setCustomerData] = useState(obj);
	const [customerList, setCustomerList] = useState([]);
	const [loading, isLoading] = useState(false);
	// Define field configurations
	const fieldConfigs = [
		{
			name: "name",
			placeholder: t("CUSTOMER_REG.NAME"),
			type: "text", // Corresponds to ScreenKeyBoard type=false (QWERTY)
		},
		{
			name: "mobile_no",
			placeholder: t("CUSTOMER_REG.MOBILE_NO"),
			type: "tel", // Corresponds to ScreenKeyBoard type=true (Numeric)
			maxLength: 10,
		},
		{
			name: "zone",
			placeholder: t("CUSTOMER_REG.ZONE"),
			type: "text", // Corresponds to ScreenKeyBoard type=false (QWERTY)
		},
		{
			name: "street",
			placeholder: t("CUSTOMER_REG.STREET"),
			type: "text", // Corresponds to ScreenKeyBoard type=false (QWERTY)
		},
	];

	const tableColumn = [
		{
			title: t("CUSTOMER_REG.NAME"),
			dataIndex: "customer_name",
			key: "customer_name",
			ellipsis: true,
			render: (text) => <span>{text}</span>,
		},
		{
			title: t("CUSTOMER_REG.MOBILE_NO"),
			dataIndex: "mobile_no",
			key: "mobile_no",
			ellipsis: true,
			render: (text) => (
				<span className="flex justify-center pr-4">{text}</span>
			),
		},
		{
			title: t("CUSTOMER_REG.ZONE"),
			dataIndex: "zone",
			key: "zone",
			ellipsis: true,
			render: (text) => <span>{text}</span>,
		},
		{
			title: t("CUSTOMER_REG.BUILDING_NO"),
			dataIndex: "buildingno",
			key: "buildingno",
			ellipsis: true,
			render: (text) => <span>{text}</span>,
		},
		{
			title: t("CUSTOMER_REG.STREET"),
			dataIndex: "street",
			key: "street",
			ellipsis: true,
			render: (text) => <span>{text}</span>,
		},
		{
			title: t("CUSTOMER_REG.UNIT"),
			dataIndex: "unit",
			key: "unit",
			ellipsis: true,
			render: (text) => <span>{text}</span>,
		},
		{
			title: t("CUSTOMER_REG.LANDMARK"),
			dataIndex: "landmark",
			key: "landmark",
			ellipsis: true,
			render: (text) => <span>{text}</span>,
		},
		{
			title: t("CUSTOMER_REG.CITY"),
			dataIndex: "city",
			key: "city",
			ellipsis: true,
			render: (text) => <span>{text}</span>,
		},
	];

	useEffect(() => {
		if (isModalOpen) {
			resetState(false);
			const initialValues = {};
			fieldConfigs.forEach((config) => {
				initialValues[config.key] = "";
			});
			setInputValues(initialValues);

			if (fieldConfigs.length > 0) {
				// Set initial focus to the first input
				handleInputFocus(fieldConfigs[0].key, "");
			} else {
				setFocusedInputName(null);
			}
		}
	}, [isModalOpen]); // Re-run when isModalOpen changes

	const getCustomerByMobile = (payload) => {
		isLoading("search");

		customerModel
			.getCustomerByMobile(payload || {})
			.then((data) => {
				if (data?.status === "true") {
					setCustomerList(data?.data);
				} else {
					Swal.fire({
						icon: "error",
						title: data?.Error?.Error_Msg || "Something went wrong",
					});
				}
			})
			.catch((error) => {
				console.error("Error while getting data by mobile no.", error);
				Swal.fire({
					icon: "error",
					title: t("COMMON.NETWORK_ERROR"),
				});
			})
			.finally(() => {
				isLoading(false);
			});
	};

	const handleInputFocus = (inputName, currentValue = "") => {
		setFocusedInputName(inputName);

		if (keyboard.current && typeof keyboard.current.setInput === "function") {
			keyboard.current.setInput(currentValue || inputValues[inputName] || "");
		}
	};

	const processValue = (name, value) => {
		let processedValue = value;
		const config = fieldConfigs.find((f) => f.name === name);

		if (name === "mobile") {
			processedValue = value.replace(/\D/g, ""); // Allow only digits
			if (config && config.maxLength) {
				processedValue = processedValue.slice(0, config.maxLength);
			}
		}
		// Add other processing for other fields if needed
		return processedValue;
	};

	// Handles changes from the physical/browser input fields
	const handleNativeInputChange = (e) => {
		const { name, value } = e.target;
		const processedValue = processValue(name, value);

		setInputValues((prev) => ({ ...prev, [name]: processedValue }));

		// If this input is focused and ScreenKeyBoard is active, update its display
		if (
			keyboard.current &&
			focusedInputName === name &&
			typeof keyboard.current.setInput === "function"
		) {
			keyboard.current.setInput(processedValue);
		}
	};

	// Handles changes from the ScreenKeyBoard
	// ScreenKeyBoard calls its onChange with: { target: { name: name, value: e } }
	const handleScreenKeyBoardChange = (event) => {
		// The 'event' here is the object { target: { name, value } } from ScreenKeyBoard
		const { name, value } = event.target; // name is focusedInputName, value is the keyboard string

		if (name) {
			// Ensure name is valid (it should be focusedInputName)
			const processedValue = processValue(name, value);
			setInputValues((prev) => ({ ...prev, [name]: processedValue }));
		}
	};

	const handleSearch = () => {
		//console.log("input values search", inputValues);
		const activeSearchTerms = fieldConfigs.filter(
			(fc) => inputValues[fc.name] && inputValues[fc.name].trim() !== ""
		);
		// if (activeSearchTerms.length === 0) {
		// 	Swal.fire(
		// 		"Input Required",
		// 		"Please enter at least one search term.",
		// 		"warning"
		// 	);
		// 	return;
		// }

		const payload = {
			mobile: inputValues?.mobile || "",
			customername: inputValues?.name || "",
			zone: inputValues?.zone || "",
			street: inputValues?.street || "",
		};

		const confirmPayload = activeSearchTerms.length === 0 ? {} : payload;
		setCustomerList([]); // Clear previous results
		setCustomerData(null);
		getCustomerByMobile(confirmPayload);
	};

	const resetState = () => {
		const initialValues = {};
		fieldConfigs.forEach((config) => {
			initialValues[config.name] = "";
		});
		setCustomerData(obj);
		setCustomerList([]);
		setInputValues(initialValues);
		setFocusedInputName(fieldConfigs.length > 0 ? fieldConfigs[0].name : null);
		if (keyboard.current && typeof keyboard.current.setInput === "function") {
			keyboard.current.setInput(""); // Clear the screen keyboard's display
		}
	};

	const handleCancel = () => {
		Swal.fire({
			title: t("SWAL.CLOSE_SEARCH_TITLE"),
			text: t("SWAL.CLOSE_SEARCH_TEXT"),
			icon: "question",
			showCancelButton: true,
			confirmButtonColor: "#3085d6",
			cancelButtonColor: "#d33",
			confirmButtonText: t("COMMON.OK"),
			cancelButtonText: t("COMMON.CANCEL"),
		}).then((result) => {
			if (result.isConfirmed) {
				setIsModalOpen(false);
				resetState(); // Reset input fields and keyboard on close
			}
		});
	};

	const handleClear = () => {
		const initialValues = {};
		fieldConfigs.forEach((config) => {
			initialValues[config.name] = "";
		});
		setInputValues(initialValues);
		getCustomerByMobile(null);
	};

	const handleLoadCustomer = () => {
		//console.log("Selected customer data", customerData);
		onLoad(customerData);
		setIsModalOpen(false);
		resetState();
	};

	useEffect(() => {
		if (isModalOpen) {
			getCustomerByMobile(null);
		}
	}, [isModalOpen]);

	const filterOptions = fieldConfigs.map((config) => ({
		inputProps: {
			// Renamed to avoid conflict with 'input' variable in map
			name: config.name,
			placeholder: config.placeholder,
			type: config.type, // native input type
			value: inputValues[config.name] || "",
			onChange: handleNativeInputChange,
			onFocus: () => handleInputFocus(config.name, inputValues[config.name]),
			style: { backgroundColor: "#D9D9D9", border: "none", color: "#333" },
			maxLength: config.maxLength,
			autoComplete: "off", // Good for custom keyboards
		},
		btnLabel: config.btnLabel,
		// action: () => handleSearch(config.name, inputValues[config.name]),
	}));

	const currentFocusedFieldConfig = fieldConfigs.find(
		(f) => f.name === focusedInputName
	);
	// Determine if ScreenKeyBoard should be numeric: true for 'tel', 'number', etc.
	const isKeyboardNumeric =
		currentFocusedFieldConfig?.type === "tel" ||
		currentFocusedFieldConfig?.type === "number";

	return (
		<div className="">
			<Modal
				title={<h1 className="text-xl font-semibold">{t("CUSTOMER_REG.QUICK_SEARCH")}</h1>}
				open={isModalOpen}
				width="90%"
				footer={null}
				style={{ top: 20, maxHeight: "90vh" }}
				onCancel={handleCancel}
				destroyOnClose // Good practice: unmounts children on close
			>
				<div className="flex flex-col gap-4 p-2">
					<div className="flex flex-row flex-wrap gap-2 sm:gap-2 p-3 bg-[#F2EDED] rounded-xl shadow-md w-full">
						{filterOptions.map((option) => (
							<div
								key={option.inputProps.name}
								className={`flex flex-col sm:flex-row items-stretch gap-2 flex-grow p-1`}>
								<input
									className="text-black font-medium p-2 py-2 rounded-md flex-grow outline-none focus:ring-2 focus:ring-primary placeholder:font-medium placeholder:text-black"
									{...option.inputProps}
								/>
							</div>
						))}
						<div className="flex flex-row gap-2">
							<button
								className="text-white bg-primary  hover:bg-primary-dark rounded-md transition-colors duration-150 ease-in-out whitespace-nowrap w-40"
								onClick={handleSearch}>
								{t("COMMON.SEARCH")}
							</button>
							<button
								className="text-white bg-danger  hover:bg-primary-dark  rounded-md transition-colors duration-150 ease-in-out whitespace-nowrap w-30 "
								onClick={handleClear}>
								{t("COMMON.CLEAR")}
							</button>
						</div>
					</div>

					<div className="bg-[#F2EDED] rounded-lg pb-1 flex-grow lg:overflow-auto">
						<Table
							className="lg:w-full"
							loading={{
								spinning: loading === "search",
								tip: t("COMMON.LOADING_DATA"),
								indicator: <Spin size="large" />,
							}}
							columns={tableColumn}
							dataSource={customerList}
							scroll={{ y: 250 }}
							pagination={{
								// pageSize: 10,
								showSizeChanger: true,
								pageSizeOptions: ["5", "10", "20", "50"], // available options
								showTotal: (total, range) =>
									t("PAGINATION_TOTAL", { start: range[0], end: range[1], total }),
							}}
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
											style={{
												backgroundColor: "#DED6D6",
												textAlign: "center",
											}}
										/>
									),
								},
								body: {
									wrapper: (props) => (
										<tbody {...props} className="bg-[#F2EDED] w-full h-20" />
									),
									cell: (props) => (
										<td
											{...props}
											className=" p-0 py-1 text-left pl-4"
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
									// getPreviousOrder(record?.customer_id);
								},
							})}
						/>
					</div>

					<div className="flex flex-row gap-4 justify-start w-full align-middle">
						<button
							className="text-white font-bold text-2xl bg-primary  hover:bg-primary-dark p-2 rounded-md transition-colors duration-150 ease-in-out whitespace-nowrap w-40"
							onClick={handleLoadCustomer}>
							{t("COMMON.LOAD")}
						</button>
						<button
							className="text-primary font-bold text-2xl outline-2 bg-white   hover:bg-primary-dark p-2 rounded-md transition-colors duration-150 ease-in-out whitespace-nowrap w-40 h-20"
							onClick={handleCancel}>
							{t("COMMON.CANCEL")}
						</button>
					</div>

					<div className="lg:block">
						{isModalOpen && focusedInputName && (
							<ScreenKeyBoard
								keyboard={keyboard}
								onChange={handleScreenKeyBoardChange}
								name={focusedInputName}
								type={isKeyboardNumeric}
							/>
						)}
					</div>
				</div>
			</Modal>
		</div>
	);
};

export default QuickSearch;
