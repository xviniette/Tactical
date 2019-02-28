import Entity from "./Entity"

export default class Player extends Entity {
    constructor(json) {
        super(json);

        this.init(json);
    }
}