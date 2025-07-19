// import React, { forwardRef, useImperativeHandle } from "react";
// import Swal from "sweetalert2";
// import withReactContent from "sweetalert2-react-content";
// import "sweetalert2/dist/sweetalert2.min.css"; // Ensure you have this or style it manually

// const MySwal = withReactContent(Swal);

// /**
//  * @typedef {object} NumberInputModalProps
//  * @property {string} [titleText] - Optional title text to display above the image/input.
//  * @property {number} limit - Maximum number of digits for the PIN/input.
//  * @property {string} [imageUrl] - Optional URL for an image to display in the modal.
//  * @property {string} [confirmText] - Text for the confirm button.
//  * @property {string} [cancelText] - Text for the cancel button.
//  * @property {(value: string) => void} onConfirm - Callback function when confirm is clicked.
//  * @property {() => void} [onCancel] - Optional callback function when cancel is clicked or Esc is pressed.
//  */

// /**
//  * A modal component for number/PIN input using SweetAlert2 with a custom keypad and physical keyboard support.
//  * @param {NumberInputModalProps} props
//  * @param {React.Ref} ref - Ref to expose the openModal method.
//  */
// const NumberInputModal = forwardRef(
// 	(
// 		{
// 			// titleText = "Enter PIN", // Default title
// 			limit,
// 			confirmText = "CONFIRM",
// 			cancelText = "CANCEL",
// 			onConfirm,
// 			onCancel,
// 			imageUrl,
// 		},
// 		ref
// 	) => {
// 		const openModal = () => {
// 			let realValue = ""; // Store real PIN behind the scenes

// 			MySwal.fire({
// 				// title: titleText,
// 				html: `
//           ${
// 						imageUrl
// 							? `<div class="flex justify-center items-center mb-3">
//                                <img src="${imageUrl}" alt="icon" style="max-height: 80px; object-fit: contain;"/>
//                              </div>`
// 							: ""
// 					}
//           <div class="flex flex-col items-center gap-2 w-full max-w-xs mx-auto">
//             <input
//               id="swal-pin-input"
//               type="password"
//               class="swal2-inputtext-white p-3 text-3xl font-bold focus:outline-0 text-center border-2 w-full bg-gray-200 tracking-widest rounded-md"

//               style={{"caret-color: transparent"}}
//             />
//             <div class="grid grid-cols-3 gap-2 mt-2 w-full">
//               ${[1, 2, 3, 4, 5, 6, 7, 8, 9, "CLR", 0, "←"]
// 								.map(
// 									(btn) => `
//                 <button
//                   type="button"
//                   class="rounded-md p-2 flex justify-center items-center text-white h-14 text-xl font-bold bg-[#355364] transition-all transform active:scale-95 hover:bg-[#2a424f]"
//                   onclick="window.handleSwalKeypadClick && window.handleSwalKeypadClick('${btn}')"
//                 >${btn}</button>
//               `
// 								)
// 								.join("")}
//             </div>
//             <div class="grid grid-cols-2 gap-2 mt-4 w-full">
//               <button id="custom-swal-cancel-btn" class="bg-red-500 hover:bg-red-600 text-white text-lg font-bold p-3 rounded uppercase w-full transition-all transform active:scale-95">${cancelText}</button>
//               <button id="custom-swal-confirm-btn" class="bg-green-600 hover:bg-green-700 text-white text-lg font-bold p-3 rounded uppercase w-full transition-all transform active:scale-95">${confirmText}</button>
//             </div>
//           </div>
//         `,
// 				showConfirmButton: false, // We use custom buttons in HTML
// 				showCancelButton: false, // We use custom buttons in HTML
// 				width: "auto", // Let content define width, up to max-w-xs
// 				padding: "1.5rem", // Overall padding for the modal
// 				allowOutsideClick: false, // Prevent closing by clicking outside
// 				allowEscapeKey: false, // We handle Escape key manually for onCancel
// 				customClass: {
// 					popup: "bg-white rounded-lg shadow-xl", // Style the popup container
// 					// htmlContainer: 'p-0' // If you need to remove default Swal padding for HTML
// 				},
// 				didOpen: (modalElement) => {
// 					const inputElement = document.getElementById("swal-pin-input");

// 					if (modalElement && typeof modalElement.focus === "function") {
// 						modalElement.focus(); // Focus the Swal popup for better keyboard event capture context
// 					}

