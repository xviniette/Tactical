"use strict";

import Effect from "./Effect.js"
import GameEvent from "../GameEvent.js"
import Triggers from "./Triggers.json"

export default class Jump extends Effect {
    constructor(json) {
        super(json);
    }

    static defaultData() {
        return {
            aggressiveAi: true,
            triggers: [Triggers.onCast]
        }
    }

    execute(execute = true) {
        if (this.target == null) {
            if (execute) {
                var targetEntity = this.fight.map.getCellEntity(this.x, this.y);
                if (targetEntity) {
                    targetEntity.x = this.source.x;
                    targetEntity.y = this.source.y;

                    GameEvent.send({
                        type: "teleport",
                        entity: targetEntity,
                        x: targetEntity.x,
                        y: targetEntity.y
                    });
                }

                this.source.x = this.x;
                this.source.y = this.y;

                GameEvent.send({
                    type: "teleport",
                    entity: this.source,
                    x: this.source.x,
                    y: this.source.y
                });
            }

            var score = 0;

            this.fight.getAliveEntities().filter((entity) => {
                return entity.team != this.source.team;
            }).forEach((entity) => {
                if (this.aggressiveAi) {
                    score += Math.pow(100 - (Math.abs(entity.x - this.x) + Math.abs(entity.y - this.y)), 3);
                } else {
                    score += Math.pow(Math.abs(entity.x - this.x) + Math.abs(entity.y - this.y), 3);
                }
            });

            return {
                ai: score
            }
        }

        return false;
    }
}