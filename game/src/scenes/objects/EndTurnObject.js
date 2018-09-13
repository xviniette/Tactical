export default class EndTurn extends Phaser.GameObjects.Container {
    constructor(config) {
        super(config.scene, config.x, config.y);

        this.scene = config.scene;
        this.scene.add.existing(this);

        this.okText = this.scene.add.text(0, 0, "OK", {
            color: "#FFFFFF",
            fontSize: 30
        }).setInteractive();

        this.okText.setOrigin(0.5, 0.5);
        this.add(this.okText);

        this.okText.on("pointerdown", () => {
            var entity = this.scene.fight.getEntity(this.scene.me);
            if (entity) {
                entity.endTurn();
            }
        });

        return this;
    }
}