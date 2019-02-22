import Ball from "./Ball.js";
import Bomb from "./Bomb.js";
import Player from "./Player.js";
import GameMap from "./GameMap.js";
import GameConfigs from "./GameConfigs.json";
import merge from "./merge.js";

export default class Room {
    constructor(json) {
        this.id = Math.floor(Math.random() * 2147483647);

        this.isServer = false;
        this.gameserver;
        this.server;
        this.renderer;

        this.settings = JSON.parse(JSON.stringify(GameConfigs));

        this.map;

        this.score = {
            "1": 0,
            "2": 0
        };

        this.players = [];
        this.spectators = [];
        this.ball;
        this.bombs = [];

        this.ranked = false;

        this.freeJoin = false;
        this.notConnectedCancellation = false;
        this.nbPlayers = 2;
        this.connectedPlayers = {};

        this.state = 0; // 0 : warmup / 1 : playing / 2 : ended
        this.stateTimestamp = Date.now();

        this.warmupTime = 60 * 1000;
        this.connectedWarmupTime = 10 * 1000;
        this.gameTime = 5 * 60 * 1000;
        this.endTime = 60 * 1000;
        this.goalTarget = 7;

        this.spawnInterval;

        this.serverTimes = [];

        this.lastPhysicUpdate = Date.now();
        this.lastSnapshotUpdate = Date.now();

        this.init(json);

        this.setMap(this.map);

        this.start();
    }

    init(json) {
        merge(this, json);
    }

    setMap(mapData) {
        this.map = new GameMap(mapData);
    }

    join(socket, data = {}) {
        if (!this.isServer) {
            return false;
        }

        if (data.invalid && this.freeJoin) {
            return false;
        }

        var p = this.getPlayer(data.id);
        if (!p) {
            p = this.addPlayer(Object.assign(data, {
                socket: socket
            }));
            socket.player = p;
        } else {
            p.socket.player = null;
            p.socket.close();
            p.socket = socket;
            socket.player = p;
        }

        var infos = this.initInfos();
        infos.type = "init";
        p.socket.send(JSON.stringify(infos));
        return p;
    }

    spectate(socket, data = {}) {
        if (!this.isServer) {
            return false;
        }

        if (data.invalid && this.freeJoin) {
            return false;
        }

        var spectator = Object.assign(data, {
            socket: socket
        });

        socket.player = spectator;

        this.spectators.push(spectator);

        var infos = this.initInfos();
        infos.type = "init";
        spectator.socket.send(JSON.stringify(infos));
        return spectator;
    }

    leave(p) {
        if (!this.isServer) {
            return;
        }

        if (this.gameserver) {
            this.gameserver.requestDeleteUserGame(this.id, p.id);
        }

        p.socket.send(JSON.stringify({
            type: 'leaved'
        }));

        this.deletePlayer(p.id);
        var deletePlayerMessage = JSON.stringify({
            type: 'deleteplayer',
            id: p.id
        });

        for (var user of this.getUsers()) {
            user.socket.send(deletePlayerMessage);
        }

        if (this.ranked) {
            var nbPlayers = {
                "1": 0,
                "2": 0
            };

            for (var player of this.players) {
                if (player.team) {
                    nbPlayers[player.team]++;
                }
            }

            for (var team in nbPlayers) {
                if (nbPlayers[team] == 0) {
                    this.score[team] = -1;
                    this.end(false, true);
                    return;
                }
            }
        } else {
            if (this.players.length == 0) {
                this.end(false, true);
            }
        }
    }

    getPlayer(id) {
        for (var i in this.players) {
            if (this.players[i].id == id) {
                return this.players[i];
            }
        }

        return false;
    }

    getUsers() {
        return [...this.players, ...this.spectators];
    }

    addPlayer(p) {
        var player = new Player(p);
        player.game = this;
        player.init(this.settings.physic.player);
        if (p.x != null && p.y != null) {
            player.setPosition(p.x, p.y);
        } else {
            player.setPosition(this.map.playerSpawn.x, this.map.playerSpawn.y);
        }

        if (this.isServer) {
            this.connectedPlayers[player.id] = true;
            if (this.allPlayersHasConnected() && this.state == 0) {
                if (this.stateTimestamp + this.warmupTime - Date.now() > this.connectedWarmupTime) {
                    this.stateTimestamp = Date.now();
                    this.warmupTime = this.connectedWarmupTime;
                }
            }

            var newPlayerMessage = player.initInfos();
            newPlayerMessage.type = 'newplayer';
            newPlayerMessage = JSON.stringify(newPlayerMessage);
            for (var user of this.getUsers()) {
                user.socket.send(newPlayerMessage);
            }
        }

        if (this.renderer) {
            this.renderer.addEvent("addPlayer", player);
        }

        this.players.push(player);
        return player;
    }

