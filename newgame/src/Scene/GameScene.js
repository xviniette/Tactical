import Room from "../engine/Room";
import config from "../config"
import http from "../http"
import utils from "../modules/utils"

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({
            key: 'GameScene'
        });

        this.tilesize = 32;
    }

    init(data) {}

    create(data) {
        this.controller = this.scene.get("Controller");

        this.room;
        this.ws;
        this.clientId;
        this.lastTick = null;

        this.cursor = this.input.keyboard.createCursorKeys();

        this.ui = this.add.container();

        this.timer = this.add.text(this.sys.game.config.width / 2, 10, '00:00', {
            fontFamily: 'Arial',
            fontSize: 64,
            color: '#FFFFFF'
        }).setOrigin(0.5, 0);

        this.score = {
            1: this.add.text(10, 10, '1', {
                fontFamily: 'Arial',
                fontSize: 64,
                color: '#0000FF'
            }).setOrigin(0, 0),
            2: this.add.text(this.sys.game.config.width - 10, 10, '2', {
                fontFamily: 'Arial',
                fontSize: 64,
                color: '#FF0000'
            }).setOrigin(1, 0),
        }

        this.ui.add(this.timer);
        this.ui.add(this.score[1]);
        this.ui.add(this.score[2]);

        this.ui.setDepth(1000);

        if (this.controller.usergame) {
            this.setUsergame(this.controller.usergame);
        }
    }

    setUsergame(usergame) {
        this.clientId = usergame.user.id;

        if (usergame.game.server) {
            this.initOnline(usergame);
        } else {
            var data = JSON.parse(JSON.stringify(usergame.game));
            data.map = this.controller.maps.find(map => map.id == data.map);
            data.players = [usergame.user];
            data.server = false;
            data.settings = {
                physic: {
                    ball: {
                        respawnTime: 100
                    }
                }
            };
            this.gameInit(data);
        }
    }

    gameInit(data) {
        data.renderer = this;
        this.room = new Room(data);
        this.room.setMap(data.map);

        this.room.players = [];
        this.room.bombs = [];
        this.room.ball = null;

        if (data.players) {
            for (var player of data.players) {
                this.room.addPlayer(player);
            }
        }

        this.lastTick = Date.now();
        this.initRender();
    }

    addEvent(type, data) {
        switch (type) {
            case "addPlayer":

                break;
            case "deleteBomb":
                var explosion = this.add.sprite(data.x * this.tilesize, data.y * this.tilesize, 'explosion');
                explosion.anims.load('explosion');
                explosion.anims.play('explosion');
                explosion.setDisplaySize(data.explosionRadius * this.tilesize * 2, data.explosionRadius * this.tilesize * 2);
                explosion.on('animationcomplete', () => {
                    explosion.destroy();
                }, this);
                data.sprite.destroy();
                break;

            case "deleteBall":
                data.sprite.destroy();
                break;
        }
    }

    initRender() {
        if (!this.room.server) {
            this.ui.setVisible(false);
        }

        this.score[1].setText(this.room.score[1]);
        this.score[2].setText(this.room.score[2]);

        var tiles = this.room.map.tiles;

        for (var x = 0; x < tiles.length; x++) {
            for (var y = 0; y < tiles[x].length; y++) {
                var sprite = null;

                switch (tiles[x][y].type) {
                    case 'warp':
                        sprite = this.add.sprite(0, 0, "warph", 0);
                        var animation = "warph";
                        if (this.room.map.isEmpty(x - 1, y) || this.room.map.isEmpty(x + 1, y)) {
                            animation = "warpv";
                        }
                        sprite.anims.load(animation);
                        sprite.anims.play(animation);
                        break;
                    case 'goal':
                        if (tiles[x][y].team == 1) {
                            sprite = this.add.sprite(0, 0, "goal", 0);
                        } else {
                            sprite = this.add.sprite(0, 0, "goal", 1);
                        }
                        break;
                    case 'block':
                        if (this.room.map.isBlock(x, y - 1)) {
                            sprite = this.add.sprite(0, 0, "ground", 1);
                        } else {
                            sprite = this.add.sprite(0, 0, "ground", 0);
                        }
                        break;
                    default:
                        if (this.room.map.isBlock(x, y + 1)) {
                            if (Math.random() < 0.3) {
                                sprite = this.add.sprite();
                                sprite.anims.load("grass");
                                sprite.anims.delayedPlay(Math.random() * 1000, "grass");
                            }
                        }
                        break;
                }

                if (sprite) {
                    sprite.setPosition(x * this.tilesize, y * this.tilesize);
                    sprite.setDisplaySize(this.tilesize, this.tilesize);
                    sprite.setOrigin(0, 0);
                }
            }
        }
    }

    getInputs(reverse = false) {
        var inputs = {};

        if (this.cursor.up.isDown) {
            inputs.j = true;
        }
        if (this.cursor.up.isDown) {
            inputs.j = true;
        }
        if (this.cursor.down.isDown) {
            inputs.u = true;
        }
        if (this.cursor.space.isDown) {
            inputs.k = true;
        }
        if (this.cursor.left.isDown) {
            if (reverse) {
                inputs.r = true;
            } else {
                inputs.l = true;
            }
        }
        if (this.cursor.right.isDown) {
            if (reverse) {
                inputs.l = true;
            } else {
                inputs.r = true;
            }
        }

        return inputs;
    }

    update() {
        if (this.room) {
            this.physicUpdate();

            this.room.players.forEach(player => {
                if (!player.sprite) {
                    var shape = new Phaser.Geom.Circle(0, 0, this.tilesize / 2);
                    player.sprite = this.add.graphics({
                        fillStyle: {
                            color: 0xf4e241
                        }
                    });
                    player.sprite.fillCircleShape(shape);
                }

                player.sprite.setPosition(player.x * this.tilesize, player.y * this.tilesize);
            });

            this.room.bombs.forEach(bomb => {
                if (!bomb.sprite) {
                    var size = this.tilesize * bomb.radius * 2 * 2;
                    bomb.sprite = this.add.sprite(0, 0, "bomb").setDisplaySize(size, size).anims.load("bomb").anims.play("bomb");
                }

                bomb.sprite.setPosition(bomb.x * this.tilesize, bomb.y * this.tilesize);
            });

            if (this.room.ball) {
                if (!this.room.ball.sprite) {
                    this.room.ball.sprite = this.add.sprite(0, 0, "ball").setDisplaySize(this.tilesize, this.tilesize);
                }

                this.room.ball.sprite.setPosition(this.room.ball.x * this.tilesize, this.room.ball.y * this.tilesize);
            }
        }
    }

    physicUpdate() {
        var hasServer = this.room.server;
        var interval = 1000 / this.room.settings.physic.FPS;
        var maxStepsCumul = 10;
        var now = Date.now();

        var delta = now - this.lastTick;

        for (var i = 0; i < Math.min(maxStepsCumul, Math.floor(delta / interval)); i++) {
            var player = this.room.getPlayer(this.clientId);

            if (player) {
                var reverse = player.team == 2 ? true : false;
                reverse = false;
                var inputs = this.getInputs(reverse);

                player.inpSeq++;
                inputs.inpSeq = player.inpSeq;
            }

            if (hasServer) {
                var serverTime = this.room.interpolate(now - (1000 / this.room.settings.physic.NETWORKFPS) * 1.1, player ? player.id : null);

                if (player) {
                    inputs.serverTime = serverTime;
                    if (this.ws) {
                        this.ws.send(JSON.stringify({
                            type: 'inputs',
                            inputs: inputs
                        }));
                    }
                    player.update([inputs], false);
                    inputs.data = player.snapshotInfos();
                    player.inputs.push(inputs);
                }
            } else {
                if (player) {
                    player.inputs.push(inputs);
                }
                this.room.update();
            }
        }
        this.lastTick = now - (delta % interval);
    }

    initOnline(usergame) {
        if (usergame.game.server.IP == "127.0.0.1") {
            usergame.game.server.IP = config.baseUrl;
            usergame.game.server.ACCESS = `${config.baseUrl}:${usergame.game.server.PORT}`;
        }

        if (this.ws) {
            this.ws.close();
        }

        this.ws = new WebSocket(`ws://${usergame.game.server.ACCESS}`)

        this.ws.onopen = () => {
            this.ws.send(JSON.stringify({
                type: 'join',
                token: usergame.token
            }));
        }

        this.ws.onmessage = (e) => {
            var msg = JSON.parse(e.data);
            switch (msg.type) {
                case 'init':
                    this.gameInit(Object.assign(msg, {
                        server: true
                    }));
                    break;
                case 'snapshot':
                    var now = Date.now();
                    if (!this.room) {
                        return;
                    }

                    this.timer.setText(utils.timeFormat(msg.timer));

                    this.room.serverTimes.push({
                        t: now,
                        serverTime: msg.serverTime
                    });

                    if (msg.ball) {
                        if (this.room.ball) {
                            this.room.ball.addPosition(now, msg.ball);
                        } else {
                            this.room.spawnBall();
                            this.room.ball.setPosition(msg.ball.x, msg.ball.y);
                        }
                    } else {
                        if (this.room.ball) {
                            this.room.ball.sprite.destroy();
                        }
                        this.room.ball = null;
                    }

                    for (var player of msg.players) {
                        var p = this.room.getPlayer(player.id);
                        if (p) {
                            p.addPosition(now, player);
                        }

                        if (this.clientId == p.id) {
                            for (var index = 0; index < p.inputs.length; index++) {
                                var input = p.inputs[index];
                                if (input.inpSeq == player.inpSeq) {
                                    var isSame = true;
                                    for (var attr of ['x', 'y', 'dx', 'dy', 'rx', 'ry', 'stun']) {
                                        if (player[attr] != input.data[attr]) {
                                            isSame = false;
                                            break;
                                        }
                                    }

                                    p.inputs.splice(0, index + 1);
                                    if (!isSame) {
                                        console.log('RECONS')
                                        p.setPosition(player.x, player.y);
                                        p.init(player);
                                        p.update(p.inputs);
                                    }
                                    break;
                                }
                            }
                        }
                    }

                    for (var bomb of msg.bombs) {
                        var b = this.room.getUserBomb(bomb.player.id);
                        if (b) {
                            b.addPosition(now, bomb);
                        } else {
                            b = this.room.addBomb(this.room.getPlayer(bomb.player.id), {
                                x: bomb.x,
                                y: bomb.y
                            });
                        }
                        b.state = bomb.state;
                    }

                    for (var bomb of this.room.bombs) {
                        if (msg.bombs.findIndex((b) => {
                                return bomb.player.id == b.player.id;
                            }) < 0) {
                            this.room.deleteBomb(bomb);
                        }
                    }

                    break;
                case 'goal':
                    this.score[1].setText(msg.score[1]);
                    this.score[2].setText(msg.score[2]);
                    break;
                case 'leaved':
                    if (this.ws) {
                        this.ws.close();
                        this.ws = null;
                    }
                    break;
                case 'end':
                    if (this.ws) {
                        // this.ws.close();
                        // this.ws = null;
                    }
                    break;
                case 'newplayer':
                    if (this.room) {
                        this.room.addPlayer(msg);
                    }
                    break;
                case 'deleteplayer':
                    if (this.room) {
                        this.room.deletePlayer(msg.id);
                    }
                    break;
            }
        }

        this.ws.onclose = () => {
            this.ws = null;
        }
    }
}