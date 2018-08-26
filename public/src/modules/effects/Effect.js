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

    ai() {
        var res = this.execute(false);
        if (res) {
            return res.ai;
        }

        return false;
    }
}