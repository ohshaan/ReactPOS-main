// import React, { useState, useRef, useEffect, forwardRef } from "react";

// const CustomAutoComplete = forwardRef(
// 	(
// 		{
// 			id,
// 			name,
// 			className = "",
// 			options = [],
// 			value = "",
// 			placeholder = "",
// 			onFocus,
// 			onBlur,
// 			onChange,
// 			onSelect,
// 			filterOption,
// 			disabled = false,
// 			maxHeight = "200px",
// 			inputMode = "text", // Add inputMode prop for virtual keyboard
// 			autoCapitalize = "off", // Add autoCapitalize prop
// 			autoCorrect = "off", // Add autoCorrect prop
// 			spellCheck = false, // Add spellCheck prop
// 			...props
// 		},
// 		ref
// 	) => {
// 		const [isOpen, setIsOpen] = useState(false);
// 		const [filteredOptions, setFilteredOptions] = useState([]);
// 		const [highlightedIndex, setHighlightedIndex] = useState(-1);
// 		const inputRef = useRef(null);
// 		const dropdownRef = useRef(null);
// 		const blurTimeoutRef = useRef(null); // Add ref to track blur timeout

// 		// Expose the input ref to parent components
// 		React.useImperativeHandle(ref, () => inputRef.current);

// 		// Filter options based on input value
// 		useEffect(() => {
// 			if (!options || options.length === 0) {
// 				setFilteredOptions([]);
// 				return;
// 			}

// 			const currentInputValue = typeof value === "string" ? value.trim() : "";
// 			let newFiltered;

// 			if (typeof filterOption === "function") {
// 				newFiltered = options.filter((option) =>
// 					filterOption(currentInputValue, option)
// 				);
// 			} else {
// 				// Default filtering logic
// 				if (currentInputValue === "") {
// 					// Show all options when input is empty
// 					newFiltered = options;
// 				} else {
// 					newFiltered = options.filter((option) => {
// 						if (!option) return false;

// 						// Check both label and value for matches
// 						const label = option.label?.toString().toLowerCase() || "";
// 						const optionValue = option.value?.toString().toLowerCase() || "";
// 						const searchTerm = currentInputValue.toLowerCase();

// 						return (
// 							label.includes(searchTerm) || optionValue.includes(searchTerm)
// 						);
// 					});
// 				}
// 			}

// 			setFilteredOptions(newFiltered);
// 		}, [value, options, filterOption, id]);

// 		// Reset highlighted index when filtered options change
// 		useEffect(() => {
// 			setHighlightedIndex(-1);
// 		}, [filteredOptions]);

// 		// Ensure the input has the correct name attribute for virtual keyboards
// 		useEffect(() => {
// 			if (inputRef.current && name) {
// 				inputRef.current.setAttribute("name", name);
// 			}
// 		}, [name]);

// 		// Cleanup effect to prevent focus conflicts
// 		useEffect(() => {
// 			return () => {
// 				// Clear any pending timeouts when component unmounts
// 				if (blurTimeoutRef.current) {
// 					clearTimeout(blurTimeoutRef.current);
// 				}
// 				setIsOpen(false);
// 				setHighlightedIndex(-1);
// 			};
// 		}, []);

// 		const handleInputFocus = (e) => {
// 			// Clear any pending blur timeout when focusing
// 			if (blurTimeoutRef.current) {
// 				clearTimeout(blurTimeoutRef.current);
// 				blurTimeoutRef.current = null;
// 			}

// 			// Only set name attribute if this input is actually focused
// 			if (
// 				inputRef.current &&
// 				name &&
// 				document.activeElement === inputRef.current
// 			) {
// 				inputRef.current.setAttribute("name", name);
// 			}

// 			setIsOpen(true);

// 			if (onFocus) onFocus(e);
// 		};

// 		const handleInputBlur = (e) => {
// 			// Clear any existing blur timeout
// 			if (blurTimeoutRef.current) {
// 				clearTimeout(blurTimeoutRef.current);
// 			}

// 			// Set a new timeout
// 			blurTimeoutRef.current = setTimeout(() => {
// 				const activeElement = document.activeElement;

// 				// Check if the focus moved to the dropdown
// 				if (
// 					dropdownRef.current &&
// 					dropdownRef.current.contains(activeElement)
// 				) {
// 					return;
// 				}

