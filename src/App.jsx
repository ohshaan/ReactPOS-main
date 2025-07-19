import { RouterProvider } from "react-router-dom";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";
import LanguageSelector from "./components/LanguageSelector";
import router from "./routes/router";
import { useDispatch } from "react-redux";
// import { updateCompanyLogo } from "./redux/slices/userSlice";
import { useEffect } from "react";
import { userModel } from "./plugins/models";
import {
	emptyDishList,
	resetOrder,
	updateConfig,
} from "./redux/slices/orderSlice";
import moment from "moment";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { updateCustomerData } from "./redux/slices/customerSlice";
import { updateCompanyLogo, updateUserDetails } from "./redux/slices/userSlice";

function App() {
	const dispatch = useDispatch();
	const userDetails = localStorage.getItem("user");
	const userData = JSON.parse(userDetails || "{}");
    const { t } = useTranslation();
	const handleLogout = async () => {
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

		try {
			const res = await userModel.logout(logoutData);

			if (res?.status === "true") {
				// Step 1: Stop the loading state. This will trigger the useEffect to close the spinner.
				// setLoading(false);

				// Step 2: Clear all data.
				localStorage.clear();
				dispatch(emptyDishList());
				dispatch(updateCustomerData(null));
				dispatch(updateCompanyLogo(null));
				dispatch(updateUserDetails(null));
				dispatch(resetOrder());

				// Step 3 (Optional but good UX): Show a success message before navigating.
				// Swal.fire({
				// 	title: "Success!",
				// 	text: "You have been logged out successfully.",
				// 	icon: "success",
				// 	timer: 1500, // Automatically close after 1.5 seconds
				// 	showConfirmButton: false,
				// }).then(() => {
				// 	// Step 4: Navigate AFTER the modal is closed.
				// 	navigate("/"); // Corrected typo from `nagivate`
				// });
			} else {
				// setLoading(false);
				// Swal.fire({
				// 	title: "Error",
				// 	text: res?.message || "Logout failed",
				// 	icon: "error",
				// 	confirmButtonText: "OK",
				// });
			}
		} catch (error) {
			// setLoading(false);
			// Swal.fire({
			// 	title: "Error",
			// 	text: error?.message || "An unexpected error occurred",
			// 	icon: "error",
			// 	confirmButtonText: "OK",
			// });
		}
	};

	useEffect(() => {
		/**
		 * Checks if the stored session is still valid based on idle time
		 * and business date. If not, it clears the session data from localStorage.
		 */
		const validateSession = () => {
			const user = localStorage.getItem("user");
			const configStr = localStorage.getItem("config");
			const lastActivityTimeStr = localStorage.getItem("lastActivityTime");
			const businessDateStr = localStorage.getItem("dateTime");

			// If there's no user, there's no session to validate.
			if (!user || !configStr || !lastActivityTimeStr || !businessDateStr) {
				return;
			}

			// --- Clean up function to log the user out ---
			const clearSession = (message) => {
				console.log("❌❌❌ SESSION-LOGOUT ❌❌❌");
				toast.warn(message);
				handleLogout();

				// We keep 'config', 'cmpLogo', and 'dateTime' as they are general app data.
			};

			try {
				const config = JSON.parse(configStr);
				const idleTimeoutMinutes = parseInt(config.idle, 10);

				// If idle timeout is not a valid number, we can't proceed.
				if (isNaN(idleTimeoutMinutes)) return;

				// --- Check 1: Idle Timeout ---
				const idleTimeoutMs = idleTimeoutMinutes * 60 * 1000;
				const lastActivityTime = parseInt(lastActivityTimeStr, 10);
				const timeSinceLastActivity = Date.now() - lastActivityTime;

				if (timeSinceLastActivity > idleTimeoutMs) {
					clearSession(
						"Session expired due to inactivity. Please log in again."
					);
					return; // Stop validation
				}

				// --- Check 2: Business Day Change ---
				const businessDate = moment(businessDateStr).format("YYYY-MM-DD");
				const currentDate = moment().format("YYYY-MM-DD");

				if (businessDate !== currentDate) {
					clearSession("New business day. Please log in again.");
					return; // Stop validation
				}
			} catch (error) {
				console.error("Error validating session:", error);
				// If parsing fails, the data is corrupt, so clear it.
				clearSession("Session data was corrupt. Please log in again.");
			}
		};

		const getConfig = () => {
			userModel
				.getConfig()
				.then((data) => {
					if (data?.status === "true") {
						// Assuming the order is [quantity, amount, discount, idle]
						const config = {
							quantity: data?.data[0]?.configvalue,
							amount: data?.data[1]?.configvalue,
							discount: data?.data[2]?.configvalue,
							idle: data?.data[3]?.configvalue, // Make sure 'idle' is fetched
						};
						dispatch(updateConfig(config));
						localStorage.setItem("config", JSON.stringify(config));
					}
				})
				.catch((error) => {
					console.error("Failed to fetch config:", error);
				});
		};

		validateSession();
		getConfig();
	}, []);
        return (
                <>
                        <LanguageSelector />
                        <Suspense fallback={<div>Loading...</div>}>
                                <RouterProvider router={router} />
                        </Suspense>
                </>
        );
}

export default App;
