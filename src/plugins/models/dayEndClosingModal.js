import ApiService from "../axios";

const dayEndClosingModel = {
	dayEndClosing(data) {
		return new Promise((resolve, reject) => {
			ApiService.post("/posapi/adddayendclosing", data)
				.then(({ data }) => resolve(data))
				.catch((error) => reject(error));
		});
	},
	unsettledInvoiceListing(data) {
		return new Promise((resolve, reject) => {
			ApiService.post("/posapi/getinvoicelisting", data)
				.then(({ data }) => resolve(data))
				.catch((error) => reject(error));
		});
	},
	OpenKotInvoiceReports(data) {
		return new Promise((resolve, reject) => {
			ApiService.post("/posapi/getopenkotreports", data)
				.then(({ data }) => resolve(data))
				.catch((error) => reject(error));
		});
	},
	allInvoiceReports(data) {
		return new Promise((resolve, reject) => {
			ApiService.post("/posapi/getallinvoicereports", data)
				.then(({ data }) => resolve(data))
				.catch((error) => reject(error));
		});
	},
	getdayendclosingtime(data) {
		return new Promise((resolve, reject) => {
			ApiService.post("/posapi/getdayendclosingtime",data)
				.then(({ data }) => resolve(data))
				.catch((error) => reject(error));
		});
	}
};

export default dayEndClosingModel;
