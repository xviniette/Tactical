import assetFiles from "../../assets.json";

export default class EndTurn extends Phaser.GameObjects.Container {
    constructor(config) {
        super(config.scene, config.x, config.y);

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

        this.ap = this.addText(-100, 0, {
            color: "#0e8bc9"
        });

        this.mp = this.addText(100, 0, {
            color: "#23c90e"
        });

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
        this.ap.setText(this.characteristics.ap);
        this.mp.setText(this.characteristics.mp);
    }
}