    deletePlayer(id) {
        for (var i in this.players) {
            if (this.players[i].id == id) {
                this.players.splice(i, 1);
                return true;
            }
        }
        return false;
    }

    allPlayersHasConnected() {
        if (!this.isServer) {
            return true;
        }

        if (Object.keys(this.connectedPlayers).length == this.nbPlayers) {
            return true;
        }

        return true;
    }

    start() {
        this.state = 0;
        this.stateTimestamp = Date.now();
    }

    update() {
        var now = Date.now();

        switch (this.state) {
            case 0:
                if (now > this.stateTimestamp + this.warmupTime) {
                    if (this.notConnectedCancellation && !this.allPlayersHasConnected()) {
                        this.end(true);
                    } else {
                        this.stateTimestamp = now;
                        this.state = 1;
                        this.spawnBall();
                    }
                }
                break;
            case 1:
                if (this.gameTime >= 0 && now > this.stateTimestamp + this.gameTime) {
                    this.end();
                }
                break;
            case 2:
                if (now > this.stateTimestamp + this.endTime) {
                    this.kill();
                }
                break;
        }

        for (var player of this.players) {
            player.update();
        }

        if (this.ball) {
            this.ball.update();
            if (this.isServer && this.ball) {
                this.ball.addPosition(now, {
                    x: this.ball.x,
                    y: this.ball.y
                });

                for (var i = 0; i < this.ball.positions.length; i++) {
                    if (this.ball.positions[i].t > now - this.settings.physic.maxCompensationTime) {
                        this.ball.positions.splice(0, i - 1);
                        break;
                    }
                }
            }
        }

        for (var bomb of this.bombs) {
            bomb.update();
            if (this.isServer && bomb) {
                bomb.addPosition(now, {
                    x: bomb.x,
                    y: bomb.y
                });

                for (var i = 0; i < bomb.positions.length; i++) {
                    if (bomb.positions[i].t > now - this.settings.physic.maxCompensationTime) {
                        bomb.positions.splice(0, i - 1);
                        break;
                    }
                }
            }
        }
    }

    interpolate(t, excludedPlayer) {
        if (this.ball) {
            this.ball.interpolate(t);
        }

        for (var player of this.players) {
            if (player.id != excludedPlayer) {
                player.interpolate(t);
            }
        }

        for (var bomb of this.bombs) {
            bomb.interpolate(t);
        }

        for (var i = 0; i < this.serverTimes.length - 1; i++) {
            if (this.serverTimes[i].t < t && this.serverTimes[i + 1].t >= t) {
                var ratio = (t - this.serverTimes[i].t) / (this.serverTimes[i + 1].t - this.serverTimes[i].t);
                var serverTime = this.serverTimes[i].serverTime + (this.serverTimes[i + 1].serverTime - this.serverTimes[i].serverTime) * ratio;
                this.serverTimes.splice(0, i - 1);
                return serverTime;
            }
        }

        return Date.now();
    }

    serverUpdate() {
        if (!this.isServer) {
            return;
        }

        var now = Date.now();
        var physicDelta = now - this.lastPhysicUpdate;
        if (physicDelta >= 1000 / this.settings.physic.FPS) {
            this.lastPhysicUpdate = now - (physicDelta - 1000 / this.settings.physic.FPS);
            this.update();
        }

        var snapshotDelta = now - this.lastSnapshotUpdate;
        if (snapshotDelta >= 1000 / this.settings.physic.NETWORKFPS) {
            this.lastSnapshotUpdate = now - (snapshotDelta - 1000 / this.settings.physic.NETWORKFPS);
            this.snapshot();
        }
    }

    snapshot() {
        if (this.isServer) {
            var snapshot = this.snapshotInfos();
            snapshot.type = "snapshot";
            var snapshot = JSON.stringify(snapshot);

            for (var user of this.getUsers()) {
                user.socket.send(snapshot);
            }
        }
    }