// 				// Check if focus is still on this input
// 				if (activeElement === inputRef.current) {
// 					return;
// 				}

// 				// Focus has moved away from this component, close dropdown
// 				setIsOpen(false);
// 				setHighlightedIndex(-1);

// 				if (onBlur) onBlur(e);
// 			}, 150); // Slightly increased timeout for better UX
// 		};

// 		const handleInputChange = (e) => {
// 			const typedValue = e.target.value;

// 			// Always open dropdown when typing
// 			setIsOpen(true);

// 			if (onChange) {
// 				onChange(typedValue);
// 			}
// 		};

// 		const handleOptionClick = (option) => {
// 			if (option.disabled) return;

// 			// Clear blur timeout to prevent interference
// 			if (blurTimeoutRef.current) {
// 				clearTimeout(blurTimeoutRef.current);
// 				blurTimeoutRef.current = null;
// 			}

// 			if (onSelect) {
// 				onSelect(option.value, option);
// 			} else if (onChange) {
// 				// Use label if available, otherwise use value
// 				onChange(option.label || option.value);
// 			}

// 			setIsOpen(false);
// 			setHighlightedIndex(-1);

// 			// Clear focus and close virtual keyboard when option is selected
// 			if (inputRef.current) {
// 				inputRef.current.blur();
// 			}
// 		};

// 		const handleKeyDown = (e) => {
// 			if (!isOpen) {
// 				// If dropdown is closed, open it on arrow keys
// 				if (e.key === "ArrowDown" || e.key === "ArrowUp") {
// 					e.preventDefault();
// 					setIsOpen(true);
// 					return;
// 				}
// 				return;
// 			}

// 			// Handle keyboard navigation when dropdown is open
// 			switch (e.key) {
// 				case "ArrowDown":
// 					e.preventDefault();
// 					if (filteredOptions.length > 0) {
// 						setHighlightedIndex((prev) =>
// 							prev < filteredOptions.length - 1 ? prev + 1 : 0
// 						);
// 					}
// 					break;

// 				case "ArrowUp":
// 					e.preventDefault();
// 					if (filteredOptions.length > 0) {
// 						setHighlightedIndex((prev) =>
// 							prev > 0 ? prev - 1 : filteredOptions.length - 1
// 						);
// 					}
// 					break;

// 				case "Enter":
// 					e.preventDefault();
// 					if (
// 						highlightedIndex >= 0 &&
// 						highlightedIndex < filteredOptions.length &&
// 						!filteredOptions[highlightedIndex].disabled
// 					) {
// 						handleOptionClick(filteredOptions[highlightedIndex]);
// 					} else if (
// 						filteredOptions.length === 1 &&
// 						!filteredOptions[0].disabled
// 					) {
// 						// If only one option and no highlight, select it
// 						handleOptionClick(filteredOptions[0]);
// 					} else {
// 						setIsOpen(false);
// 						// Clear focus when closing dropdown with Enter
// 						if (inputRef.current) {
// 							inputRef.current.blur();
// 						}
// 					}
// 					break;

// 				case "Escape":
// 					e.preventDefault();
// 					setIsOpen(false);
// 					setHighlightedIndex(-1);
// 					break;
// 			}

// 			// Scroll highlighted option into view
// 			if (dropdownRef.current && highlightedIndex >= 0) {
// 				const optionElement = dropdownRef.current.children[highlightedIndex];
// 				if (optionElement?.scrollIntoView) {
// 					optionElement.scrollIntoView({ block: "nearest" });
// 				}
// 			}
// 		};

// 		const displayValue = value || "";

// 		// Show dropdown if it's open and we have options OR if we're searching but no results
// 		const shouldShowDropdown =
// 			isOpen &&
// 			(filteredOptions.length > 0 || (value.length > 0 && options.length > 0));

