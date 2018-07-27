"use strict";

export default class Entity {
    constructor(json) {
        this.id;

        this.x = 0;
        this.y = 0;

        this.defaultCharacteristics = {
            ap: 6,
            mp: 3,
            life: 100,
            erosion: 10,
            initiative: 0,
            power: 0,
        }

        this.currentCharacteristics = {
            damageTaken: 0,
            erosionTaken: 0,
            usedAp: 0,
            usedMp: 0
        }

        this.spells = [];
        this.equipments = [];
        this.effects = [];

        this.init(json);
    }

    init(json = {}) {
        for (var i in json) {
            this[i] = json[i];
        }
    }

    getCaracteristics() {
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
        characteristics.currentLife = Math.min(characteristics.life - damageTaken, characteristics.maxLife);

        characteristics.ap -= this.currentCharacteristics.usedAp;
        characteristics.mp -= this.currentCharacteristics.usedMp;

        return characteristics;
    }

    getMovementTiles() {
        var tiles = [];
        var mapTiles = this.fight.map.tiles;
        var toProcess = [];

        var processTile = (parentTile) => {
            for (var a = 0; a < Math.PI * 2; a += Math.PI / 2) {
                var tile = { x: parentTile.x + Math.round(Math.cos(a)), y: parentTile.y + Math.round(Math.sin(a)) };

                //mp
                if (parentTile.path.length >= this.mp) {
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

}