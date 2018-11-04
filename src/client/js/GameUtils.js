export default class GameUtils {
    constructor() {
        this.ProjectileTypes = {
            BULLET: 0x1,
            CHARGE: 0x2,
            SMARTBOMB: 0x3
        };

        this.ShipTypes = {
            FREIGHTER: 0x1,
            HALCYON: 0x2
        };
    }

    getCoordinatesAfterAppliedForce(entity, force) {
        return {
            x: entity.x + (Math.cos(entity.rotation) * force),
            y: entity.y + (Math.sin(entity.rotation) * force)
        };
    };

    getShipTypes() {
        let shipMap = new Map();

        // Slow ship
        shipMap.set(this.ShipTypes.FREIGHTER, {
            drag: 50,
            angularDrag: 0,
            maxVelocity: 100,
            speed: 50,
            mass: 500,
            weaponType: this.ProjectileTypes.CHARGE
        });

        // Fast ship
        shipMap.set(this.ShipTypes.HALCYON, {
            drag: 200,
            angularDrag: 0,
            maxVelocity: 300,
            speed: 400,
            mass: 50,
            weaponType: this.ProjectileTypes.BULLET
        });

        return shipMap;
    }

    getWeaponTypes() {
        let weaponMap = new Map();

        weaponMap.set(this.ProjectileTypes.BULLET, {
            type: this.ProjectileTypes.BULLET,
            alpha: 1,
            lifespan: 1000,
            speed: 900,
            scale: 0.4,
            cooldown: 100,
            maxCharge: 0
        });

        weaponMap.set(this.ProjectileTypes.CHARGE, {
            type: this.ProjectileTypes.CHARGE,
            alpha: 1,
            lifespan: 600,
            speed: 750,
            scale: 1,
            cooldown: 400,
            maxCharge: 1500
        });

        weaponMap.set(this.ProjectileTypes.SMARTBOMB, {
            type: this.ProjectileTypes.SMARTBOMB,
            alpha: 1,
            lifespan: 750,
            speed: 0,
            scale: 0.75,
            cooldown: 250,
            maxCharge: 0
        });

        return weaponMap;
    }
};