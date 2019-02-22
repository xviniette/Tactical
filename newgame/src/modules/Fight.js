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
        this.turn = 1;
        this.currentEntity = null;
        this.timer = null;
        this.turnTime = null;

        this.effects = [];

        this.isServer = false;

        this.init(json)
    }

    start() {
        this.orderEntities();

        this.nextEntity();
    }

    orderEntities() {
        this.entities.forEach((entity) => {
            entity.getCharacteristics();
        });

        this.entities.sort((a, b) => {
            return b.characteristics.initiative - a.characteristics.initiative;
        });
    }

    nextEntity() {
        var entities = this.getAliveEntities();
        if (entities.length == 0) {
            return false;
        }

        if(this.isOver()){
            return false;
        }

        var entity;

        if (!this.currentEntity) {
            entity = entities[0];
        } else {
            var index = entities.findIndex((entity) => {
                return entity.id == this.currentEntity.id;
            });

            if (index + 1 > entities.length - 1) {
                entity = entities[0];
                this.turn++;
            } else {
                entity = entities[index + 1];
            }
        }

        this.currentEntity = entity;

        clearTimeout(this.timer);
        if (this.turnTime) {
            this.timer = setTimeout(() => {
                entity.endTurn();
            }, this.turnTime);
        }

        entity.startTurn();
    }

    getEntity(id) {
        return this.entities.find((entity) => {
            return entity.id == id;
        });
    }

    getAliveEntities() {
        return this.entities.filter((e) => {
            return e.alive
        });
    }

    isOver() {
        var aliveTeams = [];

        this.entities.forEach((entity) => {
            if (entity.team && entity.alive) {
                if (!aliveTeams.includes(entity.team)) {
                    aliveTeams.push(entity.team);
                }
            }
        });

        if (aliveTeams.length > 1) {
            return false;
        }

        return {
            winningTeam: aliveTeams.length == 1 ? aliveTeams[0] : null
        };
    }

    end() {
        console.log("FIN");
    }
}