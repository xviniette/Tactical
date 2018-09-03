import 'phaser';
import BootScene from './scenes/BootScene';
import GameScene from './scenes/GameScene';

const config = {
    type: Phaser.WEBGL,
    parent: 'content',
    width: 800,
    height: 600,
    scene: [
        BootScene,
        GameScene
    ],
};

const game = new Phaser.Game(config);