"use strict";

import Map from "./Map.js";
import Element from "./Element.js"

export default class Fight extends Element {
    constructor(json) {
        super();

        this.map = new Map({
            fight: this
        });
        this.entities = [];
        this.turn = 0;
        this.currentEntity = null;
        this.timer = null;
        this.turnTime = null;

        this.effects = [];

        this.scene;

        this.init(json)
    }

    start() {
        this.entities.forEach((entity) => {
            entity.getCharacteristics();
        });

        this.entities.sort((a, b) => {
            return b.characteristics.initiative - a.characteristics.initiative;
        });

        this.nextEntity();
    }

    nextEntity() {
        if (this.entities.length == 0) {
            return false;
        }

        var entity;

        if (!this.currentEntity) {
            entity = this.entities[0];
        } else {
            var index = this.entities.findIndex((entity) => {
                return entity.id == this.currentEntity.id;
            });

            if (index + 1 > this.entities.length - 1) {
                entity = this.entities[0];
                this.turn++;
            } else {
                entity = this.entities[index + 1];
            }
        }

        this.currentEntity = entity;

        clearTimeout(this.timer);
        if (this.turnTime) {
            this.timer = setTimeout(() => {
                entity.endTurn();
            }, this.turnTime);
        }

        this.effects.filter((e) => {
            return e.target.id == entity.id
        }).forEach((e) => {
            e.targetStart();
        });
        entity.play();
    }

    getEntity(id) {
        return this.entities.find((entity) => {
            return entity.id == id;
        });
    }

    isOver() {
        return false;
    }
}