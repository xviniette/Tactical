import Entity from "./Entity.js";

export default class Player extends Entity {
    constructor(json) {
        super();
        this.id;
        this.username;
        this.socket;
        this.team;

        this.speed;
        this.jump;
        this.prevInputs = {};

        this.bombImpulsion;
        this.normalFriction;
        this.normalBounce;
        this.stunFriction;
        this.stunBounce;
        this.deltaAction;
        this.lastAction = 0;
        this.stun = 0;
        this.inpSeq = 0;

        this.inputs = [];

        super.init(json);
    }

    hasBomb() {
        for (var i in this.game.bombs) {
            if (this.game.bombs[i].player.id == this.id) {
                return true;
            }
        }
        return false;
    }

    update(inps = null, deleteInputs = true) {
        var inputs = this.inputs;
        if (inps) {
            inputs = inps;
        }
        for (var i in inputs) {
            var input = inputs[i];

            if (this.stun > 0) {
                this.friction = this.stunFriction;
                this.bounce = this.stunBounce;
            } else {
                this.friction = this.normalFriction;
                this.bounce = this.normalBounce;
            }

            if (this.stun <= 0) {
                if (input.l) {
                    this.dx = -this.speed;
                    this.direction.x = -1;
                }

                if (input.r) {
                    this.dx = this.speed;
                    this.direction.x = 1;
                }

                if (input.j && this.onGround) {
                    this.dy = this.jump;
                    this.direction.y = -1;
                }

                if (input.k && !this.prevInputs["k"] && this.lastAction == 0) {
                    var hasCollision = false;
                    if (this.game.ball && super.hasCollision(this.game.ball, input.serverTime)) {
                        this.game.ball.kicked(this);
                        this.lastAction = this.deltaAction;
                        hasCollision = true;
                    }

                    for (var i in this.game.bombs) {
                        if (super.hasCollision(this.game.bombs[i], input.serverTime)) {
                            this.game.bombs[i].kicked(this);
                            this.lastAction = this.deltaAction;
                            hasCollision = true;
                        }
                    }

                    if (!hasCollision) {
                        if (!this.hasBomb()) {
                            if (this.game.isLocal()) {
                                this.game.addBomb(this);
                            }
                            if (!this.onGround && this.dy > this.bombImpulsion) {
                                this.dy = this.bombImpulsion;
                                this.lastAction = this.deltaAction;
                            }
                        }
                    }
                }

                if (input.u && !this.prevInputs["u"] && this.lastAction == 0) {
                    if (this.game.ball && super.hasCollision(this.game.ball, input.serverTime)) {
                        this.game.ball.uped(this);
                    }

                    for (var i in this.game.bombs) {
                        if (super.hasCollision(this.game.bombs[i], input.serverTime)) {
                            this.game.bombs[i].uped(this);
                        }
                    }
                }
            } else {
                this.stun--;
            }
            if (this.lastAction > 0) {
                this.lastAction--;
            }
            this.prevInputs = input;
            this.inpSeq = input.inpSeq;
            this.physic();

        }
        if (deleteInputs) {
            this.inputs = [];
        }
    }

    initInfos() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            dx: this.dx,
            dy: this.dy,
            rx: this.rx,
            ry: this.ry,
            stun: this.stun,
            inpSeq: this.inpSeq,
            team: this.team
        };
    }

    snapshotInfos() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            dx: this.dx,
            dy: this.dy,
            rx: this.rx,
            ry: this.ry,
            stun: this.stun,
            inpSeq: this.inpSeq,
            team: this.team
        };
    }
}