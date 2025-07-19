import {
	useState,
	useEffect,
	useRef,
	forwardRef,
	useImperativeHandle,
} from "react";
import { useTranslation } from "react-i18next";
import { ListSlider, SlideArrow } from "../../../components"; // Assuming these components exist and work as intended
import { customerModel } from "../../../plugins/models"; // Assuming this model exists and works
import aggregatorModel from "../../../plugins/models/agrregatorModel";
import { toast } from "react-toastify";
import { Spin } from "antd";
import payModel from "../../../plugins/models/payModel";
import moment from "moment";
import { formatRupees } from "../../../utils/helpers";
import { useSelector } from "react-redux";
import {
	selectAdvanceOrder,
	// selectConfig,
	selectConfigLs,
} from "../../../redux/selector/orderSlector";
import { NumericFormat } from "react-number-format";
import CustomAutoComplete from "../../../common/CustomeAutocomplete";
import { formatRoundedRupees } from "../../../utils/helpers/roundup";
import Swal from "sweetalert2";

// Define the data structure for payment types
const paymentType = [
  {
    id: 1,
    name: "PAYMENT.CASH_CREDIT", // i18n key
    children: [
      {
        id: 11,
        name: "PAYMENT.CASH",
        balance: [
          { key: "Cash", label: "PAYMENT.CASH" },
          { key: "Advance", label: "PAYMENT.ADVANCE" },
          { key: "Balance", label: "PAYMENT.BALANCE" },
        ],
        inputTypes: [
          { name: "totalAmt", label: "PAYMENT.TOTAL_AMOUNT", amount: true },
          { name: "change", label: "PAYMENT.CHANGE", amount: true },
          { name: "tips", label: "PAYMENT.TIPS", amount: true },
          { name: "paidAmt", label: "PAYMENT.PAID_AMOUNT", amount: true },
        ],
        cashType: [
          { type: "Exact", label: "PAYMENT.EXACT" },
          { type: "Cash", label: "PAYMENT.CASH" },
        ],
      },
      {
        id: 12,
        name: "PAYMENT.CREDIT_CARD",
        balance: [
          { key: "Cash", label: "PAYMENT.CASH" },
          { key: "Advance", label: "PAYMENT.ADVANCE" },
          { key: "Balance", label: "PAYMENT.BALANCE" },
        ],
        inputTypes: [
          { name: "cardNo", label: "PAYMENT.CREDIT_CARD_NO", number: true },
          { name: "cardAmt", label: "PAYMENT.CARD_AMOUNT", amount: true },
          { name: "tipsCard", label: "PAYMENT.TIPS", amount: true },
        ],
        cashType: [{ type: "Exact", label: "PAYMENT.EXACT" }],
      },
    ],
  },
  {
    id: 2,
    name: "PAYMENT.CITY_LEDGER_CARE_OF",
    children: [
      {
        id: 21,
        name: "PAYMENT.CITY_LEDGER",
        legger: true,
        costCenter: true,
        balance: [], // If you need balances, add here
        // inputTypes: [{ name: "ledgerAmt", label: "PAYMENT.AMOUNT", amount: true }],
        cashType: [],
      },
      {
        id: 22,
        name: "PAYMENT.STAFF",
        inputTypes: [
          { name: "empCode", inputType: "search", label: "PAYMENT.EMPLOYEE_CODE" },
          { name: "empName", label: "PAYMENT.EMPLOYEE_NAME" },
          { name: "staffAmt", label: "PAYMENT.AMOUNT", amount: true },
        ],
        inputStyle: "column",
        inputActions: [{ type: "clear", label: "COMMON.CLEAR" }],
      },
    ],
  },
  {
    id: 3,
    name: "PAYMENT.WASTAGE",
    children: [
      {
        id: 31,
        name: "PAYMENT.WASTAGE",
        inputTypes: [
          { name: "empCodeWastage", inputType: "search", label: "PAYMENT.EMPLOYEE_CODE" },
          { name: "empNameWastage", label: "PAYMENT.EMPLOYEE_NAME" },
          { name: "staffAmtWastage", label: "PAYMENT.AMOUNT", amount: true },
        ],
        inputStyle: "column",
        inputActions: [{ type: "clear", label: "COMMON.CLEAR" }],
      },
    ],
  },
  {
    id: 4,
    name: "PAYMENT.OTHERS",
    children: [
      {
        id: 42,
        name: "PAYMENT.OTHER_SETTLEMENTS",
        settlement: true,
        inputTypes: [
          { name: "osRefNo", label: "PAYMENT.REFERENCE_NO", amount: false, inputType: "text" },
          { name: "osAmount", label: "PAYMENT.AMOUNT", amount: true },
        ],
        inputStyle: "column",
      },
      {
        id: 41,
        name: "PAYMENT.OTHER_PAYMENTS",
        payment: true,
        inputTypes: [
          { name: "opAmount", label: "PAYMENT.AMOUNT", amount: true },
          { name: "opRemarks", label: "PAYMENT.REMARKS", inputType: "textarea" },
        ],
        inputStyle: "column",
      },
    ],
  },
];


const DEFAULT_DECIMALS = 2; //todo
// Fixed amounts for cash payment
const amounts = [1, 5, 10, 50, 100, 200, 500];

