import React from 'react';
import Phaser from 'phaser';
import GameUtils from './GameUtils.js';
import Projectile from './Projectile.js';
import Explosion from './Explosion.js';
import EnergyBeam from './EnergyBeam.js';

let Utils = new GameUtils();

class Game extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};

        // Game entities
        this.game = null;
    }

    componentDidMount() {
        var config = {
            type: Phaser.CANVAS, // CANVAS appears to be the least laggy options.
            width: 800,
            height: 600,
            parent: 'game-canvas',
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { y: 0, x: 0 },
                    debug: false
                }
            },
            scene: {
                preload: this.preloadAssets,
                create: this.initGame,
                update: this.updateGame
            },
            verbose: false
        };

        this.game = new Phaser.Game(config);
    }

    shouldComponentUpdate(newProps, newState) {
        return false;
    }

    preloadAssets() {
        this.loadComplete = false;

        let progressBar = this.add.graphics(),
            progressBox = this.add.graphics();

        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect((this.game.config.width - 320) / 2, (this.game.config.height - 50) / 2, 320, 50);

        this.load.image('ship', 'assets/ships/ship64.png');
        this.load.image('space', 'assets/galaxies/space.png');
        this.load.image('bullet', 'assets/projectiles/bullet.png');
        this.load.image('beam', 'assets/beams/1.png');
        this.load.spritesheet('explosion', 'assets/explosions/1.png', {
            frameWidth: 128, frameHeight: 128, endFrame: 16
        });

        this.load.audio('battle', 'assets/audio/battle.mp3');
        this.load.audio('explosion', 'assets/audio/explosion.mp3');

        this.load.on('progress', (progress) => {
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect((this.game.config.width - 300) / 2, (this.game.config.height - 30) / 2, 300 * progress, 30);
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            this.loadComplete = true;

            // Play background audio ... (Chrome will not start playing the sound until the user interacts with the canvas. Perhaps add a 'START' button after loading?)
            this.music = this.sound.add('battle');
            //this.music.play({ loop: true });
        });
    }

    initGame() {
        this.space = this.add.image(512, 384, 'space'); // Backgrounnd ...
        this.weapons = Utils.getWeaponTypes(); // All data about weapon types ...
        this.ships = Utils.getShipTypes(); // All data about ship types ...
        this.ship = this.physics.add.image(this.game.config.width / 2, this.game.config.height / 2, 'ship').setDepth(2); // The ship ...

        this.fps = this.add.text(0, 0, "fps", {fixedToCamera: true, font: "14px Arial", fill: '#ffffff'}); // Temporary UI text for active weapon ...

        if (this.game.config.verbose) {
            this.activeWeapon = this.add.text(0, 0, "active_weapon", {fixedToCamera: true, font: "18px Arial", fill: '#ffffff'}); // Temporary UI text for active weapon ...
            this.coordinates = this.add.text(0, 0, "coordinates", {fixedToCamera: true, font: "14px Arial", fill: '#ffffff'}); // Temporary UI text for active weapon ...
        }

        // Physics group for projectiles ...
        this.projectiles = this.physics.add.group({
            classType: Projectile,
            maxSize: 1000,
            runChildUpdate: true
        });

        this.explosions = this.physics.add.group({
            classType: Explosion,
            maxSize: 1000,
            runChildUpdate: true
        });

        this.beams = this.physics.add.group({
            classType: EnergyBeam,
            maxSize: 100,
            runChildUpdate: true
        });

        // Explosion animation that we will use when bombs detonate ...
        this.anims.create({
            key: 'explosion',
            frames: this.anims.generateFrameNumbers('explosion', {
                start: 1,
                end: 16
            }),
            repeat: 0,
            frameRate: 15
        });

        // Current ship settings
        const shipSettings = this.ships.get(Utils.ShipTypes.HALCYON);

        // Ship variables
        this.lastShot = 0;                               // Used to monitor weapon cooldown.
        this.lastWarp = 0;                               // Used to monitor warp cooldown.
        this.turretRotation = 0;                   // Which out of two guns (0 and 1) to shoot from.
        this.shipSpeed = shipSettings.speed;             // The default ship speed.

        this.shipWeaponType = shipSettings.weaponType;
        this.shipDrag = shipSettings.drag;               // A force that slows down the velocity of the object.
        this.shipAngularDrag = shipSettings.angularDrag; // A force that slows down the rotation of the object. Theory: Should probably be 0 to prevent rotational stop while still moving.
        this.shipMaxVelocity = shipSettings.maxVelocity; // The maximum velocity of the ship. Duh.
        this.shipMass = shipSettings.mass;               // The mass of the object. Affects velocity changes when bumping into other objects.

        this.ship.setDrag(this.shipDrag);
        this.ship.setAngularDrag(this.shipAngularDrag);
        this.ship.setMaxVelocity(this.shipMaxVelocity);
        this.ship.setMass(this.shipMass);

        //  Game input
        this.cursors = this.input.keyboard.createCursorKeys();

        this.fire = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.warp = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.switch = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);

        this.cameras.main.startFollow(this.ship, false, 0.1, 0.1);
    }

    updateGame(time, delta) {
        // If game has not finished loading, do not update anything ...
        if (!this.loadComplete) {
            return;
        }

        if (this.cursors.left.isDown) {
            this.ship.setAngularVelocity(-this.shipMaxVelocity / 2);
        } else if (this.cursors.right.isDown) {
            this.ship.setAngularVelocity(this.shipMaxVelocity / 2);
        } else {
            this.ship.setAngularVelocity(0);
        }

        if (this.cursors.up.isDown) {
            this.physics.velocityFromRotation(this.ship.rotation, this.shipSpeed, this.ship.body.acceleration);
        } else {
            this.ship.setAccelerationX(0);
            this.ship.setAccelerationY(0);
        }

        if (this.warp.isDown && time > this.lastWarp) {
            this.engageWarp(150);
            this.lastWarp = time + 1000;
        }

        // Switch weapon type ...
        if (!this.switchIsDown && this.switch.isDown) {
            this.accumulatedCharge = 0;
            this.switchIsDown = true;
            this.shipWeaponType++;

            if(this.shipWeaponType > this.weapons.size) {
                this.shipWeaponType = 1;
            }

            console.log('weapon swapped to: ' +
                (this.shipWeaponType === Utils.ProjectileTypes.BULLET ? 'BULLET' :
                    this.shipWeaponType === Utils.ProjectileTypes.CHARGE ? 'CHARGE' :
                        this.shipWeaponType === Utils.ProjectileTypes.LASER ? 'LASER' :
                            'SMARTBOMB'));

        } else if(this.switch.isUp) {
            this.switchIsDown = false;
        }

        /* smartbomb */
        if (this.shipWeaponType === Utils.ProjectileTypes.SMARTBOMB && this.fire.isDown && time > this.lastShot) {
            let bomb = this.projectiles.get(),
                projectileSettings = this.weapons.get(this.shipWeaponType);

            if (bomb) {
                console.log('DROP!');
                bomb.fire(this.ship, projectileSettings);

                this.lastShot = time + projectileSettings.cooldown;
            }
        }

        /* laser */
        if (this.shipWeaponType === Utils.ProjectileTypes.LASER && this.fire.isDown && time > this.lastShot) {
            let beam = this.beams.get(),
                projectileSettings = this.weapons.get(this.shipWeaponType);

            if (beam) {
                console.log('ZAP!');
                beam.fire(this.ship, projectileSettings);

                this.lastShot = time + projectileSettings.cooldown;
            }
        }

        /* bullet */
        if (this.shipWeaponType === Utils.ProjectileTypes.BULLET && this.fire.isDown && time > this.lastShot) {
            let bullet = this.projectiles.get(),
                projectileSettings = this.weapons.get(this.shipWeaponType);

            if (bullet) {
                console.log('PEW!');

                this.turretRotation = 1 - this.turretRotation;
                
                let modifiedProjectileSettings = Object.assign(projectileSettings, {turret: this.turretRotation });
                
                bullet.fire(this.ship, modifiedProjectileSettings);

                this.lastShot = time + projectileSettings.cooldown;
            }
        }

        /* charging */
        this.unleashCharge = (autoRelease) => {
            let charge = this.projectiles.get(),
                projectileSettings = this.weapons.get(this.shipWeaponType);

            if (charge) {
                console.log(autoRelease ? 'AUTOMATIC RELEASE OF CHARGE!' : 'MANUAL RELEASE OF CHARGE!');

                // Create a copy of the object before we modify it, so we don't change the default projectile settings ...
                let modifiedProjectileSettings = Object.assign(projectileSettings, {scale: 1 + (this.accumulatedCharge / 500)});

                charge.fire(this.ship, modifiedProjectileSettings);
            }

            this.accumulatedCharge = 0;
        };

        let chargeSettings = this.weapons.get(Utils.ProjectileTypes.CHARGE);

        if (this.shipWeaponType === Utils.ProjectileTypes.CHARGE && this.fire.isDown && time > this.lastShot) {
            if (this.accumulatedCharge < chargeSettings.maxCharge) {
                this.accumulatedCharge += delta;
            } else {
                this.lastShot = time + chargeSettings.cooldown;
                this.unleashCharge(1);
            }
        } else if(this.shipWeaponType === Utils.ProjectileTypes.CHARGE && this.fire.isUp) {
            if (this.accumulatedCharge > 0) {
                this.lastShot = time + chargeSettings.cooldown;
                this.unleashCharge(0);
            }
        }

        /* warping */
        this.engageWarp = (warpPower) => {
            const destination = Utils.getCoordinatesAfterAppliedForce(this.ship, warpPower);
            //const tweenDuration = Math.sqrt(Math.pow(warpPower, 2)) / this.shipSpeed * 1000;

            // The fading illusion that remains after warping ...
            let shipRemnant = this.physics.add.staticSprite(this.ship.x, this.ship.y, 'ship');
            shipRemnant.rotation = this.ship.rotation;

            // Tween for fading out ship remnant ...
            this.tweens.add({
                targets: shipRemnant,
                alpha: 0,
                duration: 1000,
                onComplete: () => {
                    shipRemnant.destroy();
                }
            });

            // IMPORTANT NOTE:
            // ship.x and ship.y is NOT the same as ship.body.x and ship.body.y.
            // 'body' seems to contain the origo position of the object, and not the centered position of the object.
            this.ship.x = destination.x;
            this.ship.y = destination.y;

            /*
            this.shipTween = this.tweens.add({
                targets: this.ship,
                x: warpPosition.x,
                y: warpPosition.y,
                duration: instant ? 1 : tweenDuration
            });
            */
        };

        if (this.game.config.verbose) {
            // Weapon text
            this.activeWeapon.x = this.cameras.main.midPoint.x - 350;
            this.activeWeapon.y = this.cameras.main.midPoint.y + 250;

            this.activeWeapon.setText('Weapon: ' +
                (this.shipWeaponType === Utils.ProjectileTypes.BULLET ? 'BULLET' :
                    this.shipWeaponType === Utils.ProjectileTypes.CHARGE ? 'CHARGE' :
                        this.shipWeaponType === Utils.ProjectileTypes.LASER ? 'LASER' :
                            'SMARTBOMB'));


            // Coordinates text
            this.coordinates.x = this.cameras.main.midPoint.x + 300;
            this.coordinates.y = this.cameras.main.midPoint.y + 250;

            this.coordinates.setText("X: " + Math.round(this.ship.x) + "\nY: " + Math.round(this.ship.y));
        }

        this.fps.x = this.cameras.main.midPoint.x + 320;
        this.fps.y = this.cameras.main.midPoint.y - 290;

        this.fps.setText('FPS: ' + Math.round(this.game.loop.actualFps));
    }

    render() {
        return (
            <div id="game-canvas"></div>
        );
    }
}

export default Game;