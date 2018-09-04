"use strict";
import Element from "./Element.js"

export default class Entity extends Element {
    constructor(json) {
        super();

        this.fight;

        this.id = Math.random().toString(36).substr(2, 9);

        this.x = 0;
        this.y = 0;

        this.team;

        this.defaultCharacteristics = {
            ap: 6,
            mp: 6,
            life: 100,
            erosion: 10,
            initiative: 0,
            power: 0,
            damage: 0,
            range: 0,
            dodge: 100,
            lock: 0
        }

        this.currentCharacteristics = {
            damageTaken: 0,
            erosionTaken: 0,
            usedAP: 0,
            usedMP: 0
        }

        this.characteristics = {};

        this.spells = [];
        this.items = [];
        this.effects = [];

        this.sprite;
    }

    play() {

    }

    getCharacteristics() {
        var characteristics = JSON.parse(JSON.stringify(this.defaultCharacteristics));

        for (var effect of this.effects) {
            if (effect.characteristic) {
                if (characteristics[effect.characteristic]) {
                    characteristics[effect.characteristic] += effect.value;
                } else {
                    characteristics[effect.characteristic] = effect.value;
                }
            }
        }

        //Current characteristics
        characteristics.life < 1 ? 1 : characteristics.life;
        characteristics.maxLife = Math.max(1, characteristics.life - this.currentCharacteristics.erosionTaken);
        characteristics.currentLife = Math.min(characteristics.life - this.currentCharacteristics.damageTaken, characteristics.maxLife);

        characteristics.ap -= this.currentCharacteristics.usedAP;
        characteristics.mp -= this.currentCharacteristics.usedMP;

        this.characteristics = characteristics;
        return characteristics;
    }

    cast(spellId, x, y) {
        if (!this.myTurn()) {
            return false;
        }

        var spell = this.spells.find((s) => {
            return s.id == spellId;
        });

        if (spell) {
            spell.cast(x, y);
        }

        return false;
    }

    move(x, y) {
        if (!this.myTurn()) {
            return false;
        }

        var moveTiles = this.getMovementTiles();
        var tile = moveTiles.find((t) => {
            return t.x == x && t.y == y;
        })

        if (!tile) {
            return false;
        }

        if (!tile.reachable) {
            return false;
        }

        this.currentCharacteristics.usedMP += tile.usedMP;
        this.currentCharacteristics.usedAP += tile.usedAP;

        this.x = tile.x;
        this.y = tile.y;

        if (this.sprite) {
            var scene = this.fight.scene;
            var movementTime = 200;
            tile.path.forEach((t, index) => {
                var position = scene.getIsometricPosition(t.x, t.y);
                scene.tweens.add({
                    targets: this.sprite,
                    x: position.x,
                    y: position.y,
                    duration: movementTime,
                    delay: index * movementTime
                });
            });
        }

        return tile;
    }

    getMovementTiles(needStartTile = false) {
        var characteristics = this.getCharacteristics();
        var MP = characteristics.mp;
        var AP = characteristics.ap;
        var tiles = [];
        var mapTiles = this.fight.map.tiles;
        var toProcess = [];

        var getDodgeLoss = (x, y) => {
            var left = 1;

            this.fight.map.getEntitiesAround(x, y).filter((e) => { return e.team != this.team }).forEach((e) => {
                left *= Math.max(0, Math.min(1, (characteristics.dodge + 2) / (2 * (e.getCharacteristics().lock + 2))));
            });

            return Math.min(1, Math.max(0, 1 - left));
        }

        var processTile = (parentTile) => {
            var tilesAround = this.fight.map.getCellsAround(parentTile.x, parentTile.y);
            for (var tile of tilesAround) {
                //total mp length
                if (parentTile.path.length >= MP) {
                    continue;
                }

                //start
                if (tile.x == this.x && tile.y == this.y) {
                    continue;
                }

                //map problem
                if (!this.fight.map.isCell(tile.x, tile.y)) {
                    continue;
                }

                // //Entity on tile
                if (this.fight.map.getCellEntity(tile.x, tile.y)) {
                    continue;
                }

                //loss
                var t = {
                    x: tile.x,
                    y: tile.y,
                    path: [...parentTile.path, { x: tile.x, y: tile.y }],
                    usedMP: parentTile.usedMP + Math.round(parentTile.loss * (MP - parentTile.usedMP)) + 1,
                    usedAP: parentTile.usedAP + Math.round(parentTile.loss * (AP - parentTile.usedAP)),
                    loss: getDodgeLoss(tile.x, tile.y)
                };

                t.reachable = t.usedMP <= MP;

                //exist
                var existingTile = tiles.findIndex((t) => {
                    return t.x == tile.x && t.y == tile.y;
                });

                if (existingTile != -1) {
                    if (tiles[existingTile].usedMP > t.usedMP && tiles[existingTile].usedAP > t.usedAP) {
                        tiles[existingTile] = t;

                        var toProcessIndex = toProcess.findIndex((t) => {
                            return t.x == tile.x && t.y == tile.y;
                        });

                        if (toProcessIndex != -1) {
                            toProcess[toProcessIndex] = t;
                        } else {
                            toProcess.push(t);
                        }
                    }
                    continue;
                }

                tiles.push(t);
                toProcess.push(t);
            }
        }

        var startTile = { x: this.x, y: this.y, path: [], usedMP: 0, usedAP: 0, loss: getDodgeLoss(this.x, this.y) };

        processTile(startTile);
        while (toProcess.length > 0) {
            var t = toProcess[0];
            processTile(t);
            toProcess.splice(0, 1);
        }

        if (needStartTile) {
            tiles.unshift(startTile);
        }

        return tiles;
    }

    myTurn() {
        return this.id == this.fight.currentEntity.id;
    }

    endTurn() {
        if (this.myTurn()) {
            this.currentCharacteristics.usedAP = 0;
            this.currentCharacteristics.usedMP = 0;
            this.getCharacteristics();
            this.fight.nextEntity();
            return true;
        }

        return false;
    }

    impactLife(delta) {
        var characteristics = this.getCharacteristics();
        var value;
        if (delta <= 0) {
            value = -Math.min(Math.abs(delta), characteristics.currentLife);
            this.currentCharacteristics.damageTaken -= value;
            this.currentCharacteristics.erosionTaken -= Math.floor(value * Math.min(50, characteristics.erosion) / 100);
        } else {
            value = Math.min(Math.abs(delta), characteristics.maxLife - characteristics.currentLife);
            this.currentCharacteristics.damageTaken -= value;
        }

        return value;
    }

}