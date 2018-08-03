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
            life: 100,
            erosion: 10,
            initiative: 0,
            power: 0,
            damage: 0,
            range: 0,
        }

        this.currentCharacteristics = {
            damageTaken: 0,
            erosionTaken: 0,
            usedAp: 0,
            usedMp: 0
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

        characteristics.ap -= this.currentCharacteristics.usedAp;
        characteristics.mp -= this.currentCharacteristics.usedMp;

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
        var path = moveTiles.find((tile) => {
            return tile.x == x && tile.y == y;
        })

        if (!path) {
            return false;
        }

        if (path.path.length > this.getCharacteristics().mp) {
            return false;
        }

        this.currentCharacteristics.usedMp += path.path.length;

        this.x = path.x;
        this.y = path.y;

        return path.path;
    }

    getMovementTiles() {
        var MP = this.getCharacteristics().mp;
        var tiles = [];
        var mapTiles = this.fight.map.tiles;
        var toProcess = [];

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

                //exist
                if (tiles.find((t) => {
                    return t.x == tile.x && t.y == tile.y
                })) {
                    continue;
                }

                var t = { x: tile.x, y: tile.y, path: [...parentTile.path, [{ x: tile.x, y: tile.y }]] };

                tiles.push(t);
                toProcess.push(t);
            }
        }

        processTile({ x: this.x, y: this.y, path: [] });
        while (toProcess.length > 0) {
            var t = toProcess[0];
            processTile(t);
            toProcess.splice(0, 1);
        }
        return tiles;
    }

    myTurn() {
        return this.id == this.fight.currentEntity.id;
    }

    endTurn() {
        if (this.myTurn()) {
            this.currentCharacteristics.usedAp = 0;
            this.currentCharacteristics.usedMp = 0;
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