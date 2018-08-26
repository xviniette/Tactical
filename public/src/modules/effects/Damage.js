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

    execute(execute = true) {
        if (this.target) {
            var damage = this.damage + this.damage * Math.max(this.source.getCharacteristics().power, 0) + Math.max(this.source.getCharacteristics().damage, 0);

            if (execute) {
                this.target.impactLife(-damage);
                this.target.getCharacteristics();
            }

            return { ai: damage }
        }

        return false;
    }


}