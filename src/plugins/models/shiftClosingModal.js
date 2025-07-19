import ApiService from "../axios";

const shiftClosingModel = {
	shiftClosing(data) {
		return new Promise((resolve, reject) => {
			ApiService.post("/posapi/addshiftclosing", data)
				.then(({ data }) => resolve(data))
				.catch((error) => reject(error));
		});
	},
};

export default shiftClosingModel;
