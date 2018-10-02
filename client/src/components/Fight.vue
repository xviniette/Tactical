<template>
    <div class="fight">
        <div id="canvas"></div>
        <div class="ui" v-if="fight">
            <div class="spells">
                <div class="spell" v-for="spell in spells" :key="spell.id" @click="selectedSpell = spell.id">
                    {{spell.name}}
                    <img :src="spell.src" width="100%">
                    <!-- <div class="spellInfo">
                        <ul>
                            <li>{{spell.name}}</li>
                            <li>AP : {{spell.apCost}}</li>
                            <li>Range : {{spell.minRange}}-{{spell.maxRange}}<span v-if="spell.boostRange">+</span></li>
                            <li>
                                <svg></svg>
                            </li>
                        </ul>
                    </div> -->
                </div>

                <div class="endTurn" @click="endTurn">
                    END TURN
                </div>
            </div>

            <div class="timeline">
                <div v-for="entity in fight.getAliveEntities()" :key="entity.id" :class="{'currentEntity':getCurrentEntity.id == entity.id}">
                    {{entity.name}} - {{entity.characteristics.currentLife}}
                </div>
            </div>

            <div class="profiles">
                <div v-for="entity in fight.getAliveEntities()" :key="entity.id">
                    {{entity.name}}
                    <ul>
                        <template v-for="(value, attr) in entity.characteristics">
                            <li v-if="value != 0">{{attr}} : {{value}}</li>
                        </template>
                    </ul>
                </div>
            </div>
        </div>
    </div>
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
        user: {
            default: 0
        }
    },
    data() {
        return {
            fight: null,
            phaser: null,
            selectedSpell: null
        }
    },
    methods: {
        createGame() {
            this.fight = new Fight({});
            this.fight.map = new Map(Object.assign(this.FightObject.map, {
                fight: this.fight
            }));

            window.fight = this.fight;

            if (this.FightObject.entities) {
                this.FightObject.entities.forEach(entity => {
                    var e;
                    var data = Object.assign(entity, { fight: this.fight });
                    if (entity.ai) {
                        e = new AI(data);
                    } else {
                        e = new Player(data);
                    }

                    if (entity.spells) {
                        e.spells = [];
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
            const config = {
                type: Phaser.WEBGL,
                parent: "canvas",
                width: 1024,
                height: 780,
            }

            this.phaser = new Phaser.Game(config);

            this.phaser.scene.add("Game", GameScene);
            this.phaser.scene.start("Game", { vue: this, fight: this.fight });

            var resize = () => {
                var w = window.innerWidth;
                var h = window.innerHeight;
                var scale = Math.min(w / config.width, h / config.height);

                this.phaser.canvas.setAttribute('style',
                    ' -ms-transform: scale(' + scale + '); -webkit-transform: scale3d(' + scale + ', 1);' +
                    ' -moz-transform: scale(' + scale + '); -o-transform: scale(' + scale + '); transform: scale(' + scale + ');' +
                    ' transform-origin: top left;'
                );

                var width = w / scale;
                var height = h / scale;
                this.phaser.resize(width, height);
                this.phaser.scene.scenes.forEach((scene) => {
                    if (scene.cameras.main) {
                        scene.cameras.main.setViewport(0, 0, width, height);
                    }
                });
            }

            window.addEventListener('resize', resize);
            if (this.phaser.isBooted) resize();
            else this.phaser.events.once('boot', resize);
        },
        endTurn() {
            this.myEntity.trigger("endTurn");
        }
    },
    computed: {
        myEntity() {
            if (this.fight) {
                return this.fight.entities.find(entity => {
                    return entity.id == this.user;
                });
            }
            return null;
        },
        spells() {
            if (this.myEntity) {
                var spells = [...this.myEntity.spells];

                spells.forEach(spell => {
                    spell.src = this.baseUrl + this.getAssetData(spell.sprite ? spell.sprite : "spell").path;
                });

                return spells;
            }

            return [];
        },
        getAliveEntities() {
            if (this.fight) {
                return [...this.fight.getAliveEntities()];
            }
            return [];
        },
        getCurrentEntity() {
            if (this.fight) {
                return this.fight.currentEntity;
            }
            return null;
        },
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
.fight {
  color: white;
}

.ui {
  position: absolute;
  top: 0;
  left: 0;
}

.spells {
  position: fixed;
  bottom: 2vh;
  left: 2vh;
  text-align: center;
}

.spell {
  display: inline-block;
  width: 8vh;
  margin: 0 1vh;
  color: white;
  text-align: center;
  cursor: pointer;
}

.endTurn {
  position: fixed;
  bottom: 2vh;
  right: 2vh;
  color: white;
}

.currentEntity {
  color: yellow;
}
</style>
