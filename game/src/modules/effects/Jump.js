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
        return Jump.jump(this, execute);
    }

    static jump(data = {}, execute = true) {
        if (data.target == null) {
            if (execute) {
                data.source.x = data.x;
                data.source.y = data.y;

                GameEvent.send({
                    type: "jump",
                    entity: data.source.id,
                    x: data.source.x,
                    y: data.source.y
                });
            }

            var score = 0;

            data.fight.entities.filter((entity) => {
                return entity.team != data.source.team;
            }).forEach((entity) => {
                if (data.aggressiveAi) {
                    score += Math.pow(100 - (Math.abs(entity.x - data.x) + Math.abs(entity.y - data.y)), 3);
                } else {
                    score += Math.pow(Math.abs(entity.x - data.x) + Math.abs(entity.y - data.y), 3);
                }
            });

            return {
                ai: score
            }
        }

        return false;
    }
}