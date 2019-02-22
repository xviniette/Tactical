import http from "../http";
import async from "async";

export default class ProfileScene extends Phaser.Scene {
    constructor(test) {
        super({
            key: 'ProfileScene'
        });
    }

    create(id) {
        this.controller = this.scene.get("Controller");

        if (id == null) {
            if (this.controller.user) {
                id = this.controller.user.id;
            } else {
                this.close();
                return;
            }
        }

        var profile = this.add.container(this.sys.game.config.width / 2 - 325, this.sys.game.config.height / 2 - 250);

        var graphics = this.add.graphics();
        graphics.fillStyle(0xffffff, 1);
        graphics.fillRoundedRect(0, 0, 650, 400, 30);
        profile.add(graphics);

        async.parallel({
            user(callback) {
                http.get(`/v1/users/${id}`).then(res => {
                    callback(false, res.data);
                }).catch(err => {
                    callback(err);
                });
            },
            // matches(callback) {
            //     http.get(`/v1/users/${id}/matches`).then(res => {
            //         callback(false, res.data);
            //     }).catch(err => {
            //         callback(err);
            //     });
            // },
            rank(callback) {
                http.get(`/v1/users/${id}/rank`).then(res => {
                    callback(false, res.data.rank);
                }).catch(err => {
                    callback(err);
                });
            }
        }, (err, results) => {
            var rates = this.rates(results.user);

            profile.add(this.add.text(625, 25, 'X', {
                fontFamily: 'Arial',
                fontSize: 64,
                color: '#000000'
            }).setOrigin(1, 0).setInteractive({
                useHandCursor: true
            }).on('pointerup', pointer => {
                this.close();
            }));

            profile.add(this.add.text(25, 25, results.user.username, {
                fontFamily: 'Arial',
                fontSize: 64,
                color: '#000000'
            }));

            profile.add(this.add.text(25, 175, `Ranking : #${results.rank}`, {
                fontFamily: 'Arial',
                fontSize: 32,
                color: '#000000'
            }).setInteractive({
                useHandCursor: true
            }).on('pointerup', pointer => {
                this.scene.launch("RankingScene");
                this.scene.bringToTop("RankingScene");
            }));

            profile.add(this.add.text(25, 275, `Rating : ${results.user.rating}`, {
                fontFamily: 'Arial',
                fontSize: 32,
                color: '#000000'
            }));

            //Graphic
            var graphic = this.add.container(500, 250);
            var graphics = this.add.graphics();

            var radius = 100;
            var width = 40;

            graphics.lineStyle(width, 0x00ff00);

            graphics.beginPath();
            graphics.arc(0, 0, radius, Phaser.Math.DegToRad(0), Phaser.Math.DegToRad(360 * rates.win), false, 0.02);
            graphics.strokePath();

            graphics.lineStyle(width, 0xff0000);

            graphics.beginPath();
            graphics.arc(0, 0, radius, Phaser.Math.DegToRad(360 * rates.win), Phaser.Math.DegToRad(360 * rates.win + 360 * rates.lose), false, 0.02);
            graphics.strokePath();

            graphics.lineStyle(width, 0xffffff00);

            graphics.beginPath();
            graphics.arc(0, 0, radius, Phaser.Math.DegToRad(360 * rates.win + 360 * rates.lose), Phaser.Math.DegToRad(360 * rates.win + 360 * rates.lose + 360 * rates.draw), false, 0.02);
            graphics.strokePath();

            graphic.add(graphics);
            profile.add(graphic);

            graphic.add(this.add.text(0, -20, `${Math.floor(rates.win * 100)}%`, {
                fontFamily: 'Arial',
                fontSize: 50,
                color: '#000000'
            }).setOrigin(0.5, 0.5));

            graphic.add(this.add.text(0, 30, `${results.user.win}W / ${results.user.lose}L / ${results.user.draw}D`, {
                fontFamily: 'Arial',
                fontSize: 20,
                color: '#000000'
            }).setOrigin(0.5, 0));
        });
    }

    rates(user) {
        var total = user.win + user.lose + user.draw;
        if (total == 0) {
            return {
                win: 0,
                lose: 0,
                draw: 0
            }
        }
        return {
            win: user.win / total,
            lose: user.lose / total,
            draw: user.draw / total,
        }
    }

    close() {
        this.scene.stop("ProfileScene");
    }
}