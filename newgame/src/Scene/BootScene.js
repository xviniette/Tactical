import http from "../http";

export default class BootScene extends Phaser.Scene {
    constructor(test) {
        super({
            key: 'BootScene'
        });
    }

    create() {
        this.scene.start('PreloaderScene');
    }
}