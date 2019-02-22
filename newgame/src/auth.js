import hello from "hellojs";
import config from "./config";

hello.init(config.networks, {
    redirect_uri: ''
});

export default hello;