// 		return (
// 			<div className="relative w-full">
// 				<input
// 					ref={inputRef}
// 					id={id}
// 					name={name} // Always set name for virtual keyboard compatibility
// 					type="text"
// 					className={className}
// 					value={displayValue}
// 					placeholder={placeholder}
// 					disabled={disabled}
// 					onFocus={handleInputFocus}
// 					onBlur={handleInputBlur}
// 					onChange={handleInputChange}
// 					onKeyDown={handleKeyDown}
// 					autoComplete="off"
// 					autoCapitalize={autoCapitalize}
// 					autoCorrect={autoCorrect}
// 					spellCheck={spellCheck}
// 					inputMode={inputMode}
// 					role="combobox"
// 					aria-autocomplete="list"
// 					aria-expanded={shouldShowDropdown}
// 					aria-haspopup="listbox"
// 					aria-controls={shouldShowDropdown ? `${id}-listbox` : undefined}
// 					aria-activedescendant={
// 						highlightedIndex >= 0 && shouldShowDropdown
// 							? `${id}-option-${highlightedIndex}`
// 							: undefined
// 					}
// 					{...props}
// 				/>

// 				{shouldShowDropdown && (
// 					<ul
// 						ref={dropdownRef}
// 						id={`${id}-listbox`}
// 						role="listbox"
// 						className="absolute z-50 w-full mt-1 text-black bg-white border border-gray-300 rounded-md shadow-lg"
// 						style={{
// 							maxHeight,
// 							overflowY: "auto",
// 							top: "100%",
// 							left: 0,
// 							right: 0,
// 							zIndex: 1000,
// 						}}>
// 						{filteredOptions.length > 0 ? (
// 							filteredOptions.map((option, index) => (
// 								<li
// 									key={option.key || option.value || index}
// 									id={`${id}-option-${index}`}
// 									role="option"
// 									aria-selected={index === highlightedIndex}
// 									className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
// 										index === highlightedIndex ? "bg-blue-50" : ""
// 									} ${option.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
// 									onMouseDown={(e) => e.preventDefault()}
// 									onClick={() => handleOptionClick(option)}
// 									onMouseEnter={() => setHighlightedIndex(index)}>
// 									{option.label || option.value || "Unnamed Option"}
// 								</li>
// 							))
// 						) : (
// 							<li className="px-3 py-2 text-gray-500 cursor-default">
// 								No results found
// 							</li>
// 						)}
// 					</ul>
// 				)}
// 			</div>
// 		);
// 	}
// );

// CustomAutoComplete.displayName = "CustomAutoComplete";

// export default CustomAutoComplete;

// ImprovedCustomAutoComplete.js (FIXED)
// import React, { useState, useEffect, useRef } from "react";
// // Make sure you have a corresponding CSS file for styling
// // import "./CustomAutoComplete.css";

// const CustomAutoComplete = ({
// 	id,
// 	name,
// 	className = "",
// 	options = [],
// 	value = "",
// 	placeholder = "Type to search...",
// 	onFocus,
// 	onBlur,
// 	onChange,
// 	onSelect, // Expects onSelect(value, option)
// 	filterOption,
// 	disabled = false,
// 	maxHeight = "220px",
// }) => {
// 	const [isOpen, setIsOpen] = useState(false);
// 	const [filteredOptions, setFilteredOptions] = useState([]);
// 	const [highlightedIndex, setHighlightedIndex] = useState(-1);

// 	const inputRef = useRef(null);
// 	const dropdownRef = useRef(null);
// 	const wrapperRef = useRef(null);

// 	// Filter options based on input value
// 	useEffect(() => {
// 		let newFiltered;
// 		const searchTerm = (value || "").toLowerCase();

// 		if (typeof filterOption === "function") {
// 			newFiltered = options.filter((option) => filterOption(value, option));
// 		} else {
// 			if (!value) {
// 				newFiltered = [];
// 			} else {
// 				newFiltered = options.filter(
// 					(option) =>
// 						option.label.toLowerCase().includes(searchTerm) ||
// 						option.value.toString().toLowerCase().includes(searchTerm)
// 				);
// 			}
// 		}
// 		setFilteredOptions(newFiltered);
// 		setHighlightedIndex(-1);
// 	}, [value, options, filterOption]);

// 	// Effect to handle clicks outside the component
// 	useEffect(() => {
// 		const handleClickOutside = (event) => {
// 			if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
// 				setIsOpen(false);
// 				setHighlightedIndex(-1);
// 			}
// 		};
// 		document.addEventListener("mousedown", handleClickOutside);
// 		return () => {
// 			document.removeEventListener("mousedown", handleClickOutside);
// 		};
// 	}, []);

