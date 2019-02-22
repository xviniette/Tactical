"use strict";

import Effect from "./Effect.js"
import GameEvent from "../GameEvent.js"
import Triggers from "./Triggers.json"

export default class Mark extends Effect {
    constructor(json) {
        super(json);

        this.started = false;
        this.added = false;
    }

    static defaultData() {
        return {
            aoe: [
                [1]
            ],
            triggers: [Triggers.onCast, Triggers.onTargetStart],
        }
    }

    execute(execute = true) {
        if (this.target) {
            if (!execute) {
                return {
                    ai: this.target.team == this.source.team ? 1 : -1 * Math.sign(this.value)
                };
            }

            if (this.manageDuration()) {
                if (!this.started) {
                    this.target.defaultCharacteristics[this.characteristic] += this.value;
                    this.started = true;

                    GameEvent.send({
                        type: "characteristic",
                        entity: this.target,
                        x: this.target.x,
                        y: this.target.y,
                        characteristic: this.characteristic,
                        value: this.value,
                        duration: this.duration
                    });
                }
            }
        }

        return false;
    }

    onRemoveEffect() {
        this.target.defaultCharacteristics[this.characteristic] -= this.value;
        return false;
    }
}