"use strict";

export default class Map {
    constructor(json) {
        this.fight;
        this.tiles = [
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0],
            [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        ]

        this.init(json);
    }

    init(json = {}) {
        for (var i in json) {
            this[i] = json[i];
        }
    }

    isTile(x, y) {
        if (this.tiles[x] && map[x][y] != undefined) {
            return true;
        }

        return false;
    }

    isCell(x, y) {
        if (!this.isTile(x, y)) {
            return false;
        }

        return this.tiles[x][y] == 0;
    }

    isObstable(x, y) {
        if (!this.isTile(x, y)) {
            return false;
        }

        return this.tiles[x][y] == 1;
    }

    isHole(x, y) {
        if (!this.isTile(x, y)) {
            return true;
        }

        return this.tiles[x][y] == -1;
    }

    getCellEntity(x, y) {
        if (!this.fight) {
            return null;
        }

        return this.fight.entities.find((entity) => {
            return entity.x == x && entity.y == y;
        });
    }

    isTaken(x, y) {
        return this.getCellEntity(x, y) != null;
    }

    isFree(x, y) {
        return !this.isTaken(x, y);
    }

}