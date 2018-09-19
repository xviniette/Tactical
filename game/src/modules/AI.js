"use strict";

import Entity from "./Entity.js"

export default class AI extends Entity {
    constructor(json) {
        super(json);

        this.aggressive = true;

        this.init(json);
    }

    play() {
        console.log("AI TURN")
        var castables = [];

        var movementTiles = this.getAccessibleMovementTiles(true);
        var characteristics = this.getCharacteristics();

        for (var spell of this.spells) {
            if (!(spell.canUse() && spell.checkCooldown())) {
                continue;
            }

            for (var movementTile of movementTiles) {
                if (!spell.canUse(characteristics.ap - movementTile.usedAP, characteristics.mp - movementTile.usedMP)) {
                    continue;
                }

                for (var x = 0; x < this.fight.map.tiles.length; x++) {
                    for (var y = 0; y < this.fight.map.tiles[x].length; y++) {
                        var score = spell.cast(movementTile.x, movementTile.y, x, y, false);
                        if (score && score > 0) {
                            castables.push({
                                score: score - movementTile.usedAP - movementTile.usedMP,
                                movementTile: movementTile,
                                x: x,
                                y: y,
                                spell: spell
                            });
                        }
                    }
                }
            }

            if (castables.length > 0) {
                break;
            }
        }

        if (castables.length > 0) {
            castables = castables.sort((a, b) => {
                return b.score - a.score;
            });

            var cast = castables[0];

            var _this = this;

            this.trigger("move", {
                x: cast.movementTile.x,
                y: cast.movementTile.y,
            });


            this.trigger("cast", {
                spell: cast.spell.id,
                x: cast.x,
                y: cast.y
            }, () => {
                _this.play();
            });
            return;
        }

        //MOVEMENT LEFT
        var movementTiles = this.getAccessibleMovementTiles(true);
        var movementScores = [];

        movementTiles.forEach(tile => {
            var score = 0;

            if (this.aggressive) {
                score -= tile.usedAP + tile.usedMP;
            }

            var pathfinding = this.getMovementTiles(false, tile.x, tile.y, true);

            this.fight.getAliveEntities().filter((entity) => {
                return entity.team != this.team
            }).forEach((entity) => {
                var distance = pathfinding.find((t) => {
                    return t.x == entity.x && t.y == entity.y
                }).usedMP;

                if (this.aggressive) {
                    score += Math.pow(100 - distance, 3);
                } else {
                    score += Math.pow(distance, 3);
                    if (!this.fight.map.inLineOfSight(tile.x, tile.y, entity.x, entity.y)) {
                        score += distance;
                    }
                }
            });

            movementScores.push({
                x: tile.x,
                y: tile.y,
                score: score
            });
        });

        if (movementScores.length > 0) {
            movementScores.sort((a, b) => {
                return b.score - a.score;
            });

            this.trigger("move", {
                x: movementScores[0].x,
                y: movementScores[0].y
            });
        }

        this.trigger("endTurn");
    }
}