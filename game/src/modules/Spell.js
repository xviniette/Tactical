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
        this.initialCooldown = 0;

        this.incompatibleSpells = [];

        this.effects = [];

        this.historic = [];

        //AI
        this.type = Spell.spellType().opponent;

        this.init(json);

        this.cooldown = this.initialCooldown;
    }

    init(json = {}) {
        for (var i in json) {
            this[i] = json[i];
        }
    }

    static spellType() {
        return {
            "opponent": 0,
            "ally": 1,
            "invocation": 2,
            "movement": 3
        }
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

    inRange(x1, y1, x2 = undefined, y2 = undefined) {
        if (x2 == undefined || y2 == undefined) {
            x2 = x1;
            y2 = y1;

            x1 = this.entity.x;
            y1 = this.entity.y;
        }

        var range = Math.abs(x2 - x1) + Math.abs(y2 - y1);
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

    inLimitation(x1, y1, x2 = undefined, y2 = undefined) {
        if (x2 == undefined || y2 == undefined) {
            x2 = x1;
            y2 = y1;

            x1 = this.entity.x;
            y1 = this.entity.y;
        }

        if (!this.inLine && !this.inDiagonal) {
            return true;
        }

        if (this.inLine && (x1 == x2 || y1 == y2)) {
            return true;
        }

        if (this.inDiagonal && (Math.abs(x2 - x1) == Math.abs(y2 - y1))) {
            return true;
        }

        return false;
    }

    inLineOfSight(x1, y1, x2 = undefined, y2 = undefined) {
        if (x2 == undefined || y2 == undefined) {
            x2 = x1;
            y2 = y1;

            x1 = this.entity.x;
            y1 = this.entity.y;
        }

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
        for (var i = 0; i < pts.length - 1; i++) {
            var pt = pts[i];
            if (map[pt.x][pt.y] == 1 || this.fight.entities.find((e) => { return e.x == pt.x && e.y == pt.y && e.id != this.entity.id })) {
                return false;
            }
        }
        return true;
    }

    getAoeTiles(x1, y1, x2 = undefined, y2 = undefined) {
        if (x2 == undefined || y2 == undefined) {
            x2 = x1;
            y2 = y1;

            x1 = this.entity.x;
            y1 = this.entity.y;
        }

        var angle = Math.atan2(y2 - y1, x2 - x1);

        var centerX = Math.floor((this.aoe.length - 1) / 2);
        var centerY = Math.floor((this.aoe[0].length - 1) / 2);

        var tiles = [];
        for (var i = 0; i < this.aoe.length; i++) {
            for (var j = 0; j < this.aoe[i].length; j++) {
                if (this.aoe[i][j] != 1) {
                    continue;
                }

                var distance = Math.sqrt(Math.pow(i - centerX, 2) + Math.pow(j - centerY, 2));
                var oldAngle = Math.atan2(j - centerY, i - centerX);

                var rotatedI = Math.round(distance * Math.cos(oldAngle + angle));
                var rotatedJ = Math.round(distance * Math.sin(oldAngle + angle));

                var cx = x2 + rotatedI;
                var cy = y2 + rotatedJ;

                if (!this.fight.map.isCell(cx, cy)) {
                    continue;
                }

                tiles.push({
                    x: cx,
                    y: cy
                });
            }
        }
        return tiles;
    }

    getAffectedEntities(tiles = [], x = undefined, y = undefined) {
        var entities = this.fight.entities;
        var affectedEntities = [];

        for (var entity of entities) {
            if (tiles.find((tile) => {
                if (x != undefined && y != undefined && entity.id == this.entity.id) {
                    return tile.x == x && tile.y == y;
                } else {
                    return tile.x == entity.x && tile.y == entity.y;
                }
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
                        cell.castable = true;
                    }
                    castableCells.push(cell);
                }
            }
        }

        return castableCells;
    }

    //Check
    canUse(AP = undefined, MP = undefined) {
        var characteristics = this.entity.getCharacteristics();
        if (AP == undefined) {
            AP = characteristics.ap;
        }

        if (MP == undefined) {
            MP = characteristics.mp;
        }

        if (this.apCost > 0 && this.apCost > AP) {
            return false;
        }

        if (this.mpCost > 0 && this.mpCost > MP) {
            return false;
        }

        return true;
    }

    checkCooldown() {
        //cooldown
        if (this.cooldown > 0) {
            //Initial
            if (this.cooldown > this.fight.turn) {
                return false;
            }

            if (this.historic.find((history) => {
                return history.turn <= this.fight.turn - this.cooldown;
            })) {
                return false;
            }
        }

        //turn cast
        if (this.turnCast > 0) {
            var turnCasted = this.historic.filter((history) => {
                return history.turn == this.fight.turn;
            });

            if (turnCasted.length >= this.turnCast) {
                return false;
            }
        }

        return true;
    }

    getCooldown() {
        if (this.cooldown > 0) {
            //Initial
            if (this.cooldown > this.turn.fight) {
                return this.cooldown - this.fight.turn;
            }

            var lastCast = this.historic.find((history) => {
                return history.turn <= this.fight.turn - this.cooldown;
            });

            if (lastCast) {
                return lastCast.turn + this.cooldown - this.fight.turn;
            }
        }

        return 0;
    }

    checkCooldownCell(x, y) {
        if (this.targetCast > 0) {
            var targetCasted = this.historic.filter((history) => {
                return history.turn == this.fight.turn && history.x == x && history.y == y;
            });

            if (targetCasted.length >= this.targetCast) {
                return false;
            }
        }

        return true;
    }

    fastCastCheck(x1, y1, x2 = undefined, y2 = undefined) {
        if (x2 == undefined || y2 == undefined) {
            x2 = x1;
            y2 = y1;

            x1 = this.entity.x;
            y1 = this.entity.y;
        }

        if (!this.fight.map.isCell(x2, y2)) {
            return false;
        }

        if (!this.inRange(x1, y1, x2, y2)) {
            return false;
        }

        if (!this.inLimitation(x1, y1, x2, y2)) {
            return false;
        }

        return true;
    }

    checkCast(x1, y1, x2 = undefined, y2 = undefined, needFastCheck = true) {
        if (x2 == undefined || y2 == undefined) {
            x2 = x1;
            y2 = y1;

            x1 = this.entity.x;
            y1 = this.entity.y;
        }

        if (!this.canUse()) {
            return false;
        }

        if (needFastCheck && !this.fastCastCheck(x1, y1, x2, y2)) {
            return false;
        }

        if (!this.checkCooldown()) {
            return false;
        }

        if (!this.checkCooldownCell(x2, y2)) {
            return false;
        }

        if (this.freeCell && !this.isFree(x2, y2)) {
            return false;
        }

        if (this.takenCell && !this.isTaken(x2, y2)) {
            return false;
        }

        if (this.los && !this.inLineOfSight(x1, y1, x2, y2)) {
            return false;
        }

        return true;
    }

    //use
    cast(x1, y1, x2 = undefined, y2 = undefined, execute = true) {
        if (x2 == undefined || y2 == undefined) {
            x2 = x1;
            y2 = y1;

            x1 = this.entity.x;
            y1 = this.entity.y;
        }

        this.getComputedMaxRange();

        if (!this.checkCast(x1, y1, x2, y2)) {
            return false;
        }

        if (execute) {
            this.entity.currentCharacteristics.usedAP += this.apCost;
            this.entity.currentCharacteristics.usedMP += this.mpCost;
        }

        var aiScore = 0;

        //Entities
        for (var entity of this.getAffectedEntities(this.getAoeTiles(x1, y1, x2, y2), x1, y1)) {
            for (var effect of this.effects) {
                if (Effects[effect.effect]) {
                    var e = new (Effects[effect.effect])(Object.assign({
                        fight: this.fight,
                        spell: this,
                        source: this.entity,
                        target: entity,
                        x: x2,
                        y: y2,
                        cx: entity.x,
                        cy: entity.y
                    }, effect));

                    if (execute) {
                        e.cast();
                    } else {
                        aiScore += e.ai();
                    }
                }
            }
        }

        //Tiles
        for (var tile of this.getAoeTiles(x1, y1, x2, y2)) {
            for (var effect of this.effects) {
                if (Effects[effect.effect]) {
                    var e = new (Effects[effect.effect])(Object.assign({
                        fight: this.fight,
                        spell: this,
                        source: this.entity,
                        x: x2,
                        y: y2,
                        cx: tile.x,
                        cy: tile.y
                    }, effect));

                    if (execute) {
                        e.cast();
                    } else {
                        aiScore += e.ai();
                    }
                }
            }
        }

        if (execute) {
            this.historic.push({
                turn: this.fight.turn,
                x: x2,
                y: y2
            });
        }

        return aiScore;
    }

}