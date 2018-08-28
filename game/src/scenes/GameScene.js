import Fight from "../modules/Fight.js";
import Map from "../modules/Map.js";
import Player from "../modules/Player.js";
import AI from "../modules/AI.js";
import Spell from "../modules/Spell.js";

import assetFiles from "../assets.json";

class GameScene extends Phaser.Scene {
    constructor(test) {
        super({
            key: 'GameScene'
        });

        this.tilesize = { x: 110, y: 55 };
        this.offset = { x: 700, y: 100 };

        this.scaleValue = 1;

        this.spells = [
            {
                id: 1,
                name: "Taper",
                minRange: 2,
                maxRange: 3,
                effects: [
                    { effect: "dommage" }
                ]
            }
        ]

        this.text;
    }

    preload() {
    }

    create() {
        var tileAsset = assetFiles.image.tile0;
        this.scaleValue = this.tilesize.x / tileAsset.width;

        this.fight = new Fight({ scene: this });
        window.fight = this.fight;

        this.fight.map = new Map({ fight: this.fight });

        this.fight.entities = [
            new AI({
                name: "ElBazia",
                x: 7,
                y: 9,
                fight: this.fight,
                team: 1
            }),
            new AI({
                name: "AI",
                x: 9,
                y: 9,
                fight: this.fight,
                team: 2
            })
        ];

        for (var entity of this.fight.entities) {
            for (var spell of this.spells) {
                var s = new Spell(spell);
                s.entity = entity;
                s.fight = this.fight;
                entity.spells.push(s);
            }
        }

        this.drawMap();
        this.setEntitiesSprite();

        this.fight.start();

        this.text = this.add.text(50, 50, 'Phaser', { fontFamily: 'Arial', fontSize: 64, color: '#00ff00' });

    }

    update() {
        var isoPosition = this.getTilePosition(this.input.x, this.input.y);
        this.text.setText(`${isoPosition.x}/${isoPosition.y} - ${this.input.x}/${this.input.y}`);
    }

    getAssetData(assetName, type = "image") {
        if (assetFiles[type] && assetFiles[type][assetName]) {
            return assetFiles[type] && assetFiles[type][assetName];
        }

        return null;
    }

    getIsometricPosition(x, y) {
        return {
            x: (x - y) * this.tilesize.x / 2 + this.offset.x,
            y: (x + y) * this.tilesize.y / 2 + this.offset.y
        };
    }

    getTilePosition(x, y) {
        return {
            x: Math.round(((x - this.offset.x) / (this.tilesize.x / 2) + (y - this.offset.y) / (this.tilesize.y / 2)) / 2),
            y: Math.round(((y - this.offset.y) / (this.tilesize.y / 2) - (x - this.offset.x) / (this.tilesize.x / 2)) / 2)
        }
    }

    createIsometricSprite(x, y, asset) {
        var position = this.getIsometricPosition(x, y);
        var sprite = this.add.sprite(position.x, position.y, asset);
        var assetData = this.getAssetData(asset);
        sprite.setOrigin(assetData.anchorX / assetData.width, assetData.anchorY / assetData.height);
        sprite.setScale(this.scaleValue);
        return sprite;
    }

    drawMap() {
        var tileAsset = assetFiles.image.tile0;

        for (var i = 0; i < this.fight.map.tiles.length; i++) {
            for (var j = 0; j < this.fight.map.tiles[i].length; j++) {
                this.createIsometricSprite(i, j, "tile0");

                if (this.fight.map.tiles[i][j] == 1) {
                    this.createIsometricSprite(i, j, "obstacle");
                }
            }
        }
    }

    setEntitiesSprite() {
        this.fight.entities.forEach((entity) => {
            entity.sprite = this.createIsometricSprite(entity.x, entity.y, "hero")
        });
    }

}

export default GameScene;
