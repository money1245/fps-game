class GameEngine {
    constructor(gameConfig) {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.minimap = document.getElementById('minimap');
        this.minimapCtx = this.minimap.getContext('2d');
        this.isRunning = false;
        this.isPaused = false;
        this.localPlayer = null;
        this.players = [];
        this.bullets = [];
        this.grenades = [];
        this.lootboxes = [];
        this.effects = new EffectsManager();
        this.gameConfig = gameConfig;
        this.gameMode = gameConfig.gameMode;
        this.gameStartTime = Date.now();
        this.cameraX = 0;
        this.cameraY = 0;
        this.spatialHash = {};
        this.cellSize = 100;
        this.networkUpdateTimer = 0;
        this.frameCount = 0;
        this.lastFrameTime = Date.now();
        this.setupCanvas();
        this.initializeGame();
        this.setupEventListeners();
    }
    setupCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        });
    }
    initializeGame() {
        const playerData = {
            id: 'player_' + Math.random().toString(36).substr(2, 9),
            name: this.gameConfig.playerName,
            character: this.gameConfig.character,
            team: 1,
            x: CONFIG.SPAWN_LOCATIONS[this.gameMode][0].x,
            y: CONFIG.SPAWN_LOCATIONS[this.gameMode][0].y,
        };
        this.localPlayer = new Player(playerData);
        networkManager.initializeLocalPlayer(playerData);
        const playerCount = CONFIG.GAME_MODES[this.gameMode].maxPlayers - 1;
        const spawnLocations = CONFIG.SPAWN_LOCATIONS[this.gameMode];
        for (let i = 1; i < playerCount; i++) {
            const spawn = spawnLocations[i];
            const otherPlayer = {
                id: 'player_' + Math.random().toString(36).substr(2, 9),
                name: 'Player ' + (i + 1),
                character: ['sniper', 'machinegunner', 'shotgunner', 'rifleman'][Math.floor(Math.random() * 4)],
                team: i % 2 === 0 ? 1 : 2,
                x: spawn.x + (Math.random() - 0.5) * 50,
                y: spawn.y + (Math.random() - 0.5) * 50,
            };
            const newPlayer = new Player(otherPlayer);
            this.players.push(newPlayer);
            networkManager.addRemotePlayer(otherPlayer);
        }
        this.spawnLootboxes(5);
    }
    setupEventListeners() {
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        document.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        window.addEventListener('playerShoot', (e) => this.onPlayerShoot(e.detail));
        window.addEventListener('grenadeThrown', (e) => this.onGrenadeThrown(e.detail));
        window.addEventListener('grenadeExploded', (e) => this.onGrenadeExploded(e.detail));
        window.addEventListener('abilityUsed', (e) => this.onAbilityUsed(e.detail));
    }
    handleMouseMove(e) {
        if (!this.localPlayer) return;
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const playerScreenX = this.localPlayer.x - this.cameraX;
        const playerScreenY = this.localPlayer.y - this.cameraY;
        this.localPlayer.angle = Math.atan2(mouseY - playerScreenY, mouseX - playerScreenX);
    }
    handleMouseDown(e) {
        if (e.button === 0) this.localPlayer.input.shoot = true;
        else if (e.button === 2) this.localPlayer.isAiming = true;
    }
    handleMouseUp(e) {
        if (e.button === 0) this.localPlayer.input.shoot = false;
        else if (e.button === 2) this.localPlayer.isAiming = false;
    }
    handleKeyDown(e) {
        const key = e.key.toLowerCase();
        switch (key) {
            case 'w': this.localPlayer.input.up = true; break;
            case 'a': this.localPlayer.input.left = true; break;
            case 's': this.localPlayer.input.down = true; break;
            case 'd': this.localPlayer.input.right = true; break;
            case ' ': this.localPlayer.input.jump = true; e.preventDefault(); break;
            case 'r': this.localPlayer.weapon.reload(); e.preventDefault(); break;
            case 'q': this.throwGrenade(); e.preventDefault(); break;
            case 'e': this.localPlayer.useAbility(); e.preventDefault(); break;
            case 'f': this.tryPickupLootbox(); e.preventDefault(); break;
            case 'escape': this.togglePause(); e.preventDefault(); break;
            case 'tab': this.togglePlayersList(); e.preventDefault(); break;
        }
    }
    handleKeyUp(e) {
        const key = e.key.toLowerCase();
        switch (key) {
            case 'w': this.localPlayer.input.up = false; break;
            case 'a': this.localPlayer.input.left = false; break;
            case 's': this.localPlayer.input.down = false; break;
            case 'd': this.localPlayer.input.right = false; break;
        }
    }
    update() {
        if (this.isPaused) return;
        this.localPlayer.update();
        this.players.forEach(player => { player.update(); });
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            this.bullets[i].update();
            this.checkBulletCollisions(this.bullets[i]);
            if (!this.bullets[i].isActive) this.bullets.splice(i, 1);
        }
        for (let i = this.grenades.length - 1; i >= 0; i--) {
            this.grenades[i].update();
            if (this.grenades[i].hasExploded) this.grenades.splice(i, 1);
        }
        this.lootboxes.forEach(loot => loot.update());
        this.checkLootboxCollisions();
        this.effects.update();
        this.updateCamera();
        this.networkUpdateTimer += 1000 / 60;
        if (this.networkUpdateTimer >= CONFIG.NETWORK_TICK) {
            this.broadcastPlayerState();
            this.networkUpdateTimer = 0;
        }
        this.frameCount++;
    }
    render() {
        this.ctx.fillStyle = 'linear-gradient(180deg, #87ceeb 0%, #e0f6ff 100%)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        this.ctx.translate(-this.cameraX, -this.cameraY);
        this.drawMapBackground();
        this.lootboxes.forEach(loot => this.drawLootbox(loot));
        this.grenades.forEach(grenade => this.drawGrenade(grenade));
        this.bullets.forEach(bullet => this.drawBullet(bullet));
        this.drawPlayer(this.localPlayer);
        this.players.forEach(player => this.drawPlayer(player));
        this.effects.render(this.ctx);
        this.ctx.restore();
        this.drawHUD();
        this.drawMinimap();
    }
    drawMapBackground() {
        const gridSize = 200;
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.lineWidth = 1;
        for (let x = 0; x < CONFIG.MAP_WIDTH; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, CONFIG.MAP_HEIGHT);
            this.ctx.stroke();
        }
        for (let y = 0; y < CONFIG.MAP_HEIGHT; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(CONFIG.MAP_WIDTH, y);
            this.ctx.stroke();
        }
    }
    drawPlayer(player) {
        if (!player.isAlive) return;
        const x = player.x + player.width / 2;
        const y = player.y + player.height / 2;
        this.ctx.fillStyle = player.team === 1 ? '#FF6B6B' : '#4ECDC4';
        if (player.damageFlash > 0) this.ctx.globalAlpha = 0.5;
        this.ctx.fillRect(player.x, player.y, player.width, player.height);
        this.ctx.globalAlpha = 1;
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText(new Character(player.character.type, '').getIcon(), x, y + 5);
        const gunLength = 20;
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x + Math.cos(player.angle) * gunLength, y + Math.sin(player.angle) * gunLength);
        this.ctx.stroke();
        if (player.shootFlash > 0) {
            this.ctx.fillStyle = 'rgba(255, 200, 0, 0.8)';
            this.ctx.beginPath();
            this.ctx.arc(x, y, player.shootFlash * 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.drawHealthBar(x, y, player);
        this.ctx.font = 'bold 10px Arial';
        this.ctx.fillStyle = '#fff';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(player.name, x, y - 25);
    }
    drawHealthBar(x, y, player) {
        const barWidth = 30;
        const barHeight = 3;
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(x - barWidth / 2, y - 15, barWidth, barHeight);
        const healthPercent = player.health / player.character.maxHealth;
        this.ctx.fillStyle = healthPercent > 0.5 ? '#00FF00' : '#FF0000';
        this.ctx.fillRect(x - barWidth / 2, y - 15, barWidth * healthPercent, barHeight);
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x - barWidth / 2, y - 15, barWidth, barHeight);
    }
    drawBullet(bullet) {
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(bullet.x, bullet.y);
        this.ctx.lineTo(bullet.x - bullet.vx * 5, bullet.y - bullet.vy * 5);
        this.ctx.stroke();
    }
    drawGrenade(grenade) {
        const icon = '💣';
        this.ctx.save();
        this.ctx.translate(grenade.x, grenade.y);
        this.ctx.rotate(grenade.rotation || 0);
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(icon, 0, 0);
        this.ctx.restore();
    }
    drawLootbox(lootbox) {
        this.ctx.save();
        this.ctx.translate(lootbox.x + lootbox.width / 2, lootbox.y + lootbox.height / 2);
        this.ctx.rotate(lootbox.rotation);
        this.ctx.fillStyle = lootbox.color;
        this.ctx.fillRect(-lootbox.width / 2, -lootbox.height / 2, lootbox.width, lootbox.height);
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText(lootbox.icon, 0, 0);
        this.ctx.restore();
    }
    drawHUD() {
        if (!this.localPlayer) return;
    }
    drawMinimap() {
        const minimapScale = Math.min(this.minimap.width / CONFIG.MAP_WIDTH, this.minimap.height / CONFIG.MAP_HEIGHT);
        this.minimapCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.minimapCtx.fillRect(0, 0, this.minimap.width, this.minimap.height);
        this.minimapCtx.fillStyle = '#FF0000';
        this.minimapCtx.beginPath();
        this.minimapCtx.arc(this.localPlayer.x * minimapScale, this.localPlayer.y * minimapScale, 5, 0, Math.PI * 2);
        this.minimapCtx.fill();
        this.players.forEach(player => {
            this.minimapCtx.fillStyle = player.team === 1 ? '#FF6B6B' : '#4ECDC4';
            this.minimapCtx.beginPath();
            this.minimapCtx.arc(player.x * minimapScale, player.y * minimapScale, 4, 0, Math.PI * 2);
            this.minimapCtx.fill();
        });
        this.lootboxes.forEach(loot => {
            this.minimapCtx.fillStyle = loot.color;
            this.minimapCtx.fillRect(loot.x * minimapScale - 2, loot.y * minimapScale - 2, 4, 4);
        });
    }
    updateCamera() {
        const targetX = this.localPlayer.x - this.canvas.width / 2;
        const targetY = this.localPlayer.y - this.canvas.height / 2;
        this.cameraX += (targetX - this.cameraX) * CONFIG.CAMERA_LERP;
        this.cameraY += (targetY - this.cameraY) * CONFIG.CAMERA_LERP;
        this.cameraX = Math.max(0, Math.min(this.cameraX, CONFIG.MAP_WIDTH - this.canvas.width));
        this.cameraY = Math.max(0, Math.min(this.cameraY, CONFIG.MAP_HEIGHT - this.canvas.height));
    }
    checkBulletCollisions(bullet) {
        const allPlayers = [this.localPlayer, ...this.players];
        allPlayers.forEach(player => {
            if (bullet.checkCollisionWithPlayer(player)) {
                if (player.isAlive) {
                    player.takeDamage(bullet.damage);
                    bullet.isActive = false;
                    this.effects.addBloodEffect(player.x + player.width / 2, player.y + player.height / 2);
                    this.effects.addDamageNumberEffect(player.x + player.width / 2, player.y - 20, Math.round(bullet.damage));
                }
            }
        });
    }
    checkLootboxCollisions() {
        const allPlayers = [this.localPlayer, ...this.players];
        allPlayers.forEach(player => {
            for (let i = this.lootboxes.length - 1; i >= 0; i--) {
                if (this.lootboxes[i].checkCollisionWithPlayer(player)) {
                    player.pickupLootbox(this.lootboxes[i].type);
                    this.lootboxes.splice(i, 1);
                }
            }
        });
    }
    throwGrenade() {
        if (!this.localPlayer) return;
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = event?.clientX - rect.left || this.canvas.width / 2;
        const mouseY = event?.clientY - rect.top || this.canvas.height / 2;
        const targetX = mouseX + this.cameraX;
        const targetY = mouseY + this.cameraY;
        const grenade = this.localPlayer.throwGrenade(targetX, targetY);
        if (grenade) this.grenades.push(new Grenade(grenade));
    }
    tryPickupLootbox() {
        for (let i = this.lootboxes.length - 1; i >= 0; i--) {
            if (this.lootboxes[i].checkCollisionWithPlayer(this.localPlayer)) {
                this.localPlayer.pickupLootbox(this.lootboxes[i].type);
                this.lootboxes.splice(i, 1);
                break;
            }
        }
    }
    onPlayerShoot(detail) {
        detail.bullets.forEach(bulletData => {
            this.bullets.push(new Bullet(bulletData));
        });
        this.effects.addParticleEffect(detail.playerPos.x, detail.playerPos.y, 'bullet');
    }
    onGrenadeThrown(detail) {
        this.grenades.push(new Grenade(detail.grenade));
    }
    onGrenadeExploded(detail) {
        this.effects.addExplosionEffect(detail.x, detail.y, detail.radius);
        const allPlayers = [this.localPlayer, ...this.players];
        allPlayers.forEach(player => {
            const dist = Math.hypot(player.x - detail.x, player.y - detail.y);
            if (dist < detail.radius && player.isAlive) {
                const damage = detail.damage * (1 - dist / detail.radius);
                player.takeDamage(damage);
            }
        });
    }
    onAbilityUsed(detail) {
        console.log('Ability used:', detail.ability);
    }
    spawnLootboxes(count) {
        for (let i = 0; i < count; i++) {
            const x = Math.random() * CONFIG.MAP_WIDTH;
            const y = Math.random() * CONFIG.MAP_HEIGHT;
            const type = Math.random() > 0.5 ? 'health' : 'ammo';
            this.lootboxes.push(new Lootbox(x, y, type));
        }
    }
    broadcastPlayerState() {
        networkManager.broadcastPlayerState(this.localPlayer.getState());
    }
    togglePause() {
        this.isPaused = !this.isPaused;
        document.getElementById('pauseMenu').classList.toggle('hidden');
    }
    togglePlayersList() {
        document.getElementById('playersList').classList.toggle('hidden');
        this.updatePlayersList();
    }
    updatePlayersList() {
        const content = document.getElementById('playersListContent');
        const allPlayers = [this.localPlayer, ...this.players];
        content.innerHTML = allPlayers.map(p => `<div class="player-entry"><div class="player-name">${p.name}</div><div class="player-character">${p.character.type}</div><div class="player-team">Team: ${p.team}</div></div>`).join('');
    }
    start() {
        this.isRunning = true;
        this.gameLoop();
    }
    gameLoop = () => {
        this.update();
        this.render();
        if (this.isRunning) requestAnimationFrame(this.gameLoop);
    }
    stop() {
        this.isRunning = false;
    }
}
window.GameEngine = GameEngine;