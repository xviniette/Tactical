"use strict";

import Effect from "./Effect.js"

export default class Damage extends Effect {
    constructor(json) {
        super(json);
    }

    static defaultData() {
        return {
            damage: 20,
            onCast: true
        }
    }

    execute() {
        if (this.target) {
            var damage = this.damage + this.damage * Math.max(this.source.getCharacteristics().power, 0) + Math.max(this.source.getCharacteristics().damage, 0);
            this.target.impactLife(-damage);
            this.target.getCharacteristics();
        }
    }

    
}