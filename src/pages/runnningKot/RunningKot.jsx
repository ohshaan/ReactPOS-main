import { Icon } from "@iconify/react";
import { useTranslation } from 'react-i18next';
import { Empty, Spin, Table } from "antd";
import React, {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { orderModel, userModel } from "../../plugins/models";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import _ from "lodash";
import { checkOrderType } from "../../utils/helpers/orderType";
import { convertToFormattedDate, formatRupees } from "../../utils/helpers";
import { useDispatch } from "react-redux";
import { customerOrderMod, kotEdit } from "../../redux/slices/orderSlice";
import {
	// selectConfig,
	selectConfigLs,
	selectCurrentDateLs,
} from "../../redux/selector/orderSlector";
import { showConfirmModal } from "../../components/ConfirmatinDialog";
import NumberInputModal from "../../components/PinINoutModal";
import { Tuple } from "@reduxjs/toolkit";
import { useOrderPrinter } from "../kot/hooks/kotPrint_hook";
import { toast } from "react-toastify";
import { useInvoiceDetailPrinter } from "../kot/hooks/invoice_print";
import payModel from "../../plugins/models/payModel";
import moment from "moment";
import Notes from "../kot/components/Notes";
import {
	getIsDayClosed,
	userLogoutChecker,
} from "../../utils/helpers/logoutChecker";

function filterOrdersByDate(data) {
	// Parse current date: "02-Jul-2025 14:20:47"
	// const currentdate = selectCurrentDateLs;
	const serverDate = localStorage.getItem("dateTime");
	const currentDate = moment(serverDate).format("YYYY-MM-DD");
	//console.log({ serverDate });

	return data.filter((item) => {
		// Parse delivery date: "7/2/2025 7:11:19 AM"
		const deliveryDate = moment(
			item.deliverydate,
			"MM/DD/YYYY h:mm:ss A"
		).format("YYYY-MM-DD");

		return deliveryDate === currentDate;
	});
}

function RunningKot() {
	const dispatch = useDispatch();
	const modalRef = useRef(null);
	const modalRefMod = useRef(null);
	const toastRef = useRef(null);
	const keyboardNotes = useRef();
    const { t } = useTranslation();

	const getCompanyLogo = localStorage.getItem("cmpLogo");
	const userDetails = JSON.parse(localStorage.getItem("user"));

	// const config1 = useSelector(selectConfig);
	const config = selectConfigLs;
	const type = useMemo(() => [
    { name: t("ORDER.TAKEAWAY"), id: 2 },
    { name: t("ORDER.DELIVERY"), id: 4 },
    { name: t("ORDER.SPOT_ORDER"), id: 3 },
    { name: t("ORDER.DINE_IN"), id: 1 },
    { name: t("ORDER.CAR_HOP"), id: 6 },
    { name: t("ORDER.PICK_UP"), id: 7 },
], [t]);

	const [selected, setSelected] = useState(0);
	const [order, setOrder] = useState([]);
	const [orderType, setOrderType] = useState(0);
	const [listLoading, setListLoading] = useState(false);
	const navigate = useNavigate();

	const orderDetails = JSON.parse(localStorage.getItem("outletDetails"));
	const column = [
		{
			title: t("ORDER.KOT_NO"),
			dataIndex: "orderreferenceno",
			key: "index",
			render: (text) => <span className="flex justify-center">{text}</span>
		},
		{
			title: t("ORDER.DELIVERY_DATE_TIME"),
			dataIndex: "deliverydate",
			key: "index",
			render: (text) => (
				<span className="flex justify-center">
					{convertToFormattedDate(text)}
				</span>
			),
		},
		{
			title: t("ORDER.INVOICE_NO"),
			dataIndex: "invoiceno",
			key: "index",
			render: (text) => <span className="flex justify-center">{text}</span>,
		},
		{
			title: t("ORDER.ORDER_TYPE"),
			dataIndex: "ordertype",
			key: "index",
			render: (text) => (
				<span className="flex justify-center">{t(checkOrderType(text))}</span>
			),
		},
		{
			title: t("ORDER.ORDER_STATUS"),
			dataIndex: "orderstatus",
			key: "index",
			render: (text) => (
				<span className="flex justify-center">
					{t(`ORDER.STATUS.${text.toUpperCase()}`)}
				</span>
			),
		},
		{
			title: t("ORDER.AMOUNT"),
			dataIndex: "grossamount",
			key: "index",
			render: (text) => (
				<span className="flex justify-end pr-4">
					{formatRupees(Number(text), config?.amount, false)}
				</span>
			),
		},
	];
	const [loading, isLoading] = useState(false);
	const [authenticating, isAuthenticating] = useState(false);
	const [selectedOrder, setSelectedOrder] = useState(null);
	const [kotNumber, setKotNumber] = useState("");
	const [printing, isPrinting] = useState(false);
	const [printingMsg, isPrintingMSg] = useState(null);
	const [invoiceId, setInvId] = useState(null);
	const [changingStatus, isChangingStatus] = useState(false);
	const [isModalNotesOpen, setIsModalNotesOpen] = useState(false);
	const [notes, setNotes] = useState("");
	const templatesToPrint = ["KOT_SAVE", "TEMP_2"];

	useEffect(() => {
		getOrderList();
		setSelectedOrder(null);
		dispatch(customerOrderMod(null));
		dispatch(kotEdit(false));
	}, [orderType?.id, selected]);

	useEffect(() => {
		if (selectedOrder) {
			setKotNumber(selectedOrder?.orderreferenceno);
		}
	}, [selectedOrder?.orderreferenceno]);

	useEffect(() => {
		if (printing) {
			// Show toast and save the ID
			if (!toastRef.current) {
				toastRef.current = toast.loading(t("COMMON.LOADING_DATA"));
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
		if (changingStatus) {
			Swal.fire({
				title: t("CHANGE_CONFIRMATION.TITLE"),
				allowOutsideClick: false,
				didOpen: () => {
					Swal.showLoading();
				},
			});
		}
		if (!changingStatus) {
			Swal.close();
		}
	}, [changingStatus]);

	/**
	 * The `getOrderList` function fetches a list of orders based on certain parameters and updates the
	 * state accordingly.
	 */
	const getOrderList = () => {
		setListLoading(true);
		orderModel
			?.getKotList({
				outletid: orderDetails?.outlet,
				kotlistingtype: selected,
				ordertype: orderType?.id || 0,
			})
			.then((data) => {
				if (data?.status === "true") {
					const filterData = filterOrdersByDate(data?.data);
					// //console.log("filter data", filterData);
					setOrder(filterData);
				} else {
					setOrder([]);
					Swal.fire({
						icon: "warning",
						title: data?.Error?.Error_Msg,
					});
				}
				setListLoading(false);
			})
			.catch((error) => {
				setListLoading(false);
				//console.log("Error while getting running KOT", error);
			});
	};

	const getCurrentDaateTime = () => {
		const currentDate = userModel.getCurrentDate();

		if (currentDate.status === "true") {
			return currentDate.data?.currentdatetime;
		} else {
			return null;
		}
	};

	/**
	 * The function `checkSelected` checks if an order is selected and displays a warning message if not.
	 * @returns If the `selectedOrder` is not truthy, a warning message is displayed using SweetAlert
	 * (Swal) and `false` is returned. If `selectedOrder` is truthy, `true` is returned.
	 */
	const checkSelected = () => {
		if (!selectedOrder) {
			Swal.fire({
				icon: "warning",
				title: t("KOT.SELECT_ANY_RECORD_TO_PROCEED"),
			});
			return false;
		} else return true;
	};

	const onOrderCancel = async () => {
		if (checkSelected()) {
			if (userLogoutChecker()) {
				return;
			}

			const { result, error } = await getIsDayClosed();

			if (!result) {
				Swal.fire({
					icon: "warning",
					title: error ? error : t("KOT.DAY_CLOSED"),
					text: !error && t("KOT.CANNOT_CANCEL_KOTS"),
				});
				return;
			}

			//console.log("okookokokoko", selectedOrder);
			const confirmed = await showConfirmModal({
				title: t("KOT.CANCEL_KOT"),
				text: t("KOT.CANCEL_KOT_CONFIRMATION"),
				confirmText: t("COMMON.DELETE"),
				cancelText: t("COMMON.CANCEL"),
				icon: "warning",
			});

			if (confirmed) {
				setIsModalNotesOpen(true);
				// modalRef.current?.openModal();
				// perform delete logic here
			} else {
				//console.log("Cancelled! cancel");
			}
		}
	};

	const handleConfirmDelete = (value) => {
		//console.log("PIN ENTERED - ", value);
		const authenticateBody = {
			pin: value,
			actiontype: "DELETE",
			transactiontype: 1,
		};
		const deleteBody = {
			orderhdrid: Number(selectedOrder?.orderhdrid || 0),
			userid: Number(userDetails?.userid || "0"),
			orderhdrvoidnotes: notes,
		};

		// Show loading immediately
		isLoading("kotDelete");

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
							setNotes("");
							if (data.status === "true") {
								Swal.fire({
									icon: "success",
									title: t("KOT.DELETE_KOT"),
									text: data?.message || t("KOT.KOT_DELETED_SUCCESSFULLY"),
								}).then((result) => {
									if (result.isConfirmed) {
										getOrderList();
									}
								});
							} else {
								throw new Error(data?.message || t("KOT.KOT_NOT_DELETED"));
							}
						});
				} else {
					throw new Error(
						data?.info || t("KOT.AUTHENTICATION_FAILED")
					);
				}
			})
			.catch((error) => {
				console.error("Deletion error:", error);
				Swal.fire({
					icon: "error",
					title: t("COMMON.ERROR"),
					text: error.message || t("COMMON.DELETION_FAILED"),
				});
			})
			.finally(() => {
				isLoading(false);
			});
	};

	const onOrderModify = async () => {
		if (checkSelected()) {
			//console.log("okookokokoko", selectedOrder);

			if (userLogoutChecker()) {
				return;
			}

			const { result, error } = await getIsDayClosed();

			if (!result) {
				Swal.fire({
					icon: "warning",
					title: error ? error : t("KOT.DAY_CLOSED"),
					text: !error && t("KOT.CANNOT_MODIFY_KOTS"),
				});
				return;
			}

			const confirmed = await showConfirmModal({
				title: t("KOT.MODIFY_KOT"),
				text: t("KOT.MODIFY_KOT_CONFIRMATION"),
				confirmText: t("COMMON.MODIFY"),
				cancelText: t("COMMON.CANCEL"),
				icon: "warning",
			});

			if (confirmed) {
				dispatch(kotEdit(true));
				navigate("/kot");
				modalRefMod.current?.openModal();

				// perform delete logic here
			} else {
				//console.log("Cancelled! cancel");
			}
		}
	};

	const handleConfirmModify = (value) => {
		const authenticateBody = {
			pin: value,
			actiontype: "UPDATE",
			transactiontype: 1,
		};
		// const deleteBody = {
		// 	orderhdrid: selectedOrder?.orderhdrid,
		// 	userid: userDetails?.userid,
		// };

		// Show loading immediately
		isLoading("Modify");
		isAuthenticating(true);
		orderModel
			.kotAuthenticate(authenticateBody)
			.then((data) => {
				isAuthenticating(false);
				if (data.status === "true") {
					isLoading(false);
					// isAuthenticating(false);
					dispatch(kotEdit(true));
					navigate("/kot");
				} else {
					isAuthenticating(false);
					throw new Error(
						data?.info || t("KOT.AUTHENTICATION_FAILED")
					);
				}
			})
			.catch((error) => {
				console.error("Modify error:", error);
				Swal.fire({
					icon: "error",
					title: t("COMMON.ERROR"),
					text: error.message || t("COMMON.DELETION_FAILED"),
				});
			})
			.finally(() => {
				isLoading(false);
				isAuthenticating(false);
			});
	};

	const handlePrintSuccess = (printerName, templateType, message) => {
		//console.log(`PRINT SUCCESS [${printerName} - ${templateType}]: ${message}`);
		setKotNumber("");
		isPrinting(false);
		isPrintingMSg({ message: t("KOT.PRINTING_COMPLETED"), error: false });
		// isUpdatePrint(false);
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
		// isUpdatePrint(false);
	};

	const handleAllPrintsAttempted = (results) => {
		//console.log("All print jobs attempted for KOT:", kotNumber, results);
		isPrinting(false);
	};

	const targetPrinter = import.meta.env.VITE_INV_PRINTER;

	const [triggerPrint, printStatus] = useOrderPrinter({
		kotReferenceNo: kotNumber,
		templateTypesToPrint: templatesToPrint,
		onPrintInitiated: () => {
			//console.log("Printing process initiated for KOT:", kotNumber),
		},
		onPrintSuccess: handlePrintSuccess,
		onPrintError: handlePrintError,
		onAllPrintsAttempted: handleAllPrintsAttempted,
	});

	const [invoicePrintertrigger, invoicePrintStatus] = useInvoiceDetailPrinter({
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
			isPrintingMSg({ message: t("KOT.PRINTING_COMPLETED"), error: false });
			isPrinting(false);
		},
		onPrintError: (errorMsg) => {
			toast.error(
				t("KOT.INVOICE_PRINT_ERROR", { invoiceId, printerName: targetPrinter, error: errorMsg })
			);
			isPrintingMSg({ errorMsg, error: true });
			isPrinting(false);
		},
	});

	const handleChangeStatus = () => {
		isChangingStatus(true);
		payModel
			.kotFireOrderStatus({
				orderhdrid: selectedOrder?.orderhdrid,
			})
			.then((data) => {
				if (data.status === "true") {
					toast.success(t("KOT.KOT_FIRED_SUCCESSFULLY"));
					getOrderList();
					isChangingStatus(false);
				}
			})
			.catch((error) => {
				console.error("Error updating order status:", error);
				isChangingStatus(false);
			});
	};

	const handleReprint = () => {
		//console.log("selecte order", selectedOrder);
		setInvId(selectedOrder?.invoiceid);
		if (userLogoutChecker()) {
			return;
		}

		if (selected === 0)
			if (selectedOrder?.orderstatus === "Processed") {
				handleChangeStatus();
			}
		if (kotNumber) {
			//console.log("this  pritn is call");
			isPrinting(true);
			triggerPrint();
		}
		if (selected === 1) {
			if (invoiceId) {
				//console.log("this  invoice print is call");
				isPrinting(true);
				invoicePrintertrigger();
			}
		}
	};

	const handleContinue = () => {
		setIsModalNotesOpen(false);
		modalRef.current?.openModal();
		// modalRefMod.current?.openModal();
	};

	const debouncedSetNotes = useMemo(() => {
		return _.debounce((val) => {
			setNotes(val);
		}, 0); // delay in ms
	}, []);

	const handleNotesChange = useCallback(
		(e) => {
			const { value } = e.target;
			// //console.log("Typed:", value);
			debouncedSetNotes(value); // debounce actual update
		},
		[debouncedSetNotes]
	);

	useEffect(() => {
		return () => {
			debouncedSetNotes.cancel();
		};
	}, [debouncedSetNotes]);

	useEffect(() => {
		// //console.log("laoding test", loading);
		// if (loading === "save") {
		// 	Swal.fire({
		// 		title: isEdit ? "Updating..." : "saving...",
		// 		allowOutsideClick: false,
		// 		didOpen: () => {
		// 			Swal.showLoading();
		// 		},
		// 	});
		// }

		if (loading === "kotDelete") {
			Swal.fire({
				title: t("KOT.DELETING"),
				allowOutsideClick: false,
				didOpen: () => {
					Swal.showLoading();
				},
			});
		}
	}, [loading]);

	useEffect(() => {
		if (authenticating) {
			Swal.fire({
				title: t("COMMON.AUTHENTICATING"),
				allowOutsideClick: false,
				didOpen: () => {
					Swal.showLoading();
				},
			});
		}
		if (!authenticating) {
			Swal.close();
		}
	}, [authenticating]);
	return (
		<div className="p-2 flex flex-col h-screen overflow-auto lg:overflow-hidden gap-2">
			{/* Top Header section */}
			<div className="flex justify-between items-center">
				<span className="font-[600] text-lg w-11/12 text-center">
					{t("KOT.RUNNING_ORDERS")}
				</span>
				<Icon
					icon="carbon:close-filled"
					width="30"
					height="30"
					className="cursor-pointer"
					onClick={() => navigate(-1)}
				/>
			</div>
			<div className="grid grid-cols-2 gap-2">
				<button
					className={`rounded-lg p-2 text-center font-[600] ${
						selected ? "bg-kot-footer-btn" : "bg-success"
					}`}
					onClick={() => setSelected(0)}>
					{t("KOT.RUNNING_ORDERS")}
				</button>
				<button
					className={`rounded-lg p-2 text-center font-[600] ${
						!selected ? "bg-kot-footer-btn" : "bg-success"
					}`}
					onClick={() => setSelected(1)}>
					{t("KOT.SETTLED_ORDERS")}
				</button>
			</div>

			{/* Filter Section */}
			<div className="grid grid-cols-3 md:grid-cols-6 gap-2">
				{type?.map((item) => {
					return (
						<button
							className={`${
								orderType?.id === item?.id ? "bg-success" : "bg-primary"
							} rounded-lg p-2 text-white`}
							onClick={() => setOrderType(item)}>
							{item?.name}
						</button>
					);
				})}
			</div>
			{/* {//console.log("sadasd", selectedOrder)} */}
			{/* List display section */}
			<div className="bg-[#F2EDED] rounded-lg pb-1 flex-grow lg:overflow-auto">
				<Table
					className="lg:w-full overflow-auto"
					columns={column}
					dataSource={order}
					pagination={false}
					loading={{
						spinning: listLoading,
						tip: t("COMMON.LOADING_DATA"),
						indicator: <Spin className="h-100 mt-6" size="small" />,
					}}
					locale={{
						emptyText: (
							<div className="w-full h-full flex items-center justify-center bg-[#F2EDED] py-4">
								<Empty description={t("KOT.NO_ORDERS_FOUND")} />

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
									className=" p-0 py-1 overflow-hidden text-ellipsis"
									style={{
										borderBottom: "1px solid #DED6D6",
									}}
								/>
							),
						},
					}}
					onRow={(record) => ({
						className: `${
							record?.orderreferenceno === selectedOrder?.orderreferenceno
								? "bg-[#DED6D6]"
								: "bg-[#F2EDED]"
						} cursor-pointer`,
						onClick: () => {
							setSelectedOrder(record);
							dispatch(customerOrderMod(record));
						},
					})}
				/>
			</div>
			<div className="grid grid-cols-3 gap-2">
				<button
					className="bg-[#F2EDED] rounded-lg p-2 text-black font-[700] disabled:opacity-50 "
					onClick={onOrderModify}
					disabled={selected === 1}>
					{t("KOT.MODIFY_ORDER")}
				</button>
				<button
					className="bg-[#F2EDED] rounded-lg p-2 text-black font-[700]"
					onClick={handleReprint}>
					{t("KOT.REPRINT_FIRE_ORDER")}
				</button>
				<button
					className="bg-[#F2EDED] rounded-lg p-2 text-black font-[700]"
					onClick={onOrderCancel}>
					{t("KOT.CANCEL_ORDER")}
				</button>
			</div>

			<NumberInputModal
				ref={modalRef}
				limit={6}
				imageUrl={getCompanyLogo}
				onConfirm={handleConfirmDelete}
				t
			/>
			<NumberInputModal
				ref={modalRefMod}
				limit={6}
				imageUrl={getCompanyLogo}
				onConfirm={handleConfirmModify}
			/>

			<Notes
				isModalOpen={isModalNotesOpen}
				setIsModalOpen={setIsModalNotesOpen}
				keyRef={keyboardNotes}
				notes={notes}
				setNotes={(data) => {
					setNotes(data);
				}}
				onContinue={handleContinue}
				onChange={handleNotesChange}
			/>
		</div>
	);
}

export default RunningKot;
