import { Icon } from "@iconify/react";
import { Modal, Spin, Table, Tooltip } from "antd";
import { useTranslation } from 'react-i18next';
import moment from "moment";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { AdlerLogo, companyLogo } from "../../assets/images";
import { getStoredCompanyLogo } from "../../utils/helpers";
import { Layout, ListSlider, SlideArrow } from "../../components";
import { showConfirmModal } from "../../components/ConfirmatinDialog";
import NumberInputModal from "../../components/PinINoutModal";
import { orderModel, productModel } from "../../plugins/models";
import payModel from "../../plugins/models/payModel";
import { selectCustomer } from "../../redux/selector/cuatomerSelector";
import {
	selectConfigLs,
	// selectPreviousId,
	selectCusotmerOrderMod,
	selectKotCust,
	selectKotDetails,
	selectKotEdit,
	selectKotPrev,
	selectKotTableUp,
	selectNotes,
	selectOrderType,
	// selectConfig,
	selectSelectedMenuList,
	selectTable,
	selectTotal,
} from "../../redux/selector/orderSlector";
import { updateCustomerData } from "../../redux/slices/customerSlice";
import {
	addAllDish,
	addDish,
	addTopping,
	customerOrderMod,
	emptyDishList,
	kotAdvance,
	kotDetails,
	kotEdit,
	kotPax,
	kotPreviousId,
	manageQtyKeyboard,
	notesReducer,
	removeDish,
	removeFullDish,
	resetOrder,
	updateDish,
	updateOrderType,
	updateTable,
} from "../../redux/slices/orderSlice";
import { filterByMultipleProperties, formatRupees } from "../../utils/helpers";
import { combineDateTime } from "../../utils/helpers/combileData";
import // getRefactorData,

// getTotalAmtView,
"../../utils/helpers/covnertValue";
import {
	parseDateTime,
	stringToISOString,
} from "../../utils/helpers/dateTimeConverter";
import {
	// transformOrderDataToArray,
	transformOrderDataToArray_ByIndex,
} from "../../utils/helpers/kotDetailConvert";
import { checkOrderType } from "../../utils/helpers/orderType";
import { sortByProperty } from "../../utils/helpers/sorting";
import { AdvanceOrder, PackageItem } from "./components";
import Notes from "./components/Notes";
import { useOrderPrinter } from "./hooks/kotPrint_hook";
import useThermalReceiptLayout from "./hooks/takeawayPrint";
import { mockReceiptData } from "./mock/data1";
// import { useThermalPrinter } from "../../utils/samplePrint/useThermalPrinter";
// import { usePdfGenerator } from "../../utils/sample/usePdfGeanrator";
// import { useDirectPdfPrinter } from "../../utils/sample/useDirectPdfPrinter";
import { useSampleThermalReceiptPrinter } from "../../hooks/sampleThermalReciptGenarator";
// import { sampleData } from "../../utils/data/sampleData";

import {
	updateOrderhdrid,
	updateTransferStatus,
} from "../../redux/slices/tblTransferSlice";
import {
	getIsDayClosed,
	userLogoutChecker,
} from "../../utils/helpers/logoutChecker";

let obj = {
	bookOrderNo: "",
	deliverDate: "",
	deliverTime: "",
	advanceCash: "",
	cardType: "",
	card: "",
	total: "",
	notes: "",
	kotReq: false,
	kotDate: "",
	kotTime: "",
	otherpayment: "",
	ref: "",
	otherAmount: "",
	deliveryReq: false,
};

