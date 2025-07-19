import { Modal } from "antd";
import { useTranslation } from 'react-i18next';
import Swal from "sweetalert2";
import { ScreenKeyBoard } from "../../../components";
import { useState } from "react";

const Notes = ({
	isModalOpen,
	setIsModalOpen,
	keyRef,
	notes,
	setNotes,
	onContinue,
	onChange,
}) => {
	const [name, setName] = useState(null);
	const { t } = useTranslation();

	const onFous = (e) => {
		const { name, value } = e.target;
		keyRef?.current?.setInput(value);
		setName(name);
	};

	const handleCancel = () => {
		Swal.fire({
			title: t("NOTES.SWAL_CANCEL_TITLE"),
			text: t("NOTES.SWAL_CANCEL_TEXT"),
			icon: "warning",
			showCancelButton: true,
			confirmButtonColor: "#d33",
			cancelButtonColor: "#3085d6",
			confirmButtonText: t("COMMON.OK"),
			cancelButtonText: t("COMMON.CANCEL"),
		}).then((result) => {
			if (result.isConfirmed) {
				setNotes(""); // Clear notes
				setIsModalOpen(false); // Close the modal
				// Logout logic
				// setDeliverTime(null);
				// setKotTime(null);
				// setDeliverDate(null);
				// setKotDate(null);
				// setIsModalOpen(false);
				// setAdvanceOrder(defaultObj); // typo: make sure it's spelled `navigate`
			}
		});
	};

	return (
		<div className="">
			<Modal
				title={<h1 className="text-xl">{t("NOTES.TITLE")}</h1>}
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
				destroyOnClose
				onCancel={handleCancel}>
				<div className="flex flex-col space-y-4 p-2">
					{" "}
					{/* Added padding and space */}
					{/* Text Area takes full width on its own row */}
					<div className="w-full">
						<label
							htmlFor="notesContent"
							className="block text-sm font-medium text-gray-700 mb-1">
							{t("NOTES.LABEL")}
						</label>
						<textarea
							id="notesContent"
							name="notesContent" // Name for ScreenKeyboard integration
							rows="5"
							className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm resize-none" // resize-none to disable manual resize
							value={notes}
							onChange={onChange}
							onFocus={(e) => onFous(e)}
							placeholder={t("NOTES.PLACEHOLDER")}
						/>
					</div>
					{/* Action Buttons */}
					<div className="flex justify-end space-x-3 pt-2">
						{" "}
						{/* Aligned to right, added spacing */}
						<button
							type="button"
							onClick={handleCancel}
							className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
							{t("NOTES.CANCEL")}
						</button>
						<button
							type="button"
							onClick={onContinue}
							className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
							{t("NOTES.CONTINUE")}	
						</button>
					</div>
				</div>

				{/* ScreenKeyBoard - assuming it's meant to be optional or shown based on lg breakpoint */}
				<div className="hidden lg:block mt-4">
					{" "}
					{/* Added margin top */}
					<ScreenKeyBoard
						keyboard={keyRef}
						name={name}
						disabled={true}
						onChange={onChange}
						position={"relative"}
						width="100%"
						className="mt-2"
						hideAble={false}
					/>
				</div>
			</Modal>
		</div>
	);
};

export default Notes;
