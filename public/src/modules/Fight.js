"use strict";

export default class Fight {
    constructor(json) {
        this.map;
        this.entities = [];
        this.turn = 0;
        this.currentEntity = null;
        this.timer = null;
        this.turnTime = 5000;
        this.seed = Math.round(Math.random() * 4294967296);

        this.init(json)
    }

    init(json = {}) {
        for (var i in json) {
            this[i] = json[i];
        }
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

        entity.play();
    }

    random(min = null, max = null) {
        this.seed = (1664525 * this.seed + 1013904223) % 4294967296;

        var random = this.seed / 4294967296;

        if (min == null && max == null) {
            return random;
        }

        if (max == null) {
            return Math.floor(random * (min + 1))
        }

        return Math.floor((max + 1 - min) * random + min);
    }
}