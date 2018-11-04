import Phaser from 'phaser';
import GameUtils from './GameUtils';

let Utils = new GameUtils();

export default new Phaser.Class({
    Extends: Phaser.GameObjects.Image,

    initialize: function Projectile(scene) {
        Phaser.GameObjects.Image.call(this, scene, 0, 0, 'bullet');

        this.setBlendMode(1);
        this.setDepth(1);
    },

    fire: function(ship, projectileSettings) {
        this.lifespan = projectileSettings.lifespan;
        this.type = projectileSettings.type;

        this.setPosition(ship.x, ship.y);
        this.body.reset(ship.x, ship.y);
        this.scaleX = projectileSettings.scale;
        this.scaleY = projectileSettings.scale;
        this.setAngle(ship.rotation);

        this.setActive(true);
        this.setVisible(true);

        // Applies a velocity to the body (projectile) based on ship rotation (1) and projectile speed (2) and assigns it to the velocity object of the projectile body (3) ...
        this.scene.physics.velocityFromRotation(
            Phaser.Math.DegToRad(ship.body.rotation),
            projectileSettings.speed,
            this.body.velocity
        );
    },

    update: function(time, delta) {
        this.lifespan -= delta;

        if (this.lifespan <= 0) {
            this.setActive(false);
            this.setVisible(false);
            this.body.stop();

            if (this.type === Utils.ProjectileTypes.SMARTBOMB) {
                this.scene.sound.add('explosion').play();

                // TODO: Figure out why the sound that SHOULD already be preloaded, takes time to start ...
                setTimeout(() => {
                    let explosion = this.scene.add.sprite(this.body.x, this.body.y, 'explosion');
                    explosion.on('animationcomplete', (animation, frame) => {
                        explosion.destroy();
                    }, this);
                    explosion.anims.play('explosion');
                }, 25);
            }
        }
    }
});