class Bullet {
    constructor(bulletData) {
        this.x = bulletData.x;
        this.y = bulletData.y;
        this.vx = bulletData.vx;
        this.vy = bulletData.vy;
        this.damage = bulletData.damage;
        this.range = bulletData.range;
        this.maxDistance = 0;
        this.speed = bulletData.speed || Math.sqrt(bulletData.vx ** 2 + bulletData.vy ** 2);
        this.isActive = true;
        this.createdAt = Date.now();
        this.isPellet = bulletData.isPellet || false;
        this.lifetime = 5000;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.maxDistance += this.speed;
        if (Date.now() - this.createdAt > this.lifetime) { this.isActive = false; return; }
        if (this.maxDistance > this.range) { this.isActive = false; return; }
        if (this.x < 0 || this.x > CONFIG.MAP_WIDTH || this.y < 0 || this.y > CONFIG.MAP_HEIGHT) this.isActive = false;
    }
    getPosition() { return { x: this.x, y: this.y }; }
    checkCollisionWithPlayer(player) {
        if (!player.isAlive) return false;
        const dist = Math.hypot(this.x - (player.x + player.width / 2), this.y - (player.y + player.height / 2));
        return dist < player.width + 5;
    }
}
class Grenade {
    constructor(grenadeData) {
        this.id = grenadeData.id;
        this.x = grenadeData.x;
        this.y = grenadeData.y;
        this.vx = grenadeData.vx;
        this.vy = grenadeData.vy;
        this.ownerId = grenadeData.ownerId;
        this.ownerTeam = grenadeData.ownerTeam;
        this.damage = grenadeData.damage;
        this.radius = grenadeData.radius;
        this.lifetime = grenadeData.lifetime;
        this.createdAt = Date.now();
        this.hasExploded = false;
        this.isRolling = false;
    }
    update() {
        this.vy += CONFIG.GRENADE_GRAVITY;
        this.x += this.vx;
        this.y += this.vy;
        if (this.y + 10 >= CONFIG.MAP_HEIGHT - 100) {
            this.y = CONFIG.MAP_HEIGHT - 100 - 10;
            this.vy *= -0.6;
            this.vx *= 0.9;
            this.isRolling = true;
        }
        if (this.x < 0 || this.x > CONFIG.MAP_WIDTH) {
            this.vx *= -0.8;
            this.x = Math.max(0, Math.min(this.x, CONFIG.MAP_WIDTH));
        }
        const elapsed = Date.now() - this.createdAt;
        if (elapsed > this.lifetime) this.explode();
    }
    explode() {
        this.hasExploded = true;
        window.dispatchEvent(new CustomEvent('grenadeExploded', { detail: { grenadeId: this.id, x: this.x, y: this.y, radius: this.radius, damage: this.damage, ownerId: this.ownerId } }));
    }
    getPosition() { return { x: this.x, y: this.y }; }
    checkHardImpact() { return Math.abs(this.vy) > 8 && this.isRolling; }
}
class Lootbox {
    constructor(x, y, type) {
        this.id = 'lootbox_' + Math.random().toString(36).substr(2, 9);
        this.x = x;
        this.y = y;
        this.width = CONFIG.LOOTBOX_SIZE;
        this.height = CONFIG.LOOTBOX_SIZE;
        this.type = type;
        this.createdAt = Date.now();
        this.isActive = true;
        this.rotation = 0;
        this.respawnTime = CONFIG.LOOTBOX_RESPAWN_TIME;
        if (type === 'health') {
            this.color = '#FF0000';
            this.icon = '❤️';
        } else {
            this.color = '#FFD700';
            this.icon = '🔫';
        }
    }
    update() { this.rotation += 0.05; }
    checkCollisionWithPlayer(player) {
        return (this.x < player.x + player.width && this.x + this.width > player.x && this.y < player.y + player.height && this.y + this.height > player.y);
    }
    getState() { return { id: this.id, x: this.x, y: this.y, type: this.type, rotation: this.rotation }; }
}
window.Bullet = Bullet;
window.Grenade = Grenade;
window.Lootbox = Lootbox;