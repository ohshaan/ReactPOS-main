// src/router.js (or wherever your router is)

import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";

const Login = lazy(() => import("../pages/login/Login"));
const OutletSelection = lazy(() =>
        import("../pages/ouletSelection/OutletSelection")
);
const Kot = lazy(() => import("../pages/kot/Kot"));
const Pay = lazy(() => import("../pages/pay/Pay"));
const CustomerRegistration = lazy(() =>
        import("../pages/customeReg/CustomerRegistration")
);
const TableManagement = lazy(() =>
        import("../pages/tableManagemnet/TableManagement")
);
const RunningKot = lazy(() => import("../pages/runnningKot/RunningKot"));
const ShiftClosing = lazy(() => import("../pages/shiftClosing/ShiftClosing"));
const DayEndClosing = lazy(() => import("../pages/dayEndClosing/DayEndClosing"));
const TableTransfer = lazy(() => import("../pages/tableTransfer/Tabletransfer"));
const TableTransferdemo = lazy(() =>
        import("../pages/tableTransfer/TabletransferDemo")
);
const Report = lazy(() => import("../pages/posReport/posReport"));

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
        return (
                <Suspense fallback={<div>Loading...</div>}>
                        <Login />
                </Suspense>
        );
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
                                element: (
                                        <Suspense fallback={<div>Loading...</div>}>
                                                <OutletSelection />
                                        </Suspense>
                                ),
                        },
                        {
                                path: "/kot",
                                element: (
                                        <Suspense fallback={<div>Loading...</div>}>
                                                <Kot />
                                        </Suspense>
                                ),
                        },
                        {
                                path: "/pay",
                                element: (
                                        <Suspense fallback={<div>Loading...</div>}>
                                                <Pay />
                                        </Suspense>
                                ),
                        },
                        {
                                path: "/customerReg",
                                element: (
                                        <Suspense fallback={<div>Loading...</div>}>
                                                <CustomerRegistration />
                                        </Suspense>
                                ),
                        },
                        {
                                path: "/customerReg/:type",
                                element: (
                                        <Suspense fallback={<div>Loading...</div>}>
                                                <CustomerRegistration />
                                        </Suspense>
                                ),
                        },
                        {
                                path: "/tableManagement",
                                element: (
                                        <Suspense fallback={<div>Loading...</div>}>
                                                <TableManagement />
                                        </Suspense>
                                ),
                        },
                        {
                                path: "/runningKot",
                                element: (
                                        <Suspense fallback={<div>Loading...</div>}>
                                                <RunningKot />
                                        </Suspense>
                                ),
                        },
                        {
                                path: "/shiftClosing",
                                element: (
                                        <Suspense fallback={<div>Loading...</div>}>
                                                <ShiftClosing />
                                        </Suspense>
                                ),
                        },
                        {
                                path: "/dayEndClosing",
                                element: (
                                        <Suspense fallback={<div>Loading...</div>}>
                                                <DayEndClosing />
                                        </Suspense>
                                ),
                        },
                        {
                                path: "/tableTransfer",
                                element: (
                                        <Suspense fallback={<div>Loading...</div>}>
                                                <TableTransfer />
                                        </Suspense>
                                ),
                        },
                        {
                                path: "/tableTransferdemo",
                                element: (
                                        <Suspense fallback={<div>Loading...</div>}>
                                                <TableTransferdemo />
                                        </Suspense>
                                ),
                        },
                        {
                                path: "/report",
                                element: (
                                        <Suspense fallback={<div>Loading...</div>}>
                                                <Report />
                                        </Suspense>
                                ),
                        },
                ],
        },
]);

export default router;
