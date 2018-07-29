"use strict";

export default class Fight {
    constructor(json) {
        this.map;
        this.entities = [];
        this.turn = 0;
        this.currentEntity = null;
        this.timer = null;

        this.init(json)
    }

    init(json = {}) {
        for (var i in json) {
            this[i] = json[i];
        }
    }

    start() {
        this.entities.forEach((entity) => {
            entity.getCaracteristics();
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
        console.log(this.currentEntity);

        // clearTimeout(this.timer);
        // this.timer = setTimeout(() => {
        //     entity.endTurn();
        // }, 10 * 1000);

        entity.play();
    }
}