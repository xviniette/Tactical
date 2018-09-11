import Fight from "../modules/Fight.js";
import Map from "../modules/Map.js";
import Player from "../modules/Player.js";
import AI from "../modules/AI.js";
import Spell from "../modules/Spell.js";

import assetFiles from "../assets.json";
import jsonFight from "../fight.json";
import spells from "../spells.json";

export default class GameScene extends Phaser.Scene {
    constructor(config) {
        super({
            key: 'GameScene'
        });

        this.tilesize = {
            x: 120,
            y: 60
        };

        this.offset = {
            x: 500,
            y: 100
        };
        this.scaleValue = 1;
        this.isoMouse = {
            x: 0,
            y: 0
        };

        this.world;
        this.tiles;
        this.ui = {}

        this.fight;
        this.me = 0;
        this.selected = {
            spell: null,
            entity: null
        }

        this.tweenHistoric = [];
    }

    create() {
        console.log(this);
        this.setGame();
        this.setGameRenderer();

        this.input.on('pointerdown', () => {
            this.action(this.isoMouse.x, this.isoMouse.y);
        });

        document.addEventListener("GameEvent", (e) => {
            this.eventHandler(e.detail);
        });
    }

    getBlockingDelay() {
        var now = Date.now();
        for (var i = this.tweenHistoric.length - 1; i >= 0; i--) {
            if (this.tweenHistoric[i].blocking && this.tweenHistoric[i].endTimestamp > now) {
                return this.tweenHistoric[i].endTimestamp - now;
            }
        }
        return 0;
    }

