import assetFiles from "../assets.json";

class BootScene extends Phaser.Scene {
    constructor(test) {
        super({
            key: 'BootScene'
        });
    }

    preload() {
        const progress = this.add.graphics();

        this.load.on('progress', (value) => {
            progress.clear();
            progress.fillStyle(0xffffff, 1);
            progress.fillRect(0, this.sys.game.config.height / 2, this.sys.game.config.width * value, 60);
        });

        this.load.on('complete', () => {
            progress.destroy();
            this.scene.start('GameScene');
        });

        for (var type in assetFiles) {
            for (var assetName in assetFiles[type]) {
                var path = assetFiles[type][assetName];
                if (typeof assetFiles[type][assetName] == "object") {
                    path = assetFiles[type][assetName].path;
                }

                switch (type) {
                    case "image":
                        this.load.image(assetName, path);
                        break;

                    default:
                        break;
                }
            }
        }
    }
}

export default BootScene;
