import React, {
	useState,
	useEffect,
	useRef,
	useImperativeHandle,
	forwardRef,
} from "react";

const CustomAutoComplete = forwardRef(
	(
		{
			id,
			name,
			value, // Controlled value from parent
			options = [], // Array of { value: string, label: string, ...anyOtherData }
			onChange, // (inputValue: string, name: string, event?: Event) -> for typing
			onSelect, // (selectedValue: string, selectedOption: object, name: string) -> when an option is picked
			onFocus, // (event: FocusEvent, name: string)
			onBlur, // (event: FocusEvent, name: string)
			placeholder = "Type to search...",
			className = "", // For the wrapper div
			inputClassName = "", // For the input element
			dropdownClassName = "", // For the dropdown
			filterOption = (
				inputValue,
				option // Default filter
			) => option.label.toLowerCase().includes(inputValue.toLowerCase()),
			noOptionsMessage = "No results found",
		},
		ref
	) => {
		const [inputValue, setInputValue] = useState(value || ""); // Internal tracking for display
		const [filteredOptions, setFilteredOptions] = useState([]);
		const [showDropdown, setShowDropdown] = useState(false);
		const [activeIndex, setActiveIndex] = useState(-1); // For keyboard navigation

		const inputRef = useRef(null); // Ref for the actual <input> element
		const wrapperRef = useRef(null); // Ref for the main div to detect outside clicks

		// Sync internal inputValue with prop 'value' if it changes from parent
		useEffect(() => {
			setInputValue(value || "");
		}, [value]);

		// Expose input element's methods (like select(), focus()) to the parent via the forwarded ref
		useImperativeHandle(ref, () => ({
			focus: () => {
				inputRef.current?.focus();
			},
			select: () => {
				inputRef.current?.select();
			},
			// Expose the input element itself for VirtualKeyboard to get name/value if needed
			// (though VirtualKeyboard is being refactored to accept an info object)
			inputElement: inputRef.current, // Direct access to the DOM input
			// Pass name and value directly, similar to the focusedInputInfo structure
			name: name,
			value: inputValue, // The current value being displayed/typed
		}));

		const handleInputChange = (event) => {
			const newValue = event.target.value;
			setInputValue(newValue);
			if (onChange) {
				onChange(newValue, name, event); // Propagate change to parent
			}

			if (newValue) {
				setFilteredOptions(
					options.filter((opt) => filterOption(newValue, opt))
				);
				setShowDropdown(true);
				setActiveIndex(-1); // Reset active index on new input
			} else {
				setFilteredOptions([]);
				setShowDropdown(false);
			}
		};

		const handleOptionClick = (option) => {
			const displayValue = option.value; // Or option.label, depending on preference
			setInputValue(displayValue);
			setShowDropdown(false);
			setFilteredOptions([]);
			setActiveIndex(-1);
			if (onSelect) {
				onSelect(displayValue, option, name); // Propagate selection to parent
			}
			inputRef.current?.focus(); // Keep focus or blur based on UX preference
		};

		const handleInputFocus = (event) => {
			if (onFocus) {
				onFocus(event, name);
			}
			// Show dropdown if there are options matching current input, or all options if input is empty
			if (
				inputValue &&
				options.filter((opt) => filterOption(inputValue, opt)).length > 0
			) {
				setFilteredOptions(
					options.filter((opt) => filterOption(inputValue, opt))
				);
				setShowDropdown(true);
			} else if (!inputValue && options.length > 0) {
				// Optionally show all options on focus if input is empty
				// setFilteredOptions(options);
				// setShowDropdown(true);
			}
		};

		const handleInputBlur = (event) => {
			// Delay hiding dropdown to allow click on option to register
			setTimeout(() => {
				if (!wrapperRef.current?.contains(document.activeElement)) {
					setShowDropdown(false);
				}
			}, 150);
			if (onBlur) {
				onBlur(event, name);
			}
		};

		// Handle clicks outside to close dropdown
		useEffect(() => {
			const handleClickOutside = (event) => {
				if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
					setShowDropdown(false);
				}
			};
			document.addEventListener("mousedown", handleClickOutside);
			return () => {
				document.removeEventListener("mousedown", handleClickOutside);
			};
		}, []);

		const handleKeyDown = (event) => {
			if (!showDropdown || filteredOptions.length === 0) return;

			switch (event.key) {
				case "ArrowDown":
					event.preventDefault();
					setActiveIndex((prev) => (prev + 1) % filteredOptions.length);
					break;
				case "ArrowUp":
					event.preventDefault();
					setActiveIndex(
						(prev) =>
							(prev - 1 + filteredOptions.length) % filteredOptions.length
					);
					break;
				case "Enter":
					event.preventDefault();
					if (activeIndex >= 0 && activeIndex < filteredOptions.length) {
						handleOptionClick(filteredOptions[activeIndex]);
					}
					break;
				case "Escape":
					event.preventDefault();
					setShowDropdown(false);
					setActiveIndex(-1);
					break;
				default:
					break;
			}
		};

		return (
			<div ref={wrapperRef} className={`relative ${className}`}>
				<input
					type="text"
					id={id}
					name={name}
					ref={inputRef}
					value={inputValue}
					onChange={handleInputChange}
					onFocus={handleInputFocus}
					onBlur={handleInputBlur}
					onKeyDown={handleKeyDown}
					placeholder={placeholder}
					className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${inputClassName}`}
					autoComplete="off" // Important for custom autocomplete
				/>
				{showDropdown && (
					<ul
						className={`absolute z-10 w-full mt-1 bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm ${dropdownClassName}`}>
						{filteredOptions.length > 0 ? (
							filteredOptions.map((option, index) => (
								<li
									key={option.value + index} // Ensure unique key if values can repeat
									onClick={() => handleOptionClick(option)}
									onMouseEnter={() => setActiveIndex(index)}
									className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-indigo-600 hover:text-white ${
										index === activeIndex
											? "bg-indigo-600 text-white"
											: "text-gray-900"
									}`}
									role="option"
									aria-selected={index === activeIndex}>
									<span className="block truncate">{option.label}</span>
									{/* Optional: Checkmark for active/selected simulation */}
									{index === activeIndex && (
										<span className="absolute inset-y-0 right-0 flex items-center pr-4 text-indigo-100">
											{/* Heroicon name: check */}
											<svg
												className="h-5 w-5"
												xmlns="http://www.w3.org/2000/svg"
												viewBox="0 0 20 20"
												fill="currentColor"
												aria-hidden="true">
												<path
													fillRule="evenodd"
													d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
													clipRule="evenodd"
												/>
											</svg>
										</span>
									)}
								</li>
							))
						) : (
							<li className="cursor-default select-none relative py-2 px-4 text-gray-700">
								{noOptionsMessage}
							</li>
						)}
					</ul>
				)}
			</div>
		);
	}
);

export default CustomAutoComplete;
