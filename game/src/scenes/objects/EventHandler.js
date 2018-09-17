import COLORS from "../COLORS.json"

export default class EventHandler {
    constructor(data = {}) {
        this.scene;

        this.delayManager = [];

        this.timeWait = 0;

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
        console.log("delay", Math.max(0, this.timeWait - Date.now()));
        this.scene.time.addEvent({
            delay: Math.max(0, this.timeWait - Date.now()),
            callback() {
                console.log("EXECUTE");
                data.entity[data.func](data.params);
                data.callback();
            }
        });
    }

    getDelay(start = false) {
        var attr = "end";
        if (start) {
            attr = "start";
        }
        var now = Date.now();
        for (var i = this.delayManager.length - 1; i >= 0; i--) {
            if (this.delayManager[i].block && this.delayManager[i].end > now) {
                return Math.max(0, this.delayManager[i][attr] - now);
            }
        }
        return 0;
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

        this.timeWait = Date.now() + data.tile.path.length * tileDuration;
    }

    textEffect(data = {}, delay = 0) {
        var position = this.scene.getIsometricPosition(data.x, data.y);
        var text = this.scene.add.text(position.x, position.y - 80, data.value, {
            fontSize: "30px",
            color: COLORS[data.characteristic] ? COLORS[data.characteristic] : "#FFFFFF",
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
        var delay = 0;
        var myDelays = this.delayManager;

        for (var i = myDelays.length - 1; i >= 0; i--) {
            if (myDelays[i].block) {
                delay = myDelays[i].start - Date.now();
                break;
            }
        }

        this.scene.time.addEvent({
            delay: delay,
            callback() {
                if (data.characteristics && data.entity && data.entity.sprite) {
                    data.entity.sprite.setCharacteristics(data.characteristics);
                }
            }
        });

        var d = myDelays.slice(i).filter((delay) => {
            return delay.data.entity.id == data.entity.id
        });



        //Multiple buff text
        delay += d.length * 1000 + 250;

        this.textEffect(data, delay);

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

        this.timeWait = Date.now() + 2000;
    }

    teleport(data) {
        var delay = this.getDelay(true);
        var position = this.scene.getIsometricPosition(data.x, data.y);

        this.scene.tweens.add({
            targets: data.entity.sprite,
            x: position.x,
            y: position.y,
            ease: 'Expo.easeInOut',
            delay: delay,
            duration: 100,
        });
    }

    moved(data) {
        var delay = this.getDelay(true);
        var position = this.scene.getIsometricPosition(data.x, data.y);

        this.scene.tweens.add({
            targets: data.entity.sprite,
            x: position.x,
            y: position.y,
            ease: 'Expo.easeInOut',
            delay: delay,
            duration: 200,
        });
    }

    turn(data) {
        var delay = this.getDelay();

        var f = (() => {
            return () => {
                var d = data;
                this.scene.fight.entities.forEach((entity) => {
                    entity.sprite.turnIndicator.setVisible(false);
                });

                d.entity.sprite.turnIndicator.setVisible(true);
            }
        })();

        this.scene.time.addEvent({
            delay: delay,
            callback: f
        });
    }
}