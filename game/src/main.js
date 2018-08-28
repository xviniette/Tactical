import 'phaser';
import BootScene from './scenes/BootScene';
import GameScene from './scenes/GameScene';

const config = {
    type: Phaser.WEBGL,
    // pixelArt: true,
    // roundPixels: true,
    parent: 'content',
    width: 1200,
    height: 900,
    scene: [
        BootScene,
        GameScene
    ]
};

const game = new Phaser.Game(config);