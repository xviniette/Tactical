export default class EventHandler {
    constructor(data = {}) {
        this.scene;

        this.delayManager = [];

        this.init(data);
    }

    init(json) {
        for (var i in json) {
            this[i] = json[i];
        }
    }

    on(event) {
        console.log(event);
        if (this[event.type]) {
            this[event.type](event);
        }
    }

    getDelay() {
        var now = Date.now();
        for (var i = this.delayManager.length - 1; i >= 0; i--) {
            if (this.delayManager[i].block && this.delayManager[i].end > now) {
                return Math.max(0, this.delayManager[i].end - now);
            }
        }
        return 0;
    }

    addDelay(data = {}, start = 0, duration = 0, block = false) {
        this.delayManager.push({
            data: data,
            start: Date.now() + start,
            end: Date.now() + start + duration,
            block: block
        });
    }

    //Events
    move(data) {
        var startDelay = this.getDelay();
        var tileDuration = 300;

        data.tile.path.forEach((t, index) => {
            var position = this.scene.getIsometricPosition(t.x, t.y);
            this.scene.tweens.add({
                targets: data.entity.sprite,
                x: position.x,
                y: position.y,
                duration: tileDuration,
                delay: tileDuration * index + startDelay
            });
        });

        this.addDelay(data, startDelay, data.tile.path.length * tileDuration, true);
    }

    characteristic() {

    }


}