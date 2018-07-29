"use strict";

import Effect from "./Effect.js"

export default class Jump extends Effect {
    onCast() {
        if (this.target == null) {
            this.source.x = this.x;
            this.source.y = this.y;
        }
    }
}