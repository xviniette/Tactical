import http from "../http";
import async from "async";

export default class RankingScene extends Phaser.Scene {
    constructor(test) {
        super({
            key: 'RankingScene'
        });

        this.page = 1;
        this.range = 10;

        this.size = {
            width: 600,
            height: 800
        }
    }

    create(id) {
        this.controller = this.scene.get("Controller");

        this.container = this.add.container(this.sys.game.config.width / 2 - this.size.width / 2, this.sys.game.config.height / 2 - this.size.height / 2);

        var graphics = this.add.graphics();
        graphics.fillStyle(0xffffff, 1);
        graphics.fillRoundedRect(0, 0, this.size.width, this.size.height, 30);
        this.container.add(graphics);


        this.container.add(this.add.text(25, 25, 'Ranking', {
            fontFamily: 'Arial',
            fontSize: 64,
            color: '#000000'
        }).setOrigin(0, 0).setInteractive({
            useHandCursor: true
        }).on('pointerup', pointer => {
            this.close();
        }));

        this.container.add(this.add.text(this.size.width - 25, 25, 'X', {
            fontFamily: 'Arial',
            fontSize: 64,
            color: '#000000'
        }).setOrigin(1, 0).setInteractive({
            useHandCursor: true
        }).on('pointerup', pointer => {
            this.close();
        }));

        this.pageText = this.add.text(this.size.width / 2, this.size.height - 25, '', {
            fontFamily: 'Arial',
            fontSize: 64,
            color: '#000000'
        }).setOrigin(0.5, 1).setInteractive({
            useHandCursor: true
        }).on('pointerup', pointer => {
            this.close();
        });

        this.container.add(this.pageText);

        this.container.add(this.add.text(this.size.width / 2 + 50, this.size.height - 25, '>', {
            fontFamily: 'Arial',
            fontSize: 64,
            color: '#000000'
        }).setOrigin(0.5, 1).setInteractive({
            useHandCursor: true
        }).on('pointerup', pointer => {
            this.page++;
            this.setUsers();
        }));

        this.container.add(this.add.text(this.size.width / 2 - 50, this.size.height - 25, '<', {
            fontFamily: 'Arial',
            fontSize: 64,
            color: '#000000'
        }).setOrigin(0.5, 1).setInteractive({
            useHandCursor: true
        }).on('pointerup', pointer => {
            this.page--;
            this.setUsers();
        }));

        this.users = this.add.group();

        this.setUsers();
    }

    setUsers() {
        if (this.page < 1) {
            this.page = 1;
        }

        this.loadRank((err, users) => {
            this.pageText.setText(this.page);

            this.users.clear(true, true);
            if (err) {
                return;
            }

            for (var i = 0; i < users.length; i++) {
                var y = 150 + i * 55;

                var rank = this.add.text(20, y, users[i].rank, {
                    fontFamily: 'Arial',
                    fontSize: 32,
                    color: '#000000'
                });

                this.users.add(rank);
                this.container.add(rank);

                var user = this.add.text(100, y, users[i].username, {
                    fontFamily: 'Arial',
                    fontSize: 32,
                    color: '#000000'
                }).setInteractive({
                    useHandCursor: true
                }).on('pointerup', (() => {
                    var u = users[i];
                    return () => {
                        this.scene.launch("ProfileScene", u.id);
                        this.scene.bringToTop("ProfileScene");
                    }
                })());

                this.users.add(user);
                this.container.add(user);

                var rating = this.add.text(this.size.width - 20, y, users[i].rating, {
                    fontFamily: 'Arial',
                    fontSize: 32,
                    color: '#000000'
                }).setOrigin(1, 0);

                this.users.add(rating);
                this.container.add(rating);
            }
        });
    }

    loadRank(callback = () => {}) {
        http.get(`/v1/users?sort=rating,id&desc=rating&guest=0&range=${(this.page - 1) * this.range}-${this.page * this.range}`).then(res => {
            if (res.data.length > 0) {
                http.get(`/v1/users/${res.data[0].id}/rank`).then(rank => {
                    res.data[0].rank = rank.data.rank;

                    for (var i = 1; i < res.data.length; i++) {
                        if (res.data[i].rating == res.data[i - 1].rating) {
                            res.data[i].rank = res.data[i - 1].rank;
                        } else {
                            res.data[i].rank = rank.data.rank + i;
                        }
                    }

                    callback(false, res.data);
                }).catch(err => {
                    callback(err);
                });
            } else {
                callback(true);
            }
        }).catch(err => {
            callback(err);
        });
    }

    close() {
        this.scene.stop("RankingScene");
    }
}