    eventHandler(data = {}) {
        console.log(data);

        switch (data.type) {
            case "move":
                var entity = this.fight.getEntity(data.entity);
                if (!entity) {
                    return;
                }

                var startDelay = this.getBlockingDelay();
                var tileDuration = 300;

                data.tile.path.forEach((t, index) => {
                    var position = this.getIsometricPosition(t.x, t.y);
                    this.tweens.add({
                        targets: entity.sprite,
                        x: position.x,
                        y: position.y,
                        duration: tileDuration,
                        delay: tileDuration * index + startDelay
                    });
                });

                this.tweenHistoric.push({
                    blocking: true,
                    startTimestamp: Date.now() + startDelay,
                    endTimestamp: Date.now() + startDelay + data.tile.path.length * tileDuration
                });

                break;

            case "moved":
                var entity = this.fight.getEntity(data.entity);

                var position = this.getIsometricPosition(data.x, data.y);
                this.tweens.add({
                    targets: entity.sprite,
                    x: position.x,
                    y: position.y,
                    duration: 200,
                });
                break;

            case "cast":
                var entity = this.fight.getEntity(data.entity.id);
                if (!entity) {
                    return;
                }

                var position = this.getIsometricPosition(data.x, data.y);

                var text = this.add.text(position.x, position.y - 80, data.spell.name, {
                    fontSize: "20px"
                });
                text.setOrigin(0.5, 0.5);
                text.alpha = 0;

                var startDelay = this.getBlockingDelay();
                var castTime = 800;

                this.tweens.add({
                    targets: text,
                    y: "+=30",
                    duration: 3000,
                    delay: startDelay,
                    onPlay() {
                        text.alpha = 1;
                    },
                    onComplete() {
                        text.destroy();
                    }
                });

                var tiles = data.spell.getAoeTiles(data.sx, data.sy, data.x, data.y);

                tiles.forEach((tile) => {
                    var position = this.getIsometricPosition(tile.x, tile.y);
                    var graphics = this.add.graphics();

                    graphics.lineStyle(2, 0x0000000, 1);
                    graphics.fillStyle(0xea1e1e);
                    graphics.setAlpha(0.5);

                    graphics.beginPath();

                    graphics.moveTo(this.tilesize.x / 2, 0);
                    graphics.lineTo(0, this.tilesize.y / 2);
                    graphics.lineTo(-this.tilesize.x / 2, 0);
                    graphics.lineTo(0, -this.tilesize.y / 2);

                    graphics.closePath();
                    graphics.strokePath();
                    graphics.fillPath();

                    graphics.x = position.x;
                    graphics.y = position.y;

                    graphics.visible = false;

                    this.tweens.add({
                        targets: graphics,
                        props: {
                            alpha: {
                                value: 0,
                                duration: 3000,
                                ease: 'Sine.easeOut'
                            },
                        },
                        delay: startDelay,
                        onPlay() {
                            graphics.visible = true;
                        },
                        onComplete() {
                            graphics.destroy();
                        }
                    });
                });

                this.tweenHistoric.push({
                    blocking: true,
                    startTimestamp: Date.now() + startDelay,
                    endTimestamp: Date.now() + startDelay + castTime
                });

                break;

            case "jump":
                var entity = this.fight.getEntity(data.entity);
                var position = this.getIsometricPosition(data.x, data.y);
                this.tweens.add({
                    targets: entity.sprite,
                    x: position.x,
                    y: position.y,
                    ease: 'Expo.easeInOut',
                    duration: 100,
                });
                break;
            default:

            case "characteristic":
                var colors = {
                    "hp": "#ff0000",
                    "power": "#f4aa42",
                    "ap": "#52aed8",
                    "mp": "#41f47a",
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
                break;
        }
    }

    setGame() {
        this.fight = new Fight({
            scene: this
        });
        this.fight.map = new Map(Object.assign(jsonFight.map, {
            fight: this.fight
        }));

        for (var entity of jsonFight.players) {
            var e = new Player(Object.assign(entity, {
                fight: this.fight
            }));
            e.spells = [];
            for (var spell of entity.spells) {
                var s = new Spell(spell);
                s.fight = this.fight;
                s.entity = e;
                e.spells.push(s);
            }
            this.fight.entities.push(e);
        }

        for (var entity of jsonFight.ais) {
            var e = new AI(Object.assign(entity, {
                fight: this.fight
            }));
            e.spells = [];
            for (var spell of entity.spells) {
                var s = new Spell(spell);
                s.fight = this.fight;
                s.entity = e;
                e.spells.push(s);
            }
            this.fight.entities.push(e);
        }

        this.fight.start();
    }

    setGameRenderer() {
        this.setWorld();
        this.setUI();

        this.setTiles();
    }

    setUI() {
        var me = this.fight.getEntity(this.me);
        if (!me) {
            return;
        }

        this.ui.endTurn = this.add.text(500, 550, "END TURN", {
            color: "#ffff00"
        }).setInteractive();

        this.ui.endTurn.on('pointerdown', () => {
            var entity = this.fight.getEntity(this.me);
            if (entity) {
                entity.endTurn();
            }
        });

        this.ui.spells = this.add.container();

        this.fight.getEntity(this.me).spells.forEach((spell, index) => {
            var s = this.add.container();
            if(!spell.sprite){
                spell.sprite = "spell";
            }

            s.icon = this.add.sprite(0, 0, spell.sprite).setInteractive();
            s.add(s.icon);
            s.icon.setOrigin(0.5, 0.5);
            // var s = this.add.text(0 + index * 100, 550, spell.name, {
            //     color: "#ffff00"
            // }).setInteractive();
            s.icon.spellId = spell.id;

            s.x = index * 100;
            s.y = 500;

            var _this = this;

            s.icon.on("pointerdown", function () {
                _this.selected.spell = this.spellId;
                _this.setTiles();
            });

            this.ui.spells.add(s);
        });
    }

    setTiles() {
        var tiles = null;
        if (this.selected.spell) {
            var entity = this.fight.getEntity(this.me);
            if (entity) {
                var spell = entity.spells.find((s) => {
                    return s.id == this.selected.spell
                });
                if (spell) {
                    tiles = spell.getCastableCells();

                    var aoeTiles = spell.getAoeTiles(this.isoMouse.x, this.isoMouse.y);

                    tiles.forEach((tile) => {
                        if (tile.castable) {
                            tile.fillColor = 0x4688f2;
                        } else {
                            tile.fillColor = 0x82adf2;
                        }
                    });

                    if (tiles.find((tile) => {
                            return tile.castable && tile.x == this.isoMouse.x && tile.y == this.isoMouse.y;
                        })) {
                        aoeTiles.forEach((tile) => {
                            tile.fillColor = 0xef9c28;
                            tiles.push(tile);
                        });
                    }
                }
            }
        } else if (this.selected.entity) {

        } else {
            var entity = this.fight.getEntity(this.me);
            if (entity) {
                tiles = entity.getMovementTiles();

                tiles.forEach((tile) => {
                    if (tile.reachable) {
                        tile.fillColor = 0x29bc35;
                    } else {
                        tile.fillColor = 0xe21d1d;
                    }
                });
            }
        }

        if (!tiles) {
            return;
        }

        if (!this.tiles) {
            this.tiles = this.add.group();
        }

        this.tiles.clear(true, true);

        tiles.forEach((tile) => {
            var position = this.getIsometricPosition(tile.x, tile.y);
            var graphics = this.add.graphics();

            graphics.lineStyle(2, 0x0000000, 1);
            graphics.fillStyle(tile.fillColor ? tile.fillColor : 0xFFFFFF);
            graphics.setAlpha(0.5);

            graphics.beginPath();

            graphics.moveTo(this.tilesize.x / 2, 0);
            graphics.lineTo(0, this.tilesize.y / 2);
            graphics.lineTo(-this.tilesize.x / 2, 0);
            graphics.lineTo(0, -this.tilesize.y / 2);

            graphics.closePath();
            graphics.strokePath();
            graphics.fillPath();

            graphics.x = position.x;
            graphics.y = position.y;

            this.tiles.add(graphics);
        });
    }

    setWorld() {
        this.world = this.add.container();

        var tileAsset = assetFiles.image.tile0;
        this.scaleValue = this.tilesize.x / tileAsset.width;

        for (var i = 0; i < this.fight.map.tiles.length; i++) {
            for (var j = 0; j < this.fight.map.tiles[i].length; j++) {
                var tile = this.createIsometricSprite(i, j, "tile0");

                this.world.add(tile);

                if (this.fight.map.tiles[i][j] == 1) {
                    var tile = this.createIsometricSprite(i, j, "obstacle");
                    this.world.add(tile);
                }
            }
        }

        this.fight.entities.forEach((entity) => {
            entity.sprite = this.createIsometricSprite(entity.x, entity.y, entity.sprite);
        });
    }

    update() {
        var isoPosition = this.getTilePosition(this.input.x, this.input.y);
        if (this.isoMouse.x != isoPosition.x || this.isoMouse.y != isoPosition.y) {
            this.isoMouse = isoPosition;

            this.setTiles();
        }
    }

    action(x, y) {
        var entity = this.fight.getEntity(this.me);
        if (!entity) {
            return false;
        }

        if (!entity.myTurn()) {
            return false;
        }

        if (this.selected.spell) {
            var spell = entity.spells.find((spell) => {
                return spell.id == this.selected.spell;
            });
            if (spell) {
                spell.cast(x, y);
            }
        } else {
            entity.move(x, y);
        }

        this.selected.spell = null;
        this.setTiles();
    }

    getAssetData(assetName, type = "image") {
        if (assetFiles[type] && assetFiles[type][assetName]) {
            return assetFiles[type] && assetFiles[type][assetName];
        }

        return null;
    }

    getIsometricPosition(x, y) {
        return {
            x: (x - y) * this.tilesize.x / 2 + this.offset.x,
            y: (x + y) * this.tilesize.y / 2 + this.offset.y
        };
    }

    getTilePosition(x, y) {
        return {
            x: Math.round(((x - this.offset.x) / (this.tilesize.x / 2) + (y - this.offset.y) / (this.tilesize.y / 2)) / 2),
            y: Math.round(((y - this.offset.y) / (this.tilesize.y / 2) - (x - this.offset.x) / (this.tilesize.x / 2)) / 2)
        }
    }

    createIsometricSprite(x, y, asset) {
        var position = this.getIsometricPosition(x, y);
        var sprite = this.add.sprite(position.x, position.y, asset);
        var assetData = this.getAssetData(asset);
        sprite.setOrigin(assetData.anchorX / assetData.width, assetData.anchorY / assetData.height);
        sprite.setScale(this.scaleValue);
        return sprite;
    }
}