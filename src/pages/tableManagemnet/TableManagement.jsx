import { Icon } from "@iconify/react";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SlideArrow } from "../../components";
import { tableModel } from "../../plugins/models";
import Swal from "sweetalert2";
import { Spin } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { kotTableIpdate, updateTable } from "../../redux/slices/orderSlice";
import { selectKotEdit } from "../../redux/selector/orderSlector";
import { useTranslation } from "react-i18next";

function TableManagement() {
        // const outletDetails = JSON.parse(localStorage.getItem("outletDetails"));
        const navigate = useNavigate();
        const totalItem = window.screen.width <= 540 ? 30 : 49;
        const [tablePage, setTablePage] = useState(0);
        const [tableData, setTableData] = useState([]);
        const [tableLoc, setTableLoc] = useState([]);
        const [loading, isLoading] = useState(false);
        const dispatch = useDispatch();
        const outletDetails = JSON.parse(localStorage.getItem("outletDetails"));
        const { t } = useTranslation();

	const isEdit = useSelector(selectKotEdit);
	const { table: tableSelector } = useSelector((state) => state?.order);
	// console.log("orderDetails", tableSelector);

	const totalPages = Math.ceil(tableData.length / totalItem);
	const tableSelectRef = useRef();

	useEffect(() => {
		getTableLoaction();
	}, []);

	// Get the tables for the current page
	const displayedTables = tableData.slice(
		tablePage * totalItem,
		(tablePage + 1) * totalItem
	);

	const getTableLoaction = () => {
		isLoading(true);
		tableModel
			.getTableLocation({ outletid: outletDetails?.outlet })
			.then((data) => {
				if (data?.status === "true") {
					data?.data.sort((a, b) => {
						return a.tablelocation.localeCompare(b.tablelocation);
					});
					setTableLoc(data?.data);
				} else Swal.fire({ icon: "info", title: data?.Error?.Error_Msg });
				isLoading(false);
			})
			.catch((error) => {
				console.log("Error while getting table location", error);
				isLoading(false);
			});
	};

	const getTableByLoc = (item) => {
		isLoading(true);
		tableModel
			?.getTableByLocation({
				outletid: outletDetails?.outlet,
				tablelocationid: item?.tablelocationid,
			})
			.then((data) => {
				if (data?.status === "true") {
					setTableData(data?.data);
					dispatch(updateTable({ tableLoc: item }));
				} else Swal.fire({ icon: "info", title: data?.Error?.Error_Msg });
				isLoading(false);
			})
			.catch((error) => {
				console.log("Error while getting table", error);
				isLoading(false);
			});
	};

	useEffect(() => {
		if (tableLoc.length !== 0) {
			getTableByLoc(tableLoc[0]);
		}
	}, [tableLoc]);

	return (
		<div className="p-2 flex flex-col h-screen overflow-auto lg:overflow-hidden gap-1">
			{/* Top Header section */}
                        <div className="flex justify-between items-center">
                                <span className="font-[600] text-lg w-11/12 text-center">
                                        {t("TABLE_MANAGEMENT.TITLE")}
                                </span>
				<Icon
					icon="carbon:close-filled"
					width="30"
					height="30"
					className="cursor-pointer"
					onClick={() => navigate(-1)}
				/>
			</div>
			<div className="flex gap-1">
				<div className="flex gap-1 flex-grow">
					{/* <button className="bg-primary p-2 rounded-lg w-4/12 md:w-2/12 text-white items-center ">
						Split Table
					</button> */}
					<SlideArrow direction="left" width="50px" />
					<div className="grid grid-cols-2 md:grid-cols-6 gap-1 flex-grow">
						{tableLoc?.length > 0 ? (
							tableLoc?.map((item, index) => (
								<button
									disabled={loading}
									key={index}
									className="bg-outlet p-2 rounded-lg text-black font-bold"
									onClick={() => getTableByLoc(item)}>
									{loading ? <Spin /> : item?.tablelocation}
								</button>
							))
						) : (
                                                        <span className="col-span-6 flex justify-center items-center">
                                                                {loading ? <Spin /> : t("COMMON.NO_RESULTS_FOUND")}
                                                        </span>
						)}
					</div>
					<SlideArrow direction="right" width="50px" />
				</div>
			</div>
			{/* Table selection grid */}
			<div className="flex gap-1 mt-2 h-full">
				<SlideArrow
					direction="left"
					width="50px"
					currentIndex={tablePage}
					setCurrentIndex={setTablePage}
					refVariable={tableSelectRef}
					totalPages={totalPages}
				/>
				<div
					className="flex overflow-auto w-full scrollbar-hidden"
					ref={tableSelectRef}>
					<div className="grid grid-cols-3 md:grid-cols-7 gap-1 auto-rows-fr flex-grow">
						{Array.from({ length: totalItem }).map((_, index) => {
							const table = displayedTables[index];

							return (
								<button
									key={index}
									className={`rounded-lg p-2 font-[600] text-xs flex flex-col justify-center items-center w-full h-full text-black ${
										table?.usedstatus ? "bg-danger" : "bg-[#F2EDED]"
									}`}
									onClick={() => {
										if (tableSelector?.tableLoc) {
											dispatch(
												updateTable({ ...tableSelector, tableDetails: table })
											);
											if (isEdit) {
												dispatch(kotTableIpdate(true));
											}

											navigate("/kot");
										}
									}}>
									{table ? (
										<>
											{table?.tablecode}
                                                                               <span className="block">{t("TABLE_MANAGEMENT.COVERS", { count: table?.chairs })}</span>
										</>
									) : (
										<span className="text-gray-500"></span>
									)}
								</button>
							);
						})}
					</div>
				</div>
				<SlideArrow
					direction="right"
					width="50px"
					currentIndex={tablePage}
					setCurrentIndex={setTablePage}
					refVariable={tableSelectRef}
					totalPages={totalPages}
				/>
			</div>
		</div>
	);
}

export default TableManagement;
