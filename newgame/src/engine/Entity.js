import merge from "./merge.js";

export default class Entity {
	constructor() {
		this.x = 0;
		this.y = 0;
		this.cx = 0;
		this.cy = 0;
		this.rx = 0;
		this.ry = 0;
		this.dx = 0;
		this.dy = 0;
		this.radius = 0;
		this.onGround = false;
		this.gravity = 0;
		this.friction = {
			x: 0,
			y: 0
		};
		this.bounce = {
			x: 0,
			y: 0
		};
		this.direction = {
			x: 1,
			y: 1
		}
		this.positions = [];
		this.game;
	}

	init(json) {
		merge(this, json);
	}

	setPosition(x, y) {
		this.x = x;
		this.y = y;

		this.cx = Math.floor(x);
		this.cy = Math.floor(y);

		this.rx = x - this.cx;
		this.ry = y - this.cy;
	}

	hasCollision(entity, t) {
		var position = {
			x: entity.x,
			y: entity.y,
		}

		if (t && entity.positions.length > 0) {
			for (var p of entity.positions) {
				if (t < p.t) {
					position = p;
					break;
				}
			}
		}

		var distance = Math.sqrt(Math.pow(position.x - this.x, 2) + Math.pow(position.y - this.y, 2));
		if (distance <= this.radius + entity.radius) {
			if (distance == 0) {
				distance = 0.00000001;
			}
			return distance;
		}
		return false;
	}

	distance(entity) {
		return Math.sqrt(Math.pow(entity.x - this.x, 2) + Math.pow(entity.y - this.y, 2));
	}

	physic() {
		var map = this.game.map;
		var tiles = map.tiles;

		var gap = 0.3;

		this.dy += this.gravity;
		this.ry += this.dy;
		this.dy *= this.friction.y;

		this.onGround = false;

		if ((!map.isBlock(this.cx, this.cy) && this.dy > 0) && this.cy > 0) {
			if ((map.isBlock(this.cx, this.cy + 1) || (map.isBlock(this.cx + 1, this.cy + 1) && this.rx > 1 - this.radius * gap && !map.isBlock(this.cx + 1, this.cy)) || (map.isBlock(this.cx - 1, this.cy + 1) && this.rx < this.radius * gap && !map.isBlock(this.cx - 1, this.cy))) && this.ry >= 1 - this.radius) {
				this.dy *= -this.bounce.y;
				this.ry = 1 - this.radius;
				this.onGround = true;
			}
		}

		while (this.ry < 0) {
			this.ry++;
			this.cy--;
		}
		while (this.ry > 1) {
			this.ry--;
			this.cy++;
		}

		this.rx += this.dx;
		this.dx *= this.friction.x;

		if (!map.isBlock(this.cx, this.cy) || (this.cx <= 0 || this.cx >= map.tiles.length - 1 || this.cy < 0 || this.cy > map.tiles[this.cx].length - 1)) {
			if (map.isBlock(this.cx - 1, this.cy) && this.rx <= this.radius && this.dx < 0) {
				this.rx = this.radius;
				this.dx *= -this.bounce.x;
			}

			if (map.isBlock(this.cx + 1, this.cy) && this.rx >= 1 - this.radius && this.dx > 0) {
				this.rx = 1 - this.radius;
				this.dx *= -this.bounce.x;
			}
		}

		if (map.isBlock(this.cx, this.cy)) {
			this.dx *= this.bounce.x;
		}

		while (this.rx < 0) {
			this.rx++;
			this.cx--;
		}
		while (this.rx > 1) {
			this.rx--;
			this.cx++;
		}

		var warp = map.isWarp(this.cx - 1, this.cy);
		if (warp && this.rx <= this.radius && this.dx < 0) {
			this.cx = warp.x;
			this.cy = warp.y;
		}

		var warp = map.isWarp(this.cx + 1, this.cy);
		if (warp && this.rx >= 1 - this.radius && this.dx > 0) {
			this.cx = warp.x;
			this.cy = warp.y;
		}

		var warp = map.isWarp(this.cx, this.cy - 1);
		if (warp && this.ry <= this.radius && this.dy < 0) {
			this.cx = warp.x;
			this.cy = warp.y;
		}

		var warp = map.isWarp(this.cx, this.cy + 1);
		if (warp && this.ry >= 1 - this.radius && this.dy > 0) {
			this.cx = warp.x;
			this.cy = warp.y;
		}

		this.x = this.cx + this.rx;
		this.y = this.cy + this.ry;
	}

	interpolate(t) {
		for (var i = 0; i < this.positions.length - 1; i++) {
			if (this.positions[i].t < t && this.positions[i + 1].t >= t) {
				var ratio = (t - this.positions[i].t) / (this.positions[i + 1].t - this.positions[i].t);


				var x = this.positions[i].x + (this.positions[i + 1].x - this.positions[i].x) * ratio;
				var y = this.positions[i].y + (this.positions[i + 1].y - this.positions[i].y) * ratio;

				if (Math.abs(this.positions[i + 1].x - this.positions[i].x) > this.game.settings.physic.maxInterpolationDistance.x) {
					x = this.positions[i].x;
				}

				if (Math.abs(this.positions[i + 1].y - this.positions[i].y) > this.game.settings.physic.maxInterpolationDistance.y) {
					y = this.positions[i].y;
				}

				this.setPosition(x, y);

				if (this.positions[i + 1].x > this.positions[i].x) {
					this.direction.x = 1;
				}

				if (this.positions[i + 1].x < this.positions[i].x) {
					this.direction.x = -1;
				}

				if (this.positions[i + 1].y > this.positions[i].y) {
					this.direction.y = 1;
				}

				if (this.positions[i + 1].y < this.positions[i].y) {
					this.direction.y = -1;
				}

				this.positions.splice(0, i - 1);
				return;
			}
		}
	}

	addPosition(t, value = {}) {
		value.t = t;
		this.positions.push(value);
	}
}