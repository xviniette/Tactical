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

        this.user;
        this.group;
        this.matchmaking;
        this.maps = [];
        this.map;
        this.usergame;
        this.regions = [];

        this.controls = {
            jump: 38,
            left: 37,
            right: 39,
            up: 40,
            kick: 32
        }

        hello.on('auth.login', auth => {
            this.networkAuth(auth.network, auth.authResponse.access_token);
        });
    }

    create() {
        var _this = this;
        async.parallel({
            maps(callback) {
                http.get("/v1/maps?sort=difficulty").then(res => {
                    _this.maps = res.data;
                    _this.maps.forEach(map => {
                        Object.assign(map, JSON.parse(map.informations));
                        delete map.informations;
                    });

                    callback(false, _this.maps);
                }).catch(err => {
                    callback(err);
                });
            },
            user(callback) {
                _this.getUser(() => {
                    callback();
                })
            },
            regions(callback) {
                _this.getPlayableRegions((regions) => {
                    _this.regions = regions;
                    callback();
                })
            },
            game(callback) {
                _this.getGame(() => {
                    callback();
                });
            }
        }, (err, results) => {
            if (err) {
                console.log("ERROR ACCESSING GAME SERVER")
                return;
            }

            if (this.usergame) {
                this.setGame();
            } else if (this.user) {
                this.setHome();
            } else {
                this.setTutorial();
            }
        });
    }

    setTutorial() {
        this.scene.stop("HomeScene");

        this.setDefaultUsergame(this.maps.find(map => map.type == "tutorial").id);

        this.scene.launch("GameScene");
        this.scene.launch("TutorialScene");
        this.scene.launch("ParameterScene");
    }

    setHome() {
        this.setWebsocket();

        this.setDefaultMap();
        this.setDefaultUsergame();

        this.scene.stop("TutorialScene");

        this.scene.launch("GameScene");
        this.scene.launch("HomeScene");
        this.scene.launch("ParameterScene");
    }

    setGame() {
        this.scene.stop("HomeScene");
        this.scene.stop("TutorialScene");

        this.scene.launch("GameScene");
    }

    setDefaultMap() {
        if (this.map != null) {
            return;
        }

        this.map = this.maps.find(map => map.type != "tutorial").id;
    }

    setDefaultUsergame(map) {
        var usergame = {
            game: {
                map: null,
                warmupTime: 0,
                gameTime: -1,
                goalTarget: -1,
            },
            user: {
                id: null,
                team: 1
            }
        }

        if (this.maps.length > 0) {
            usergame.game.map = this.maps[0].id;
        }

        if (this.map) {
            usergame.game.map = this.map;
        }

        if (map) {
            usergame.game.map = map;
        }

        if (this.user) {
            usergame.user.id = this.user.id;
        }

        this.usergame = usergame;
        return usergame;
    }

    getUser(callback = () => {}) {
        http.get("/v1/users/me").then(res => {
            this.user = res.data;
            callback(false, res.data);
        }).catch(err => {
            this.user = null;
            callback(err)
        });
    }

    getGame(callback = () => {}) {
        http.get("/v1/game").then(res => {
            this.usergame = res.data;
            callback(false, res.data);
        }).catch(err => {
            this.usergame = null;
            callback(err)
        });
    }

    setWebsocket() {
        if (this.ws) {
            return;
        }

        var reconnect = null;

        var connect = () => {
            this.ws = new WebSocket(`ws://${config.baseUrl}:${config.PORT}`);

            this.ws.onopen = () => {
                this.ws.send(
                    JSON.stringify({
                        type: "login",
                        token: JSON.parse(localStorage.getItem(config.tokenKey)).access_token
                    })
                );
                clearInterval(reconnect);
            };

            this.ws.onmessage = e => {
                var msg = JSON.parse(e.data);
                switch (msg.type) {
                    case "game":
                        this.getGame(() => {
                            if (this.usergame) {
                                this.setGame();
                            }
                        })
                        break;
                    case "group":
                        this.group = msg;
                        break;
                    case "message":
                        break;
                }
            };

            this.ws.onclose = e => {
                this.ws = null;
                reconnect = setInterval(() => {
                    connect();
                }, 5000);
            }
        }

        connect();
    }

    getPlayableRegions(callback = () => {}) {
        const regions = {};
        const wss = [];
        http.get(`/v1/servers`).then((res) => {
            res.data.forEach((region) => {
                regions[region] = null;

                http.get(`/v1/servers/${region}`).then((server) => {
                    if (server.data.IP == "127.0.0.1") {
                        server.data.IP = config.baseUrl;
                        server.data.ACCESS = `${config.baseUrl}:${server.data.PORT}`;
                    }
                    const ws = new WebSocket(`ws://${server.data.ACCESS}`);
                    wss.push(ws);
                    ws.onopen = () => {
                        ws.send(JSON.stringify({
                            type: 'ping',
                            timestamp: Date.now()
                        }));
                    }

                    ws.onmessage = (e) => {
                        const msg = JSON.parse(e.data);
                        if (msg.type == 'pong') {
                            regions[region] = Date.now() - msg.timestamp;
                        }
                    }
                });
            });

            setTimeout(() => {
                for (var ws of wss) {
                    ws.close();
                }

                const regionsArray = [];
                for (var region in regions) {
                    regionsArray.push({
                        region: region,
                        ping: regions[region]
                    });
                }

                regionsArray.sort((a, b) => {
                    return a.ping - b.ping;
                });
                callback(regionsArray);
            }, 100);
        });
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