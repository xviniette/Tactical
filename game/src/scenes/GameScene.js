import Fight from "../modules/Fight.js";
import Map from "../modules/Map.js";
import Player from "../modules/Player.js";
import AI from "../modules/AI.js";
import Spell from "../modules/Spell.js";

import assetFiles from "../assets.json";
import jsonFight from "../fight.json";
import spells from "../spells.json";

import EntityObject from "./objects/EntityObject.js"
import SpellsObject from "./objects/SpellsObject.js"
import EndTurnObject from "./objects/EndTurnObject.js"
import SpellInfo from "./objects/SpellInfo.js"

import EventHandler from "./objects/EventHandler.js"

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

        this.eventHandler = new EventHandler({
            scene: this
        });

        this.tweenHistoric = [];
    }

    create() {
        this.cameras.main.setViewport(0, 0, this.sys.game.config.width, this.sys.game.config.height);

        document.addEventListener("GameEvent", (e) => {
            this.eventHandler.on(e.detail);
        });

        this.setGame();
        this.setGameRenderer();
        this.fight.start();


        this.input.on('pointerdown', () => {
            this.action(this.isoMouse.x, this.isoMouse.y);
        });
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

    }

    setGameRenderer() {
        this.add.image(0, 0, "background").setScale(2.5);
        this.setWorld();
        this.setUI();

        this.setTiles();
    }

    setUI() {
        var me = this.fight.getEntity(this.me);
        if (!me) {
            return;
        }

        this.ui.spellsInfo = {};
        me.spells.forEach(spell => {
            this.ui.spellsInfo[spell.id] = new SpellInfo({
                x: this.game.config.width / 2 - 150,
                y: this.game.config.height / 2 - 200,
                spell: spell,
                scene: this
            });
        });

        this.ui.spells = new SpellsObject({
            x: 75,
            y: this.game.config.height - 75,
            scene: this
        });

        this.ui.endTurn = new EndTurnObject({
            x: 900,
            y: 500,
            scene: this
        });

        //Bind
        this.input.keyboard.on('keydown', (event) => {
            var index = event.keyCode - 49;
            if (me.spells[index]) {
                this.selected.spell = me.spells[index].id;
                this.setTiles();
            }
        });
    }

    setTiles() {
        if(!this.world){
            return;
        }

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

            graphics.setDepth((tile.x + tile.y) * 1000 + 1);

            this.tiles.add(graphics);
            this.world.add(graphics);
        });
    }

    setWorld() {
        this.world = this.add.container();

        var tileAsset = assetFiles.image.tile0;
        this.scaleValue = this.tilesize.x / tileAsset.width;

        for (var i = 0; i < this.fight.map.tiles.length; i++) {
            for (var j = 0; j < this.fight.map.tiles[i].length; j++) {
                if (this.fight.map.tiles[i][j] == -1) {
                    continue;
                }
                var tile = this.createIsometricSprite(i, j, "tile0");
                tile.setDepth((i + j) * 1000);

                this.world.add(tile);

                if (this.fight.map.tiles[i][j] == 1) {
                    var tile = this.createIsometricSprite(i, j, "obstacle");
                    console.log("profondeur", (i + j) * 1000 + 500);
                    tile.setDepth((i + j) * 1000 + 500);
                    this.world.add(tile);
                }
            }
        }

        this.fight.entities.forEach((entity) => {
            var position = this.getIsometricPosition(entity.x, entity.y);
            entity.sprite = new EntityObject({
                scene: this,
                x: position.x,
                y: position.y,
                entity: entity
            });


            entity.sprite.setScale(this.scaleValue);
        });
    }

    update() {
        var isoPosition = this.getTilePosition(this.input.x, this.input.y);
        if (this.isoMouse.x != isoPosition.x || this.isoMouse.y != isoPosition.y) {
            this.isoMouse = isoPosition;

            this.setTiles();
        }

        this.fight.getAliveEntities().forEach(entity => {
            var p = this.getTilePosition(entity.sprite.x, entity.sprite.y);
            entity.sprite.updateDepth(p.x, p.y);
        });
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
                entity.trigger("cast", {
                    spell: spell.id,
                    x: x,
                    y: y
                });
            }
        } else {
            entity.trigger("move", {
                x: x,
                y: y
            });
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