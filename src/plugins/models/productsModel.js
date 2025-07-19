import ApiService from "../axios";

const productModel = {
  getCategory(data) {
    return new Promise((resolve, reject) => {
      ApiService.post("/posapi/getcategory", data)
        .then(({ data }) => resolve(data))
        .catch((error) => reject(error));
    });
  },

  getMenu(data) {
    const finalData = { ...data, intmode: "0", strfilter: "" };
    return new Promise((resolve, reject) => {
      ApiService.post("/posapi/getmenu", finalData)
        .then(({ data }) => resolve(data))
        .catch((error) => reject(error));
    });
  },

  getToppingType() {
    return new Promise((resolve, reject) => {
      ApiService.get("/posapi/gettoppingstype")
        .then(({ data }) => resolve(data))
        .catch((error) => reject(error));
    });
  },

  getToppingMenu(data) {
    return new Promise((resolve, reject) => {
      ApiService.post("/posapi/gettoppings", data)
        .then(({ data }) => resolve(data))
        .catch((error) => reject(error));
    });
  },

  getPackageMenu(data) {
    return new Promise((resolve, reject) => {
      ApiService.post("/posapi/getpackagemenu", data)
        .then(({ data }) => resolve(data))
        .catch((error) => reject(error));
    });
  },

  getPackageSubMenu(data) {
    return new Promise((resolve, reject) => {
      ApiService.post("/posapi/getpackagesubmenu", data)
        .then(({ data }) => resolve(data))
        .catch((error) => reject(error));
    });
  },

  getPackageMenuCustomize(data) {
    return new Promise((resolve, reject) => {
      ApiService.post("/posapi/getsubmenucustomizeitems", data)
        .then(({ data }) => resolve(data))
        .catch((error) => reject(error));
    });
  },
};

export default productModel;
