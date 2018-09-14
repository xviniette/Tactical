import SpellObject from "./SpellObject.js"

export default class SpellsObject extends Phaser.GameObjects.Container {
    constructor(config) {
        super(config.scene, config.x, config.y);

        this.scene = config.scene;
        this.scene.add.existing(this);

        this.generateMySpells();

        return this;
    }

    generateMySpells() {
        if (this.scene.me == undefined || !this.scene.fight == undefined) {
            return;
        }

        var entity = this.scene.fight.getAliveEntities().find((e) => {
            return e.id == this.scene.me
        });

        if (!entity) {
            return;
        }

        this.removeAll(true);

        entity.spells.forEach((spell, index) => {
            var spellObject = new SpellObject({
                x: index * 100,
                y: 0,
                spell: spell,
                scene: this.scene
            });

            this.add(spellObject);
        });
    }
}