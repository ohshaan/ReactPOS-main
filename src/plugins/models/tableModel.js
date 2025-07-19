import ApiService from "../axios";

const tableModel={
    getTableLocation(data) {
        return new Promise((resolve, reject) => {
          ApiService.post("/posapi/gettablelocation", data)
            .then(({ data }) => resolve(data))
            .catch((error) => reject(error));
        });
      },
    getTableByLocation(data) {
        return new Promise((resolve, reject) => {
          ApiService.post("/posapi/gettablelisting", data)
            .then(({ data }) => resolve(data))
            .catch((error) => reject(error));
        });
      },
      tableTransfer(data) {
        return new Promise((resolve, reject) => {
          ApiService.post("/posapi/tabletransfer", data)
            .then(({ data }) => resolve(data))
            .catch((error) => reject(error));
        });
      }
}

export default tableModel