function Kot() {
	const outletDetails = JSON.parse(localStorage.getItem("outletDetails"));
	const userDetails = JSON.parse(localStorage.getItem("user"));
	const dispatch = useDispatch();
	const [category, setCategory] = useState([]);
	const [subCategoryItem, setSubCategoryItem] = useState([]);
	const [topping, setTopping] = useState([]);
	const [subTopping, setSubTopping] = useState([]);
	const [categoryIndex, setcategoryIndex] = useState(0);
	const [subcategoryIndex, setSubCategoryIndex] = useState(0);
	const [toppingIndex, setToppingIndex] = useState(0);
	const [subToppingIndex, setSubToppingIndex] = useState(0);
	const [otherPayment, setOtherPayment] = useState([]);
	const { t } = useTranslation();
	const categoryRef = useRef();
	const subCategoryRef = useRef();
	const toppingRef = useRef();
	const modalRef = useRef(null);
	const updateModalRef = useRef(null);
	const subToppingRef = useRef();
	const prevOrderTypeIdRef = useRef(null);
	const printAreaRef = useRef(null);
	const toastRef = useRef(null);

	const reciptLayout = useThermalReceiptLayout(mockReceiptData);

	const totalCategoryPages = Math.ceil(category?.length / 10);
	const totalSubCategoryPages = Math.ceil(subCategoryItem?.length / 20);
	const totalToppingPages = Math.ceil(topping?.length / 5);
	const totalSubToppingPages = Math.ceil(subTopping?.length / 10);
	const [selected, setSelectedData] = useState();

	const selectedMenuList = useSelector(selectSelectedMenuList);
	const table = useSelector(selectTable);
	// const config1 = useSelector(selectConfig);
	const config = selectConfigLs;
	const orderType = useSelector(selectOrderType);
	const total = useSelector(selectTotal);
	const isEdit = useSelector(selectKotEdit);
	const isPrev = useSelector(selectKotPrev);
	const isCust = useSelector(selectKotCust);
	const reduxKotDetail = useSelector(selectKotDetails);
	// const previousOrderid = useSelector(selectPreviousId);
	const customerOrderModData = useSelector(selectCusotmerOrderMod);
	const tableUpdate = useSelector(selectKotTableUp);
	const notesSelect = useSelector(selectNotes);

	const customer = useSelector(selectCustomer);
	// const getCompanyLogo = useSelector((state) => state?.user?.comapnyLogoApi);
        const getCompanyLogo = getStoredCompanyLogo();
	// const { , , ,  } = useSelector(
	// 	(state) => state?.order
	// );
	// //console.log("✅✅🏅", { selectedMenuList });

	const transferStatus = useSelector(
		(state) => state.tbltransfer.tableTransferStatus
	);
	const orderhdrid = useSelector((state) => state.tbltransfer.orderhdrid);

	const navigate = useNavigate();
	const [selectedDish, setSelectedDish] = useState(null);
	const [loading, isLoading] = useState(false);
	const [loadingCat, isLoadingCat] = useState(false);
	const [loadingMn, isLoadingMn] = useState(false);
	const [loadingTp, isLoadingTp] = useState(false);
	const [loadingTt, isLoadingTt] = useState(false);
	const [loadingKotDetails, isLoadingKotDetails] = useState(false);
	const [pax, setPax] = useState("1");
	const [packageItem, setPackageItem] = useState(false);
	const [advanceOrder, setAdvanceOrder] = useState(obj);
	const [update, setUpdate] = useState(false);
	const [showKotList, setShowKotList] = useState(false);
	const [kotList, setKotList] = useState([]);
	const [kotDetail, setKotDetil] = useState(null);
	const [kotOrder, selectOrder] = useState(null);
	const [, updateMode] = useState(false);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isModalNotesOpen, setIsModalNotesOpen] = useState(false);
	const [preOpen, preClose] = useState(false);

	const [currentRow, setCurrentRow] = useState(null);
	const [notes, setNotes] = useState("");

	const [disableEdit, isDisableEdit] = useState(false);
	const [kotNumber, setKotNumber] = useState("");
	const [updatePrint, isUpdatePrint] = useState(false);
	const [, isUpdateable] = useState(false);
	const [authenticate, isAuthenticate] = useState(false);
	const [printing, isPrinting] = useState(false);
	const [printingMsg, isPrintingMSg] = useState(null);
	const [disableUpdate, isDisableUpdate] = useState(false);

	const [noteModal, setNoteModal] = useState(false);
	const [deleteNote, setDeleteNote] = useState(null);

	const keyboard = useRef();
	const keyboardNotes = useRef();
	const dekkKeyboardNotes = useRef();

	const templatesToPrint = ["KOT_SAVE", "TEMP_2"];

	const headerData = [
		{
			name: "ic:round-minus",
			// disabler: true,
			onclick: () => {
				manageQty(false);
			},
			className: "text-icon",
		},
		{
			name: "ic:round-add",
			// disabler: true,
			onclick: () => {
				manageQty(true);
			},
			className: "text-icon",
		},
		{
			name: "basil:edit-solid",
			disabler: true,
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
			name: showKotList ? "material-symbols:cancel" : "mingcute:bill-fill",
			onclick: async () => {
				if (isEdit) {
					if (selectedMenuList.length > 0) {
						const confirmed = await showConfirmModal({
							title: t('CHANGE_CONFIRMATION.TITLE'),
							text: t('CHANGE_CONFIRMATION.TEXT'),
							confirmText: t('CHANGE_CONFIRMATION.CONFIRM_TEXT'),
							cancelText: t('CHANGE_CONFIRMATION.CANCEL_TEXT'),
							icon: "question",
						});
						if (confirmed) {
							dispatch(emptyDishList());
							dispatch(kotDetails(null));
							dispatch(resetOrder());
							dispatch(updateCustomerData(null));
							setPax("1");
							setAdvanceOrder(obj);
							setSelectedData();
							dispatch(customerOrderMod(null));
							dispatch(kotEdit(false));
						} else {
							// //console.log("cancel change");
							return;
						}
					}
				}
				if (!showKotList) {
					dispatch(kotEdit(false));
				}
				updateMode(showKotList ? false : true);
				setShowKotList((prev) => !prev);
			},
			className: showKotList ? "text-icon color-red" : "text-icon",
		},
	];
	const tableColumn = [
		{
			title: 	t('ORDER.DESCRIPTION'),
			dataIndex: "menuname",
			key: "index",
			width: 250,
			onCell: () => {
				return {
					style: {
						whiteSpace: "normal", // Allows text to wrap
						wordWrap: "break-word", // Break long words if necessary
					},
				};
			},
			render: (text, record) => (
				<Tooltip
					title={
						record?.topping && (
							<span className="text-xs">{`( ${record?.topping?.map(
								(i) => i?.toping_name
							)} )`}</span>
						)
					}>
					<span className="w-[100%] line-clamp-2">
						{text}{" "}
						{record?.topping &&
							`( ${record?.topping?.map((i) => i?.toping_name)} )`}{" "}
					</span>
				</Tooltip>
			),
		},
		{
			title: 	t('ORDER.QUANTITY'),
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
			title: 	t('ORDER.RATE'),
			dataIndex: "salesprice",
			key: "index",
			width: 100,
			render: (text) => {
				// //console.log("salseprice", text);
				return (
					<span className="flex justify-end">
						{/* {Number(text)?.toFixed(config?.amount)} */}
						{formatRupees(Number(text), config?.amount, false)}
					</span>
				);
			},
		},
		{
			title: 	t('ORDER.AMOUNT'),
			dataIndex: "amount",
			key: "index",
			width: 100,
			render: (text) => {
				// //console.log("Amount", text);
				return (
					<span className="flex justify-end">
						{/* {Number(text)?.toFixed(config?.amount)} */}
						{formatRupees(Number(text), config?.amount, false)}
					</span>
				);
			},
		},
	];

	const kotListColumn = [
		{
			title: 	t('COMMON.CANCEL'),
			dataIndex: "delete",
			key: "orderhdrid",
			width: 80,
			render: (text, record) => (
				<button
					className=" rounded-lg p-1 text-center w-fit font-[500] text-red-600 hover:text-red-300"
					onClick={() => handleDeleteKot(record)}>
					<Icon icon={`material-symbols:delete`} width="24" height="24" />
				</button>
			),
		},
		{
			title: t('ORDER.KOT_NO'),
			dataIndex: "orderreferenceno",
			key: "orderhdrid",
			width: 200,
			render: (text) => <span className="flex justify-center">{text}</span>,
		},
		{
			title: 	t('ORDER.INVOICE_TYPE'),
			dataIndex: "ordertypedesc",
			key: "orderhdrid",
			width: 200,
			render: (text) => <span className="flex justify-center">{text}</span>,
		},
		{
			title: t('ORDER.AMOUNT'),
			dataIndex: "grossamount",
			key: "orderhdrid",
			width: 150,
			render: (text) => (
				<span className="flex justify-center">
					{formatRupees(Number(text), config?.amount, false)}
				</span>
			),
		},
	];

	const typeOrder = [
		{ id: 1, name: t('ORDER.DINE_IN'), action: () => {} },
		{ id: 2, name: t('ORDER.TAKEAWAY'), default: true, action: () => {} },
		{
			id: 4,
			name: t('ORDER.DELIVERY'),
			action: () => {
				navigate("/customerReg/delivery");
			},
		},
		{
			id: 3,
			name: t('ORDER.SPOT_ORDER'),
			action: () => {
				setIsModalOpen(true);
			},
		},
		{
			id: 6,
			name: t('ORDER.CAR_HOP'),
			action: () => {
				navigate("/customerReg/carhop");
			},
		},
		{
			id: 7,
			name: t('ORDER.PICK_UP'),
			action: () => {
				navigate("/customerReg/pickup");
			},
		},
	];
	useEffect(() => {
		getCategory();
		getToppingType();
		if (customerOrderModData && customerOrderModData?.orderhdrid !== "") {
			getKotDetails("customer");
		}
	}, []);

	useEffect(() => {
		// Skip if orderType is not yet set or empty
		if (!orderType || Object.keys(orderType).length === 0) {
			const defaultOrder = typeOrder.find((item) => item.default);
			if (defaultOrder) {
				dispatch(updateOrderType(defaultOrder));
				defaultOrder?.action?.(); // run its action too, if any
			}
			return; // Exit early - don't run the cleanup code
		}

		const currentOrderTypeId = orderType.id;

		// Only run cleanup if the ID has changed
		if (
			prevOrderTypeIdRef.current !== null &&
			prevOrderTypeIdRef.current !== currentOrderTypeId
		) {
			// Only clear customer data if NOT Car Hop (6) or Other condition (7)
			if (
				!isEdit &&
				!(kotDetail?.ordertype === "6" || kotDetail?.ordertype === "7")
			) {
				// //console.log("Chagning cusotmer ...❌", kotDetail?.vehicle_no);
				dispatch(updateCustomerData(null));
			}

			// Only clear advance data if NOT advance order (3)
			if (kotDetail?.ordertype !== "3") {
				dispatch(kotAdvance(null));
			}

			// //console.log("change order type", orderType);
		}
		prevOrderTypeIdRef.current = currentOrderTypeId;
	}, [orderType, kotDetail]);

	useEffect(() => {
		// //console.log("laoding test", loading);
		if (loading === "save") {
			Swal.fire({
				title: isEdit ? 	t('COMMON.UPDATE') : t('COMMON.SAVE'),
				allowOutsideClick: false,
				didOpen: () => {
					Swal.showLoading();
				},
			});
		}

		if (loading === "kotDelete") {
			Swal.fire({
				title: t('COMMON.CANCEL'),
				allowOutsideClick: false,
				didOpen: () => {
					Swal.showLoading();
				},
			});
		}
	}, [loading]);

	useEffect(() => {
		if (authenticate) {
			Swal.fire({
				title: t('COMMON.AUTHENTICATING'),
				allowOutsideClick: false,
				didOpen: () => Swal.showLoading(),
			});
		}
	}, [authenticate]);

	useEffect(() => {
		if (showKotList) {
			getKotList();
			dispatch(updateOrderType(null));
			dispatch(emptyDishList());
			dispatch(kotPreviousId(null));
			dispatch(customerOrderMod(null));
			setPax("1");
			dispatch(resetOrder());
			setSelectedData();
			dispatch(customerOrderMod(null));
			dispatch(kotEdit(false));
			setAdvanceOrder(obj);
			setSelectedData();
			isDisableUpdate(false);
		}
		setSelectedDish(null);
		// //console.log("redner..");
	}, [showKotList]);

	useEffect(() => {
		// //console.log("🚀🚀⚡⚡", advanceOrder);
		// dispatch(kotAdvance(advanceOrder));
	}, [advanceOrder]);

	useEffect(() => {
		if (kotOrder) getKotDetails("detail");
	}, [kotOrder]);

	useEffect(() => {
		// Early return if no KOT details
		if (!kotDetail || kotDetail?.length === 0) {
			return;
		}

		// //console.log({ kotDetail });

		// Process main order data
		// processOrderData();

		if (isEdit || isPrev) {
			dispatch(kotDetails(kotDetail));
		}

		// Handle special cases for advance orders
		// if (kotDetail?.ordertype === "3") {
		// 	processAdvanceOrder();
		// }

		// Set pax and update customer data
		updateMode(true);
		// setPax(kotDetail?.pax || "0");
	}, [kotDetail, isEdit]);

	useEffect(() => {
		if (!reduxKotDetail || reduxKotDetail?.length === 0) {
			return;
		}

		// //console.log("✅🌍✅", reduxKotDetail, "isEdit🚀", isEdit);
		if (isEdit || isPrev) {
			// //console.log({ isEdit, isPrev });
			processOrderData();
			if (reduxKotDetail?.ordertype === 3) {
				// //console.log("ORDERTYEP");
				processAdvanceOrder();
			}
			if (reduxKotDetail?.ordertype === 1 && !tableUpdate) {
				//console.log("table type order", reduxKotDetail);
				processTable();
			}
			if (reduxKotDetail?.orderstatusid === "2") {
				isDisableUpdate(true);
			} else {
				isDisableUpdate(false);
			}
			setPax(reduxKotDetail?.pax || "0");
			if (!isCust) updateCustomerInformation(reduxKotDetail);
		}
	}, [reduxKotDetail, isEdit]);
	// useEffect(() => {
	// 	if (
	// 		!selectedDish ||
	// 		typeof selectedDish !== "object" ||
	// 		selectedDish.qty === undefined
	// 	) {
	// 		// If no dish is selected, or it's not a valid object, or qty is undefined,
	// 		// the edit button should be disabled by default (or based on other logic not shown here).
	// 		// For this specific rule, if there's no valid dish, this rule doesn't make it "disabled due to package qty > 1".
	// 		// It might be disabled for other reasons (e.g., no selection at all).
	// 		isDisableEdit(false); // Or true if default is disabled when no selection
	// 		return;
	// 	}

	// 	const isPackageItem =
	// 		Array.isArray(selectedDish.packages) && selectedDish.packages.length > 0;
	// 	const quantity = Number(selectedDish.qty);

	// 	if (isPackageItem) {
	// 		if (!isNaN(quantity) && quantity > 1) {
	// 			isDisableEdit(true); // Disable edit for package item if qty > 1
	// 		} else {
	// 			isDisableEdit(false); // Enable edit for package item if qty is 1 or invalid (though should be valid)
	// 		}
	// 	} else {
	// 		isDisableEdit(false); // Not a package item, so this rule doesn't disable edit
	// 	}
	// }, [selectedDish]);

	useEffect(() => {
		if (
			!selectedDish ||
			typeof selectedDish !== "object" ||
			!selectedDish.key
		) {
			isDisableEdit(false);
			return;
		}

		const currentItemFromRedux = selectedMenuList.find(
			(item) => item.key === selectedDish.key
		);

		if (!currentItemFromRedux) {
			isDisableEdit(false);
			return;
		}

		// Now use currentItemFromRedux for your checks
		const isPackageItem =
			Array.isArray(currentItemFromRedux.packages) &&
			currentItemFromRedux.packages.length > 0;
		const quantity = Number(currentItemFromRedux.qty);

		if (isPackageItem) {
			if (!isNaN(quantity) && quantity > 1) {
				isDisableEdit(true);
			} else {
				isDisableEdit(false);
			}
		} else {
			isDisableEdit(false); // Not a package item
		}
	}, [selectedDish, selectedMenuList]);
	useEffect(() => {
		if (selectedMenuList?.length === 0) {
			// updateMode(false);
		}
		// //console.log("redner..!!", selectedMenuList);
	}, [selectedMenuList]);

	useEffect(() => {
		if (notesSelect !== "") {
			setNotes(notesSelect);
		}
	}, [notesSelect]);

	useEffect(() => {
		if (printing) {
			// Show toast and save the ID
			if (!toastRef.current) {
				toastRef.current = toast.loading(	t('COMMON.PRINTING'));
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

	// useEffect(() => {
	// 	// //console.log("Customer chages => ", customer);
	// }, [customer]);

	useEffect(() => {
		//console.log(transferStatus + "" + orderhdrid);
		if (transferStatus) {
			selectOrder(orderhdrid || "");
			dispatch(updateTransferStatus(false));
		}
	}, [orderhdrid, transferStatus]);

	//pritning handles
	const handlePrintSuccess = (printerName, templateType, message) => {
		//console.log(`PRINT SUCCESS [${printerName} - ${templateType}]: ${message}`);
		setKotNumber("");
		isPrinting(false);
		isPrintingMSg({ message: t('COMMON.PRINTING_COMPLETED'), error: false });
		isUpdatePrint(false);
	};

	const handlePrintError = (printerName, templateType, errorMsg) => {
		console.error(
			`PRINT ERROR [${printerName || "Config/Data"} ${
				templateType ? "- " + templateType : ""
			}]: ${errorMsg}`
		);
		isPrintingMSg({ message: errorMsg, error: true });
		isPrinting(false);
		setKotNumber("");
		isUpdatePrint(false);
	};

	const handleAllPrintsAttempted = (results) => {
		//console.log("All print jobs attempted for KOT:", kotNumber, results);
		isPrinting(false);
	};

	const [triggerPrint, printStatus] = useOrderPrinter({
		kotReferenceNo: kotNumber,
		templateTypesToPrint: templatesToPrint,
		onPrintInitiated: () => {
			//console.log("Printing process initiated for KOT:", kotNumber);
		},
		onPrintSuccess: handlePrintSuccess,
		onPrintError: handlePrintError,
		onAllPrintsAttempted: handleAllPrintsAttempted,
	});

	// const { generateAndPrintPdf } = useThermalPrinter();

	// const { generatePdfBlob, openPdfInNewTab } = usePdfGenerator();

	// const [triggerPrintPdf, pdfPrintStatus] = useDirectPdfPrinter({
	// 	onPrintInitiated: () => //console.log("Direct PDF print initiated..."),
	// 	onPrintSuccess: (message, printerName) => {
	// 		alert(`Success for ${printerName}: ${message}`);
	// 		// Optionally clear the file input
	// 	},
	// 	onPrintError: (error, printerName) => {
	// 		alert(`Error for ${printerName || "operation"}: ${error}`);
	// 	},
	// });

	const [triggerSamplePrint, samplePrintStatus] =
		useSampleThermalReceiptPrinter({
			printerName: "oneNote",
			templateType: "SAMPLE_KOT", // The specific template for this receipt
			onPrintInitiated: () => {
				//console.log(`Initiating GO_CRISPY_THERMAL print to ${"oneNote"}`),
			},
			onPrintSuccess: (message) => alert(	t('COMMON.PRINT_SUCCESS', { message })),
			onPrintError: (errorMsg) => alert(t('COMMON.PRINT_ERROR', { error: errorMsg })),
		});

	const loadOtherPayment = () => {
		payModel.getOtherPayments({ PaymentType: "2" }).then((data) => {
			if (data?.status === "true") {
				let formattedData =
					data?.data?.map((item) => ({
						label: item?.paymentdesc,
						value: item?.paymentdescid,
					})) || [];

				setOtherPayment(formattedData);
			} else {
				setOtherPayment([]);
				toast.error(data?.message || t('COMMON.SOMETHING_WRONG'));

			}
		});
	};

	const handleInitiatePrint = () => {
		if (kotNumber) {
			//console.log("this  pritn is call");
			isPrinting(true);
			triggerPrint();
		}
	};

	const handleInitiateUpdzatePrint = () => {
		if (kotNumber && updatePrint) {
			//console.log("this update pritn is call");
			isPrinting(true);
			triggerPrint({ isUpdate: true });
		}
	};

	const handleTableManagement = () => {
		// if (orderType.id === 3) {
		// 	Swal.fire({
		// 		title: 'Clear Data',
		// 		text: 'Do you want to clear data',
		// 		icon: 'question'
		// 	}).then((result) => {
		// 		if (result.isConfirmed) {
		// 			dispatch(updateCustomerData(null));
		// 			dispatch(kotAdvance(null))
		// 			dispatch(updateOrderType({ id: 1, name: "Dine In" }))
		// 			navigate("/tableManagement");
		// 		}
		// 	})
		// } else if (orderType.id === ) { }
		dispatch(updateCustomerData(null));
		dispatch(kotAdvance(null));
		dispatch(updateOrderType({ id: 1, name: t('ORDER.DINE_IN') }));
		navigate("/tableManagement");
	};

	const handleTableTransfer = () => {
		dispatch(updateCustomerData(null));
		dispatch(kotAdvance(null));
		dispatch(updateOrderType({ id: 1, name: t('ORDER.DINE_IN') }));
		navigate("/tableTransferdemo");
	};

	useEffect(() => {
		if (!printStatus.isLoading) {
			isPrinting(false);
		}
	}, [printStatus]);

	// const handleInitiateCancelPrint = () => {
	// 	if (kotNumber && isEdit) {
	// 		triggerPrint({ isCancel: true });
	// 	}
	// };

	useEffect(() => {
		if (updatePrint) {
			handleInitiateUpdzatePrint();
		} else {
			handleInitiatePrint();
		}
	}, [kotNumber, updatePrint]);

	// useEffect(() => {
	// 	if (printStatus) { }//console.log({ printStatus });
	// }, [printStatus]);

	useEffect(() => {
		//console.log({ samplePrintStatus });
	}, [samplePrintStatus]);

	useEffect(() => {
		if (isModalOpen) {
			loadOtherPayment();
		}
	}, [isModalOpen]);

	const processOrderData = () => {
		if (!kotDetail) {
			// dispatch(orderType(null));
			return;
		}

		// //console.log("♨️♨️", kotDetail);
		const data = transformOrderDataToArray_ByIndex(kotDetail.data);

		const orderType = {
			id: kotDetail?.ordertype,
			name: checkOrderType(kotDetail?.ordertype),
		};

		dispatch(notesReducer(kotDetail?.orderhdrnotes || ""));
		// //console.log("order edit", orderType, kotDetail);
		dispatch(updateOrderType(orderType));
		dispatch(addAllDish({ items: data }));
	};

	// const processAdvanceOrder = () => {
	// 	const {
	// 		advanceamount,
	// 		advancecardamount,
	// 		advancecashamount,
	// 		bookingno,
	// 		cardtype,
	// 		fireorderdate,
	// 		deliverydate,
	// 		kotfireorderreq,
	// 		deliveryreq,
	// 	} = reduxKotDetail;

	// 	//console.log("processAdvanceOrder 🎭♨️🏅", reduxKotDetail);
	// 	// Parse dates
	// 	// const { dateObj: kotDate, timeObj: kotTime } =
	// 	// 	dateTimeSeperator(fireorderdate);
	// 	// const { dateObj: dilDate, timeObj: dilTime } =
	// 	// 	dateTimeSeperator(deliverydate);

	// 	const { formateDate: kotDate, formateTime: kotTime } =
	// 		parseDateTime(fireorderdate);
	// 	const { formateDate: dilDate, formateTime: dilTime } =
	// 		parseDateTime(deliverydate);

	// 	// //console.log("reduxTosfasdf!!!", reduxKotDetail);
	// 	// //console.log({ kotDate, kotTime, dilDate, dilTime });
	// 	const cash =
	// 		typeof advancecashamount !== "string"
	// 			? advancecashamount.toFixed(config?.amount || 2) || "0"
	// 			: advancecashamount;

	// 	const cardCash =
	// 		typeof advancecardamount !== "string"
	// 			? advancecardamount.toFixed(config?.amount || 2) || "0"
	// 			: advancecardamount;

	// 	//console.log("REdux data", deliverydate, "parse date", dilDate);

	// 	setAdvanceOrder({
	// 		advanceCash: cash,
	// 		card: cardCash,
	// 		total: advanceamount || "0",
	// 		bookOrderNo: bookingno || "",
	// 		cardType: { cardid: cardtype || "" },
	// 		deliveryReq: deliveryreq === "0" ? false : true,
	// 		kotReq: kotfireorderreq === "0" ? false : true,
	// 		deliverDate: dilDate,
	// 		deliverTime: dilTime,
	// 		kotDate: kotDate,
	// 		kotTime: kotTime,
	// 	});

	// 	// dispatch(kotAdvance())
	// };

	const processAdvanceOrder = () => {
		const {
			advanceamount,
			advancecardamount,
			advancecashamount,
			bookingno,
			cardtype,
			otherpaymentreferno,
			fireorderdate, // e.g., "13-Jun-2025 11:47:39"
			deliverydate, // e.g., "20-Jun-2025 03:03:00"
			kotfireorderreq,
			deliveryreq,
			otherpaymentid,
			otherpaymentamount,
		} = reduxKotDetail;

		// //console.log("processAdvanceOrder 🎭♨️🏅", reduxKotDetail);

		// Using the parseDateTime function
		// Example: Outputting date as YYYY-MM-DD and time as HH:mm (seconds removed, 12-hour with AM/PM for deliverTime)
		const { formateDate: kotDate, formateTime: kotTime } = parseDateTime(
			fireorderdate,
			"YYYY-MM-DD",
			"HH:mm"
		); // Output: 2025-06-13, 11:47

		const { formateDate: dilDate, formateTime: dilTime } = parseDateTime(
			deliverydate,
			"YYYY-MM-DD",
			"h:mm a"
		); // Output: 2025-06-20, 3:03 am

		// Example if you want to keep original "DD-MMM-YYYY" for date and "HH:mm:ss" for time:
		// const { formateDate: kotDate, formateTime: kotTime } =
		//     parseDateTime(fireorderdate, "DD-MMM-YYYY", "HH:mm:ss"); // Output: 13-Jun-2025, 11:47:39

		// const { formateDate: dilDate, formateTime: dilTime } =
		//     parseDateTime(deliverydate, "DD-MMM-YYYY", "HH:mm:ss"); // Output: 20-Jun-2025, 03:03:00

		// //console.log("KOT Date:", kotDate, "⚡⚡", "KOT Time:", kotTime);
		// //console.log("Delivery Date:", dilDate, "⚡⚡", "Delivery Time:", dilTime);
		//console.log(
		// 	"Delivery Date(moment):",
		// 	moment(dilDate).format("DD-MMM-YYYY"),
		// 	"⚡⚡",
		// 	"Delivery Time(moment):",
		// 	moment(dilTime).format("h:mm a")
		// );

		const cash =
			typeof advancecashamount !== "string"
				? parseFloat(advancecashamount || 0).toFixed(config?.amount || 2) // Ensure parseFloat for numbers
				: advancecashamount;

		const cardCash =
			typeof advancecardamount !== "string"
				? parseFloat(advancecardamount || 0).toFixed(config?.amount || 2) // Ensure parseFloat
				: advancecardamount;

		setAdvanceOrder({
			advanceCash: cash,
			card: cardCash,
			total: parseFloat(advanceamount || 0).toFixed(config?.amount || 2), // Also format total
			bookOrderNo: bookingno || "",
			cardType: { cardid: cardtype || "" },
			deliveryReq: deliveryreq === "0" ? false : true,
			kotReq: kotfireorderreq === "0" ? false : true,
			deliverDate: moment(dilDate).format("DD-MMM-YYYY"), // Will hold "2025-06-20" or "20-Jun-2025" etc. based on output format
			// deliverTime: moment(dilTime).format("h:mm a"), // Will hold "3:03 am" or "03:03" etc. based on output format
			ref: otherpaymentreferno,
			otherpayment: otherpaymentid === 0 ? "" : otherpaymentid.toString(),
			otherAmount: otherpaymentamount,
			deliverTime: stringToISOString(
				moment(dilTime).format("h:mm a"),
				"h:mm a"
			), // Will hold "3:03 am" or "03:03" etc. based on output format
			kotDate: moment(kotDate).format("DD-MMM-YYYY"),
			kotTime: stringToISOString(moment(kotTime).format("h:mm a"), "h:mm a"),
		});
	};
	const processTable = () => {
		const { tableid, ordertablecode } = reduxKotDetail;
		const tableDetails = { tableid, tablecode: ordertablecode };
		//console.log("!!", { tableDetails });
		dispatch(updateTable({ tableDetails }));
	};

	const updateCustomerInformation = (data) => {
		if (!data) {
			dispatch(orderType(null));
			return;
		}
		const {
			customername,
			mobileno,
			customeraddress,
			ordervehicleno,
			pickupreferno,
			ledgerid,
		} = data;

		const customer = {
			customer_id: data?.customerid || "",
			vehicle_no: ordervehicleno || "",
			ref_no: pickupreferno || "",
			customer_name: customername || "",
			code: "",
			mobile_no: mobileno || "",
			email_id: "",
			zone: customeraddress,
			buildingno: "",
			street: "",
			unit: "",
			landmark: "",
			city: "",
			remarks: "",
			aggregator: ledgerid || "",
		};

		dispatch(updateCustomerData(customer));
	};

	const handleDeleteKot = async (item) => {
		// //console.log("delete kot ", item);
		setCurrentRow(item.orderhdrid);

		if (userLogoutChecker()) {
			return;
		}

		const { result, error } = getIsDayClosed();

		if (!result) {
			Swal.fire({
				icon: "warning",
				title: error ? error : t('OUTLET_SELECTION.DAY_CLOSED'),
				text: !error && t('OUTLET_SELECTION.CANNOT_SAVE_KOTS'),
			});
			return;
		}
		const confirmed = await showConfirmModal({
			title: t('ORDER.DELETE_KOT'),
			text: t('ORDER.CONFIRM_DELETE_KOT'),
			confirmText: t('COMMON.DELETE'),
			cancelText: t('COMMON.CANCEL'),
			icon: "warning",
		});

		if (confirmed) {
			setNoteModal(true);

			// perform delete logic here
		} else {
			//console.log("Cancelled!");
		}
	};

	/**
	 * The function `getCategory` retrieves category data based on employee and outlet details, handling
	 * success and error cases accordingly.
	 */
	const getCategory = () => {
		isLoadingCat(true);
		productModel
			.getCategory({
				employeeid: userDetails?.employeeid,
				outletid: outletDetails?.outlet,
			})
			.then((data) => {
				if (data?.status) {
					const sortedData = sortByProperty(data?.data, "categoryname");
					setCategory(sortedData);
				} else toast.error(data?.Error?.Error_Msg);
				isLoadingCat(false);
			})
			.catch((error) => {
				//console.log("Error while getting category", error), isLoadingCat(false);
			});
	};

	/**
	 * The function `getToppingType` fetches topping types from the product model and handles the response
	 * accordingly.
	 */
	const getToppingType = () => {
		isLoadingTt(true);
		productModel
			.getToppingType()
			.then((data) => {
				if (data?.status) {
					const sortedData = sortByProperty(data?.data, "toping_name");
					setTopping(sortedData);
				} else toast.error(data?.Error?.Error_Msg);
				isLoadingTt(false);
			})
			.catch((error) => {
				//console.log("Error while getting Topping type", error);
				isLoadingTt(false);
			});
	};

	const resetEvrything = () => {
		dispatch(resetOrder());
		dispatch(updateCustomerData(null));
		setPax("1");
		setAdvanceOrder(obj);
		setSelectedData();
		// setKotList([]);
		setShowKotList(false);
		isDisableUpdate(false);
		isDisableEdit(false);
	};

	const handleClear = (navigation) => {
		// //console.log("clear click");
		if (selectedMenuList.length === 0 && navigation) {
			resetEvrything();
			navigate(navigation);
			return;
		} else {
			Swal.fire({
				title: t('COMMON.CLEAR'),
				text: t('COMMON.CLEAR_DETAILS'),
				icon: "warning",
				showCancelButton: true,
				confirmButtonColor: "#d33",
				cancelButtonColor: "#3085d6",
				confirmButtonText: t('COMMON.OK'),
			}).then((result) => {
				if (result.isConfirmed) {
					resetEvrything();
					if (navigation) {
						navigate(navigation);
					}
					// dispatch(resetOrder());
					// dispatch(updateCustomerData(null));
					// dispatch(kotPax("1"));
					// setPax("1"); //todo add advvance clear detial later
					// setAdvanceOrder(obj);
					// setSelectedData();
					// dispatch(customerOrderMod(null));
					// dispatch(kotEdit(false));
					// setKotList([]);
					// Clear logic here
					// e.g., setFormData({ ...initialState });
					//console.log("Cleared");
				}
			});
		}
	};

	/**
	 * The `getMenu` function fetches menu items based on the provided category ID and updates the state
	 * with the retrieved data or displays an error message.
	 */
	const getMenu = (item) => {
		// isLoading("subMenu");
		isLoadingMn("subMenu");
		productModel
			?.getMenu({
				outletid: outletDetails?.outlet,
				employeeid: userDetails?.employeeid,
				categoryid: item,
			})
			.then((data) => {
				if (data?.status) {
					const sortedData = sortByProperty(data?.data, "menuname");
					setSubCategoryItem(sortedData);
				} else {
					setSubCategoryItem([]);
					toast.error(data?.Error?.Error_Msg);
				}
				// isLoading(false);
				isLoadingMn(false);
			})
			.catch((error) => {
				//console.log("Error while getting sub menu", error);
				// isLoading(false);
				isLoadingMn(false);
			});
	};

	const validateOrderForSaving = (orderTotal, items) => {
		// const numericTotal = Number(orderTotal);
		// if (isNaN(numericTotal) || numericTotal <= 0) {
		// 	Swal.fire({
		// 		icon: "warning", // Use warning icon for validation issues
		// 		title: "Zero rate item found",
		// 		text: "Total rate cannot be zero",
		// 	});
		// 	return false; // Validation failed
		// }

		if (items && items.length > 0) {
			// Only check if there are items
			const invalidItem = items.find((item) => {
				const itemPrice = Number(item?.salesprice);
				const itemQty = Number(item?.qty);
				// Check if price is invalid OR quantity is invalid
				return (
					isNaN(itemPrice) || itemPrice <= 0 || isNaN(itemQty) || itemQty <= 0
				);
			});

			if (invalidItem) {
				const itemPrice = Number(invalidItem?.salesprice);
				const itemQty = Number(invalidItem?.qty);
				let reason = "";
				if (isNaN(itemPrice) || itemPrice <= 0) {
					//console.log("Zero rate item found", invalidItem);
					reason = t('VALIDATION.ZERO_RATE_ITEM', { item: invalidItem.menuname });
				} else if (isNaN(itemQty) || itemQty <= 0) {
					//console.log("invalid item QTY", invalidItem);
					reason = t('VALIDATION.PROVIDE_QUANTITY', { item: invalidItem?.menuname });
				}

				Swal.fire({
					icon: "warning",
					title: t('VALIDATION.ZERO_RATE_TITLE'),
					text: reason,
				});
				return false; // Validation failed
			}
		} else {
			Swal.fire({
				icon: "warning",
				title: t('VALIDATION.NO_ITEMS_SELECTED'),
				text: t('VALIDATION.CANNOT_SAVE_EMPTY_ORDER'),
			});
			return false; // No items to save
		}

		// If all checks pass
		return true; // Validation succeeded
	};

	const getKotList = () => {
		isLoading("kotList");
		orderModel
			?.getKotList({
				outletid: outletDetails?.outlet,
				kotlistingtype: 0,
				ordertype: 0,
			})
			.then((data) => {
				if (data?.status === "true") {
					const filteredData = filterByMultipleProperties(
						data?.data,
						{
							orderstatus: t('KOT.STATUS_SETTLED'),
							// invoicestatusdesc: "Not Verified",
						},
						true
					);
					setKotList(filteredData);
				} else {
					setKotList([]);
					toast.error(data?.Error?.Error_Msg);
				}
				isLoading(false);
			})
			.catch((error) => {
				//console.log("Error while getting KOT list", error);
				isLoading(false);
			});
	};

	const getKotDetails = (type) => {
		// isLoading("kotDetails");
		//console.log("need to check what is kotOrder" + kotOrder);
		isLoadingKotDetails("kotDetails");
		// //console.log(
		// 	"customerOrderModData.orderhdrid",
		// 	customerOrderModData?.orderhdrid
		// );
		// //console.log("kotOrder", kotOrder);
		dispatch(emptyDishList());
		orderModel
			?.getKotDetails({
				orderhdrid:
					type === "customer" ? customerOrderModData.orderhdrid : kotOrder,
			})
			.then((data) => {
				if (data?.status === "true") {
					setKotDetil(data?.data[0]);
					// dispatch(emptyDishList());
					selectOrder(null);
					toast.success(data?.message || t('KOT.DETAILS_LOADED'));
				} else {
					setKotDetil(null);
					toast.error(data?.Error?.Error_Msg);
					// dispatch(emptyDishList());
				}
				// isLoading(false);
				isLoadingKotDetails(false);
			})
			.catch((error) => {
				//console.log("error when loading order detail", error);
				// isLoading(false);
				isLoadingKotDetails(false);
			})
			.finally(() => isLoadingKotDetails(false));
	};

	/**
	 * The function `getToppingMenu` fetches topping menu data based on a specified topping type ID and
	 * updates the state accordingly.
	 */
	const getToppingMenu = (item) => {
		// isLoading("subTop");
		isLoadingTp("subTop");
		productModel
			.getToppingMenu({
				toppingtypeid: item,
				outletid: outletDetails?.outlet,
			})
			.then((data) => {
				if (data?.status) {
					const sortedData = sortByProperty(data?.data, "toping_name");
					setSubTopping(sortedData);
				} else {
					setSubTopping([]);
					toast.error(data?.Error?.Error_Msg);
				}
				// isLoading(false);
				isLoadingTp(false);
			})
			.catch((error) => {
				//console.log("Error while getting sub-topping menu", error);
				// isLoading(false);
				isLoadingTp(false);
			});
	};

	/**
	 * The function `addMenuToList` adds a dish to a list using a dispatch action but on condition if not then will open the model for package item in React.
	 */
	const addMenuToList = (id, data) => {
		// //console.log("data added", data);
		return data?.menupackageitem
			? setPackageItem(data)
			: dispatch(addDish(data));
	};

	/**
	 * The function `onToppingSelection` dispatches an action to add a topping with the provided data.
	 */
	const onToppingSelection = (id, data) =>
		dispatch(
			addTopping({ data: data, id: selected?.key || selectedDish?.key })
		);

	/**
	 * The function `getTotalAmount` calculates the total amount by summing up the `amount` property of
	 * items in the `selectedMenuList` array.
	//  */
	// const getTotalAmount = () => {
	// 	//console.log("total!!", selectedMenuList);
	// 	return Number(
	// 		selectedMenuList
	// 			.reduce((sum, item) => sum + item.amount, 0)
	// 			?.toFixed(config?.amount)
	// 	);
	// };

	/**
	 * The `manageQty` function checks if a dish is selected and either adds or removes the selected dish
	 * based on the type parameter.
	 */
	const manageQty = (type) => {
		//console.log("selectedDish Mng Qty", selectedDish);
		!selectedDish
			? Swal.fire({ icon: "warning",title: t('ORDER.SELECT_DISH_FIRST')})
			: type
			? dispatch(updateDish(selectedDish))
			: dispatch(removeDish(selectedDish));
	};

	/**
	 * The function `onKeyInput` either dispatches an action to manage quantity with a keyboard input if a
	 * dish is selected, or updates the number of pax if no dish is selected.
	 */
	const onKeyInput = (value) => {
		//console.log("seelctedDish", selectedDish);
		const isCombo = selectedDish?.packages;
		return selectedDish
			? isCombo
				? null
				: dispatch(
						manageQtyKeyboard({ value: value, selectedDish: selectedDish })
				  )
			: setPax((prev) => {
					if (value === "C") {
						return "";
					} else if (value === "bk") {
						const newValue = prev.toString().slice(0, -1);
						return newValue ? parseInt(newValue, 10) : "";
					} else {
						return parseInt(prev.toString() + value.toString(), 10);
					}
			  });
	};
	/**
	 * The `saveKot` function in JavaScript React is used to save a KOT (Kitchen Order Ticket) with
	 * relevant details and menu items, displaying success or error messages accordingly.
	 */
	const saveKot = async () => {
		// //console.log("REdux customer", customer, orderType);
		if (userLogoutChecker()) {
			return;
		}

		const { result, error } = await getIsDayClosed();

		//console.log({ result, error });

		if (!result) {
			Swal.fire({
				icon: "warning",
				title: error ? error : t("OUTLET_SELECTION.DAY_CLOSED"),
				text: !error && t("OUTLET_SELECTION.CANNOT_SAVE_KOTS"),
			});
			return;
		}

		if (orderType === null) {
			Swal.fire({
				icon: "warning",
				title: t("OUTLET_SELECTION.SELECT_ORDER_TYPE"),
				text: t("OUTLET_SELECTION.EMPTY_ORDER_TYPE"),
			});

			return;
		}

		if (orderType?.id === 3 && advanceOrder?.bookOrderNo === "") {
			const result = await Swal.fire({
				icon: "warning",
				title: t('ORDER.BOOK_ORDER_NO_MISSING'),
                text: t('ORDER.EMPTY_BOOK_ORDER_NUMBER'),
				showCancelButton: true,
				confirmButtonText: t('COMMON.SUBMIT'),
				confirmButtonColor: "#ec4d4f",
				cancelButtonText: t('COMMON.CANCEL'),
				cancelButtonColor: "#3085d6",
			});

			if (!result.isConfirmed) {
				// User chose to cancel
				return;
			}
		}

		if (orderType?.id === 1 && !table?.tableDetails?.tablecode) {
			//console.log("table details", table?.tableDetails);
			Swal.fire({
				icon: "info",
				title: t('OUTLET_SELECTION.SELECT_TABLE'),
				text: t('OUTLET_SELECTION.CANNOT_SAVE_DINE_IN'),
			});
			return;
		}
		if (orderType?.id === 6 && (!customer || !customer?.vehicle_no)) {
			// //console.log("🚨🚨");
			Swal.fire({
				icon: "info",
				title: t('OUTLET_SELECTION.EMPTY_VEHICLE_NO'),
				text: t('OUTLET_SELECTION.CANNOT_SAVE_CAR_HOP'),
			});
			return;
		}

		if (
			orderType?.id === 7 &&
			(!customer || !customer?.vehicle_no || !customer?.ref_no)
		) {
			Swal.fire({
				icon: "info",
				title: t('OUTLET_SELECTION.EMPTY_VEHICLE_NO'),
				text: t('OUTLET_SELECTION.CANNOT_SAVE_CAR_HOP'),
			});
			return;
		}

		if (!validateOrderForSaving(total, selectedMenuList)) {
			// If validation fails, the Swal alert is shown inside the function
			// //console.log("Order validation failed.");
			return; // Stop the function execution
		}

		isLoading("save");
		const headers = isEdit ? reduxKotDetail : [];

		function getOrderDetails(mainData) {
			const order_details = [];

			//console.log("🚀🚀🚀🤣🤣🤣", mainData);
			mainData?.forEach((item) => {
				const mainIndex = order_details.length;

				order_details.push({
					orderhdrid: isEdit ? headers?.orderhdrid : 0,
					orderdtlid: isEdit ? item?.orderdtlid : 0,
					tableid: table?.tableDetails?.tableid || 0,
					menuid: Number(item?.menuid),
					orderqty: item?.qty.toString(),
					orderrate: parseFloat(
						Number(item?.salesprice).toFixed(config?.amount || 2)
					),
					notes: "",
					userid: Number(userDetails?.userid),
					toppingrate: 0.0,
					salesprice: parseFloat(
						Number(item?.salesprice * item?.qty).toFixed(config?.amount || 2)
					),
					menudesc: item?.menuname,
					// orderdtlreferno: null,
					// menupackagedtlid: null,
					toppings: item?.topping?.map((i) => i?.topping_id).toString() || "",
				});

				item?.packages?.forEach((pkg) => {
					//console.log("✅✅✅");
					pkg?.packages?.forEach((submenu) => {
						const basePrice = submenu?.submenuprice * submenu?.submenuqty;
						const basePriceWithoutQty = submenu?.submenuprice;

						const customeTotalWithoutQty = submenu?.custom
							? submenu.custom.reduce((sum, customItem) => {
									const itemPrice = parseFloat(customItem.customizemenuprice);
									return sum + itemPrice;
							  }, 0)
							: 0;

						// Calculate total from custom items
						const customTotal = submenu?.custom
							? submenu.custom.reduce((sum, customItem) => {
									const itemPrice =
										customItem.qty * parseFloat(customItem.customizemenuprice);
									return sum + itemPrice;
							  }, 0)
							: 0;

						// Calculate final total sales price
						const totalUnitSalePrice =
							parseFloat(basePriceWithoutQty) + customeTotalWithoutQty;
						const totalSalesPrice = parseFloat(
							(basePrice + customTotal).toFixed(config?.amount || 2)
						);

						//console.log("🚀🚀🚀", totalSalesPrice);

						order_details.push({
							tableid: table?.tableDetails?.tableid,
							menuid: submenu?.submenuid,
							orderqty: submenu?.submenuqty,
							orderrate: parseFloat(
								totalUnitSalePrice.toFixed(config?.amount || 2)
							),
							notes: "",
							userid: Number(userDetails?.userid),
							toppingrate: 0.0,
							salesprice: totalSalesPrice,
							menudesc: submenu?.submenudesc,
							orderdtlreferno: `${mainIndex}`, // reference to main item
							menupackagedtlid: submenu?.packagedtlid,
							toppings: submenu?.custom
								?.map((i) => i?.customizemenuid + "-" + i?.qty)
								.toString(),
						});
					});
				});
			});

			return order_details;
		}

		// console.log("advnace order", { advanceOrder });

		// //console.log("✅✅🎭🚨📌❌♨️⚡", table?.tableDetails?.tablecode);

		let sendData = {
			netamount: 0.0,
			bookingdate: moment().format("YYYY-MM-DDTHH:mm:ss"),
			orderstatus: orderType.id === 3 ? 4 : 1, //kot fier processing
			// formtypeid: 1,
			// orderhdrvoidnotes: "",
			// deleteauthorizedbyid: 0,
			mode: isEdit ? "UPDATE" : "INSERT",

			advanceamount: advanceOrder?.total || 0,
			orderhdrid: isEdit ? headers?.orderhdrid : 0,
			orderrefno: headers?.orderreferenceno || "",
			ordertype: orderType?.id,
			outletid: outletDetails?.outlet,
			companyid: outletDetails?.company,
			tableid: table?.tableDetails?.tableid || 0,
			tableCode: table?.tableDetails?.tablecode || 0,
			userid: Number(userDetails?.userid),
			employeeid: Number(userDetails?.employeeid),

			otherpaymentid: advanceOrder?.otherpayment || null,
			otherpaymentrefernceno: advanceOrder?.ref || "",
			otherpaymentamount: Number(advanceOrder?.otherAmount) || 0,

			// tablecode: table?.tableDetails?.tablecode || "",
			pax: Number(pax) || 0,
			grossamount: total,
			discountamount: 0.0,
			advancecardamount: advanceOrder?.card || 0,
			advancecashamount: advanceOrder?.advanceCash || 0,
			bookingno: advanceOrder?.bookOrderNo || 0,
			ordernotes: notes || "",
			cardtype: Number(advanceOrder?.cardType?.cardid) || 0,
			deliverydate: combineDateTime(
				advanceOrder?.deliverDate,
				advanceOrder?.deliverTime
			),
			fireorderdate: combineDateTime(
				advanceOrder?.kotDate,
				advanceOrder?.kotTime
			),
			kotfireorderreq: advanceOrder?.kotReq ? 1 : 0,
			deliveryreq: advanceOrder?.deliveryReq ? 1 : 0,

			ordervehicleno: customer?.vehicle_no || "",
			pickupreferno: customer?.ref_no || "",
			customeraddressdtlid: customer?.customeraddressdtlid || null,
			ledgerid: Number(customer?.aggregator) || 0,
			// mobileno: customer?.mobile_no || "",
			customerid: Number(customer?.customer_id) || 0,
			customername: customer?.customer_name || "",
			// customeraddressdtlid: null, //todo
			customeraddress:
				customer?.zone +
					customer?.street +
					customer?.buildingno +
					customer?.street +
					customer?.unit +
					customer?.landmark +
					customer?.city || "",
			order_details: getOrderDetails(selectedMenuList),
		};

		//console.log("redux data", selectedMenuList);
		//console.log("advanceOrder", advanceOrder);
		//console.log("header data", headers);
		//console.log("send data", sendData);

		orderModel
			.saveKotOrder(sendData)
			.then((data) => {
				if (data?.status === "true") {
					setKotNumber(data?.Koh_ReferNo_V);
					isUpdatePrint(isEdit);
					dispatch(emptyDishList());
					dispatch(kotAdvance(null));
					dispatch(updateCustomerData(null));
					dispatch(updateOrderType(null));
					dispatch(kotPreviousId(null));
					dispatch(kotPax("1"));
					setPax("1");
					setAdvanceOrder(obj);
					setSelectedData();
					dispatch(customerOrderMod(null));
					dispatch(kotEdit(false));
					dispatch(resetOrder());
					//
					Swal.fire({
						icon: "success",
						title: t("OUTLET_SELECTION.KOT_CREATED_SUCCESSFULLY"),
						text: `${t("OUTLET_SELECTION.REFERENCE_NO")}: ${data?.Koh_ReferNo_V}`,
					});
				} else {
					Swal.fire({
						icon: "warning",
						title: data?.message || data?.info,
					});
				}
				isLoading(false);
				// handlePrint();
			})
			.catch((error) => {
				//console.log("Error while saving KOT", error);
				isLoading(false);
			});
	};

	const updateKot = async () => {
		if (userLogoutChecker()) {
			return;
		}

		const { result, error } = await getIsDayClosed();

		if (!result) {
			Swal.fire({
				icon: "warning",
				title: error ? error : t("OUTLET_SELECTION.DAY_CLOSED"),
				text: !error && t("OUTLET_SELECTION.CANNOT_UPDATE_KOTS"),
			});
			return;
		}

		updateModalRef?.current?.openModal();
	};

	const handleNotesChange = (e) => {
		const { value } = e.target;
		setNotes(value);
		dispatch(notesReducer(value));
	};

	const handleContinue = () => {
		setIsModalNotesOpen(false);
	};

	const handleDelNotesChange = (e) => {
		const { value } = e.target;
		setDeleteNote(value);
		// dispatch(notesReducer(value));
	};

	const handleDelNoteContinue = () => {
		setNoteModal(false);
		modalRef.current?.openModal();
	};

	const handleVirtualAdvanceOrder = (e) => {
		const { name, value } = e.target;
		const decimals = config?.amount ?? 2;
		// const decimalRegex = new RegExp(
		// 	`^\\d{0,3}(,\\d{2})*(\\.\\d{0,${decimals}})?$|^\\d*\\.?\\d{0,${decimals}}$`
		// );
		// //console.log("virtualKey data", name, value);
		// //console.log("e data", e);
		let val = value;
		// //console.log({ val });
		if (name === "card" || name === "advanceCash") {
			// Clean and format rupee input
			let rawVal = val.replace(/[^0-9.]/g, ""); // Remove non-numeric characters except dot

			// Prevent multiple decimal points
			// const partsdot = rawVal.split(".");
			// if (partsdot.length > 2) {
			// 	rawVal = partsdot[0] + "." + parts.slice(1).join(""); // Keep only first dot
			// }
			// //console.log({ rawVal });
			// Prevent multiple decimal points
			const parts = rawVal.split(".");
			if (parts.length > 2) {
				rawVal = parts[0] + "." + parts.slice(1).join("");
			}

			// Limit decimal places
			if (parts[1]?.length > decimals) {
				parts[1] = parts[1].slice(0, decimals);
				rawVal = parts.join(".");
			}

			// Format as rupee string
			// val = formatRupees(Number(rawVal), decimals, false);
			// val = parseFloat(rawVal || 0).toFixed(2);
			val = rawVal;

			// if (val.length > 9) return;
		}

		if (name === "notes") {
			val = val.slice(0, 250);
		}

		if (name === "bookOrderNo") {
			val = val.slice(0, 9);
		}

		setAdvanceOrder((prev) => {
			const newAdvanceOrder = {
				...prev,
				[name]: val,
			};

			// Utility to parse rupee-formatted string to number
			const parseRupee = (str) => {
				if (!str) return null;
				let st = typeof str !== "string" ? str.toString() : str;
				const cleaned = st.replace(/,/g, "");
				const num = parseFloat(cleaned);
				return isNaN(num) ? null : num;
			};

			const cardVal = parseRupee(newAdvanceOrder.card);
			const cashVal = parseRupee(newAdvanceOrder.advanceCash);
			const opCash = parseRupee(newAdvanceOrder.otherAmount);

			// Collect only valid numeric values
			const values = [cardVal, cashVal, opCash].filter((v) => v !== null);

			const total = values.reduce((sum, val) => sum + val, 0);

			newAdvanceOrder.total = values.length ? total.toFixed(decimals) : "";

			return newAdvanceOrder;
		});

		// Sync value back to virtual keyboard
		if (keyboard?.current) {
			keyboard.current.setInput(val || "");
		}
	};

	// const handleBlur = (e) => {
	// 	const { name, value } = e.target;
	// 	if (["card", "advanceCash"].includes(name)) {
	// 		const formatted = parseFloat(value || 0).toFixed(config?.amount ?? 2);
	// 		// handleInputChange(name, formatted);
	// 		setAdvanceOrder((prev) => ({ ...prev, [name]: formatted }));
	// 	}
	// };

	const nestedColumns = [
		{
			title: t('ORDER.DESCRIPTION'),
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
			title: t('ORDER.QUANTITY'),
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
			title: t("ORDER.RATE"),
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

				//console.log("customTotal", customTotal);

				const totalAmount = parseFloat(basePrice) + customTotal;

				//console.log("total amount rate", record, totalAmount);
				return (
					<span className="flex justify-end">
						{formatRupees(totalAmount, config?.amount, false)}
					</span>
				);
			},
		},
		{
			title: t('ORDER.AMOUNT'),
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

	const onEdit = () => {
		if (!selectedDish)
			Swal.fire({
				icon: "warning",
				title: t("OUTLET_SELECTION.SELECT_DISH"),
			});
		else {
			if (selectedDish?.menupackageitem) {
				setPackageItem(selectedDish);
				setUpdate(true);
			}
		}
	};

	const handlePay = () => {
		if (selectedMenuList.length > 0) {
			navigate("/pay");
		} else {
			Swal.fire({
				icon: "warning",
				title: t("OUTLET_SELECTION.SELECT_MENU"),
				text: t("OUTLET_SELECTION.CANNOT_PROCEED_WITH_EMPTY_ITEM"),
			});
		}
	};

	const handleConfirmDelete = (value) => {
		// //console.log("PIN ENTERED - ", value);
		const authenticateBody = {
			pin: value,
			actiontype: "DELETE",
			transactiontype: 1,
		};
		const deleteBody = {
			orderhdrid: Number(currentRow || 0),
			userid: Number(userDetails?.userid || "0"),
			orderhdrvoidnotes: deleteNote || "",
		};

		//console.log("delecBody", deleteBody);
		// Show loading immediately
		isLoading("kotDelete");

		if (userLogoutChecker()) {
			isLoading(false);
			return;
		}

		orderModel
			.kotAuthenticate(authenticateBody)
			.then((data) => {
				if (data.status === "true") {
					return orderModel
						.deleteKot({
							...deleteBody,
							deleteauthorizedbyid: Number(
								data.data[0]?.deleteauthorizedbyid || 0
							),
						})
						.then((data) => {
							setDeleteNote("");
							if (data.status === "true") {
								getKotList();
								Swal.fire({
									icon: "success",
									title: t("OUTLET_SELECTION.DELETE_KOT"),
									text: data?.message || t("OUTLET_SELECTION.KOT_DELETED_SUCCESSFULLY"),
								});
							} else {
								throw new Error(data?.message || t("OUTLET_SELECTION.KOT_NOT_DELETED"));
							}
						});
				} else {
					throw new Error(
						data?.info || t("OUTLET_SELECTION.AUTHENTICATION_FAILED")
					);
				}
			})
			.catch((error) => {
				console.error("Deletion error:", error);
				Swal.fire({
					icon: "error",
					title: t("OUTLET_SELECTION.ERROR"),
					text: error.message || t("OUTLET_SELECTION.DELETION_FAILED"),
				});
			})
			.finally(() => {
				isLoading(false);
			});
	};

	const handleUpdateConfirmDelete = (value) => {
		// //console.log("PIN ENTERED - ", value);
		const authenticateBody = {
			pin: value,
			actiontype: "UPDATE",
			transactiontype: 1,
		};

		// Show loading immediately
		isAuthenticate(true);

		orderModel
			.kotAuthenticate(authenticateBody)
			.then((data) => {
				if (data.status === "true") {
					isUpdateable(true);
					isAuthenticate(false);
					saveKot();
				} else {
					isUpdateable(false);
					isAuthenticate(false);
					throw new Error(
						data?.info || t("OUTLET_SELECTION.AUTHENTICATION_FAILED")
					);
				}
			})
			.catch((error) => {
				isUpdateable(false);
				isAuthenticate(false);
				console.error("Deletion error:", error);
				Swal.fire({
					icon: "error",
					title: t("OUTLET_SELECTION.ERROR"),
					text: error.message || t("OUTLET_SELECTION.DELETION_FAILED"),
				});
			})
			.finally(() => {
				authenticate(false);
			});
	};

	const handleLoadAdvance = (load, delDate, delTime, kotDate, kotTIme) => {
		if (load) {
			const isoString = {
				kd: stringToISOString(kotDate),
				kt: stringToISOString(kotTIme, "h:mm a"),
				dd: stringToISOString(delDate),
				dt: stringToISOString(delTime, "h:mm a"),
			};

			setAdvanceOrder((prev) => ({
				...prev,
				kotDate: isoString.kd,
				kotTime: isoString.kt,
				deliverDate: isoString.dd,
				deliverTime: isoString.dt,
			}));

			// //console.log({ isoString });
			const advncOrder = {
				...advanceOrder,
				kotDate: stringToISOString(kotDate),
				kotTime: stringToISOString(kotTIme, "h:mm a"),
				deliverDate: stringToISOString(delDate),
				deliverTime: stringToISOString(delTime, "h:mm a"),
			};
			// //console.log("Advance data", advncOrder);
			dispatch(kotAdvance(advncOrder));
			setIsModalOpen(false);
		}
	};

	// useEffect(() => {
	// 	//console.log("advanceOrder changed", advanceOrder);
	// }, [advanceOrder]);

	//!!PRINT::::THERMAL::::
	// const handlePrint = () => {
	// 	preClose(true);
	// 	const content = printAreaRef.current;
	// 	if (content) {
	// 		const printWindow = window.open("", "_blank", "width=300,height=500");
	// 		if (!printWindow) {
	// 			alert("Please allow popups for this website to print the receipt.");
	// 			return;
	// 		}
	// 		printWindow.document.write("<html><head><title>Print Receipt</title>");
	// 		printWindow.document.write(`
	// 		<style>
	// 		  @page { margin: 0; size: 80mm auto; }
	// 		  body {
	// 			font-family: 'monospace', 'Courier New', Courier;
	// 			font-size: 10pt;
	// 			line-height: 1.2;
	// 			margin: 3mm;
	// 			padding: 0;
	// 			width: calc(80mm - 6mm);
	// 			overflow: hidden;
	// 		  }
	// 		  div, span { white-space: pre-wrap; word-break: break-all; }
	// 		</style>
	// 	  `);
	// 		printWindow.document.write("</head><body>");
	// 		printWindow.document.write(content.innerHTML);
	// 		printWindow.document.write("</body></html>");
	// 		printWindow.document.close();
	// 		printWindow.focus();

	// 		printWindow.onload = function () {
	// 			printWindow.print();
	// 		};
	// 		// Fallback if onload doesn't fire quickly
	// 		setTimeout(() => {
	// 			if (
	// 				!printWindow.document.readyState ||
	// 				printWindow.document.readyState === "complete"
	// 			) {
	// 				printWindow.print();
	// 			}
	// 		}, 500);
	// 	} else {
	// 		console.error("Print area not found or no receipt layout to print.");
	// 	}
	// };

	//!!PRINT::::THERMAL::::

	useEffect(() => {
		if (!selected?.categoryid && category) {
			// //console.log("$#$@#");
			setSelectedData((prev) => ({
				...prev,
				categoryid: category[0]?.categoryid,
			}));
			getMenu(category[0]?.categoryid);
		}
	}, [category, selected?.categoryid]);

	useEffect(() => {
		if (!selected?.topping_typeid && topping) {
			setSelectedData((prev) => ({
				...prev,
				topping_typeid: topping[0]?.topping_typeid,
			}));
			getToppingMenu(topping[0]?.topping_typeid);
		}
	}, [topping, selected?.topping_typeid]);

	const Shiftclosing = (closingtype) => {
		const Closingtype =
			closingtype === "dayendclosing" ? t("OUTLET_SELECTION.DAY_END_CLOSING") : t("OUTLET_SELECTION.SHIFT_CLOSING");
		Swal.fire({
			title: t("OUTLET_SELECTION.ARE_YOU_SURE"),
			text: `${t("OUTLET_SELECTION.DO_YOU_WANT_TO_PROCEED")} ${Closingtype}?`,
			icon: "question",
			showCancelButton: true,
			confirmButtonText: t("OUTLET_SELECTION.OK"),
			confirmButtonColor: "#ec4d4f",
			cancelButtonText: t("OUTLET_SELECTION.CANCEL"),
			cancelButtonColor: "#3085d6",
		}).then((result) => {
			if (result.isConfirmed) {
				closingtype === "dayendclosing"
					? navigate("/dayEndClosing")
					: navigate("/shiftClosing");
			}
		});
	};

	const footerData = [
		{
			content: t("OUTLET_SELECTION.CUSTOMER_ORDER"),
			onclick: () => {
				handleClear("/runningKot");
				// navigate("/runningKot");
			},
		},
		{
			content: (
				<div className="flex justify-center align-middle">
					<Icon icon="ant-design:snippets-outlined" width="24" height="24" />
					<Icon icon="ant-design:plus-outlined" width="18" height="18" />
					<Icon icon="ri:printer-fill" width="24" height="24" />
				</div>
			),
			onclick: () => {
				navigate("/report");
			},
		},
		{
			content: <Icon icon="hugeicons:file-01" width="24" height="24" />,
			onclick: () => {
				setIsModalNotesOpen(true);
			},
		},
		{
			content: <Icon icon="mingcute:time-line" width="24" height="24" />,
			onclick: () => {
				Shiftclosing("shiftClosing");
			},
		},
		{
			content: <Icon icon="mdi:lock-clock" width="24" height="24" />,
			onclick: () => {
				Shiftclosing("dayendclosing");
			},
		},
		{
			content: (
				<Icon icon="material-symbols:table-bar" width="24" height="24" />
			),
			disable: isEdit || false,
			onclick: handleTableManagement,
			// 	() => {
			// 	handleTableManagement
			// 	if (orderType?.id === 1) {
			// 		navigate("/tableManagement");
			// 	} else {
			// 		Swal.fire({
			// 			icon: "info",
			// 			title: "Table selection only allowed for Dine-In",
			// 		});
			// 	}
			// },
		},
		{
			content: (
				<div className="flex items-center gap-1">
					<Icon icon="material-symbols:table-bar" width="24" height="24" />
					<Icon icon="mingcute:transfer-line" width="15" height="15" />
					<Icon icon="material-symbols:table-bar" width="24" height="24" />
				</div>
			),
			onclick: handleTableTransfer,
			// 	() =>
			// {

			// 	if (orderType?.id === 1) {
			// 		navigate("/tableTransferdemo");
			// 	} else {
			// 		Swal.fire({
			// 			icon: "info",
			// 			title: "Not Allowed Table Transfer",
			// 			text: "Table transfer only allowed for Dine-In",
			// 		});
			// 	}
			// },
		},
		{
			content: t("OUTLET_SELECTION.CLEAR"),
			onclick: handleClear,
		},
	];

	// //console.log("advanceOrder", advanceOrder);
	const tableColumns = showKotList ? kotListColumn : tableColumn;
	const tableData = showKotList ? kotList : selectedMenuList;

	const tableLoading = showKotList
		? loading === "kotList"
		: loadingKotDetails === "kotDetails";

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
							// const isDisabled = disableEdit && item.disabler;
							// const isClickable = !disableEdit && !item.disabler;

							let isButtonDisabled = false;
							if (item.name === "basil:edit-solid" && disableEdit) {
								isButtonDisabled = true;
							} else if (item.disabler && !selectedDish) {
								// Example: disable if `disabler` is true and nothing is selected
								isButtonDisabled = true;
							}

							if (disableUpdate && index !== headerData.length - 1) {
								isButtonDisabled = true;
							}
							const disabledClasses = isButtonDisabled
								? "opacity-50 cursor-not-allowed"
								: "hover:bg-gray-200";

							return (
								// <button
								// 	disabled={isDisabled}
								// 	className={`${item?.className} rounded-lg p-1 flex items-center justify-center`}
								// 	style={{
								// 		cursor: !isDisabled ? "pointer" : "not-allowed",
								// 	}}
								// 	onClick={isDisabled ? () => {} : item?.onclick}
								// 	key={index}>
								// 	<Icon icon={item?.name} width="24" height="24" />
								// </button>
								<button
									disabled={isButtonDisabled} // Use the calculated disabled state
									className={`${item?.className} ${disabledClasses} rounded-lg p-1 flex items-center justify-center transition-opacity`}
									onClick={isButtonDisabled ? () => {} : item?.onclick} // Prevent click if disabled
									key={index}>
									<Icon icon={item?.name} width="24" height="24" />
								</button>
							);
						})}
					</div>
					{/* {//console.log("sedde", selectedMenuList)} */}

					{/* Table section */}
					<div className="bg-[#F2EDED] rounded-lg h-full">
						<div className={`${showKotList ? "h-full" : "h-50"} overflow-auto`}>
							<Table
								className=""
								scroll={{ y: showKotList ? 340 : 160 }}
								columns={tableColumns}
								dataSource={tableData}
								pagination={false}
								loading={{
									spinning: tableLoading,
									tip: t('COMMON.LOADING_DATA'),
									indicator: <Spin className="h-100 mt-6" size="small" />,
								}}
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
												className=" text-xs font-[600] p-1 py-2"
											/>
										),
										// row: () =>{}
									},
								}}
								onRow={(item) => ({
									className: `${
										showKotList
											? item?.orderhdrid === selectedDish?.orderhdrid
												? "bg-[#DED6D6]"
												: "bg-[#F2EDED]"
											: item?.key === selectedDish?.key
											? "bg-[#DED6D6]"
											: "bg-[#F2EDED]"
									} cursor-pointer`,
									onClick: () => {
										// //console.log("setSelectedDish(item);", item);
										setSelectedDish(item);
										// setSelectedData();
									},
									...(showKotList && {
										onDoubleClick: () => {
											// Your double-click logic here
											// //console.log("Double-clicked KOT item:", item);
											updateMode(true);
											dispatch(kotEdit(true));
											setShowKotList(false);
											selectOrder(item?.orderhdrid || "");

											// this for table transfer
											dispatch(updateOrderhdrid(item?.orderhdrid ?? ""));
										},
									}),
								})}
								expandable={{
									expandedRowRender: (record) => {
										//console.log("😂🤣😂", record.packages);
										//console.log(
										// 	"record",
										// 	record.packages?.flatMap((i) => i?.packages || [])
										// );
										return (
											<div
												style={{
													paddingLeft: "9%",
													backgroundColor: "#F2EDED",
												}}>
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
																	className="p-1 py-2 text-xs font-[600] text-blue-500 overflow-hidden break-words"
																/>
															),
														},
													}}
												/>
											</div>
										);
									},
									rowExpandable: (record) =>
										record.packages && record.packages.length > 0,
									// expandIcon: () => null,
									// expandedRowKeys: ['1'],
								}}
							/>
						</div>
						{!showKotList && (
							<div className="flex items-center justify-between">
								<div className="bg-white rounded-tr-xl  w-8/12 flex items-center justify-between  p-1">
									<button
										className="bg-[#C9CECF] rounded-lg p-2 text-black text-center w-[50%] h-12 font-[500] disabled:opacity-50 disabled:cursor-not-allowed"
										onClick={isEdit ? updateKot : saveKot}
										style={{
											cursor:
												loading === "save" || disableUpdate
													? "not-allowed"
													: "pointer",
										}}
										disabled={loading === "save" || disableUpdate}>
										{loading === "save" ? <Spin /> : isEdit ? t('COMMON.UPDATE') : t('COMMON.SAVE')}
									</button>
									{/* <div className=""> */}
									<input
										type="text"
										placeholder={t('ORDER.PAX')}
										className="bg-[#F2EDED] rounded-lg p-2 text-center w-[30%] h-12 font-[700] text-[#533535]"
										onFocus={() => setSelectedDish(null)}
										value={pax}
										onChange={(e) =>
											setPax(e.target.value.replace(/\D/g, "").slice(0, 5))
										}
									/>
									{/* </div> */}
									<span className="text-[#847272] text-2xl font-[600]">
										{t('COMMON.TOTAL')}
									</span>
								</div>
								<span className=" w-4/12 text-end font-[500] text-2xl text-black pr-2">
									{/* {getTotalAmount()} */}

									{/* {Number(total)?.toFixed(config?.amount)} */}
									{formatRupees(Number(total), config?.amount, false)}
								</span>
							</div>
						)}
					</div>

					{/* Type of Order section */}
					{!showKotList && (
						<div className="grid grid-cols-3 gap-1">
							{typeOrder?.map((item) => {
								return (
									<button
										key={item?.id}
										disabled={
											isEdit && item?.id !== orderType?.id ? true : false
										}
										onClick={() => {
											// //console.log(
											// 	" ->",
											// 	isEdit,
											// 	"orderType ->",
											// 	orderType,
											// 	item?.id,
											// 	"++",
											// 	isEdit && item?.id !== orderType.id ? true : false
											// );
											dispatch(updateOrderType(item));
											item?.action();
											// navigate(`/customerReg/${item.name}`);
										}}
										className={`${
											item?.id === orderType?.id
												? "bg-success"
												: "bg-[#C9CECF] text-black"
										} p-3 rounded-lg font-[500] ${
											isEdit && item?.id !== orderType?.id
												? "cursor-not-allowed"
												: "cursor-pointer"
										}`}>
										{item?.name}
									</button>
								);
							})}
						</div>
					)}
					{/* Dial Pad */}
					<div className="grid grid-cols-5 p-2 bg-[#F2EDED] gap-2">
						{[1, 2, 3, 4, 5, 6, 7, 8, 9, 0]?.map((item) => {
							return (
								<button
									key={item}
									className="rounded-md p-2 flex justify-center items-center text-black text-xl font-[500] bg-outlet  "
									onClick={() => onKeyInput(item.toString())}>
									{item}
								</button>
							);
						})}
						<div className="col-span-5  flex gap-2">
							<button
								className="rounded-md p-2  text-center  text-white text-xl font-[500] bg-[#5F7887] w-[30%]  "
								onClick={() => onKeyInput("C")}>
								C
							</button>
							<button
								className="rounded-md p-2  text-center  text-black text-xl font-[500] bg-outlet w-[60%]  "
								onClick={() => onKeyInput("00")}>
								00
							</button>
							<button
								className="rounded-md p-2  flex items-center justify-center  text-white text-xl font-[500] bg-[#5F7887] w-[30%]  "
								onClick={() => onKeyInput("bk")}>
								<Icon icon="tabler:arrow-left" width="20" height="20" />
							</button>
						</div>
						<div className="col-span-5  flex gap-2">
							<button
								className="rounded-md p-2  flex justify-center items-center  text-white text-xl font-[500] bg-primary w-[50%] disabled:opacity-50 "
								disabled={showKotList || disableUpdate}
								// disabled={showKotList || disableUpdate}
								onClick={() => navigate("/customerReg")}>
								<Icon icon="ooui:user-group-rtl" width="20" height="20" />
							</button>
							<button
								className="rounded-md p-2  text-center  text-white text-xl font-[500] bg-success w-[50%]  "
								onClick={handlePay}
								// onClick={() => handleAmountChange(item.toString())}
							>
								{t('FOOTER.PAY')}
							</button>
							{/* <button
								className="rounded-md p-2  flex justify-center items-center  text-white text-xl font-[500] bg-primary w-[30%]  "
								onClick={handelSamplePrint}
								// onClick={() => handleAmountChange(item.toString())}
							>
								<Icon icon="lets-icons:print-duotone" width="24" height="24" />
							</button> */}
						</div>
					</div>
					{/* Footer */}
					<div className="flex justify-between items-center">
						<div>
							<img
								src={AdlerLogo}
								width={"100%"}
								height={"100%"}
								className="w-20 pr-0.5"
								alt="adler-logo"
							/>
						</div>
						<div></div>
					</div>

					<NumberInputModal
						ref={modalRef}
						limit={6}
						imageUrl={getCompanyLogo}
						onConfirm={handleConfirmDelete}
					/>
					<NumberInputModal
						ref={updateModalRef}
						limit={6}
						imageUrl={getCompanyLogo}
						onConfirm={handleUpdateConfirmDelete}
					/>
				</div>
			}
			rightSection={
				<div className="flex flex-col gap-4  lg:gap-0 lg:justify-between h-[90%] mt-1 ">
					{/* Categories section */}
					<div className="flex h-fit items-center justify-between ">
						<SlideArrow
							direction="left"
							currentIndex={categoryIndex}
							setCurrentIndex={setcategoryIndex}
							width="50px"
							height="100%"
							refVariable={categoryRef}
							totalPages={totalCategoryPages}
							disable={showKotList || disableUpdate}
						/>
						{!loadingCat ? (
							<ListSlider
								componentRef={categoryRef}
								itemsPerPage={10}
								mainData={category}
								totalPages={totalCategoryPages}
								buttonClass="h-10"
								name="categoryname"
								id="categoryid"
								customeColor={true}
								setSelectedData={setSelectedData}
								selected={selected}
								action={getMenu}
								disable={showKotList || disableUpdate}
							/>
						) : (
							<Spin />
						)}
						<SlideArrow
							direction="right"
							currentIndex={categoryIndex}
							setCurrentIndex={setcategoryIndex}
							width="50px"
							height="100%"
							refVariable={categoryRef}
							totalPages={totalCategoryPages}
							disable={showKotList || disableUpdate}
						/>
					</div>
					{/* Sub-Categories section */}
					<div className="flex h-fit items-center justify-between">
						<SlideArrow
							direction="left"
							currentIndex={subcategoryIndex}
							setCurrentIndex={setSubCategoryIndex}
							width="50px"
							height="100%"
							refVariable={subCategoryRef}
							totalPages={totalSubCategoryPages}
							disable={showKotList || disableUpdate}
						/>
						{loadingMn !== "subMenu" ? (
							<ListSlider
								componentRef={subCategoryRef}
								itemsPerPage={20}
								mainData={subCategoryItem}
								totalPages={totalSubCategoryPages}
								buttonClass="h-10"
								name="menuname"
								id="menuid"
								setSelectedData={setSelectedData}
								selected={selected}
								menuColor={true}
								action={addMenuToList}
								bgSelectedColor="bg-slide-button"
								disable={showKotList || disableUpdate}
								bgColor="bg-success"
							/>
						) : (
							<Spin />
						)}
						<SlideArrow
							direction="right"
							currentIndex={subcategoryIndex}
							setCurrentIndex={setSubCategoryIndex}
							width="50px"
							height="100%"
							refVariable={subCategoryRef}
							totalPages={totalSubCategoryPages}
							disable={showKotList || disableUpdate}
						/>
					</div>
					{/* Topping section */}
					<div className="flex h-fit items-center justify-between">
						<SlideArrow
							direction="left"
							currentIndex={toppingIndex}
							setCurrentIndex={setToppingIndex}
							width="50px"
							height="100%"
							refVariable={toppingRef}
							totalPages={totalToppingPages}
							disable={showKotList || disableUpdate}
						/>
						{!loadingTt ? (
							<ListSlider
								componentRef={toppingRef}
								itemsPerPage={5}
								mainData={topping}
								totalPages={totalToppingPages}
								buttonClass="h-10"
								name="toping_name"
								id="topping_typeid"
								caseType={"uppercase"}
								setSelectedData={setSelectedData}
								selected={selected}
								disable={showKotList || disableUpdate}
								action={getToppingMenu}
							/>
						) : (
							<Spin />
						)}
						<SlideArrow
							direction="right"
							currentIndex={toppingIndex}
							setCurrentIndex={setToppingIndex}
							width="50px"
							height="100%"
							refVariable={toppingRef}
							totalPages={totalToppingPages}
							disable={showKotList || disableUpdate}
						/>
					</div>
					{/* Sub Topping section */}
					<div className="flex h-fit items-center justify-between">
						<SlideArrow
							direction="left"
							currentIndex={subToppingIndex}
							setCurrentIndex={setSubToppingIndex}
							width="50px"
							height="100%"
							refVariable={subToppingRef}
							totalPages={totalSubToppingPages}
							disable={showKotList || disableUpdate}
						/>
						{loadingTp !== "subTop" ? (
							<ListSlider
								componentRef={subToppingRef}
								itemsPerPage={10}
								mainData={subTopping}
								totalPages={totalSubToppingPages}
								buttonClass="h-10"
								name="toping_name"
								id="topping_id"
								setSelectedData={setSelectedData}
								selected={selected}
								action={onToppingSelection}
								bgSelectedColor="bg-slide-button"
								bgColor="bg-success"
								disable={showKotList || disableUpdate}
							/>
						) : (
							<Spin />
						)}
						<SlideArrow
							direction="right"
							currentIndex={subToppingIndex}
							setCurrentIndex={setSubToppingIndex}
							width="50px"
							height="100%"
							refVariable={subToppingRef}
							totalPages={totalSubToppingPages}
							disable={showKotList || disableUpdate}
						/>
					</div>
					{/* Bottom Menu section  */}
					<div className="grid grid-cols-4 md:grid-cols-7  gap-1 shrink-0 w-full ">
						{footerData?.map((item, index) => {
							return (
								<button
									key={index}
									onClick={item?.onclick}
									disabled={item?.disable || false}
									style={{
										cursor: item?.disable ? "not-allowed" : "pointer",
									}}
									className="rounded-lg p-2 flex items-center justify-center text-white  bg-kot-footer-btn">
									{item?.content}
								</button>
							);
						})}
					</div>

					{/* {orderType?.id === 3 && ( */}
					<AdvanceOrder
						onChange={handleVirtualAdvanceOrder}
						advanceOrderData={advanceOrder}
						keyRef={keyboard}
						defaultObj={obj}
						setAdvanceOrder={setAdvanceOrder}
						isModalOpen={isModalOpen}
						setIsModalOpen={setIsModalOpen}
						onLoadOk={handleLoadAdvance}
						isEdit={isEdit}
						otherPayment={otherPayment}
					/>
					{/* )} */}
					{packageItem && (
						<PackageItem
							setPackageItem={setPackageItem}
							menuData={packageItem}
							update={update}
							setUpdate={setUpdate}
						/>
					)}

					{/*//!PRINTER:::::THERMAL:::::: */}
					<PreviewWindow
						preOpen={preOpen}
						preClose={preClose}
						ref={printAreaRef}
						layout={reciptLayout}
					/>

					<Notes
						isModalOpen={isModalNotesOpen}
						setIsModalOpen={setIsModalNotesOpen}
						keyRef={keyboardNotes}
						notes={notesSelect}
						setNotes={(data) => {
							dispatch(notesReducer(data));
						}}
						onContinue={handleContinue}
						onChange={handleNotesChange}
					/>
					<Notes
						isModalOpen={noteModal}
						setIsModalOpen={setNoteModal}
						keyRef={dekkKeyboardNotes}
						notes={deleteNote}
						setNotes={(data) => {
							setDeleteNote(data);
						}}
						onContinue={handleDelNoteContinue}
						onChange={handleDelNotesChange}
					/>
				</div>
			}
		/>
	);
}

export default Kot;

const PreviewWindow = ({ preOpen, preClose, ref, layout }) => {
	return (
		<Modal open={preOpen} onCancel={() => preClose(false)} footer={null}>
			<div
				ref={ref}
				style={{
					border: "1px solid #ccc",
					padding: "10px",
					width: "302px" /* Approx 80mm */,
					fontFamily: "monospace",
					fontSize: "10pt",
					lineHeight: "1.2",
				}}>
				{layout}{" "}
				{/* This will render the <Printer> component and its children */}
			</div>
		</Modal>
	);
};
