import 'phaser';
import BootScene from './Scene/BootScene';
import PreloaderScene from './Scene/PreloaderScene';
import Controller from './Scene/Controller';

import TutorialScene from './Scene/TutorialScene';
import HomeScene from './Scene/HomeScene';
import GameScene from './Scene/GameScene';
import ParametersScene from './Scene/ParameterScene';
import ProfileScene from './Scene/ProfileScene';
import RankingScene from './Scene/RankingScene';

import config from './config';

var game;

const resize = () => {
    var windowWidth = window.innerWidth;
    var windowHeight = window.innerHeight;
    var windowRatio = windowWidth / windowHeight;
    var gameRatio = game.config.width / game.config.height;

    var canvas = document.querySelector('#game');

    if (windowRatio < gameRatio) {
        canvas.style.width = windowWidth + 'px';
        canvas.style.height = (windowWidth / gameRatio) + 'px';
    } else {
        canvas.style.width = (windowHeight * gameRatio) + 'px';
        canvas.style.height = windowHeight + 'px';
    }
}

window.onload = () => {
    game = new Phaser.Game({
        type: Phaser.AUTO,
        canvas: document.getElementById('game'),
        width: 1280,
        height: 960,
        scene: [
            BootScene,
            PreloaderScene,
            TutorialScene,
            GameScene,
            ParametersScene,
            HomeScene,
            Controller,
            ProfileScene,
            RankingScene
        ],
    });

    resize();
    window.addEventListener('resize', resize, false);
}