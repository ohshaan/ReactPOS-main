import { Icon } from "@iconify/react";
import React, { use, useEffect, useRef, useState } from "react";
import { companyLogo } from "../../assets/images";
import { getStoredCompanyLogo } from "../../utils/helpers";
import { useNavigate } from "react-router-dom";
import { SlideArrow } from "../../components";
import { tableModel } from "../../plugins/models";
import Swal from "sweetalert2";
import { Spin, Typography } from "antd";
import { Col, Row, Card, Space, Button } from "antd";
import {
  ProfileOutlined,
  AlignLeftOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  RollbackOutlined,
  AlignRightOutlined,
} from "@ant-design/icons";
import { orderModel } from "../../plugins/models";
import { toast } from "react-toastify";
import isEqual from "lodash/isEqual";
import { set } from "lodash";
import { Tag, Modal, Input } from "antd";
import Keyboard from "react-simple-keyboard";
import "react-simple-keyboard/build/css/index.css";
import moment from "moment";
import { useDispatch, useSelector } from "react-redux";
import { updateTransferStatus } from "../../redux/slices/tblTransferSlice";
import NumberInputModal from "../../components/PinINoutModal";
import { useTranslation } from "react-i18next";
import {
  customerOrderMod,
  emptyDishList,
  kotAdvance,
  kotEdit,
  kotPax,
  kotPreviousId,
  resetOrder,
  updateOrderType,
} from "../../redux/slices/orderSlice";
import { updateCustomerData } from "../../redux/slices/customerSlice";

