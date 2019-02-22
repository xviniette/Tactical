import http from "../http";
import config from '../config';

export default class TutorialScene extends Phaser.Scene {
    constructor(test) {
        super({
            key: 'TutorialScene'
        });
    }

    create() {
        this.controller = this.scene.get("Controller");

        var title = this.add.text(0, 0, 'Bomball', {
            fontFamily: 'Arial',
            fontSize: 64,
            color: '#00ff00'
        }).setOrigin(0, 0);

        this.add.text(this.sys.game.config.width - 10, this.sys.game.config.height - 10, 'SKIP', {
            fontFamily: 'Arial',
            fontSize: 64,
            color: '#00ff00'
        }).setOrigin(1, 1).setInteractive({
            useHandCursor: true
        }).on('pointerup', pointer => {
            this.createGuest();
        });

        this.add.text(10, this.sys.game.config.height - 10, 'LOGIN', {
            fontFamily: 'Arial',
            fontSize: 64,
            color: '#00ff00'
        }).setOrigin(0, 1).setInteractive({
            useHandCursor: true
        }).on('pointerup', pointer => {
            this.controller.auth();
        });
    }

    createGuest() {
        http.post("/v1/auth/guest").then(token => {
            window.localStorage.setItem(config.tokenKey, JSON.stringify(token.data));
            this.controller.getUser((err, user) => {
                if (!err) {
                    this.controller.setHome();
                }
            });
        });
    }
}