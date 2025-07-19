import { Icon } from "@iconify/react";
import { NumericFormat } from "react-number-format";
import { useTranslation } from "react-i18next";
import { AdlerLogo } from "../../../assets/images";
import { selectConfigLs } from "../../../redux/selector/orderSlector";
import { formatRupees } from "../../../utils/helpers";
import { formatRoundedRupees } from "../../../utils/helpers/roundup";

const MAX_PERCENTAGE = 100;
const DEFAULT_DECIMALS = 2;
const MAX_INPUT_LENGTH_BEFORE_DECIMAL_FOR_PERCENTAGE = 3;

export const OrderSummary = ({
	inputValues,
	handleInputChange,
	setFocusedInput,
	onChange,
	setUserInputSource,
	total = 0,
}) => {
	const config = selectConfigLs;
	const { t } = useTranslation();

	return (
		<div className="space-y-2">
			<div className="flex items-center w-full justify-between mb-0">
				<div className="bg-white rounded-tr-xl w-9/12 pb-1 flex flex-col text-black space-y-2 px-2">
					<label className="font-semibold m-0">{t("ORDER.DISCOUNT")}</label>
					<div className="flex items-center w-full gap-2">
						<NumericFormat
							// Discount Percent
							className="bg-[#F2EDED] rounded-lg px-2 text-right w-[50%] h-10  text-[#533535]"
							name="discountPercent"
							decimalScale={config?.amount || DEFAULT_DECIMALS}
							thousandSeparator=","
							fixedDecimalScale
							maxLength={14}
							value={inputValues.discountPercent}
							onFocus={setFocusedInput}
							isAllowed={({ floatValue, formattedValue }) => {
								if (formattedValue === "" || floatValue === undefined) return true;
								if (floatValue > MAX_PERCENTAGE || floatValue < 0) return false;
								const parts = formattedValue.replace(/,/g, "").split(".");
								const integerPart = parts[0];
								return (
									integerPart.length <= MAX_INPUT_LENGTH_BEFORE_DECIMAL_FOR_PERCENTAGE ||
									parseFloat(integerPart) <= MAX_PERCENTAGE
								);
							}}
							onValueChange={({ value }, sourceInfo) => {
								setUserInputSource("percent");
								if (!sourceInfo?.event && sourceInfo?.source === "prop") {
									onChange(value, "discountPercent");
									return;
								}
								onChange(value, "discountPercent");
							}}
						/>
						<div className="bg-black text-white rounded-full w-10 h-10 flex items-center font-bold justify-center">
							{t("COMMON.PERCENT_SIGN")}
						</div>

						<NumericFormat
							// Discount Amount
							className="bg-[#F2EDED] rounded-lg px-2 text-right w-[50%] h-10  text-[#533535]"
							name="discountAmt"
							decimalScale={config?.amount || DEFAULT_DECIMALS}
							thousandSeparator=","
							fixedDecimalScale
							maxLength={14}
							value={inputValues.discountAmt}
							onFocus={setFocusedInput}
							isAllowed={({ floatValue }) => {
								const numericTotal = parseFloat(total);
								if (floatValue === undefined) return true;
								if (floatValue < 0 || floatValue > numericTotal) return false;
								return true;
							}}
							onValueChange={({ value, floatValue }, sourceInfo) => {
								if (!sourceInfo?.event && sourceInfo?.source !== "prop") return;
								setUserInputSource("amount");
								const numericTotalAmount = parseFloat(total);
								if (floatValue > numericTotalAmount) {
									onChange(numericTotalAmount.toString(), "discountAmt");
									return;
								}
								onChange(value.slice(0, 14), "discountAmt");
							}}
						/>

						<span className="text-[#847272] text-xl font-semibold pl-2">
							{t("COMMON.TOTAL")}
						</span>
					</div>
				</div>
				<div className="w-3/12 self-end flex justify-end items-baseline">
					<span className="font-[500] text-2xl text-black pr-2 pb-2 text-end truncate w-full min-w-0">
						{formatRupees(Number(total), config?.amount, false)}
					</span>
				</div>
			</div>

			{/* Delivery Charge & Net Amount */}
			<div className="flex gap-2 bg-white pb-2 px-2">
				<div className="flex-1">
					<label className="block text-sm font-medium text-black">
						{t("ORDER.DELIVERY_CHARGE")}
					</label>
					<NumericFormat
						className="bg-[#F2EDED] rounded-lg p-2 text-right w-full h-10 text-[#533535]"
						name="deliveryCharge"
						decimalScale={config?.amount || DEFAULT_DECIMALS}
						thousandSeparator=","
						fixedDecimalScale
						maxLength={14}
						value={inputValues.deliveryCharge}
						onFocus={setFocusedInput}
						onValueChange={({ value }, event) => {
							if (event?.event) {
								onChange(value, event.event.target.name);
							}
						}}
					/>
				</div>
				<div className="flex-1">
					<label className="block text-sm font-medium text-black">
						{t("ORDER.NET_AMOUNT")}
					</label>
					<input
						type="text"
						name="netAmount"
						disabled
						value={formatRoundedRupees(inputValues.netAmount, false)}
						onFocus={setFocusedInput}
						onChange={(e) => handleInputChange("netAmount", e.target.value)}
						className="bg-[#F2EDED] rounded-lg p-2 text-right w-full h-10 text-[#533535]"
					/>
				</div>
			</div>
		</div>
	);
};

