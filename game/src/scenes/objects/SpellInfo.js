import Effects from "../../modules/effects/Effects.js"

export default class SpellInfo extends Phaser.GameObjects.Container {
    constructor(config) {
        super(config.scene, config.x, config.y);

        this.scene = config.scene;
        this.scene.add.existing(this);

        this.spell = config.spell;

        this.create();

        return this;
    }

    create() {
        //
        var background = this.scene.add.graphics();
        background.fillStyle(0xaaaaaa, 0.9);
        background.fillRect(0, 0, 300, 400);
        this.add(background);

        //
        var spellSprite = this.scene.add.sprite(5, 5, this.spell.sprite ? this.spell.sprite : "spell").setDisplaySize(75, 75);
        spellSprite.setOrigin(0, 0);
        this.add(spellSprite);

        //
        var text = this.scene.add.text(150, 40, this.spell.name, {
            fontSize: "30px",
            color: "#FFFFFF",
            strokeThickness: 2,
            stroke: "#000000"
        });
        text.setOrigin(0.5, 0.5);
        this.add(text);

        //
        var apBack = this.scene.add.graphics();
        apBack.fillStyle(0x4295f4, 0.8);
        apBack.fillCircle(265, 45, 30);
        this.add(apBack);

        var apCost = this.scene.add.text(265, 45, this.spell.apCost, {
            color: "#FFFFFF",
            fontSize: 40
        });
        apCost.setOrigin(0.5, 0.5);
        this.add(apCost);

        //
        var aoe = this.scene.add.container(230, 90);
        this.add(aoe);

        var aoeTilesize = 5;
        for (var i = 0; i < this.spell.aoe.length; i++) {
            for (var j = 0; j < this.spell.aoe[i].length; j++) {
                if (this.spell.aoe[i][j]) {
                    var g = this.scene.add.graphics();
                    g.fillStyle(0x79d345, 1);
                    g.fillRect(i * aoeTilesize, j * aoeTilesize, aoeTilesize, aoeTilesize);
                    aoe.add(g);
                }
            }
        }

        //
        var spellData = [];
        spellData.push(`Range ${this.spell.minRange}-${this.spell.maxRange}`);
        if (this.spell.boostRange) {
            spellData.push(`Alterable range`)
        }

        if (this.spell.inLine) {
            spellData.push(`Cast in line`)
        }

        if (this.spell.inDiagonal) {
            spellData.push(`Cast in diagonal`)
        }

        if (!this.spell.los) {
            spellData.push(`No light of sight`)
        }

        if (this.spell.cooldown != 0) {
            spellData.push(`Cooldown ${this.spell.cooldown}`)
        }

        if (this.spell.initialCooldown != 0) {
            spellData.push(`Cooldown ${this.spell.initialCooldown}`)
        }

        if (this.spell.turnCast != 0) {
            spellData.push(`${this.spell.turnCast} cast by turn`)
        }

        if (this.spell.targetCast != 0) {
            spellData.push(`${this.spell.targetCast} cast by target`)
        }

        var spellD = this.scene.add.text(10, 90, spellData, {
            color: "#000000",
            fontSize: 20
        });
        this.add(spellD);

        //Effect
        var effectsData = [];
        this.spell.effects.forEach(effect => {
            if (Effects[effect.effect] && Effects[effect.effect].description) {
                effectsData.push(Effects[effect.effect].description(effect));
            }
        });

        var effectsD = this.scene.add.text(10, 390, effectsData, {
            color: "#000000",
            fontSize: 20
        });
        effectsD.setOrigin(0, 1);

        this.add(effectsD);

        this.visible = false;
    }
}