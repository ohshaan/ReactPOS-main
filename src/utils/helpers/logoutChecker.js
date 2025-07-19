import Swal from "sweetalert2";
import { orderModel, userModel } from "../../plugins/models";
import { toast } from "react-toastify";

export const userLogoutChecker = () => {
	const outletDetails = JSON.parse(localStorage.getItem("outletDetails"));
	const userDetails = JSON.parse(localStorage.getItem("user"));

	if (!userDetails?.userid || !outletDetails?.outlet) {
		Swal.fire({
			icon: "warning",
			title: "User Logged Out!",
			text: "Please login again.",
		});
		return true;
	}

	return false;
};

export const getCurrentDaateTime = async () => {
	const currentDate = await userModel.getCurrentDate({});
	//console.log({ currentDate });
	if (currentDate.status === "true") {
		return currentDate.data?.currentdate;
	} else {
		return null;
	}
};

export const getIsDayClosed = async () => {
	const toastId = toast.loading("Verifying day end status...");

	let result = true; // Default to true (fail-safe) to block actions if something goes wrong
	let error = null;

	try {
		const orderDetails = JSON.parse(
			localStorage.getItem("outletDetails") || "{}"
		);
		const currentDate = await getCurrentDaateTime();

		if (!currentDate) {
			// This is a critical failure, so we throw an error to be caught below.
			throw new Error("Current date not available. Cannot verify status.");
		}

		// We have the date, now check the API
		const data = await orderModel.getDayClosed({
			outletid: orderDetails?.outlet,
			checkingdatetime: currentDate,
		});

		// The API call was successful, now interpret the result.
		if (data?.status === "true") {
			// API confirms: "Yes, the day is closed." This is an "error" for the user.
			error = data?.message || "Day end is not closed.";
			result = true; // The check "failed" (action should be blocked).

			toast.update(toastId, {
				render: error,
				type: "success",
				isLoading: false,
				autoClose: 500,
			});
		} else {
			// API confirms: "No, the day is not closed." This is a "success" for the user.
			error = null;
			result = false; // The check "succeeded" (action can proceed).

			toast.update(toastId, {
				render: "Day end is closed!",
				type: "error",
				isLoading: false,
				autoClose: 3000,
			});
		}
	} catch (err) {
		// This block catches errors from `getCurrentDaateTime` or network errors from `getDayClosed`.
		console.error("Error in getIsDayClosed:", err);
		error = err.message || "Error fetching day closed status.";
		result = true; // The check "failed".

		toast.update(toastId, {
			render: error,
			type: "error",
			isLoading: false,
			autoClose: 5000,
		});
	}

	return { result, error };
};
