import assets from "../assets.json";

var BAR_HEIGHT = 50;
export default class PreloaderScene extends Phaser.Scene {
    constructor(test) {
        super({
            key: 'PreloaderScene'
        });
    }

    preload() {
        for (var type in assets) {
            for (var assetName in assets[type]) {
                if (assets[type][assetName].options) {
                    this.load[type](assetName, `assets/${assets[type][assetName].url}`, assets[type][assetName].options);
                } else {
                    this.load[type](assetName, `assets/${assets[type][assetName].url}`);
                }
            }
        }

        var gameConfig = this.sys.game.config;
        var width = gameConfig.width;
        this.bar = this.add.graphics({
            x: gameConfig.width / 2 - width / 2,
            y: gameConfig.height / 2
        })
        this.bar.fillStyle(0xAEAEAE, 1);
        this.bar.fillRect(0, -(BAR_HEIGHT / 2), width, BAR_HEIGHT);

        this.load.on('progress', this.updateProgressDisplay, this);
    }

    create() {
        this.anims.create({
            key: "warph",
            frames: this.anims.generateFrameNumbers("warph"),
            frameRate: 20,
            yoyo: true,
            repeat: -1
        });

        this.anims.create({
            key: "warpv",
            frames: this.anims.generateFrameNumbers("warpv"),
            frameRate: 20,
            yoyo: true,
            repeat: -1
        });

        this.anims.create({
            key: "grass",
            frames: this.anims.generateFrameNumbers("grass"),
            frameRate: 5,
            yoyo: true,
            repeat: -1
        });

        this.anims.create({
            key: "explosion",
            frames: this.anims.generateFrameNumbers("explosion", {
                frames: [0, 1, 1, 1, 1, 2, 3, 4, 5, 6, 7]
            }),
            frameRate: 40,
        });

        this.anims.create({
            key: "bomb",
            frames: this.anims.generateFrameNumbers("bomb"),
            frameRate: 10,
            repeat: -1
        });

        this.load.off('progress', this.updateProgressDisplay, this);
        this.scene.start("Controller");
    }

    updateProgressDisplay(pct) {
        this.bar.clear()
            .fillStyle(0x50576B, 1)
            .fillRect(0, -(BAR_HEIGHT / 2), this.sys.game.config.width, BAR_HEIGHT)
            .fillStyle(0xFFFFFF, 1)
            .fillRect(0, -(BAR_HEIGHT / 2), Math.round(this.sys.game.config.width * pct), BAR_HEIGHT)
    }
}