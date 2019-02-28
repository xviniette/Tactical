import http from "../http";
import config from '../config';
import async from "async";
import hello from '../auth'

export default class Controller extends Phaser.Scene {
    constructor(test) {
        super({
            key: 'Controller'
        });

        this.websocket;

        hello.on('auth.login', auth => {
            this.networkAuth(auth.network, auth.authResponse.access_token);
        });
    }

    create() {
        console.log("xD");
    }

    auth() {
        hello("google").login({
            display: "page"
        });
    }

    networkAuth(network, access_token, username, callback = () => {}) {
        http.post("/v1/auth/network", {
            network: network,
            access_token: access_token,
            username: username
        }).then(res => {
            window.localStorage.setItem(config.tokenKey, JSON.stringify(res.data));
            this.getUser(err => {
                if (!err) {
                    localStorage.removeItem("hello");
                    this.setHome();
                }
            });
        }).catch(err => {
            if (err.response.data.error == "username_needed") {
                var usernameChoosen = prompt("Choose username");
                this.networkAuth(network, access_token, usernameChoosen);
            }
        });
    }
}