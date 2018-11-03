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
            reactParent: this
        };

        this.game = new Phaser.Game(config);
    }

    shouldComponentUpdate(newProps, newState) {
        return false;
    }

    preloadAssets() {
        var loc = window.location.pathname;
        var dir = loc.substring(0, loc.lastIndexOf('/'));

        console.log(new Date());
        console.log(this);
        console.log(dir);

        this.load.image('space', 'assets/galaxies/space.png');
        this.load.image('bullet', 'assets/projectiles/bullet.png');
        this.load.image('ship', 'assets/ships/ship64.png');
    }

    initGame() {
        //  A spacey background
        this.space = this.add.image(this.game.config.width / 2, this.game.config.height / 2, 'space');

        // Setup bullets
        let Bullet = new Phaser.Class({
            Extends: Phaser.GameObjects.Image,

            initialize: function Bullet(scene) {
                Phaser.GameObjects.Image.call(this, scene, 0, 0, 'bullet');

                this.setBlendMode(1);
                this.setDepth(1);

                this.lifespan = 1000;
                this.bulletSpeed = 400;

                this._temp = new Phaser.Math.Vector2();
            },

            fire: function(ship, scale) {
                this.lifespan = 1000;

                this.setPosition(ship.x, ship.y);
                this.body.reset(ship.x, ship.y);
                this.scaleX = scale;
                this.scaleY = scale;
                this.setAngle(ship.body.rotation);

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

        //  Our player ship
        this.ship = this.physics.add.image(this.game.config.width / 2, this.game.config.height / 2, 'ship').setDepth(2);

        this.ship.setDrag(300);
        this.ship.setAngularDrag(400);
        this.ship.setMaxVelocity(600);

        //  Game input
        this.cursors = this.input.keyboard.createCursorKeys();

        this.fire = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        this.shipSpeed = Phaser.Math.GetSpeed(300, 1);

        this.lastShot = 0;

        this.cameras.main.startFollow(this.ship);
    }

    updateGame(time, delta) {
        if (this.cursors.left.isDown) {
            this.ship.setAngularVelocity(-150);
        } else if (this.cursors.right.isDown) {
            this.ship.setAngularVelocity(150);
        } else {
            this.ship.setAngularVelocity(0);
        }

        if (this.cursors.up.isDown) {
            this.physics.velocityFromRotation(this.ship.rotation, 600, this.ship.body.acceleration);
        } else {
            this.ship.setAcceleration(0);
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

        this.space.tilePositionX += this.ship.body.deltaX() * 0.5;
        this.space.tilePositionY += this.ship.body.deltaY() * 0.5;

        /*
        if (this.game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)) {
            this.fireBullet();
        }

        this.screenWrap(this.ship);

        this.bullets.forEachExists(this.screenWrap, this);
        */
    }

    render() {
        return (
            <div id="game-canvas"></div>
        );
    }
}

export default Game;