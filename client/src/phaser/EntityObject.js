import assets from "../config/assets.json";

export default class EntityObject extends Phaser.GameObjects.Container {
    constructor(config) {
        super(config.scene, config.x, config.y, config.key);

        this.scene = config.scene;
        this.scene.add.existing(this);

        this.entity = config.entity;
        
        //SPRITE
        this.entitySprite = this.scene.add.sprite(0, 0, config.entity.sprite);
        var assetData = assets.image[config.entity.sprite];
        this.entitySprite.setOrigin(assetData.anchorX / assetData.width, assetData.anchorY / assetData.height);
        this.add(this.entitySprite);

        //ARROW
        this.turnIndicator = this.scene.add.sprite(0, -250, "arrow").setOrigin(0.5, 1).setFlipY(true).setVisible(false);
        this.scene.tweens.add({
            targets: this.turnIndicator,
            y: "+=30",
            repeat: -1,
            duration: 500,
            yoyo: true,
            ease: "Sine.easeInOut"
        });
        this.add(this.turnIndicator);

        this.updateCharacteristics();
        this.updateDepth();
        return this;
    }

    updateDepth(x, y){
        var eX = x || this.entity.x;
        var eY = y || this.entity.y;

        this.setDepth((eX + eY) * 1000 + 500);
    }

    updateCharacteristics() {
        this.characteristics = this.entity.getCharacteristics();

        if(this.characteristics.currentLife <= 0){
            this.visible = false;
        }else{
            this.visible = true;
        }
    }
}