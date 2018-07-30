"use strict";

import Effect from "./Effect.js"

export default class Damage extends Effect {
    constructor(json) {
        super(json);
        this.minDamage = null;
        this.maxDamage = null;
        this.damage = null;

        this.init(json);
    }

    onCast() {
        if (this.target) {
            var damage = this.damage + this.damage * Math.max(this.source.getCharacteristics().power, 0) + Math.max(this.source.getCharacteristics().damage, 0);
            this.target.impactLife(-damage);
            this.target.getCharacteristics();
        }
    }
}