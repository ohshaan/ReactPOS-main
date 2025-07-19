import React, { useEffect } from "react";
import { dayEndClosingModel } from "../../plugins/models";
import {
  Button,
  DatePicker,
  Form,
  Input,
  Typography,
  Row,
  Col,
  Tooltip,
  InputNumber,
} from "antd";
import { CloseCircleFilled } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import Swal from "sweetalert2";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { Spin } from "antd";
import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";
import {
  updateCompanyLogo,
  updateUserDetails,
} from "../../redux/slices/userSlice";

import { emptyDishList, resetOrder } from "../../redux/slices/orderSlice";
import { updateCustomerData } from "../../redux/slices/customerSlice";

import moment from "moment";
import { Icon } from "@iconify/react";

import { userModel } from "../../plugins/models";

const { Title, Text } = Typography;

function DayEndClosing() {
  const [form] = Form.useForm();
  const [activeField, setActiveField] = React.useState(null);
  const [widthSection, setWidthsection] = React.useState(null);
  const [logedUser, setLogedUser] = React.useState(null);
  const [loader, setLoader] = React.useState(false);
  const [invoiceLoader, setInvoiceLoader] = React.useState(false);
  const [kotLoader, setKotLoader] = React.useState(false);
  const [showpending, setShowPending] = React.useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  //pdfMake.vfs = pdfFonts.pdfMake.vfs;

  const [loading, setLoading] = React.useState(false);

  const userDetails = JSON.parse(localStorage.getItem("user"));
  const outletDetail = localStorage.getItem("openOutlet");
  const outlet = JSON.parse(outletDetail);
  const date = sessionStorage.getItem("dateTime");

  dayjs.extend(customParseFormat);

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
        sessionStorage.clear();

        dispatch(emptyDishList());
        dispatch(updateCustomerData(null));
        dispatch(updateCompanyLogo(null));
        dispatch(updateUserDetails(null));
        dispatch(resetOrder());

        navigate("/"); // typo: make sure it's spelled `navigate`
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
          title: "Error",
          text: res?.message || "Logout failed",
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    } catch (error) {
      setLoading(false);
      Swal.fire({
        title: "Error",
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

  const getCurrentClosingTime = () => {
    const user = localStorage.getItem("user");
    const outlet = localStorage.getItem("outletDetails");
    const dateTimevalue = sessionStorage.getItem("dateTime");
    let parsedUser = null;
    let parseroutletdetails = null;

    if (user) {
      try {
        parsedUser = JSON.parse(user);
      } catch (error) {
        console.error("Invalid user JSON:", error);
      }
    }

    if (parsedUser && parsedUser.employeename) {
      setLogedUser(parsedUser.employeename);

      // ✅ Update form values directly
      form.setFieldsValue({
        staffName: parsedUser.employeename,
      });

      //console.log("Logged User:", parsedUser.employeename);
    } else {
      console.warn("User or employeename is missing");
    }

    if (outlet) {
      try {
        parseroutletdetails = JSON.parse(outlet);
      } catch (error) {
        console.error("Invalid outlet JSON:", error);
      }
    }

    const dateinfo = {
      outletid: parseroutletdetails.outlet,
      userid: parsedUser.userid,
      intmode: "0",
    };

    dayEndClosingModel
      ?.getdayendclosingtime(dateinfo)
      .then((data) => {
        if (data?.status === "true") {
          //console.log(data?.data[0]);
          form.setFieldsValue({
            startDate: dayjs(data?.data[0]?.fromdate) || null,
            endDate: dayjs(data?.data[0]?.todate) || null,
          });
        }
      })
      .catch((error) => {
        //console.log("Error while fetching All Invoice Reports:=", error);
      });
  };

  useEffect(() => {
    const fetchLoggedUser = () => {
      const user = localStorage.getItem("user");
      const outlet = localStorage.getItem("outletDetails");
      const dateTimevalue = sessionStorage.getItem("dateTime");
      let parsedUser = null;
      let parseroutletdetails = null;

      if (user) {
        try {
          parsedUser = JSON.parse(user);
        } catch (error) {
          console.error("Invalid user JSON:", error);
        }
      }

      if (parsedUser && parsedUser.employeename) {
        setLogedUser(parsedUser.employeename);

        // ✅ Update form values directly
        form.setFieldsValue({
          staffName: parsedUser.employeename,
        });

        //console.log("Logged User:", parsedUser.employeename);
      } else {
        console.warn("User or employeename is missing");
      }

      if (outlet) {
        try {
          parseroutletdetails = JSON.parse(outlet);
        } catch (error) {
          console.error("Invalid outlet JSON:", error);
        }
      }

      const dateinfo = {
        outletid: parseroutletdetails.outlet,
        userid: parsedUser.userid,
        intmode: "0",
      };

      dayEndClosingModel
        ?.getdayendclosingtime(dateinfo)
        .then((data) => {
          if (data?.status === "true") {
            //console.log(data?.data[0]);

            const rawFromDate = data?.data[0]?.fromdate;
            const rawToDate = data?.data[0]?.todate;

            const formattedFromDate = dayjs(rawFromDate);
            const formattedTomDate = dayjs(rawToDate);

            form.setFieldsValue({
              startDate: formattedFromDate || null,
              endDate: formattedTomDate || null,
            });
          } else {
            Swal.fire({
              title: "Please Set Opening And Closing Time",
              icon: "info",
              showCancelButton: false,
              confirmButtonText: "Ok",
              confirmButtonColor: "#ec4d4f",
            }).then((result) => {
              if (result.isConfirmed) {
                // navigate('/dayEndClosing')
              }
            });
          }
        })
        .catch((error) => {
          //console.log("Error while fetching All Invoice Reports:=", error);
        });

      /* if (dateTimevalue) {
                try {
                  
                  form.setFieldsValue({
                    startDate: dateTimevalue ? dayjs(dateTimevalue) : null,
                  });
                } catch (error) {
                  //console.log('Invalid user JSON:', error);
                }
              }*/
    };

    fetchLoggedUser();
  }, [form]); // ✅ Dependency on `form`

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

  // Function to handle PDF generation

  const generateInvoicePDF = (invoiceData) => {
    const tableBody = [
      [
        { text: "Invoice No", style: "tableHeader" },
        { text: "Customer Name", style: "tableHeader" },
        { text: "Invoice Date", style: "tableHeader" },
        { text: "Table Name", style: "tableHeader" },
        { text: "PAX", style: "tableHeader" },
        { text: "Amount", style: "tableHeader" },
        { text: "Status", style: "tableHeader" },
      ],
      ...invoiceData.map((inv) => [
        inv.invoiceno,
        inv.customername || "N/A",
        inv.invoicedate,
        inv.tablename,
        inv.pax.toString(),
        inv.invoiceamount.toFixed(2),
        inv.invoicestatus,
      ]),
    ];

    const docDefinition = {
      content: [
        { text: "Unsettled Invoice Report", style: "header" },
        {
          text: `Generated on: ${new Date().toLocaleString()}`,
          margin: [0, 0, 0, 10],
        },
        {
          table: {
            headerRows: 1,
            widths: ["*", "*", "*", "*", "*", "*", "*"],
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

    pdfMake.createPdf(docDefinition).open(); // Use open() to display in a new tab
  };

  const generateOpenKotPDF = (kotData) => {
    const tableBody = [
      [
        { text: "Company Name", style: "tableHeader" },
        { text: "Outlet Name", style: "tableHeader" },
        { text: "Type", style: "tableHeader" },
        { text: "Reference Number", style: "tableHeader" },
        { text: "Date", style: "tableHeader" },
        { text: "Delivery Date", style: "tableHeader" },
        { text: "Customer Name", style: "tableHeader" },
      ],
      ...kotData.map((inv) => [
        inv.companyname || "N/A",
        inv.outletname,
        inv.ordertype,
        inv.orderreferenceno,
        inv.orderbookdate,
        inv.orderdeliverydate,
        inv.ordercustomername,
      ]),
    ];

    const docDefinition = {
      content: [
        { text: "Open Kot Report", style: "header" },
        {
          text: `Generated on: ${new Date().toLocaleString()}`,
          margin: [0, 0, 0, 10],
        },
        {
          table: {
            headerRows: 1,
            widths: ["*", "*", "*", "*", "*", "*", "*", "*"],
            body: tableBody,
          },
          layout: "lightHorizontalLines",
        },
      ],
      styles: {
        header: {
          fontSize: 14,
          bold: true,
          alignment: "center",
          margin: [0, 0, 0, 10],
        },
        tableHeader: {
          bold: true,
          fontSize: 10,
          color: "black",
        },
      },
      defaultStyle: {
        fontSize: 10,
      },
    };

    pdfMake.createPdf(docDefinition).download("openKotReport.pdf");
  };

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
        { text: "Open KOT", style: "header" },
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

  const generateOpenKOTBriefPDF = (
    data,
    startdate,
    enddate,
    reportDate,
    cmpname,
    outletName = "TW KITCHEN"
  ) => {
    if (!data || !data.length) return;

    const tableBody = [
      [
        { text: "Refer No.", bold: true, fontSize: 6 },
        { text: "Guest", bold: true, fontSize: 6 },
        { text: "In", bold: true, fontSize: 6 },
        { text: "Pax", bold: true, fontSize: 6, alignment: "center" },
        { text: "Type", bold: true, fontSize: 6 },
      ],
      ...data.map((item) => {
        const time = new Date(item.orderbookdate).toLocaleTimeString("en-QA", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
        return [
          { text: item.orderreferenceno, fontSize: 6 },
          { text: item.ordercustomername, fontSize: 6 },
          { text: time, fontSize: 6 },
          {
            text: item.noofpersons.toString(),
            fontSize: 6,
            alignment: "center",
          },
          { text: item.ordertype, fontSize: 6 },
        ];
      }),
    ];

    const totalPax = data.reduce(
      (sum, item) => sum + (item.noofpersons || 0),
      0
    );

    const docDefinition = {
      pageSize: { width: 220, height: "auto" },
      pageMargins: [5, 5, 5, 5],
      content: [
        {
          text: `${cmpname}`,
          bold: true,
          alignment: "center",
          fontSize: 10,
          margin: [0, 5, 0, 2],
        },
        {
          text: "KOT (BRIEF)",
          alignment: "center",
          fontSize: 9,
          bold: true,
          margin: [0, 1, 0, 1],
        },
        {
          text: `Invoice Date Between`,
          alignment: "center",
          fontSize: 8,
          margin: [0, 0, 0, 2],
        },
        {
          text: ` ${startdate} And ${enddate}`,
          alignment: "center",
          fontSize: 8,
          margin: [0, 0, 0, 2],
        },
        {
          text: `Date    :  ${reportDate}`,
          fontSize: 8,
          alignment: "left",
          fontSize: 8,
          margin: [0, 5, 0, 2],
        },
        {
          text: `Outlet  :  ${outletName}`,
          fontSize: 8,
          alignment: "left",
          fontSize: 8,
          margin: [0, 0, 0, 5],
        },

        {
          table: {
            widths: [60, "*", 15, 12, "*"],
            body: tableBody,
          },
          layout: "lightHorizontalLines",
          fontSize: 8,
          margin: [0, 0, 0, 3],
        },
        {
          canvas: [
            {
              type: "line",
              x1: 0,
              y1: 0,
              x2: 210,
              y2: 0,
              lineWidth: 0.5,
            },
          ],
          margin: [0, 5, 0, 5],
        },
        {
          text: `TotalPax :  ${totalPax.toFixed(2)}`,
          alignment: "right",
          fontSize: 9,
          bold: true,
          margin: [0, 2, 35, 10],
        },
      ],
    };

    pdfMake.createPdf(docDefinition).open();
  };

  const allinvoiceReportPDF2 = (rawData) => {
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
          text: `Net Amount: ${first.netamount.toFixed(2)}`,
          fontSize: 8,
          alignment: "right",
          bold: true,
          margin: [0, 2],
        },
        {
          text: `Paid: ${first.paidamount.toFixed(2)}`,
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
          text: `Cash: ${first.cashamount.toFixed(2)}`,
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
            "Unsettled Invoice Report of " +
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

  const unsettledInvoiceChecker = async () => {
    const outlet = localStorage.getItem("outletDetails");
    let parseroutletdetails = null;

    if (outlet) {
      try {
        parseroutletdetails = JSON.parse(outlet);
      } catch (error) {
        console.error("Invalid outlet JSON:", error);
      }
    }

    const finalDataset = {
      outletid: parseroutletdetails?.outlet,
      invoicestatus: 1,
    };

    try {
      const data = await dayEndClosingModel?.unsettledInvoiceListing(
        finalDataset
      );
      return data?.status === "true";
    } catch (error) {
      return true; // Assume true on error, as per your original logic
    }
  };

  // Function to handle invoicelisting

  const handleUnsettledInvoiceListing = () => {
    setInvoiceLoader(true);
    const user = localStorage.getItem("user");
    const outlet = localStorage.getItem("outletDetails");
    let parserdetails = null;
    let parseroutletdetails = null;
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
        console.error("Invalid outlet JSON:", error);
      }
    }
    const finalDataset = {
      outletid: parseroutletdetails.outlet,
      invoicestatus: 1,
    };

    dayEndClosingModel
      ?.unsettledInvoiceListing(finalDataset)
      .then((data) => {
        if (data?.status === "true") {
          //console.log(data?.message);
          setInvoiceLoader(false);
          Swal.fire({
            title: "Unsettled Invoice Lists retrieved",
            text: `successfully!`,
            icon: "success",
            showCancelButton: false,
            confirmButtonText: "Ok",
            confirmButtonColor: "#ec4d4f",
          }).then((result) => {
            if (result.isConfirmed) {
              generateInvoicePDF(data?.data);
            }
          });
        } else {
          if (data?.Error.Error_Code === "404") {
            setInvoiceLoader(false);
            Swal.fire({
              title: "Error",
              text: data?.Error.Error_Msg,
              icon: "error",
              showCancelButton: false,
              confirmButtonText: "Ok",
              confirmButtonColor: "#ec4d4f",
            }).then((result) => {
              if (result.isConfirmed) {
                // navigate('/dayEndClosing')
              }
            });
          } else if (data?.Error.Error_Code === "9999") {
            setInvoiceLoader(false);
            Swal.fire({
              title: "Error",
              text: data?.Error.Error_Msg,
              icon: "error",
              showCancelButton: false,
              confirmButtonText: "Ok",
              confirmButtonColor: "#ec4d4f",
            }).then((result) => {
              if (result.isConfirmed) {
                // navigate('/dayEndClosing')
              }
            });
          } else {
            setInvoiceLoader(false);
            Swal.fire({
              title: "Error",
              text: data?.message,
              icon: "error",
              showCancelButton: false,
              confirmButtonText: "Ok",
              confirmButtonColor: "#ec4d4f",
            }).then((result) => {
              if (result.isConfirmed) {
                // navigate('/dayEndClosing')
              }
            });
          }
        }
      })
      .catch((error) => {
        //console.log("Error while saving Shift Close:=", error);
      });
  };

  const datechecker = () => {
    const startRaw = form.getFieldValue("startDate");
    const endRaw = form.getFieldValue("endDate");

    const startDay = dayjs(startRaw);
    const endDay = dayjs(endRaw);

    if (startDay.isValid() && endDay.isValid()) {
      return true;
    } else {
      return false;
    }
  };

  const unsettledInvoiceList = () => {
    if (datechecker()) {
      setInvoiceLoader(true);

      const user = localStorage.getItem("user");
      const outlet = localStorage.getItem("outletDetails");
      const dateTimevalue = sessionStorage.getItem("dateTime");
      const openOutlet = localStorage.getItem("openOutlet");

      let parserdetails = null;
      let parseroutletdetails = null;
      let parserOpenoutlet = null;

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
          console.error("Invalid outlet JSON:", error);
        }
      }

      // All Invoice Reports Request Body / Payload

      const AllInvoiceReportspayload = {
        outletid: parseroutletdetails.outlet,
        fromdate: dayjs(form.getFieldValue("startDate")).format(
          "DD-MMM-YYYY HH:mm"
        ),
        todate: dayjs(form.getFieldValue("endDate")).format(
          "DD-MMM-YYYY HH:mm"
        ),
        customername: "",
        invoiceno: "",
        invoicestatus: 0,
      };

      dayEndClosingModel
        ?.allInvoiceReports({ ...AllInvoiceReportspayload, invoicestatus: 1 })
        .then((data) => {
          if (data?.status === "true") {
            //console.log(data?.message);
            setInvoiceLoader(false);
            Swal.fire({
              title: "Unsettled invoice retrieved successfully",
              icon: "success",
              showCancelButton: false,
              confirmButtonText: "Ok",
              confirmButtonColor: "#ec4d4f",
            }).then((result) => {
              if (result.isConfirmed) {
                // generateOpenKotPDF(data?.data)
                //generateKOTReportPDF(data?.data)
                allinvoiceReportPDF2(data?.data);
              }
            });
          } else {
            setInvoiceLoader(false);
            const errorCode = data?.Error?.Error_Code;
            const errorMsg = data?.Error?.Error_Msg || "Unknown error occurred";
            //console.log("errorCode" + errorMsg);
            Swal.fire({
              title: errorCode === "404" ? "info" : "Error",
              text: errorMsg,
              icon: errorCode === "404" ? "info" : "error",
              showCancelButton: false,
              confirmButtonText: "Ok",
              confirmButtonColor: "#ec4d4f",
            });
          }
        })
        .catch((error) => {
          //console.log("Error while fetching All Invoice Reports:=", error);
        });
    } else {
      Swal.fire({
        title: "Please check the date fields",
        icon: "info",
        showCancelButton: false,
        confirmButtonText: "Ok",
        confirmButtonColor: "#ec4d4f",
      });
    }
  };

  // Function to handle unsettled kot listing
  const handleUnsettledKotListing = () => {
    if (datechecker()) {
      setKotLoader(true);
      const user = localStorage.getItem("user");
      const outlet = localStorage.getItem("outletDetails");
      const dateTimevalue = sessionStorage.getItem("dateTime");
      const openOutlet = localStorage.getItem("openOutlet");

      let parserdetails = null;
      let parseroutletdetails = null;
      let parserOpenoutlet = null;

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
          console.error("Invalid outlet JSON:", error);
        }
      }

      if (openOutlet) {
        try {
          parserOpenoutlet = JSON.parse(openOutlet);
        } catch (error) {
          console.error("Invalid openOutlet JSON:", error);
        }
      }

      const startDate = form.getFieldValue("startDate");
      const endDate = form.getFieldValue("endDate");

      const finalDataset = {
        outletid: parseroutletdetails.outlet,
        fromdate: startDate?.format("DD-MMM-YYYY HH:mm"),
        todate: endDate?.format("DD-MMM-YYYY HH:mm"),
      };

      dayEndClosingModel
        ?.OpenKotInvoiceReports(finalDataset)
        .then((data) => {
          if (data?.status === "true") {
            //console.log(data?.message);
            setKotLoader(false);
            Swal.fire({
              title: data?.message,
              icon: "success",
              showCancelButton: false,
              confirmButtonText: "Ok",
              confirmButtonColor: "#ec4d4f",
            }).then((result) => {
              if (result.isConfirmed) {
                // generateOpenKotPDF(data?.data)
                //generateKOTReportPDF(data?.data)
                generateOpenKOTBriefPDF(
                  data?.data,
                  startDate?.format("DD-MMM-YYYY HH:mm"),
                  endDate?.format("DD-MMM-YYYY HH:mm"),
                  dayjs().format("DD-MMM-YYYY"),
                  data?.data[0]["companyname"],
                  parserOpenoutlet.Shm_Name_V
                );
              }
            });
          } else {
            if (data?.Error.Error_Code === "404") {
              setKotLoader(false);
              Swal.fire({
                title: "Info",
                text: data?.Error.Error_Msg,
                icon: "info",
                showCancelButton: false,
                confirmButtonText: "Ok",
                confirmButtonColor: "#ec4d4f",
              }).then((result) => {
                if (result.isConfirmed) {
                  // navigate('/dayEndClosing')
                }
              });
            } else if (data?.Error.Error_Code === "9999") {
              setKotLoader(false);
              Swal.fire({
                title: "Error",
                text: data?.Error.Error_Msg,
                icon: "error",
                showCancelButton: false,
                confirmButtonText: "Ok",
                confirmButtonColor: "#ec4d4f",
              }).then((result) => {
                if (result.isConfirmed) {
                  // navigate('/dayEndClosing')
                }
              });
            }
          }
        })
        .catch((error) => {
          //console.log("Error while saving Shift Close:=", error);
        });
    } else {
      Swal.fire({
        title: "Please check the date fields",
        icon: "info",
        showCancelButton: false,
        confirmButtonText: "Ok",
        confirmButtonColor: "#ec4d4f",
      });
    }
  };

  // Function to handle form submission

  const onFinish = async (values) => {
    const user = localStorage.getItem("user");
    const outlet = localStorage.getItem("outletDetails");

    let parserdetails = null;
    let parseroutletdetails = null;

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

    const finalDataset = {
      dayendclosingdate: dayjs(values.endDate).format("DD-MMM-YYYY HH:mm"),
      dayendclosingfromdate: dayjs(values.startDate).format(
        "DD-MMM-YYYY HH:mm"
      ),
      dayendclosingtodate: dayjs(values.endDate).format("DD-MMM-YYYY HH:mm"),
      userid: parserdetails.userid,
      outletid: parseroutletdetails.outlet,
      dayendcashamount: values.cash,
      dayendcreditcardamount: values.creditCard,
      dayendcityledgeramount: values.cityLedger,
    };

    /*const finalDataset = {
      dayendclosingdate: dayjs(latestEndDate).format("DD-MMM-YYYY HH:mm:ss"),
      dayendclosingfromdate: dayjs(values.startDate).format(
        "DD-MMM-YYYY HH:mm:ss"
      ),
      dayendclosingtodate: dayjs(latestEndDate).format("DD-MMM-YYYY HH:mm:ss"),
      userid: parserdetails?.userid,
      outletid: parseroutletdetails?.outlet,
      dayendcashamount: values.cash,
      dayendcreditcardamount: values.creditCard,
      dayendcityledgeramount: values.cityLedger,
    };*/

    //console.log("finalDataset:", finalDataset);
    setLoader(true);

    if (
      finalDataset.dayendcashamount == null ||
      finalDataset.dayendcreditcardamount == null ||
      finalDataset.dayendcityledgeramount == null
    ) {
      setLoader(false);
      Swal.fire({
        title: "Day end closing cannot be done",
        text: `Cash Amount, Credit Card Amount, and City Ledger Amount are required. Please enter valid values.`,
        icon: "error",
        showCancelButton: false,
        confirmButtonText: "Ok",
        confirmButtonColor: "#ec4d4f",
      }).then((result) => {
        if (result.isConfirmed) {
          // navigate('/dayEndClosing')
        }
      });
    } else if (
      finalDataset.dayendclosingfromdate == null ||
      finalDataset.dayendclosingtodate == null
    ) {
      Swal.fire({
        title: "Day end closing cannot be done.",
        text: `Start Date and End Date required.`,
        icon: "error",
        showCancelButton: false,
        confirmButtonText: "Ok",
        confirmButtonColor: "#ec4d4f",
      }).then((result) => {
        if (result.isConfirmed) {
          // navigate('/dayEndClosing')
        }
      });
    } else {
      Swal.fire({
        title: "Day end closing in progress",
        text: `Please review all details before proceeding.`,
        icon: "info",
        showCancelButton: true,
        confirmButtonText: "Ok",
        confirmButtonColor: "#ec4d4f",
      }).then((result) => {
        if (result.isConfirmed) {
          dayEndClosingModel
            ?.dayEndClosing(finalDataset)
            .then((data) => {
              if (data?.status === "true") {
                //console.log(data?.message);
                setLoader(false);
                /* localStorage.removeItem("user");
                localStorage.clear();
                sessionStorage.clear();
                dispatch(emptyDishList());
                dispatch(updateCustomerData(null));
                dispatch(updateCompanyLogo(null));
                dispatch(updateUserDetails(null));
                dispatch(resetOrder());*/
                navigate("/kot"); // typo: make sure it's spelled `navigate`
              } else {
                setLoader(false);
                Swal.fire({
                  title: "Day end closing cannot be done.",
                  text: data?.message,
                  icon: "error",
                  showCancelButton: false,
                  confirmButtonText: "Ok",
                  confirmButtonColor: "#ec4d4f",
                }).then((result) => {
                  if (result.isConfirmed) {
                    // navigate('/dayEndClosing')
                  }
                });
              }
            })
            .catch((error) => {
              //console.log("Error while saving Shift Close:=", error);
            });
        } else {
          setLoader(false);
        }
      });
    }
  };

  const handleNumberClick = (key) => {
    if (!activeField) return; // no input selected

    const currentValue = form.getFieldValue(activeField)?.toString() || "";

    if (key === "Del") {
      form.setFieldsValue({
        [activeField]: currentValue.slice(0, -1),
      });
    } else {
      form.setFieldsValue({
        [activeField]: currentValue + key,
      });
    }
  };

  return (
    <div
      style={{
        background: "#082944",
        padding: 24,
        color: "white",
        height: "100vh",
      }}
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
        Day End Closing
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
            startDate: null,
            endDate: null,
            staffName: "",
            cash: null,
            creditCard: null,
            cityLedger: null,
          }}
        >
          <div className="grid grid-cols-12 gap-2">
            {/* Start Date */}
            <div className="col-span-12 md:col-span-6">
              <Form.Item
                label={<Text style={{ color: "black" }}>Start Date : </Text>}
                name="startDate"
                style={{ marginBottom: "0px" }}
                rules={[
                  {
                    validator: (_, value) => {
                      const endDate = form.getFieldValue("endDate");
                      if (!value || !endDate) return Promise.resolve();

                      if (value.isAfter(endDate)) {
                        return Promise.reject(
                          new Error(
                            "Start date & time should be lesser than end date & time."
                          )
                        );
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <DatePicker
                  showTime
                  format="DD-MMM-YYYY HH:mm"
                  style={{ width: "100%" }}
                  placeholder="Select Start Date & Time"
                />
              </Form.Item>
            </div>

            {/* End Date */}
            <div className="col-span-12 md:col-span-6">
              <Form.Item
                label={<Text style={{ color: "black" }}>End Date : </Text>}
                name="endDate"
                style={{ marginBottom: "0px" }}
              >
                <DatePicker
                  showTime
                  format="DD-MMM-YYYY HH:mm"
                  style={{ width: "100%" }}
                  placeholder="Select End Date & Time"
                  disabled // read-only
                />
              </Form.Item>
            </div>

            {/* Staff Name */}
            <div className="col-span-12 md:col-span-12">
              <Form.Item
                label={<Text style={{ color: "black" }}>Staff Name : </Text>}
                name="staffName"
                style={{ marginBottom: "0px" }}
              >
                <Input disabled />
              </Form.Item>
            </div>

            {/* Cash */}
            <div className="col-span-12 md:col-span-4">
              <Form.Item
                label={<Text style={{ color: "black" }}>Cash Amount : </Text>}
                name="cash"
                style={{ marginBottom: "0px", textAlign: "right" }}
              >
                <InputNumber
                  style={{ width: "100%", textAlign: "right" }}
                  controls={false}
                  min={0}
                  max={99999999}
                  maxLength={10} // Limit to 10 characters
                  step={0.01} // allows decimal steps
                  precision={2} // ensures 2 decimal places in internal value
                  formatter={(value) => {
                    if (value === "" || value === undefined) return "";
                    const number = parseFloat(value);
                    if (isNaN(number)) return "";
                    return number
                      .toFixed(2)
                      .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                  }}
                  parser={(value) => {
                    // Remove all characters except digits and decimal
                    return value
                      .replace(/[^0-9.]/g, "")
                      .replace(/(\..*?)\..*/g, "$1"); // Only allow one dot
                  }}
                  onFocus={() => setActiveField("cash")}
                  onKeyPress={(e) => {
                    // Allow only digits and one dot (.)
                    const isAllowed = /[0-9.]$/.test(e.key);
                    if (!isAllowed) e.preventDefault();
                  }}
                  onPaste={(e) => {
                    const paste = e.clipboardData.getData("Text");
                    if (!/^\d*\.?\d{0,2}$/.test(paste)) {
                      e.preventDefault();
                    }
                  }}
                />
              </Form.Item>
            </div>

            {/* Credit Card */}
            <div className="col-span-12 md:col-span-4">
              <Form.Item
                label={
                  <Text style={{ color: "black" }}>Credit Card Amount : </Text>
                }
                name="creditCard"
                style={{ marginBottom: "0px", textAlign: "right" }}
              >
                <InputNumber
                  style={{ width: "100%", textAlign: "right" }}
                  controls={false}
                  min={0}
                  max={99999999}
                  maxLength={10} // Limit to 10 characters
                  step={0.01} // allows decimal steps
                  precision={2} // ensures 2 decimal places in internal value
                  formatter={(value) => {
                    if (value === "" || value === undefined) return "";
                    const number = parseFloat(value);
                    if (isNaN(number)) return "";
                    return number
                      .toFixed(2)
                      .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                  }}
                  parser={(value) => {
                    // Remove all characters except digits and decimal
                    return value
                      .replace(/[^0-9.]/g, "")
                      .replace(/(\..*?)\..*/g, "$1"); // Only allow one dot
                  }}
                  onFocus={() => setActiveField("creditCard")}
                  onKeyPress={(e) => {
                    // Allow only digits and one dot (.)
                    const isAllowed = /[0-9.]$/.test(e.key);
                    if (!isAllowed) e.preventDefault();
                  }}
                  onPaste={(e) => {
                    const paste = e.clipboardData.getData("Text");
                    if (!/^\d*\.?\d{0,2}$/.test(paste)) {
                      e.preventDefault();
                    }
                  }}
                />
              </Form.Item>
            </div>

            {/* City Ledger */}
            <div className="col-span-12 md:col-span-4">
              <Form.Item
                label={<Text style={{ color: "black" }}>City Ledger : </Text>}
                name="cityLedger"
                style={{ marginBottom: "0px", textAlign: "right" }}
              >
                <InputNumber
                  style={{ width: "100%", textAlign: "right" }}
                  controls={false}
                  min={0}
                  max={99999999}
                  maxLength={10} // Limit to 10 characters
                  step={0.01} // allows decimal steps
                  precision={2} // ensures 2 decimal places in internal value
                  formatter={(value) => {
                    if (value === "" || value === undefined) return "";
                    const number = parseFloat(value);
                    if (isNaN(number)) return "";
                    return number
                      .toFixed(2)
                      .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                  }}
                  parser={(value) => {
                    // Remove all characters except digits and decimal
                    return value
                      .replace(/[^0-9.]/g, "")
                      .replace(/(\..*?)\..*/g, "$1"); // Only allow one dot
                  }}
                  onFocus={() => setActiveField("cityLedger")}
                  onKeyPress={(e) => {
                    // Allow only digits and one dot (.)
                    const isAllowed = /[0-9.]$/.test(e.key);
                    if (!isAllowed) e.preventDefault();
                  }}
                  onPaste={(e) => {
                    const paste = e.clipboardData.getData("Text");
                    if (!/^\d*\.?\d{0,2}$/.test(paste)) {
                      e.preventDefault();
                    }
                  }}
                />
              </Form.Item>
            </div>

            {/* Submit Button */}
            <div className="col-span-12" style={{ marginTop: "10px" }}>
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
                  Submit {loader ? <Spin /> : ""}
                </Button>
              </Form.Item>
            </div>
          </div>
        </Form>

        {!showpending && (
          <div className="grid grid-cols-12 gap-4 mt-4">
            <div className="col-span-6">
              <button
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 rounded"
                onClick={() => {
                  handleUnsettledKotListing();
                }}
              >
                {kotLoader ? <Spin /> : "OPEN KOT"}
              </button>
            </div>
            <div className="col-span-6">
              <button
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded"
                onClick={() => {
                  unsettledInvoiceList();
                }}
              >
                {invoiceLoader ? <Spin /> : "UNSETTLED INVOICE"}
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Number Pad */}
      <Row gutter={[8, 8]} style={{ marginTop: 20 }} justify="center">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0, ".", "Del"].map((key, index) => (
          <Col key={index}>
            <Button
              style={{ width: 48, height: 48 }}
              onClick={() => handleNumberClick(key)}
            >
              {key}
            </Button>
          </Col>
        ))}
      </Row>
    </div>
  );
}

export default DayEndClosing;
