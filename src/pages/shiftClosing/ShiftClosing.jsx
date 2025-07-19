import React, { useEffect } from "react";
import {
  shiftClosingModal,
  dayEndClosingModel,
  userModel,
} from "../../plugins/models";
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
import { Spin } from "antd";
import "./ShiftClosing.css"; // Assuming you have a CSS file for styles
import {
  updateCompanyLogo,
  updateUserDetails,
} from "../../redux/slices/userSlice";

import { emptyDishList, resetOrder } from "../../redux/slices/orderSlice";
import { updateCustomerData } from "../../redux/slices/customerSlice";

import moment from "moment";
import { Icon } from "@iconify/react";

import { useTranslation } from "react-i18next";

const { Title, Text } = Typography;

function ShiftClosing() {
  const [activeField, setActiveField] = React.useState(null);
  const [widthSection, setWidthsection] = React.useState(null);
  const [logedUser, setLogedUser] = React.useState(null);
  const [loader, setLoader] = React.useState(false);
  const [formattedCash, setFormattedCash] = React.useState("");

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

  useEffect(() => {
    const fetchLoggedUser = () => {
      const user = localStorage.getItem("user");
      const outlet = localStorage.getItem("outletDetails");
      const dateTimevalue = localStorage.getItem("dateTime");
      // const shfitStartTime=localStorage.getItem('shiftlogintime');
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
        intmode: "1",
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

      /*if (dateTimevalue) {
        try {
          form.setFieldsValue({
            startDate: dateTimevalue ? dayjs(dateTimevalue) : null,
          });
        } catch (error) {
          //console.log("Invalid Shift Start Time:", error);
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

    // Step 1: Fetch the latest end date
    let latestEndDate = values.endDate;

    try {
      const data = await userModel.getCurrentDate({});

      if (data?.status === "true") {
        latestEndDate = data?.data?.currentdate;
      } else {
        throw new Error(data?.message || "Invalid response");
      }
    } catch (error) {
      console.error(error);
    }

    /*const dateinfo = {
      outletid: parseroutletdetails.outlet,
      userid: parserdetails.userid,
      intmode: "0",
    };

    try {
      dayEndClosingModel?.getdayendclosingtime(dateinfo).then((data) => {
        if (
          data?.status === "true" &&
          data?.data[0]?.fromdate !== "" &&
          data?.data[0]?.todate !== ""
        ) {
          latestEndDate = dayjs(data?.data[0]?.todate);
          //console.log("latestEndDate:=" + latestEndDate);
        } else {
          Swal.fire({
            title: "Lastdate Not Avaliable",
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
      });
    } catch (error) {
      console.error("Error fetching end date:", error);
    }

   const finalDataset = {
      closingdate: dayjs(values.endDate).format("DD-MMM-YYYY HH:mm"),
      closingfromdate: dayjs(values.startDate).format("DD-MMM-YYYY HH:mm"),
      closingtodate: dayjs().format("DD-MMM-YYYY HH:mm"),
      userid: parserdetails.userid,
      outletid: parseroutletdetails.outlet,
      cashamount: parseFloat(values.cash),
      creditcardamount: parseFloat(values.creditCard),
      cityledgeramount: parseFloat(values.cityLedger),
    };*/

    const finalDataset = {
      closingdate: dayjs(latestEndDate).format("DD-MMM-YYYY HH:mm"),
      closingfromdate: dayjs(values.startDate).format("DD-MMM-YYYY HH:mm"),
      closingtodate: dayjs(latestEndDate).format("DD-MMM-YYYY HH:mm"),
      userid: parserdetails.userid,
      outletid: parseroutletdetails.outlet,
      cashamount: parseFloat(values.cash),
      creditcardamount: parseFloat(values.creditCard),
      cityledgeramount: parseFloat(values.cityLedger),
    };

    //console.log("finalDataset:", finalDataset);
    setLoader(true);

    const isInvalid = (value) => {
      return (
        value === null || value === "" || value === undefined || isNaN(value)
      );
    };

    if (
      isInvalid(finalDataset.cashamount) ||
      isInvalid(finalDataset.creditcardamount) ||
      isInvalid(finalDataset.cityledgeramount)
    ) {
      setLoader(false);
      Swal.fire({
        title: t("SHIFT_CLOSING.CANNOT_CLOSE_TITLE"),
        text: t("SHIFT_CLOSING.CANNOT_CLOSE_TEXT"),
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
        title: "You are about to close the shift. Continue?",
        icon: "success",
        showCancelButton: true,
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Ok",
        confirmButtonColor: "#ec4d4f",
      }).then((result) => {
        if (result.isConfirmed) {
          shiftClosingModal
            ?.shiftClosing(finalDataset)
            .then((data) => {
              if (data?.status === "true") {
                //console.log(data?.message);
                setLoader(false);
                // Logout logic
                localStorage.removeItem("user");
                localStorage.removeItem("shiftlogintime");
                localStorage.clear();
                localStorage.clear();

                dispatch(emptyDishList());
                dispatch(updateCustomerData(null));
                dispatch(updateCompanyLogo(null));
                dispatch(updateUserDetails(null));
                dispatch(resetOrder());

                navigate("/");
              } else {
                setLoader(false);
                Swal.fire({
                  title: t("SHIFT_CLOSING.CANNOT_CLOSE_TITLE"),
                  text: data?.message,
                  icon: "error",
                  showCancelButton: false,
                  confirmButtonText: "Ok",
                  confirmButtonColor: "#ec4d4f",
                });
              }
            })
            .catch((error) => {
              //console.log("Error while saving Shift Close:=", error);
              setLoader(false);
              Swal.fire({
                title: "Error",
                text:
                  error?.message ||
                  "An error occurred while closing the shift.",
                icon: "error",
                showCancelButton: false,
                confirmButtonText: "Ok",
                confirmButtonColor: "#ec4d4f",
              }).then((result) => {
                if (result.isConfirmed) {
                  // navigate('/dayEndClosing')
                }
              });
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

  const formatCurrency = (value) => {
    const raw = value.replace(/,/g, "").replace(/[^\d]/g, "");
    return raw.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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
        {t("SHIFT_CLOSING.TITLE")}
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
            startDate: dayjs(),
            endDate: dayjs(),
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
                label={
                  <Text style={{ color: "black" }}>
                    {t("SHIFT_CLOSING.START_DATE")}
                  </Text>
                }
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
                            "Starting date & time should be lesser than closing date & time."
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
                  placeholder={t("SHIFT_CLOSING.START_DATE")}
                />
              </Form.Item>
            </div>

            {/* End Date */}
            <div className="col-span-12 md:col-span-6">
              <Form.Item
                label={
                  <Text style={{ color: "black" }}>
                    {t("SHIFT_CLOSING.END_DATE")}
                  </Text>
                }
                name="endDate"
                style={{ marginBottom: "0px" }}
              >
                <DatePicker
                  showTime
                  format="DD-MMM-YYYY HH:mm"
                  style={{ width: "100%" }}
                  disabled // read-only
                  placeholder={t("SHIFT_CLOSING.END_DATE")}
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
                label={<Text style={{ color: "black" }}>{t("SHIFT_CLOSING.CASH_AMOUNT")}</Text>}
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
                  <Text style={{ color: "black" }}>{t("SHIFT_CLOSING.CREDIT_CARD_AMOUNT")}</Text>
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
                label={<Text style={{ color: "black" }}>{t("SHIFT_CLOSING.CITY_LEDGER_AMOUNT")}</Text>}
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
            <div className="col-span-12">
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

export default ShiftClosing;
