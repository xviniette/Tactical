import Fight from "../modules/Fight.js";
import Map from "../modules/Map.js";
import Player from "../modules/Player.js";
import AI from "../modules/AI.js";
import Spell from "../modules/Spell.js";

import assetFiles from "../assets.json";
import spells from "../spells.json";

class GameScene extends Phaser.Scene {
    constructor(config) {
        super({ key: 'GameScene' });

        this.tilesize = { x: 80, y: 40 };
        this.offset = { x: 400, y: 100 };
        this.scaleValue = 1;
        this.isoMouse = { x: 0, y: 0 };

        this.world;
        this.tiles;
        this.ui = {}

        this.fight;
        this.me = 0;
        this.selected = {
            spell: null,
            entity: null
        }
    }

    create() {
        this.setGame();
        this.setGameRenderer();

        this.input.on('pointerdown', () => {
            console.log(this.isoMouse.x, this.isoMouse.y);
            this.action(this.isoMouse.x, this.isoMouse.y);
        });
    }

    setGame() {
        this.fight = new Fight({ scene: this });
        this.fight.map = new Map({ fight: this.fight });
        this.fight.entities = [
            new Player({
                id: 0,
                name: "ElBazia",
                x: 7,
                y: 9,
                fight: this.fight,
                team: 1,
                defaultCharacteristics: {
                    life: 700,
                    mp: 8
                }
            }),
            new AI({
                name: "AI",
                x: 9,
                y: 9,
                fight: this.fight,
                team: 2,
                defaultCharacteristics: { lock: 800 }
            })
        ];

        for (var entity of this.fight.entities) {
            for (var spell of spells) {
                var s = new Spell(spell);
                s.entity = entity;
                s.fight = this.fight;
                entity.spells.push(s);
            }
        }

        this.fight.start();
    }

    setGameRenderer() {
        this.setWorld();
        this.setEndTurnUI();

        this.setTiles();
    }

    setEndTurnUI() {
        this.ui.endTurn = this.add.text(500, 550, "END TURN", { color: "#ffff00" }).setInteractive();

        this.ui.endTurn.on('pointerdown', () => {
            var entity = this.fight.getEntity(this.me);
            if (entity) {
                entity.endTurn();
            }
        });
    }

    setTiles() {
        var tiles = null;
        if (this.selected.spell) {
            var entity = this.fight.getEntity(this.me);
            if (entity) {
                tiles = entity.getCastableCells();
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
            entity.sprite = this.createIsometricSprite(entity.x, entity.y, "hero")
        });
    }

    update() {
        var isoPosition = this.getTilePosition(this.input.x, this.input.y);
        if (this.isoMouse.x != isoPosition.x || this.isoMouse.y != isoPosition.y) {
            this.isoMouse = isoPosition;

            // this.setTiles();
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

        entity.move(x, y);
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

export default GameScene;
