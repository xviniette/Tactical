import Entity from "./Entity.js";

export default class Bomb extends Entity {
	constructor(json) {
		super();
		this.player;
		this.state = 0;

		this.maxspeed;

		this.kick;
		this.bigKick;
		this.up;
		this.jumpCreation;

		this.explosionTime;
		this.bigExplosionTime;
		this.explosionRadius;
		this.bigExplosionRadius;
		this.explosionBall;
		this.explosionPlayer;
		this.timestun;

		super.init(json);
	}

	kicked(player) {
		if (this.state == 0 && this.player.id != player.id) {
			this.dx = this.bigKick.x * player.direction.x;
			this.dy = this.bigKick.y;
			this.explosionTime = this.bigExplosionTime;
			this.state = 1;
			return;
		}
		this.dx = this.kick.x * player.direction.x;
		this.dy = this.kick.y;
	}

	uped(player) {
		if (this.state == 0 && this.player.id != player.id) {
			this.explosionTime = this.bigExplosionTime;
			this.state = 1;
		}
		this.dy = this.up.y;
		this.dx = (this.dx * this.up.boost) + (this.up.x * player.direction.x);
	}

	explode() {
		for (var player of this.game.players) {
			var distance = super.distance(player);
			var explostionRad = this.state == 0 ? this.explosionRadius : this.bigExplosionRadius;
			if (distance <= explostionRad) {
				var angle = Math.atan2(player.y - this.y, player.x - this.x);
				var ratio = (1 - distance / explostionRad);
				var timeStun = Math.floor(ratio * (this.timestun.max - this.timestun.min) + this.timestun.min);
				player.stun = timeStun;
				var power = (ratio * (this.explosionPlayer.max - this.explosionPlayer.min) + this.explosionPlayer.min);
				player.dx = Math.cos(angle) * power;
				player.dy = Math.sin(angle) * power;
			}
		}

		if (this.game.ball) {
			var distance = super.distance(this.game.ball);
			if (distance <= explostionRad) {
				var angle = Math.atan2(this.game.ball.y - this.y, this.game.ball.x - this.x);
				var ratio = (1 - distance / explostionRad);
				var power = (ratio * (this.explosionBall.max - this.explosionBall.min) + this.explosionBall.min);
				this.game.ball.dx = Math.cos(angle) * power;
				this.game.ball.dy = Math.sin(angle) * power;
			}
		}
	}

	update() {
		if (this.explosionTime == 0) {
			this.explode();
			if (this.render) {
				this.render.destroy();
			}
			this.game.deleteBomb(this);
			return;
		}
		this.explosionTime--;

		if (Math.abs(this.dx) > this.maxspeed) {
			this.dx = this.maxspeed * Math.sign(this.dx);
		}

		this.physic();
	}

	snapshotInfos() {
		return {
			player: {
				id: this.player.id
			},
			state: this.state,
			x: this.x,
			y: this.y
		}
	}
}