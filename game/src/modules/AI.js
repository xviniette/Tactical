"use strict";

import Entity from "./Entity.js"

export default class AI extends Entity {
    constructor(json) {
        super(json);

        this.aggressive = true;

        this.init(json);
    }

    play() {
        console.log("AI");
        //CAST LOOP
        var casted = true;
        while (casted) {
            casted = false;

            var castables = [];

            var movementTiles = this.getMovementTiles(true);
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

                this.move(cast.movementTile.x, cast.movementTile.y);
                cast.spell.cast(cast.x, cast.y);
                casted = true;
            }
        }

        //MOVEMENT LEFT
        var movementTiles = this.getMovementTiles(true);
        var movementScores = [];

        movementTiles.forEach(tile => {
            var score = 0;

            if (this.aggressive) {
                score -= tile.usedAP + tile.usedMP;
            }

            this.fight.getAliveEntities().filter((entity) => {
                return entity.team != this.team
            }).forEach((entity) => {
                if (this.aggressive) {
                    score += Math.pow(100 - (Math.abs(entity.x - tile.x) + Math.abs(entity.y - tile.y)), 3);
                } else {
                    score += Math.pow(Math.abs(entity.x - tile.x) + Math.abs(entity.y - tile.y), 3);
                    if (!this.fight.map.inLineOfSight(tile.x, tile.y, entity.x, entity.y)) {
                        score += 100;
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

            this.move(movementScores[0].x, movementScores[0].y);
        }

        this.endTurn();
    }
}