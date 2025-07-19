// ConfirmModal.js
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

/**
 * Shows a reusable confirmation modal using SweetAlert2.
 *
 * @param {{
 *   title?: string,
 *   text?: string,
 *   confirmText?: string,
 *   cancelText?: string,
 *   icon?: 'warning' | 'question' | 'info' | 'success' | 'error'
 * }} options
 * @returns {Promise<boolean>} Resolves to true if confirmed, false otherwise
 */
export function showConfirmModal({
	title = "Are you sure?",
	text = "You won’t be able to revert this!",
	confirmText = "Yes, do it!",
	cancelText = "Cancel",
	icon = "warning",
}) {
	return Swal.fire({
		title,
		text,
		icon,
		showCancelButton: true,
		confirmButtonColor: "#3085d6",
		cancelButtonColor: "#d33",
		confirmButtonText: confirmText,
		cancelButtonText: cancelText,
	}).then((result) => result.isConfirmed);
}
