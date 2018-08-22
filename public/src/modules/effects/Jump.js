"use strict";

import Effect from "./Effect.js"

export default class Jump extends Effect {
    constructor(json){
        super(json);
    }

    static defaultData() {
        return {
            onCast: true
        }
    }

    execute() {
        if (this.target == null) {
            this.source.x = this.x;
            this.source.y = this.y;
        }
    }
}