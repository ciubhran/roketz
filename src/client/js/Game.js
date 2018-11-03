import React from 'react';
import Phaser from 'phaser';

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
        this.load.image('space', 'assets/galaxies/space.png');
        this.load.image('bullet', 'assets/projectiles/bullet.png');
        this.load.image('ship', 'assets/ships/ship64.png');
        this.load.audio('battle', 'assets/audio/battle.mp3');
    }

    initGame() {
        //  A spacey background
        this.space = this.add.image(this.game.config.width / 2, this.game.config.height / 2, 'space');

        this.cameraPos = {x: 0, y: 0};

        this.music = this.sound.add('battle');
        //this.music.play({ loop: true });

        // Setup bullets
        let Bullet = new Phaser.Class({
            Extends: Phaser.GameObjects.Image,

            initialize: function Bullet(scene) {
                Phaser.GameObjects.Image.call(this, scene, 0, 0, 'bullet');

                this.setBlendMode(1);
                this.setDepth(1);

                this._temp = new Phaser.Math.Vector2();
            },

            fire: function(ship, scale) {
                this.lifespan = 1000;
                this.bulletSpeed = 400;

                this.setPosition(ship.x, ship.y);
                this.body.reset(ship.x, ship.y);
                this.scaleX = scale;
                this.scaleY = scale;
                this.setAngle(ship.rotation);

                this.setActive(true);
                this.setVisible(true);

                let angle = Phaser.Math.DegToRad(ship.body.rotation);

                this.scene.physics.velocityFromRotation(angle, this.bulletSpeed, this.body.velocity);

                this.body.velocity.x *= 2;
                this.body.velocity.y *= 2;
            },

            update: function(time, delta) {
                this.lifespan -= delta;

                if (this.lifespan <= 0) {
                    this.setActive(false);
                    this.setVisible(false);
                    this.body.stop();
                }
            }
        });

        this.bullets = this.physics.add.group({
            classType: Bullet,
            maxSize: 1000,
            runChildUpdate: true
        });

        this.ship = this.physics.add.image(this.game.config.width / 2, this.game.config.height / 2, 'ship').setDepth(2);

        const ships = new Map();

        // Slow ship
        ships.set('FREIGHTER', {
            drag: 50,
            angularDrag: 30,
            maxVelocity: 100,
            speed: 50,
            mass: 500
        });

        // Fast ship
        ships.set('HALCYON', {
            drag: 200,
            angularDrag: 10,
            maxVelocity: 300,
            speed: 400,
            mass: 50
        });

        // Current ship settings
        const shipSettings = ships.get('HALCYON');

        // Ship variables
        this.lastShot = 0;                               // Used to monitor weapon cooldown.
        this.lastWarp = 0;                               // Used to monitor warp cooldown.
        this.shipSpeed = shipSettings.speed;             // The default ship speed.

        this.shipDrag = shipSettings.drag;               // A force that slows down the velocity of the object.
        this.shipAngularDrag = shipSettings.angularDrag; // A force that slows down the rotation of the object.
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

        this.cameras.main.startFollow(this.ship, false, 0.1, 0.1);
    }

    updateGame(time, delta) {
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

        let BULLET = 0x1;
        let CHARGE = 0x2;

        this.weaponType = BULLET;

        /* bullet */
        if (this.weaponType === BULLET && this.fire.isDown && time > this.lastShot) {
            var bullet = this.bullets.get();

            if (bullet) {
                console.log('PEW!');
                bullet.fire(this.ship, 1);

                this.lastShot = time + 50;
            }
        }

        /* charging */
        this.unleashCharge = (autoRelease) => {
            var charge = this.bullets.get();

            if (charge) {
                console.log(autoRelease ? 'AUTOMATIC RELEASE OF CHARGE!' : 'MANUAL RELEASE OF CHARGE!');
                charge.fire(this.ship, 1 + (this.accumulatedCharge / 500));
            }

            this.accumulatedCharge = 0;
        };

        if (this.weaponType === CHARGE && this.fire.isDown) {
            if (this.accumulatedCharge < 1000) {
                this.accumulatedCharge += delta;
            } else {
                this.unleashCharge(1);
            }
        } else if(this.weaponType === CHARGE && this.fire.isUp) {
            if (this.accumulatedCharge > 0) {
                this.unleashCharge(0);
            } else {
                this.accumulatedCharge = 0;
            }
        }

        /* warping */
        this.getNewCoordinates = (ship, warpPower) => {
            let x = Math.cos(ship.rotation) * warpPower;
            let y = Math.sin(ship.rotation) * warpPower;

            return {x, y};
        };

        //  this.cameras.main.pan(x, y, fullDuration / maxRuns, 'Linear', true, (camera, progress, x, y) => {});

        this.engageWarp = (warpPower, instant = false) => {
            if (this.shipTween) {
                this.shipTween.stop();
                this.shipTween = null;
            }

            const coords = this.getNewCoordinates(this.ship, warpPower);
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
                x: this.ship.body.x + coords.x,
                y: this.ship.body.y + coords.y,
                duration: instant ? 1 : tweenDuration
            });
        };

        if (this.warp.isDown && time > this.lastWarp) {
            this.engageWarp(150, true);
            this.lastWarp = time + 1000;
        }

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