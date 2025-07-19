/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { message, Table, Tooltip } from "antd";
import {
	customerOrderMod,
	emptyDishList,
	// kotDetails,
	// addDish,
	// addTopping,
	// manageQtyKeyboard,
	removeDish,
	removeFullDish,
	resetOrder,
	updateConfig,
	// emptyDishList,
	updateDish,
	// updateOrderType,
	// addAllDish,
} from "../../redux/slices/orderSlice";
import {
	selectAdvanceOrder,
	// selectOrderType,
	// selectConfig,
	selectConfigLs,
	selectKotDetails,
	selectOrderType,
	selectSelectedMenuList,
	selectTable,
	// selectTable,
	selectTotal,
} from "../../redux/selector/orderSlector";
import { Layout } from "../../components";
import { AdlerLogo } from "../../assets/images";
import { useDispatch, useSelector } from "react-redux";
import {
	OrderSummary,
	PaymentActions,
	SlabDetails,
	CustomerDetails,
	FooterActions,
	FooterSection,
} from "./components/LeftSideComponent";
import { PaymentSection } from "./components/RightSideComponent";
import VirtualKeyboard from "./components/VirtualKeyboard";
import {
	NavigationType,
	useLocation,
	useNavigate,
	useNavigationType,
} from "react-router-dom";
import SlabList from "./components/SlabModal";
import { selectSlabData } from "../../redux/selector/paySelector";
import payModel from "../../plugins/models/payModel";
import { toast } from "react-toastify";
import moment from "moment";
import { updateSlab } from "../../redux/slices/paySlice";
import { selectCustomer } from "../../redux/selector/cuatomerSelector";
import { updateCustomerData } from "../../redux/slices/customerSlice";
import {
	getOrderDetails,
	// transformOrderDataWithFullPackagePrice,
	transformOrderDataWithFullPackagePriceAndFlatten,
} from "../../utils/helpers/InvoiceKotItemConverter";
import { showConfirmModal } from "../../components/ConfirmatinDialog";
import NumberInputModal from "../../components/PinINoutModal";
import { orderModel, userModel } from "../../plugins/models";
import { formatRupees, unformatRupees } from "../../utils/helpers";
import { useInvoiceDetailPrinter } from "../kot/hooks/invoice_print";
import { useSampleThermalReceiptPrinter } from "../../hooks/sampleThermalReciptGenarator";
import { debounce } from "lodash";
import { formatRoundedNumber } from "../../utils/helpers/roundup";
import {
	getIsDayClosed,
	userLogoutChecker,
} from "../../utils/helpers/logoutChecker";

const DEFAULT_DECIMALS = 2;
const MAX_INPUT_LENGTH = 14;
const MAX_TEXT_LENGTH = 20;
const RUPEE_FIELD_NAMES = {
	DISCOUNT_AMT: "discountAmt",
	DISCOUNT_PERCENT: "discountPercent",
	DELIVERY_CHARGE: "deliveryCharge",
	STAFF_AMT: "staffAmt",
	WASTAGE_AMT: "staffAmtWastage",
	OTHER_PAYMENT: "opAmount",
};
const RUPEE_FIELDS_ARRAY = Object.values(RUPEE_FIELD_NAMES);

const FIELD_NAMES = {
	DISCOUNT_AMT: "discountAmt",
	DISCOUNT_PERCENT: "discountPercent",
	DELIVERY_CHARGE: "deliveryCharge",
	OTHER_PAYMENT: "opAmount",
	EMP_CODE_WASTAGE: "empCodeWastage", // Assuming you'll re-enable and integrate
	// Add other field names if they have special handling
};

// const sanitizeNumericInput = (value, decimals) => {
// 	if (value === null || value === undefined) value = "";
// 	let rawVal = String(value).replace(/[^0-9.]/g, ""); // 1. Remove non-numeric/decimal characters

// 	// 2. Prevent multiple decimals
// 	const parts = rawVal.split(".");
// 	if (parts.length > 2) {
// 		rawVal = parts[0] + "." + parts.slice(1).join("");
// 	}

// 	// 3. Limit to `decimals` digits after decimal
// 	if (parts.length === 2 && parts[1] && parts[1].length > decimals) {
// 		parts[1] = parts[1].slice(0, decimals);
// 		rawVal = parts.join(".");
// 	}
// 	return rawVal;
// };

const initialObj = {
	discountPercent: "",
	discountAmt: "",
	deliveryCharge: "",
	netAmount: "",
	mobile: "",
	name: "",
	address: "",
	slab: "",
	totalAmt: "",
	change: "",
	tips: "",
	paidAmt: "",
	cardNo: "",
	cardId: "",
	tipsCard: "",
	cardAmt: "",
	empCode: "",
	empName: "",
	empId: "",
	staffAmt: "",
	ledgerId: "",
	costCenterId: "",
	empCodeWastage: "",
	empNameWastage: "",
	staffAmtWastage: "",
	otherPayment: "",
	otherSettelement: "",
	osAmount: "",
	opAmount: "",
	opRemarks: "",
	osRefNo: "",
};

