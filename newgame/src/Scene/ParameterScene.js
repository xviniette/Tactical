import config from "../config"
import hello from '../auth'

export default class ParameterScene extends Phaser.Scene {
    constructor(test) {
        super({
            key: 'ParameterScene'
        });

        this.key = null;

        this.size = {
            width: 600,
            height: 500
        }
    }

    create() {
        this.controller = this.scene.get("Controller");

        var container = this.add.container(this.sys.game.config.width / 2 - this.size.width / 2, this.sys.game.config.height / 2 - this.size.height / 2);
        container.setVisible(false);

        this.add.text(this.sys.game.config.width - 10, 10, 'PARAMETERS', {
            fontFamily: 'Arial',
            fontSize: 30,
            color: '#ff0000'
        }).setOrigin(1, 0).setInteractive({
            useHandCursor: true
        }).on('pointerup', pointer => {
            container.visible = !container.visible;
        });


        var graphics = this.add.graphics();
        graphics.fillStyle(0xffffff, 1);
        graphics.fillRoundedRect(0, 0, this.size.width, this.size.height, 30);
        container.add(graphics);

        container.add(this.add.text(this.size.width - 25, 25, 'X', {
            fontFamily: 'Arial',
            fontSize: 64,
            color: '#000000'
        }).setOrigin(1, 0).setInteractive({
            useHandCursor: true
        }).on('pointerup', pointer => {
            container.setVisible(false);
        }));

        var controls = JSON.parse(JSON.stringify(this.controller.controls));

        for (var key in controls) {
            controls[key] = {
                keycode: controls[key]
            }
        }

        var i = 0;
        for (var key in controls) {
            container.add(this.add.text(10, i * 30, key, {
                fontFamily: 'Arial',
                fontSize: 25,
                color: '#000000'
            }));

            var text = this.add.text(100, i * 30, controls[key].key, {
                fontFamily: 'Arial',
                fontSize: 25,
                color: '#000000',
                keyCode: key
            }).setInteractive({
                useHandCursor: true
            }).on('pointerdown', function (event) {
                console.log(this);
            });

            container.add(text);
            i++;
        }

        this.input.keyboard.on('keydown', event => {
            if (this.key) {
                console.log(event);
            }
        });

        if (this.controller.user) {
            container.add(this.add.text(this.size.width / 2, this.size.height - 20, "Disconnect", {
                fontFamily: 'Arial',
                fontSize: 25,
                color: '#000000',
                keyCode: key
            }).setOrigin(0.5, 1).setInteractive({
                useHandCursor: true
            }).on('pointerdown', event => {
                localStorage.removeItem(config.tokenKey);
                localStorage.removeItem("hello");
                this.controller.user = null;
                this.controller.setTutorial();
            }));
        }
    }
}