function Tabletransferdemo() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const totalItem = window.screen.width <= 540 ? 30 : 49;
  const [tablePage, setTablePage] = useState(0);
  const [tableData, setTableData] = useState([]);
  const [tableLoc, setTableLoc] = useState([]);
  const [fromTableDataLeft, setFromTableDataLeft] = useState([]);
  const [tableToggler, setTableToggler] = useState(false);
  const [selectedFromtableDetails, setselectedFromtableDetails] = useState({});
  const [selectedTotableDetails, setselectedTotableDetails] = useState({});
  const [highlightedFromTables, setHighlightedFromTables] = useState([]);
  const [highlightedToTables, setHighlightedToTables] = useState([]);
  const [sereenToggler, setSereenToggler] = useState(true);
  const [kotDetil, setKotDetil] = useState([]);
  const [kotItemDetils, setKotItemDetils] = useState([]);
  const [loading, isLoading] = useState(false);
  const [tableloading, istableLoading] = useState(false);
  const [size, setSize] = useState("large"); // default is 'middle'
  const [selectedItemList, setSelectedItemList] = useState([]);
  const [selectedItemListright, setselectedItemListright] = useState([]);
  const [newTableItems, setNewTableItems] = useState([]);
  const [initialTotabledata, setInitialTotableData] = useState([]);
  const [prevKotItemDetils, setprevKotItemDetils] = useState([]);
  const [prevNewTableItemsDetail, setprevNewTableItemsDetail] = useState([]);
  const [modalVisible, setmodalVisible] = useState(false);
  const [text, setText] = useState("");
  const [layoutName, setLayoutName] = useState("default");
  // Fetch outlet details from local storage
  const outletDetails = JSON.parse(localStorage.getItem("outletDetails"));

  const totalPages = Math.ceil(tableData.length / totalItem);

  const totalPagesfromtable = Math.ceil(fromTableDataLeft.length / totalItem);

  const tableSelectRef = useRef();

  const userDetails = JSON.parse(localStorage.getItem("user"));
  const outletDetail = localStorage.getItem("openOutlet");
  const outlet = JSON.parse(outletDetail);
  const date = localStorage.getItem("dateTime");
  const getCompanyLogo = getStoredCompanyLogo();

  const [authenticate, isAuthenticate] = useState(false);

  const modalRef = useRef(null);

  const handleHomepage = () => {
    navigate("/kot");
  };

  useEffect(() => {
    getTableLoaction();
  }, []);

  useEffect(() => {
    if (authenticate) {
      Swal.fire({
        title: t("COMMON.AUTHENTICATING"),
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });
    } else {
      Swal.close(); // 🔴 Close the alert when authenticate is false
    }
  }, [authenticate]);

  const handleKeyPress = (button) => {
    if (button === "{bksp}") {
      setText((prev) => prev.slice(0, -1));
    } else if (button === "{space}") {
      setText((prev) => prev + " ");
    } else if (button === "{shift}" || button === "{lock}") {
      setLayoutName((prev) => (prev === "default" ? "shift" : "default"));
    } else {
      setText((prev) => prev + button);
    }
  };

  // Get the tables for the current page
  const displayedTables = tableData.slice(
    tablePage * totalItem,
    (tablePage + 1) * totalItem
  );

  // Get the from tables for the current page
  // This is used to display the tables on the left side of the screen
  const displayedFromTables = fromTableDataLeft.slice(
    tablePage * totalItem,
    (tablePage + 1) * totalItem
  );

  // Function to get table locations
  // This function fetches the table locations from the server and updates the tableLoc state

  const getTableLoaction = () => {
    isLoading(true);
    tableModel
      .getTableLocation({ outletid: outletDetails?.outlet })
      .then((data) => {
        if (data?.status === "true") {
          data?.data.sort((a, b) => {
            return a.tablelocation.localeCompare(b.tablelocation);
          });

          setTableLoc(data?.data);
        } else Swal.fire({ icon: "info", title: data?.Error?.Error_Msg });
        isLoading(false);
      })
      .catch((error) => {
        console.log("Error while getting table location", error);
        isLoading(false);
      });
  };

  // Function to get tables by location

  const getTableByLoc = (item) => {
    isLoading(true);

    tableModel
      ?.getTableByLocation({
        outletid: outletDetails?.outlet,
        tablelocationid: item?.tablelocationid,
      })
      .then((data) => {
        if (data?.status === "true") {
          //tableToggler?setTableData(data?.data):setFromTableDataLeft(data?.data);
          //dispatch(updateTable({ tableLoc: item }));
          setTableData(data?.data);
        } else Swal.fire({ icon: "info", title: data?.Error?.Error_Msg });
        isLoading(false);
      })
      .catch((error) => {
        console.log("Error while getting table", error);
        isLoading(false);
      });
  };

  // Effect to get tables by location when the component mounts

  useEffect(() => {
    if (tableLoc.length !== 0) {
      getTableByLocinitial(tableLoc[0]);
      console.log(tableLoc);
    }
  }, [tableLoc]);

  // Function to get tables by location when the component mounts
  // This function fetches the tables for the first location in tableLoc

  const getTableByLocinitial = (item) => {
    isLoading(true);

    tableModel
      ?.getTableByLocation({
        outletid: outletDetails?.outlet,
        tablelocationid: item?.tablelocationid,
      })
      .then((data) => {
        if (data?.status === "true") {
          setTableData(data?.data);
          setFromTableDataLeft(data?.data);
          //dispatch(updateTable({ tableLoc: item }));
        } else Swal.fire({ icon: "info", title: data?.Error?.Error_Msg });
        isLoading(false);
      })
      .catch((error) => {
        console.log("Error while getting table", error);
        isLoading(false);
      });
  };

  // Effect to get KOT details when the selected table changes

  function reorderByOriginalIndexReference(data) {
    const subItemsMap = {};
    const result = [];
    const usedSubItems = new Set();

    // Group sub-items by their original index reference
    data.forEach((item, index) => {
      const ref = item.orderdtlreferenceno;
      if (ref !== "" && !isNaN(ref)) {
        const refIndex = parseInt(ref);
        if (!subItemsMap[refIndex]) subItemsMap[refIndex] = [];
        subItemsMap[refIndex].push(item);
        usedSubItems.add(index); // Mark this as a sub-item (by index)
      }
    });

    // Loop through the original array
    data.forEach((item, index) => {
      // Skip sub-items
      if (usedSubItems.has(index)) return;

      // Push main item
      result.push(item);

      // Push any sub-items tied to this index
      if (subItemsMap[index]) {
        result.push(...subItemsMap[index]);
      }
    });

    return result;
  }

  useEffect(() => {
    console.log(
      "KOT Rearranged LIST",
      reorderByOriginalIndexReference(kotDetil?.data || [])
    );
    setKotItemDetils(reorderByOriginalIndexReference(kotDetil?.data || []));
  }, [kotDetil]);

  useEffect(() => {
    console.log("To Table Item", newTableItems);
  }, [newTableItems]);

  useEffect(() => {
    console.log(selectedFromtableDetails);
  }, [selectedFromtableDetails]);

  useEffect(() => {
    console.log("Selected Items From Right", selectedItemListright);
  }, [selectedItemListright]);

  // Function to get KOT details based on the selected table
  // This function fetches the KOT details for the selected table and updates the kotDetil state

  const getKotDetails = (type) => {
    isLoading(true);
    orderModel
      ?.getKotDetails({ orderhdrid: selectedFromtableDetails?.orderhdrid })
      .then((data) => {
        if (data?.status === "true") {
          setKotDetil(data?.data[0]);
          toast.success(data?.message || "Details loaded successfully");
          isLoading(false);
        } else {
          setKotDetil(null);
          toast.error(data?.Error?.Error_Msg);
          isLoading(false);
        }
      })
      .catch((error) => {
        console.log("error when loading order detail", error);
      })
      .finally(() => console.log("all done loading order details"));

    orderModel
      ?.getKotDetails({ orderhdrid: selectedTotableDetails?.orderhdrid })
      .then((data) => {
        if (data?.status === "true") {
          setNewTableItems(reorderByOriginalIndexReference(data?.data[0].data));
          setInitialTotableData(data?.data[0].data);
          //toast.success(data?.message || "Details loaded successfully");
          isLoading(false);
        } else {
          setNewTableItems([]);
          setInitialTotableData([]);
          //toast.error(data?.Error?.Error_Msg);
          // dispatch(emptyDishList());
          isLoading(false);
        }
      })
      .catch((error) => {
        console.log("error when loading order detail", error);
        isLoading(false);
      })
      .finally(() => console.log("all done loading order details"));
  };

  // Function to handle item selection from the left side
  // This function toggles the selection of items in the kotItemDetils array

  const selectedItemsFromleft = (itemnumber) => {
    const result = [];
    const startIndex = kotItemDetils.findIndex(
      (item) => item.orderdtlid === itemnumber
    );

    if (startIndex === -1) return;

    const startItem = kotItemDetils[startIndex];

    if (startItem.orderdtlreferenceno === "") {
      result.push(startItem.orderdtlid);

      for (let i = startIndex + 1; i < kotItemDetils.length; i++) {
        const item = kotItemDetils[i];
        if (item.orderdtlreferenceno == "") {
          break;
        }
        result.push(item.orderdtlid);
      }
    }

    // Toggle selected item list in one go
    setSelectedItemList((prevItems) => {
      const updated = [...prevItems];

      result.forEach((id) => {
        const index = updated.indexOf(id);
        if (index > -1) {
          updated.splice(index, 1); // remove if exists
        } else {
          updated.push(id); // add if not exists
        }
      });

      return updated;
    });
  };

  const selectedItemsFromright = (itemnumber) => {
    const result = [];

    const startIndex = newTableItems.findIndex(
      (item) => item.orderdtlid === itemnumber
    );

    if (startIndex === -1) return;

    const startItem = newTableItems[startIndex];

    if (startItem.orderdtlreferenceno === "") {
      result.push(startItem.orderdtlid);

      for (let i = startIndex + 1; i < newTableItems.length; i++) {
        const item = newTableItems[i];
        if (item.orderdtlreferenceno == "") {
          break;
        }
        result.push(item.orderdtlid);
      }
    }

    // Toggle selected item list in one go
    setselectedItemListright((prevItems) => {
      const updated = [...prevItems];

      result.forEach((id) => {
        const index = updated.indexOf(id);
        if (index > -1) {
          updated.splice(index, 1); // remove if exists
        } else {
          updated.push(id); // add if not exists
        }
      });

      return updated;
    });
  };

  // Function to transfer selected items from KOT to the New table

  const transferItems = () => {
    const selectedArrayitems = kotItemDetils?.filter((item) =>
      selectedItemList.includes(item.orderdtlid)
    );

    if (selectedArrayitems.length === 0) {
      toast.error(t("TABLE_TRANSFER.SELECT_ITEM"));
      return;
    } else {
      // Save previous state for back button functionality

      setprevKotItemDetils(kotItemDetils);
      setprevNewTableItemsDetail(newTableItems);

      // ✅ Flattened addition
      setNewTableItems((pv) => [...pv, ...selectedArrayitems]);

      // ✅ Remove transferred items from KOT list
      const remainingKOTLIST = kotItemDetils?.filter(
        (item) => !selectedItemList.includes(item.orderdtlid)
      );

      console.log("Remaining KOT LIST", remainingKOTLIST);
      setKotItemDetils(remainingKOTLIST);

      // Optionally, clear selected list
      setSelectedItemList([]);
    }
  };

  // Function to transfer selected items from New Table to the Old Table table
  // This function filters the items in newTableItems based on selectedItemListright and updates the kotItemDetils state accordingly

  const transferItemsfromright = () => {
    const selectedArrayitems = newTableItems?.filter((item) =>
      selectedItemListright.includes(item.orderdtlid)
    );

    if (selectedArrayitems.length === 0) {
      toast.error(t("TABLE_TRANSFER.SELECT_ITEM"));
      return;
    } else {
      // Save previous state for back button functionality

      setprevKotItemDetils(kotItemDetils);
      setprevNewTableItemsDetail(newTableItems);

      // ✅ Flattened addition
      setKotItemDetils((pv) => [...pv, ...selectedArrayitems]);

      // ✅ Remove transferred items from New Table list
      const remainingKOTLIST = newTableItems?.filter(
        (item) => !selectedItemListright.includes(item.orderdtlid)
      );

      console.log("Remaining KOT LIST", remainingKOTLIST);
      setNewTableItems(remainingKOTLIST);

      // Optionally, clear selected list
      setselectedItemListright([]);
    }
  };

  // Function to transfer the entire table

  const transferTable = () => {
    setprevKotItemDetils(kotItemDetils);
    setprevNewTableItemsDetail(newTableItems);

    const fulltblcontent = [...newTableItems, ...kotItemDetils];
    setNewTableItems(fulltblcontent);
    setKotItemDetils([]);
  };

  const transferReset = () => {
    setNewTableItems(initialTotabledata);
    setKotItemDetils(kotDetil?.data || []);
    setprevKotItemDetils([]);
    setprevNewTableItemsDetail([]);
  };

  // Function to submit the table transfer

  const tbltransferSubmit = () => {
    const result = isEqual(newTableItems, initialTotabledata);
    if (newTableItems.length === 0) {
      Swal.fire({
        title: t("TABLE_TRANSFER.TABLE_EMPTY_TITLE", {
          tableCode: selectedTotableDetails?.tablecode,
        }),
        text: t("TABLE_TRANSFER.NO_ITEMS_TO_TRANSFER"),
        icon: "error",
        showCancelButton: false,
        confirmButtonText: t("COMMON.OK"),
        confirmButtonColor: "#ec4d4f",
      }).then((result) => {
        if (result.isConfirmed) {
          // navigate('/dayEndClosing')
        }
      });
    } else if (result) {
      Swal.fire({
        title: t("TABLE_TRANSFER.NO_NEW_ITEMS_TITLE", {
          tableCode: selectedTotableDetails?.tablecode,
        }),
        text: t("TABLE_TRANSFER.NO_NEW_ITEMS_TEXT"),
        icon: "info",
        showCancelButton: false,
        confirmButtonText: t("COMMON.OK"),
        confirmButtonColor: "#ec4d4f",
      }).then((result) => {
        if (result.isConfirmed) {
          // navigate('/dayEndClosing')
        }
      });
    } else {
      setmodalVisible(true);
    }
  };

  const checker = () => {
    const result = isEqual(newTableItems, initialTotabledata);
    console.log("Are the two arrays equal?", result);
    console.log("New Table Items:", newTableItems);
    console.log("Initial To Table Data:", initialTotabledata);
  };

  // Function to handle back button action
  const Backbuttonaction = () => {
    setKotItemDetils(prevKotItemDetils);
    setNewTableItems(prevNewTableItemsDetail);
  };

  // To Table Details
  useEffect(() => {
    console.log("Selected To Table Details", selectedTotableDetails);
  }, [selectedTotableDetails]);

  // dataset Mapping Function

  function updateOrderDtlReference(data) {
    const updatedData = [...data]; // shallow copy to avoid mutation
    const refIndexMap = {};
    let parentIndex = null;
    let parentCount = 0;

    updatedData.forEach((item, index) => {
      if (!item.orderdtlreferenceno) {
        // This is a parent item
        parentIndex = index;
        parentCount++;
        refIndexMap[parentCount] = parentIndex;
      } else {
        // This is a child, update using map
        const originalRef = item.orderdtlreferenceno;
        const newIndex = refIndexMap[originalRef];
        if (newIndex !== undefined) {
          item.orderdtlreferenceno = newIndex.toString();
        } else {
          console.warn(`Invalid reference "${originalRef}" at index ${index}`);
        }
      }
    });

    return updatedData;
  }

  //main function of table transfer

  const coreTableTransfer = () => {
    setmodalVisible(false);
    isAuthenticate(true);
    // from here to
    const user = localStorage.getItem("user");
    const outlet = localStorage.getItem("outletDetails");
    let parsedUser = null;

    if (user) {
      try {
        parsedUser = JSON.parse(user);
      } catch (error) {
        console.error("Invalid user JSON:", error);
      }
    }

    const content = [];

    let newMapedarray = [];
    let shelterArry = [];

    for (let i = 0; i < newTableItems.length; i++) {
      const currentItem = newTableItems[i];

      if (currentItem.orderdtlreferenceno === "") {
        // Push any previously stored children
        if (shelterArry.length > 0) {
          newMapedarray = [...newMapedarray, ...shelterArry];
        }

        // Push the new parent
        newMapedarray.push(currentItem);
        shelterArry = [];
      } else {
        // Child item: update its referenceno based on current parent in newMapedarray
        const updatedChild = {
          ...currentItem,
          orderdtlreferenceno: String(newMapedarray.length - 1),
        };
        shelterArry.push(updatedChild);
      }
    }

    // Push remaining children if any
    if (shelterArry.length > 0) {
      newMapedarray = [...newMapedarray, ...shelterArry];
    }

    console.log(newMapedarray);

    //const updatedData = updateOrderDtlReference(newTableItems);
    //console.log(updatedData);

    newTableItems.map((item) => {
      const itemobj = {
        menuid: parseInt(item.menuid),
        orderdtlid: parseInt(item.orderdtlid),
      };
      content.push(itemobj);
    });

    const ttype = kotItemDetils?.length > 0 ? "2" : "1";

    const submittedData = {
      fromtableid: parseInt(selectedFromtableDetails.tableid),
      totableid: parseInt(selectedTotableDetails.tableid),
      TransferType: parseInt(ttype),
      userid: parseInt(parsedUser.userid),
      authorisedby: 2,
      orderhdrvoidnotes: text,
      data: content,
    };

    //console.log(content)

    tableModel
      ?.tableTransfer(submittedData)
      .then((data) => {
        if (data?.status === "true") {
          isAuthenticate(false);
          toast.success(data?.message || t("TABLE_TRANSFER.TRANSFER_SUCCESS"));
          setKotDetil(null);
          setKotItemDetils([]);
          setNewTableItems([]);
          setselectedFromtableDetails({});
          setselectedTotableDetails({});
          setHighlightedFromTables([]);
          setHighlightedToTables([]);
          dispatch(emptyDishList());
          dispatch(kotAdvance(null));
          dispatch(updateCustomerData(null));
          dispatch(updateOrderType(null));
          dispatch(kotPreviousId(null));
          dispatch(kotPax("1"));
          dispatch(customerOrderMod(null));
          dispatch(kotEdit(false));
          dispatch(resetOrder());
          // dispatch(updateTransferStatus(true));
          // navigate(-1);
          navigate("/kot");
        } else {
          setKotDetil(null);
          toast.error(data?.Error?.Error_Msg);
          // dispatch(emptyDishList());
        }
      })
      .catch((error) => {
        console.log("error when loading order detail", error);
      })
      .finally(() => console.log("all done loading order details"));

    // to here
  };

  const handleUpdatetableTransfer = (value) => {
    // console.log("PIN ENTERED - ", value);
    const authenticateBody = {
      pin: value,
      actiontype: "UPDATE",
      transactiontype: 1,
    };

    isAuthenticate(true);

    orderModel
      .kotAuthenticate(authenticateBody)
      .then((data) => {
        if (data.status === "true") {
          coreTableTransfer();
        } else {
          isAuthenticate(false);
          throw new Error("Authentication failed - Table Transfer not allowed");
        }
      })
      .catch((error) => {
        console.error("Transfer Error");
        Swal.fire({
          icon: "error",
          title: t("COMMON.ERROR"),
          text: t("TABLE_TRANSFER.TRANSFER_FAILED"),
        });
      })
      .finally(() => {});
  };

  return (
    <div className="p-5">
      {/* Top Header section */}

      <div className="flex justify-between items-center mb-5">
        <span className="font-[600] text-lg w-11/12 text-center">
          {t("TABLE_TRANSFER.TITLE")}
        </span>
        <Icon
          icon="carbon:close-filled"
          width="30"
          height="30"
          className="cursor-pointer"
          onClick={() => navigate(-1)}
        />
      </div>
      {/* Table Location and Table Selection Section */}
      {sereenToggler ? (
        <div className="p-5">
          <div className="flex gap-1 flex-grow">
            <SlideArrow direction="left" width="50px" />
            <div className="grid grid-cols-2 md:grid-cols-6 gap-1 flex-grow">
              {tableLoc?.length > 0 ? (
                tableLoc?.map((item, index) => (
                  <button
                    disabled={loading}
                    key={index}
                    className="bg-outlet p-2 rounded-lg text-black font-bold"
                    onClick={() => getTableByLoc(item)}
                  >
                    {loading ? <Spin /> : item?.tablelocation}
                  </button>
                ))
              ) : (
                <span className="col-span-6 flex justify-center items-center">
                  {loading ? <Spin /> : t("COMMON.NO_RESULTS_FOUND")}
                </span>
              )}
            </div>
            <SlideArrow direction="right" width="50px" />
          </div>

          <div className="flex flex-col md:flex-row gap-1 mt-2 h-full">
            <div style={{ flexGrow: 1 }}>
              <div className="flex gap-1 mt-2 h-full">
                <SlideArrow
                  direction="left"
                  width="50px"
                  currentIndex={tablePage}
                  setCurrentIndex={setTablePage}
                  refVariable={tableSelectRef}
                  totalPages={totalPagesfromtable}
                />
                <div
                  className="flex overflow-auto w-full scrollbar-hidden"
                  ref={tableSelectRef}
                >
                  <div className="grid grid-cols-3 md:grid-cols-7 gap-1 auto-rows-fr flex-grow">
                    {Array.from({ length: totalItem }).map((_, index) => {
                      const sortedTables = displayedTables
                        .slice()
                        .sort((a, b) => b.usedstatus - a.usedstatus);

                      const table = sortedTables[index];
                      console.log("Table Data", table);
                      return (
                        <button
                          key={index}
                          className={`rounded-lg p-2 font-[600] text-xs flex flex-col justify-center items-center w-full h-full text-black ${
                            table?.usedstatus
                              ? highlightedFromTables.includes(table?.tablecode)
                                ? "bg-orange-500"
                                : "bg-danger"
                              : "bg-[#F2EDED]"
                          }`}
                          onClick={() => {
                            if (!table?.usedstatus) return;

                            //	setselectedFromtableDetails(table);

                            setselectedFromtableDetails((prev) => {
                              // If already selected, unselect it
                              if (prev?.tableid === table.tableid) {
                                return {}; // or null, depending on your default
                              } else {
                                return table;
                              }
                            });

                            setHighlightedFromTables((prev) => {
                              if (prev.includes(table.tablecode)) {
                                // If already selected, remove (toggle off)
                                return prev.filter(
                                  (code) => code !== table.tablecode
                                );
                              } else {
                                // If not selected, add it (toggle on)
                                return [table.tablecode];
                              }
                            });
                          }}
                        >
                          {table?.usedstatus ? (
                            <>
                              {table?.tablecode}
                              <span className="block">
                                {t("TABLE_MANAGEMENT.COVERS", { count: table?.chairs })}
                              </span>
                            </>
                          ) : (
                            <span className="text-gray-500 p-5"></span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <SlideArrow
                  direction="right"
                  width="50px"
                  currentIndex={tablePage}
                  setCurrentIndex={setTablePage}
                  refVariable={tableSelectRef}
                  totalPages={totalPages}
                />
              </div>
            </div>
            <div style={{ flexGrow: 1 }}>
              <div className="flex gap-1 mt-2 h-full">
                <SlideArrow
                  direction="left"
                  width="50px"
                  currentIndex={tablePage}
                  setCurrentIndex={setTablePage}
                  refVariable={tableSelectRef}
                  totalPages={totalPages}
                />
                <div
                  className="flex overflow-auto w-full scrollbar-hidden"
                  ref={tableSelectRef}
                >
                  <div className="grid grid-cols-3 md:grid-cols-7 gap-1 auto-rows-fr flex-grow">
                    {Array.from({ length: totalItem }).map((_, index) => {
                      const table = displayedTables[index];

                      return (
                        <button
                          key={index}
                          //disabled={table?.usedstatus} // disable only if used
                          className={`rounded-lg p-2 font-[600] text-xs flex flex-col justify-center items-center w-full h-full text-black ${
                            table?.usedstatus
                              ? highlightedToTables.includes(table?.tablecode)
                                ? "bg-orange-500"
                                : "bg-danger"
                              : "bg-[#F2EDED]"
                          }
											${
                        highlightedToTables.includes(table?.tablecode)
                          ? "bg-orange-500"
                          : "bg-[#F2EDED]"
                      }
											`}
                          onClick={() => {
                            if (!table) return;

                            //setselectedTotableDetails(table);

                            if (
                              selectedFromtableDetails?.tableid ===
                              table.tableid
                            ) {
                              // If already selected, unselect
                              Swal.fire({
                                title: "Info",
                                text: "Selection Error: The source and destination tables must be different. Kindly choose a different table.",
                                icon: "info",
                                showCancelButton: false,
                                confirmButtonText: "Ok",
                                confirmButtonColor: "#ec4d4f",
                              }).then((result) => {
                                if (result.isConfirmed) {
                                  // navigate('/dayEndClosing')
                                }
                              });
                              setselectedTotableDetails({});
                              setHighlightedToTables([]);
                            } else {
                              // Select new table
                              //setselectedTotableDetails(table);

                              setselectedTotableDetails((prev) => {
                                // If already selected, unselect it
                                if (prev?.tableid === table.tableid) {
                                  return {}; // or null, depending on your default
                                } else {
                                  return table;
                                }
                              });

                              setHighlightedToTables((prev) => {
                                if (prev.includes(table.tablecode)) {
                                  return prev.filter(
                                    (code) => code !== table.tablecode
                                  );
                                } else {
                                  return [table.tablecode];
                                }
                              });
                            }

                            /*
												
												setselectedTotableDetails((prev) => {
													// If already selected, unselect it
													if (prev?.tableid === table.tableid) {
													  return {}; // or null, depending on your default
													} else {
													  return table;
													}
												  });


														
												setHighlightedToTables((prev) => {
													if (prev.includes(table.tablecode)) {
														// If already selected, remove (toggle off)
														return prev.filter((code) => code !== table.tablecode);
													} else {
														// If not selected, add it (toggle on)
														return [table.tablecode];
													}
												});*/
                          }}
                        >
                          {table ? (
                            <>
                              {table?.tablecode}
                              <span className="block">
                                {t("TABLE_MANAGEMENT.COVERS", { count: table?.chairs })}
                              </span>
                            </>
                          ) : (
                            <span className="text-gray-500 p-5"></span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <SlideArrow
                  direction="right"
                  width="50px"
                  currentIndex={tablePage}
                  setCurrentIndex={setTablePage}
                  refVariable={tableSelectRef}
                  totalPages={totalPages}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-end items-center mt-5 gap-1">
            <button className="bg-green-600 text-white p-2 rounded-lg w-full">
              {selectedFromtableDetails.tableid ? (
                <span>
                  {t("TABLE_TRANSFER.FROM_LABEL", {
                    tableCode: selectedFromtableDetails.tablecode,
                  })}
                </span>
              ) : (
                <span>{t("TABLE_TRANSFER.FROM_NOT_SELECTED")}</span>
              )}
            </button>
            <button className="bg-green-600 text-white p-2 rounded-lg w-full">
              {selectedTotableDetails.tableid ? (
                <span>
                  {t("TABLE_TRANSFER.TO_LABEL", {
                    tableCode: selectedTotableDetails.tablecode,
                  })}
                </span>
              ) : (
                <span>{t("TABLE_TRANSFER.TO_NOT_SELECTED")}</span>
              )}
            </button>

            <button
              className="bg-red-600 text-white p-2 rounded-lg  w-full"
              onClick={() => {
                const isEmpty = (obj) => Object.keys(obj).length === 0;
                if (
                  isEmpty(selectedFromtableDetails) &&
                  isEmpty(selectedTotableDetails)
                ) {
                  toast.error(t("TABLE_TRANSFER.SELECT_BOTH_TABLES"));
                  return;
                } else if (isEmpty(selectedFromtableDetails)) {
                  toast.error(t("TABLE_TRANSFER.SELECT_FROM_TABLE"));
                  return;
                } else if (isEmpty(selectedTotableDetails)) {
                  toast.error(t("TABLE_TRANSFER.SELECT_TO_TABLE"));
                  return;
                } else {
                  setSereenToggler(false);
                  getKotDetails();
                }

                //setSereenToggler(false);
                //getKotDetails();
              }}
            >
              {t("TABLE_TRANSFER.NEXT")}
            </button>
          </div>
        </div>
      ) : (
        <div className="px-3 py-3 rounded-md shadow-md">
          {loading ? (
            <div
              className="flex justify-center"
              style={{ height: "400px", alignItems: "center" }}
            >
              <Spin />
            </div>
          ) : (
            <Row>
              <Col xs={24} sm={10} md={10} lg={11} xl={11}>
                <div
                  className="flex justify-center align-middle  p-4 drop-shadow-amber-50"
                  style={{
                    borderRadius: "5px",
                    color: "#000",
                    backgroundColor: "#E8DCDC",
                    fontSize: "18px",
                  }}
                >
                  {selectedFromtableDetails.tablecode}
                </div>
                <div className="mt-2 p-3 sm:p-4 md:p-5 bg-[#F2EDED] rounded-md overflow-y-auto shadow-md h-[400px] scrollbar-thin scrollbar-thumb-gray-400 transition-all">
                  <div className="flex mb-2">
                    <div className="flex-[1]  px-4 py-2 bg-[#e8dcdc] text-l font-bold text-gray-900">
                      <Typography className="h-min">{t("COMMON.QUANTITY")}</Typography>
                    </div>
                    <div className="flex-[3]  text-center px-4 py-2 bg-[#d2d2d2] text-l font-bold text-gray-900">
                      {t("COMMON.DESCRIPTION")}
                    </div>
                    <div className="flex-[1] flex justify-end px-4 py-2 bg-[#e8dcdc] text-l font-bold text-gray-900">
                      {t("COMMON.AMOUNT")}
                    </div>
                  </div>

                  {kotItemDetils?.length === 0 && (
                    <div className="text-center text-gray-500">
                      {t("TABLE_TRANSFER.NO_ITEMS_LEFT")}
                    </div>
                  )}

                  {kotItemDetils?.map((item, index) => {
                    const isSelected = selectedItemList.includes(
                      item.orderdtlid
                    );

                    return item?.menupackageid ? (
                      <div
                        key={index}
                        className="flex p-2 mb-2 justify-between items-center"
                        style={{
                          boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
                          borderRadius: "5px",
                          backgroundColor: "#d9e9ff",
                        }}
                      >
                        <div className="flex flex-row items-center gap-2">
                          <Icon
                            icon="ic:outline-fastfood"
                            width="24"
                            height="24"
                            className="text-blue-400"
                          />
                          <div
                            className="flex justify-center items-center gap-1 bg-blue-400"
                            style={{
                              color: "#ddd",
                              fontSize: "16px",
                              fontWeight: "600",
                              width: "25px",
                              height: "25px",
                              borderRadius: "50%",
                            }}
                          >
                            {item.menuqty}
                          </div>
                        </div>
                        <div>{item.menudesc}</div>
                        <div>{Number(item.menuamount).toFixed(2)}</div>
                      </div>
                    ) : (
                      <div
                        key={index}
                        className={`flex p-2 mb-2 cursor-pointer rounded ${
                          isSelected ? "bg-green-500" : "bg-amber-100"
                        }`}
                        style={{
                          boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                        onClick={() => selectedItemsFromleft(item.orderdtlid)}
                      >
                        <div className="flex flex-row items-center gap-2">
                          <Icon
                            icon="ic:outline-fastfood"
                            width="24"
                            height="24"
                            className="text-amber-400"
                          />
                          <div
                            className="flex justify-center items-center gap-1 bg-amber-500"
                            style={{
                              color: "#fff",
                              fontSize: "16px",
                              fontWeight: "600",
                              width: "25px",
                              height: "25px",
                              borderRadius: "50%",
                            }}
                          >
                            {item.menuqty}
                          </div>
                        </div>
                        <div>{item.menudesc}</div>
                        <div>{Number(item.menuamount).toFixed(2)}</div>
                      </div>
                    );
                  })}
                </div>
              </Col>
              <Col
                xs={24}
                sm={4}
                md={4}
                lg={2}
                xl={2}
                className="flex justify-center items-center lg:px-3 sm:px-0 md:px-0"
              >
                <div className="flex flex-col justify-center items-center gap-2 rounded-md sm:h-[500px] md:h-[470px] sm:py-5">
                  <Button
                    type="primary"
                    block
                    icon={<ProfileOutlined />}
                    size={size}
                    onClick={() => transferTable()}
                  >
                    {t("TABLE_TRANSFER.TABLE")}
                  </Button>
                  <Button
                    type="primary"
                    block
                    icon={<AlignLeftOutlined />}
                    size={size}
                    onClick={() => transferItems()}
                  >
                    {t("TABLE_TRANSFER.ITEMS")}
                  </Button>
                  <Button
                    type="primary"
                    block
                    icon={<RollbackOutlined />}
                    size={size}
                    onClick={() => transferItemsfromright()}
                  >
                    {t("TABLE_TRANSFER.BACK")}
                  </Button>
                  <Button
                    type="primary"
                    block
                    icon={<ReloadOutlined />}
                    size={size}
                    onClick={() => transferReset()}
                    style={{
                      backgroundColor: "#10B981",
                      borderColor: "#10B981",
                    }}
                  >
                    {t("TABLE_TRANSFER.RESET")}
                  </Button>
                  <Button
                    type="primary"
                    block
                    icon={<RollbackOutlined />}
                    size={size}
                    onClick={() => checker()}
                    style={{
                      backgroundColor: "#f9c149",
                      borderColor: "#e7a70f",
                      display: "none",
                    }}
                  >
                    {t("TABLE_TRANSFER.CHECKER")}
                  </Button>
                  <Button
                    type="primary"
                    block
                    danger
                    icon={<CheckCircleOutlined />}
                    size={size}
                    onClick={() => tbltransferSubmit()}
                  >
                    {t("COMMON.SUBMIT")}
                  </Button>
                </div>
                <Modal
                  open={modalVisible}
                  onCancel={() => {
                    setmodalVisible(false);
                    modalRef.current?.openModal();
                  }}
                  onOk={() => {
                    setmodalVisible(false);
                    modalRef.current?.openModal();
                  }}
                  width={600}
                  title={t("TABLE_TRANSFER.ENTER_NOTES")}
                >
                  <Input.TextArea
                    rows={4}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />

                  <Keyboard
                    layoutName={layoutName}
                    onKeyPress={handleKeyPress}
                    layout={{
                      default: [
                        "1 2 3 4 5 6 7 8 9 0",
                        "q w e r t y u i o p",
                        "a s d f g h j k l",
                        "z x c v b n m",
                        "{space} {bksp} {shift}",
                      ],
                      shift: [
                        "1 2 3 4 5 6 7 8 9 0",
                        "Q W E R T Y U I O P",
                        "A S D F G H J K L",
                        "Z X C V B N M",
                        "{space} {bksp} {shift}",
                      ],
                    }}
                    display={{
                      "{bksp}": "⌫",
                      "{space}": "␣",
                      "{shift}": "⇧",
                    }}
                  />
                </Modal>
                <NumberInputModal
                  ref={modalRef}
                  limit={100}
                  imageUrl={getCompanyLogo}
                  onConfirm={handleUpdatetableTransfer}
                />
              </Col>
              <Col xs={24} sm={10} md={10} lg={11} xl={11}>
                <div
                  className="flex justify-center align-middle  p-4 drop-shadow-amber-50"
                  style={{
                    borderRadius: "5px",
                    color: "#000",
                    backgroundColor: "#E8DCDC",
                    fontSize: "18px",
                  }}
                >
                  {selectedTotableDetails.tablecode}
                </div>
                <div
                  className="mt-2 drop-shadow-amber-50 p-5"
                  style={{
                    height: "400px",
                    backgroundColor: "#F2EDED",
                    borderRadius: "5px",
                    overflowY: "auto",
                  }}
                >
                  <div className="flex mb-2">
                    <div className="flex-[1]  px-4 py-2 bg-[#e8dcdc] text-l font-bold text-gray-900">
                      <Typography className="h-min">{t("COMMON.QUANTITY")}</Typography>
                    </div>
                    <div className="flex-[3]  text-center px-4 py-2 bg-[#d2d2d2] text-l font-bold text-gray-900">
                      {t("COMMON.DESCRIPTION")}
                    </div>
                    <div className="flex-[1] flex justify-end px-4 py-2 bg-[#e8dcdc] text-l font-bold text-gray-900">
                      {t("COMMON.AMOUNT")}
                    </div>
                  </div>

                  {newTableItems.length === 0 && (
                    <div className="text-center text-gray-500">
                      {t("TABLE_TRANSFER.NO_ITEMS_ADDED")}
                    </div>
                  )}

                  {newTableItems?.map((item, index) => {
                    const isSelectedright = selectedItemListright.includes(
                      item.orderdtlid
                    );
                    //initialTotabledata
                    const isInitialItem = initialTotabledata.some(
                      (initialItem) =>
                        initialItem.orderdtlid === item.orderdtlid
                    );
                    return item?.menupackageid ? (
                      <div
                        key={index}
                        className="flex p-2 mb-2 justify-between items-center"
                        style={{
                          boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
                          borderRadius: "5px",
                          backgroundColor: "#d9e9ff",
                        }}
                      >
                        <div className="flex flex-row items-center gap-2">
                          <Icon
                            icon="ic:outline-fastfood"
                            width="24"
                            height="24"
                          />
                          <div
                            className="flex justify-center items-center gap-1 bg-gray-400"
                            style={{
                              color: "#ddd",
                              fontSize: "16px",
                              fontWeight: "600",
                              width: "25px",
                              height: "25px",
                              borderRadius: "50%",
                            }}
                          >
                            {item.menuqty}
                          </div>
                        </div>
                        <div>{item.menudesc}</div>
                        <div>{Number(item.menuamount).toFixed(2)}</div>
                      </div>
                    ) : isInitialItem ? (
                      <div
                        key={index}
                        className="flex p-2 mb-2 justify-between items-center"
                        style={{
                          boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
                          borderRadius: "5px",
                          backgroundColor: "#d7d7d7",
                          cursor: "not-allowed",
                        }}
                      >
                        <div className="flex flex-row items-center gap-2">
                          <Icon
                            icon="ic:outline-fastfood"
                            width="24"
                            height="24"
                          />
                          <div
                            className="flex justify-center items-center gap-1 bg-gray-500"
                            style={{
                              color: "#ddd",
                              fontSize: "16px",
                              fontWeight: "600",
                              width: "25px",
                              height: "25px",
                              borderRadius: "50%",
                            }}
                          >
                            {item.menuqty}
                          </div>
                        </div>
                        <div>{item.menudesc}</div>
                        <div>{Number(item.menuamount).toFixed(2)}</div>
                      </div>
                    ) : (
                      <div
                        key={index}
                        className={`flex p-2 mb-2 cursor-pointer justify-between items-center rounded ${
                          isSelectedright ? "bg-green-500" : "bg-amber-100"
                        }`}
                        style={{
                          boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
                        }}
                        onClick={() => selectedItemsFromright(item.orderdtlid)}
                      >
                        <div className="flex flex-row items-center gap-2">
                          <Icon
                            icon="ic:outline-fastfood"
                            width="24"
                            height="24"
                            className="text-amber-400"
                          />
                          <div
                            className="flex justify-center items-center gap-1 bg-amber-500"
                            style={{
                              color: "#fff",
                              fontSize: "16px",
                              fontWeight: "600",
                              width: "25px",
                              height: "25px",
                              borderRadius: "50%",
                            }}
                          >
                            {item.menuqty}
                          </div>
                        </div>
                        <div>{item.menudesc}</div>
                        <div>{Number(item.menuamount).toFixed(2)}</div>
                      </div>
                    );
                  })}
                </div>
              </Col>
            </Row>
          )}
        </div>
      )}
    </div>
  );
}

export default Tabletransferdemo;
