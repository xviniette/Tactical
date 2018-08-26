"use strict";

import Entity from "./Entity.js"

export default class AI extends Entity {
    constructor(json) {
        super(json);

        this.aggressive = true;

        this.init(json);
    }

    init(json = {}) {
        for (var i in json) {
            this[i] = json[i];
        }
    }

    play() {
        console.log("AI!");
        console.log("position", this.x, this.y);

        //CAST LOOP
        var casted = true;
        while (casted) {
            casted = false;

            var castables = [];

            var movementTiles = this.getMovementTiles();
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
                                castables.push({ score: score, movementTile: movementTile, x: x, y: y, spell: spell });
                            }
                        }
                    }
                }
            }

            if (castables.length > 0) {
                castables = castables.sort((a, b) => {
                    return b.score - a.score;
                });

                var cast = castables[0];
                
                console.log("cast", cast);

                this.move(cast.movementTile.x, cast.movementTile.y);
                cast.spell.cast(cast.x, cast.y);
                casted = true;
            }
        }

        console.log("FINI ");
        return;
        setTimeout(() => {
            this.endTurn();
        }, 1000);

        //MOVEMENT LEFT
    }
}