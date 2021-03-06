"use strict";

import Effect from "./Effect.js"
import GameEvent from "../GameEvent.js"
import Triggers from "./Triggers.json"

export default class Damage extends Effect {
    constructor(json) {
        super(json);
    }

    static defaultData() {
        return {
            damage: 1,
            triggers: [Triggers.onCast]
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
                data.target.currentCharacteristics.damageTaken += realDamage;
                data.target.currentCharacteristics.erosionTaken += Math.floor(damage * targetCharacteristics.erosion / 100);

                data.target.getCharacteristics();

                GameEvent.send({
                    type: "characteristic",
                    x: data.cx,
                    y: data.cy,
                    entity: data.target,
                    characteristic: "hp",
                    value: -realDamage,
                    characteristics: data.target.characteristics
                });
            }

            return {
                ai: data.target.team != data.source.team ? 1 : -1 * realDamage + (realDamage >= targetCharacteristics.currentLife ? 9999999 : 0)
            }
        }

        return false;
    }

    static description(data = {}) {
        var d = Object.assign(Damage.defaultData(), data);
        return `${d.damage} Damage`
    }


}