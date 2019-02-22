import Entity from "./Entity.js";

export default class Ball extends Entity {
	constructor(json) {
		super();
		this.id;

		this.maxspeed;
		this.kick;
		this.up;
		this.respawnTime;

		super.init(json);
	}

	kicked(player) {
		this.dx = this.kick.x * player.direction.x;
		this.dy = this.kick.y;
	}

	uped(player) {
		this.dy = this.up.y;
		this.dx = (this.dx * this.up.boost) + (this.up.x * player.direction.x);
	}

	update() {
		var goal = this.game.map.isGoal(this.cx, this.cy);
		if (goal !== false) {
			this.game.deleteBall();
			this.game.spawnBallIn(this.respawnTime);
			this.game.goal(goal == 1 ? 2 : 1);
			return;
		}

		if (this.cy > this.game.map.tiles[0].length) {
			this.game.deleteBall();
			this.game.spawnBallIn(this.respawnTime);
			return;
		}

		if (Math.abs(this.dx) > this.maxspeed) {
			this.dx = this.maxspeed * Math.sign(this.dx);
		}

		this.physic();
	}

	snapshotInfos() {
		return {
			x: this.x,
			y: this.y
		}
	}
}