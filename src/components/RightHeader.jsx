import { Icon } from "@iconify/react";
import React from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { emptyDishList, resetOrder } from "../redux/slices/orderSlice";
import { updateCustomerData } from "../redux/slices/customerSlice";
import {
	updateCompanyLogo,
	updateUserDetails,
} from "../redux/slices/userSlice";
import Swal from "sweetalert2";
import moment from "moment";
import { userModel } from "../plugins/models";

function RightHeader(user) {
	const navigate = useNavigate();
	const location = useLocation();
	const dispatch = useDispatch();
	// const { date } = useSelector((state) => state?.order)
	const [loading, setLoading] = React.useState(false);

	const date = localStorage.getItem("dateTime");
	const outletDetail = localStorage.getItem("openOutlet");
	const userDetails = localStorage.getItem("user");
	const userData = JSON.parse(userDetails || "{}");
	const outlet = JSON.parse(outletDetail);
	/**
	 * The `onLogout` function removes the 'user' item from localStorage and navigates to the home page.
	 */

	React.useEffect(() => {
		if (loading) {
			Swal.fire({
				title: "Logging out...",
				allowOutsideClick: false,
				didOpen: () => {
					Swal.showLoading();
				},
			});
		} else {
			Swal.close();
		}

		// Add this cleanup function!
		return () => {
			Swal.close();
		};
	}, [loading]);

	const handleLogoutApi = async () => {
		let currentDate = null;
		const dateRes = await userModel.getCurrentDate({});
		if (dateRes?.status === "true") {
			currentDate = dateRes?.data?.currentdate;
			console.log("INside this ", dateRes?.data?.currentdate);
		}

		console.log("currentDate", currentDate, dateRes);

		const logoutData = {
			userlogid: userData?.userlogid,
			currentDate: currentDate,
		};

		setLoading(true);

		try {
			const res = await userModel.logout(logoutData);

			if (res?.status === "true") {
				// Step 1: Stop the loading state. This will trigger the useEffect to close the spinner.
				setLoading(false);

				// Step 2: Clear all data.
				localStorage.clear();
				dispatch(emptyDishList());
				dispatch(updateCustomerData(null));
				dispatch(updateCompanyLogo(null));
				dispatch(updateUserDetails(null));
				dispatch(resetOrder());

				// Step 3 (Optional but good UX): Show a success message before navigating.
				Swal.fire({
					title: "Success!",
					text: "You have been logged out successfully.",
					icon: "success",
					timer: 1500, // Automatically close after 1.5 seconds
					showConfirmButton: false,
				}).then(() => {
					// Step 4: Navigate AFTER the modal is closed.
					navigate("/"); // Corrected typo from `nagivate`
				});
			} else {
				setLoading(false);
				Swal.fire({
					title: "Error",
					text: res?.message || "Logout failed",
					icon: "error",
					confirmButtonText: "OK",
				});
			}
		} catch (error) {
			setLoading(false);
			Swal.fire({
				title: "Error",
				text: error?.message || "An unexpected error occurred",
				icon: "error",
				confirmButtonText: "OK",
			});
		}
	};

	const onLogout = () => {
		Swal.fire({
			title: "Log out",
			text: "Do you want to logout ?",
			icon: "warning",
			showCancelButton: true,
			confirmButtonColor: "#d33",
			cancelButtonColor: "#3085d6",
			confirmButtonText: "OK",
		}).then((result) => {
			if (result.isConfirmed) {
				// Logout logic
				handleLogoutApi();
			}
		});
	};

	const handleHomepage = () => {
		Swal.fire({
			title: "Home page",
			text: "Do you want to Clear all details ?",
			icon: "question",
			showCancelButton: true,
			confirmButtonColor: "#d33",
			cancelButtonColor: "#3085d6",
			confirmButtonText: "OK",
		}).then((result) => {
			if (result.isConfirmed) {
				// Logout logic
				dispatch(updateCustomerData(null));
				dispatch(updateUserDetails(null));
				dispatch(resetOrder());

				navigate("/outletSelection"); // typo: make sure it's spelled `navigate`
			}
		});
	};

	return (
		<div className=" w-full  p-2 flex items-center justify-between h-[10%]">
			{/* <div className="w-fit bg- p-1 rounded-lg cursor-pointer">
        <Icon
          icon="famicons:arrow-back-circle-sharp"
          width="30"
          height="30"
          color="#fff"
        />
      </div> */}
			<div className="  p-2 text-white text-center w-full ">
				{outlet?.Shm_Name_V || ""}
				<span className="text-xs block">
					{moment(date).format("DD-MMM-YYYY")}
				</span>
			</div>
			{location.pathname !== "/outletSelection" && (
				<div
					className="p-3 mr-4 py-3 rounded-lg bg-secondary cursor-pointer"
					onClick={handleHomepage}>
					<Icon
						className="font-bold"
						icon="qlementine-icons:home-24"
						width="24"
						height="24"
					/>
				</div>
			)}
			<div className="w-fit rounded-lg bg-secondary p-1 flex items-center gap-2">
				<div className="rounded-lg text-white flex items-center gap-1 bg-primary p-2 ">
					<Icon icon="qlementine-icons:user-16" width="24" height="24" />{" "}
					<span className="w-20 whitespace-nowrap overflow-hidden text-ellipsis text-xs">
						{user?.userDetails?.employeename}
					</span>
				</div>
				<Icon
					icon="el:off"
					width="20"
					height="20"
					color="red"
					className="cursor-pointer"
					onClick={onLogout}
				/>
			</div>
		</div>
	);
}

export default RightHeader;
