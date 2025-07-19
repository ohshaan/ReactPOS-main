import ApiService from "../axios";

const aggregatorModel = {
	getAggregator(data) {
		return new Promise((resolve, reject) => {
			ApiService.post("/posapi/getaggregator", data)
				.then(({ data }) => resolve(data))
				.catch((error) => reject(error));
		});
	},
};

export default aggregatorModel;
