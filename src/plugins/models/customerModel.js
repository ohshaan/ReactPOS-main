import ApiService from "../axios";

const customerModel={
    getCustomerByMobile(data){
        return new Promise((resolve, reject) => {
            ApiService.post("/posapi/searchcustomerbymobile", data)
            .then(({ data }) => resolve(data))
            .catch((error) => reject(error));
        })
    },
    getCustomerById(data){
        return new Promise((resolve, reject) => {
            ApiService.post("/posapi/searchcustomerbyid", data)
            .then(({ data }) => resolve(data))
            .catch((error) => reject(error));
        })
    },
    getPrevOrderByCustomer(data){
        return new Promise((resolve, reject) => {
            ApiService.post("/posapi/getpreviousorderdetails", data)
            .then(({ data }) => resolve(data))
            .catch((error) => reject(error));
        })
    },
    addCustomer(data){
        return new Promise((resolve, reject) => {
            ApiService.post("/posapi/addcustomer", data)
            .then(({ data }) => resolve(data))
            .catch((error) => reject(error));
        })
    },
    getCardDetails(){
        return new Promise((resolve, reject) => {
            ApiService.get("/posapi/getcardtypes")
            .then(({ data }) => resolve(data))
            .catch((error) => reject(error));
        })
    },
}
export default customerModel