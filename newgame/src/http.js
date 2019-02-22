import axios from "axios";
import config from "./config"

const instance = axios.create({
    baseURL: `http://${config.baseUrl}:${config.PORT}`
});

instance.interceptors.request.use(function (cfg) {
    let token = localStorage.getItem(config.tokenKey);
    if (token) {
        token = JSON.parse(token);
        cfg.headers = {
            Authorization: `${token.token_type} ${token.access_token}`
        }
    }
    return cfg;
}, function (error) {
    return Promise.reject(error);
});

export default instance;