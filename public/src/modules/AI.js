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

        setTimeout(() => {
            this.endTurn();
        }, 2000)
    }
}