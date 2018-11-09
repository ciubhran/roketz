import Phaser from 'phaser';
import GameUtils from './GameUtils';

export default new Phaser.Class({
    Extends: Phaser.GameObjects.Sprite,

    initialize: function EnergyBeam(scene) {
        Phaser.GameObjects.Sprite.call(this, scene, 0, 0, 'beam');

        this.setBlendMode(1);
        this.setDepth(1);

        this.width = 1;
        this.height = 1;
    },

    fire: function(ship, projectileSettings) {
        this.lifespan = projectileSettings.lifespan;
        this.maxHeight = projectileSettings.maxHeight;
        this.maxWidth = projectileSettings.maxWidth;
        this.duration = projectileSettings.duration;

        let projectileX = ship.x,
            projectileY = ship.y;

        this.setPosition(projectileX, projectileY);
        this.setAngle(ship.rotation);
        this.setRotation(ship.rotation);

        this.setActive(true);
        this.setVisible(true);

        // ship.body.rotation = degrees
        // ship.rotation = radians

        // Applies a velocity to the body (projectile) based on ship rotation (1) and projectile speed (2) and assigns it to the velocity object of the projectile body (3) ...
        this.scene.physics.velocityFromRotation(
            Phaser.Math.DegToRad(ship.body.rotation),
            projectileSettings.speed,
            this.body.velocity
        );

        this.tween = this.scene.tweens.add({
            targets: this,
            scaleX: this.maxWidth,
            scaleY: this.maxHeight,
            duration: this.duration,
            onComplete: () => {
                this.tween.stop();
                // Probably not the right way to reset the components scale.
                this.scaleX = 1;
                this.scaleY = 1;
            }
        });

        //this.scene.sound.add('beam').play();
        //this.anims.play('beam');
    },

    update: function(time, delta) {
        if (this.lifespan <= 0) {
            this.setActive(false);
            this.setVisible(false);
            this.body.stop();

            this.destroy();
        }

        this.lifespan -= delta;
    }
});