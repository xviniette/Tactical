<template>
  <div id="app">
    <Fight :FightObject="json" />
  </div>
</template>

<script>
import Fight from './components/Fight.vue'

export default {
  name: 'app',
  components: {
    Fight
  },
  data() {
    return {
      json: {
        entities: [
          {
            "id": 0,
            "name": "Vincent",
            "team": 1,
            "x": 4,
            "y": 3,
            "sprite": "hero",
            "defaultCharacteristics": {
              "initiative": 100
            },
            "spells": [{
              "name": "Taper",
              "sprite": "spell_damage",
              "minRange": 1,
              "maxRange": 10,
              "apCost": 3,
              "aoe": [
                [1]
              ],
              "cooldown": 1,
              "effects": [{
                "effect": "damage",
                "damage": 10
              }]
            }, {
              "name": "Sauter",
              "minRange": 1,
              "maxRange": 5,
              "los": false,
              "apCost": 3,
              "aoe": [
                [
                  1, 1, 1
                ]
              ],
              "effects": [{
                "target": "castedCells",
                "effect": "teleport"
              }]
            },
            ]
          },
          {
            "name": "AI",
            "ai": true,
            "team": 2,
            "x": 6,
            "y": 4,
            "sprite": "monster2",
            "spells": [{
              "name": "Taper",
              "minRange": 0,
              "maxRange": 3,
              "apCost": 3,
              "aoe": [
                [0, 0, 1, 0, 0],
                [0, 1, 0, 1, 0],
                [1, 0, 0, 0, 1],
                [0, 1, 0, 1, 0],
                [0, 0, 1, 0, 0],
              ],
              "effects": [{
                "effect": "damage",
                "damage": 10
              }]
            }]
          },
        ],
        "map": {
          "tiles": [
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, -1, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 1, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 1, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0]
          ]
        }
      }
    }
  }
}
</script>

<style>
body {
  background-color: black;
  margin: 0px;
  padding: 0;
}
</style>
