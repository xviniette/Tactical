<template>
    <div class="spell">
        <img :src="src" width="100%">
    </div>
</template>

<script>
import "phaser";


export default {
    name: 'Spell',
    props: {
        spell: Object,
    },
    data() {
        return {
        }
    },
    computed: {
        src() {
            return this.baseUrl + this.getAssetData(this.spell.sprite ? this.spell.sprite : "spell").path;
        }
    }
}
</script>

<style scoped>
</style>
