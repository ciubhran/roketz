import Phaser from 'phaser';
import GameUtils from './GameUtils';

let Utils = new GameUtils();

let RIGHT_TURRET = 1;
let LEFT_TURRET = 0;

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

        let projectileX = ship.x,
            projectileY = ship.y;

        if(projectileSettings.hasOwnProperty('turret')) {
            let turret = projectileSettings.turret;

            if(turret === RIGHT_TURRET) {
                projectileX += Math.cos(Phaser.Math.DegToRad(ship.body.rotation - 15)) * 25;
                projectileY += Math.sin(Phaser.Math.DegToRad(ship.body.rotation - 15)) * 25;
            } else {
                projectileX += Math.cos(Phaser.Math.DegToRad(ship.body.rotation + 15)) * 25;
                projectileY += Math.sin(Phaser.Math.DegToRad(ship.body.rotation + 15)) * 25;
            }
        }

        this.setPosition(projectileX, projectileY);
        //this.body.reset(projectileX, projectileY);
        this.scaleX = projectileSettings.scale;
        this.scaleY = projectileSettings.scale;
        this.setAngle(ship.rotation);

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
    },

    update: function(time, delta) {
        this.lifespan -= delta;

        if (this.lifespan <= 0) {
            this.setActive(false);
            this.setVisible(false);
            this.body.stop();

            if (this.type === Utils.ProjectileTypes.SMARTBOMB) {
                let explosion = this.scene.explosions.get();

                if (explosion) {
                    explosion.explodeOn({
                        x: this.x,
                        y: this.y
                    });
                }
            }

            this.destroy();
        }
    }
});