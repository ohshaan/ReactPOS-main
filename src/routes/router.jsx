// src/router.js (or wherever your router is)

import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import {
	CustomerRegistration,
	Kot,
	Pay,
	Login,
	OutletSelection,
	RunningKot,
	TableManagement,
	ShiftClosing,
	DayEndClosing,
	TableTransfer,
	TableTransferdemo,
	Report,
} from "../pages";
import { useEffect } from "react";

/**
 * ProtectedRoute ensures that only authenticated users can access the child routes.
 * It also tracks user activity to keep the session alive.
 */
const ProtectedRoute = () => {
	const user = JSON.parse(localStorage.getItem("user") || "null");

	useEffect(() => {
		const events = ["click", "mousemove", "keypress", "scroll", "touchstart"];
		const updateLastActivity = () => {
			// Only update if the user is considered logged in
			if (localStorage.getItem("user")) {
				localStorage.setItem("lastActivityTime", Date.now().toString());
			}
		};

		events.forEach((event) =>
			window.addEventListener(event, updateLastActivity)
		);
		return () => {
			events.forEach((event) =>
				window.removeEventListener(event, updateLastActivity)
			);
		};
	}, []);

	if (user) {
		return <Outlet />;
	} else {
		return <Navigate to="/" replace />;
	}
};

/**
 * Root component handles the logic for the "/" path.
 * If the user is already logged in, it redirects them to the main app page ("/kot").
 * Otherwise, it shows the Login page.
 */
const Root = () => {
	const user = JSON.parse(localStorage.getItem("user") || "null");

	if (user) {
		// User is logged in, redirect to the KOT page.
		// `replace` prevents the user from navigating back to the login page.
		return <Navigate to="/kot" replace />;
	}

	// User is not logged in, show the Login component.
	return <Login />;
};

const router = createBrowserRouter([
	{
		path: "/",
		// Use the new Root component to handle the logic for this path
		element: <Root />,
	},
	{
		element: <ProtectedRoute />,
		children: [
			{
				path: "/outletSelection",
				element: <OutletSelection />,
			},
			{
				path: "/kot",
				element: <Kot />,
			},
			{
				path: "/pay",
				element: <Pay />,
			},
			{
				path: "/customerReg",
				element: <CustomerRegistration />,
			},
			{
				path: "/customerReg/:type",
				element: <CustomerRegistration />,
			},
			{
				path: "/tableManagement",
				element: <TableManagement />,
			},
			{
				path: "/runningKot",
				element: <RunningKot />,
			},
			{
				path: "/shiftClosing",
				element: <ShiftClosing />,
			},
			{
				path: "/dayEndClosing",
				element: <DayEndClosing />,
			},
			{
				path: "/tableTransfer",
				element: <TableTransfer />,
			},
			{
				path: "/tableTransferdemo",
				element: <TableTransferdemo />,
			},
			{
				path: "/report",
				element: <Report />,
			},
		],
	},
]);

export default router;
