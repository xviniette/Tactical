"use strict";

import Effect from "./Effect.js"
import GameEvent from "../GameEvent.js"
import Triggers from "./Triggers.json"

export default class Heal extends Effect {
    constructor(json) {
        super(json);
    }

    static defaultData() {
        return {
            heal: 1,
            triggers: [Triggers.onCast]
        }
    }

    execute(execute = true) {
        return Heal.heal(this, execute);
    }

    static heal(data = {}, execute = true) {
        if (data.target) {
            var sourceCharacteristics = data.source.getCharacteristics();
            var targetCharacteristics = data.target.getCharacteristics();

            var heal = Math.min(data.heal + data.heal * sourceCharacteristics.healPower + sourceCharacteristics.heal, targetCharacteristics.maxLife - targetCharacteristics.currentLife);

            if (execute) {
                data.target.currentCharacteristics.damageTaken -= heal;
                data.target.getCharacteristics();

                GameEvent.send({
                    type: "characteristic",
                    entity: data.target.id,
                    characteristic: "hp",
                    value: heal
                });
            }

            return {
                ai: realDamage + 1000 + (realDamage >= targetCharacteristics.currentLife ? 9999999 : 0)
            }
        }

        return false;
    }


}