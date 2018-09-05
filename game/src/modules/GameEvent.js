"use strict";

export default class GameEvent {
    constructor() {

    }

    static send(data = {}) {
        if (!document) {
            return;
        }
        
        var event = new CustomEvent("GameEvent", { detail: data });
        document.dispatchEvent(event);
    }
}