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
            var damage = this.damage + this.damage * Math.max(this.caster.getCharacteristics().power, 0) + Math.max(this.caster.getCharacteristics().damage, 0);
            this.target.impactLife(-damage);
            this.target.getCharacteristics();
        }
    }
}