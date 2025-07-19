import { Input, Modal, Table, Empty, Spin } from "antd";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import payModel from "../../../plugins/models/payModel";
import moment from "moment";
import { toast } from "react-toastify";
import { updateSlab } from "../../../redux/slices/paySlice";

function SlabList({ isModalOpen, setIsModalOpen, defaultObj }) {
	const dispatch = useDispatch();
	const outletDetails = JSON.parse(localStorage.getItem("outletDetails"));

	const [slabList, setSlabList] = useState(null);
	const [selected, setSelected] = useState(null);
	const [loading, isLoading] = useState(false);
	const [searchText, setSearchText] = useState("");

	const tableColumn = [
		{
			title: "Slab Name",
			dataIndex: "slabname",
			key: "discountslabhdrid",
			render: (text) => <sapn>{text}</sapn>,
		},
		{
			title: "Customer Name",
			dataIndex: "customername",
			key: "customerid",
			render: (text) => <sapn>{text}</sapn>,
		},
	];

	useEffect(() => {
		if (isModalOpen) {
			dispatch(updateSlab(null));
			getSlabList();
		}
		return () => {
			setSearchText("");
			setSlabList([]);
		};
	}, [isModalOpen]);

	const getSlabList = () => {
		isLoading("slabList");
		payModel
			.laodSlabList({
				// outletid: outletDetails?.outlet,
				outletid: outletDetails?.outlet,
				invoicedate: moment().format("DD-MMM-YYYY"),
			})
			.then((data) => {
				if (data?.status === "true") {
					setSlabList(data?.data);
				} else {
					setSlabList([]);
					toast.error(data?.info || data?.message || "something went wrong");
				}
				isLoading(false);
			})
			.catch((error) => {
				//console.log("Something went wrong", error);
			});
	};

	// const handleOnChange = (e) => {
	// 	let { value } = e.target;
	// 	// if (name === "mobile_no") {
	// 	// 	value = value.replace(/\D/g, "");
	// 	// 	value = value?.slice(0, 10);
	// 	// }
	// 	setSearchText(value);

	// 	// keyboard?.current.setInput(value);
	// };

	// const handleFocus = (e) => {
	// 	const { value, name } = e.target;
	// 	// setName(name);
	// 	// keyboard?.current.setInput(value);
	// 	//console.log("handle focus", value, name);
	// };

	// const searchDiscount = () => {
	// 	// isLoading("search");
	// 	//console.log("search list");
	// };

	const handleCancel = () => {
		setSearchText("");
		setIsModalOpen(false);
		// setAdvanceOrder(defaultObj);
	};

	const handleLoad = () => {
		//console.log("laoded data", selected);
		dispatch(updateSlab(selected));
		setIsModalOpen(false);
	};

	// const onClear = () => {

	// };

	return (
		<div className="">
			<Modal
				title={<h1 className="text-xl">Discount Slab List</h1>}
				open={isModalOpen}
				className=""
				width={{
					xs: "90%",
					sm: "90%",
					md: "90%",
					lg: "90%",
					xl: "50%",
					xxl: "40%",
				}}
				footer={false}
				style={{ top: 1, height: "80" }}
				// onOk={handleOk}
				onCancel={handleCancel}>
				<div className="flex flex-col gap-2">
					{/* <div className="flex flex-wrap items-center gap-1 h-fit">
						<div className="bg-[#D9D9D9] p-2 rounded-lg flex items-center gap-2 w-100">
							<Input
								placeholder="Search..."
								type="text"
								name="search"
								value={searchText}
								onChange={(e) => handleOnChange(e)}
								onFocus={(e) => handleFocus(e)}
								style={{ backgroundColor: "#D9D9D9", border: "none" }}
							/>
						</div>

						<button
							className="bg-success text-white p-2 rounded-lg flex-1"
							onClick={searchDiscount}
							disabled={loading === "search" ? true : false}>
							{loading === "search" ? <Spin /> : "Search"}
						</button>

						<button
							className="bg-danger text-white p-2 rounded-lg flex-1"
							onClick={onClear}>
							Clear
						</button>
					</div> */}

					<div className="bg-[#F2EDED] rounded-lg pb-1 flex-grow lg:overflow-auto h-[350px]">
						<Table
							className="lg:w-full overflow-auto"
							columns={tableColumn}
							dataSource={slabList}
							pagination={false}
							loading={{
								spinning: loading,
								tip: "Loading data...",
								indicator: <Spin className="h-100 mt-6" size="small" />,
							}}
							locale={{
								emptyText: (
									<div className="w-full h-full flex items-center justify-center bg-[#F2EDED] py-4">
										<Empty />
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
												textAlign: "left",
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
									record?.discountslabhdrid === selected?.discountslabhdrid
										? "bg-[#DED6D6]"
										: "bg-[#F2EDED]"
								} cursor-pointer hover:bg-gray-300`,
								onClick: () => {
									// setCustomerData(record);
									//console.log("cllickdsf", record);
									setSelected(record);
									// dispatch(updateSlab(record));
									// getPreviousOrder(record?.customer_id);
								},
							})}
						/>
					</div>

					<div className="flex items-center gap-2 ">
						<button
							className="rounded-lg flex-[1] bg-primary text-white p-3"
							onClick={handleLoad}>
							Load
						</button>
						<button
							className="rounded-lg flex-[1] bg-success text-white p-3  "
							onClick={handleCancel}>
							Cancel
						</button>
					</div>
				</div>
			</Modal>
		</div>
	);
}

export default SlabList;
