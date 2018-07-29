"use strict";

export default class Effect {
    constructor(json = {}) {
        this.fight;
        this.source;
        this.target;
        this.spell;
        this.x;
        this.y;
        this.cx;
        this.cy;

        this.characteristic;
        this.value = 0;

        this.init(json);
    }

    init(json = {}) {
        for (var i in json) {
            this[i] = json[i];
        }
    }

    onCast() { 
    }
}