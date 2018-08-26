"use strict";

export default class Entity {
    constructor(json) {
        this.fight;

        this.id = Math.random().toString(36).substr(2, 9);

        this.x = 0;
        this.y = 0;

        this.team;

        this.defaultCharacteristics = {
            ap: 6,
            mp: 3,
            life: 100000,
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

        this.init(json);
    }

    init(json = {}) {
        for (var i in json) {
            this[i] = json[i];
        }
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

        console.log(tile);

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

            for (var i = x - 1; i <= x + 1; i++) {
                for (var j = y - 1; j <= y + 1; j++) {
                    if (Math.abs(x - i) + Math.abs(y - j) == 1) {
                        var entity = this.fight.entities.find((e) => {
                            return e.x == i && e.y == j && e.team != this.team;
                        });

                        if (entity) {
                            left *= Math.max(0, Math.min(1, (characteristics.dodge + 2) / (2 * (entity.getCharacteristics().lock + 2))));
                        }
                    }
                }
            }
            return Math.min(1, Math.max(0, 1 - left));
        }

        var processTile = (parentTile) => {
            for (var a = 0; a < Math.PI * 2; a += Math.PI / 2) {
                var tile = { x: parentTile.x + Math.round(Math.cos(a)), y: parentTile.y + Math.round(Math.sin(a)) };

                //mp
                if (parentTile.path.length >= MP) {
                    continue;
                }

                //start
                if (tile.x == this.x && tile.y == this.y) {
                    continue;
                }

                //map problem
                if (mapTiles[tile.x] == undefined || mapTiles[tile.x][tile.y] == undefined || mapTiles[tile.x][tile.y] != 0) {
                    continue;
                }

                //Entity on tile
                if (this.fight.entities.find((e) => {
                    return e.x == tile.x && e.y == tile.y;
                })) {
                    continue;
                }

                //loss
                var t = { x: tile.x, y: tile.y, path: [...parentTile.path, [{ x: tile.x, y: tile.y }]], usedMP: parentTile.usedMP + Math.round(parentTile.loss * (MP - parentTile.usedMP)), usedAP: parentTile.usedAP + Math.round(parentTile.loss * (AP - parentTile.usedAP)), loss: getDodgeLoss(tile.x, tile.y) };
                t.reachable = t.usedMP < MP;
                if (t.reachable) {
                    t.usedMP += 1;
                }

                //exist
                var existingTile = tiles.findIndex((t) => {
                    return t.x == tile.x && t.y == tile.y
                });

                if (existingTile != -1) {
                    if (tiles[existingTile].usedMP > t.usedMP) {
                        tiles[existingTile] = t;
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

        if(needStartTile){
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