import uuid from "uuid/v1"

import Effects from "./effects/Effects.js"
import GameEvent from "./GameEvent.js"
import Triggers from "./effects/Triggers.json"
import Element from "./Element"

export default class Spell extends Element {
    constructor(json = {}) {
        super(json);

        this.fight;
        this.entity;

        this.id = uuid();
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

        this.aoe = [
            [1]
        ];

        this.turnCast = 0;
        this.targetCast = 0;
        this.cooldown = 0;
        this.initialCooldown = 0;

        this.effects = [];

        this.historic = [];

        this.init(json);
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

    getAoeTiles(x1, y1, x2 = undefined, y2 = undefined) {
        if (x2 == undefined || y2 == undefined) {
            x2 = x1;
            y2 = y1;

            x1 = this.entity.x;
            y1 = this.entity.y;
        }

        var angle = Math.atan2(y2 - y1, x2 - x1);
        angle = Math.round(angle / (Math.PI / 2)) * (Math.PI / 2);

        var centerX = Math.floor((this.aoe.length - 1) / 2);
        var centerY = Math.floor((this.aoe[0].length - 1) / 2);

        var tiles = [];
        for (var i = 0; i < this.aoe.length; i++) {
            for (var j = 0; j < this.aoe[i].length; j++) {
                if (this.aoe[i][j] != 1) {
                    continue;
                }

                var distance = Math.round(Math.sqrt(Math.pow(i - centerX, 2) + Math.pow(j - centerY, 2)));
                var oldAngle = Math.atan2(j - centerY, i - centerX);
                var newAngle = oldAngle + angle;

                var rotatedI = Math.round(distance * Math.cos(newAngle));
                var rotatedJ = Math.round(distance * Math.sin(newAngle));

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
        var entities = this.fight.getAliveEntities();
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
                    var cell = {
                        x: x,
                        y: y
                    };
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
        //Initial cd
        if (this.initialCooldown > 0) {
            if (this.initialCooldown >= this.fight.turn) {
                return false;
            }
        }

        //cooldown
        if (this.cooldown > 0) {
            if (this.historic.find((history) => {
                    return history.turn >= this.fight.turn - this.cooldown;
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

        if (this.freeCell && !this.fight.map.isFree(x2, y2)) {
            return false;
        }

        if (this.takenCell && !this.fight.map.isTaken(x2, y2)) {
            return false;
        }

        if (this.los && !this.fight.map.inLineOfSight(x1, y1, x2, y2, true, this.entity.id)) {
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
            GameEvent.send({
                type: "cast",
                spell: this,
                entity: this.entity,
                x: x2,
                y: y2,
                sx: x1,
                sy: y1
            });

            this.entity.currentCharacteristics.usedAP += this.apCost;
            this.entity.currentCharacteristics.usedMP += this.mpCost;

            var historic = {
                turn: this.fight.turn,
                x: x2,
                y: y2,
            };
        }

        var aiScore = 0;

        var tiles = this.getAoeTiles(x1, y1, x2, y2);
        var entities = this.getAffectedEntities(tiles, x1, y1);

        this.effects.forEach((effect) => {
            if (!Effects[effect.effect]) {
                return;
            }

            if (!effect.target) {
                effect.target = "";
            }

            var affectedTiles = [...tiles];
            var affectedEntities = [...entities];

            effect.target.split("|").forEach((filter) => {
                switch (filter) {
                    //cells
                    case "cells":
                        affectedEntities = [];
                        break;
                    case "castedCells":
                        affectedTiles = [{
                            x: x2,
                            y: y2
                        }];
                        break;

                        //entities
                    case "entities":
                        affectedTiles = [];
                        break;
                    case "allies":
                        affectedEntities = entities.filter((e) => {
                            return e.team == this.entity.team
                        });
                        break;
                    case "opponents":
                        affectedEntities = entities.filter((e) => {
                            return e.team != this.entity.team
                        });
                        break;
                }
            });

            affectedTiles.forEach((tile) => {
                var e = new(Effects[effect.effect])(Object.assign({
                    fight: this.fight,
                    spell: this,
                    source: this.entity,
                    x: x2,
                    y: y2,
                    cx: tile.x,
                    cy: tile.y
                }, effect, {
                    target: null
                }));

                if (execute) {
                    e.on(Triggers.onCast);
                } else {
                    aiScore += e.ai();
                }
            });

            affectedEntities.forEach((entity) => {
                if (entity.alive) {
                    var e = new(Effects[effect.effect])(Object.assign({
                        fight: this.fight,
                        spell: this,
                        source: this.entity,
                        x: x2,
                        y: y2,
                        cx: entity.x,
                        cy: entity.y
                    }, effect, {
                        target: entity
                    }));

                    if (execute) {
                        e.on(Triggers.onCast);
                    } else {
                        aiScore += e.ai();
                    }
                }
            })
        });

        if (execute) {
            historic.entities = entities;
            this.historic.push(historic);
        }

        return aiScore;
    }

}