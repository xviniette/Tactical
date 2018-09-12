"use strict";

import Effect from "./Effect.js"
import GameEvent from "../GameEvent.js"
import Triggers from "./Triggers.json"

export default class Moved extends Effect {
    constructor(json) {
        super(json);
    }

    static defaultData() {
        return {
            distance: 1,
            bySource: true,
            push: true,
            triggers: [Triggers.onCast]
        }
    }

    execute(execute = true) {
        return Moved.moved(this, execute);
    }

    static moved(data = {}, execute = true) {
        if (data.target) {
            if (execute) {

                var angle = 0;
                if (data.bySource) {
                    angle = Math.atan2(data.target.y - data.source.y, data.target.x - data.source.x);
                } else {
                    angle = Math.atan2(data.target.y - data.y, data.target.x - data.x);
                }

                if (!data.push) {
                    angle += Math.PI;
                }

                var map = data.fight.map;
                for (var i = 0; i < data.distance; i++) {
                    var x = data.target.x + Math.round(Math.cos(angle));
                    var y = data.target.y + Math.round(Math.sin(angle));

                    if (map.isCell(x, y) && map.isFree(x, y)) {
                        data.target.x = x;
                        data.target.y = y;
                    } else {
                        break;
                    }
                }

                GameEvent.send({
                    type: "moved",
                    entity: data.target.id,
                    x: data.target.x,
                    y: data.target.y
                });
            }

            return {
                ai: 0
            }
        }

        return false;
    }


}