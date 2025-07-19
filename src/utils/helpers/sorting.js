export function sortByProperty(arr, prop, ascending = true) {
	if (!Array.isArray(arr) || !prop) return [];

	return [...arr].sort((a, b) => {
		const aVal = a?.[prop];
		const bVal = b?.[prop];

		// Handle undefined or null values gracefully
		if (aVal == null && bVal == null) return 0;
		if (aVal == null) return ascending ? 1 : -1;
		if (bVal == null) return ascending ? -1 : 1;

		if (aVal < bVal) return ascending ? -1 : 1;
		if (aVal > bVal) return ascending ? 1 : -1;
		return 0;
	});
}
