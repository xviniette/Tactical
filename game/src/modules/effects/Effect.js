"use strict";

export default class Effect {
    constructor(json = {}) {
        this.id = Math.random().toString(36).substr(2, 9);

        this.fight;
        this.source;
        this.target;
        this.spell;
        this.x;
        this.y;
        this.cx;
        this.cy;

        this.duration = 0;
        this.delay = 0;

        //Events
        this.onCast = false;

        var defaultData = this.constructor.defaultData();
        for (var attr in defaultData) {
            this[attr] = defaultData[attr];
        }

        this.init(json);
    }

    init(json = {}) {
        for (var i in json) {
            this[i] = json[i];
        }
    }

    static defaultData() {
        return {};
    }

    execute(execute = true) {
        return false;
    }

    cast() {
        if (this.onCast) {
            return this.execute();
        }

        return false;
    }

    remove() {
        if (this.onRemove) {
            return this.execute();
        }

        return false;
    }

    targetStart() {
        if (this.onTargetStart) {
            return this.execute();
        }

        return false;
    }

    ai() {
        var res = this.execute(false);
        if (res) {
            return res.ai;
        }

        return false;
    }

    removeEffect() {
        var index = this.fight.effects.findIndex((e) => {
            return e.id == this.id;
        });

        this.fight.effects.splice(index, 1);
        this.remove();
    }

    manageDuration() {
        if (this.delay > 0) {
            this.delay--;
            return false;
        }

        if (this.duration <= 0) {
            this.removeEffect();
            return false;
        }

        this.duration--;
        return true;
    }
}