import ApiService from "../axios";

const posReportModel = {
	briefReport(data) {
		return new Promise((resolve, reject) => {
			ApiService.post("/posapi/getbriefreports", data)
				.then(({ data }) => resolve(data))
				.catch((error) => reject(error));
		});
	},
	kotReport(data) {
		return new Promise((resolve, reject) => {
			ApiService.post("/posapi/getkotreports", data)
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
	invoiceSummaryReports(data) {
		return new Promise((resolve, reject) => {
			ApiService.post("/posapi/getinvoicesummaryreports", data)
				.then(({ data }) => resolve(data))
				.catch((error) => reject(error));
		});
	},
	employeeWiseInvoiceReports(data) {
		return new Promise((resolve, reject) => {
			ApiService.post("/posapi/getemployeewiseinvoice", data)
				.then(({ data }) => resolve(data))
				.catch((error) => reject(error));
		});
	},
	collectionDetailsReports(data) {
		return new Promise((resolve, reject) => {
			ApiService.post("/posapi/getcollectiondetailsreports", data)
				.then(({ data }) => resolve(data))
				.catch((error) => reject(error));
		});
	},
	openKOTInvoiceReports(data) {
		return new Promise((resolve, reject) => {
			ApiService.post("/posapi/getopenkotreports", data)
				.then(({ data }) => resolve(data))
				.catch((error) => reject(error));
		});
	},
	getreportallocation(data) {
		return new Promise((resolve, reject) => {
			ApiService.post("/posapi/getreportallocation", data)
				.then(({ data }) => resolve(data))
				.catch((error) => reject(error));
		});
	},
	getbriefreportssummary(data) {
		return new Promise((resolve, reject) => {
			ApiService.post("/posapi/getbriefreportssummary", data)
				.then(({ data }) => resolve(data))
				.catch((error) => reject(error));
		});
	},
};



export default posReportModel;
