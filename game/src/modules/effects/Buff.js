"use strict";

import Effect from "./Effect.js"
import GameEvent from "../GameEvent.js"

export default class Buff extends Effect {
    constructor(json) {
        super(json);

        this.started = false;
        this.added = false;
    }

    static defaultData() {
        return {
            characteristic: null,
            value: 0,
            duration: 0,
            delay: 0,
            onCast: true,
            onTargetStart: true
        }
    }

    execute(execute = true) {
        if (this.target) {
            if (!execute) {
                return false;
            }

            if (!this.added && this.duration > 0) {
                this.added = true;
                this.fight.effects.push(this);
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

    remove() {
        this.target.defaultCharacteristics[this.characteristic] -= this.value;
        return false;
    }
}