class LootboxSpawner {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.spawnInterval = CONFIG.LOOTBOX_SPAWN_INTERVAL;
        this.lastSpawnTime = Date.now();
        this.maxLootboxes = CONFIG.LOOTBOX_MAX;
    }
    update() {
        const now = Date.now();
        if (now - this.lastSpawnTime > this.spawnInterval) {
            if (this.gameEngine.lootboxes.length < this.maxLootboxes) {
                this.spawnLootbox();
            }
            this.lastSpawnTime = now;
        }
    }
    spawnLootbox() {
        let x, y, isTooClose = true;
        while (isTooClose) {
            x = Math.random() * CONFIG.MAP_WIDTH;
            y = Math.random() * CONFIG.MAP_HEIGHT;
            const allPlayers = [this.gameEngine.localPlayer, ...this.gameEngine.players];
            isTooClose = allPlayers.some(p => {
                const dist = Math.hypot(p.x - x, p.y - y);
                return dist < 200;
            });
        }
        const type = Math.random() > 0.5 ? 'health' : 'ammo';
        const lootbox = new Lootbox(x, y, type);
        this.gameEngine.lootboxes.push(lootbox);
        console.log(`Lootbox spawned: ${type} at (${Math.round(x)}, ${Math.round(y)})`);
    }
    getNearestLootbox(player) {
        let nearest = null;
        let minDist = Infinity;
        this.gameEngine.lootboxes.forEach(loot => {
            const dist = Math.hypot(player.x - loot.x, player.y - loot.y);
            if (dist < minDist) {
                minDist = dist;
                nearest = loot;
            }
        });
        return nearest;
    }
}
window.LootboxSpawner = LootboxSpawner;