<template>
    <div id="canvas"></div>
</template>

<script>
import "phaser";

import Fight from "../modules/Fight.js";
import Map from "../modules/Map.js";
import Player from "../modules/Player.js";
import AI from "../modules/AI.js";
import Spell from "../modules/Spell.js";

import GameScene from "../phaser/GameScene.js"

export default {
    name: 'Fight',
    props: {
        FightObject: Object,
        me: {
            default: 0
        }
    },
    data() {
        return {
            fight: null,
            phaser: null,
        }
    },
    methods: {
        createGame() {
            this.fight = new Fight({});

            this.fight.map = new Map(Object.assign(this.FightObject.map, {
                fight: this.fight
            }));

            if (this.FightObject.entities) {
                this.FightObject.entities.forEach(entity => {
                    let e;
                    var data = Object.assign(entity, { fight: this.fight });
                    if (entity.ai) {
                        e = new AI(data);
                    } else {
                        e = new Player(data);
                    }

                    if (entity.spells) {
                        entity.spells.forEach(spell => {
                            const s = new Spell(spell);
                            s.fight = this.fight;
                            s.entity = e;
                            e.spells.push(s);
                        });
                    }

                    this.fight.entities.push(e);
                });
            }

            this.fight.start();
        },
        createPhaser() {
            this.phaser = new Phaser.Game({
                type: Phaser.WEBGL,
                parent: 'content',
                width: 1024,
                height: 780,
            });

            this.phaser.scene.add("Game", GameScene);
            this.phaser.scene.start("Game", { vue: this, fight: this.fight });
        }
    },
    mounted() {
        this.createGame();
        this.createPhaser();
    },
    beforeDestroy() {
        if (this.phaser) {
            this.phaser.destroy();
        }
    }
}
</script>

<style scoped>
</style>
