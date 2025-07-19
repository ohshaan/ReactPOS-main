import ApiService from "../axios";

const orderModel = {
	saveKotOrder(data) {
		return new Promise((resolve, reject) => {
			ApiService.post("/posapi/createkot", data)
				.then(({ data }) => resolve(data))
				.catch((error) => reject(error));
		});
	},
	getKotList(data) {
		return new Promise((resolve, reject) => {
			ApiService.post("/posapi/getkotlist", data)
				.then(({ data }) => resolve(data))
				.catch((error) => reject(error));
		});
	},
	getKotDetails(data) {
		return new Promise((resolve, reject) => {
			ApiService.post("/posapi/getkotdetails", data)
				.then(({ data }) => resolve(data))
				.catch((error) => reject(error));
		});
	},
	kotAuthenticate(data) {
		return new Promise((resolve, reject) => {
			ApiService.post("/posapi/authenticateuser", data)
				.then(({ data }) => resolve(data))
				.catch((error) => reject(error));
		});
	},
	deleteKot(data) {
		return new Promise((resolve, reject) => {
			ApiService.delete("/posapi/deletekot", data)
				.then(({ data }) => resolve(data))
				.catch((error) => reject(error));
		});
	},
	getkotprint(data) {
		return new Promise((resolve, reject) => {
			ApiService.post("/posapi/getkotprint", data)
				.then(({ data }) => resolve(data))
				.catch((error) => reject(error));
		});
	},
	getDayClosed(data) {
		return new Promise((resolve, reject) => {
			ApiService.post("/posapi/getdayendclosed", data)
				.then(({ data }) => resolve(data))
				.catch((error) => reject(error));
		});
	},
};

export default orderModel;
