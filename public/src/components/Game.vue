<template>
  <div>
    <svg width="800" height="600" v-if="fight">
      <!-- map -->
      <template v-for="(tiles, x) in fight.map.tiles">
        <template v-for="(tile, y) in tiles">
          <rect v-if="tile == 0" :x="tilesize * x" @click="selectedSpell = null" :y="tilesize * y" :width="tilesize" :height="tilesize" style="fill:rgb(200,200,200);stroke-width:1;stroke:rgb(0,0,0)"/>
          <rect v-if="tile == 1" :x="tilesize * x" :y="tilesize * y" :width="tilesize" :height="tilesize" style="fill:rgb(0,0,0);stroke-width:1;stroke:rgb(0,0,0)"/>
        </template>
      </template>

      <!-- movementTiles -->
      <template v-if="movementTiles" v-for="tile in movementTiles">
          <rect @click="move(tile.x, tile.y)" :x="tilesize * tile.x" :y="tilesize * tile.y" :width="tilesize" :height="tilesize" :class="{'green':tile.reachable, 'red':!tile.reachable}"/>
      </template>

      <!-- spellTiles -->
      <template v-if="spellCastTiles" v-for="tile in spellCastTiles">
          <rect v-if="tile.cast" @click="cast(tile.x, tile.y)" :x="tilesize * tile.x" :y="tilesize * tile.y" :width="tilesize" :height="tilesize" style="fill:rgba(65, 143, 244,0.5);stroke-width:1;stroke:rgb(0,0,0)"/>
          <rect v-else :x="tilesize * tile.x" :y="tilesize * tile.y" :width="tilesize" :height="tilesize" style="fill:rgba(66, 215, 244,0.5);stroke-width:1;stroke:rgb(0,0,0)"/>
      </template>

      <!-- entities -->
      <template v-for="entity in fight.entities">
          <circle :cx="tilesize * entity.x + tilesize/2" :cy="tilesize * entity.y + tilesize/2" :r="tilesize/3" style="fill:rgb(0,255,255);stroke-width:1;stroke:rgb(0,0,0)"/>
      </template>
</svg>

    <!-- <svg width="800" height="800" v-if="fight">
      <template v-for="(tiles, x) in fight.map.tiles">
        <template v-for="(tile, y) in tiles">
          <image v-if="tile == 0" xlink:href="../assets/tile.svg" :x="(x - y) * tilesize/2 + 400" :y="(x + y) * tilesize/4" viewBox="0 0 212 106" :width="tilesize" :height="tilesize/2"/>
          <image v-if="tile == 1" xlink:href="../assets/arbre.svg" :x="(x - y) * tilesize/2 + 400" :y="(x + y) * tilesize/4 - tilesize * 0.4" viewBox="0 0 800 106" :width="tilesize"/>
        </template>
      </template>
</svg> -->

<button @click="endTurn">END</button>
<ul><li v-for="spell in entitySpells"><a href="#" @click.prevent="selectedSpell = spell">{{spell.name}} ({{spell.apCost}} PA)</a></li></ul>
<div v-if="fight && fight.entities" v-for="entity of fight.entities">
{{entity.name}} {{entity.characteristics.currentLife}}/{{entity.characteristics.maxLife}} {{entity.characteristics.ap}} {{entity.characteristics.mp}}
</div>
  </div>
</template>

<script>
import Fight from "../modules/Fight.js";
import Map from "../modules/Map.js";
import Player from "../modules/Player.js";
import AI from "../modules/AI.js";
import Spell from "../modules/Spell.js";

window.f;

export default {
  name: "game",
  data() {
    return {
      tilesize: 50,
      fight: null,
      spells: [
        {
          id: 1,
          name: "Taper",
          apCost: 4,
          maxRange: 3,
          minRange: 3,
          effects: [{ effect: "damage", damage: 10 }],
          aoe: [[1]],
          inLine: true
        },
        {
          id: 2,
          name: "Taper2",
          apCost: 1,
          maxRange: 5,
          minRange: 4,
          effects: [{ effect: "damage", damage: 3 }],
          aoe: [[1]],
          inDiagonal: true
        }
        // {
        //   id: 2,
        //   name: "Sauter",
        //   apCost: 6,
        //   minRange: 3,
        //   maxRange: 5,
        //   turnCast: 1,
        //   effects: [{ effect: "jump" }]
        // },
        // {
        //   id: 3,
        //   name: "Taper Loin",
        //   apCost: 3,
        //   minRange: 4,
        //   maxRange: 15,
        //   aoe: [[0, 1, 0], [1, 1, 1], [0, 1, 0]],
        //   los: false,
        //   turnCast: 1,
        //   effects: [{ effect: "damage", damage: 10 }]
        // }
      ],
      mouse: {
        x: 0,
        y: 0
      },
      selectedSpell: null
    };
  },
  computed: {
    currentEntity() {
      if (!this.fight) {
        return null;
      }

      return this.fight.currentEntity;
    },
    entitySpells() {
      if (!this.currentEntity) {
        return [];
      }

      return this.currentEntity.spells;
    },
    movementTiles() {
      if (!this.currentEntity) {
        return [];
      }

      return this.currentEntity.getMovementTiles();
    },
    spellCastTiles() {
      if (!this.selectedSpell) {
        return [];
      }

      return this.selectedSpell.getCastableCells();
    }
  },
  methods: {
    move(x, y) {
      this.currentEntity.move(x, y);
    },
    cast(x, y) {
      this.currentEntity.cast(this.selectedSpell.id, x, y);
    },
    endTurn() {
      this.currentEntity.endTurn();
    }
  },
  mounted() {
    this.fight = new Fight({});

    this.fight.map = new Map({ fight: this.fight });

    window.f = this.fight;

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

    console.log(this.fight);
    this.fight.start();
  }
};
</script>

<style scoped>
.green {
  fill: rgba(4, 179, 12, 0.5);
  stroke-width: 1;
  stroke: rgb(0, 0, 0);
}

.red {
  fill: rgba(255, 0, 0, 0.5);
  stroke-width: 1;
  stroke: rgb(0, 0, 0);
}
</style>
