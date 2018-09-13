import COLORS from "../COLORS.json"

export default class EntityObject extends Phaser.GameObjects.GameObject {
    constructor(config) {
        super(config.scene, config.x, config.y);

        this.scene = config.scene;
        this.scene.add.existing(this);


        var colors = {
            "hp": "#ff0000",
            "power": "#f4aa42",
            "ap": "#52aed8",
            "mp": "#41f47a",
        }

        if (data.entity && data.characteristics) {
            data.entity.sprite.setCharacteristics(data.characteristics);
        }

        var position = this.getIsometricPosition(data.x, data.y);

        var text = this.add.text(position.x, position.y - 80, data.value, {
            fontSize: "20px",
            color: colors[data.characteristic] ? colors[data.characteristic] : "#FFFFFF"
        });

        text.setOrigin(0.5, 0.5);
        text.visible = false;

        var deltaCharac = 100;
        var delay = 0;

        for (var i = this.tweenHistoric.length - 1; i >= 0; i--) {
            if (this.tweenHistoric[i].blocking) {
                delay = this.tweenHistoric[i].startTimestamp - Date.now();
                break;
            }
        }

        delay += (this.tweenHistoric.length - i) * deltaCharac;

        this.tweens.add({
            targets: text,
            y: "-=30",
            alpha: 0,
            duration: 500,
            delay: Math.max(0, delay),
            onPlay() {
                text.visible = true;
            },
            onComplete() {
                text.destroy();
            }
        });



        return this;
    }
}