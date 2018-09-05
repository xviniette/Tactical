"use strict";

import Effect from "./Effect.js"
import GameEvent from "../GameEvent.js"

export default class Jump extends Effect {
    constructor(json) {
        super(json);
    }

    static defaultData() {
        return {
            onCast: true
        }
    }

    execute(execute = true) {
        if (this.target == null) {
            if (execute) {
                this.source.x = this.x;
                this.source.y = this.y;

                GameEvent.send({ type: "jump", entity: this.source.id, x: this.x, y: this.y });
            }
        }

        return { ai: 1 };
    }
}