import assetFiles from "../../assets.json";

export default class EntityObject extends Phaser.GameObjects.Container {
    constructor(config) {
        super(config.scene, config.x, config.y, config.key);

        this.scene = config.scene;
        this.scene.add.existing(this);

        //SPRITE
        this.entitySprite = this.scene.add.sprite(0, 0, config.entity.sprite);
        var assetData = assetFiles.image[config.entity.sprite];
        this.entitySprite.setOrigin(assetData.anchorX / assetData.width, assetData.anchorY / assetData.height);
        this.add(this.entitySprite);

        //STATS
        this.life = this.addText(0, 50, {
            color: "#D30A0A"
        });

        //ARROW
        this.turnIndicator = this.scene.add.sprite(0, -250, "arrow").setOrigin(0.5, 1).setFlipY(true).setVisible(false);
        this.scene.tweens.add({
            targets: this.turnIndicator,
            y: "+=30",
            repeat:-1,
            duration: 500,
            yoyo:true,
            ease:"Sine.easeInOut"
        });
        this.add(this.turnIndicator);

        this.setCharacteristics(config.entity.getCharacteristics());
        return this;
    }

    addText(x = 0, y = 0, style = {}) {
        var text = this.scene.add.text(x, y, "", Object.assign({
            fontSize: "60px",
            color: "#FFFFFF",
            strokeThickness: 20,
            stroke: "#FFFFFF"
        }, style));

        text.setOrigin(0.5, 0.5);
        this.add(text);

        return text;
    }

    setCharacteristics(characteristics) {
        this.characteristics = characteristics;

        this.life.setText(this.characteristics.currentLife);
    }
}