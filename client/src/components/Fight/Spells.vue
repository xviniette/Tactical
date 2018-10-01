<template>
    <div class="spells">
        <Spell v-for="spell in spells" :key="spell.id" :spell="spell" />
    </div>
</template>

<script>
import "phaser";

import Spell from "./Spell.vue"

export default {
    name: 'Spells',
    props: {
        fight: Object,
        user: [String, Number]
    },
    data() {
        return {

        }
    },
    methods: {

    },
    computed: {
        entity() {

        },
        spells() {
            if (this.entity) {
                var spells = [...this.Fight.fight.entity.spells];

                spells.forEach(spell => {
                    spell.src = this.baseUrl + this.getAssetData(spell.sprite ? spell.sprite : "spell").path;
                });

                return spells;
            }

            return [];
        }
    },
    mounted() {
    }
}
</script>

<style scoped>
.spells {
  position: fixed;
  bottom: 4vh;
  text-align: center;
}

.spell {
  display: inline-block;
  margin: 0 1vh;
  color: red;
}
</style>