// --- Component Definition ---
export const PaymentSection = forwardRef(
	(
		{
			inputValues,
			name,
			focusInputRef,
			handleInputChange,
			setFocusedInput,
			onChangeChild,
			cashBalance,
			setCashBalance,
			onChange,
			onChangeType,
			handleClear,
		},
		ref
	) => {
		const cardRef = useRef();
		const ledgerRef = useRef();
		const costCenterRef = useRef();
		const opRef = useRef();
		const osRef = useRef();
		const { t } = useTranslation();
		// const inputRef = useRef();

		// const configRe = useSelector(selectConfig);
		const config = selectConfigLs;
		const advanceOrder = useSelector(selectAdvanceOrder);

		const outletDetails = JSON.parse(localStorage.getItem("outletDetails"));

		// State Hooks
		const [selectedPayment, setSelectedPayment] = useState(paymentType[0].id); // Default to first payment type
		const [selectedChild, setSelectedChild] = useState(null);
		const [cards, setCards] = useState([]); // For credit card list
		const [cardIndex, setCardIndex] = useState(0); // For card slider pagination
		const [selectedCard, setSelectedCard] = useState(null);
		const [inputRender, setInputs] = useState([]);
		const [selectedType, setSelectedType] = useState(null); // For 'Exact'/'Cash' selection
		const [ledger, setLedger] = useState(null);
		const [costCenter, setCostCenter] = useState(null);
		const [selectedLedger, setSelectedLedger] = useState(null);
		const [selectCostCenter, setSelectCostCenter] = useState(null);
		const [ledgerIndex, setLedgerIndex] = useState(0);
		const [costCenterIndex, setCostCenterIndex] = useState(0);
		const [loading, setLoading] = useState(false);
		const [, setLoadingCC] = useState(false);
		const [, setLoadingOP] = useState(false);
		// const [, setLoadingOS] = useState(false);
		// const [disabled, setDisabled] = useState(false);
		const [options, setOptions] = useState([]); // For autocomplete options
		const [otherPayments, setOtherPayments] = useState(null);
		const [opIndex, setOpIndex] = useState(0);
		const [otherSettlement, setOtherSettlement] = useState(null);
		const [osIndex, setOsIndex] = useState(0);
		const [selectedOS, setSelectOS] = useState(null);
		const [selectedOP, setSelectOP] = useState(null);
		// const [partial, setPartial] = useState(false);

		// --- Calculated Values ---
		const totalCardPages = Math.ceil(cards?.length / 5);
		const totalLedgerPages = Math.ceil(ledger?.length / 10);
		const totalCCPages = Math.ceil(costCenter?.length / 10);
		const totalOPPages = Math.ceil(otherPayments?.length / 10);
		const totalOSPages = Math.ceil(otherSettlement?.length / 10);

		// Find the currently active main payment object
		const activePayment = paymentType.find(
			(type) => type.id === selectedPayment
		);

		// Find the currently active child payment object
		const activeChild = activePayment?.children?.find(
			(child) => child.id === selectedChild
		);

		// --- Effects ---

		// Fetch card details on mount
		useEffect(() => {
			getCardDetails();
			getAggregatorList();
			getCostCenterList();
		}, []);

		// Update selected child and default cash type when main payment changes
		useEffect(() => {
			if (activePayment?.children?.length > 0) {
				const firstChild = activePayment.children[0];
				setSelectedChild(firstChild.id);
				onChangeChild(firstChild);
				// console.log({ selectedPayment, activePayment, firstChild });
				if (firstChild.cashType && firstChild.cashType.length > 1) {
					// //console.log({activePayment, })
					setSelectedType(firstChild.cashType[0].type);
				} else {
					setSelectedType(null); // Reset if no cash types
				}
			} else {
				setSelectedChild(null); // No children, reset child selection
				setSelectedType(null); // Reset cash type
			}
		}, [selectedPayment, activePayment]); // Rerun when selectedPayment changes (activePayment depends on it)

		useEffect(() => {
			// Directly use inputType from the found activeChild
			onChangeType(activeChild);
			setInputs(activeChild?.inputTypes || []);

			if (activeChild?.cashType && activeChild.cashType.length > 1) {
				if (
					!selectedType ||
					!activeChild.cashType.some((ct) => ct.type === selectedType)
				) {
					setSelectedType(activeChild.cashType[0].type); // Default to first if current is invalid or null
				}
			} else {
				setSelectedType(null); // Reset if no cash types
			}
		}, [selectedChild, activeChild]); // Rerun when selectedChild changes (activeChild depends on it)

		useEffect(() => {
			const totalDueString = inputValues?.netAmount || inputValues?.totalAmt; // Prefer netAmount if available
			const cashBal = cashBalance?.Balance || "0.00";
			const totalDue = parseFloat(totalDueString) || 0;
			const advanceAmount = advanceOrder
				? parseFloat(advanceOrder?.total || 0)
				: 0.0;
			const remainingAfterAdvance = totalDue - advanceAmount;

			const formatAmount = (val) =>
				val.toFixed(config?.amount || DEFAULT_DECIMALS);

			if (!activeChild) return; // Guard if no active child

			if (activeChild.id === 11) {
				// Cash
				if (selectedType === "Exact") {
					handleInputChange("paidAmt", formatAmount(remainingAfterAdvance));
					// Tips and Change are typically user-entered or calculated elsewhere for Exact
				} else if (selectedType === "Cash") {
					// Partial Cash
					handleInputChange("tips", ""); // Clear tips for partial cash entry mode
					handleInputChange("paidAmt", "0.00");
					handleInputChange("change", ""); // Clear change
					// Do NOT automatically set paidAmt to "0.00".
					// User will input the partial amount. If inputValues.paidAmt already
					// has a value (e.g. from previous edit), it should be preserved.
				}
			} else if (activeChild.id === 12) {
				const tempBalance = parseFloat(cashBalance?.TempBl);
				const amountToFill =
					tempBalance > 0 ? tempBalance : remainingAfterAdvance;

				const parseAmt = Math.round(amountToFill);

				console.log("card seelcted", { activeChild, amountToFill, parseAmt });
				// handleInputChange("cardAmt", formatAmount(amountToFill));
				setCashBalance((prev) => ({
					...prev,
					Balance: parseAmt,
				}));
			}
			// else if (activeChild.id === 41) {
			// 	// const tempBalance = parseFloat(cashBalance?.TempBl);
			// 	// const amountToFill =
			// 	// 	tempBalance > 0 ? tempBalance : remainingAfterAdvance;
			// 	// handleInputChange("opAmount", amountToFill);
			// }
			else if (
				activeChild.id === 21 ||
				activeChild.id === 22 ||
				activeChild.id === 31
			) {
				handleInputChange("opAmount", "");
				handleInputChange("cardAmt", "");
				handleInputChange("change", "");
				handleInputChange("paidAmt", "");
				handleInputChange("tips", "");
			}

			if (activeChild.id === 42) {
				//console.log(" cash bal => ✅✅", cashBal);
				let osAmt = 0;
				if (parseFloat(cashBal) === 0.0) {
					osAmt = remainingAfterAdvance;
				} else {
					osAmt = parseFloat(cashBal) || 0.0;
				}
				handleInputChange("osAmount", osAmt);
			}

			//console.log({ selectedType });
		}, [selectedType, selectedChild]);

		//* load emp data and other data form api
		useEffect(() => {
			if (selectedChild === 11) {
				setSelectOP(null);
			}
			if (selectedChild === 21) {
				setSelectOP(null);
			}
			if (selectedChild === 22) {
				setSelectOP(null);
				getEmpData(); // Fetch employee data when Staff child is selected
			}
			if (selectedChild === 31) {
				setSelectOP(null);
				getEmpData(); // Fetch employee data when Wastage child is selected
			}
			if (selectedChild === 12) {
				setCashBalance((prev) => ({
					...prev,
					Balance: cashBalance?.TempBl,
				}));
				// handleInputChange("cardAmt", cashBalance?.TempBl);
				// handleInputChange("cardAmt", cashBalance?.Balance);
			}
			if (selectedChild === 41) {
				setSelectOS(null);
				getOthers("2");
			}
			if (selectedChild === 42) {
				setSelectOP(null);
				getOthers("1");
			}
		}, [selectedChild]);

		useEffect(() => {
			if (selectedCard) {
				//console.log("selectedCard", selectedCard);
				handleInputChange("cardId", selectedCard);
			}
		}, [selectedCard]);

		useEffect(() => {
			if (selectedLedger) {
				//console.log("selectedLedger", selectedLedger);
				handleInputChange("ledgerId", selectedLedger);
			}
			if (selectCostCenter) {
				//console.log("selectCostCenter", selectCostCenter);
				handleInputChange("costCenterId", selectCostCenter);
			}
			if (selectedOP) {
				handleInputChange("otherPayment", selectedOP);
			}
			if (selectedOS) {
				handleInputChange("otherSettelement", selectedOS);
			}
		}, [selectedLedger, selectCostCenter, selectedOP, selectedOS]);

		useEffect(() => {
			if (selectedPayment === 1) {
				if (selectedChild === 11) {
					if (selectedType === "Exact") {
						handleExactCash();
					}
				}
			}
		}, [selectedPayment, selectedChild, selectedType, inputValues.netAmount]);

		useEffect(() => {
			//console.log({ selectedChild, inputValues, selectedPayment });
		}, [selectedChild, selectedPayment]);

		useImperativeHandle(ref, () => ({
			validate: () => {
				const valid = validateCashCredit();

				return valid;
			},
		}));

		const validateCashCredit = () => {
			const {
				netAmount,
				totalAmt,
				paidAmt,
				cardAmt,
				empCode,
				staffAmt,
				empCodeWastage,
				staffAmtWastage,
				opAmount,
				// opRemarks, // Added for potential validation
				osAmount,
				osRefNo, // Added for potential validation
			} = inputValues;

			console.log("validateCashCredit", inputValues);

			const primaryTotalString = netAmount || totalAmt;
			const parsedPrimaryTotal = parseFloat(primaryTotalString) || 0;
			const advancePayment = advanceOrder
				? parseFloat(advanceOrder.total || 0)
				: 0.0;
			const actualDue = parsedPrimaryTotal - advancePayment;

			let validationResult = { isValid: true, message: "" }; // Default success state

			const createError = (msg) => {
				// toast.error(msg);
				validationResult = { isValid: false, message: msg };
			};

			if (!activeChild) {
				createError(t("PAYMENT.VALIDATION_NO_ACTIVE_PAYMENT"));
				return validationResult;
			}

			// --- Cash Payment (Child ID 11) ---
			if (activeChild.id === 11) {
				const parsedPaidAmt = parseFloat(paidAmt) || 0;
				if (selectedType === "Exact") {
					if (parsedPaidAmt < actualDue) {
						createError(
							t("PAYMENT.VALIDATION_EXACT_CASH_LESS", {
								paid: formatRupees(parsedPaidAmt, config?.amount, false),
								due: formatRupees(actualDue, config?.amount, false)
							})
						);
						return validationResult;
					}
				} else {
					// Partial Cash ("Cash" type)
					if (actualDue > 0 && parsedPaidAmt <= 0) {
						createError(t("PAYMENT.VALIDATION_PARTIAL_CASH_AMOUNT_GREATER_THAN_ZERO"));
						return validationResult;
					}
					if (parsedPaidAmt < 0) {
						createError(t("PAYMENT.VALIDATION_PARTIAL_CASH_AMOUNT_NOT_NEGATIVE"));
						return validationResult;
					}
					if (parsedPaidAmt > actualDue) {
						createError(
							t("PAYMENT.VALIDATION_PARTIAL_CASH_AMOUNT_GREATER_THAN_DUE", {
								paid: formatRupees(parsedPaidAmt, config?.amount, false),
								due: formatRupees(actualDue, config?.amount, false)
							})
						);
						return validationResult;
					}
				}
			}
			// --- Credit Card Payment (Child ID 12) ---
			else if (activeChild.id === 12) {
				const parsedCardAmt = parseFloat(cardAmt) || 0;
				if (parsedCardAmt > 0 && !selectedCard) {
					createError(
						(t("PAYMENT.VALIDATION_CREDIT_CARD_SELECT_TYPE"))
					);
					return validationResult;
				}
				if (actualDue > 0 && parsedCardAmt <= 0) {
					createError(
						t("PAYMENT.VALIDATION_CREDIT_CARD_AMOUNT_GREATER_THAN_ZERO")
					);
					return validationResult;
				}
				if (parsedCardAmt < 0) {
					createError(t("PAYMENT.VALIDATION_CREDIT_CARD_AMOUNT_NEGATIVE"));
					return validationResult;
				}
				if (parsedCardAmt > actualDue) {
					createError(
					  t("PAYMENT.VALIDATION_CREDIT_CARD_AMOUNT_GREATER_THAN_DUE", {
						amount: formatRupees(parsedCardAmt, config?.amount, false),
						due: formatRupees(actualDue, config?.amount, false)
					  })
					);
					return validationResult;
				}
				// Optional: Validate cardNo
				// if (parsedCardAmt > 0 && (!inputValues.cardNo || String(inputValues.cardNo).trim() === "")) {
				// 	createError("Credit Card: Please enter the card number.");
				// 	return validationResult;
				// }
			}
			// --- City Ledger (Child ID 21) ---
			else if (activeChild.id === 21) {
				if (!selectedLedger) {
					createError(t("PAYMENT.VALIDATION_CITY_LEDGER_SELECT"));
					return validationResult;
				}
				// If City Ledger needs amount validation, add here
			}
			// --- Staff Payment (Child ID 22) ---
			else if (activeChild.id === 22) {
				const parsedStaffAmt = parseFloat(staffAmt) || 0;
				if (parsedStaffAmt > 0 && (!empCode || !empCode.emp_code_v)) {
					createError(t("PAYMENT.VALIDATION_STAFF_SELECT_EMPLOYEE"));
					return validationResult;
				}
				if (actualDue > 0 && parsedStaffAmt <= 0) {
					createError(t("PAYMENT.VALIDATION_STAFF_PROVIDE_AMOUNT"));
					return validationResult;
				}
				if (parsedStaffAmt < 0) {
					createError(t("PAYMENT.VALIDATION_STAFF_AMOUNT_NEGATIVE"));
					return validationResult;
				}
				if (parsedStaffAmt > actualDue) {
					createError(
						t("PAYMENT.VALIDATION_STAFF_AMOUNT_EQUAL_NET")
						// `Staff: Amount (${formatRupees(
						// 	parsedStaffAmt,
						// 	config?.amount,
						// 	false
						// )}) cannot be greater than amount due (${formatRupees(
						// 	actualDue,
						// 	config?.amount,
						// 	false
						// )}).`
					);
					return validationResult;
				}
			}
			// --- Wastage (Child ID 31) ---
			else if (activeChild.id === 31) {
				const parsedWastageAmt = parseFloat(staffAmtWastage) || 0;
				if (
					parsedWastageAmt > 0 &&
					(!empCodeWastage || !empCodeWastage.emp_code_v)
				) {
					createError(t("PAYMENT.VALIDATION_WASTAGE_SELECT_EMPLOYEE"));
					return validationResult;
				}
				if (actualDue > 0 && parsedWastageAmt <= 0) {
					createError(
						t("PAYMENT.VALIDATION_WASTAGE_AMOUNT_GREATER_THAN_ZERO")
					);
					return validationResult;
				}
				if (parsedWastageAmt < 0) {
					createError(t("PAYMENT.VALIDATION_WASTAGE_AMOUNT_NEGATIVE"));
					return validationResult;
				}
				// For wastage, often it must cover the full actualDue if > 0
				if (actualDue > 0 && parsedWastageAmt !== actualDue) {
					createError(
						t("PAYMENT.VALIDATION_WASTAGE_AMOUNT_EQUAL_DUE", {
							amount: formatRupees(parsedWastageAmt, config?.amount, false),
							due: formatRupees(actualDue, config?.amount, false),
						})
					);
					return validationResult;
				}
				if (actualDue <= 0 && parsedWastageAmt > 0) {
					// Cannot apply wastage if nothing is due or overpaid
					createError(
						t("PAYMENT.VALIDATION_WASTAGE_CANNOT_APPLY")
					);
					return validationResult;
				}
				if (actualDue <= 0 && parsedWastageAmt > 0) {
					// Cannot apply wastage if nothing is due or overpaid
					createError(
						t("PAYMENT.VALIDATION_WASTAGE_CANNOT_APPLY")
					);
					return validationResult;
				}
				if (actualDue <= 0 && parsedWastageAmt > 0) {
					// Cannot apply wastage if nothing is due or overpaid
					createError(
						t("PAYMENT.VALIDATION_WASTAGE_CANNOT_APPLY")
					);
					return validationResult;
				}
			}
			// --- Other Payments (Child ID 41) ---
			else if (activeChild.id === 41) {
				const parsedOpAmount = parseFloat(opAmount) || 0;
				if (parsedOpAmount > 0 && !selectedOP) {
					createError(t("PAYMENT.VALIDATION_OTHER_PAYMENT_TYPE"));
					return validationResult;
				}
				if (actualDue > 0 && parsedOpAmount <= 0) {
					createError(
						t("PAYMENT.VALIDATION_OTHER_PAYMENT_AMOUNT_GREATER_THAN_ZERO")
					);
					return validationResult;
				}
				if (parsedOpAmount < 0) {
					createError(t("PAYMENT.VALIDATION_OTHER_PAYMENT_AMOUNT_NEGATIVE"));
					return validationResult;
				}
				if (parsedOpAmount > actualDue) {
					createError(
						t("PAYMENT.VALIDATION_OTHER_PAYMENT_AMOUNT_GREATER_THAN_DUE", {
							amount: formatRupees(parsedOpAmount, config?.amount, false),
							due: formatRupees(actualDue, config?.amount, false)
						})
					);
					return validationResult;
				}
				// if (parsedOpAmount > 0 && (!opRemarks || opRemarks.trim() === "")) {
				// 	createError("Other Payments: Please enter remarks.");
				// 	return validationResult;
				// }
			}
			// --- Other Settlements (Child ID 42) ---
			else if (activeChild.id === 42) {
				const parsedOsAmount = parseFloat(osAmount) || 0;
				if (parsedOsAmount > 0 && !selectedOS) {
					createError(t("PAYMENT.VALIDATION_OTHER_SETTLEMENT_TYPE"));

					return validationResult;
				}
				if (actualDue > 0 && parsedOsAmount <= 0) {
					createError(
						t("PAYMENT.VALIDATION_OTHER_SETTLEMENT_AMOUNT_GREATER_THAN_ZERO")
					);
					return validationResult;
				}
				if (parsedOsAmount < 0) {
					createError(t("PAYMENT.VALIDATION_OTHER_SETTLEMENT_AMOUNT_NEGATIVE"));
					return validationResult;
				}
				// For settlements, often it must cover the full actualDue if > 0
				// if (actualDue > 0 && parsedOsAmount !== actualDue) {
				// 	createError(
				// 		`Settlement: Amount (${formatRupees(
				// 			parsedOsAmount,
				// 			config?.amouont,
				// 			false
				// 		)}) must equal the amount due (${formatRupees(
				// 			actualDue,
				// 			config?.amouont,
				// 			false
				// 		)}).`
				// 	);
				// 	return validationResult;
				// }
				if (actualDue <= 0 && parsedOsAmount > 0) {
					// Cannot apply settlement if nothing is due or overpaid
					createError(
						t("PAYMENT.VALIDATION_OTHER_SETTLEMENT_BILL_ALREADY_SETTLED")
					);
					return validationResult;
				}
				if (parsedOsAmount > 0 && (!osRefNo || osRefNo.trim() === "")) {
					createError(t("PAYMENT.VALIDATION_OTHER_SETTLEMENT_REFERENCE_NUMBER"));
					return validationResult;
				}
			}

			// If all checks pass for the active child
			return validationResult; // { isValid: true, message: "" }
		};

		const getAggregatorList = () => {
			setLoading("aggregator");
			aggregatorModel
				.getAggregator({
					outletid: outletDetails?.outlet,
				})
				.then((data) => {
					if (data?.status === "true") {
						setLedger(data?.data);
					} else {
						setLedger([]);
						toast.error(data?.message || t("COMMON.SOMETHING_WENT_WRONG"));

					}
					setLoading(false);
				})
				.catch(() => {
					//console.log("Something went wrong", error);
				});
		};

		const getCostCenterList = () => {
			setLoadingCC("cc");
			payModel
				.loadCostCenter({ outletid: outletDetails?.outlet })
				.then((data) => {
					//console.log("dafasf", data);
					if (data?.status === "true") {
						setCostCenter(data?.data);
					} else {
						setCostCenter([]);
						toast.error(data?.message || t("COMMON.SOMETHING_WENT_WRONG"));

					}
					setLoadingCC(false);
				})
				.catch(() => {
					//console.log("Something went wrong", error);
				});
		};

		const getOthers = (type) => {
			setLoadingOP(true);
			payModel
				.getOtherPayments({ PaymentType: type })
				.then((data) => {
					if (data?.status === "true") {
						if (type === "1") {
							setOtherSettlement(data?.data);
						} else {
							setOtherPayments(data?.data);
						}
					} else {
						type === "1" ? setOtherSettlement([]) : setOtherPayments([]);
						toast.error(data?.message ||t("COMMON.SOMETHING_WENT_WRONG"));
					}
					setLoadingOP(false);
				})
				.catch(() => {
					//console.log("Something went wrong", error);
				});
		};

		// --- Data Fetching ---
		const getCardDetails = () => {
			customerModel
				.getCardDetails()
				.then((data) => {
					if (data?.status === "true") {
						setCards(data?.data);
					}
				})
				.catch(() => {
					//console.log("Error while getting card details", error)
				});
		};

		const handleExactCash = () => {
			const advanceAmount = advanceOrder
				? parseFloat(advanceOrder?.total || 0)
				: 0.0;

			const cashRem =
				parseFloat(inputValues.netAmount) - parseFloat(advanceAmount);
			//console.log({ advanceAmount, cashRem });
			handleInputChange(
				"paidAmt",
				Math.round(cashRem).toFixed(config?.amount || 2)
			);
			// handleInputChange("paidAmt", inputValues.netAmount);
			setCashBalance((prev) => ({
				...prev,
				Cash: cashRem,
				Advance: advanceAmount,
			}));
		};

		// const handlePartialCash = () => {
		// 	const advanceAmount = advanceOrder
		// 		? parseFloat(advanceOrder?.total)
		// 		: 0.0;

		// }

		const handleExactAmount = (e) => {
			const { name, value: rawValue } = e.target;
			const value = parseFloat(rawValue) || 0;

			//console.log({ name, value });

			if (name === "tips") {
				const tips = parseFloat(inputValues?.tips) || 0;
				const newValue = value + tips;
				handleInputChange(name, newValue);
				return;
			}
			if (name === "tipsCard") {
				const tips = parseFloat(inputValues?.tipsCard) || 0;
				const newValue = value + tips;
				handleInputChange(name, newValue);
				return;
			}
			// if (name === "change") {
			// 	const changes = parseFloat(inputValues?.change) || 0;
			// 	const newValue = value + changes;
			// 	handleInputChange(name, newValue);
			// 	return;
			// }
			if (name === "paidAmt") {
				const paidAmt = parseFloat(inputValues?.paidAmt) || 0;
				const newValue = value + paidAmt;
				handleInputChange(name, newValue);
				return;
			}
		};

		const handleClearExactAmt = () => {
			handleInputChange("tips", "");
			handleInputChange("paidAmt", "");
		};

		const handleClearCard = () => {
			handleInputChange("cardNo", "");
			handleInputChange("cardAmt", "");
			handleInputChange("tipsCard", "");
			handleInputChange("cardId", null);
			setSelectedCard(null);
		};

		const handlePaymentChange = (id) => {
			if (id === 2 || id === 3) {
				Swal.fire({
					title: t("PAYMENT.CLEAR_DATA_TITLE"),
					text: t("PAYMENT.CLEAR_DATA_TEXT"),
					icon: "warning",
					showCancelButton: true,
					confirmButtonColor: "#d33",
					cancelButtonColor: "#3085d6",
					confirmButtonText: t("COMMON.OK"),
					cancelButtonText: t("COMMON.CANCEL"),
				}).then((result) => {
					if (result.isConfirmed) {
						handleInputChange("paidAmt", "");
						handleInputChange("cardAmt", "");
						handleInputChange("change", "");
						handleInputChange("tips", "");
						handleInputChange("tipsCard", "");
						handleInputChange("empCode", null);
						handleInputChange("empName", "");
						handleInputChange("staffAmt", "");
						handleInputChange("empCodeWastage", null);
						handleInputChange("staffAmtWastage", "");
						handleInputChange("opAmount", "");
						handleInputChange("osAmount", "");
						handleInputChange("osRefNo", "");
						setSelectedPayment(id);
						return;
					}
					if (result.isDismissed || result.isDenied) {
						// User cancelled, do not change selectedPayment
						return;
					}
				});
			} else {
				setSelectedPayment(id);
			}
		};

		const handleSelectChild = (child) => {
			if (
				// child.id === 21 ||
				child.id === 22 ||
				// child.id === 31 ||
				child.id === 41
			) {
				Swal.fire({
					title: t("PAYMENT.CLEAR_DATA_TITLE"),
					text: t("PAYMENT.CLEAR_DATA_TEXT"),
					icon: "warning",
					showCancelButton: true,
					confirmButtonColor: "#d33",
					cancelButtonColor: "#3085d6",
					confirmButtonText: t("COMMON.OK"),
					cancelButtonText: t("COMMON.CANCEL"),
				}).then((result) => {
					if (result.isConfirmed) {
						handleInputChange("paidAmt", "");
						handleInputChange("cardAmt", "");
						handleInputChange("change", "");
						handleInputChange("tips", "");
						handleInputChange("tipsCard", "");
						handleInputChange("empCode", null);
						handleInputChange("empName", "");
						handleInputChange("staffAmt", "");
						handleInputChange("empCodeWastage", null);
						handleInputChange("staffAmtWastage", "");
						handleInputChange("opAmount", "");
						handleInputChange("osAmount", "");
						handleInputChange("osRefNo", "");
						setSelectedChild(child.id);
						onChangeChild(child);
					}
					if (result.isDismissed || result.isDenied) {
						// User cancelled, do not change selectedChild
						return;
					}
				});

				//console.log(child);
			} else {
				setSelectedChild(child.id);
				onChangeChild(child);
			}
		};

		// const handleClear = (id) => {
		// 	 if(id === 22) {
		// 		setInputV
		// 	 }
		// }

		const getEmpData = () => {
			payModel
				.getEmpData({
					invoicedate: moment().format("DD-MMM-YYYY"),
					intmode: 1,
				})
				.then((data) => {
					if (data?.status === "true") {
						// setInputValues((prev) => ({
						// 	...prev,
						// 	empCode: data?.data,
						// 	empCodeWastage: data?.data,
						// }));
						const sortedData = [...(data?.data || [])].sort(
							(a, b) => Number(a?.emp_code_v ?? 0) - Number(b?.emp_code_v ?? 0)
						);
						// //console.log("sorted data", sortedData);
						setOptions(sortedData);
						// handleInputChange(name, data?.data);
						// handleInputChange("empCodeWastage", data?.data);
					} else toast.error(data?.message || t("COMMON.SOMETHING_WENT_WRONG"));

				})
				.catch(() => {
					{
						//console.log("error in emp data", error);
					}
				});
		};

		// --- Helper Functions ---
		const getButtonClass = (isActive) =>
			`rounded-lg font-semibold h-10 text-center transition-colors duration-150 ${
				isActive
					? "bg-[#31B563] text-white"
					: "bg-[#355364] hover:bg-[#4a768a] text-gray-200"
			}`;
		// --- Render Logic ---
		return (
			<div className="bg-[#0f2b3e] rounded-xl text-white w-full max-w-4xl mx-auto p-0 space-y-4">
				{/* Main Payment Type Selection */}
				<div className="grid grid-cols-4 gap-2">
					{paymentType.map((payment) => (
						<button
							key={payment.id}
							className={getButtonClass(payment.id === selectedPayment)}
							onClick={() => {
								handlePaymentChange(payment.id);

								// Child and type will be reset by useEffect
							}}>
							{t(payment.name)}
						</button>
					))}
				</div>

				{/* Child Payment Type (Sub-Methods) Selection */}
				{activePayment?.children && activePayment.children.length > 0 && (
					<div
						className={`grid ${
							activePayment.children.length === 1
								? `grid-cols-1`
								: `grid-cols-2`
						} gap-2`}>
						{activePayment.children.map((child) => (
							<button
								key={child.id}
								className={getButtonClass(child.id === selectedChild)}
								onClick={() => handleSelectChild(child)}>
								{t(child.name)}
							</button>
						))}
					</div>
				)}

				{/* Ledger/Cost Center Indicators */}
				{activeChild?.ledger && (
					<>
						<div className="text-center font-bold">{t("PAYMENT.LEDGER_DETAILS")}</div>

						<div className="flex h-fit items-center justify-between">
							{/* Add Ledger specific inputs/components here */}
							{loading === "aggregator" ? (
								<Spin />
							) : (
								<>
									<SlideArrow
										direction="left"
										currentIndex={ledgerIndex}
										setCurrentIndex={setLedgerIndex}
										width="50px"
										height="100%"
										refVariable={ledgerRef}
										totalPages={totalLedgerPages}
									/>
									<ListSlider
										componentRef={ledgerRef}
										itemsPerPage={10}
										mainData={ledger}
										totalPages={totalLedgerPages}
										buttonClass="h-10"
										name="aggregatorname"
										id="aggregatorid"
										setSelectedData={setSelectedLedger}
										selected={selectedLedger}
										action={() => {}}
									/>
									<SlideArrow
										direction="right"
										currentIndex={ledgerIndex}
										setCurrentIndex={setLedgerIndex}
										width="50px"
										height="100%"
										refVariable={ledgerRef}
										totalPages={totalLedgerPages}
									/>
								</>
							)}
						</div>
					</>
				)}
				{activeChild?.costCenter && (
					<>
						<div className="text-center font-bold">{t("PAYMENT.COST_CENTER_DETAILS")}</div>
						<div className="flex h-fit items-center justify-between">
							{/* Add Ledger specific inputs/components here */}
							<SlideArrow
								direction="left"
								currentIndex={costCenterIndex}
								setCurrentIndex={setCostCenterIndex}
								width="50px"
								height="100%"
								refVariable={costCenterRef}
								totalPages={totalCCPages}
							/>
							<ListSlider
								componentRef={costCenterRef}
								itemsPerPage={5}
								mainData={costCenter}
								totalPages={totalCCPages}
								buttonClass="h-10"
								name="costcentername"
								id="costcenterid"
								setSelectedData={setSelectCostCenter}
								selected={selectCostCenter}
								action={() => {}}
							/>
							<SlideArrow
								direction="right"
								currentIndex={costCenterIndex}
								setCurrentIndex={setCostCenterIndex}
								width="50px"
								height="100%"
								refVariable={costCenterRef}
								totalPages={totalCCPages}
							/>
						</div>
					</>
				)}
				{activeChild?.payment && (
					<>
						<div className="text-center font-bold">{t("PAYMENT.OTHER_PAYMENTS")}</div>
						<div className="flex h-fit items-center justify-between">
							{/* Add Ledger specific inputs/components here */}
							<SlideArrow
								direction="left"
								currentIndex={opIndex}
								setCurrentIndex={setOpIndex}
								width="50px"
								height="100%"
								refVariable={opRef}
								totalPages={totalOPPages}
							/>
							<ListSlider
								componentRef={opRef}
								itemsPerPage={5}
								mainData={otherPayments}
								totalPages={totalOPPages}
								buttonClass="h-10"
								name="paymentdesc"
								id="paymentdescid"
								setSelectedData={setSelectOP}
								selected={selectedOP}
								action={() => {}}
							/>
							<SlideArrow
								direction="right"
								currentIndex={opIndex}
								setCurrentIndex={setOpIndex}
								width="50px"
								height="100%"
								refVariable={opRef}
								totalPages={totalOPPages}
							/>
						</div>
					</>
				)}
				{activeChild?.settlement && (
					<>
						<div className="text-center font-bold">{t("PAYMENT.OTHER_SETTLEMENTS")}</div>
						<div className="flex h-fit items-center justify-between">
							{/* Add Ledger specific inputs/components here */}
							<SlideArrow
								direction="left"
								currentIndex={osIndex}
								setCurrentIndex={setOsIndex}
								width="50px"
								height="100%"
								refVariable={osRef}
								totalPages={totalOSPages}
							/>
							<ListSlider
								componentRef={osRef}
								itemsPerPage={5}
								mainData={otherSettlement}
								totalPages={totalOSPages}
								buttonClass="h-10"
								name="paymentdesc"
								id="paymentdescid"
								setSelectedData={setSelectOS}
								selected={selectedOS}
								action={() => {}}
							/>
							<SlideArrow
								direction="right"
								currentIndex={osIndex}
								setCurrentIndex={setOsIndex}
								width="50px"
								height="100%"
								refVariable={osRef}
								totalPages={totalOSPages}
							/>
						</div>
					</>
				)}

				{/* Dynamic Balance Display Section */}
				{activeChild?.balance && activeChild.balance.length > 0 && (
					<div className="grid md:grid-cols-3 gap-4 text-black">
						{activeChild.balance.map(({ key, label }) => (
							<div key={key} className="bg-[#355364] rounded-lg p-2">
								<div className="text-center bg-[#294351] text-xs p-1 rounded-md font-medium text-white">
									{t(label)} {/* Use label from activeChild.balance */}
								</div>
								<div className="text-xl font-bold text-center text-white pt-1">
									{/* {formatRupees(
										parseFloat(cashBalance[label]),
										config?.amount,
										false
									) || 0}{" "} */}
									{formatRoundedRupees(parseFloat(cashBalance?.[key]), false) || 0}
								</div>
							</div>
						))}
					</div>
				)}

				{/* Dynamic Input Fields Section */}
				{inputRender.length > 0 && (
					<div className="w-full flex justify-center">
						<div
							className={`${
								activeChild?.inputTypes === "column"
									? "flex flex-col gap-4 w-full max-w-2xl align-middle justify-center"
									: `grid gap-4 w-fit mx-auto ${
											inputRender.length === 3 ? "grid-cols-3" : "grid-cols-4"
									  }`
							}`}>
							{inputRender.map(({ name, label, inputType, amount }) => {
								let shouldBeDisabled = false;
								const isCashPaymentChild = selectedChild === 11;
								const isCardPaymentChild = selectedChild === 12;

								if (isCashPaymentChild) {
									if (selectedType === "Exact") {
										// Disable totalAmt, change, paidAmt for Exact cash
										shouldBeDisabled = [
											"totalAmt",
											"change",
											"paidAmt",
										].includes(name);
									} else if (selectedType === "Cash") {
										// Disable only totalAmt for non-exact Cash
										shouldBeDisabled = [
											"totalAmt",
											"change",
											// "paidAmt",
										].includes(name);
									}
									// Note: 'tips' is never disabled by this logic
								}
								if (isCardPaymentChild) {
									// shouldBeDisabled = name === "cardAmt";
								}

								if (selectedChild === 42) {
									shouldBeDisabled = ["osAmount"];
								}

								const isReadOnly =
									name === "empName" || name === "empNameWastage";
								const isAmount =
									name.toLowerCase().includes("amt") ||
									name.toLowerCase().includes("amount") ||
									name === "tips" ||
									name === "tipsCard" ||
									name === "opAmounst" ||
									name === "osAmount" ||
									name === "change" ||
									name === "staffAmtWastage" ||
									// name === "staffAmt" ||
									name === "totalAmt";

								// //console.log({ name, isReadOnly, shouldBeDisabled });

								return (
									<div
										key={name}
										className={`${
											activeChild?.inputTypes === "column"
												? "flex items-center gap-1 w-sm justify-center m-auto ml-24"
												: "flex flex-row items-center gap-1 mb-2"
										}`}>
										<label
											className={
												activeChild?.inputTypes === "column"
													? "text-sm text-gray-200 min-w-[100px] text-right"
													: "text-xs text-gray-200 mb-1"
											}
											htmlFor={name}>
												{t(label)}:
										</label>

										{inputType === "search" ? (
											<CustomAutoComplete
												id={name}
												name={name}
												ref={focusInputRef}
												className="p-1 border border-gray-300 rounded-lg w-[100%] max-h-15 bg-white text-black resize-none"
												options={
													options.length
														? options.map((item) => ({
																key: item.emp_id_n,
																value: item,
																label: `${item.emp_code_v} - ${item.emp_edisplayname_v}`,
																item, // pass full item for use in onSelect
														  }))
														: [{ value: t("COMMON.NO_DATA_FOUND"), disabled: true }]
												}
												value={
													typeof inputValues[name] === "string"
														? inputValues[name]
														: inputValues[name]?.emp_code_v || ""
												}
												onFocus={setFocusedInput}
												onBlur={() => {
													// setFocusedInput(e, "", true);
													focusInputRef.current.blur();
													// focusInputRef.current.name = "";
													if (focusInputRef.current) {
														focusInputRef.current.clear();
													}
												}}
												onChange={(val) => {
													console.log("custom input Comp cahnge", val);
													// Let the user type — store raw string
													//console.log("autocomplete val oncha=ng", val);
													handleInputChange(name, val);
													onChange(val, name);
												}}
												onSelect={(_val, option) => {
													// When an option is selected, store the full object
													//console.log("options", option);
													handleInputChange(name, option.item);

													if (focusInputRef.current) {
														focusInputRef.current.clear();
													}
												}}
												filterOption={(inputValue, option) => {
													// Since option.value is the full item object, check the searchable fields
													const item = option.item || option.value;
													if (!item) return false;

													const searchTerm = inputValue.toLowerCase();
													const empCode =
														item.emp_code_v?.toString().toLowerCase() || "";
													const empName =
														item.emp_edisplayname_v?.toString().toLowerCase() ||
														"";

													return (
														empCode.includes(searchTerm) ||
														empName.includes(searchTerm)
													);
												}}
											/>
										) : inputType === "text" ? (
											<input
												id={name}
												type={"text"}
												inputMode={"text"}
												// step={isAmount ? "0.01" : undefined}
												name={name}
												// disabled={}
												value={inputValues[name]}
												onFocus={setFocusedInput}
												onChange={(e) => {
													handleInputChange(name, e.target.value);
													onChange(e.target.value, name);
												}}
												maxLength={20}
												// readOnly={isReadOnly}
												// disabled={shouldBeDisabled || isReadOnly}
												autoComplete="off"
												className={`h-9 px-2 rounded-md bg-white text-black font-semibold  ${
													amount && "text-right "
												} ${
													activeChild?.inputTypes === "column"
														? "w-full max-w-sm"
														: "w-32"
												}`}
											/>
										) : inputType === "textarea" ? (
											<textarea
												id="notes"
												type="text"
												className="p-1 border border-gray-300 rounded-lg w-[80%] max-h-15 bg-white text-black resize-none"
												maxLength={250}
												name={name}
												value={inputValues[name]}
												onChange={(e) => {
													handleInputChange(name, e.target.value);
													onChange(e.target.value, name);
												}}
												onFocus={setFocusedInput}
											/>
										) : isAmount ? (
											<NumericFormat
												className={`h-9 px-2 rounded-md text-black font-semibold bg-white ${
													amount && "text-right "
												} ${
													activeChild?.inputTypes === "column"
														? "w-full max-w-sm"
														: "w-32"
												}`}
												name={name}
												decimalScale={config?.amount || DEFAULT_DECIMALS}
												thousandSeparator=","
												maxLength={14}
												disabled={shouldBeDisabled || isReadOnly}
												fixedDecimalScale
												value={inputValues[name]}
												onFocus={setFocusedInput}
												// isAllowed={(values) => {
												// 	const { floatValue } = values;
												// 	return floatValue < MAX_LIMIT;
												// }}
												onValueChange={(values, event) => {
													if (!event?.event) return; // ✅ Guard clause to prevent undefined access
													//console.log("♨️♨️♨️");
													const target = event.event.target;
													//console.log(target.name);
													const { name } = target;
													const { value } = values;

													//console.log("EVENT", event.event);
													//console.log("Target:", target);
													//console.log("Name:", name);
													//console.log("Raw Value:", value);
													//console.log("Value Length:", value.length);

													const maxWholeDigits = 7;
													const decimalScale = config?.amount ?? 2;

													const parts = value.split(".");
													const wholePart = parts[0];
													const decimalPart = parts[1];

													if (wholePart.length > maxWholeDigits) {
														return;
													}

													if (
														decimalPart &&
														decimalPart.length > decimalScale
													) {
														return;
													}

													// if (value.length > 7) return;

													handleInputChange(name, value);
													onChange(value, name);
												}}
											/>
										) : (
											<input
												id={name}
												type={isAmount ? "number" : "text"}
												inputMode={isAmount ? "decimal" : "text"}
												// step={isAmount ? "0.01" : undefined}
												name={name}
												// disabled={}
												value={inputValues[name]}
												onFocus={setFocusedInput}
												onChange={(e) => {
													handleInputChange(name, e.target.value);
													onChange(e.target.value, name);
												}}
												maxLength={10}
												readOnly={isReadOnly}
												disabled={shouldBeDisabled || isReadOnly}
												autoComplete="off"
												className={`h-9 px-2 rounded-md bg-white text-black font-semibold  ${
													amount && "text-right "
												} ${
													activeChild?.inputTypes === "column"
														? "w-full max-w-sm"
														: "w-32"
												}`}
											/>
										)}
									</div>
								);
							})}

							{activeChild?.inputActions?.map((action) => (
								<div className="flex flex-col gap-3 w-full  justify-center  max-w-2xl">
									<button
										className="rounded-lg h-10 text-center transition-colors duration-150 bg-red-600 hover:bg-red-700 uppercase font-bold w-90 ml-30"
										onClick={() => handleClear(activeChild)}>
										{t(action.label)}
									</button>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Dynamic Cash Type Selection (e.g., Exact/Cash) */}
				{activeChild?.cashType &&
					activeChild.cashType.length !== 0 && ( // Only show if more than one option
						<div
							className={`grid ${
								activeChild.cashType.length === 1
									? `grid-cols-1`
									: `grid-cols-2`
							} gap-2`}>
							{activeChild.cashType.map((cash, index) => (
								<button
									key={`${cash.type}-${index}`} // Use a more robust key
									onClick={() => {
										if (selectedChild === 12) {
											handleInputChange(
												"cardAmt",
												parseFloat(cashBalance["Balance"])
											);
											//console.log({ cashBalance });
										}
										setSelectedType(cash.type);
									}}
									className={getButtonClass(cash.type === selectedType)}>
									{t(cash.label)}

								</button>
							))}
						</div>
					)}

				{/* Conditional Amount Buttons / Card Slider */}
				<div className="grid grid-cols-12 gap-2 w-full items-center pt-2">
					{/* Show Amount buttons only for Cash (id 11) */}
					{selectedChild === 11 && (
						<>
							<div className="col-span-12 sm:col-span-10 flex flex-wrap gap-2">
								{amounts.map((amt) => (
									<button
										key={amt}
										value={amt}
										className="flex-1 min-w-[50px] bg-slate-600 hover:bg-[#355364] py-2 px-1 rounded font-bold text-center text-sm transition-colors duration-150"
										onClick={() =>
											handleExactAmount({ target: { name, value: amt } })
										}>
										{amt}
									</button>
								))}
							</div>
							<div className="col-span-12 sm:col-span-2 flex items-center mt-2 sm:mt-0">
								<button
									className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded font-bold w-full h-10 transition-colors duration-150"
									onClick={handleClearExactAmt}>
									{t("PAYMENT.RESET_CASH")} {/* Changed from Rest */}
								</button>
							</div>
						</>
					)}

					{/* Show Card Slider only for Credit Card (id 12) */}
					{selectedChild === 12 &&
						cards.length > 0 && ( // Check if cards exist
							<>
								<div className="col-span-12 sm:col-span-10 grid grid-cols-[auto_1fr_auto] h-10 items-center w-full gap-1">
									<SlideArrow
										direction="left"
										currentIndex={cardIndex}
										setCurrentIndex={setCardIndex}
										width="40px" // Slightly smaller arrow
										height="100%"
										refVariable={cardRef}
										totalPages={totalCardPages}
										disabled={cardIndex === 0} // Disable if at start
									/>
									<ListSlider
										componentRef={cardRef}
										itemsPerPage={5}
										mainData={cards}
										totalPages={totalCardPages}
										buttonClass="h-10 flex-1 w-full bg-slate-600 hover:bg-[#355364] rounded font-medium text-sm" // Added base styling
										activeClass="bg-[#31B563] text-white" // Class for selected card
										name="carddesc"
										id="cardid"
										setSelectedData={setSelectedCard}
										selected={selectedCard} // Pass selected state
										action={() => {}} // Define action if needed
									/>
									<SlideArrow
										direction="right"
										currentIndex={cardIndex}
										setCurrentIndex={setCardIndex}
										width="40px" // Slightly smaller arrow
										height="100%"
										refVariable={cardRef}
										totalPages={totalCardPages}
										disabled={cardIndex >= totalCardPages - 1} // Disable if at end
									/>
								</div>
								<div className="col-span-12 sm:col-span-2 flex items-center mt-2 sm:mt-0">
									<button
										className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded font-bold w-full h-10 transition-colors duration-150"
										onClick={handleClearCard}>
										{t("PAYMENT.RESET_CARD")}
									</button>
								</div>
							</>
						)}
					{/* Placeholder if no cards */}
					{selectedChild === 12 && cards.length === 0 && (
						<div className="col-span-12 text-center text-gray-400">
							{t("PAYMENT.NO_CARDS_AVAILABLE")}
						</div>
					)}
				</div>
			</div>
		);
	}
);