    end(cancelled = false, forfeit = false) {
        var gameDuration = Date.now() - this.stateTimestamp;

        clearTimeout(this.spawnInterval);
        this.spawnInterval = null;
        this.deleteBall();
        this.state = 2;
        this.stateTimestamp = Date.now();

        if (!this.isServer) {
            return;
        }

        var endGameData = {
            type: "end",
            id: null,
            score: this.score,
            duration: gameDuration,
            ranked: this.ranked,
            cancelled: cancelled,
            forfeit: forfeit,
        }

        if (this.ranked && !cancelled && this.gameserver) {
            var data = {
                id: this.id,
                map: this.map.id,
                score: this.score,
                duration: gameDuration,
                players: []
            };

            for (var player of this.players) {
                data.players.push({
                    id: player.id,
                    team: player.team
                });
            }

            this.gameserver.requestPostMatch(data, (err, body) => {
                if (!err) {
                    endGameData.id = JSON.parse(body).id;
                }

                endGameData = JSON.stringify(endGameData);
                for (var user of this.getUsers()) {
                    user.socket.send(endGameData);
                }
            });
        } else {
            endGameData = JSON.stringify(endGameData);
            for (var user of this.getUsers()) {
                user.socket.send(endGameData);
            }
        }

        if (this.gameserver) {
            this.gameserver.deleteRoomRequest(this.id);
        }
    }

    kill() {
        if (this.isServer) {
            for (var user of this.getUsers()) {
                user.socket.close();
            }
        }

        if (this.gameserver) {
            this.gameserver.deleteRoom(this.id);
        }
    }

    spawnBall(data = {}) {
        this.ball = new Ball(Object.assign({
            game: this
        }, this.settings.physic.ball));
        if (data.x && data.y) {
            this.ball.setPosition(data.x, data.y);
        } else {
            var position = this.map.ballSpawns[Math.floor(Math.random() * this.map.ballSpawns.length)];
            this.ball.setPosition(position.x, position.y);
        }

        if (this.renderer) {
            this.renderer.addEvent("spawnBall", this.ball);
        }

        clearTimeout(this.spawnInterval);
        this.spawnInterval = null;
    }

    spawnBallIn(time) {
        if (this.spawnInterval == null) {
            this.spawnInterval = setTimeout(() => {
                this.spawnBall();
            }, time);
        }
    }

    deleteBall() {
        if (this.renderer) {
            this.renderer.addEvent("deleteBall", this.ball);
        }

        this.ball = null;
    }

    goal(team) {
        this.score[team]++;

        if (this.isServer) {
            var goalMessage = JSON.stringify({
                type: "goal",
                team: team,
                score: this.score
            });

            for (var user of this.getUsers()) {
                user.socket.send(goalMessage);
            }
        }

        if (this.goalTarget && this.score[team] == this.goalTarget) {
            this.end();
        }
    }

    getUserBomb(id) {
        for (var bomb of this.bombs) {
            if (bomb.player.id == id) {
                return bomb;
            }
        }
        return false;
    }

    addBomb(player, position) {
        var bomb = new Bomb(Object.assign({
            game: this,
            player: player
        }, this.settings.physic.bomb));

        if (position) {
            bomb.setPosition(position.x, position.y);
        } else {
            bomb.setPosition(player.x, player.y);
        }

        if (!player.onGround) {
            bomb.dx = bomb.jumpCreation.x * player.direction.x;
            bomb.dy = bomb.jumpCreation.y;
        }

        if (this.renderer) {
            this.renderer.addEvent("addBomb", bomb);
        }

        this.bombs.push(bomb);
        return bomb;
    }

    deleteBomb(bomb) {
        if (this.renderer) {
            this.renderer.addEvent("deleteBomb", bomb);
        }

        for (var i in this.bombs) {
            if (this.bombs[i].player.id == bomb.player.id) {
                this.bombs.splice(i, 1);
                return true;
            }
        }
        return false;
    }

    getTimer() {
        switch (this.state) {
            case 0:
                return this.stateTimestamp + this.warmupTime - Date.now();
            case 1:
                return this.stateTimestamp + this.gameTime - Date.now();
            case 2:
                return this.stateTimestamp + this.endTime - Date.now();
        }

        return 0;
    }

    isLocal() {
        return !this.server;
    }

    initInfos() {
        var data = {
            id: this.id,
            settings: this.settings,
            score: this.score,
            ranked: this.ranked,
            map: this.map.getInfos(),
            ball: null,
            players: [],
            bombs: [],
            state: this.state,
            timer: this.getTimer()
        };

        if (this.ball) {
            data.ball = this.ball.snapshotInfos();
        }

        for (var i in this.players) {
            data.players.push(this.players[i].initInfos());
        }

        for (var i in this.bombs) {
            data.bombs.push(this.bombs[i].snapshotInfos());
        }

        return data;
    }

    snapshotInfos() {
        var data = {
            serverTime: Date.now(),
            ball: null,
            players: [],
            bombs: [],
            state: this.state,
            timer: this.getTimer()
        };

        if (this.ball) {
            data.ball = this.ball.snapshotInfos();
        }

        for (var i in this.players) {
            data.players.push(this.players[i].snapshotInfos());
        }

        for (var i in this.bombs) {
            data.bombs.push(this.bombs[i].snapshotInfos());
        }

        return data;
    }
}