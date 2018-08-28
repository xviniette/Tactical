"use strict";

import Entity from "./Entity.js"

export default class Player extends Entity {
    constructor(json) {
        super(json);

        this.init(json);
    }

    init(json = {}) {
        for (var i in json) {
            this[i] = json[i];
        }
    }
}