function Pay() {
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const location = useLocation();
	const navigationType = useNavigationType();
    const { t, i18n } = useTranslation();
	const focusedInputRef = useRef(null);
	const previousChildIdRef = useRef(null);
	const childValidateRef = useRef(null);
	const modalRef = useRef(null);
	const toastRef = useRef(null);
	const isUpdatingFromPercentRef = useRef(false);
	const isUpdatingFromAmountRef = useRef(false);

	const outletDetails = JSON.parse(localStorage.getItem("outletDetails"));
	const userDetails = JSON.parse(localStorage.getItem("user"));
	// const configDtl = JSON.parse(localStorage.getItem("config"));

	// const config1 = useSelector(selectConfig);
	const config = selectConfigLs;
	const table = useSelector(selectTable);
	const selectedMenuList = useSelector(selectSelectedMenuList);
	const advanceOrder = useSelector(selectAdvanceOrder);
	const orderType = useSelector(selectOrderType);
	const total = useSelector(selectTotal);
	const slabData = useSelector(selectSlabData);
	const customer = useSelector(selectCustomer);
	const reduxKotDetail = useSelector(selectKotDetails);
	// const getCompanyLogo = useSelector((state) => state?.user?.comapnyLogoApi);
	const getCompanyLogo = localStorage.getItem("cmpLogo");
	const amtDecimal = config?.amount || 2;

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedDish, setSelectedDish] = useState(null);
	const [showInvoiceList, setShowInvoiceList] = useState(false);
	const [, setSelectedType] = useState(null);
	const [invoiceList, setInvoiceList] = useState([]);
	const [name, setName] = useState();
	// const [modes, updateMode] = useState(false);
	// const [name, setName] = useState();

	// const [focusedInput, setFocusedInput] = useState(null);
	const [inputValues, setInputValues] = useState(initialObj);

	const [lastEditedField, setLastEditedField] = useState(null);
	const [printing, isPrinting] = useState(false);
	const [printingMsg, isPrintingMSg] = useState(null);
	const [selectedChild, setSelectedChild] = useState(null);

	const [cashBalance, setCashBalance] = useState({
		Cash: 0,
		Balance: 0,
		Advance: 0,
		TempBl: 0,
	});
	const [loading, setLoading] = useState(false);
	const [currentRow, setCurrentRow] = useState(null);
	const [userInputSource, setUserInputSource] = useState(null);
	const [invoiceId, setInvId] = useState(null);

	const templatesToPrint = "INV";

	const targetPrinter = import.meta.env.VITE_INV_PRINTER;

	const headerData = [
		{
			name: "ic:round-minus",
			onclick: () => {
				manageQty(false);
			},
			className: "text-icon",
		},
		{
			name: "ic:round-add",
			onclick: () => {
				manageQty(true);
			},
			className: "text-icon",
		},
		{
			name: "basil:edit-solid",
			onclick: () => {
				onEdit();
			},
			className: "text-icon",
		},
		{
			name: "material-symbols:delete",
			onclick: () => {
				dispatch(removeFullDish(selectedDish));
				setSelectedDish(null);
			},
			className: "bg-icon-delete text-white",
		},
		{
			name: showInvoiceList ? "material-symbols:cancel" : "mingcute:bill-fill",
			onclick: () => {
				// updateMode(showKotList ? false : true);
				setShowInvoiceList((prev) => !prev);
			},
			className: showInvoiceList ? "text-icon color-red" : "text-icon",
		},
	];

	const tableColumn = [
		{
			title: t("TABLE.DESCRIPTION"),
			dataIndex: "menuname",
			key: "index",
			width: 250,
			render: (text, record) => (
				<Tooltip
					title={
						record?.topping && (
							<span className="text-xs">{`( ${record?.topping?.map(
								(i) => i?.toping_name
							)} )`}</span>
						)
					}>
					<span className="w-[60%] whitespace-nowrap">
						{text}{" "}
						{record?.topping && (
							<span className="text-xs">{`( ${record?.topping?.map(
								(i) => i?.toping_name
							)} )`}</span>
						)}
					</span>
				</Tooltip>
			),
		},
		{
			title: t("TABLE.QTY"),
			dataIndex: "qty",
			key: "index",
			width: 80,
			render: (text) => (
				<span className="flex justify-end">
					{Number(text)?.toFixed(config?.quantity)}
				</span>
			),
		},
		{
			title: t("KOT.QTY"),
			dataIndex: "qty",
			key: "index",
			width: 80,
			render: (text) => (
				<span className="flex justify-end">
					{Number(text)?.toFixed(config?.quantity)}
				</span>
			),
		},
		{
			title: t("KOT.RATE"),
			dataIndex: "salesprice",
			key: "index",
			width: 100,
			render: (text) => (
				<span className="flex justify-end">
					{/* {Number(text)?.toFixed(config?.amount)} */}
					{formatRupees(Number(text), config?.amount, false)}
				</span>
			),
		},
		{
			title: t("KOT.AMOUNT"),
			dataIndex: "amount",
			key: "index",
			width: 100,
			render: (text) => (
				<span className="flex justify-end">
					{/* {Number(text)?.toFixed(config?.amount)} */}
					{formatRupees(Number(text), config?.amount, false)}
				</span>
			),
		},
	];

	const nestedColumns = [
		{
			title: t("KOT.DESCRIPTION"),
			dataIndex: "submenudesc",
			key: "index",
			ellipsis: true,
			width: 250,
			render: (text, record) => (
				<Tooltip
					title={
						record?.custom &&
						record?.custom.length !== 0 && (
							<span className="text-xs">{`( ${record?.custom?.map(
								(i) => i?.customizemenudesc
							)} )`}</span>
						)
					}>
					<span className="w-full whitespace-nowrap text-blue-500">
						{text}
						{record?.custom &&
							record?.custom.length !== 0 &&
							` ( ${record?.custom?.map((i) => i?.customizemenudesc)} )`}
					</span>
				</Tooltip>
			),
		},
		{
			title: t("KOT.QTY"),
			dataIndex: "submenuqty",
			key: "index",
			width: 80,
			render: (text) => (
				<span className="flex justify-end ">
					{Number(text)?.toFixed(config?.quantity)}
				</span>
			),
		},
		{
			title: t("KOT.RATE"),
			dataIndex: "submenuprice",
			key: "index",
			width: 100,
			render: (text, record) => {
				const basePrice = record?.submenuprice;

				const customTotal = record?.custom
					? record.custom.reduce((sum, item) => {
							const itemPrice = parseFloat(item.customizemenuprice);
							return sum + itemPrice;
					  }, 0)
					: 0;

				const totalAmount = Number(basePrice) + customTotal;
				return (
					<span className="flex justify-end">
						{formatRupees(totalAmount, config?.amount, false)}
					</span>
				);
			},
		},
		{
			title: t("KOT.AMOUNT"),
			dataIndex: "packagedtlid",
			key: "index",
			width: 100,
			render: (text, record) => {
				const basePrice = record?.submenuprice * record?.submenuqty;

				// Calculate total from custom items
				const customTotal = record?.custom
					? record.custom.reduce((sum, item) => {
							const itemPrice = item.qty * parseFloat(item.customizemenuprice);
							return sum + itemPrice;
					  }, 0)
					: 0;

				// Calculate final total amount
				const totalAmount = basePrice + customTotal;
				return (
					<span className="flex justify-end">
						{/* {(record?.submenuprice * record?.submenuqty)?.toFixed(config?.amount)} */}
						{formatRupees(totalAmount, config?.amount, false)}
					</span>
				);
			},
		},
	];

	const invoiceColumn = [
		{
			title: t("TABLE.DELETE"),
			dataIndex: "delete",
			key: "invoicehdrid",
			width: 80,
			render: (text, record) => (
				<button
					className=" rounded-lg p-1 text-center w-fit font-[500] text-red-600 hover:text-red-300  disabled:text-gray-400 disabled:cursor-not-allowed"
					disabled={record?.invoicestatus === "Not Verified" ? false : true}
					onClick={() => handleDeleteInvoice(record)}>
					<Icon icon={`material-symbols:delete`} width="24" height="24" />
				</button>
			),
		},
		{
			title: t("TABLE.INVOICE_NO"),
			dataIndex: "invoiceno",
			key: "invoicehdrid",
			width: 160,
			render: (text) => <span className="flex justify-center">{text}</span>,
		},
		{
			title: t("TABLE.INVOICE_DATE"),
			dataIndex: "invoicedate",
			key: "invoicehdrid",
			width: 160,
			render: (text) => (
				<span className="flex justify-center">
					{moment(text).isValid()
						? moment(text).format("DD-MMM-YYYY hh:mm A")
						: "---"}
				</span>
			),
		},
		{
			title: t("TABLE.INVOICE_STATUS"),
			dataIndex: "invoicestatus",
			key: "invoicehdrid",
			width: 140,
			render: (text) => (
				<span className="flex justify-center">
					{text === "Not Verified"
						? t("TABLE.UNSETTLED")
						: t("TABLE.SETTLED")}
				</span>
			),
		},

		{
			title: t("TABLE.AMOUNT"),
			dataIndex: "invoiceamount",
			key: "orderhdrid",
			width: 120,
			render: (text) => (
				<span className="flex justify-end-safe pr-1">
					{parseFloat(text).toFixed(config?.amount)}
				</span>
			),
		},
	];

	const getConfig = () => {
		userModel
			.getConfig()
			.then((data) => {
				if (data?.status === "true") {
					dispatch(
						updateConfig({
							amount: data?.data[1]?.configvalue,
							quantity: data?.data[0]?.configvalue,
							discount: data?.data[2]?.configvalue,
						})
					);
					const configData = {
						amount: data?.data[1]?.configvalue,
						quantity: data?.data[0]?.configvalue,
						discount: data?.data[2]?.configvalue,
					};
					//console.log({ configData });
					localStorage.setItem("config", JSON.stringify(configData));
				}
			})
			.catch((error) => {
				//console.log("error", error);
			});
	};

	// --- START: MODIFIED CODE ---

	// This is the new, single, authoritative useEffect for all financial calculations.
	// It replaces multiple conflicting effects.
	useEffect(() => {
		const numericTotal = parseFloat(total) || 0;
		const decimals = config?.amount ?? 2;

		// Get current values from state, parsing them as numbers
		const currentDiscountAmt = parseFloat(inputValues.discountAmt) || 0;
		const currentDiscountPercent = parseFloat(inputValues.discountPercent) || 0;
		const currentDeliveryCharge = parseFloat(inputValues.deliveryCharge) || 0;

		// Initialize next state with current values
		let nextDiscountAmt = currentDiscountAmt;
		let nextDiscountPercent = currentDiscountPercent;

		// Determine the source of truth for discount and recalculate the other field
		if (userInputSource === "percent") {
			// If user edited percentage, calculate the new amount
			const newAmt = (currentDiscountPercent / 100) * numericTotal;
			nextDiscountAmt = newAmt > numericTotal ? numericTotal : newAmt; // Cap discount at total
		} else if (userInputSource === "amount") {
			// If user edited amount, calculate the new percentage
			nextDiscountPercent =
				numericTotal > 0 ? (currentDiscountAmt / numericTotal) * 100 : 0;
		} else if (numericTotal === 0) {
			// If cart total is zero, reset discounts
			nextDiscountAmt = 0;
			nextDiscountPercent = 0;
		}
		// If userInputSource is null (e.g., on initial load or when `total` changes),
		// it defaults to using the existing `discountAmt` to recalculate the `discountPercent`.

		// Calculate final net amount and the rounded total amount
		const nextNetAmount =
			numericTotal - nextDiscountAmt + currentDeliveryCharge;
		const nextTotalAmt = Math.round(nextNetAmount);

		// Prepare a batch of updates
		const updates = {
			discountAmt: nextDiscountAmt.toFixed(decimals),
			discountPercent: nextDiscountPercent.toFixed(decimals),
			netAmount: nextNetAmount.toFixed(decimals),
			totalAmt: nextTotalAmt.toFixed(decimals),
		};

		// To prevent infinite loops, only update state if any calculated value has changed.
		if (
			updates.discountAmt !== inputValues.discountAmt ||
			updates.discountPercent !== inputValues.discountPercent ||
			updates.netAmount !== inputValues.netAmount ||
			updates.totalAmt !== inputValues.totalAmt
		) {
			//console.log("total amount", updates);
			setInputValues((prev) => ({
				...prev,
				...updates,
			}));
		}
	}, [
		total,
		inputValues.discountAmt,
		inputValues.discountPercent,
		inputValues.deliveryCharge,
		userInputSource,
		config?.amount,
	]);

	// --- END: MODIFIED CODE ---

	useEffect(() => {
		//console.log("!!!!%%%%");
		getConfig();
		if (orderType?.id === 4 || orderType?.id === 7) {
			setInputValues((prev) => ({
				...prev,
				deliveryCharge: config?.discount || "",
			}));
		}
		// Removed initial calculation logic from here as the new main useEffect handles it.

		return () => {
			dispatch(updateSlab(null));
			// dispatch(updateCustomerData(null));
		};
	}, []); // Removed `total` from dependencies to let the main effect handle it.

	useEffect(() => {
		if (location.pathname !== "/pay") {
			//console.log("this is location", location.pathname);
			// dispatch(updateCustomerData(null));
			// dispatch(updateSlab(null));
			// dispatch(updateCustomerData(null));
		}
	}, [location.pathname]);

	useEffect(() => {
		if (navigationType === NavigationType.Pop) {
			//console.log("🏅🏅🏅🏅🏅");
			// Trigger cleanup only on browser back/forward
			// dispatch(updateCustomerData(null));
			// dispatch(updateSlab(null));
			// dispatch(updateCustomerData(null));
		}
	}, [navigationType]);

	useEffect(() => {
		if (slabData) {
			//console.log("slab data ", slabData);
			if (
				slabData?.discountslabhdrid !== "" &&
				inputValues.netAmount !== "" &&
				inputValues.netAmount !== 0
			) {
				getSlabDiscount();
			} else {
				Swal.fire({
					icon: "warning",
					title: t("SWAL.MISSING_DATA"),
					text: t("SWAL.UNABLE_TO_LOAD_DISCOUNT"),
				});
			}
		}
	}, [slabData]);

	useEffect(() => {
		if (inputValues?.netAmount !== "") {
			const numericValue = parseFloat(inputValues?.netAmount) || 0;
			const advanceAmount = advanceOrder
				? parseFloat(advanceOrder?.total)
				: 0.0;
			// Delivery charge is already included in netAmount from the main useEffect
			const total = numericValue;
			const cashAmount = total - advanceAmount;

			//console.log("data!!", {
			// 	numericValue,
			// 	cashAmount,
			// 	advanceAmount,
			// });

			setCashBalance((prev) => ({
				...prev,
				Advance: advanceAmount,
			}));
			setInputValues((prev) => ({
				...prev,
				// totalAmt is now calculated in the main effect
				paidAmt: Math.round(cashAmount).toFixed(config?.amount || 2),
			}));
		}
	}, [inputValues.netAmount, advanceOrder, config?.amount]); // Kept this as it deals with payment logic

	useEffect(() => {
		//console.log("paid 🎯🎯🎯", inputValues);
		// Guard clause to prevent calculations on empty or invalid input
		if (inputValues?.paidAmt === "" || isNaN(parseFloat(inputValues.paidAmt))) {
			// When cleared, reset change and calculate the initial balance due
			const totalAmt = parseFloat(inputValues.totalAmt) || 0;
			const advanceAmount = advanceOrder
				? parseFloat(advanceOrder.total || 0)
				: 0.0;
			const initialBalance = totalAmt - advanceAmount;

			setInputValues((prev) => ({ ...prev, change: "0.00" }));
			setCashBalance((prev) => ({
				...prev,
				Balance: initialBalance > 0 ? initialBalance : 0,
				TempBl: initialBalance > 0 ? initialBalance : 0,
				Cash: 0,
			}));
			return;
		}

		//console.log("paid amount changed", inputValues.paidAmt);

		// 1. Get all the necessary numbers
		const totalAmt = parseFloat(inputValues.totalAmt) || 0;
		const paidAmt = parseFloat(inputValues.paidAmt) || 0;
		const advanceAmount = advanceOrder
			? parseFloat(advanceOrder.total || 0)
			: 0.0;

		// 2. Calculate the amount the customer needs to pay in this transaction
		const amountDueNow = totalAmt - advanceAmount;
		//console.log("amountDueNow", amountDueNow);

		// 3. Calculate the difference between what was paid and what was due
		const difference = paidAmt - amountDueNow;

		let changeToReturn = 0;
		let balanceStillOwed = 0;

		// 4. Determine if it's change to return or a balance still owed
		if (difference >= 0) {
			// Customer paid enough or overpaid
			changeToReturn = difference;
			balanceStillOwed = 0;
		} else {
			// Customer underpaid
			changeToReturn = 0;
			balanceStillOwed = -difference; // The balance owed is the positive version of the difference
		}

		const decimals = config?.amount || 2;

		// 5. Update the inputValues state with the correct change
		setInputValues((prev) => ({
			...prev,
			change: changeToReturn.toFixed(decimals),
		}));

		// 6. Update the cashBalance state with the correct balance
		setCashBalance((prev) => ({
			...prev,
			Balance: balanceStillOwed,
			TempBl: balanceStillOwed, // Assuming TempBl tracks the same
			Cash: paidAmt, // The cash received in this transaction
		}));
	}, [inputValues.paidAmt, inputValues.totalAmt, advanceOrder, config?.amount]);

	useEffect(() => {
		// 1. Get all the necessary numbers
		const totalAmt = parseFloat(inputValues.totalAmt) || 0;
		const paidAmt = parseFloat(inputValues.paidAmt) || 0; // Get cash paid
		const cardAmt = parseFloat(inputValues.cardAmt) || 0; // Get card paid
		const advanceAmount = advanceOrder
			? parseFloat(advanceOrder.total || 0)
			: 0.0;

		// 2. Calculate the total amount the customer is supposed to pay in this transaction
		const amountDueNow = totalAmt - advanceAmount;

		// 3. Calculate the total amount the customer has tendered so far (cash + card)
		const totalTendered = paidAmt + cardAmt;

		// 4. Calculate the difference. This will be negative if more is owed.
		const difference = totalTendered - amountDueNow;

		let balanceStillOwed = 0;

		// 5. If the difference is negative, the customer still owes money.
		if (difference < 0) {
			// The balance owed is the positive value of the shortfall.
			balanceStillOwed = -difference;
		}

		console.log("Input value changes", {
			balanceStillOwed,
			difference,
			totalTendered,
			amountDueNow,
			cardAmt,
		});
		console.log("input values", inputValues);
		// 6. Update the balance state.
		// We only update `Balance` and `TempBl`, as `Cash` is handled by the cash `useEffect`.
		setCashBalance((prev) => ({
			...prev,
			Balance: balanceStillOwed,
			TempBl: balanceStillOwed,
		}));
	}, [
		inputValues.paidAmt,
		inputValues.cardAmt,
		inputValues.totalAmt,
		advanceOrder,
		config?.amount,
	]);

	useEffect(() => {
		if (customer) {
			if (customer?.customer_name !== "" || customer?.mobile_no !== "") {
				const address =
					customer?.zone +
					"" +
					customer?.buildingno +
					"" +
					customer?.street +
					"" +
					customer?.unit +
					"" +
					customer?.landmark +
					"" +
					customer?.city;
				//console.log("%%%%%%");
				setInputValues((prev) => ({
					...prev,
					name: customer?.customer_name || "",
					mobile: customer?.mobile_no || "",
					address: address,
				}));
			}
		}
	}, [customer]);

	useEffect(() => {
		if (inputValues?.empCode !== "") {
			// //console.log("this is emp code", inputValues?.empCode);
			setInputValues((prev) => ({
				...prev,
				empName: inputValues?.empCode?.emp_edisplayname_v || "",
				// staffAmt: inputValues?.empCode?.staffamt || "",
			}));
			focusedInputRef.current = null;
		}
		if (inputValues?.empCodeWastage !== "") {
			setInputValues((prev) => ({
				...prev,
				empNameWastage: inputValues?.empCodeWastage?.emp_edisplayname_v || "",
				// staffAmt: inpu	tValues?.empCode?.staffamt || "",
			}));
			focusedInputRef.current = null;
		}
	}, [inputValues?.empCodeWastage, inputValues?.empCode]);

	useEffect(() => {
		if (loading === "save") {
			Swal.fire({
				title: t("SWAL.SAVING"),
				allowOutsideClick: false,
				didOpen: () => {
					Swal.showLoading();
				},
			});
		}
	}, [loading]);

	useEffect(() => {
		if (showInvoiceList) {
			getInvoiceList();
		} else {
			setSelectedDish(null);
		}
	}, [showInvoiceList]);

	useEffect(() => {
		if (orderType?.id === 4 || orderType?.id === 7) {
			setInputValues((prev) => ({
				...prev,
				deliveryCharge: config?.discount || "",
				// netAmount is now handled by the main useEffect
			}));
		}
	}, []);

	useEffect(() => {
		if (printing) {
			// Show toast and save the ID
			if (!toastRef.current) {
				toastRef.current = toast.loading(t("SWAL.PRINTING"));
			}
		} else {
			// Stop or update the toast
			if (toastRef.current) {
				toast.update(toastRef.current, {
					render: printingMsg.message,
					type: printingMsg.error ? "error" : "success",
					isLoading: false,
					autoClose: 2000,
				});
				toastRef.current = null;
			}
		}
	}, [printing]);

	useEffect(() => {
		//console.log("cash balance 🖍️✅🖍️", { cashBalance });
	}, [cashBalance]);

	const [triggerPrint, printStatus] = useInvoiceDetailPrinter({
		invoiceIdToPrint: invoiceId,
		printerName: targetPrinter, // e.g., "Main Receipt Printer"
		templateType: templatesToPrint, // e.g., "GO_CRISPY_INVOICE"
		orderModel: orderModel, // Pass your model instance
		onPrintInitiated: () => {
			//console.log(
			// 	`Initiating print for invoice ${invoiceId} to ${targetPrinter}`
			// );
			isPrinting(false);
		},

		onPrintSuccess: (message) => {
			//console.log(
			// 	`Invoice ${invoiceId} printed successfully to ${targetPrinter}: ${message}`
			// );
			isPrintingMSg({ message: t("SWAL.PRINTING_COMPLETED"), error: false });
			isPrinting(false);
		},
		onPrintError: (errorMsg) => {
			toast.error(
				`Invoice ${invoiceId} print error for ${targetPrinter}: ${errorMsg}`
			);
			isPrintingMSg({ message: t("SWAL.PRINTING_ERROR"), error: true });
			isPrinting(false);
		},
	});

	const handleInitiatePrint = () => {
		if (invoiceId) {
			isPrinting(true);
			triggerPrint();
		}
	};

	useEffect(() => {
		if (!printStatus.isLoading) {
			isPrinting(false);
		}
	}, [printStatus]);

	useEffect(() => {
		handleInitiatePrint();
	}, [invoiceId]);

	// useEffect(() => {
	// 	if (printStatus) //console.log({ printStatus });
	// }, [printStatus]);

	const getSlabDiscount = () => {
		payModel
			.loadSlabDiscount({
				invoicedate: moment().format("DD-MMM-YYYY"),
				grossamount: inputValues.netAmount,
				discountslabhdrid: slabData.discountslabhdrid,
			})
			.then((data) => {
				if (data?.status === "true") {
					//console.log("*****");
					// Set the user input source to 'percent' so the main effect recalculates the amount
					setUserInputSource("percent");
					setInputValues((prev) => ({
						...prev,
						discountPercent: data?.data[0]?.discountper,
					}));
				} else toast.error(data?.message || t("SWAL.SOMETHING_WENT_WRONG"));
			})
			.catch((error) => {
				//console.log("error in slab discount", error);
			});
	};

	const manageQty = (type) => {
		!selectedDish
			? Swal.fire({ icon: "warning", title: t("SWAL.SELECT_DISH") })
			: type
			? dispatch(updateDish(selectedDish))
			: dispatch(removeDish(selectedDish));
	};

	const getInvoiceList = () => {
		setLoading("invoiceList");
		payModel
			?.invoiceList({
				outletid: outletDetails?.outlet,
				invoicestatus: 1,
			})
			.then((data) => {
				if (data.status === "true") setInvoiceList(data?.data);
				else {
					setInvoiceList([]);
					toast.error(data?.Error?.Error_Msg);
				}
				setLoading(false);
			})
			.catch((error) => {
				//console.log("Error while getting KOT list", error);
				setLoading(false);
			});
	};

	const onEdit = () => {
		if (!selectedDish)
			Swal.fire({
				icon: "warning",
				title: t("SWAL.SELECT_DISH"),
			});
		else {
			if (selectedDish?.menupackageitem) {
				// setPackageItem(selectedDish);
				// setUpdate(true);
			}
		}
	};

	const handleInputChange = (name, value) => {
		// --- START: MODIFIED CODE ---
		// Set the source of user input for discount fields.
		// This tells our main useEffect which value is the source of truth.
		//console.log("handleInputChange ⚡⚡ => ", name, value);
		if (name === FIELD_NAMES.DISCOUNT_AMT) {
			setUserInputSource("amount");
		} else if (name === FIELD_NAMES.DISCOUNT_PERCENT) {
			setUserInputSource("percent");
		} else {
			// For other fields, reset the source so the next calculation defaults to amount-based.
			setUserInputSource(null);
		}
		// --- END: MODIFIED CODE ---

		// The original logic for updating the raw input value remains.
		// The calculation is now handled by the main useEffect.
		// const currentDecimals = config?.amount ?? DEFAULT_DECIMALS;
		// const numericTotal = unformatRupees(total || "0");

		if (
			[
				FIELD_NAMES.DISCOUNT_AMT,
				FIELD_NAMES.DISCOUNT_PERCENT,
				FIELD_NAMES.DELIVERY_CHARGE,
			].includes(name)
		) {
			setInputValues((prev) => ({ ...prev, [name]: value }));
			return; // Let the main useEffect handle the rest.
		}

		// Keep original logic for other fields
		const isPotentiallyNumeric =
			value === "" || /^\d*\.?\d*$/.test(String(value).replace(/,/g, ""));
		if (!isPotentiallyNumeric && RUPEE_FIELDS_ARRAY.includes(name)) {
			return;
		}

		//console.log("handleInputChange => ", name, value);

		setInputValues((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleInputFocus = (e, nameArg, clear = false) => {
		const targetElement = e.target;

		console.log("focus data", e, name);

		if (!targetElement) {
			console.error("Focus event has no target element.");
			return;
		}

		if (clear) {
			setName();
		}

		let chosenName;

		// //console.log("focus inpt RGT => ", e, nameArg);

		if (nameArg) {
			chosenName = nameArg;
			// Programmatically set the 'name' attribute on the DOM element itself
			targetElement.name = nameArg; // <<<<<<<< Assigning here
		} else if (targetElement.name) {
			chosenName = targetElement.name;
		} else {
			console.warn(
				"Could not determine a name. DOM element's 'name' attribute remains as is (or empty)."
			);
		}

		// This 'setName' is from your component's useState, setting the React state.
		if (chosenName) {
			setName(chosenName);
		} else {
			// setName(null);
		}

		focusedInputRef.current = targetElement; // Ref now points to the (potentially modified) DOM element
		//console.log("Current trgt ele =>", targetElement);

		if (typeof targetElement.select === "function") {
			targetElement.select();
		}
	};

	useEffect(() => {
		// //console.log("focusInput Ref", focusedInputRef.current);
	}),
		[focusedInputRef.current];

	useEffect(() => {
		//console.log("🚀🚀🖍️❌", inputValues);
	}, [inputValues]);

	const [triggerSamplePrint, samplePrintStatus] =
		useSampleThermalReceiptPrinter({
			printerName: "oneNote",
			templateType: "SAMPLE_KOT", // The specific template for this receipt
			onPrintInitiated: () => {
				//console.log(`Initiating GO_CRISPY_THERMAL print to ${"oneNote"}`);
			},
			onPrintSuccess: (message) => alert(`Print Success: ${message}`),
			onPrintError: (errorMsg) => alert(`Print Error: ${errorMsg}`),
		});

	const handleVirtualKeyPress = (value, name) => {
		// --- START: MODIFIED CODE ---
		// Set the source of user input for discount fields from the virtual keyboard.
		if (name === RUPEE_FIELD_NAMES.DISCOUNT_AMT) {
			setUserInputSource("amount");
		} else if (name === RUPEE_FIELD_NAMES.DISCOUNT_PERCENT) {
			setUserInputSource("percent");
		} else {
			setUserInputSource(null);
		}
		// --- END: MODIFIED CODE ---

		// Update the raw value. The main useEffect will handle all calculations.
		if (name === "osRefNo") {
			if (value.length > 20) {
				return;
			}
		}
		setInputValues((prev) => ({ ...prev, [name]: value }));
	};

	const saveInvoice = (data) => {
		setLoading("save");
		payModel
			.saveInvoiceDetails(data)
			.then((data) => {
				if (data?.status === "true") {
					setInvId(data?.referenceno);
					setLoading(false);
					dispatch(emptyDishList());
					dispatch(resetOrder());
					dispatch(updateCustomerData(null));
					dispatch(customerOrderMod(null));
					setInputValues(initialObj);
					Swal.fire({
						title: t("SWAL.INVOICE_SAVED"),
						text:
							data?.referenceno && data?.message
								? `${data.referenceno} - ${data.message}`
								: t("SWAL.INVOICE_SAVED_SUCCESSFULLY"),
						icon: "success",
					}).then(() => {
						dispatch(resetOrder);
						dispatch(updateCustomerData(null));
						dispatch(updateSlab(null));
						setInputValues(initialObj);
						navigate("/kot"); // navigate after user clicks "OK"
					});
				} else {
					setLoading(false);
					Swal.fire({
						title: t("SWAL.SAVE_FAILED"),
                        text: data?.message || t("SWAL.INVOICE_SAVE_FAILED"),
						icon: "error",
					});
				}
			})
			.catch((error) => {
				setLoading(false);
				//console.log("error in save invoice", error);
			});
	};

	const handleCustomerPage = () => {
		dispatch(resetOrder());
		dispatch(updateCustomerData(null));
		navigate("/kot");
	};

	const handkeClickBack = () => {
		navigate(-1);
	};

	const saveRecords = async (settled) => {
		try {
			if (userLogoutChecker()) {
				// isLoading(false);
				return;
			}

			const { result, error } = await getIsDayClosed();

			if (!result) {
				Swal.fire({
					icon: "warning",
					title: error || t("SWAL.DAY_CLOSED"),
					text: !error && t("SWAL.CANNOT_SAVE_AFTER_DAY_CLOSED"),
				});
				return;
			}

			if (
				settled &&
				selectedChild === 11 &&
				inputValues?.totalAmt !== "" &&
				parseFloat(inputValues?.netAmount) ===
					parseFloat(inputValues?.totalAmt) &&
				inputValues?.paidAmt === ""
			) {
				Swal.fire({
					icon: "warning",
					title: t("SWAL.TOTAL_PAID_SHOULD_BE_EQUAL"),
				});
				return;
			}
			const isEdit = reduxKotDetail !== null;
			const headers = isEdit ? reduxKotDetail : [];

			//console.log({ selectedMenuList, inputValues });

			const InvoiceData = {
				orderhdrid: 0,
				orderreferencehdrid: reduxKotDetail?.orderhdrid || 0,
				outletid: outletDetails?.outlet,
				userid: Number(userDetails?.userid),
				customerid: Number(customer?.customer_id) || 0,
				customername: customer?.customer_name || "",
				mobileno: customer?.mobile_no || "",

				// Use || 0 before toFixed to handle empty strings gracefully
				grossamount: Number(parseFloat(total || "0").toFixed(amtDecimal)) || 0,
				discountper: Number(inputValues?.discountPercent) || 0,
				discountamount:
					parseFloat(
						parseFloat(inputValues?.discountAmt || 0).toFixed(amtDecimal)
					) || 0,
				deliverycharge:
					parseFloat(
						parseFloat(inputValues?.deliveryCharge || 0).toFixed(amtDecimal)
					) || 0,

				invoicenetamount: 0,
				netamount:
					Number(
						parseFloat(inputValues?.netAmount || "0").toFixed(amtDecimal)
					) || 0,

				Tips:
					Number(parseFloat((inputValues?.tips || 0).toFixed(amtDecimal))) || 0,
				paidamount: 0, // -> 0 (as per //todo)
				cashamount:
					Number(parseFloat(inputValues?.paidAmt || "0").toFixed(amtDecimal)) ||
					0,

				cardid: inputValues?.cardId?.cardid || 0,
				creditcardno: inputValues?.cardNo || "", // -> ""
				cardamount:
					Number(parseFloat(inputValues?.cardAmt || 0).toFixed(amtDecimal)) ||
					0,
				cardtips:
					Number(parseFloat(inputValues?.tipsCard || 0).toFixed(amtDecimal)) ||
					0,

				ledgerid: Number(inputValues?.ledgerId) || 0,
				costcenterid: Number(inputValues?.costCenterId) || 0,

				employeeid: Number(inputValues?.empCode?.emp_id_n) || 0,
				staffamount: parseFloat(inputValues?.staffAmt || 0) || 0,

				wastageEmpID: inputValues?.empCodeWastage?.emp_id_n || 0,
				crispyWastageAmount:
					Number(
						parseFloat(inputValues?.staffAmtWastage || 0).toFixed(amtDecimal)
					) || 0,

				paymenttype: (inputValues?.ledgerId || "") !== "" ? 5 : 1,
				invoicestatus: settled ? 2 : 1, //1 - unsettled 2 - settled

				cardno2: null, // -> null
				cardamount2: 0, // -> null
				cardtype2: 0, // -> null
				otherpaymentid: Number(inputValues?.otherPayment?.paymenttype) || 0, // -> null
				otherpaymentreferno:
					inputValues?.opRemarks !== "" ? inputValues?.opRemarks : null, // -> null
				otherpaymentamount:
					Number(
						parseFloat(inputValues?.opAmount || "0").toFixed(amtDecimal)
					) || 0, // -> null
				othersettlementid:
					Number(inputValues?.otherSettelement?.paymenttype) || 0, // -> null
				othersettlementreferno:
					inputValues?.osRefNo !== "" ? inputValues?.osRefNo : null, // -> null
				othersettlementamount:
					Number(
						parseFloat(inputValues?.osAmount || "0").toFixed(amtDecimal)
					) || 0, // -> null

				ordertype: orderType?.id || null,
				ordervehicleno: customer?.vehicle_no || "",
				invoicehdrid: reduxKotDetail?.invoicehdrid || 0,

				kotitems:
					transformOrderDataWithFullPackagePriceAndFlatten(selectedMenuList),

				Directpaykotitems: getOrderDetails(
					selectedMenuList,
					isEdit,
					table,
					headers
				),
			};
			//console.log("header data", InvoiceData);

			saveInvoice(InvoiceData);
		} catch (error) {
			Swal.fire({
				icon: "error",
				title: t("SWAL.ERROR"),
				text: t("SWAL.ERROR_PROCESSING_REQUEST"),
			});
			//console.log("Error in save invoice", error);
		}
	};

	const handleSave = async () => {
		//console.log("Input Values", inputValues);

		if (userLogoutChecker()) {
			return;
		}

		const { result, error } = await getIsDayClosed();

		if (!result) {
			Swal.fire({
				icon: "warning",
				title: error || t("SWAL.DAY_CLOSED"),
				text: !error && t("SWAL.CANNOT_PAY_AFTER_DAY_CLOSED"),
			});
			return;
		}

		saveRecords(false);
	};

	const handlePay = () => {
		//console.log("pay click");
		const res = childValidateRef.current.validate();
		//console.log({ res });

		const { isValid, message } = res;
		if (!isValid) {
			Swal.fire({
				icon: "error",
				title: t("SWAL.VALIDATION_ERROR"),
				text: message,
			});
			return;
		}

		saveRecords(true);
	};

	const handleSlab = () => {
		// //console.log("click slab");
		setIsModalOpen(true);
	};

	const handleDeleteInvoice = async (item) => {
		if (userLogoutChecker()) {
			return;
		}

		const { result, error } = await getIsDayClosed();

		if (!result) {
			Swal.fire({
				icon: "warning",
				title: error || t("SWAL.DAY_CLOSED"),
				text: !error && t("SWAL.CANNOT_DELETE_AFTER_DAY_CLOSED"),
			});
			return;
		}

		setCurrentRow({
			invoicehdrid: item.invoicehdrid,
			invoicedate: item.invoicedate,
		});
		const confirm = await showConfirmModal({
        title: t("SWAL.DELETE_INVOICE"),
        text: t("SWAL.CONFIRM_DELETE"),
        confirmText: t("COMMON.DELETE"),
        cancelText: t("COMMON.CANCEL"),
        icon: "warning",
});


		if (confirm) {
			modalRef.current?.openModal();
		} else {
			//console.log("Cancelled!");
		}
	};

	const handleConfirmDelete = (value) => {
		//console.log("PIN ENTERED - ", value);
		const authenticateBody = {
			pin: value,
			actiontype: "DELETE",
			transactiontype: 2,
		};
		const deleteBody = {
			invoicedate: currentRow?.invoicedate || "",
			outletid: outletDetails?.outlet,
			invoicehdrid: currentRow?.invoicehdrid || 0,
			userid: userDetails?.userid,
		};

		// Show loading immediately
		setLoading("invDelete");

		orderModel
			.kotAuthenticate(authenticateBody)
			.then((data) => {
				if (data.status === "true") {
					return payModel.deleteInvoice(deleteBody).then((data) => {
						if (data.status === "true") {
							getInvoiceList();
							Swal.fire({
								icon: "success",
								title: t("SWAL.DELETE_INVOICE"),
								text: data?.message || t("SWAL.INVOICE_DELETED_SUCCESSFULLY"),
							});
						} else {
							throw new Error(data?.message || t("SWAL.INVOICE_NOT_DELETED"));
						}
					});
				} else {
					throw new Error(
						data?.info || t("SWAL.AUTHENTICATION_FAILED")
					);
				}
			})
			.catch((error) => {
				console.error("Deletion error:", error);
				Swal.fire({
					icon: "error",
					title: t("SWAL.ERROR"),
					text: error.message || t("SWAL.DELETION_FAILED"),
				});
			})
			.finally(() => {
				setLoading(false);
			});
	};

	const handleChildChange = (child) => {
		//console.log("handleChildChange 🪁🪁🪁", child);
		if (!child?.id) return;
		setSelectedType(child?.id);
		const excludeFields = ["totalAmt", "paidAmt"];

		// Get inputTypes of previous selected child from ref (stored object)
		const previousInputs = previousChildIdRef.current?.inputTypes || [];
		const clearedPrev = previousInputs.reduce((acc, { name }) => {
			if (!excludeFields.includes(name)) {
				acc[name] = "";
			}
			return acc;
		}, {});

		// Get inputTypes from current selected child
		const newInputs = child.inputTypes || [];
		const clearedNew = newInputs.reduce((acc, { name }) => {
			if (!excludeFields.includes(name)) {
				acc[name] = "";
			}
			return acc;
		}, {});

		if (child?.id === 12) {
			setCashBalance((prev) => ({
				...prev,
				Cash: "0.00",
			}));
		} else if (child?.id === 42) {
			setInputValues((prev) => ({
				...prev,
				osAmount: cashBalance?.Balance || "0.00",
			}));
		}

		// Update form state
		setInputValues((prev) => ({
			...prev,
			...clearedPrev,
			...clearedNew,
		}));

		// Store current child for future comparison
		previousChildIdRef.current = child;

		// Optional: update selectedChild state if needed
		// setSelectedChild(child);
	};

	const handleChangeType = (data) => {
		//console.log("data", data);
		setSelectedChild(data?.id);
	};

	const handleClear = (data) => {
		//console.log("clcked claer", data);
		//console.log("inputValues", inputValues);
		const id = data.id;
		if (id === 22) {
			setInputValues((prev) => ({
				...prev,
				empCode: "",
				empName: "",
				staffAmt: "",
			}));
		}

		if (id === 31) {
			setInputValues((prev) => ({
				...prev,
				empCodeWastage: "",
				empNameWastage: "",
				staffAmtWastage: "",
			}));
		}
	};

	// const handleCustomerReg = () => {
	// 	navigate("/customerReg");
	// };

	const handlePrint = () => {
		//console.log("handle sample print", inputValues, selectedMenuList);
		const payments = {
			discountPercent: inputValues.discountPercent,
			discountAmount: inputValues.discountAmt,
			deliveryCharge: inputValues.deliveryCharge,
			total: total,
			netAmount: inputValues.netAmount,
			cash: inputValues.paidAmt,
			card: inputValues.cardAmt,
			cardNo: inputValues.cardNo,
			employee: inputValues.empName,
			// empAmt: inputValues.
		};
		// const
	};

	const tableColumns = showInvoiceList ? invoiceColumn : tableColumn;
	const tableData = showInvoiceList ? invoiceList : selectedMenuList;

	return (
		<Layout
			leftSection={
				<div
					className="mt-2 flex flex-col gap-2 lg:gap-0 lg:justify-between h-full 
				[@media_(max-height:750px)]:overflow-auto 
				[@media_(max-height:750px)]:gap-2 
				[@media_(max-height:750px)]:[scrollbar-width:none] 
				[@media_(max-height:750px)]:[-ms-overflow-style:none] 
				[&::-webkit-scrollbar]:hidden">
					{/* Top Icon section */}
					<div className="grid grid-cols-5 gap-2">
						{headerData?.map((item, index) => {
							return (
								<button
									className={`${item?.className} rounded-lg p-1 flex items-center justify-center`}
									onClick={item?.onclick}
									key={index}>
									<Icon icon={item?.name} width="24" height="24" />
								</button>
							);
						})}
					</div>

					{/* Table section */}
					<div className="bg-[#F2EDED] rounded-lg h-full ">
						<div
							className={`${showInvoiceList ? "h-80" : "h-50"} overflow-auto `}>
							<Table
								className=""
								scroll={{ y: showInvoiceList ? 300 : 150 }}
								columns={tableColumns}
								dataSource={tableData}
								pagination={false}
								components={{
									header: {
										cell: (props) => (
											<th
												{...props}
												style={{
													backgroundColor: "#9e9b9b",
													color: "#e8e6e6",
													padding: 5,
													textAlign: "center",
												}}
											/>
										),
									},
									body: {
										wrapper: (props) => (
											<tbody
												{...props}
												className="bg-[#F2EDED] w-full h-full"
											/>
										),
										cell: (props) => (
											<td
												{...props}
												// style={{ backgroundColor: "#F2EDED", color: "black" }}
												className=" text-xs font-[600] p-1 py-2 overflow-hidden break-words" //text-ellipsis
											/>
										),
									},
								}}
								onRow={(item) => ({
									className: `${
										showInvoiceList
											? item?.invoicehdrid === selectedDish?.invoicehdrid
												? "bg-[#DED6D6]"
												: "bg-[#F2EDED]"
											: item?.key === selectedDish?.key
											? "bg-[#DED6D6]"
											: "bg-[#F2EDED]"
									} cursor-pointer `,
									onClick: () => {
										setSelectedDish(item);
										// setSelectedData();
									},
								})}
								expandable={{
									expandedRowRender: (record) => (
										<div
											style={{ paddingLeft: "9%", backgroundColor: "#F2EDED" }}>
											<Table
												columns={nestedColumns}
												dataSource={record.packages?.flatMap(
													(i) => i?.packages || []
												)}
												pagination={false}
												showHeader={false}
												components={{
													body: {
														wrapper: (props) => (
															<tbody
																{...props}
																className="bg-[#F2EDED] w-full h-full"
															/>
														),
														cell: (props) => (
															<td
																{...props}
																// style={{ backgroundColor: "#F2EDED", color: "black" }}
																className="p-1 text-xs font-[600] overflow-hidden break-words" //text-ellipsis
															/>
														),
													},
												}}
											/>
										</div>
									),
									rowExpandable: (record) =>
										record.packages && record.packages.length > 0,
									// expandIcon: () => null,
									// expandedRowKeys: ['1'],
								}}
							/>
						</div>
						{!showInvoiceList && (
							<OrderSummary
								inputValues={inputValues}
								handleInputChange={handleInputChange}
								setInputValues={setInputValues}
								setFocusedInput={handleInputFocus}
								onChange={handleVirtualKeyPress}
								setUserInputSource={setUserInputSource}
								total={total}
							/>
						)}

						<PaymentActions
							onSaveClick={handleSave}
							onPayCLick={handlePay}
							onSlabClick={handleSlab}
						/>

						<SlabDetails
							inputValues={inputValues}
							handleInputChange={handleInputChange}
							setFocusedInput={handleInputFocus}
						/>

						<CustomerDetails
							inputValues={inputValues}
							handleInputChange={handleInputChange}
							setFocusedInput={handleInputFocus}
						/>

						<FooterActions
							onCustomer={handleCustomerPage}
							// onCustomerReg={handleCustomerReg}
							onClickBack={handkeClickBack}
							onPrint={handlePrint}
						/>

						<FooterSection />
					</div>

					<NumberInputModal
						ref={modalRef}
						limit={6}
						imageUrl={getCompanyLogo}
						onConfirm={handleConfirmDelete}
					/>
				</div>
			}
			rightSection={
				<div className="flex flex-col gap-4 lg:gap-0 lg:justify-between h-[90%] mt-1 ">
					<PaymentSection
						ref={childValidateRef}
						inputValues={inputValues}
						handleInputChange={handleInputChange}
						focusInputRef={focusedInputRef}
						cashBalance={cashBalance}
						setCashBalance={setCashBalance}
						onChangeChild={handleChildChange}
						name={name}
						setFocusedInput={handleInputFocus}
						onChange={handleVirtualKeyPress}
						onChangeType={handleChangeType}
						handleClear={handleClear}
					/>

					<VirtualKeyboard
						keyboardRef={focusedInputRef}
						onChange={handleVirtualKeyPress}
					/>

					<SlabList isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} />
				</div>
			}
		/>
	);
}

export default Pay;
