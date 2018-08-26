"use strict";

import Effect from "./Effect.js"

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
            }
        }

        return { ai: 1 };
    }
}