// 	const handleInputFocus = (e) => {
// 		setIsOpen(true);
// 		if (onFocus) onFocus(e);
// 	};

// 	const handleInputBlur = (e) => {
// 		// onBlur is passed directly for parent-level logic (e.g., form validation)
// 		if (onBlur) onBlur(e);
// 	};

// 	const handleInputChange = (e) => {
// 		console.log("key pressed", e.target.value);
// 		if (onChange) onChange(e.target.value);
// 		setIsOpen(true);
// 	};

// 	// --- CORRECTED FUNCTION ---
// 	const handleOptionClick = (option) => {
// 		if (option.disabled) return;

// 		if (onSelect) {
// 			// Match the original signature: pass the value AND the full option object
// 			onSelect(option.value, option);
// 		} else if (onChange) {
// 			// Fallback to onChange with the label
// 			onChange(option.label);
// 		}

// 		setIsOpen(false);
// 		inputRef.current?.blur(); // Blur the input on selection
// 	};

// 	const handleKeyDown = (e) => {
// 		if (!isOpen) {
// 			// Open dropdown on arrow down if it's closed and there's input
// 			if (e.key === "ArrowDown" && value) {
// 				setIsOpen(true);
// 			}
// 			return;
// 		}
// 		console.log("key down", e.target.value);

// 		switch (e.key) {
// 			case "ArrowDown":
// 				e.preventDefault();
// 				setHighlightedIndex((prev) =>
// 					prev < filteredOptions.length - 1 ? prev + 1 : 0
// 				);
// 				break;
// 			case "ArrowUp":
// 				e.preventDefault();
// 				setHighlightedIndex((prev) =>
// 					prev > 0 ? prev - 1 : filteredOptions.length - 1
// 				);
// 				break;
// 			case "Enter":
// 				e.preventDefault();
// 				if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
// 					handleOptionClick(filteredOptions[highlightedIndex]);
// 				}
// 				break;
// 			case "Escape":
// 				e.preventDefault();
// 				setIsOpen(false);
// 				setHighlightedIndex(-1);
// 				break;
// 		}
// 	};

// 	// Scroll highlighted item into view
// 	useEffect(() => {
// 		if (highlightedIndex >= 0 && dropdownRef.current) {
// 			const optionElement = dropdownRef.current.children[highlightedIndex];
// 			optionElement?.scrollIntoView({ block: "nearest" });
// 		}
// 	}, [highlightedIndex]);

// 	const shouldShowDropdown = isOpen && filteredOptions.length > 0;
// 	const shouldShowNoResults = isOpen && value && filteredOptions.length === 0;

// 	return (
// 		<div className="autocomplete-wrapper" ref={wrapperRef}>
// 			<input
// 				ref={inputRef}
// 				id={id}
// 				name={name}
// 				type="text"
// 				className={className || "autocomplete-input"}
// 				value={value}
// 				placeholder={placeholder}
// 				disabled={disabled}
// 				onFocus={handleInputFocus}
// 				onBlur={handleInputBlur}
// 				onChange={handleInputChange}
// 				onKeyDown={handleKeyDown}
// 				autoComplete="off"
// 				role="combobox"
// 				aria-autocomplete="list"
// 				aria-expanded={isOpen}
// 				aria-controls={isOpen ? `${id}-listbox` : undefined}
// 				aria-activedescendant={
// 					highlightedIndex >= 0 ? `${id}-option-${highlightedIndex}` : undefined
// 				}
// 			/>

// 			{shouldShowDropdown && (
// 				<ul
// 					ref={dropdownRef}
// 					id={`${id}-listbox`}
// 					role="listbox"
// 					className="absolute z-50 w-full mt-1 text-black bg-white border border-gray-300 rounded-md shadow-lg"
// 					style={{
// 						maxHeight,
// 						overflowY: "auto",
// 						top: "100%",
// 						left: 0,
// 						right: 0,
// 						zIndex: 1000,
// 					}}>
// 					{filteredOptions.map((option, index) => (
// 						<li
// 							key={option.value}
// 							id={`${id}-option-${index}`}
// 							role="option"
// 							aria-selected={index === highlightedIndex}
// 							className={`autocomplete-option ${
// 								index === highlightedIndex ? "highlighted" : ""
// 							} ${option.disabled ? "disabled" : ""}`}
// 							onMouseDown={(e) => e.preventDefault()}
// 							onClick={() => handleOptionClick(option)}>
// 							{option.label}
// 						</li>
// 					))}
// 				</ul>
// 			)}

