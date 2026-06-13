class Player {
    constructor(playerData) {
        this.id = playerData.id || 'player_' + Math.random().toString(36).substr(2, 9);
        this.name = playerData.name;
        this.character = new Character(playerData.character, playerData.name, playerData.team);
        this.team = playerData.team;
        this.x = playerData.x || 100;
        this.y = playerData.y || 100;
        this.vx = 0;
        this.vy = 0;
        this.width = CONFIG.PLAYER_SIZE;
        this.height = CONFIG.PLAYER_SIZE;
        this.health = this.character.maxHealth;
        this.isAlive = true;
        this.isJumping = false;
        this.isGrounded = false;
        this.angle = 0;
        this.isAiming = false;
        this.weapon = new Weapon(this.character);
        this.abilityReady = true;
        this.abilityLastUsed = 0;
        this.grenadeCount = CONFIG.GRENADE_MAX;
        this.doubleNextShot = false;
        this.kills = 0;
        this.deaths = 0;
        this.score = 0;
        this.input = { up: false, down: false, left: false, right: false, jump: false, shoot: false, aim: false };
        this.shootFlash = 0;
        this.damageFlash = 0;
        this.lastUpdateTime = Date.now();
    }
    update() {
        const now = Date.now();
        const deltaTime = (now - this.lastUpdateTime) / 1000;
        this.lastUpdateTime = now;
        if (!this.isAlive) return;
        this.handleInput();
        let accelX = 0;
        if (this.input.left) accelX -= this.character.speed;
        if (this.input.right) accelX += this.character.speed;
        this.vx += accelX * CONFIG.PLAYER_ACCELERATION;
        this.vx *= CONFIG.PLAYER_FRICTION;
        const maxSpeed = this.character.speed * 2;
        if (Math.abs(this.vx) > maxSpeed) this.vx = Math.sign(this.vx) * maxSpeed;
        this.vy += CONFIG.PLAYER_GRAVITY;
        this.x += this.vx;
        this.y += this.vy;
        if (this.y + this.height >= CONFIG.MAP_HEIGHT - 100) {
            this.y = CONFIG.MAP_HEIGHT - 100 - this.height;
            this.vy = 0;
            this.isGrounded = true;
            this.isJumping = false;
        } else {
            this.isGrounded = false;
        }
        this.x = Math.max(0, Math.min(this.x, CONFIG.MAP_WIDTH - this.width));
        this.weapon.updateSpread();
        if (this.shootFlash > 0) this.shootFlash--;
        if (this.damageFlash > 0) this.damageFlash--;
        if (!this.abilityReady) {
            const timeSinceUsed = now - this.abilityLastUsed;
            if (timeSinceUsed >= this.character.ability.cooldown) this.abilityReady = true;
        }
    }
    handleInput() {
        if (this.input.shoot && !this.weapon.isReloading) {
            if (this.weapon.tryShoot()) {
                this.shootFlash = 10;
                this.onShoot();
            }
        }
        if (this.input.jump && this.isGrounded) {
            this.vy = -this.character.jumpPower;
            this.isJumping = true;
            this.isGrounded = false;
            this.input.jump = false;
        }
    }
    onShoot() {
        const bullets = [];
        if (this.character.type === 'shotgunner') {
            bullets.push(...this.weapon.getShotgunPellets(this.x, this.y, this.angle));
        } else {
            bullets.push(this.weapon.getBulletTrajectory(this.x, this.y, this.angle));
        }
        if (this.doubleNextShot) {
            bullets.forEach(b => b.damage *= 2);
            this.doubleNextShot = false;
        }
        window.dispatchEvent(new CustomEvent('playerShoot', { detail: { playerId: this.id, bullets: bullets, playerPos: { x: this.x, y: this.y } } }));
    }
    takeDamage(damage) {
        if (!this.isAlive) return;
        this.health -= damage;
        this.damageFlash = 20;
        if (this.health <= 0) {
            this.health = 0;
            this.die();
        }
        window.dispatchEvent(new CustomEvent('playerDamaged', { detail: { playerId: this.id, health: this.health } }));
    }
    die() {
        this.isAlive = false;
        this.deaths++;
        this.score -= 10;
        window.dispatchEvent(new CustomEvent('playerDied', { detail: { playerId: this.id, killedBy: null } }));
        setTimeout(() => this.respawn(), CONFIG.PLAYER_RESPAWN_TIME);
    }
    respawn() {
        this.health = this.character.maxHealth;
        this.isAlive = true;
        this.weapon.ammunition = this.weapon.weaponStats.magazineSize;
        this.grenadeCount = CONFIG.GRENADE_MAX;
        const spawnLocations = CONFIG.SPAWN_LOCATIONS[window.gameMode];
        const randomSpawn = spawnLocations[Math.floor(Math.random() * spawnLocations.length)];
        this.x = randomSpawn.x + (Math.random() - 0.5) * 100;
        this.y = randomSpawn.y + (Math.random() - 0.5) * 100;
        window.dispatchEvent(new CustomEvent('playerRespawned', { detail: { playerId: this.id } }));
    }
    throwGrenade(targetX, targetY) {
        if (this.grenadeCount <= 0 || this.health <= 0) return;
        this.grenadeCount--;
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const grenade = { id: 'grenade_' + Math.random().toString(36).substr(2, 9), x: this.x, y: this.y, vx: (dx / distance) * CONFIG.GRENADE_SPEED, vy: (dy / distance) * CONFIG.GRENADE_SPEED + CONFIG.GRENADE_GRAVITY, ownerId: this.id, ownerTeam: this.team, damage: CONFIG.GRENADE_DAMAGE, radius: CONFIG.GRENADE_RADIUS, lifetime: 3000 };
        window.dispatchEvent(new CustomEvent('grenadeThrown', { detail: { grenade: grenade } }));
        return grenade;
    }
    useAbility() {
        if (!this.abilityReady) return false;
        const ability = this.character.ability;
        this.abilityReady = false;
        this.abilityLastUsed = Date.now();
        switch (ability.effect) {
            case 'double_damage_next_shot': this.doubleNextShot = true; break;
            case 'increased_fire_rate': this.weapon.weaponStats.fireRate *= 0.5; setTimeout(() => { this.weapon.weaponStats.fireRate *= 2; }, 5000); break;
            case 'instant_reload': this.weapon.ammunition = this.weapon.weaponStats.magazineSize; break;
        }
        window.dispatchEvent(new CustomEvent('abilityUsed', { detail: { playerId: this.id, ability: ability.name } }));
        return true;
    }
    getAbilityCooldownPercent() {
        if (this.abilityReady) return 100;
        const now = Date.now();
        const timeSinceUsed = now - this.abilityLastUsed;
        const percentage = (timeSinceUsed / this.character.ability.cooldown) * 100;
        return Math.min(percentage, 100);
    }
    pickupLootbox(type) {
        if (type === 'health') this.weapon.addHealth(this, CONFIG.LOOTBOX_HEALTH);
        else if (type === 'ammo') this.weapon.addAmmo(CONFIG.LOOTBOX_AMMO);
        window.dispatchEvent(new CustomEvent('lootboxPickedUp', { detail: { playerId: this.id, type: type } }));
    }
    getState() {
        return { id: this.id, name: this.name, x: Math.round(this.x), y: Math.round(this.y), vx: this.vx, vy: this.vy, angle: this.angle, health: this.health, isAlive: this.isAlive, ammunition: this.weapon.ammunition, isAiming: this.isAiming, shootFlash: this.shootFlash };
    }
    toJSON() {
        return { id: this.id, name: this.name, character: this.character.type, team: this.team, health: this.health, kills: this.kills, deaths: this.deaths, score: this.score };
    }
}
window.Player = Player;