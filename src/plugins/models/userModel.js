import axios from "axios";
import ApiService from "../axios";

const userModel = {
	getCompanyLogo() {
		return new Promise((resolve, reject) => {
			ApiService.get("posapi/getcompanylogo")
				.then(({ data }) => resolve(data))
				.catch((error) => reject(error));
		});
	},
	getConfig() {
		return new Promise((resolve, reject) => {
			ApiService.post("posapi/getconfigurations")
				.then(({ data }) => resolve(data))
				.catch((error) => reject(error));
		});
	},
	getCurrentDate(data) {
		return new Promise((resolve, reject) => {
			ApiService.post("posapi/getcurrentdate", data)
				.then(({ data }) => resolve(data))
				.catch((error) => reject(error));
		});
	},
	login(data) {
		return new Promise((resolve, reject) => {
			ApiService.post("posapi/login", data)
				.then(({ data }) => resolve(data))
				.catch((error) => reject(error));
		});
	},
	logout(data) {
		return new Promise((resolve, reject) => {
			ApiService.post("posapi/logout", data)
				.then(({ data }) => resolve(data))
				.catch((error) => reject(error));
		});
	},
	getCompany(data) {
		return new Promise((resolve, reject) => {
			ApiService.post("posapi/getcompany", data)
				.then(({ data }) => resolve(data))
				.catch((error) => reject(error));
		});
	},
	getOutlet(data) {
		return new Promise((resolve, reject) => {
			ApiService.post("posapi/getoutlets", data)
				.then(({ data }) => resolve(data))
				.catch((error) => reject(error));
		});
	},
	addOpeningCash(data) {
		return new Promise((resolve, reject) => {
			ApiService.post("/posapi/saveopeningcash", data)
				.then(({ data }) => resolve(data))
				.catch((error) => reject(error));
		});
	},
	getOpeningCash(data) {
		return new Promise((resolve, reject) => {
			ApiService.post("/posapi/getopeningcash", data)
				.then(({ data }) => resolve(data))
				.catch((error) => reject(error));
		});
	},
	getIpAddress: async () => {
		try {
			const response = await axios.get("https://api.ipify.org?format=json");

			// The IP address is at response.data.ip
			return response.data.ip;
		} catch (error) {
			console.error("Could not get IP address:", error.message);
			return "not_found"; // Return a default value on failure
		}
	},
};

export default userModel;
