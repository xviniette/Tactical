import http from "../http";
import utils from "../modules/utils";

export default class HomeScene extends Phaser.Scene {
    constructor(test) {
        super({
            key: 'HomeScene'
        });
    }

    create() {
        var _this = this;

        this.controller = this.scene.get("Controller");

        //Title
        var title = this.add.container();
        title.add(this.add.text(10, 10, 'Bomball', {
            fontFamily: 'Arial',
            fontSize: 64,
            color: '#00ff00'
        }));

        this.group = this.add.container(this.sys.game.config.width - 100, 10);

        this.setMatchaking();
        this.setGroup();

        //Start Game
        this.start = this.add.container(this.sys.game.config.width - 1000, this.sys.game.config.height - 100);
        this.matchmaking = this.add.container();
        this.private = this.add.container();
        this.start.add(this.matchmaking);
        this.start.add(this.private);

        //Matchmaking
        this.matchmaking.add(this.add.text(-250, 0, "MM", {
            fontFamily: 'Arial',
            fontSize: 64,
            color: '#00ff00'
        }).setOrigin(0.5, 0.5).setInteractive({
            useHandCursor: true
        }).on('pointerup', pointer => {
            http.patch("/v1/group", {
                matchmaking: false,
                map: this.controller.map
            }).then(res => {
                this.controller.group = res.data;
            })
        }));

        this.mmStart = this.add.text(0, 0, "Find match", {
            fontFamily: 'Arial',
            fontSize: 64,
            color: '#00ff00'
        }).setOrigin(0.5, 0.5).setInteractive({
            useHandCursor: true
        }).on('pointerup', pointer => {
            http.post("/v1/matchmaking", {
                regions: this.controller.regions.map(r => r.region).join('|')
            }).then(res => {
                res.data.timestamp += Date.now();
                this.controller.matchmaking = res.data;
            });
        });

        this.matchmaking.add(this.mmStart);

        this.mmSearching = this.add.container();
        this.matchmaking.add(this.mmSearching);

        this.mmSearching.add(this.add.text(0, 0, "Searching", {
            fontFamily: 'Arial',
            fontSize: 64,
            color: '#00ff00'
        }).setOrigin(0.5, 0.5).setInteractive({
            useHandCursor: true
        }).on('pointerup', pointer => {
            http.delete("/v1/matchmaking").then(res => {
                this.controller.matchmaking = null;
            });
        }));

        this.mmTimer = this.add.text(0, 0, "", {
            fontFamily: 'Arial',
            fontSize: 64,
            color: '#00ff00'
        });
        this.mmSearching.add(this.mmTimer);


        //Private
        this.private.add(this.add.text(-250, 0, "PR", {
            fontFamily: 'Arial',
            fontSize: 64,
            color: '#00ff00'
        }).setOrigin(0.5, 0.5).setInteractive({
            useHandCursor: true
        }).on('pointerup', pointer => {
            http.patch("/v1/group", {
                matchmaking: true,
            }).then(res => {
                this.controller.group = res.data;
            })
        }));

        this.private.add(this.add.text(0, 0, "START", {
            fontFamily: 'Arial',
            fontSize: 64,
            color: '#00ff00'
        }).setOrigin(0.5, 0.5).setInteractive({
            useHandCursor: true
        }).on('pointerup', pointer => {
            http.patch("/v1/group", {
                map: this.controller.map
            }).finally(() => {
                http.post("/v1/group/start", {
                    regions: this.controller.regions.map(r => r.region).join('|')
                });
            })
        }));
    }

    drawGroup() {
        this.group.removeAll(true);

        this.group.add(this.add.text(-100, 0, "+User", {
            fontFamily: 'Arial',
            fontSize: 64,
            color: '#ffffff'
        }).setOrigin(1, 0).setInteractive({
            useHandCursor: true
        }).on('pointerup', () => {
            http.post("/v1/group/invite").then(res => {
                console.log(res.data.id);
            });
        }));

        var users = [];

        if (this.controller.group) {
            users = this.controller.group.players;
        } else {
            users = [{
                user: this.controller.user,
                team: 1
            }];
        }

        for (var i = 0; i < users.length; i++) {
            var user = this.add.text(-100 * i, 0, users[i].user.username, {
                fontFamily: 'Arial',
                fontSize: 64,
                color: '#ffffff'
            }).setOrigin(1, 0).setInteractive({
                useHandCursor: true
            }).on('pointerup', (() => {
                var u = users[i];
                return () => {
                    this.scene.launch("ProfileScene", u.user.id);
                }
            })());

            this.group.add(user);
        }
    }

    update() {
        if (this.controller.group && !this.controller.group.matchmaking) {
            this.matchmaking.setVisible(false);
            this.private.setVisible(true);
        } else {
            this.matchmaking.setVisible(true);
            this.private.setVisible(false);
            if (this.controller.matchmaking) {
                this.mmSearching.setVisible(true);
                this.mmStart.setVisible(false);

                this.mmTimer.setText(utils.timeFormat(Date.now() - this.controller.matchmaking.timestamp));
            } else {
                this.mmSearching.setVisible(false);
                this.mmStart.setVisible(true);
            }
        }
    }

    setMatchaking() {
        http.get("/v1/matchmaking").then(res => {
            res.data.timestamp += Date.now();
            this.controller.matchmaking = res.data;
        }).catch(err => {
            this.controller.matchmaking = null;
        });
    }

    setGroup() {
        const getGroup = () => {
            http.get("/v1/group").then(res => {
                this.controller.group = res.data;
                this.controller.map = this.controller.group.map;
                this.drawGroup();
            }).catch(err => {
                this.controller.group = null;
                this.drawGroup();
            });
        }

        var searchParams = new URLSearchParams(location.search);
        var group = searchParams.get("group");

        if (group) {
            http.delete("/v1/group").finally(() => {
                http.post("/v1/group/join", {
                    id: group
                }).finally(() => {
                    getGroup();
                })
            })
        } else {
            getGroup();
        }
    }
}