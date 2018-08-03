"use strict";

import Effects from "./effects/effects.js"

export default class Spell {
    constructor(json = {}) {
        this.fight;
        this.entity;

        this.id;
        this.name;
        this.description;

        this.apCost = 0;
        this.mpCost = 0;

        this.minRange = 1;
        this.maxRange = 1;
        this.computedMaxRange = null;
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

        this.incompatibleSpells = [];

        this.effects = [];

        this.historic = [];

        this.init(json);
    }

    init(json = {}) {
        for (var i in json) {
            this[i] = json[i];
        }
    }

    isCell(x, y) {
        var map = this.fight.map.tiles;

        if (map[x] && map[x][y] == 0) {
            return true;
        }

        return false;
    }

    getComputedMaxRange() {
        if (this.boostRange) {
            var entityRange = this.entity.getCharacteristics().range;
            this.computedMaxRange = Math.max(this.minRange, this.maxRange + entityRange);
            return this.computedMaxRange;
        }

        this.computedMaxRange = this.maxRange;
        return this.computedMaxRange;
    }

    inRange(x, y) {
        var range = Math.abs(x - this.entity.x) + Math.abs(y - this.entity.y);
        return range >= this.minRange && range <= (this.computedMaxRange || this.maxRange);
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

    isTaken(x, y) {
        return !this.isFree(x, y);
    }

    inLimitation(x, y) {
        if (!this.inLine && !this.inDiagonal) {
            return true;
        }

        if (this.inLine && (x == this.entity.x || y == this.entity.y)) {
            return true;
        }

        if (this.inDiagonal && (Math.abs(x - this.entity.x) == Math.abs(y - this.entity.y))) {
            return true;
        }

        return false;
    }

    inLineOfSight(x2, y2) {
        var x1 = this.entity.x;
        var y1 = this.entity.y;

        var pts = [];

        var y = y1;
        var x = x1;

        var dx = x2 - x1;
        var dy = y2 - y1;

        var xstep, ystep;

        if (dy < 0) {
            ystep = -1;
            dy = -dy;
        } else {
            ystep = 1;
        }

        if (dx < 0) {
            xstep = -1;
            dx = -dx;
        } else {
            xstep = 1;
        }

        var ddy = 2 * dy;
        var ddx = 2 * dx;

        if (ddx >= ddy) {
            var errorprev = dx;
            var error = dx;
            for (var i = 0; i < dx; i++) {
                x += xstep;
                error += ddy;
                if (error > ddx) {
                    y += ystep;
                    error -= ddx;

                    if (error + errorprev < ddx) {
                        pts.push({ 'x': x, 'y': y - ystep });
                    } else if (error + errorprev > ddx) {
                        pts.push({ 'x': x - xstep, 'y': y });
                    }
                }
                pts.push({ 'x': x, 'y': y });
                errorprev = error;
            }
        } else {
            errorprev = dy;
            error = dy;
            for (var i = 0; i < dy; i++) {
                y += ystep;
                error += ddx;
                if (error > ddy) {
                    x += xstep;
                    error -= ddy;
                    if (error + errorprev < ddy) {
                        pts.push({ 'x': x - xstep, 'y': y });
                    } else if (error + errorprev > ddy) {
                        pts.push({ 'x': x, 'y': y - ystep });
                    }
                }
                pts.push({ 'x': x, 'y': y });
                errorprev = error;
            }
        }

        //ON BOOLEEN
        var map = this.fight.map.tiles;
        for (var pt of pts) {
            if (map[pt.x][pt.y] == 1) {
                return false;
            }
        }
        return true;
    }

    getAoeTiles(x, y) {
        console.log(x, y);
        var tiles = [];
        for (var i = 0; i < this.aoe.length; i++) {
            for (var j = 0; j < this.aoe[i].length; j++) {
                if (this.aoe[i][j] != 1) {
                    continue;
                }

                var cx = x + i - Math.floor(this.aoe.length / 2);
                var cy = y + j - Math.floor(this.aoe[i].length / 2);

                if (!this.isCell(cx, cy)) {
                    continue;
                }

                tiles.push({
                    x: cx,
                    y: cy
                });
            }
        }

        console.log(tiles);
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

    getCastableCells() {
        this.getComputedMaxRange();

        var castableCells = [];
        var tiles = this.fight.map.tiles;
        for (var x = 0; x < tiles.length; x++) {
            for (var y = 0; y < tiles[x].length; y++) {
                if (this.fastCastCheck(x, y)) {
                    var cell = { x: x, y: y };
                    if (this.checkCast(x, y, false)) {
                        cell.cast = true;
                    }
                    castableCells.push(cell);
                }
            }
        }

        return castableCells;
    }

    fastCastCheck(x, y) {
        if (!this.isCell(x, y)) {
            return false;
        }

        if (!this.inRange(x, y)) {
            return false;
        }

        if (!this.inLimitation(x, y)) {
            return false;
        }

        return true;
    }

    checkCast(x, y, needFastCheck = true) {
        if (needFastCheck && !this.fastCastCheck(x, y)) {
            return false;
        }

        if (this.freeCell && !this.isFree(x, y)) {
            return false;
        }

        if (this.takenCell && !this.isTaken(x, y)) {
            return false;
        }

        if (this.los && !this.inLineOfSight(x, y)) {
            return false;
        }

        return true;
    }

    //use
    cast(x, y) {
        this.getComputedMaxRange();

        if (!this.checkCast(x, y)) {
            return false;
        }

        if (this.apCost > this.entity.getCharacteristics().ap) {
            return false;
        }

        this.entity.currentCharacteristics.usedAp += this.apCost;

        //Entities
        for (var entity of this.getAffectedEntities(x, y)) {
            for (var effect of this.effects) {
                if (Effects[effect.effect]) {
                    var e = new (Effects[effect.effect])({
                        fight: this.fight,
                        spell: this,
                        source: this.entity,
                        target: entity,
                        x: x,
                        y: y,
                        cx: entity.x,
                        cy: entity.y
                    });
                    e.onCast();
                }
            }
        }

        //Tiles
        for (var tile of this.getAoeTiles(x, y)) {
            for (var effect of this.effects) {
                if (Effects[effect.effect]) {
                    var e = new (Effects[effect.effect])({
                        fight: this.fight,
                        spell: this,
                        source: this.entity,
                        x: x,
                        y: y,
                        cx: tile.x,
                        cy: tile.y
                    });
                    e.onCast();
                }
            }
        }
    }
}