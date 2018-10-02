import colors from "../config/colors.json"

export default class EventHandler {
    constructor(data = {}) {
        this.scene;

        this.delayManager = [];

        this.triggers = [];

        this.characteristicsDelay = {
            //entityId:timestamp last
        }

        this.init(data);
    }

    init(json) {
        for (var i in json) {
            this[i] = json[i];
        }
    }

    on(event) {
        console.log(event);
        if (this[event.type]) {
            this[event.type](event);
        }
    }

    trigger(data) {
        this.triggers.push(data);
        if (this.triggers.length == 1) {
            this.executeTrigger();
        }
    }

    executeTrigger() {
        if (this.triggers.length == 0) {
            return;
        }

        var d = this.triggers[0];

        var res = d.entity[d.action](d.params);
        d.callback();
        if (res === false) {
            this.nextTrigger();
        }
    }

    nextTrigger() {
        this.triggers.splice(0, 1);
        this.executeTrigger();
    }

    //Events
    move(data) {
        var tileDuration = 300;

        data.tile.path.forEach((t, index) => {
            var position = this.scene.getIsometricPosition(t.x, t.y);
            this.scene.tweens.add({
                targets: data.entity.sprite,
                x: position.x,
                y: position.y,
                duration: tileDuration,
                delay: index * tileDuration
            });
        });


        var _this = this;
        this.scene.time.addEvent({
            delay: data.tile.path.length * tileDuration,
            callback() {
                _this.nextTrigger();
            }
        });

    }

    endTurn() {
        this.nextTrigger();
    }

    textEffect(data = {}, delay = 0) {
        var position = this.scene.getIsometricPosition(data.x, data.y);
        var text = this.scene.add.text(position.x, position.y - 80, data.value, {
            fontSize: "30px",
            color: colors[data.characteristic] ? colors[data.characteristic] : "#FFFFFF",
            stroke: "#FFFFFF",
            strokeThickness: 5
        }).setOrigin(0.5, 0.5).setVisible(false);


        this.scene.tweens.add({
            targets: text,
            y: "-=30",
            alpha: 0,
            duration: 2000,
            delay: delay,
            onPlay() {
                text.setVisible(true);

            },
            onComplete() {
                text.destroy();
            }
        });
    }

    characteristic(data) {
        var executeTime;
        if (this.characteristicsDelay[data.entity.id] && this.characteristicsDelay[data.entity.id] > Date.now()) {
            executeTime = this.characteristicsDelay[data.entity.id] + 800;
        }else{
            executeTime = Date.now() + 200;
        }

        data.entity.sprite.updateCharacteristics();

        this.characteristicsDelay[data.entity.id] = executeTime;

        this.textEffect(data, executeTime - Date.now());

    }

    cast(data) {
        var position = this.scene.getIsometricPosition(data.x, data.y);
        var text = this.scene.add.text(position.x, position.y - 80, data.spell.name, {
            fontSize: "25px",
            color: "#f4c842",
            stroke: "#FFFFFF",
            strokeThickness: 5
        }).setOrigin(0.5, 0.5).setVisible(false);

        var spellSprite = this.scene.add.sprite(position.x, position.y - 100, "spell").setOrigin(0.5, 1).setVisible(false).setDisplaySize(50, 50);

        this.scene.tweens.add({
            targets: [text, spellSprite],
            y: "+=30",
            alpha: 0,
            duration: 3000,
            onPlay() {
                text.setVisible(true);
                spellSprite.setVisible(true);
            },
            onComplete() {
                text.destroy();
                spellSprite.destroy();
            }
        });

        var tiles = data.spell.getAoeTiles(data.sx, data.sy, data.x, data.y);

        tiles.forEach((tile) => {
            var position = this.scene.getIsometricPosition(tile.x, tile.y);
            var graphics = this.scene.add.graphics().lineStyle(2, 0xf4f142, 1).fillStyle(0xf4f142).setAlpha(0.5).beginPath();
            var tilesize = this.scene.tilesize;
            graphics.moveTo(tilesize.x / 2, 0);
            graphics.lineTo(0, tilesize.y / 2);
            graphics.lineTo(-tilesize.x / 2, 0);
            graphics.lineTo(0, -tilesize.y / 2);
            graphics.closePath().strokePath().fillPath().setX(position.x).setY(position.y).setVisible(false);

            this.scene.tweens.add({
                targets: graphics,
                alpha: 0,
                duration: 3000,
                ease: 'Sine.easeOut',
                onPlay() {
                    graphics.setVisible(true);
                },
                onComplete() {
                    graphics.destroy();
                }
            });
        });

        var _this = this;
        this.scene.time.addEvent({
            delay: 1500,
            callback() {
                _this.nextTrigger();
            }
        });
    }

    teleport(data) {
        var position = this.scene.getIsometricPosition(data.x, data.y);

        this.scene.tweens.add({
            targets: data.entity.sprite,
            x: position.x,
            y: position.y,
            ease: 'Expo.easeInOut',
            duration: 100,
        });
    }

    moved(data) {
        var position = this.scene.getIsometricPosition(data.x, data.y);

        this.scene.tweens.add({
            targets: data.entity.sprite,
            x: position.x,
            y: position.y,
            ease: 'Expo.easeInOut',
            duration: 200,
        });
    }

    startTurn(data) {
        this.scene.fight.entities.forEach((entity) => {
            entity.sprite.turnIndicator.setVisible(false);
        });

        data.entity.sprite.turnIndicator.setVisible(true);
    }
}