import merge from "./merge.js";

export default class GameMap {
    constructor(json) {
        this.id;
        this.name;
        this.tiles;
        this.playerSpawn = {};
        this.ballSpawns = [];

        this.init(json);
    }

    init(json) {
        merge(this, json);
    }

    isOut(x, y) {
        if (x < 0 || x >= this.tiles.length || y < 0 || y >= this.tiles[x].length) {
            return true;
        }
        return false;
    }

    isEmpty(x, y) {
        if (x < 0 || x >= this.tiles.length || y < 0 || y >= this.tiles[x].length) {
            return false;
        }
        return this.tiles[x][y].type == undefined;
    }

    isBlock(x, y) {
        if (x < 0 || x >= this.tiles.length || y < 0 || y >= this.tiles[x].length) {
            return true;
        }
        return this.tiles[x][y].type === "block";
    }

    isWarp(x, y) {
        if (this.tiles[x] && this.tiles[x][y] && this.tiles[x][y].type && this.tiles[x][y].type == "warp" && this.tiles[x][y].x != undefined && this.tiles[x][y].y != undefined) {
            return this.tiles[x][y];
        }

        return false;
    }

    isGoal(x, y) {
        if (this.tiles[x] && this.tiles[x][y] && this.tiles[x][y].type && this.tiles[x][y].type == "goal" && this.tiles[x][y].team) {
            return this.tiles[x][y].team;
        }

        return false;
    }

    getInfos() {
        return {
            id: this.id,
            name: this.name,
            tiles: this.tiles,
            playerSpawn: this.playerSpawn,
            ballSpawns: this.ballSpawns
        }
    }
}