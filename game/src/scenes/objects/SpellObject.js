import COLORS from "../COLORS.json"

export default class SpellObject extends Phaser.GameObjects.Container {
    constructor(config) {
        super(config.scene, config.x, config.y);

        this.scene = config.scene;
        this.scene.add.existing(this);

        this.spell = config.spell;

        //Background
        this.spellSprite = this.scene.add.sprite(0, 0, this.spell.sprite ? this.spell.sprite : "spell").setDisplaySize(75, 75);
        this.spellSprite.setOrigin(0.5, 0.5);
        this.spellSprite.spell = this.spell;
        this.add(this.spellSprite);
        this.spellSprite.setInteractive({ useHandCursor: true });

        //APCOST
        this.graphics = this.scene.add.graphics();
        this.graphics.fillStyle(0x4295f4, 0.8);
        this.graphics.fillCircle(0, 75/2, 15);
        this.add(this.graphics);

        this.apCost = this.scene.add.text(0, 75/2, this.spell.apCost, {
            color: "#FFFFFF",
            fontSize: 30
        });

        this.apCost.setOrigin(0.5, 0.5);

        this.add(this.apCost);

        var that = this;
        this.spellSprite.on("pointerdown", function () {
            that.scene.selected.spell = this.spell.id;
            that.scene.setTiles();
        });

        return this;
    }

    update() {
        if (this.spell.canUse()) {
            this.spellSprite.alpha = 1;
        } else {
            this.spellSprite.alpha = 0.5;
        }
    }
}