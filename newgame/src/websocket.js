import config from "./config"

var ws;
var game;

export default (game) => {
    if (ws) {
        return;
    }

    game = game;
    ws = new WebSocket(`ws://${config.baseUrl}:${config.PORT}`);

    ws.onopen = () => {
        ws.send(
            JSON.stringify({
                type: "login",
                token: JSON.parse(localStorage.getItem(config.tokenKey)).access_token
            })
        );
    };

    ws.onmessage = e => {
        var msg = JSON.parse(e.data);
        console.log(msg);
        switch (msg.type) {
            case "game":
                break;
            case "group":
                break;
            case "message":
                break;
        }
    };
}