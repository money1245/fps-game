class Weapon {
    constructor(character) {
        this.character = character;
        this.weaponStats = character.config;
        this.ammunition = this.weaponStats.magazineSize;
        this.ammoReserve = this.weaponStats.magazineSize * 6;
        this.isReloading = false;
        this.lastShotTime = 0;
        this.canShoot = true;
        this.currentSpread = 0;
        this.maxSpread = this.weaponStats.spread;
    }
    tryShoot() {
        const now = Date.now();
        if (!this.canShoot || this.isReloading || this.ammunition <= 0) return false;
        if (now - this.lastShotTime >= this.weaponStats.fireRate) {
            this.ammunition--;
            this.lastShotTime = now;
            this.currentSpread = Math.min(this.currentSpread + 2, this.maxSpread);
            window.dispatchEvent(new CustomEvent('weaponFired', { detail: { character: this.character.type, ammoLeft: this.ammunition } }));
            return true;
        }
        return false;
    }
    reload() {
        if (this.isReloading || this.ammunition === this.weaponStats.magazineSize) return false;
        this.isReloading = true;
        setTimeout(() => {
            const ammoNeeded = this.weaponStats.magazineSize - this.ammunition;
            const ammoToReload = Math.min(ammoNeeded, this.ammoReserve);
            this.ammunition += ammoToReload;
            this.ammoReserve -= ammoToReload;
            this.isReloading = false;
            window.dispatchEvent(new CustomEvent('weaponReloaded', { detail: { ammunition: this.ammunition, ammoReserve: this.ammoReserve } }));
        }, this.weaponStats.reloadTime);
        return true;
    }
    getBulletTrajectory(x, y, angle) {
        const spread = (Math.random() - 0.5) * this.currentSpread * (Math.PI / 180);
        const finalAngle = angle + spread;
        return { x: x, y: y, vx: Math.cos(finalAngle) * this.weaponStats.bulletSpeed, vy: Math.sin(finalAngle) * this.weaponStats.bulletSpeed, damage: this.weaponStats.damage, range: this.weaponStats.range, speed: this.weaponStats.bulletSpeed, maxDistance: 0 };
    }
    getShotgunPellets(x, y, angle) {
        const pellets = [];
        const pelletCount = this.weaponStats.pellets || 8;
        for (let i = 0; i < pelletCount; i++) {
            const spreadAngle = (Math.random() - 0.5) * (this.weaponStats.spread * 2) * (Math.PI / 180);
            const finalAngle = angle + spreadAngle;
            pellets.push({ x: x + Math.cos(angle) * 15, y: y + Math.sin(angle) * 15, vx: Math.cos(finalAngle) * this.weaponStats.bulletSpeed, vy: Math.sin(finalAngle) * this.weaponStats.bulletSpeed, damage: this.weaponStats.damage / pelletCount, range: this.weaponStats.range, speed: this.weaponStats.bulletSpeed, maxDistance: 0, isPellet: true });
        }
        return pellets;
    }
    updateSpread() {
        if (this.currentSpread > 0) this.currentSpread = Math.max(0, this.currentSpread - 0.5);
    }
    getHUDInfo() {
        return { name: this.weaponStats.name, ammo: this.ammunition, ammoReserve: this.ammoReserve, isReloading: this.isReloading, totalAmmo: this.ammunition + this.ammoReserve };
    }
    addAmmo(amount) {
        const maxAmmo = this.weaponStats.magazineSize * 9;
        this.ammoReserve = Math.min(this.ammoReserve + amount, maxAmmo);
    }
    addHealth(player, amount) {
        player.health = Math.min(player.health + amount, player.character.maxHealth);
    }
    toJSON() {
        return { ammunition: this.ammunition, ammoReserve: this.ammoReserve, isReloading: this.isReloading };
    }
}
window.Weapon = Weapon;