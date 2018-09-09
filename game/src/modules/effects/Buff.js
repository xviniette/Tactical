"use strict";

import Effect from "./Effect.js"
import GameEvent from "../GameEvent.js"

export default class Buff extends Effect {
    constructor(json) {
        super(json);
    }

    static defaultData() {
        return {
            characteristic: null,
            value: 0,
            duration: 0,
            onCast: true
        }
    }

    execute(execute = true) {
        return Buff.buff(this, execute);
    }

    static buff(data = {}, execute = true) {
        if (data.target) {
            data.target.push();
            var sourceCharacteristics = data.source.getCharacteristics();
            var targetCharacteristics = data.target.getCharacteristics();

            var heal = Math.min(data.heal + data.heal * sourceCharacteristics.healPower + sourceCharacteristics.heal, targetCharacteristics.maxLife - targetCharacteristics.currentLife);

            if (execute) {
                data.target.currentCharacteristics.damageTaken -= heal;
                data.target.getCharacteristics();

                GameEvent.send({ type: "characteristic", entity: data.target.id, characteristic: "hp", value: heal });
            }

            return { ai: realDamage + 1000 + (realDamage >= targetCharacteristics.currentLife ? 9999999 : 0) }
        }

        return false;
    }


}