// 			{shouldShowNoResults && (
// 				<div className="autocomplete-no-results">No results found</div>
// 			)}
// 		</div>
// 	);
// };

// export default CustomAutoComplete;

//!_______________________________________________________________________________________________________

import {
	useState,
	useRef,
	useEffect,
	forwardRef,
	useImperativeHandle,
} from "react";

const CustomAutoComplete = forwardRef(
	(
		{
			id,
			name,
			className = "",
			options = [],
			value = "",
			placeholder = "",
			onFocus,
			onBlur,
			onChange,
			onSelect, // onSelect can still be used for additional side-effects
			filterOption,
			disabled = false,
			maxHeight = "200px",
			inputMode = "text",
			autoCapitalize = "off",
			autoCorrect = "off",
			spellCheck = false,
			...props
		},
		ref // The forwarded ref from the parent
	) => {
		const [isOpen, setIsOpen] = useState(false);
		const [filteredOptions, setFilteredOptions] = useState([]);
		const [highlightedIndex, setHighlightedIndex] = useState(-1);
		const inputRef = useRef(null);
		const dropdownRef = useRef(null);
		const blurTimeoutRef = useRef(null);

		// Expose the underlying input element's ref to parent components.
		// This allows parents to call .focus(), .blur(), etc., directly on the input.
		useImperativeHandle(ref, () => ({
			// Action to programmatically focus the input
			focus: () => {
				inputRef.current?.focus();
			},
			// Action to programmatically blur the input
			blur: () => {
				inputRef.current?.blur();
			},
			// Action to programmatically clear the input's value
			// clear: () => {
			// 	if (onChange) {
			// 		onChange("");
			// 	}
			// },
			// Expose the raw DOM node if needed for other integrations
			getNode: () => inputRef.current,
		}));

		// Filter options based on input value
		useEffect(() => {
			if (!options || options.length === 0) {
				setFilteredOptions([]);
				return;
			}

			const currentInputValue = typeof value === "string" ? value.trim() : "";
			let newFiltered;

			if (typeof filterOption === "function") {
				newFiltered = options.filter((option) =>
					filterOption(currentInputValue, option)
				);
			} else {
				// Default filtering logic
				if (currentInputValue === "") {
					// Show all options when input is empty
					newFiltered = options;
				} else {
					newFiltered = options.filter((option) => {
						if (!option) return false;
						const label = option.label?.toString().toLowerCase() || "";
						const optionValue = option.value?.toString().toLowerCase() || "";
						const searchTerm = currentInputValue.toLowerCase();
						return (
							label.includes(searchTerm) || optionValue.includes(searchTerm)
						);
					});
				}
			}
			setFilteredOptions(newFiltered);
		}, [value, options, filterOption, id]);

		// Reset highlighted index when filtered options change
		useEffect(() => {
			setHighlightedIndex(-1);
		}, [filteredOptions]);

		// Cleanup effect for timeouts
		useEffect(() => {
			return () => {
				if (blurTimeoutRef.current) {
					clearTimeout(blurTimeoutRef.current);
				}
			};
		}, []);

		const handleInputFocus = (e) => {
			if (blurTimeoutRef.current) {
				clearTimeout(blurTimeoutRef.current);
				blurTimeoutRef.current = null;
			}
			setIsOpen(true);
			if (onFocus) onFocus(e);
		};

		const handleInputBlur = (e) => {
			blurTimeoutRef.current = setTimeout(() => {
				// If focus moves to the dropdown, do nothing.
				if (dropdownRef.current?.contains(document.activeElement)) {
					return;
				}
				setIsOpen(false);
				setHighlightedIndex(-1);
				if (onBlur) onBlur(e);
			}, 150); // A small delay to allow clicks on dropdown options.
		};

		const handleInputChange = (e) => {
			setIsOpen(true);
			// This is the standard controlled component pattern.
			// The parent's onChange is called, which updates state,
			// which then passes a new `value` prop back to this component.
			if (onChange) {
				onChange(e.target.value);
			}
		};

		const handleOptionClick = (option) => {
			if (option.disabled) return;

			// *** REFACTORED LOGIC ***
			// 1. Always call onChange to update the input's value. This is the primary action.
			//    This makes the component behave like a standard input, where selection = change.
			if (onChange) {
				// Prefer the display label for the input's value, falling back to the raw value.
				onChange(option.label || option.value);
			}

			// 2. If an onSelect handler is provided, call it as an additional, optional callback.
			//    This is useful for triggering side-effects with the full option object.
			if (onSelect) {
				onSelect(option.value, option);
			}

			setIsOpen(false);
			setHighlightedIndex(-1);
			if (inputRef.current) {
				inputRef.current.blur(); // Close virtual keyboard
			}
		};

		const handleKeyDown = (e) => {
			if (!isOpen) {
				if (e.key === "ArrowDown" || e.key === "ArrowUp") {
					e.preventDefault();
					setIsOpen(true);
				}
				return;
			}

			switch (e.key) {
				case "ArrowDown":
					e.preventDefault();
					setHighlightedIndex((prev) =>
						prev < filteredOptions.length - 1 ? prev + 1 : 0
					);
					break;
				case "ArrowUp":
					e.preventDefault();
					setHighlightedIndex((prev) =>
						prev > 0 ? prev - 1 : filteredOptions.length - 1
					);
					break;
				case "Enter":
					e.preventDefault();
					if (
						highlightedIndex >= 0 &&
						filteredOptions[highlightedIndex] &&
						!filteredOptions[highlightedIndex].disabled
					) {
						handleOptionClick(filteredOptions[highlightedIndex]);
					} else {
						setIsOpen(false);
						inputRef.current?.blur();
					}
					break;
				case "Escape":
					e.preventDefault();
					setIsOpen(false);
					setHighlightedIndex(-1);
					break;
			}

			if (dropdownRef.current && highlightedIndex >= 0) {
				const optionElement = dropdownRef.current.children[highlightedIndex];
				optionElement?.scrollIntoView({ block: "nearest" });
			}
		};

		const displayValue = value || "";
		const shouldShowDropdown =
			isOpen &&
			(filteredOptions.length > 0 || (value.length > 0 && options.length > 0));

		return (
			<div className="relative w-full">
				<input
					ref={inputRef}
					id={id}
					name={name}
					type="text"
					className={className}
					value={displayValue}
					placeholder={placeholder}
					disabled={disabled}
					onFocus={handleInputFocus}
					onBlur={handleInputBlur}
					onChange={handleInputChange}
					onKeyDown={handleKeyDown}
					autoComplete="off"
					autoCapitalize={autoCapitalize}
					autoCorrect={autoCorrect}
					spellCheck={spellCheck}
					inputMode={inputMode}
					role="combobox"
					aria-autocomplete="list"
					aria-expanded={shouldShowDropdown}
					aria-controls={shouldShowDropdown ? `${id}-listbox` : undefined}
					aria-activedescendant={
						highlightedIndex >= 0 && shouldShowDropdown
							? `${id}-option-${highlightedIndex}`
							: undefined
					}
					{...props}
				/>

				{shouldShowDropdown && (
					<ul
						ref={dropdownRef}
						id={`${id}-listbox`}
						role="listbox"
						className="absolute z-50 w-full mt-1 text-black bg-white border border-gray-300 rounded-md shadow-lg"
						style={{
							maxHeight,
							overflowY: "auto",
							top: "100%",
							left: 0,
							right: 0,
							zIndex: 1000,
						}}>
						{filteredOptions.length > 0 ? (
							filteredOptions.map((option, index) => (
								<li
									key={option.key || option.value || index}
									id={`${id}-option-${index}`}
									role="option"
									aria-selected={index === highlightedIndex}
									className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
										index === highlightedIndex ? "bg-blue-50" : ""
									} ${option.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
									onMouseDown={(e) => e.preventDefault()} // Prevents input blur on click
									onClick={() => handleOptionClick(option)}
									onMouseEnter={() => setHighlightedIndex(index)}>
									{option.label || option.value || "Unnamed Option"}
								</li>
							))
						) : (
							<li className="px-3 py-2 text-gray-500 cursor-default">
								No results found
							</li>
						)}
					</ul>
				)}
			</div>
		);
	}
);

CustomAutoComplete.displayName = "CustomAutoComplete";

export default CustomAutoComplete;
