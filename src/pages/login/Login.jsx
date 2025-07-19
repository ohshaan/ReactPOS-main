import React, { useEffect, useRef, useState } from "react";
import { Layout } from "../../components";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { clearFromBack, resetDial } from "../../utils/helpers/dialpad";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { userModel } from "../../plugins/models";
import { companyLogo } from "../../assets/images";
import {
	updateCompanyLogo,
	updateUserDetails,
} from "../../redux/slices/userSlice";
import Swal from "sweetalert2";
import { Spin } from "antd";
import { updateConfig, updateDate } from "../../redux/slices/orderSlice";
// import moment from "moment";
// import dayjs from "dayjs";

function Login() {
	const inputRef = useRef(null);
    const { t } = useTranslation();
	const [pin, setPin] = useState("");
	const navigate = useNavigate();
	const dispatch = useDispatch();
	// const getCompanyLogo = useSelector((state) => state?.user?.comapnyLogoApi);
	// const companyLogo = localStorage.getItem("cmpLogo");
	const [loading, isLoading] = useState(false);
	const [logoLoading, setLogoLoading] = useState(false);
       const [logo, setLogo] = useState(localStorage.getItem("cmpLogo") || companyLogo);
	/**
	 * The function `handlePinChange` updates the pin by appending the provided data if the pin length is
	 * less than 6.
	 */
	const handlePinChange = (data) =>
		setPin((prev) => (prev.length < 100 ? prev + data : prev));

	/**
	 * The `onInputPinChange` function  ensures that the input value only contains
	 * digits and limits it to a maximum length of 6 characters.
	 */
	const onInputPinChange = (e) => {
		const inputValue = e.target.value;
		let filteredValue = "";
		//console.log("inputValue!!!", inputValue);
		// 1. Allow only numeric characters
		// We can iterate or use a regex. Regex is cleaner here.
		filteredValue = inputValue.replace(/[^0-9]/g, "");

		// 2. Enforce maxLength
		if (filteredValue.length > 100) {
			filteredValue = filteredValue.slice(0, 100);
			// setError(`Maximum ${100} digits allowed.`);
		}
		setPin(filteredValue);
	};

	const onSubmit = async () => {
		if (!pin)
			Swal.fire({
				icon: "warning",
				title: t("LOGIN.PLEASE_ENTER_PIN"),
			});
		else {
			const ipaddress = await userModel.getIpAddress();
			isLoading(true);
			localStorage.setItem("userPin", pin);
			userModel
				?.login({ userpin: Number(pin), ipaddress })
				.then((data) => {
					if (data?.status === "true") {
						dispatch(updateUserDetails(data?.data));
						localStorage.setItem("user", JSON.stringify(data?.data));
						localStorage.setItem("lastActivityTime", Date.now().toString());
						navigate("/outletSelection");
					} else {
						localStorage.removeItem("userPin");
						// localStorage.removeItem("lastActivityTime");
						Swal.fire({
							icon: "error",
							title: (
								data?.Error?.Error_Msg ||
								data?.message ||
								""
							).toUpperCase(),
						});
					}
					isLoading(false);
				})
				.catch((error) => {
					toast.error(t("LOGIN.SOMETHING_WENT_WRONG"), error);
					isLoading(false);
					localStorage.removeItem("userPin");
				});
		}
	};

	const fetchInitialData = () => {
		// These can run in parallel
		setLogoLoading(true);
		Promise.all([
			userModel.getCurrentDate({}),
			userModel.getConfig(),
			userModel.getCompanyLogo(),
		])
			.then(([dateData, configData, logoData]) => {
				// Handle Date
				if (dateData?.status === "true") {
					dispatch(updateDate(dateData?.data?.currentdate));
					//console.log("current date", dateData?.data?.currentdate);
					localStorage.setItem("dateTime", dateData?.data?.currentdate);
				}

				// Handle Config
				if (configData?.status === "true") {
					const config = {
						amount: configData?.data[1]?.configvalue,
						quantity: configData?.data[0]?.configvalue,
						discount: configData?.data[2]?.configvalue,
						idle: configData?.data[3]?.configvalue, // e.g., "30" (minutes)
					};
					dispatch(updateConfig(config));
					localStorage.setItem("config", JSON.stringify(config));
				}

				// Handle Logo

				if (logoData?.status === "true") {
					const logoUrl = `${import.meta.env.VITE_API_BASE_URL}${
						logoData?.data?.image || ""
					}`;
					dispatch(updateCompanyLogo(logoUrl));
					localStorage.setItem("cmpLogo", logoUrl);
					setLogo(logoUrl);
				}
			})
			.catch((error) => {
				toast.error(t("LOGIN.FAILED_TO_LOAD_INITIAL_CONFIG"));
				console.error("Initial data fetch error:", error);
			})
			.finally(() => {
				setLogoLoading(false);
			});
	};

	useEffect(() => {
		inputRef.current?.focus();
		fetchInitialData();
	}, []);
	// const getCurrentDate = async () => {
	// 	const maxRetries = 3;

	// 	for (let attempt = 1; attempt <= maxRetries; attempt++) {
	// 		try {
	// 			const data = await userModel.getCurrentDate({});

	// 			if (data?.status === "true") {
	// 				dispatch(updateDate(data?.data?.currentdate));
	// 				localStorage.setItem("dateTime", data?.data?.currentdate);
	// 				return; // Exit on success
	// 			} else {
	// 				throw new Error(data?.message || "Invalid response");
	// 			}
	// 		} catch (error) {
	// 			console.error(`Attempt ${attempt} failed:`, error);

	// 			if (attempt === maxRetries) {
	// 				toast.error("Failed to get current date after 3 retries.");
	// 			}
	// 		}
	// 	}
	// };

	// const getConfig = () => {
	// 	userModel
	// 		.getConfig()
	// 		.then((data) => {
	// 			if (data?.status === "true") {
	// 				dispatch(
	// 					updateConfig({
	// 						amount: data?.data[1]?.configvalue,
	// 						quantity: data?.data[0]?.configvalue,
	// 						discount: data?.data[2]?.configvalue,
	// 						idle: data?.data[3]?.configvalue,
	// 					})
	// 				);
	// 				const configData = {
	// 					amount: data?.data[1]?.configvalue,
	// 					quantity: data?.data[0]?.configvalue,
	// 					discount: data?.data[2]?.configvalue,
	// 					idle: data?.data[3]?.configvalue,
	// 				};
	// 				//console.log({ configData });
	// 				localStorage.setItem("config", JSON.stringify(configData));
	// 			}
	// 		})
	// 		.catch((error) => {
	// 			//console.log("error", error);
	// 		});
	// };

	// const getCompanyLogo = () => {
	// 	setLogoLoading(true);
	// 	userModel
	// 		.getCompanyLogo()
	// 		.then((data) => {
	// 			if (data?.status === "true") {
	// 				dispatch(
	// 					updateCompanyLogo(
	// 						import.meta.env.VITE_API_BASE_URL + data?.data?.image
	// 					)
	// 				);
	// 				// setImagUrl(import.meta.env.VITE_API_BASE_URL + data?.data?.image);
	// 				localStorage.setItem(
	// 					"cmpLogo",
	// 					`${import.meta.env.VITE_API_BASE_URL}${data?.data?.image || ""}`
	// 				);
	// 				setLogo(
	// 					`${import.meta.env.VITE_API_BASE_URL}${data?.data?.image || ""}`
	// 				);
	// 				setLogoLoading(false);
	// 			}
	// 		})
	// 		.catch((error) => {
	// 			setLogoLoading(false);
	// 			//console.log(error);
	// 		});
	// };

	// useEffect(() => {
	// 	inputRef.current?.focus(); // Focus input on mount
	// 	getCurrentDate();
	// 	getConfig();
	// 	getCompanyLogo();
	// }, []);

	// useEffect(() => {
	// 	//console.log("getCompanyLogo", getCompanyLogo);
	// }, [getCompanyLogo]);

	// const logo = getCompanyLogo ? getCompanyLogo : companyLogo;

	return (
		<Layout
			leftSection={
				<div className="flex justify-center items-center h-full">
					{logoLoading ? (
						<Spin />
					) : (
						<img
							src={logo}
							width={"100%"}
							height={"100%"}
							alt="company-logo"
							className="h-100 w-100 object-contain"
						/>
					)}
				</div>
			}
			rightSection={
				<div className="p-2  lg:h-screen  lg:flex lg:justify-center lg:items-center ">
					<div className="grid grid-cols-5 gap-2 lg:w-[60%] w-[80%] m-auto ">
						<div className="col-span-5  bg-secondary h-20 rounded-md p-2 flex justify-center items-center">
							<input
								ref={inputRef}
								type="password"
								value={pin}
								// value={pin}
								inputMode="numeric"
								pattern="[0-9]*"
								maxLength={100}
								autoComplete="off"
								className=" p-2 font-bold text-5xl focus:outline-0 [&::-webkit-inner-spin-button]:appearance-none text-center placeholder:text-xl placeholder:translate-y-[-6px] placeholder:inline-block w-full"
								onChange={onInputPinChange}
								// onKeyDown={handleKeyDown}
								placeholder={t("LOGIN.ENTER_PIN")}

							/>
						</div>
						{[1, 2, 3, 4, 5, 6, 7, 8, 9, 0]?.map((item) => {
							return (
								<button
									key={item}
									className="rounded-md p-2 flex justify-center items-center text-white h-15 bg-secondary text-xl font-bold"
									onClick={() => handlePinChange(item.toString())}>
									{item}
								</button>
							);
						})}
						{/* Section has Clear and Back button */}
						<div className="col-span-5 gap-2 flex">
							<button
								className="rounded-md p-2 flex justify-center items-center text-white h-15 bg-secondary w-[50%] text-xl font-bold "
								onClick={() => clearFromBack(setPin)}>
								{t("LOGIN.BACK")}
							</button>
							<button
								className="rounded-md p-2 flex justify-center items-center text-white h-15 bg-secondary w-[50%] text-xl font-bold"
								onClick={() => resetDial(setPin)}>
								{t("LOGIN.CLEAR")}
							</button>
						</div>
						{/* Section consist of Submit /Cancel button */}
						<div className="col-span-5 ">
							{/* <button className="rounded-md p-2 flex justify-center items-center text-white h-20 bg-[#AE2C2C] w-[50%] text-xl font-bold">
                CANCEL
              </button> */}
							<button
								className="rounded-md p-2 flex justify-center items-center text-white h-20 bg-success w-full text-xl font-bold"
								onClick={() => onSubmit()}
								disabled={loading}>
								{loading ? <Spin /> : t("LOGIN.SUBMIT")}
							</button>
						</div>
					</div>
				</div>
			}
			footer={true}
		/>
	);
}

export default Login;
