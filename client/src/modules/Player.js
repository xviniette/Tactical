"use strict";

import Entity from "./Entity.js"

export default class Player extends Entity {
    constructor(json) {
        super();

        this.init(json);
    }
}