import React from 'react';
import Phaser from 'phaser';
import GameUtils from './GameUtils.js';
import Projectile from './Projectile.js';

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
            type: Phaser.AUTO,
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
            audio: {
                disableWebAudio: true
            }
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
        progressBox.fillRect(240, 270, 320, 50);

        this.load.image('ship', 'assets/ships/ship64.png');
        this.load.image('space', 'assets/galaxies/space.png');
        this.load.image('bullet', 'assets/projectiles/bullet.png');
        this.load.spritesheet('explosion', 'assets/explosions/1.png', {
            frameWidth: 128, frameHeight: 128, endFrame: 16
        });

        this.load.audio('battle', 'assets/audio/battle.mp3');

        this.load.on('progress', (progress) => {
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(250, 280, 300 * progress, 30);
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            this.loadComplete = true;

            // Play background audio ... (Chrome will not start playing the sound until the user interacts with the canvas. Perhaps add a 'START' button after loading?)
            this.music = this.sound.add('battle');
            // this.music.play({ loop: true });
        });
    }

    initGame() {
        this.space = this.add.image(this.game.config.width / 2, this.game.config.height / 2, 'space'); // Backgrounnd ...
        this.weapons = Utils.getWeaponTypes(); // All data about weapon types ...
        this.ships = Utils.getShipTypes(); // All data about ship types ...
        this.text = this.add.text(this.game.config.width / 2, this.game.config.height / 2, "test", {fixedToCamera: true, font: "18px Arial", fill: '#ffffff'}); // Temporary UI text for active weapon ...
        this.ship = this.physics.add.image(this.game.config.width / 2, this.game.config.height / 2, 'ship').setDepth(2); // The ship ...

        // Physics group for projectiles ...
        this.projectiles = this.physics.add.group({
            classType: Projectile,
            maxSize: 1000,
            runChildUpdate: true
        });

        // Explosion animation that we will use when smartbombs detonate ...
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

        // Switch weapon type ...
        if (!this.switchIsDown && this.switch.isDown) {
            this.accumulatedCharge = 0;
            this.switchIsDown = true;
            this.shipWeaponType = (this.shipWeaponType === Utils.ProjectileTypes.BULLET) ?
                Utils.ProjectileTypes.CHARGE : (this.shipWeaponType === Utils.ProjectileTypes.CHARGE) ?
                Utils.ProjectileTypes.SMARTBOMB : Utils.ProjectileTypes.BULLET;

            console.log('weapon swapped to: ' + (this.shipWeaponType === Utils.ProjectileTypes.BULLET ? 'BULLET' :
                    this.shipWeaponType === Utils.ProjectileTypes.CHARGE ? 'CHARGE' : 'SMARTBOMB'));

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

        /* bullet */
        if (this.shipWeaponType === Utils.ProjectileTypes.BULLET && this.fire.isDown && time > this.lastShot) {
            let bullet = this.projectiles.get(),
                projectileSettings = this.weapons.get(this.shipWeaponType);

            if (bullet) {
                console.log('PEW!');
                bullet.fire(this.ship, projectileSettings);

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
        this.getNewCoordinates = (ship, warpPower) => {
            let x = ship.body.x + Math.cos(ship.rotation) * warpPower;
            let y = ship.body.y + Math.sin(ship.rotation) * warpPower;

            return {x, y};
        };

        this.engageWarp = (warpPower, instant = false) => {
            if (this.shipTween) {
                this.shipTween.stop();
                this.shipTween = null;
            }

            const warpPosition = this.getNewCoordinates(this.ship, warpPower);
            const tweenDuration = Math.sqrt(Math.pow(warpPower, 2)) / this.shipSpeed * 1000;

            let shipRemnant = this.physics.add.staticSprite(this.ship.body.x, this.ship.body.y, 'ship');
            shipRemnant.rotation = this.ship.rotation;

            //this.ship.setVelocity(this.shipMaxVelocity);

            this.tweens.add({
                targets: shipRemnant,
                alpha: 0,
                duration: 1000,
                onComplete: () => {
                    shipRemnant.destroy();
                }
            });

            this.shipTween = this.tweens.add({
                targets: this.ship,
                x: warpPosition.x,
                y: warpPosition.y,
                duration: instant ? 1 : tweenDuration
            });
        };

        if (this.warp.isDown && time > this.lastWarp) {
            this.engageWarp(150, true);
            this.lastWarp = time + 1000;
        }

        // Weapon text
        this.text.x = this.cameras.main.midPoint.x - 350;
        this.text.y = this.cameras.main.midPoint.y + 250;

        this.text.setText('Weapon: ' + (this.shipWeaponType === Utils.ProjectileTypes.BULLET ? 'BULLET' :
                this.shipWeaponType === Utils.ProjectileTypes.CHARGE ? 'CHARGE' : 'SMARTBOMB'));

        //this.space.tilePositionX += this.ship.body.deltaX() * 0.5;
        //this.space.tilePositionY += this.ship.body.deltaY() * 0.5;
    }

    render() {
        return (
            <div id="game-canvas"></div>
        );
    }
}

export default Game;