export const PaymentActions = ({ onSaveClick, onPayCLick, onSlabClick }) => {
	const { t } = useTranslation();
	return (
		<div className="space-y-2 px-2 bg-white">
			<div className="flex gap-2 pt-1">
				<button
					className="rounded-md p-2 text-white text-l h-10 font-[500] bg-primary w-[50%]"
					onClick={onSaveClick}>
					{t("COMMON.SAVE")}
				</button>
				<button
					className="rounded-md p-2 text-white text-l font-[500] bg-success w-full h-10 uppercase"
					onClick={onPayCLick}>
					{t("COMMON.PAY")}
				</button>
				<button
					className="rounded-md p-2 text-white text-l h-10 font-[500] bg-primary w-[50%]"
					onClick={onSlabClick}>
					{t("COMMON.SLAB")}
				</button>
			</div>
		</div>
	);
};

export const SlabDetails = ({ inputValues, handleInputChange, setFocusedInput }) => {
	const { t } = useTranslation();
	return (
		<div className="px-2 pt-3 bg-white">
			<input
				type="text"
				name="slab"
				placeholder={t("ORDER.SLAB_DETAILS")}
				value={inputValues.slab}
				onFocus={setFocusedInput}
				onChange={(e) => handleInputChange("slab", e.target.value)}
				className="flex-1 bg-[#F2EDED] rounded-lg p-2 w-full h-10 font-[400] text-black placeholder-black"
			/>
		</div>
	);
};

export const CustomerDetails = ({ inputValues, handleInputChange, setFocusedInput }) => {
	const { t } = useTranslation();
	return (
		<div className="space-y-2 px-2 text-black bg-white">
			<div className="text-center font-semibold">{t("CUSTOMER.DETAILS")}</div>
			<div className="flex gap-2">
				<input
					type="text"
					name="mobile"
					placeholder={t("CUSTOMER.MOBILE_NO")}
					value={inputValues.mobile}
					onFocus={setFocusedInput}
					onChange={(e) => handleInputChange("mobile", e.target.value)}
					className="flex-1 bg-[#F2EDED] rounded-lg p-2 w-1/2 h-10 font-[400] text-black placeholder-black"
				/>
				<input
					type="text"
					name="name"
					placeholder={t("CUSTOMER.NAME")}
					value={inputValues.name}
					onFocus={setFocusedInput}
					onChange={(e) => handleInputChange("name", e.target.value)}
					className="flex-1 bg-[#F2EDED] rounded-lg p-2 w-1/2 h-10 font-[400] text-black placeholder-black"
				/>
			</div>
			<textarea
				name="address"
				placeholder={t("CUSTOMER.ADDRESS")}
				value={inputValues.address}
				onFocus={setFocusedInput}
				onChange={(e) => handleInputChange("address", e.target.value)}
				className="w-full bg-[#F2EDED] rounded-lg p-2 h-16 font-[400] text-black placeholder-black"
			/>
		</div>
	);
};

export const FooterActions = ({ onClickBack, onCustomer, onPrint }) => {
	const { t } = useTranslation();
	return (
		<div className="flex gap-2 justify-between px-2 bg-white">
			<button
				onClick={onClickBack}
				className="rounded-md p-2 h-10 text-center text-white text-l font-[500] bg-success w-[50%] uppercase">
				<span className="flex items-center justify-center gap-2">
					<Icon icon="mdi:arrow-left" width="20" height="20" />
					<p>{t("ORDER.CUSTOMER_ORDER")}</p>
				</span>
			</button>
			<button
				onClick={onPrint}
				className="rounded-md p-2 h-10 flex justify-center items-center text-white text-xl font-[500] bg-primary w-[50%]">
				<Icon icon="lets-icons:print-duotone" width="24" height="24" />
			</button>
		</div>
	);
};

export const FooterSection = () => {
	return (
		<div className="flex justify-between items-center">
			<div className="pl-1.5">
				<img
					src={AdlerLogo}
					width="100%"
					height="100%"
					className="w-20 pr-0.5"
					alt="adler-logo"
				/>
			</div>
			<div></div>
		</div>
	);
};
