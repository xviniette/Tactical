import Entity from "./Entity.js";

export default class Particle extends Entity {
    constructor(json) {
        super();
        this.id = Math.random().toString(36).substr(2, 9);
        this.name;

        this.life = 1000;
        this.spawn = Date.now();

        super.init(json);
    }

    update() {
        if (Date.now() > this.spawn + this.life) {
            this.game.removeParticle(this);
            return;
        }

        this.physic();
    }
}