// 					//console.log("madlde eleementas", modalElement);

// 					const updateInputDisplay = () => {
// 						if (inputElement) {
// 							inputElement.value = "*".repeat(realValue.length);
// 						}
// 					};
// 					updateInputDisplay(); // Initial display update

// 					//console.log({ inputElement });
// 					//console.log({ document });

// 					// Handler for on-screen keypad clicks
// 					window.handleSwalKeypadClick = (value) => {
// 						if (!inputElement) return;
// 						const clickedValue = String(value);

// 						if (clickedValue.match(/^\d$/)) {
// 							// Digit from keypad
// 							if (realValue.length < limit) {
// 								realValue += clickedValue;
// 							}
// 						} else if (clickedValue === "CLR") {
// 							realValue = "";
// 						} else if (clickedValue === "←") {
// 							// Backspace from keypad
// 							realValue = realValue.slice(0, -1);
// 						}
// 						updateInputDisplay();
// 					};

// 					// Handler for physical keyboard presses
// 					const physicalKeydownHandler = (event) => {
// 						if (!MySwal.isVisible() || MySwal.getPopup() !== modalElement) {
// 							return; // Only act if this specific modal instance is active
// 						}

// 						const key = event.key;
// 						//console.log("physical key enter", key);
// 						let valueChanged = false;

// 						// Allow essential navigation if not handled by Swal's focus trap
// 						if (
// 							["Tab", "ArrowLeft", "ArrowRight", "Home", "End"].includes(key)
// 						) {
// 							return; // Let Swal or browser handle
// 						}

// 						event.preventDefault(); // Prevent default for keys we will handle

// 						if (key.match(/^\d$/)) {
// 							// Digit
// 							if (realValue.length < limit) {
// 								realValue += key;
// 								valueChanged = true;
// 							}
// 						} else if (key === "Backspace") {
// 							if (realValue.length > 0) {
// 								realValue = realValue.slice(0, -1);
// 								valueChanged = true;
// 							}
// 						} else if (key === "Enter") {
// 							document.getElementById("custom-swal-confirm-btn")?.click();
// 						} else if (key === "Escape") {
// 							document.getElementById("custom-swal-cancel-btn")?.click();
// 						}

// 						if (valueChanged) {
// 							updateInputDisplay();
// 						}

// 						//console.log("phy key press", valueChanged);
// 					};

// 					document.addEventListener("keydown", physicalKeydownHandler);

// 					// Confirm button event listener
// 					document
// 						.getElementById("custom-swal-confirm-btn")
// 						?.addEventListener("click", () => {
// 							if (realValue.length === 0 && limit > 0) {
// 								Swal.showValidationMessage("Please enter your PIN");
// 								inputElement?.classList.add("swal2-inputerror"); // Add shake animation class
// 								setTimeout(
// 									() => inputElement?.classList.remove("swal2-inputerror"),
// 									820
// 								); // Duration of Swal shake
// 								return;
// 							}
// 							// if (realValue.length > 0 && realValue.length < limit) {
// 							// 	Swal.showValidationMessage(`PIN must be ${limit} digits`);
// 							// 	inputElement?.classList.add("swal2-inputerror");
// 							// 	setTimeout(
// 							// 		() => inputElement?.classList.remove("swal2-inputerror"),
// 							// 		820
// 							// 	);
// 							// 	return;
// 							// }
// 							MySwal.close(); // This will trigger 'swal2:close' event
// 							onConfirm(realValue);
// 						});

// 					// Cancel button event listener
// 					document
// 						.getElementById("custom-swal-cancel-btn")
// 						?.addEventListener("click", () => {
// 							MySwal.close(); // This will trigger 'swal2:close' event
// 							if (onCancel) {
// 								onCancel();
// 							}
// 						});

// 					// Cleanup event listeners when this specific modal instance closes
// 					const currentPopup = MySwal.getPopup();
// 					if (currentPopup) {
// 						const handleModalClose = () => {
// 							// //console.log("NumberInputModal: Cleaning up event listeners.");
// 							document.removeEventListener("keydown", physicalKeydownHandler);
// 							delete window.handleSwalKeypadClick; // Clean up global function reference
// 							currentPopup.removeEventListener("swal2:close", handleModalClose); // Remove self
// 						};
// 						currentPopup.addEventListener("swal2:close", handleModalClose);
// 					}
// 				},
// 			});
// 		};

