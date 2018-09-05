"use strict";

import Effect from "./Effect.js"
import GameEvent from "../GameEvent.js"

export default class Damage extends Effect {
    constructor(json) {
        super(json);
    }

    static defaultData() {
        return {
            damage: 1,
            onCast: true
        }
    }

    execute(execute = true) {
        return Damage.damage(this, execute);
    }

    static damage(data = {}, execute = true) {
        if (data.target) {
            var sourceCharacteristics = data.source.getCharacteristics();
            var targetCharacteristics = data.target.getCharacteristics();

            var damage = data.damage + data.damage * sourceCharacteristics.power / 100 + sourceCharacteristics.damage;
            var realDamage = Math.min(Math.floor((damage - targetCharacteristics.resistance) * (100 - targetCharacteristics.armor) / 100), targetCharacteristics.currentLife);

            if (execute) {
                data.target.currentCharacteristics.damageTaken -= realDamage;
                data.target.currentCharacteristics.erosionTaken -= Math.floor(damage * targetCharacteristics.erosion / 100);
                data.target.getCharacteristics();

                GameEvent.send({ type: "characteristic", entity: data.target.id, characteristic: "life", value: realDamage });
            }

            return { ai: realDamage + 1000 + (realDamage >= targetCharacteristics.currentLife ? 9999999 : 0) }
        }

        return false;
    }


}