"use strict";

import Triggers from "./Triggers.json"

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

        this.triggers = [];

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

    on(trigger = null) {
        if (trigger && this[trigger]) {
            this[trigger]();
        }

        if (this.triggers.includes(trigger)) {
            return this.execute();
        }

        return false;
    }

    execute(execute = true) {
        return false;
    }

    ai() {
        var res = this.execute(false);
        if (res) {
            return res.ai;
        }

        return false;
    }

    onCast() {
        if (this.duration > 0) {
            this.fight.effects.push(this);
        }
    }

    removeEffect() {
        var index = this.fight.effects.findIndex((e) => {
            return e.id == this.id;
        });

        this.fight.effects.splice(index, 1);
        this.on(Triggers.onRemoveEffect);
    }

    manageDuration() {
        if (this.delay > 0) {
            this.delay--;
            return false;
        }
        
        if(this.delay == 0){
            this.on(Triggers.onStart);
        }

        if (this.duration <= 0) {
            this.removeEffect();
            return false;
        }

        this.duration--;
        return true;
    }
}