// 		useImperativeHandle(ref, () => ({
// 			openModal,
// 		}));

// 		return null; // This component does not render any direct JSX
// 	}
// );

// NumberInputModal.displayName = "NumberInputModal"; // For React DevTools

// export default NumberInputModal;

// AntNumberInputModal.js
import React, {
	useState,
	useEffect,
	useRef,
	forwardRef,
	useImperativeHandle,
} from "react";
import { Modal, Input as AntInput, Button as AntButton, Row, Col } from "antd"; // Renamed to avoid conflict

/**
 * @typedef {object} AntNumberInputModalProps
 * @property {number} limit - Maximum number of digits for the PIN/input.
 * @property {string} [titleText] - Optional title text for the modal.
 * @property {string} [imageUrl] - Optional URL for an image to display in the modal.
 * @property {string} [confirmText] - Text for the confirm button.
 * @property {string} [cancelText] - Text for the cancel button.
 * @property {(value: string) => void} onConfirm - Callback function when confirm is clicked.
 * @property {() => void} [onCancel] - Optional callback function when cancel is clicked.
 */

const NumberInputModal = forwardRef(
	(
		{
			limit,
			imageUrl,
			confirmText = "CONFIRM",
			cancelText = "CANCEL",
			onConfirm,
			onCancel,
		},
		ref
	) => {
		const [isModalVisible, setIsModalVisible] = useState(false);
		const [pinValue, setPinValue] = useState("");
		const [displayValue, setDisplayValue] = useState("");
		const [errorMessage, setErrorMessage] = useState("");

		const modalContentRef = useRef(null); // Ref for the modal content area for focus

		// Update display value whenever pinValue changes
		useEffect(() => {
			setDisplayValue("*".repeat(pinValue.length));
		}, [pinValue]);

		const handleKeyPress = (key) => {
			setErrorMessage(""); // Clear error on new key press
			if (key === "CLR") {
				setPinValue("");
			} else if (key === "←") {
				setPinValue((prev) => prev.slice(0, -1));
			} else if (key.match(/^\d$/)) {
				if (pinValue.length < limit) {
					setPinValue((prev) => prev + key);
				}
			}
		};

		const handleConfirm = () => {
			if (pinValue.length === 0 && limit > 0) {
				setErrorMessage("Please enter your PIN.");
				// You could also use toast.error("Please enter your PIN.");
				return;
			}
			// Optional: Strict length check
			// if (pinValue.length !== limit && limit > 0) {
			//     setErrorMessage(`PIN must be ${limit} digits.`);
			//     return;
			// }
			onConfirm(pinValue);
			closeModalAndReset();
		};

		const handleCancel = () => {
			if (onCancel) {
				onCancel();
			}
			closeModalAndReset();
		};

		const closeModalAndReset = () => {
			setIsModalVisible(false);
			setPinValue("");
			setDisplayValue("");
			setErrorMessage("");
		};

		// Expose openModal method via ref
		useImperativeHandle(ref, () => ({
			openModal: () => {
				setPinValue(""); // Reset PIN when opening
				setDisplayValue("");
				setErrorMessage("");
				setIsModalVisible(true);
			},
			closeModal: () => {
				closeModalAndReset();
			},
		}));

		// Physical keyboard event listener
		useEffect(() => {
			const physicalKeydownHandler = (event) => {
				if (!isModalVisible) return;

				const key = event.key;

				if (key.match(/^\d$/)) {
					event.preventDefault();
					handleKeyPress(key);
				} else if (key === "Backspace") {
					event.preventDefault();
					handleKeyPress("←");
				} else if (key === "Enter") {
					event.preventDefault();
					handleConfirm();
				} else if (key === "Escape") {
					event.preventDefault();
					handleCancel();
				} else if (
					key.toLowerCase() === "c" &&
					!event.ctrlKey &&
					!event.metaKey &&
					!event.altKey
				) {
					// Allow typing 'c' if it's not part of CLR (e.g. if CLR was different)
					// Or if you want 'c' to also clear:
					// event.preventDefault();
					// handleKeyPress("CLR");
				} else if (
					key.length === 1 &&
					!event.ctrlKey &&
					!event.metaKey &&
					!event.altKey
				) {
					// Prevent other character inputs
					event.preventDefault();
				}
			};

			if (isModalVisible) {
				document.addEventListener("keydown", physicalKeydownHandler);
				// Focus the modal content area when it becomes visible
				// Timeout helps ensure the element is in the DOM and focusable
				setTimeout(() => {
					modalContentRef.current?.focus();
				}, 100);
			} else {
				document.removeEventListener("keydown", physicalKeydownHandler);
			}

			return () => {
				document.removeEventListener("keydown", physicalKeydownHandler);
			};
		}, [isModalVisible, pinValue, limit]); // Re-attach if these change, esp. isModalVisible

		const keypadButtons = [1, 2, 3, 4, 5, 6, 7, 8, 9, "CLR", 0, "←"];

		return (
			<Modal
				// title={titleText}
				open={isModalVisible}
				onOk={handleConfirm}
				onCancel={handleCancel}
				footer={null} // Using custom footer buttons inside modal content
				centered
				maskClosable={false} // Prevent closing by clicking outside
				destroyOnClose // Clean up AntD internal state when closed
				width={350} // Adjust width as needed
				// Wrap content in a focusable div
				// The `ref` and `tabIndex` are important for keyboard event capture
				afterOpenChange={(open) => {
					if (open) {
						setTimeout(() => modalContentRef.current?.focus(), 0);
					}
				}}>
				<div
					ref={modalContentRef}
					tabIndex={-1}
					style={{
						outline: "none",
					}} /* onKeyDown={physicalKeydownHandler} - alternative to document listener */
				>
					{imageUrl && (
						<div className=" flex justify-center w-full">
							<img
								src={imageUrl}
								alt="icon"
								// className="border-2 "
								style={{ maxHeight: "100px", objectFit: "contain" }}
							/>
						</div>
					)}
					<AntInput
						id="antd-pin-input"
						type="text" // Use text to show asterisks, actual value is in pinValue
						value={displayValue}
						autoComplete="off"
						readOnly
						placeholder="Enter PIN"
						className={`text-center font-bold text-4xl tracking-[0.5em] placeholder:tracking-normal caret-transparent bg-gray-200  p-2 rounded-md ${
							errorMessage ? "border border-red-500" : ""
						}`}
						style={{
							// textAlign: "center",
							fontSize: "2rem",
							// letterSpacing: "0.5em", // For asterisk spacing
							// caretColor: "transparent",
							backgroundColor: "#f0f2f5", // AntD-like input background
							marginBottom: "16px",
							// padding: "10px",
							border: errorMessage ? "1px solid red" : undefined,
						}}
						maxLength={limit} // Visual cue for length
					/>
					{errorMessage && (
						<div
							style={{
								color: "red",
								textAlign: "center",
								marginBottom: "10px",
							}}>
							{errorMessage}
						</div>
					)}
					<Row gutter={[8, 8]}>
						{keypadButtons.map((btn) => (
							<Col span={8} key={btn}>
								<button
									// block
									size="large"
									className=" w-full rounded-md p-2 flex justify-center items-center text-white h-14 text-xl font-bold transition-all transform active:scale-95 bg-[#355364] hover:bg-[#2a424f] focus:outline-none focus:ring-0"
									style={{
										height: "60px",
										fontSize: "1.5rem",
										background: "#355364",
										fontWeight: "bold",
									}}
									onClick={() => handleKeyPress(String(btn))}>
									{btn}
								</button>
							</Col>
						))}
					</Row>
					<Row gutter={[16, 16]} style={{ marginTop: "20px" }}>
						<Col span={12}>
							<button
								block
								danger
								size="large"
								className="bg-red-500 hover:bg-red-600 text-white text-lg font-bold p-3 rounded-md uppercase w-full transition-all transform active:scale-95"
								style={{
									height: "50px",
									fontSize: "1rem",
									textTransform: "uppercase",
								}}
								onClick={handleCancel}>
								{cancelText}
							</button>
						</Col>
						<Col span={12}>
							<button
								block
								// type="primary"
								size="large"
								className="bg-green-600 hover:bg-green-700 text-white text-lg font-bold p-3 rounded-md uppercase w-full transition-all transform active:scale-95"
								style={{
									height: "50px",
									fontSize: "1rem",
									textTransform: "uppercase",
								}}
								onClick={handleConfirm}>
								{confirmText}
							</button>
						</Col>
					</Row>
				</div>
			</Modal>
		);
	}
);

NumberInputModal.displayName = "AntNumberInputModal";
export default NumberInputModal;
