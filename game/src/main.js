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

function resize() {
    var w = window.innerWidth;
    var h = window.innerHeight;
    var scale = Math.min(w / config.width, h / config.height);
    
    game.canvas.setAttribute('style',
        ' -ms-transform: scale(' + scale + '); -webkit-transform: scale3d(' + scale + ', 1);' +
        ' -moz-transform: scale(' + scale + '); -o-transform: scale(' + scale + '); transform: scale(' + scale + ');' +
        ' transform-origin: top left;'
    );
    
    const width = w / scale;
    const height = h / scale;
    game.resize(width, height);
}

window.addEventListener('resize', resize);
if(game.isBooted) resize();
else game.events.once('boot', resize);
