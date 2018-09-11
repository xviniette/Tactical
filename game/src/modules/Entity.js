"use strict";

import Element from "./Element.js"
import GameEvent from "./GameEvent.js"

export default class Entity extends Element {
    constructor(json) {
        super();

        this.fight;

        this.id = Math.random().toString(36).substr(2, 9);

        this.x = 0;
        this.y = 0;

        this.alive = true;

        this.team;

        this.defaultCharacteristics = {
            ap: 6,
            mp: 6,
            life: 100,
            erosion: 10,
            initiative: 0,
            power: 0,
            damage: 0,
            healPower: 0,
            heal: 0,
            armor: 0,
            resistance: 0,
            range: 0,
            dodge: 0,
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

        this.sprite;
    }

    play() {

    }

    getCharacteristics() {
        var characteristics = JSON.parse(JSON.stringify(this.defaultCharacteristics));

        //characteristics limits
        characteristics.life = Math.max(1, characteristics.life);
        characteristics.erosion = Math.min(50, characteristics.erosion);
        characteristics.power = Math.max(0, characteristics.power);
        characteristics.damage = Math.max(0, characteristics.damage);
        characteristics.armor = Math.min(100, characteristics.armor);
        characteristics.lock = Math.max(0, characteristics.lock);
        characteristics.dodge = Math.max(0, characteristics.dodge);

        //Current characteristics
        characteristics.maxLife = Math.max(1, characteristics.life - this.currentCharacteristics.erosionTaken);
        characteristics.currentLife = Math.min(characteristics.life - this.currentCharacteristics.damageTaken, characteristics.maxLife);

        characteristics.ap -= this.currentCharacteristics.usedAP;
        characteristics.mp -= this.currentCharacteristics.usedMP;

        this.characteristics = characteristics;

        if (this.alive && this.characteristics.currentLife <= 0) {
            this.alive = false;
            this.die();
        }
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
        });

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

        GameEvent.send({
            type: "move",
            tile: tile,
            entity: this.id
        });

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

            this.fight.map.getEntitiesAround(x, y).filter((e) => {
                return e.team != this.team
            }).forEach((e) => {
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
                    path: [...parentTile.path, {
                        x: tile.x,
                        y: tile.y
                    }],
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

        var startTile = {
            x: this.x,
            y: this.y,
            path: [],
            usedMP: 0,
            usedAP: 0,
            loss: getDodgeLoss(this.x, this.y)
        };

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

    die() {
        if (this.fight.isOver()) {
            this.fight.end();
        }

        if (this.myTurn()) {
            this.fight.nextEntity();
        }
    }

    myTurn() {
        return this.id == this.fight.currentEntity.id;
    }

    startTurn() {
        GameEvent.send({
            type: "turn",
            entity: this
        });

        this.fight.effects.filter((e) => {
            return e.target.id == this.id
        }).forEach((e) => {
            e.targetStart();
        });

        this.fight.effects.filter((e) => {
            return e.source.id == this.id
        }).forEach((e) => {
            e.sourceStart();
        });

        this.play();
    }

    endTurn() {
        if (this.myTurn()) {
            this.fight.effects.filter((e) => {
                return e.target.id == this.id
            }).forEach((e) => {
                e.targetEnd();
            });

            this.fight.effects.filter((e) => {
                return e.source.id == this.id
            }).forEach((e) => {
                e.sourceEnd();
            });

            this.currentCharacteristics.usedAP = 0;
            this.currentCharacteristics.usedMP = 0;
            this.getCharacteristics();
            this.fight.nextEntity();
            return true;
        }

        return false;
    }
}