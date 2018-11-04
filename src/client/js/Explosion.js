import Phaser from 'phaser';
import GameUtils from './GameUtils';

export default new Phaser.Class({
    Extends: Phaser.GameObjects.Sprite,

    initialize: function Explosion(scene) {
        Phaser.GameObjects.Sprite.call(this, scene, 0, 0, 'explosion');

        this.setBlendMode(1);
        this.setDepth(1);
    },

    explodeOn: function(projectile) {
        this.setPosition(projectile.x, projectile.y);

        this.setActive(true);
        this.setVisible(true);

        this.scene.sound.add('explosion').play();

        this.on('animationcomplete', (animation, frame) => {
            this.destroy();
        }, this);

        this.anims.play('explosion');
    }
});