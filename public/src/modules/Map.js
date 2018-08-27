"use strict";

export default class Map {
    constructor(json) {
        this.fight;
        this.tiles = [
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0],
            [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        ]

        this.init(json);
    }

    init(json = {}) {
        for (var i in json) {
            this[i] = json[i];
        }
    }

    isTile(x, y) {
        if (this.tiles[x] && this.tiles[x][y] != undefined) {
            return true;
        }

        return false;
    }

    isCell(x, y) {
        if (!this.isTile(x, y)) {
            return false;
        }

        return this.tiles[x][y] == 0;
    }

    isObstable(x, y) {
        if (!this.isTile(x, y)) {
            return false;
        }

        return this.tiles[x][y] == 1;
    }

    isHole(x, y) {
        if (!this.isTile(x, y)) {
            return true;
        }

        return this.tiles[x][y] == -1;
    }

    getCellEntity(x, y) {
        if (!this.fight) {
            return null;
        }

        return this.fight.entities.find((entity) => {
            return entity.x == x && entity.y == y;
        });
    }

    getCellsAround(x, y, range = 1) {
        var cells = [];
        for (var i = x - range; i <= x + range; i++) {
            for (var j = y - range; j <= y + range; j++) {
                var distance = Math.abs(i - x) + Math.abs(j - y);
                if (distance > 0 && distance <= range && this.isCell(i, j)) {
                    cells.push({ x: i, y: j });
                }
            }
        }

        return cells;
    }

    getEntitiesAround(x, y, range = 1) {
        var entities = [];

        var cells = this.getCellsAround(x, y, range);

        cells.forEach((cell) => {
            var entity = this.fight.entities.find((e) => {
                return e.x == cell.x && e.y == cell.y;
            });

            if (entity) {
                entities.push(entity);
            }
        });

        return entities;
    }

    isTaken(x, y) {
        return this.getCellEntity(x, y) != null;
    }

    isFree(x, y) {
        return !this.isTaken(x, y);
    }

    inLineOfSight(x1, y1, x2, y2, entitiesBlock = true, ignoredEntity = null) {
        var pts = [];

        var y = y1;
        var x = x1;

        var dx = x2 - x1;
        var dy = y2 - y1;

        var xstep, ystep;

        if (dy < 0) {
            ystep = -1;
            dy = -dy;
        } else {
            ystep = 1;
        }

        if (dx < 0) {
            xstep = -1;
            dx = -dx;
        } else {
            xstep = 1;
        }

        var ddy = 2 * dy;
        var ddx = 2 * dx;

        if (ddx >= ddy) {
            var errorprev = dx;
            var error = dx;
            for (var i = 0; i < dx; i++) {
                x += xstep;
                error += ddy;
                if (error > ddx) {
                    y += ystep;
                    error -= ddx;

                    if (error + errorprev < ddx) {
                        pts.push({ 'x': x, 'y': y - ystep });
                    } else if (error + errorprev > ddx) {
                        pts.push({ 'x': x - xstep, 'y': y });
                    }
                }
                pts.push({ 'x': x, 'y': y });
                errorprev = error;
            }
        } else {
            errorprev = dy;
            error = dy;
            for (var i = 0; i < dy; i++) {
                y += ystep;
                error += ddx;
                if (error > ddy) {
                    x += xstep;
                    error -= ddy;
                    if (error + errorprev < ddy) {
                        pts.push({ 'x': x - xstep, 'y': y });
                    } else if (error + errorprev > ddy) {
                        pts.push({ 'x': x, 'y': y - ystep });
                    }
                }
                pts.push({ 'x': x, 'y': y });
                errorprev = error;
            }
        }

        //ON BOOLEEN
        for (var i = 0; i < pts.length - 1; i++) {
            var pt = pts[i];
            if (this.tiles[pt.x] != undefined && this.file[pt.x][pt.y] != undefined && this.tiles[pt.x][pt.y] == 1) {
                return false;
            }

            if (entitiesBlock && this.fight.entities.find((e) => {
                if (ignoredEntity) {
                    return e.x == pt.x && e.y == pt.y && e.id != ignoredEntity;
                } else {
                    return e.x == pt.x && e.y == pt.y;
                }
            })) {
                return false;
            }
        }

        return true;
    }
}