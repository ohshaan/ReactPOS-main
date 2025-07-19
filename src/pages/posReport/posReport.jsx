import React, { use, useEffect } from "react";
import { posReportModel } from "../../plugins/models";
import { userModel } from "../../plugins/models";
import {
  Button,
  DatePicker,
  Form,
  Input,
  Typography,
  Row,
  Col,
  Tooltip,
} from "antd";
import { Footer, LeftHeader, RightHeader } from "../../components";
import { CloseCircleFilled } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import dayjs from "dayjs";
import { Spin } from "antd";
import { Select } from "antd";
import { toast } from "react-toastify";
import moment from "moment";
import { Icon } from "@iconify/react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";

import {
  updateCompanyLogo,
  updateUserDetails,
} from "../../redux/slices/userSlice";

import { emptyDishList, resetOrder } from "../../redux/slices/orderSlice";
import { updateCustomerData } from "../../redux/slices/customerSlice";

const { Title, Text } = Typography;

function Report() {
  const [activeField, setActiveField] = React.useState(null);
  const [widthSection, setWidthsection] = React.useState(null);
  const [logedUser, setLogedUser] = React.useState(null);
  const [loader, setLoader] = React.useState(false);
  const [invoiceType, setinvoiceType] = React.useState(0);
  const [caplocvalue, setCaplocvalue] = React.useState(97); // 65 for 'A'
  const [reportOptions, setReportOptions] = React.useState([]);

  const [loading, setLoading] = React.useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const userDetails = JSON.parse(localStorage.getItem("user"));
  const outletDetail = localStorage.getItem("openOutlet");
  const outlet = JSON.parse(outletDetail);
  const date = localStorage.getItem("dateTime");

  const handleHomepage = () => {
    navigate("/kot");
  };

  /*const onLogout = () => {
		Swal.fire({
			title: "Log out",
			text: "Do you want to logout ?",
			icon: "warning",
			showCancelButton: true,
			confirmButtonColor: "#d33",
			cancelButtonColor: "#3085d6",
			confirmButtonText: "OK",
		}).then((result) => {
			if (result.isConfirmed) {
				// Logout logic
				localStorage.removeItem("user");
				localStorage.clear();
				localStorage.clear();

				dispatch(emptyDishList());
				dispatch(updateCustomerData(null));
				dispatch(updateCompanyLogo(null));
				dispatch(updateUserDetails(null));
				dispatch(resetOrder());

				nagivate("/"); // typo: make sure it's spelled `navigate`
			}
		});
	};*/

  const handleLogoutApi = async () => {
    const userDetails = localStorage.getItem("user");
    const userData = JSON.parse(userDetails || "{}");
    let currentDate = null;

    const dateRes = await userModel.getCurrentDate({});
    if (dateRes?.status === "true") {
      currentDate = dateRes?.data?.currentDate;
    }

    const logoutData = {
      userlogid: userData?.userid,
      currentDate: currentDate,
    };

    setLoading(true);

    try {
      const res = await userModel.logout(logoutData);

      if (res?.status === "true") {
        // Step 1: Stop the loading state. This will trigger the useEffect to close the spinner.
        setLoading(false);

        // Step 2: Clear all data.
        localStorage.clear();
        dispatch(emptyDishList());
        dispatch(updateCustomerData(null));
        dispatch(updateCompanyLogo(null));
        dispatch(updateUserDetails(null));
        dispatch(resetOrder());

        // Step 3 (Optional but good UX): Show a success message before navigating.
        Swal.fire({
          title: "Success!",
          text: "You have been logged out successfully.",
          icon: "success",
          timer: 1500, // Automatically close after 1.5 seconds
          showConfirmButton: false,
        }).then(() => {
          // Step 4: Navigate AFTER the modal is closed.
          navigate("/"); // Corrected typo from `nagivate`
        });
      } else {
        setLoading(false);
        Swal.fire({
          title: t("COMMON.ERROR"),
          text: res?.message || "Logout failed",
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    } catch (error) {
      setLoading(false);
      Swal.fire({
        title: t("COMMON.ERROR"),
        text: error?.message || "An unexpected error occurred",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  const onLogout = () => {
    Swal.fire({
      title: "Log out",
      text: "Do you want to logout ?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "OK",
    }).then((result) => {
      if (result.isConfirmed) {
        // Logout logic
        handleLogoutApi();
      }
    });
  };

  const options = [
    { value: 1, label: t("POS_REPORT.BRIEF_REPORT") },
    { value: 2, label: t("POS_REPORT.KOT_REPORT") },
    { value: 3, label: t("POS_REPORT.ALL_INVOICE_REPORT") },
    { value: 4, label: t("POS_REPORT.INVOICE_SUMMARY_REPORT") },
    { value: 5, label: t("POS_REPORT.EMPLOYEE_WISE_INVOICE_REPORT") },
    { value: 6, label: t("POS_REPORT.OPEN_KOT_INVOICE_REPORT") },
    { value: 7, label: t("POS_REPORT.COLLECTION_DETAILS_INVOICE_REPORT") },
  ];

  useEffect(() => {
    const user = localStorage.getItem("user");
    let parsedUser = null;

    if (user) {
      try {
        parsedUser = JSON.parse(user);
      } catch (error) {
        console.error("Invalid user JSON:", error);
      }
    }

    posReportModel
      ?.getreportallocation({ userid: parsedUser?.userid })
      .then((data) => {
        if (data?.status === "true") {
          console.log(data?.message);
          const newoptions = data?.data.map((item) => ({
            value: item.reportid,
            label: item.reportdesc,
          }));
          setReportOptions([
            { value: "", label: "--Select--", disabled: true },
            ...newoptions,
          ]);
        } else {
          Swal.fire({
            title: t("COMMON.ERROR"),
            text: data?.message,
            icon: "error",
            showCancelButton: false,
            confirmButtonText: "Okay",
            confirmButtonColor: "#ec4d4f",
          });
        }
      })
      .catch((error) => {
        console.log("Error while fetching Report Allocation", error);
      });
  }, []);

  const handleChange = (value) => {
    console.log(`selected ${value}`);

    setinvoiceType(value);
  };

  useEffect(() => {
    // Set the width of the section to 50% of the viewport width
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setWidthsection(50);
      } else if (window.innerWidth < 768) {
        setWidthsection(100);
      }
    };

    // Initial call to set width
    handleResize();

    // Add event listener for window resize
    window.addEventListener("resize", handleResize);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    console.log(caplocvalue);
  }, [caplocvalue]);

  // PDF Report Generation start here

  // KOT Report PDF Generation
  const generateKOTReportPDF = (KOTdata) => {
    const tableBody = [
      [
        { text: "Order Reference No", style: "tableHeader" },
        { text: "Guest", style: "tableHeader" },
        { text: "In", style: "tableHeader" },
        { text: "PAX", style: "tableHeader" },
        { text: "Type", style: "tableHeader" },
      ],
      ...KOTdata.map((inv) => [
        inv.orderreferenceno,
        inv.ordercustomername,
        inv.orderbookdate,
        inv.noofpersons,
        inv.ordertype,
      ]),
    ];

    const docDefinition = {
      content: [
        { text: "KOT Report", style: "header" },
        {
          text: `Generated on: ${new Date().toLocaleString()}`,
          margin: [0, 0, 0, 10],
        },
        {
          table: {
            headerRows: 1,
            widths: ["*", "*", "*", "*", "*"],
            body: tableBody,
          },
          layout: "lightHorizontalLines",
        },
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          alignment: "center",
          margin: [0, 0, 0, 10],
        },
        tableHeader: {
          bold: true,
          fontSize: 12,
          color: "black",
        },
      },
      defaultStyle: {
        fontSize: 10,
      },
    };

    pdfMake.createPdf(docDefinition).open();
  };

  const generateKOTReportPDF2 = (KOTdata) => {
    const formatDate = (dateStr) => {
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const date = new Date(dateStr);
      const day = String(date.getDate()).padStart(2, "0");
      const month = months[date.getMonth()];
      const year = date.getFullYear().toString().slice(-2); // Only last 2 digits
      return `${day}-${month}-${year}`;
    };

    const totalPax = KOTdata.reduce(
      (sum, item) => sum + (item.noofpersons || 0),
      0
    );

    const timeExtrator = () => {
      const dateString = "6/13/2025 4:03:49 PM";
      const dateObj = new Date(dateString);

      const hours = dateObj.getHours();
      const minutes = dateObj.getMinutes().toString().padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      const displayHours = (hours % 12 || 12).toString().padStart(2, "0");

      const timeOnly = `${displayHours}:${minutes}${ampm}`;

      return timeOnly;
    };

    const tableBody = [
      [
        { text: "Order No", style: "tableHeader" },
        { text: "Guest", style: "tableHeader" },
        { text: "In", style: "tableHeader" },
        { text: "Pax", style: "tableHeader" },
        { text: "Type", style: "tableHeader" },
      ],
      ...KOTdata.map((inv) => [
        { text: inv.orderreferenceno || "", fontSize: 6 },
        { text: inv.ordercustomername || "", fontSize: 6 },
        { text: `${timeExtrator(inv.orderbookdate)}` || "", fontSize: 6 },
        { text: inv.noofpersons?.toString() || "", fontSize: 6 },
        { text: inv.ordertype || "", fontSize: 6 },
      ]),
    ];

    const docDefinition = {
      content: [
        {
          text: "KOT REPORT",
          style: "header",
          alignment: "center",
          margin: [0, 0, 0, 4],
        },
        {
          text: `Generated: ${formatDate(new Date())}`,
          alignment: "center",
          fontSize: 8,
          margin: [0, 0, 0, 6],
        },
        {
          table: {
            headerRows: 1,
            widths: ["30%", "18%", "20%", "10%", "22%"],
            body: tableBody,
          },
          layout: "noBorders",
          margin: [0, 0, 0, 6],
        },
        {
          text: `Total Pax: ${totalPax}.`,
          alignment: "center",
          fontSize: 8,
          bold: true,
          margin: [0, 0, 0, 6],
        },
        {
          text: "** END OF REPORT **",
          alignment: "center",
          fontSize: 8,
          margin: [0, 10, 0, 0],
        },
      ],
      styles: {
        header: {
          fontSize: 10,
          bold: true,
        },
        tableHeader: {
          bold: true,
          fontSize: 6,
          color: "black",
        },
      },
      defaultStyle: {
        fontSize: 8,
      },
      pageSize: "A7", // about 74x105mm
      pageMargins: [5, 5, 5, 5], // reduce margins for thermal
    };

    pdfMake.createPdf(docDefinition).open();
  };

  // Invoice Summary Report PDF Generation

  const invoiceSummeryReportPDF = (data, fromDate, toDate) => {
    let parserOpenOutletDetails = null;

    const openOutlet = localStorage.getItem("openOutlet");

    if (openOutlet) {
      try {
        parserOpenOutletDetails = JSON.parse(openOutlet);
      } catch (error) {
        console.error("Invalid open outlet JSON:", error);
      }
    }

    const reportTitle = [
      {
        text: parserOpenOutletDetails.Shm_Name_V,
        alignment: "center",
        bold: true,
        fontSize: 16,
      },
      { text: "Invoice Summary Reports", alignment: "center", fontSize: 13 },
      //{ text: 'COLLECTION (BRIEF)', alignment: 'center', bold: true, fontSize: 13, margin: [0, 5] },
      {
        text: `Invoice Date Between ${fromDate} And ${toDate}`,
        alignment: "center",
        fontSize: 11,
        margin: [0, 0, 0, 10],
      },
    ];

    const blocks = data.map((entry) => {
      return [
        {
          columns: [
            {
              text: `Date : ${entry.invoicedate}`,
              alignment: "left",
              bold: true,
            },
            //{ text: `Outlet : ${entry.outletname}`, alignment: 'right' }
          ],
          margin: [0, 5],
        },
        {
          layout: "noBorders",
          table: {
            widths: ["*", "auto"],
            body: [
              ["Cash Total:", formatAmount(entry.cashtotal)],
              ["Credit Card Total:", formatAmount(entry.creditcardtotal)],
              ["Voucher Total:", formatAmount(entry.vouchertotal)],
              [
                "Credit Facility Total:",
                formatAmount(entry.creditfacilitytotal),
              ],
              ["Staff Payable Total:", formatAmount(entry.staffpayabletotal)],
              ["Complimentary Total:", formatAmount(entry.comptotal)],
              ["Tips Total:", formatAmount(entry.tipstotal)],
            ],
          },
        },
        {
          columns: [
            {
              text: `Total Pax : ${entry.totalpax}`,
              alignment: "left",
              margin: [0, 5, 0, 10],
            },
            {
              text: `Net Amount : ${formatAmount(entry.nettotal)}`,
              alignment: "right",
              margin: [0, 5, 0, 10],
            },
          ],
        },
        {
          canvas: [
            { type: "line", x1: 0, y1: 0, x2: 560, y2: 0, lineWidth: 0.5 },
          ],
        }, // Separator line
      ];
    });

    const docDefinition = {
      content: [...reportTitle, ...blocks.flat()],
      styles: {
        tableCell: {
          fontSize: 10,
        },
      },
      pageMargins: [20, 30, 20, 30],
    };

    pdfMake.createPdf(docDefinition).open();
  };

  const invoiceSummeryReportPDF2 = (data, fromDate, toDate) => {
    let parserOpenOutletDetails = null;

    const openOutlet = localStorage.getItem("openOutlet");

    if (openOutlet) {
      try {
        parserOpenOutletDetails = JSON.parse(openOutlet);
      } catch (error) {
        console.error("Invalid open outlet JSON:", error);
      }
    }

    const reportTitle = [
      {
        text: parserOpenOutletDetails?.Shm_Name_V || "Outlet",
        alignment: "center",
        bold: true,
        fontSize: 10,
      },
      { text: "Invoice Summary Reports", alignment: "center", fontSize: 9 },
      {
        text: `Invoice Date Between ${fromDate} And ${toDate}`,
        alignment: "center",
        fontSize: 8,
        margin: [0, 0, 0, 5],
      },
    ];

    const blocks = data.map((entry) => {
      return [
        {
          text: `Date: ${entry.invoicedate}`,
          alignment: "left",
          bold: true,
          fontSize: 8,
          margin: [0, 5, 0, 2],
        },
        {
          columns: [
            { text: "Cash Total:", fontSize: 8 },
            {
              text: formatAmount(entry.cashtotal),
              alignment: "right",
              fontSize: 8,
            },
          ],
        },
        {
          columns: [
            { text: "Credit Card:", fontSize: 8 },
            {
              text: formatAmount(entry.creditcardtotal),
              alignment: "right",
              fontSize: 8,
            },
          ],
        },
        {
          columns: [
            { text: "Voucher:", fontSize: 8 },
            {
              text: formatAmount(entry.vouchertotal),
              alignment: "right",
              fontSize: 8,
            },
          ],
        },
        {
          columns: [
            { text: "Credit Facility:", fontSize: 8 },
            {
              text: formatAmount(entry.creditfacilitytotal),
              alignment: "right",
              fontSize: 8,
            },
          ],
        },
        {
          columns: [
            { text: "Staff Payable:", fontSize: 8 },
            {
              text: formatAmount(entry.staffpayabletotal),
              alignment: "right",
              fontSize: 8,
            },
          ],
        },
        {
          columns: [
            { text: "Complimentary:", fontSize: 8 },
            {
              text: formatAmount(entry.comptotal),
              alignment: "right",
              fontSize: 8,
            },
          ],
        },
        {
          columns: [
            { text: "Tips:", fontSize: 8 },
            {
              text: formatAmount(entry.tipstotal),
              alignment: "right",
              fontSize: 8,
            },
          ],
        },
        {
          columns: [
            { text: `Total Pax: ${entry.totalpax}`, fontSize: 8 },
            {
              text: `Net: ${formatAmount(entry.nettotal)}`,
              alignment: "right",
              bold: true,
              fontSize: 8,
            },
          ],
          margin: [0, 2, 0, 5],
        },
        {
          canvas: [
            { type: "line", x1: 0, y1: 0, x2: 240, y2: 0, lineWidth: 0.5 },
          ],
          margin: [0, 5, 0, 5],
        },
      ];
    });

    const docDefinition = {
      pageSize: {
        width: 240, // ≈ 80mm
        height: "auto",
      },
      pageMargins: [10, 10, 10, 10],
      content: [...reportTitle, ...blocks.flat()],
      defaultStyle: {
        fontSize: 8,
      },
    };

    pdfMake.createPdf(docDefinition).open();
  };

  // All Invoice Reports PDF Generation

  const allinvoiceReportPDF = (rawData) => {
    // fetch the outlet details from localStorage
    let parserOpenOutletDetails = null;

    const openOutlet = localStorage.getItem("openOutlet");

    if (openOutlet) {
      try {
        parserOpenOutletDetails = JSON.parse(openOutlet);
      } catch (error) {
        console.error("Invalid open outlet JSON:", error);
      }
    }

    // Step 1: Group items by invoiceid
    const grouped = {};
    rawData.forEach((item) => {
      if (!grouped[item.invoiceid]) grouped[item.invoiceid] = [];
      grouped[item.invoiceid].push(item);
    });

    const invoices = Object.values(grouped);

    // Step 2: Format each receipt block
    const receipts = invoices.map((items, index) => {
      const first = items[0];
      return [
        {
          text: `Date: ${formatDate(first.invdate)}      Time : ${formatTime(
            first.invtime
          )}`,
          fontSize: 9,
          margin: [0, 2],
        },
        {
          text: `Bill : ${first.billno}     Pax : ${first.pax}`,
          fontSize: 9,
          margin: [0, 2],
        },
        {
          text: `Delivery Date/Time : ${formatDate(first.deliverydatetime)}`,
          fontSize: 9,
          margin: [0, 2],
        },
        {
          text: `${first.employeename}`,
          fontSize: 9,
          margin: [0, 2],
        },
        {
          text: `Customer Name : ${first.customername || "CASH CUSTOMER"}`,
          fontSize: 9,
          margin: [0, 2],
        },
        {
          text: `Mobile Number : ${first.mobileno || ""}`,
          fontSize: 9,
          margin: [0, 4],
        },
        {
          table: {
            widths: ["auto", "*", "auto", "auto"],
            body: [
              [
                { text: "Sl #", bold: true, fontSize: 9 },
                { text: "Menu", bold: true, fontSize: 9 },
                { text: "Qty", bold: true, fontSize: 9 },
                { text: "Amount(QAR)", bold: true, fontSize: 9 },
              ],
              ...items.map((item, i) => [
                { text: `${i + 1}`, fontSize: 9 },
                { text: item.menuname, fontSize: 9 },
                {
                  text: item.menuqty.toFixed(2),
                  fontSize: 9,
                  margin: [0, 0, 100, 0],
                },
                { text: item.menuamount.toFixed(2), fontSize: 9 },
              ]),
            ],
          },
          layout: "noBorders",
          margin: [0, 5],
        },

        {
          text: `Net Amount : ${first.netamount.toFixed(2)}`,
          fontSize: 9,
          alignment: "right",
          bold: true,
          margin: [0, 2, 30, 2],
        },
        {
          text: `Paid Amount : ${first.paidamount.toFixed(2)}`,
          fontSize: 9,
          alignment: "right",
          margin: [0, 2, 30, 2],
        },

        {
          text: "SETTLEMENT DETAILS",
          bold: true,
          margin: [0, 5, 0, 2],
          decoration: "underline",
          fontSize: 9,
        },
        {
          text: `Cash : ${first.cashamount.toFixed(2)}`,
          fontSize: 9,
          margin: [0, 2],
        },
        {
          text: "**THANK YOU FOR DINING WITH US**",
          alignment: "center",
          fontSize: 9,
          margin: [0, 10, 0, 20],
        },
        {
          canvas: [
            { type: "line", x1: 0, y1: 0, x2: 555, y2: 0, lineWidth: 0.5 },
          ],
        },
        {
          text: "",
          alignment: "center",
          fontSize: 9,
          margin: [0, 10, 0, 20],
        },
      ];
    });

    /*const docDefinition = {
              content: receipts.flat(),
              defaultStyle: {
                fontSize: 10
              },
              pageMargins: [20, 20, 20, 20]
            };*/

    const docDefinition = {
      content: [
        {
          text: "All Invoice Report of " + parserOpenOutletDetails.Shm_Name_V, // Replace with dynamic outlet name
          style: "header",
          alignment: "center",
          margin: [0, 0, 0, 5],
        },
        {
          text: `Invoice Date Between ${formatDate(
            rawData[0].invdate
          )} And ${formatDate(rawData[rawData.length - 1].invdate)}`,
          style: "subheader",
          alignment: "center",
          margin: [0, 0, 0, 10],
        },
        ...receipts.flat(), // The rest of the receipt blocks
      ],
      styles: {
        header: {
          fontSize: 14,
          bold: true,
        },
        subheader: {
          fontSize: 11,
          bold: false,
        },
      },
      defaultStyle: {
        fontSize: 10,
      },
      pageMargins: [20, 20, 20, 20],
    };

    pdfMake.createPdf(docDefinition).open();
  };

  const allinvoiceReportPDF2 = (rawData, invoivetitle) => {
    let parserOpenOutletDetails = null;
    const openOutlet = localStorage.getItem("openOutlet");

    if (openOutlet) {
      try {
        parserOpenOutletDetails = JSON.parse(openOutlet);
      } catch (error) {
        console.error("Invalid open outlet JSON:", error);
      }
    }

    // Step 1: Group items by invoiceid
    const grouped = {};
    rawData.forEach((item) => {
      if (!grouped[item.invoiceid]) grouped[item.invoiceid] = [];
      grouped[item.invoiceid].push(item);
    });

    const invoices = Object.values(grouped);

    // Step 2: Format each receipt block
    const receipts = invoices.map((items) => {
      const first = items[0];
      return [
        {
          text: `Date: ${formatDate(first.invdate)}  ${formatTime(
            first.invtime
          )}`,
          fontSize: 8,
          margin: [0, 2],
        },
        {
          text: `Bill: ${first.billno}  Pax: ${first.pax}`,
          fontSize: 8,
          margin: [0, 2],
        },
        {
          text: `Delivery: ${formatDate(first.deliverydatetime)}`,
          fontSize: 8,
          margin: [0, 2],
        },
        {
          text: `${first.employeename}`,
          fontSize: 8,
          margin: [0, 2],
        },
        {
          text: `Customer: ${first.customername || "CASH CUSTOMER"}`,
          fontSize: 8,
          margin: [0, 2],
        },
        {
          text: `Mobile: ${first.mobileno || ""}`,
          fontSize: 8,
          margin: [0, 4],
        },
        {
          table: {
            widths: [20, "*", 30, 40],
            body: [
              [
                { text: "Sl", bold: true, fontSize: 8 },
                { text: "Menu", bold: true, fontSize: 8 },
                { text: "Qty", bold: true, fontSize: 8 },
                { text: "Amt", bold: true, fontSize: 8 },
              ],
              ...items.map((item, i) => [
                { text: `${i + 1}`, fontSize: 8 },
                { text: item.menuname, fontSize: 8 },
                { text: item.menuqty.toFixed(2), fontSize: 8 },
                { text: item.menuamount.toFixed(2), fontSize: 8 },
              ]),
            ],
          },
          layout: "noBorders",
          margin: [0, 2],
        },
        {
          text: `Net Amount: ${first.netamount.toLocaleString("en-QA", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
          fontSize: 8,
          alignment: "right",
          bold: true,
          margin: [0, 2],
        },
        {
          text: `Paid: ${first.paidamount.toLocaleString("en-QA", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
          fontSize: 8,
          alignment: "right",
          margin: [0, 2],
        },
        {
          text: "SETTLEMENT DETAILS",
          bold: true,
          margin: [0, 4, 0, 2],
          decoration: "underline",
          fontSize: 8,
        },
        {
          text: `Cash: ${first.cashamount.toLocaleString("en-QA", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
          fontSize: 8,
          margin: [0, 2],
        },
        {
          text: "** THANK YOU FOR DINING WITH US **",
          alignment: "center",
          fontSize: 8,
          margin: [0, 8],
        },
        {
          canvas: [
            { type: "line", x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 0.5 },
          ],
        },
        {
          text: "",
          margin: [0, 8],
        },
      ];
    });

    // Final PDF definition for thermal printer
    const docDefinition = {
      pageSize: { width: 220, height: "auto" }, // 80mm width in points (~220pt)
      pageMargins: [5, 5, 5, 5], // minimal margins for thermal
      content: [
        {
          text:
            `${invoivetitle} Report of ` +
            (parserOpenOutletDetails?.Shm_Name_V || ""),
          style: "header",
          alignment: "center",
          margin: [0, 0, 0, 5],
        },
        {
          text: `Invoice Date: ${formatDate(
            rawData[0].invdate
          )} to ${formatDate(rawData[rawData.length - 1].invdate)}`,
          style: "subheader",
          alignment: "center",
          margin: [0, 0, 0, 10],
        },
        ...receipts.flat(),
      ],
      styles: {
        header: { fontSize: 10, bold: true },
        subheader: { fontSize: 9 },
      },
      defaultStyle: {
        fontSize: 8,
      },
    };

    pdfMake.createPdf(docDefinition).open(); // use .print() if needed
  };

  const allinvoiceReportPDF2Pagination = (rawData, invoivetitle) => {
    let parserOpenOutletDetails = null;
    const openOutlet = localStorage.getItem("openOutlet");

    if (openOutlet) {
      try {
        parserOpenOutletDetails = JSON.parse(openOutlet);
      } catch (error) {
        console.error("Invalid open outlet JSON:", error);
      }
    }

    // Step 1: Group items by invoiceid
    const grouped = {};
    rawData.forEach((item) => {
      if (!grouped[item.invoiceid]) grouped[item.invoiceid] = [];
      grouped[item.invoiceid].push(item);
    });

    const invoices = Object.values(grouped);

    // Step 2: Format each receipt block
    const receipts = invoices.map((items, index) => {
      const first = items[0];
      const contentBlock = [
        ...(index > 0 ? [{ text: "", pageBreak: "before" }] : []), // pagination starts from second receipt
        {
          text: `Date: ${formatDate(first.invdate)}  ${formatTime(
            first.invtime
          )}`,
          fontSize: 8,
          margin: [0, 2],
        },
        {
          text: `Bill: ${first.billno}  Pax: ${first.pax}`,
          fontSize: 8,
          margin: [0, 2],
        },
        {
          text: `Delivery: ${formatDate(first.deliverydatetime)}`,
          fontSize: 8,
          margin: [0, 2],
        },
        {
          text: `${first.employeename}`,
          fontSize: 8,
          margin: [0, 2],
        },
        {
          text: `Customer: ${first.customername || "CASH CUSTOMER"}`,
          fontSize: 8,
          margin: [0, 2],
        },
        {
          text: `Mobile: ${first.mobileno || ""}`,
          fontSize: 8,
          margin: [0, 4],
        },
        {
          table: {
            widths: [20, "*", 30, 40],
            body: [
              [
                { text: "Sl", bold: true, fontSize: 8 },
                { text: "Menu", bold: true, fontSize: 8 },
                { text: "Qty", bold: true, fontSize: 8 },
                { text: "Amt", bold: true, fontSize: 8 },
              ],
              ...items.map((item, i) => [
                { text: `${i + 1}`, fontSize: 8 },
                { text: item.menuname, fontSize: 8 },
                { text: item.menuqty.toFixed(2), fontSize: 8 },
                { text: item.menuamount.toFixed(2), fontSize: 8 },
              ]),
            ],
          },
          layout: "noBorders",
          margin: [0, 2],
        },
        {
          text: `Net Amount: ${first.netamount.toLocaleString("en-QA", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
          fontSize: 8,
          alignment: "right",
          bold: true,
          margin: [0, 2],
        },
        {
          text: `Paid: ${first.paidamount.toLocaleString("en-QA", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
          fontSize: 8,
          alignment: "right",
          margin: [0, 2],
        },
        {
          text: "SETTLEMENT DETAILS",
          bold: true,
          margin: [0, 4, 0, 2],
          decoration: "underline",
          fontSize: 8,
        },
        {
          text: `Cash: ${first.cashamount.toLocaleString("en-QA", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
          fontSize: 8,
          margin: [0, 2],
        },
        {
          text: "** THANK YOU FOR DINING WITH US **",
          alignment: "center",
          fontSize: 8,
          margin: [0, 8],
        },
      ];

      return contentBlock;
    });

    // Final PDF definition
    const docDefinition = {
      pageSize: { width: 220, height: 800 }, // fixed height for thermal pagination
      pageMargins: [5, 5, 5, 5],
      content: [
        {
          text:
            `${invoivetitle} Report of ` +
            (parserOpenOutletDetails?.Shm_Name_V || ""),
          style: "header",
          alignment: "center",
          margin: [0, 0, 0, 5],
        },
        {
          text: `Invoice Date: ${formatDate(
            rawData[0].invdate
          )} to ${formatDate(rawData[rawData.length - 1].invdate)}`,
          style: "subheader",
          alignment: "center",
          margin: [0, 0, 0, 10],
        },
        ...receipts.flat(),
      ],
      styles: {
        header: { fontSize: 10, bold: true },
        subheader: { fontSize: 9 },
      },
      defaultStyle: {
        fontSize: 8,
      },
    };

    pdfMake.createPdf(docDefinition).open();
  };

  const allinvoiceReportPDF2withoutpagebreak = (rawData, invoivetitle) => {
    let parserOpenOutletDetails = null;
    const openOutlet = localStorage.getItem("openOutlet");

    if (openOutlet) {
      try {
        parserOpenOutletDetails = JSON.parse(openOutlet);
      } catch (error) {
        console.error("Invalid open outlet JSON:", error);
      }
    }

    // Group items by invoiceid
    const grouped = {};
    rawData.forEach((item) => {
      if (!grouped[item.invoiceid]) grouped[item.invoiceid] = [];
      grouped[item.invoiceid].push(item);
    });

    const invoices = Object.values(grouped);

    // Build each invoice block
    const receipts = invoices.map((items) => {
      const first = items[0];

      return [
        {
          text: `Date: ${formatDate(first.invdate)}  ${formatTime(
            first.invtime
          )}`,
          fontSize: 8,
          margin: [0, 2],
        },
        {
          text: `Bill: ${first.billno}  Pax: ${first.pax}`,
          fontSize: 8,
          margin: [0, 2],
        },
        {
          text: `Delivery: ${formatDate(first.deliverydatetime)}`,
          fontSize: 8,
          margin: [0, 2],
        },
        {
          text: `${first.employeename}`,
          fontSize: 8,
          margin: [0, 2],
        },
        {
          text: `Customer: ${first.customername || "CASH CUSTOMER"}`,
          fontSize: 8,
          margin: [0, 2],
        },
        {
          text: `Mobile: ${first.mobileno || ""}`,
          fontSize: 8,
          margin: [0, 4],
        },
        {
          table: {
            widths: [20, "*", 30, 40],
            body: [
              [
                { text: "Sl", bold: true, fontSize: 8 },
                { text: "Menu", bold: true, fontSize: 8 },
                { text: "Qty", bold: true, fontSize: 8 },
                { text: "Amt", bold: true, fontSize: 8 },
              ],
              ...items.map((item, i) => [
                { text: `${i + 1}`, fontSize: 8 },
                { text: item.menuname, fontSize: 8 },
                { text: item.menuqty.toFixed(2), fontSize: 8 },
                { text: item.menuamount.toFixed(2), fontSize: 8 },
              ]),
            ],
          },
          layout: "noBorders",
          margin: [0, 2],
        },
        {
          text: `Net Amount: ${first.netamount.toLocaleString("en-QA", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
          fontSize: 8,
          alignment: "right",
          bold: true,
          margin: [0, 2],
        },
        {
          text: `Paid: ${first.paidamount.toLocaleString("en-QA", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
          fontSize: 8,
          alignment: "right",
          margin: [0, 2],
        },
        {
          text: "SETTLEMENT DETAILS",
          bold: true,
          margin: [0, 4, 0, 2],
          decoration: "underline",
          fontSize: 8,
        },
        {
          text: `Cash: ${first.cashamount.toLocaleString("en-QA", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
          fontSize: 8,
          margin: [0, 2],
        },
        {
          text: "** THANK YOU FOR DINING WITH US **",
          alignment: "center",
          fontSize: 8,
          margin: [0, 8],
        },
        {
          canvas: [
            { type: "line", x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 0.5 },
          ],
          margin: [0, 4],
        },
      ];
    });

    // PDF definition
    const docDefinition = {
      pageSize: { width: 220, height: 800 }, // auto height
      pageMargins: [5, 5, 5, 5],
      content: [
        {
          text:
            `${invoivetitle} Report of ` +
            (parserOpenOutletDetails?.Shm_Name_V || ""),
          style: "header",
          alignment: "center",
          margin: [0, 0, 0, 5],
        },
        {
          text: `Invoice Date: ${formatDate(
            rawData[0].invdate
          )} to ${formatDate(rawData[rawData.length - 1].invdate)}`,
          style: "subheader",
          alignment: "center",
          margin: [0, 0, 0, 10],
        },
        ...receipts.flat(),
      ],
      styles: {
        header: { fontSize: 10, bold: true },
        subheader: { fontSize: 9 },
      },
      defaultStyle: {
        fontSize: 8,
      },
    };

    pdfMake.createPdf(docDefinition).open();
  };

  function formatTime(timeStr) {
    const date = new Date(timeStr);
    return isNaN(date.getTime())
      ? ""
      : date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true, // Ensures AM/PM format
        });
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr);
    return isNaN(date.getTime())
      ? ""
      : date.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
  }

  const formatAmount = (val) => {
    return parseFloat(val).toFixed(2);
  };

  // Collection Brief Report PDF Generation

  const generateCollectionBriefPDF = (data) => {
    if (!data || !data.length) return;

    // Get outlet name and invoice date range
    const outletName = data[0].outletname || "Outlet";
    const startDate = formatDate(data[0].invoiceouttime);
    const endDate = formatDate(data[data.length - 1].invoiceouttime);

    // Table rows
    const tableBody = [
      [
        { text: "Invoice No.", bold: true, fontSize: 9 },
        { text: "Guest", bold: true, fontSize: 9 },
        { text: "Pax", bold: true, fontSize: 9 },
        { text: "Amount", bold: true, fontSize: 9, alignment: "right" },
      ],
      ...data.map((item) => [
        { text: item.invoiceno, fontSize: 9 },
        { text: item.guestname, fontSize: 9 },
        { text: item.invoicenoofperson.toString(), fontSize: 9 },
        {
          text: item.invoicenetamount.toFixed(2),
          fontSize: 9,
          alignment: "right",
        },
      ]),
    ];

    // Totals
    const total = (field) =>
      data.reduce((sum, item) => sum + (item[field] || 0), 0).toFixed(2);

    const docDefinition = {
      content: [
        {
          text: outletName.toUpperCase(),
          bold: true,
          alignment: "center",
          fontSize: 12,
        },
        {
          text: "COLLECTION (BRIEF)",
          bold: true,
          alignment: "center",
          fontSize: 11,
          margin: [0, 2, 0, 10],
        },
        {
          columns: [
            { text: `Date : ${startDate}`, fontSize: 9 },
            { text: `Outlet : ${outletName}`, alignment: "right", fontSize: 9 },
          ],
          margin: [0, 0, 0, 5],
        },
        {
          text: `Invoice Date Between ${startDate} And ${endDate}`,
          alignment: "center",
          fontSize: 10,
          margin: [0, 0, 0, 10],
        },
        {
          table: {
            widths: ["30%", "*", "10%", "15%"],
            body: tableBody,
          },
          layout: "lightHorizontalLines",
          margin: [0, 0, 0, 10],
        },
        {
          table: {
            widths: ["*", "*"],
            body: [
              [
                { text: `Credit Card Total :`, fontSize: 9 },
                { text: total("cardamount"), fontSize: 9, alignment: "right" },
              ],
              [
                { text: `Cash Total :`, fontSize: 9 },
                { text: total("cashamount"), fontSize: 9, alignment: "right" },
              ],
              [
                { text: `Credit Facility Total :`, fontSize: 9 },
                {
                  text: total("creditamount"),
                  fontSize: 9,
                  alignment: "right",
                },
              ],
              [
                { text: `Tips Total :`, fontSize: 9 },
                { text: total("tips"), fontSize: 9, alignment: "right" },
              ],
              [
                { text: `Staff Payable Total :`, fontSize: 9 },
                { text: total("staffamount"), fontSize: 9, alignment: "right" },
              ],
              [
                { text: `Opening Cash :`, fontSize: 9 },
                { text: total("openingcash"), fontSize: 9, alignment: "right" },
              ],
              [
                { text: `Voucher Total :`, fontSize: 9 },
                {
                  text: total("voucheramount"),
                  fontSize: 9,
                  alignment: "right",
                },
              ],
              [
                { text: `Advance Total :`, fontSize: 9 },
                {
                  text: total("advanceamount"),
                  fontSize: 9,
                  alignment: "right",
                },
              ],
              [
                { text: `City Ledger :`, fontSize: 9 },
                {
                  text: total("cityledgeramount"),
                  fontSize: 9,
                  alignment: "right",
                },
              ],
            ],
          },
          layout: "noBorders",
          margin: [0, 0, 0, 10],
        },
        {
          columns: [
            {
              text: `Total Pax : ${data.reduce(
                (sum, item) => sum + item.invoicenoofperson,
                0
              )}`,
              fontSize: 9,
            },
            {
              text: `Net Amount: ${total("invoicenetamount")}`,
              alignment: "right",
              bold: true,
              fontSize: 9,
            },
          ],
        },
        {
          text: `Total : ${total("invoicenetamount")}`,
          alignment: "right",
          bold: true,
          fontSize: 10,
          margin: [0, 5, 0, 0],
        },
      ],
      pageMargins: [20, 20, 20, 20],
    };

    pdfMake.createPdf(docDefinition).open();
  };

  const generateCollectionBriefPDF22 = (data) => {
    if (!data || !data.length) return;

    const outletName = data[0].outletname || "Outlet";
    const startDate = formatDate(data[0].invoiceouttime);
    const endDate = formatDate(data[data.length - 1].invoiceouttime);

    const tableBody = [
      [
        { text: "Inv No.", bold: true, fontSize: 8 },
        { text: "Guest", bold: true, fontSize: 8 },
        { text: "Pax", bold: true, fontSize: 8, alignment: "center" },
        { text: "Amt", bold: true, fontSize: 8, alignment: "right" },
      ],
      ...data.map((item) => [
        { text: item.invoiceno, fontSize: 8 },
        { text: item.guestname, fontSize: 8 },
        {
          text: item.invoicenoofperson.toString(),
          fontSize: 8,
          alignment: "center",
        },
        {
          text: item.invoicenetamount.toFixed(2),
          fontSize: 8,
          alignment: "right",
        },
      ]),
    ];

    const total = (field) =>
      data.reduce((sum, item) => sum + (item[field] || 0), 0).toFixed(2);

    const docDefinition = {
      pageSize: { width: 220, height: "auto" }, // 80mm width in points
      pageMargins: [5, 5, 5, 5], // narrow margins for thermal paper
      content: [
        {
          text: outletName.toUpperCase(),
          bold: true,
          alignment: "center",
          fontSize: 9,
        },
        {
          text: "COLLECTION (BRIEF)",
          bold: true,
          alignment: "center",
          fontSize: 8,
          margin: [0, 2, 0, 5],
        },
        {
          columns: [
            { text: `Date: ${startDate}`, fontSize: 7 },
            { text: `Outlet: ${outletName}`, alignment: "right", fontSize: 7 },
          ],
          margin: [0, 0, 0, 4],
        },
        {
          text: `Invoices Between ${startDate} and ${endDate}`,
          alignment: "center",
          fontSize: 8,
          margin: [0, 0, 0, 5],
        },
        {
          table: {
            widths: [45, "*", 20, 35],
            body: tableBody,
          },
          layout: "lightHorizontalLines",
          margin: [0, 0, 0, 5],
        },
        {
          table: {
            widths: ["*", "auto"],
            body: [
              [
                { text: "Credit Card:", fontSize: 8 },
                { text: total("cardamount"), fontSize: 8, alignment: "right" },
              ],
              [
                { text: "Cash:", fontSize: 8 },
                { text: total("cashamount"), fontSize: 8, alignment: "right" },
              ],
              [
                { text: "Credit Facility:", fontSize: 8 },
                {
                  text: total("creditamount"),
                  fontSize: 8,
                  alignment: "right",
                },
              ],
              [
                { text: "Tips:", fontSize: 8 },
                { text: total("tips"), fontSize: 8, alignment: "right" },
              ],
              [
                { text: "Staff Payable:", fontSize: 8 },
                { text: total("staffamount"), fontSize: 8, alignment: "right" },
              ],
              [
                { text: "Opening Cash:", fontSize: 8 },
                { text: total("openingcash"), fontSize: 8, alignment: "right" },
              ],
              [
                { text: "Voucher:", fontSize: 8 },
                {
                  text: total("voucheramount"),
                  fontSize: 8,
                  alignment: "right",
                },
              ],
              [
                { text: "Advance:", fontSize: 8 },
                {
                  text: total("advanceamount"),
                  fontSize: 8,
                  alignment: "right",
                },
              ],
              [
                { text: "City Ledger:", fontSize: 8 },
                {
                  text: total("cityledgeramount"),
                  fontSize: 8,
                  alignment: "right",
                },
              ],
            ],
          },
          layout: "noBorders",
          margin: [0, 0, 0, 5],
        },
        {
          columns: [
            {
              text: `Total Pax: ${data.reduce(
                (sum, item) => sum + item.invoicenoofperson,
                0
              )}`,
              fontSize: 8,
            },
            {
              text: `Net: ${total("invoicenetamount")}`,
              alignment: "right",
              fontSize: 8,
              bold: true,
            },
          ],
          margin: [0, 0, 0, 4],
        },
        {
          text: `TOTAL: ${total("invoicenetamount")}`,
          alignment: "right",
          bold: true,
          fontSize: 9,
          margin: [0, 2, 0, 0],
        },
      ],
    };

    pdfMake.createPdf(docDefinition).open(); // use .print() for direct print
  };

  /*const generateCollectionBriefPDF2 = (listData, summaryData) => {
            if (!listData || !listData.length) return;
          
            const outletName = listData[0].outletname || 'Outlet';
            const startDate = formatDate(listData[0].invoiceouttime);
            const endDate = formatDate(listData[listData.length - 1].invoiceouttime);
          
            const tableBody = [
              [
                { text: 'Inv No.', bold: true, fontSize: 7 },
                { text: 'Guest', bold: true, fontSize: 7 },
                { text: 'Pax', bold: true, fontSize: 7, alignment: 'center' },
                { text: 'Amt', bold: true, fontSize: 7, alignment: 'right' }
              ],
              ...listData.map((item) => [
                { text: item.invoiceno, fontSize: 7 },
                { text: item.guestname, fontSize: 7 },
                { text: item.invoicenoofperson?.toString() ?? '0', fontSize: 7, alignment: 'center' },
                { text: (item.invoicenetamount ?? 0).toFixed(2), fontSize: 7, alignment: 'right' }
              ])
            ];
          
            const summaryBody = [
              [{ text: 'Credit Card Total :', fontSize: 8 }, { text: (summaryData[0].cardamountsum ?? 0).toLocaleString('en-QA', {minimumFractionDigits: 2,maximumFractionDigits: 2}), alignment: 'right', fontSize: 8 }],
              [{ text: 'Cash Total :', fontSize: 8 }, { text: (summaryData[0].cashamountsum ?? 0).toLocaleString('en-QA', {minimumFractionDigits: 2,maximumFractionDigits: 2}), alignment: 'right', fontSize: 8 }],
              [{ text: 'Credit Facility Total :', fontSize: 8 }, { text: (summaryData[0].creditamountsum ?? 0).toLocaleString('en-QA', {minimumFractionDigits: 2,maximumFractionDigits: 2}), alignment: 'right', fontSize: 8 }],
              [{ text: 'Tips Total :', fontSize: 8 }, { text: (summaryData[0].tipssum ?? 0).toLocaleString('en-QA', {minimumFractionDigits: 2,maximumFractionDigits: 2}), alignment: 'right', fontSize: 8 }],
              [{ text: 'Staff Payable Total :', fontSize: 8 }, { text: (summaryData[0].staffamountsum ?? 0).toLocaleString('en-QA', {minimumFractionDigits: 2,maximumFractionDigits: 2}), alignment: 'right', fontSize: 8 }],
              [{ text: 'Opening Cash :', fontSize: 8 }, { text: (summaryData[0].openingcashsum ?? 0).toLocaleString('en-QA', {minimumFractionDigits: 2,maximumFractionDigits: 2}), alignment: 'right', fontSize: 8 }],
              [{ text: 'Voucher Total :', fontSize: 8 }, { text: (summaryData[0].voucheramountsum ?? 0).toLocaleString('en-QA', {minimumFractionDigits: 2,maximumFractionDigits: 2}), alignment: 'right', fontSize: 8 }],
              [{ text: 'Advance Total :', fontSize: 8 }, { text: (summaryData[0].advanceamountsum ?? 0).toLocaleString('en-QA', {minimumFractionDigits: 2,maximumFractionDigits: 2}), alignment: 'right', fontSize: 8 }],
              [{ text: 'City Ledger :', fontSize: 8 }, { text: (summaryData[0].cityledgeramountsum ?? 0).toLocaleString('en-QA', {minimumFractionDigits: 2,maximumFractionDigits: 2}), alignment: 'right', fontSize: 8 }],
              [{ text: 'Total Cash :', fontSize: 8 }, { text: (summaryData[0].totalcashsum ?? 0).toLocaleString('en-QA', {minimumFractionDigits: 2,maximumFractionDigits: 2}), alignment: 'right', fontSize: 8 }],
              [{ text: 'Total Pax :', fontSize: 8 }, { text: (summaryData[0].invoicenoofpersum ?? 0).toString(), alignment: 'right', fontSize: 8 }],
              [{ text: 'Net Total :', fontSize: 8, bold: true }, { text: (summaryData[0].invoicenetamount ?? 0).toLocaleString('en-QA', {minimumFractionDigits: 2,maximumFractionDigits: 2}), alignment: 'right', fontSize: 8, bold: true }],
              [{ text: 'Total :', fontSize: 9, bold: true }, { text: (summaryData[0].invoicenetamount ?? 0).toLocaleString('en-QA', {minimumFractionDigits: 2,maximumFractionDigits: 2}), alignment: 'right', fontSize: 9, bold: true }]
            ];
          
            const docDefinition = {
              pageSize: { width: 220, height: 'auto' },
              pageMargins: [5, 5, 5, 5],
              content: [
                { text: outletName.toUpperCase(), bold: true, alignment: 'center', fontSize: 9 },
                { text: 'COLLECTION (BRIEF)', bold: true, alignment: 'center', fontSize: 8, margin: [0, 2, 0, 5] },
                {
                  columns: [
                    { text: `Date: ${startDate}`, fontSize: 7 },
                    { text: `Outlet: ${outletName}`, alignment: 'right', fontSize: 7 }
                  ],
                  margin: [0, 0, 0, 4]
                },
                {
                  text: `Invoices Between ${startDate} and ${endDate}`,
                  alignment: 'center',
                  fontSize: 8,
                  margin: [0, 0, 0, 5]
                },
                {
                  table: {
                    widths: ['*', 40, 15, 35],
                    body: tableBody
                  },
                  layout: 'lightHorizontalLines',
                  margin: [0, 0, 0, 5]
                },
                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 210, y2: 0, lineWidth: 0.5 }], margin: [0, 2, 0, 2] },
                {
                  table: {
                    widths: ['*', 'auto'],
                    body: summaryBody
                  },
                  layout: 'noBorders'
                }
              ]
            };
          
            pdfMake.createPdf(docDefinition).open();
          };*/

  const generateCollectionBriefPDF2 = (listData, summaryData) => {
    if (!listData || !listData.length) return;

    const outletName = listData[0].outletname || "Outlet";
    const startDate = formatDate(listData[0].invoiceouttime);
    const endDate = formatDate(listData[listData.length - 1].invoiceouttime);

    const tableBody = [
      [
        { text: "Inv No.", bold: true, fontSize: 7 },
        { text: "Guest", bold: true, fontSize: 7 },
        { text: "Pax", bold: true, fontSize: 7, alignment: "center" },
        { text: "Amt", bold: true, fontSize: 7, alignment: "right" },
      ],
      ...listData.map((item) => [
        { text: item.invoiceno, fontSize: 7 },
        { text: item.guestname, fontSize: 7 },
        {
          text: item.invoicenoofperson?.toString() ?? "0",
          fontSize: 7,
          alignment: "center",
        },
        {
          text: (item.invoicenetamount ?? 0).toFixed(2),
          fontSize: 7,
          alignment: "right",
        },
      ]),
    ];

    const summaryBody = [
      [
        { text: "Credit Card Total :", fontSize: 8 },
        {
          text: (summaryData[0].cardamountsum ?? 0).toLocaleString("en-QA", {
            minimumFractionDigits: 2,
          }),
          alignment: "right",
          fontSize: 8,
        },
      ],
      [
        { text: "Cash Total :", fontSize: 8 },
        {
          text: (summaryData[0].cashamountsum ?? 0).toLocaleString("en-QA", {
            minimumFractionDigits: 2,
          }),
          alignment: "right",
          fontSize: 8,
        },
      ],
      [
        { text: "Credit Facility Total :", fontSize: 8 },
        {
          text: (summaryData[0].creditamountsum ?? 0).toLocaleString("en-QA", {
            minimumFractionDigits: 2,
          }),
          alignment: "right",
          fontSize: 8,
        },
      ],
      [
        { text: "Tips Total :", fontSize: 8 },
        {
          text: (summaryData[0].tipssum ?? 0).toLocaleString("en-QA", {
            minimumFractionDigits: 2,
          }),
          alignment: "right",
          fontSize: 8,
        },
      ],
      [
        { text: "Staff Payable Total :", fontSize: 8 },
        {
          text: (summaryData[0].staffamountsum ?? 0).toLocaleString("en-QA", {
            minimumFractionDigits: 2,
          }),
          alignment: "right",
          fontSize: 8,
        },
      ],
      [
        { text: "Opening Cash :", fontSize: 8 },
        {
          text: (summaryData[0].openingcashsum ?? 0).toLocaleString("en-QA", {
            minimumFractionDigits: 2,
          }),
          alignment: "right",
          fontSize: 8,
        },
      ],
      [
        { text: "Voucher Total :", fontSize: 8 },
        {
          text: (summaryData[0].voucheramountsum ?? 0).toLocaleString("en-QA", {
            minimumFractionDigits: 2,
          }),
          alignment: "right",
          fontSize: 8,
        },
      ],
      [
        { text: "Advance Total :", fontSize: 8 },
        {
          text: (summaryData[0].advanceamountsum ?? 0).toLocaleString("en-QA", {
            minimumFractionDigits: 2,
          }),
          alignment: "right",
          fontSize: 8,
        },
      ],
      [
        { text: "City Ledger :", fontSize: 8 },
        {
          text: (summaryData[0].cityledgeramountsum ?? 0).toLocaleString(
            "en-QA",
            { minimumFractionDigits: 2 }
          ),
          alignment: "right",
          fontSize: 8,
        },
      ],
      [
        { text: "Total Cash :", fontSize: 8 },
        {
          text: (summaryData[0].totalcashsum ?? 0).toLocaleString("en-QA", {
            minimumFractionDigits: 2,
          }),
          alignment: "right",
          fontSize: 8,
        },
      ],
      [
        { text: "Total Pax :", fontSize: 8 },
        {
          text: (summaryData[0].invoicenoofpersum ?? 0).toString(),
          alignment: "right",
          fontSize: 8,
        },
      ],
      [
        { text: "Net Total :", fontSize: 8, bold: true },
        {
          text: (summaryData[0].invoicenetamount ?? 0).toLocaleString("en-QA", {
            minimumFractionDigits: 2,
          }),
          alignment: "right",
          fontSize: 8,
          bold: true,
        },
      ],
      [
        { text: "Total :", fontSize: 9, bold: true },
        {
          text: (summaryData[0].invoicenetamount ?? 0).toLocaleString("en-QA", {
            minimumFractionDigits: 2,
          }),
          alignment: "right",
          fontSize: 9,
          bold: true,
        },
      ],
    ];

    const docDefinition = {
      pageSize: { width: 220, height: 842 }, // A4 height for pagination
      pageMargins: [5, 5, 5, 20], // bottom margin for footer
      content: [
        {
          text: outletName.toUpperCase(),
          bold: true,
          alignment: "center",
          fontSize: 9,
        },
        {
          text: "COLLECTION (BRIEF)",
          bold: true,
          alignment: "center",
          fontSize: 8,
          margin: [0, 2, 0, 5],
        },
        {
          columns: [
            { text: `Date: ${startDate}`, fontSize: 7 },
            { text: `Outlet: ${outletName}`, alignment: "right", fontSize: 7 },
          ],
          margin: [0, 0, 0, 4],
        },
        {
          text: `Invoices Between ${startDate} and ${endDate}`,
          alignment: "center",
          fontSize: 8,
          margin: [0, 0, 0, 5],
        },
        {
          table: {
            widths: ["*", 40, 15, 35],
            body: tableBody,
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0,
            paddingLeft: () => 2,
            paddingRight: () => 2,
            paddingTop: () => 1,
            paddingBottom: () => 1,
          },
          dontBreakRows: true,
          margin: [0, 0, 0, 5],
        },
        {
          canvas: [
            { type: "line", x1: 0, y1: 0, x2: 210, y2: 0, lineWidth: 0.5 },
          ],
          margin: [0, 2, 0, 2],
        },
        {
          text: "SUMMARY",
          pageBreak: "before",
          bold: true,
          fontSize: 8,
          alignment: "center",
          margin: [0, 5, 0, 5],
        },
        {
          table: {
            widths: ["*", "auto"],
            body: summaryBody,
          },
          layout: "noBorders",
        },
      ],
      footer: (currentPage, pageCount) => ({
        text: `Page ${currentPage} of ${pageCount}`,
        alignment: "center",
        fontSize: 6,
        margin: [0, 5, 0, 0],
      }),
    };

    pdfMake.createPdf(docDefinition).open();
  };

  function formatDate(dateStr) {
    const date = new Date(dateStr);
    return isNaN(date.getTime())
      ? ""
      : date.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
  }

  // Collection Details report PDF Creation Function

  const generateCollectionDetailsPDF = (
    summaryData,
    startDate,
    endtDate,
    outletName
  ) => {
    if (!summaryData || !summaryData.length) return;

    // Group data by Type_V
    const grouped = summaryData.reduce((acc, item) => {
      if (!acc[item.Type_V]) acc[item.Type_V] = [];
      acc[item.Type_V].push(item);
      return acc;
    }, {});

    const content = [];

    // Header
    content.push(
      { text: `${outletName}`, alignment: "center", bold: true, fontSize: 9 },
      {
        text: "Collection Details",
        alignment: "center",
        bold: true,
        fontSize: 8,
        margin: [0, 2, 0, 0],
      },
      {
        text: `Invoice Date Between\n ${startDate} And ${endtDate}`,
        alignment: "center",
        fontSize: 7,
        margin: [0, 2, 0, 5],
      }
    );

    // Render each group
    Object.entries(grouped).forEach(([groupName, items]) => {
      content.push(
        { text: groupName, bold: true, fontSize: 8, margin: [0, 5, 0, 3] },
        {
          table: {
            widths: [15, "*", "auto"],
            body: [
              // Table header
              [
                { text: "Sl", fontSize: 7, bold: true },
                { text: "Type Description", fontSize: 7, bold: true },
                { text: "Amount", alignment: "right", fontSize: 7, bold: true },
              ],
              // Data rows
              ...items.map((item, index) => [
                { text: `${index + 1}`, fontSize: 7 },
                { text: item.TypeDesc, fontSize: 7 },
                {
                  text: item.Amount.toLocaleString("en-QA", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }),
                  alignment: "right",
                  fontSize: 7,
                },
              ]),
              // Group total
              [
                { text: "", border: [false, false, false, false] },
                { text: "Total:", bold: true, fontSize: 8 },
                {
                  text: items
                    .reduce((sum, i) => sum + (i.Amount || 0), 0)
                    .toLocaleString("en-QA", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }),
                  alignment: "right",
                  bold: true,
                  fontSize: 8,
                },
              ],
            ],
          },
          layout: "lightHorizontalLines",
          margin: [0, 0, 0, 2],
        }
      );
    });

    const docDefinition = {
      pageSize: { width: 220, height: "auto" }, // 80mm thermal printer
      pageMargins: [5, 5, 5, 5],
      content,
    };

    pdfMake.createPdf(docDefinition).open(); // Use .print() for direct printing
  };

  const generateCollectionDetailsPDFPagination = (
    summaryData,
    startDate,
    endtDate,
    outletName
  ) => {
    if (!summaryData || !summaryData.length) return;

    // Group data by Type_V
    const grouped = summaryData.reduce((acc, item) => {
      if (!acc[item.Type_V]) acc[item.Type_V] = [];
      acc[item.Type_V].push(item);
      return acc;
    }, {});

    const content = [];

    // Header
    content.push(
      { text: `${outletName}`, alignment: "center", bold: true, fontSize: 9 },
      {
        text: "Collection Details",
        alignment: "center",
        bold: true,
        fontSize: 8,
        margin: [0, 2, 0, 0],
      },
      {
        text: `Invoice Date Between\n ${startDate} And ${endtDate}`,
        alignment: "center",
        fontSize: 7,
        margin: [0, 2, 0, 5],
      }
    );

    // Render each group
    Object.entries(grouped).forEach(([groupName, items], groupIndex) => {
      if (groupIndex > 0) {
        content.push({ text: "", pageBreak: "before" }); // Add page break before each group except first
      }

      content.push(
        { text: groupName, bold: true, fontSize: 8, margin: [0, 5, 0, 3] },
        {
          table: {
            //widths: [15, '*', 'auto'],
            widths: ["10%", "65%", "25%"],
            body: [
              [
                { text: "Sl", fontSize: 7, bold: true },
                { text: "Type Description", fontSize: 7, bold: true },
                { text: "Amount", alignment: "right", fontSize: 7, bold: true },
              ],
              ...items.map((item, index) => [
                { text: `${index + 1}`, fontSize: 7 },
                { text: item.TypeDesc, fontSize: 7 },
                {
                  text: item.Amount.toLocaleString("en-QA", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }),
                  alignment: "right",
                  fontSize: 7,
                },
              ]),
              [
                { text: "", border: [false, false, false, false] },
                { text: "Total:", bold: true, fontSize: 8 },
                {
                  text: items
                    .reduce((sum, i) => sum + (i.Amount || 0), 0)
                    .toLocaleString("en-QA", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }),
                  alignment: "right",
                  bold: true,
                  fontSize: 8,
                },
              ],
            ],
          },
          layout: "lightHorizontalLines",
          margin: [0, 0, 0, 2],
        }
      );
    });

    const docDefinition = {
      pageSize: { width: 220, height: 800 },
      pageMargins: [5, 5, 5, 5],
      content,
    };

    pdfMake.createPdf(docDefinition).open(); // Use .print() for direct printing
  };

  // Employee Wise Report

  const generateEmployeeWiseReportPDF = (data) => {
    if (!data || !data.length) return;

    // Group by invoiceid
    const groupedData = data.reduce((acc, item) => {
      const key = item.invoiceid;
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});

    const content = [];

    Object.values(groupedData).forEach((invoiceItems, idx) => {
      const first = invoiceItems[0]; // Take header info from first entry
      const menuRows = invoiceItems.map((item, i) => [
        { text: `${i + 1}`, fontSize: 7 },
        { text: item.menuname || "-", fontSize: 7 },
        { text: item.menuqty || "0", alignment: "center", fontSize: 7 },
        { text: item.menuamount.toFixed(2), alignment: "right", fontSize: 7 },
      ]);

      const totalAmount =
        first.totalamount?.toLocaleString("en-QA", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }) || "0.00";
      const deliveryCharge =
        first.deliverycharge?.toLocaleString("en-QA", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }) || "0.00";
      const netAmount =
        first.netamount?.toLocaleString("en-QA", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }) || "0.00";

      content.push(
        {
          text: first.outletname || "Outlet",
          alignment: "center",
          bold: true,
          fontSize: 9,
        },
        { text: "proc-shw reg adres", alignment: "center", fontSize: 7 },
        {
          columns: [
            { text: "Tel : ", fontSize: 7 },
            { text: "Fax : ", alignment: "right", fontSize: 7 },
          ],
        },
        {
          columns: [
            { text: `Date : ${first.invdate.split(" ")[0]}`, fontSize: 7 },
            {
              text: `Time : ${new Date(first.invtime).toLocaleTimeString()}`,
              alignment: "right",
              fontSize: 7,
            },
          ],
        },
        {
          columns: [
            { text: `Bill : ${first.Billno}`, fontSize: 7 },
            {
              text: `Pax : ${first.pax || 0}`,
              alignment: "right",
              fontSize: 7,
            },
          ],
        },
        {
          columns: [
            {
              text: `Delivery Date/Time : ${first.deliverydatetime}`,
              fontSize: 7,
            },
          ],
        },
        {
          text: `Customer Name : ${first.customername || "-"}`,
          fontSize: 7,
        },
        {
          text: `Mobile Number : ${first.mobileno || "-"}`,
          fontSize: 7,
          margin: [0, 0, 0, 5],
        },
        {
          table: {
            widths: [10, "*", 25, 35],
            body: [
              [
                { text: "Sl #", fontSize: 7, bold: true },
                { text: "Menu", fontSize: 7, bold: true },
                { text: "Qty", fontSize: 7, bold: true, alignment: "center" },
                {
                  text: "Amount(QAR)",
                  fontSize: 7,
                  bold: true,
                  alignment: "right",
                },
              ],
              ...menuRows,
            ],
          },
          layout: "lightHorizontalLines",
          margin: [0, 0, 0, 5],
        },
        {
          text: "خبز عربي",
          alignment: "center",
          fontSize: 7,
          margin: [0, 0, 0, 5],
        },
        {
          columns: [
            { text: "Total :", fontSize: 7 },
            { text: totalAmount, alignment: "right", fontSize: 7 },
          ],
        },
        {
          columns: [
            { text: "Delivery Charge :", fontSize: 7 },
            { text: deliveryCharge, alignment: "right", fontSize: 7 },
          ],
        },
        {
          columns: [
            { text: "Net Amount :", fontSize: 7 },
            { text: netAmount, alignment: "right", fontSize: 7 },
          ],
        },
        {
          columns: [
            { text: "Paid Amount :", fontSize: 7 },
            { text: "0.00", alignment: "right", fontSize: 7 },
          ],
        },
        {
          text: "SETTLEMENT DETAILS",
          bold: true,
          fontSize: 7,
          margin: [0, 5, 0, 2],
        },
        {
          columns: [
            { text: "Staff Payable :", fontSize: 7 },
            { text: netAmount, alignment: "right", fontSize: 7 },
          ],
        },
        {
          text: `Staff : ${first.customername || "-"}`,
          fontSize: 7,
          decoration: "underline",
          margin: [0, 2, 0, 5],
        },
        {
          text: "** THANK YOU FOR DINING WITH US **",
          alignment: "center",
          fontSize: 7,
          margin: [0, 2, 0, 2],
        },
        {
          text: "Comments..................................................",
          fontSize: 7,
          margin: [0, 2, 0, 2],
        },
        {
          text: "Sign...............................................................",
          fontSize: 7,
          margin: [0, 2, 0, 4],
        },
        // Add a line between invoices
        idx < Object.values(groupedData).length - 1
          ? {
              canvas: [
                { type: "line", x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 0.5 },
              ],
              margin: [0, 5, 0, 5],
            }
          : {}
      );
    });

    const docDefinition = {
      pageSize: { width: 220, height: "auto" }, // 80mm width
      pageMargins: [5, 5, 5, 5],
      content,
    };

    pdfMake.createPdf(docDefinition).open(); // or .print()
  };

  // PDF Report Generation end here

  const onFinish = (values) => {
    const user = localStorage.getItem("user");
    const outlet = localStorage.getItem("outletDetails");
    const openOutlet = localStorage.getItem("openOutlet");

    let parserdetails = null;
    let parseroutletdetails = null;
    let parserOpenOutletDetails = null;

    if (user) {
      try {
        parserdetails = JSON.parse(user);
      } catch (error) {
        console.error("Invalid user JSON:", error);
      }
    }

    if (outlet) {
      try {
        parseroutletdetails = JSON.parse(outlet);
      } catch (error) {
        console.error("Invalid user JSON:", error);
      }
    }

    if (openOutlet) {
      try {
        parserOpenOutletDetails = JSON.parse(openOutlet);
      } catch (error) {
        console.error("Invalid open outlet JSON:", error);
      }
    }

    //Brief Report Request Body
    const Briefreport = {
      outletid: parseroutletdetails.outlet,
      fromdate: dayjs(values.startDate).format("DD-MMM-YYYY"),
      todate: dayjs(values.endDate).format("DD-MMM-YYYY"),
      customername: values.CustomerName,
      invoiceno: values.InvoiceNumber,
      intmode: "0",
    };

    // KOT  Report Request Body
    const KOTreport = {
      outletid: parseroutletdetails.outlet,
      fromdate: dayjs(values.startDate).format("DD-MMM-YYYY"),
      todate: dayjs(values.endDate).format("DD-MMM-YYYY"),
    };

    // All Invoice Reports Request Body
    const AllInvoiceReports = {
      outletid: parseroutletdetails.outlet,
      fromdate: dayjs(values.startDate).format("DD-MMM-YYYY"),
      todate: dayjs(values.endDate).format("DD-MMM-YYYY"),
      customername: values.CustomerName,
      invoiceno: values.InvoiceNumber,
      invoicestatus: 0,
    };

    // Invoice Summary Reports Request Body 4
    const InvoiceSummaryReports = {
      outletid: parseroutletdetails.outlet,
      fromdate: dayjs(values.startDate).format("DD-MMM-YYYY"),
      todate: dayjs(values.endDate).format("DD-MMM-YYYY"),
      customername: values.CustomerName,
      invoiceno: values.InvoiceNumber,
    };

    // Employee Wise Invoice Reports
    const EmployeeWiseInvoiceReports = {
      outletid: parseroutletdetails.outlet,
      fromdate: dayjs(values.startDate).format("DD-MMM-YYYY"),
      todate: dayjs(values.endDate).format("DD-MMM-YYYY"),
      customername: values.CustomerName,
    };

    // Collection Details Invoice Reports
    const CollectionDetailsReports = {
      userid: parserdetails.userid,
      outletid: parseroutletdetails.outlet,
      fromdate: dayjs(values.startDate).format("DD-MMM-YYYY"),
      todate: dayjs(values.endDate).format("DD-MMM-YYYY"),
      customername: values.CustomerName,
      invoiceno: values.InvoiceNumber,
    };

    //Open KOT Invoice Reports
    const OpenKOTInvoiceReports = {
      outletid: parseroutletdetails.outlet,
      fromdate: dayjs(values.startDate).format("DD-MMM-YYYY"),
      todate: dayjs(values.endDate).format("DD-MMM-YYYY"),
    };

    setLoader(true);

    switch (invoiceType) {
      case "2904":
        console.log("Brief Report");
        setLoader(true);

        if (!posReportModel) {
          console.log("posReportModel is undefined!");
          setLoader(false);
          return;
        }

        posReportModel
          .briefReport(Briefreport)
          .then((data) => {
            if (data?.status === "true") {
              const listData = data.data;

              posReportModel
                .getbriefreportssummary({ ...Briefreport, intmode: "1" })
                .then((summaryResp) => {
                  if (summaryResp?.status === "true") {
                    const summeryData = summaryResp.data;
                    console.log("List Data:", listData);
                    console.log("Summary Data:", summeryData);
                    generateCollectionBriefPDF2(listData, summeryData);
                  } else {
                    const errorMsg =
                      summaryResp?.Error?.Error_Msg ||
                      "Failed to fetch summary";
                    Swal.fire({
                      title: info,
                      text: errorMsg,
                      icon: "error",
                      confirmButtonText: "Ok",
                      confirmButtonColor: "#ec4d4f",
                    });
                  }
                  setLoader(false);
                })
                .catch((error) => {
                  console.log("Error fetching summary:", error);
                  setLoader(false);
                });
            } else {
              const errorMsg =
                data?.Error?.Error_Msg || "Unknown error occurred";
              Swal.fire({
                // title: errorCode === "404" ? 'info' : 'Error',
                title: errorMsg,
                icon: errorCode === "404" ? "info" : "error",
                showCancelButton: false,
                confirmButtonText: "Ok",
                confirmButtonColor: "#ec4d4f",
              });
              setLoader(false);
            }
          })
          .catch((error) => {
            console.error("Error while fetching Brief Report:", error);
            setLoader(false);
          });
        break;

      case "2905":
        // KOT Report Request Body
        console.log("KOT Report");
        posReportModel
          ?.kotReport(KOTreport)
          .then((data) => {
            if (data?.status === "true") {
              setLoader(false);
              console.log(data?.message);
              generateKOTReportPDF2(data?.data);
            } else {
              setLoader(false);
              const errorCode = data?.Error?.Error_Code;
              const errorMsg =
                data?.Error?.Error_Msg || "Unknown error occurred";
              console.log("errorCode" + errorMsg);
              Swal.fire({
                // title: errorCode === "404" ? 'info' : 'Error',
                title: errorMsg,
                icon: errorCode === "404" ? "info" : "error",
                showCancelButton: false,
                confirmButtonText: "Ok",
                confirmButtonColor: "#ec4d4f",
              });
            }
          })
          .catch((error) => {
            console.log("Error while fetching KOT Report:=", error);
          });
        break;

      case "2916":
        // Collection Details Reports
        console.log("Collection Details Invoice Reports");
        posReportModel
          ?.collectionDetailsReports(CollectionDetailsReports)
          .then((data) => {
            if (data?.status === "true") {
              setLoader(false);
              console.log(data?.message);

              const startDate = dayjs(values.startDate).format("DD-MMM-YYYY");
              const endtDate = dayjs(values.endDate).format("DD-MMM-YYYY");

              const outlet = localStorage.getItem("openOutlet");

              let outletName = "";

              if (outlet) {
                try {
                  const parsed = JSON.parse(outlet);
                  outletName = parsed.Shm_Name_V;
                  console.log(outletName); // Output: GO CRISPY GHARAFA
                } catch (error) {
                  console.log("Failed to parse outlet details:", error);
                }
              }

              //generateCollectionDetailsPDF(data?.data,startDate,endtDate,outletName);
              generateCollectionDetailsPDFPagination(
                data?.data,
                startDate,
                endtDate,
                outletName
              );
            } else {
              setLoader(false);
              const errorCode = data?.Error?.Error_Code;
              const errorMsg =
                data?.Error?.Error_Msg || "Unknown error occurred";
              console.log("errorCode" + errorMsg);
              Swal.fire({
                // title: errorCode === "404" ? 'info' : 'Error',
                title: errorMsg,
                icon: errorCode === "404" ? "info" : "error",
                showCancelButton: false,
                confirmButtonText: "Ok",
                confirmButtonColor: "#ec4d4f",
              });
            }
          })
          .catch((error) => {
            console.log(
              "Error while fetching collection Details Invoice Reports:=",
              error
            );
          });
        break;

      case "2907":
        // All Invoice Reports Request Body
        console.log("All Invoice Reports");
        posReportModel
          ?.allInvoiceReports(AllInvoiceReports)
          .then((data) => {
            if (data?.status === "true") {
              console.log(data?.message);
              //allinvoiceReportPDF2(data?.data,'All');
              allinvoiceReportPDF2(data?.data, "All");
              //allinvoiceReportPDF2Pagination(data?.data,'All');
              //allinvoiceReportPDF2withoutpagebreak(data?.data,'All');
              setLoader(false);
              //navigate('/allInvoiceReports', { state: { data: data?.data } });
            } else {
              setLoader(false);
              const errorCode = data?.Error?.Error_Code;
              const errorMsg =
                data?.Error?.Error_Msg || "Unknown error occurred";
              console.log("errorCode" + errorMsg);
              Swal.fire({
                // title: errorCode === "404" ? 'info' : 'Error',
                title: errorMsg,
                icon: errorCode === "404" ? "info" : "error",
                showCancelButton: false,
                confirmButtonText: "Ok",
                confirmButtonColor: "#ec4d4f",
              });
            }
          })
          .catch((error) => {
            console.log("Error while fetching All Invoice Reports:=", error);
          });
        break;

      case "2908":
        // All Invoice Settled
        console.log("All Invoice Reports");
        posReportModel
          ?.allInvoiceReports({ ...AllInvoiceReports, invoicestatus: 2 })
          .then((data) => {
            if (data?.status === "true") {
              console.log(data?.message);
              allinvoiceReportPDF2(data?.data, "All Settled");
              setLoader(false);
            } else {
              setLoader(false);
              const errorCode = data?.Error?.Error_Code;
              const errorMsg =
                data?.Error?.Error_Msg || "Unknown error occurred";
              console.log("errorCode" + errorMsg);
              Swal.fire({
                // title: errorCode === "404" ? 'info' : 'Error',
                title: errorMsg,
                icon: errorCode === "404" ? "info" : "error",
                showCancelButton: false,
                confirmButtonText: "Ok",
                confirmButtonColor: "#ec4d4f",
              });
            }
          })
          .catch((error) => {
            console.log("Error while fetching All Invoice Reports:=", error);
          });
        break;

      case "2909":
        // All Invoice UnSettled
        console.log("All Invoice Reports");
        posReportModel
          ?.allInvoiceReports({ ...AllInvoiceReports, invoicestatus: 1 })
          .then((data) => {
            if (data?.status === "true") {
              console.log(data?.message);
              allinvoiceReportPDF2(data?.data, "All Unsettled");
              setLoader(false);
            } else {
              setLoader(false);
              const errorCode = data?.Error?.Error_Code;
              const errorMsg =
                data?.Error?.Error_Msg || "Unknown error occurred";
              console.log("errorCode" + errorMsg);
              Swal.fire({
                // title: errorCode === "404" ? 'info' : 'Error',
                title: errorMsg,
                icon: errorCode === "404" ? "info" : "error",
                showCancelButton: false,
                confirmButtonText: "Ok",
                confirmButtonColor: "#ec4d4f",
              });
            }
          })
          .catch((error) => {
            console.log("Error while fetching All Invoice Reports:=", error);
          });
        break;

      case "2906":
        // Invoice Summary Reports Request Body
        console.log("Invoice Summary Reports Request Body");
        posReportModel
          ?.invoiceSummaryReports(InvoiceSummaryReports)
          .then((data) => {
            if (data?.status === "true") {
              setLoader(false);
              console.log(data?.message);
              invoiceSummeryReportPDF2(
                data?.data,
                dayjs(values.startDate).format("DD-MMM-YYYY"),
                dayjs(values.endDate).format("DD-MMM-YYYY")
              );
            } else {
              setLoader(false);
              const errorCode = data?.Error?.Error_Code;
              const errorMsg =
                data?.Error?.Error_Msg || "Unknown error occurred";
              console.log("errorCode" + errorMsg);
              Swal.fire({
                // title: errorCode === "404" ? 'info' : 'Error',
                title: errorMsg,
                icon: errorCode === "404" ? "info" : "error",
                showCancelButton: false,
                confirmButtonText: "Ok",
                confirmButtonColor: "#ec4d4f",
              });
            }
          })
          .catch((error) => {
            console.log("Error while fetching All Invoice Reports:=", error);
          });

        break;

      case "2911":
        // Employee Wise Invoice Reports
        console.log("Employee Wise Invoice Reports");
        posReportModel
          ?.employeeWiseInvoiceReports(EmployeeWiseInvoiceReports)
          .then((data) => {
            if (data?.status === "true") {
              console.log(data?.message);
              setLoader(false);
              generateEmployeeWiseReportPDF(data?.data);
            } else {
              setLoader(false);
              const errorCode = data?.Error?.Error_Code;
              const errorMsg =
                data?.Error?.Error_Msg || "Unknown error occurred";
              console.log("errorCode" + errorMsg);
              Swal.fire({
                // title: errorCode === "404" ? 'info' : 'Error',
                title: errorMsg,
                icon: errorCode === "404" ? "info" : "error",
                showCancelButton: false,
                confirmButtonText: "Ok",
                confirmButtonColor: "#ec4d4f",
              });
            }
          })
          .catch((error) => {
            console.log(
              "Error while fetching Employee Wise Invoice Reports:=",
              error
            );
          });
        break;

      default:
        setLoader(false);
        Swal.fire({
          title: "Invalid invoice type",
          text: "Please select a valid Report type",
          icon: "info",
          showCancelButton: false,
          confirmButtonText: "Ok",
          confirmButtonColor: "#ec4d4f",
        });
        console.log("Invalid invoice type selected.");
        break;
    }
  };

  const handleNumberClick = (key) => {
    if (!activeField) {
      toast.error("Please select a field to enter data.");
      return;
    }

    const currentValue = form.getFieldValue(activeField)?.toString() || "";

    if (key === "Del") {
      form.setFieldsValue({
        [activeField]: currentValue.slice(0, -1),
      });
    } else if (key === "CapsLK") {
      // Toggle case for the active field
      setCaplocvalue((prev) => (prev === 97 ? 65 : 97));
    } else if (key === "Space") {
      form.setFieldsValue({
        [activeField]: currentValue + " ",
      });
    } else {
      if (activeField === "CustomerName") {
        const isNumber = /^\d$/.test(key);

        if (isNumber) {
          form.setFieldsValue({
            [activeField]: currentValue,
          });
        } else {
          form.setFieldsValue({
            [activeField]: currentValue + key,
          });
        }
      } else {
        form.setFieldsValue({
          [activeField]: currentValue + key,
        });
      }
    }
  };

  const qwertyKeyCodes = [
    81,
    87,
    69,
    82,
    84,
    89,
    85,
    73,
    79,
    80, // Q–P
    65,
    83,
    68,
    70,
    71,
    72,
    74,
    75,
    76, // A–L
    90,
    88,
    67,
    86,
    66,
    78,
    77, // Z–M
  ];

  const qwertyKeyCodesLower = [
    113,
    119,
    101,
    114,
    116,
    121,
    117,
    105,
    111,
    112, // q–p
    97,
    115,
    100,
    102,
    103,
    104,
    106,
    107,
    108, // a–l
    122,
    120,
    99,
    118,
    98,
    110,
    109, // z–m
  ];

  return (
    <div
      className="px-5"
      style={{ background: "#082944", color: "white", minHeight: "100vh" }}
    >
      <div
        style={{ display: "flex", alignItems: "center", marginBottom: "0px" }}
      >
        <div className="w-full  p-2 px-1 md:px-5 flex items-center justify-between h-[10%]">
          <div className="p-2 text-white text-start w-full">
            <div className="w-fit flex flex-col justify-center align-middle">
              <span>{outlet?.Shm_Name_V || ""}</span>
              <span className="text-xs block text-center">
                {moment(date).format("DD-MMM-YYYY")}
              </span>
            </div>
          </div>
          <div
            className=" p-3 mr-4 py-3 rounded-lg bg-secondary cursor-pointer"
            onClick={handleHomepage}
          >
            <Icon icon="mdi:silverware-fork-knife" width="24" height="24" />
          </div>
          <div className="w-fit rounded-lg bg-secondary p-1 flex items-center mr-0 md:mr-4 gap-2">
            <div className="rounded-lg text-white flex items-center gap-1 bg-primary p-2 ">
              <Icon icon="qlementine-icons:user-16" width="24" height="24" />{" "}
              <span className="w-20 whitespace-nowrap overflow-hidden text-ellipsis text-xs">
                {userDetails?.employeename}
              </span>
            </div>
            <Icon
              icon="el:off"
              width="20"
              height="20"
              color="red"
              className="cursor-pointer"
              onClick={() => onLogout()}
            />
          </div>
        </div>
      </div>

      <Title level={3} style={{ textAlign: "center", color: "white" }}>
        {t("POS_REPORT.TITLE")}
      </Title>

      <div
        style={{
          width: `${widthSection}%`,
          margin: "0 auto",
          padding: "20px",
          background: "#fff",
          borderRadius: "8px",
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            Type: "",
            CustomerName: "",
            startDate: dayjs(),
            endDate: dayjs(),
            InvoiceNumber: "",
          }}
        >
          <div className="grid grid-cols-12 gap-2">
            {/* Type */}

            <div className="col-span-12 md:col-span-6">
              <Form.Item
                label={<Text style={{ color: "black" }}>Type : </Text>}
                name="Type"
                style={{ marginBottom: "0px" }}
              >
                <Select
                  style={{ width: "100%" }}
                  onChange={handleChange}
                  options={reportOptions}
                />
              </Form.Item>
            </div>

            {/* Customer Name */}

            <div className="col-span-12 md:col-span-6">
              <Form.Item
                label={<Text style={{ color: "black" }}>Customer Name : </Text>}
                name="CustomerName"
                style={{ marginBottom: "0px" }}
                rules={[
                  {
                    pattern: /^[A-Za-z\s]+$/,
                    message: "Only alphabets and spaces are allowed",
                  },
                ]}
              >
                <Input
                  onFocus={() => setActiveField("CustomerName")}
                  disabled={invoiceType === "2905" || invoiceType === 6}
                  onChange={(e) => {
                    const value = e.target.value;
                    const onlyChars = value.replace(/[^A-Za-z\s]/g, ""); // allow letters and spaces
                    form.setFieldsValue({ CustomerName: onlyChars });
                  }}
                />
              </Form.Item>
            </div>

            {/* Start Date */}
            <div className="col-span-12 md:col-span-6">
              <Form.Item
                label={<Text style={{ color: "black" }}>Start Date : </Text>}
                name="startDate"
                style={{ marginBottom: "0px" }}
              >
                <DatePicker format="DD-MMM-YYYY" style={{ width: "100%" }} />
              </Form.Item>
            </div>

            {/* End Date */}
            <div className="col-span-12 md:col-span-6">
              <Form.Item
                label={<Text style={{ color: "black" }}>End Date : </Text>}
                name="endDate"
                style={{ marginBottom: "0px" }}
                dependencies={["startDate"]}
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const start = getFieldValue("startDate");

                      if (!start || !value) return Promise.resolve();

                      if (start.isAfter(value)) {
                        return Promise.reject(
                          new Error("End date must be after start date.")
                        );
                      }

                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <DatePicker format="DD-MMM-YYYY" style={{ width: "100%" }} />
              </Form.Item>
            </div>

            {/* Invoice Number */}

            <div className="col-span-12">
              <Form.Item
                label={
                  <Text style={{ color: "black" }}>Invoice Number : </Text>
                }
                name="InvoiceNumber"
                style={{ marginBottom: "0px" }}
              >
                <Input
                  onFocus={() => setActiveField("InvoiceNumber")}
                  disabled={
                    invoiceType === 2 || invoiceType === 5 || invoiceType === 6
                  }
                />
              </Form.Item>
            </div>

            {/* Submit Button */}
            <div className="col-span-12 md:col-span-6">
              <Form.Item style={{ marginBottom: "5px" }}>
                <Button
                  htmlType="submit"
                  style={{
                    width: "100%",
                    fontWeight: "bold",
                    backgroundColor: "#1b4ea2",
                    color: "white",
                    padding: "20px 0",
                  }}
                >
                  Search {loader ? <Spin /> : ""}
                </Button>
              </Form.Item>
            </div>
            {/* Clear Button */}

            <div className="col-span-12 md:col-span-6">
              <Form.Item style={{ marginBottom: "5px" }}>
                <Button
                  htmlType="reset"
                  style={{
                    width: "100%",
                    fontWeight: "bold",
                    backgroundColor: "#990b0d",
                    color: "white",
                    padding: "20px 0",
                  }}
                >
                  Clear
                </Button>
              </Form.Item>
            </div>
          </div>
        </Form>
      </div>
      {/* Number Pad */}
      <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
        <Row
          gutter={[8, 8]}
          justify="center"
          style={{
            marginTop: 20,
            width: `${widthSection}%`,
            margin: "15px auto",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {[
            ...Array.from({ length: 10 }, (_, i) => i.toString()), // 0-9
            ...Array.from({ length: 26 }, (_, i) =>
              String.fromCharCode(
                caplocvalue === 97 ? qwertyKeyCodes[i] : qwertyKeyCodesLower[i]
              )
            ), // A-Z
            "/",
            ".",
            "Del",
            "CapsLK",
            "Space",
          ].map((key, index) => {
            const isNumber = /^\d$/.test(key); // checks if key is a digit (0-9)
            return (
              <Col key={index}>
                <Button
                  style={{
                    width: 65,
                    padding: "20px 30px",
                    backgroundColor: isNumber
                      ? "#ffb6b6" // dark gray for numbers
                      : key !== "CapsLK"
                      ? "#dee8ee" // blue for regular keys
                      : caplocvalue === 97
                      ? "#1b4ea2" // blue if CapsLK is inactive (based on your logic)
                      : "#ec4d4f", // red if CapsLK is active
                    color: "#000",
                    fontWeight: "bold",
                    border: "none",
                  }}
                  onClick={() => handleNumberClick(key)}
                >
                  {key}
                </Button>
              </Col>
            );
          })}
        </Row>
      </div>
    </div>
  );
}

export default Report;
