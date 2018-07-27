"use strict";

class Spell {
    constructor() {
        this.entity;
        this.fight;

        this.id;
        this.name;
        this.description;

        this.apCost = 0;
        this.mpCost = 0;

        this.minRange = 1;
        this.maxRange = 1;
        this.boostRange = false;

        this.inLine = false;
        this.inDiagonal = false;

        this.los = true;

        this.freeCell = false;
        this.takenCell = false;

        this.aoe = [[1]];

        this.turnCast = 0;
        this.targetCast = 0;
        this.cooldown = 0;
        this.initialCountdown = 0;

        this.effects = [];
    }

    isCell(x, y) {
        var map = this.fight.map.tiles[x][y] == 0;
    }

    inRange(x, y) {
        var range = Math.abs(x - this.entity.x) + Math.abs(y - this.entity.y);
        return range >= this.minRange && range <= this.maxRange;
    }

    isFree(x, y) {
        var entities = this.fight.entities;
        for (var entity of entities) {
            if (entity.x == x && entity.y == y) {
                return false;
            }
        }
        return true;
    }

    inLimitation(x, y) {
        switch (this.castLimitation) {
            case "line":
                return x == this.entity.x || y == this.entity.y;
            case "diagonal":
                return Math.abs(x - this.entity.x) == Math.abs(y - this.entity.y);
            default:
                return true;
        }
    }

    inLineOfSight(x, y) {
        if (!this.los) {
            return true;
        }

        var tiles = [];
        var sx = this.entity.x;
        var sy = this.entity.y;
        var dx = x - sx;
        var dy = y - sy;
        var ystep, xstep = 1;

        if (dy < 0) {
            ystep = -1;
            dy = -dy;
        }

        if (dx < 0) {
            xstep = -1;
            dx = -dx;
        }

        if (dx * 2 >= dy * 2) {
            var errorprev, error = dx;
            for (var i = 0; i < dx; i++) {
                sx += xstep;
                error += dx * 2;
                if (error > dx * 2) {
                    y += ystep;
                    error -= dx * 2;
                    if (error + errorprev < dx * 2) {
                        tiles.push({ x: x, y: y - ystep });
                    } else if (error + errorprev > dx * 2) {
                        tiles.push({ x: x - xstep, y: y });
                    }
                }
                tiles.push({ x: x, y: y });
                errorprev = error;
            }
        } else {
            var errorprev, error = dx;
            for (var i = 0; i < dy; i++) {
                sy += ystep;
                error += dy * 2;
                if (error > dy * 2) {
                    x += xstep;
                    error -= dy * 2;
                    if (error + errorprev < dy * 2) {
                        tiles.push({ x: x - xstep, y: y });
                    } else if (error + errorprev > dy * 2) {
                        tiles.push({ x: x, y: y - ystep });
                    }
                }
                tiles.push({ x: x, y: y });
                errorprev = error;
            }
        }

        var mapTiles = this.fight.map.tiles;
        for (var tile of tiles) {
            if (mapTiles[tile.x][tile.y] == 1) {
                return false;
            }
        }

        return true;
    }

    getAoeTiles(x, y) {
        var tiles = [];
        for (var i = 0; i < this.aoe.length / 2; i++) {
            for (var j = 0; j < this.aoe[i].length; j++) {
                var cx = x + i - Math.abs(this.aoe.length / 2);
                var cy = y + j - Math.abs(this.aoe[i].length / 2);
                tiles.push({
                    x: cx,
                    y: cy
                });
            }
        }
        return tiles;
    }

    getAffectedEntities(x, y) {
        var entities = this.fight.entities;

        var tiles = this.getAoeTiles(x, y);

        var affectedEntities = [];

        for (var entity of entities) {
            if (tiles.find((tile) => {
                return tile.x == entity.x && tile.y == entity.y
            })) {
                affectedEntities.push(entity);
            }
        }

        return affectedEntities;
    }

    //use
    use(x, y) {

    }
}