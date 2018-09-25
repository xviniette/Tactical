<template>
    <div id="canvas"></div>
</template>

<script>
import Fight from "../modules/Fight.js";
import Map from "../modules/Map.js";
import Player from "../modules/Player.js";
import AI from "../modules/AI.js";
import Spell from "../modules/Spell.js";

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
                    var e;
                    var data = Object.assign(entity, { fight: this.fight });
                    if (entity.ai) {
                        e = new AI(data);
                    } else {
                        e = new Player(data);
                    }

                    if (entity.spells) {
                        entity.spells.forEach(spell => {
                            var s = new Spell(spell);
                            s.fight = this.fight;
                            s.entity = e;
                            e.spells.push(s);
                        });
                    }

                    this.fight.entities.push(e);
                });
            }

            this.fight.start();
        }
    },
    mounted() {
        this.createGame();
    }
}
</script>

<style scoped>
</style>
