import axios from "axios";

const api = axios.create({
	baseURL: import.meta.env.VITE_API_BASE_URL,
	headers: {
		"Content-Type": "application/json",
		Accept: "*/*",
		posapi_key: "OPX8TWF4P2",
	},
});

api.interceptors.request.use(
	(request) => {
		return request;
	},
	(error) => {
		return Promise.reject(error);
	}
);

api.interceptors.response.use(
	(response) => {
		return response;
	},
	(error) => {
		return Promise.reject(error);
	}
);

const ApiService = {
	async setToken() {
		// api.defaults.headers.common['Authorization'] = `Bearer ${'252e6c8953ab405c9bb7fa5c94c9256e3b9cf9a9'}`;
	},

	query(resource, params) {
		return api.get(resource, params);
	},

	get(resource, slug = "") {
		return api.get(resource + (slug ? "/" + slug : ""));
	},

	post(resource, params) {
		return api.post(resource, params);
	},

	patch(resource, params) {
		return api.patch(resource, params);
	},

	update(resource, slug, params) {
		return api.put(resource + "/" + slug, params);
	},

	put(resource, params) {
		return api.put(resource, params);
	},

	delete(resource, params) {
		return api.delete(resource, { data: params });
	},
};

export default ApiService;
