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
        this.add(this.spellSprite);
        this.spellSprite.setInteractive({
            useHandCursor: true
        });

        //APCOST
        this.graphics = this.scene.add.graphics();
        this.graphics.fillStyle(0x4295f4, 0.8);
        this.graphics.fillCircle(0, 75 / 2, 15);
        this.add(this.graphics);

        this.apCost = this.scene.add.text(0, 75 / 2, this.spell.apCost, {
            color: "#FFFFFF",
            fontSize: 30
        });
        this.apCost.setOrigin(0.5, 0.5);
        this.add(this.apCost);

        //CD
        this.cd = this.scene.add.text(75 / 2, -75 / 2, "", {
            color: "#FFFFFF",
            fontSize: 18
        });
        this.cd.setOrigin(1, 0);
        this.add(this.cd);

        this.spellSprite.on("pointerdown", () => {
            this.scene.selected.spell = this.spell.id;
            this.scene.setTiles();
        });

        this.spellSprite.on("pointerover", () => {
            this.scene.ui.spellsInfo[this.spell.id].setVisible(true);
        });

        this.spellSprite.on("pointerout", () => {
            this.scene.ui.spellsInfo[this.spell.id].setVisible(false);
        });

        return this;
    }

    update() {
        if (this.spell.canUse()) {
            this.spellSprite.setTint(0xFFFFFF);
        } else {
            this.spellSprite.setTint(0x828282);
        }

        var cd = this.spell.getCooldown();
        if (cd != 0) {
            this.cd.setText(cd);
        } else {
            this.cd.setText("");
        }
    }
}