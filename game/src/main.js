import 'phaser';
import BootScene from './scenes/BootScene';
import GameScene from './scenes/GameScene';

const config = {
    type: Phaser.WEBGL,
    parent: 'content',
    width: 1024,
    height: 780,
    scene: [
        BootScene,
        GameScene
    ],
};

const game = new Phaser.Game(config);

// function resize() {
//     var w = window.innerWidth;
//     var h = window.innerHeight;

//     game.resize(w, h);
//     game.scene.scenes.forEach(function (scene) {
//         if(scene.cameras.main){
//             scene.cameras.main.setViewport(0, 0, w, h);
//             scene.resize();
//         }
//     });
// }

// window.addEventListener('resize', resize);
// if (game.isBooted) resize();
// else game.events.once('boot', resize);