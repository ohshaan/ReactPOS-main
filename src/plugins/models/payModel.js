import ApiService from "../axios";

const payModel = {
	loadCostCenter(data) {
		return new Promise((resolve, reject) => {
			ApiService.post("/posapi/getcostcenter", data)
				.then((data) => resolve(data?.data))
				.catch((error) => reject(error));
		});
	},
	laodSlabList(data) {
		return new Promise((resolve, reject) => {
			ApiService.post("/posapi/getslabdetails", data)
				.then((data) => resolve(data?.data))
				.catch((error) => reject(error));
		});
	},
	loadSlabDiscount(data) {
		return new Promise((resolve, reject) => {
			ApiService.post("/posapi/searchdiscount", data)
				.then((data) => resolve(data?.data))
				.catch((error) => reject(error));
		});
	},
	getEmpData(data) {
		return new Promise((resolve, reject) => {
			ApiService.post("/posapi/getemployee", data)
				.then((data) => resolve(data?.data))
				.catch((error) => reject(error));
		});
	},
	saveInvoiceDetails(data) {
		return new Promise((resolve, reject) => {
			ApiService.post("/posapi/saveinvoicedetails", data)
				.then((data) => resolve(data?.data))
				.catch((error) => reject(error));
		});
	},

	invoiceList(data) {
		return new Promise((resolve, reject) => {
			ApiService.post("/posapi/getinvoicelisting", data)
				.then((data) => resolve(data?.data))
				.catch((error) => reject(error));
		});
	},
	deleteInvoice(data) {
		return new Promise((resolve, reject) => {
			ApiService.delete("/posapi/deleteinvoice", data)
				.then((data) => resolve(data?.data))
				.catch((error) => reject(error));
		});
	},
	getOtherPayments(data) {
		return new Promise((resolve, reject) => {
			ApiService.post("/posapi/getpaymentdetails", data)
				.then((data) => resolve(data?.data))
				.catch((error) => reject(error));
		});
	},
	getinvoiceprint(data) {
		return new Promise((resolve, reject) => {
			ApiService.post("/posapi/getinvoiceprint", data)
				.then(({ data }) => resolve(data))
				.catch((error) => reject(error));
		});
	},
	kotFireOrderStatus(data) {
		return new Promise((resolve, reject) => {
			ApiService.post("/posapi/kotfireorder", data)
				.then((data) => resolve(data?.data))
				.catch((error) => reject(error));
		});
	},
};

export default payModel;
