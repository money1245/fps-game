class UIManager {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.setupUI();
        this.setupEventListeners();
    }
    setupUI() {
        document.querySelectorAll('.character-card').forEach(card => {
            card.addEventListener('click', () => this.selectCharacter(card));
        });
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => this.selectGameMode(btn));
        });
        document.getElementById('startGameBtn').addEventListener('click', () => this.startGame());
    }
    setupEventListeners() {
        document.getElementById('resumeBtn').addEventListener('click', () => { this.gameEngine.togglePause(); });
        document.getElementById('mainMenuBtn').addEventListener('click', () => { this.returnToMainMenu(); });
        document.getElementById('playAgainBtn').addEventListener('click', () => { location.reload(); });
        document.getElementById('mainMenuBtn2').addEventListener('click', () => { this.returnToMainMenu(); });
        window.addEventListener('weaponFired', (e) => this.updateAmmoDisplay(e.detail));
        window.addEventListener('weaponReloaded', (e) => this.updateAmmoDisplay(e.detail));
        window.addEventListener('playerDamaged', (e) => this.updateHealthDisplay(e.detail));
        window.addEventListener('playerRespawned', (e) => this.onPlayerRespawned());
        window.addEventListener('lootboxPickedUp', (e) => this.showPickupNotification(e.detail));
        window.addEventListener('abilityUsed', (e) => this.showAbilityNotification(e.detail));
    }
    selectCharacter(card) {
        document.querySelectorAll('.character-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        window.selectedCharacter = card.dataset.character;
        this.checkCanStart();
    }
    selectGameMode(btn) {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        window.selectedGameMode = btn.dataset.mode;
        this.checkCanStart();
    }
    checkCanStart() {
        const playerName = document.getElementById('playerName').value;
        const hasCharacter = window.selectedCharacter !== undefined;
        const hasMode = window.selectedGameMode !== undefined;
        document.getElementById('startGameBtn').disabled = !(playerName && hasCharacter && hasMode);
    }
    startGame() {
        const playerName = document.getElementById('playerName').value;
        const character = window.selectedCharacter;
        const gameMode = window.selectedGameMode;
        if (!playerName || !character || !gameMode) return;
        document.getElementById('homeScreen').classList.remove('active');
        document.getElementById('gameScreen').classList.add('active');
        window.gameMode = gameMode;
        const gameConfig = { playerName: playerName, character: character, gameMode: gameMode };
        window.gameEngine = new GameEngine(gameConfig);
        window.gameEngine.start();
        this.updatePlayerInfo(playerName, character, gameMode);
    }
    updatePlayerInfo(name, character, gameMode) {
        document.getElementById('playerNameDisplay').textContent = name;
        document.getElementById('characterDisplay').textContent = character;
        document.getElementById('teamDisplay').textContent = '1';
    }
    updateHealthDisplay(detail) {
        if (detail.playerId === window.gameEngine.localPlayer.id) {
            const player = window.gameEngine.localPlayer;
            const healthPercent = (player.health / player.character.maxHealth) * 100;
            const healthBar = document.getElementById('healthBar');
            healthBar.style.width = healthPercent + '%';
            document.getElementById('healthText').textContent = `${Math.round(player.health)}/${player.character.maxHealth}`;
            if (healthPercent > 50) {
                healthBar.style.background = 'linear-gradient(90deg, #00ff00, #ffff00)';
            } else if (healthPercent > 25) {
                healthBar.style.background = 'linear-gradient(90deg, #ffff00, #ff6600)';
            } else {
                healthBar.style.background = 'linear-gradient(90deg, #ff6600, #ff0000)';
            }
        }
    }
    updateAmmoDisplay(detail) {
        if (detail.ammunition !== undefined) {
            const ammoText = `${detail.ammunition}/${Math.round(detail.ammoReserve)}`;
            document.getElementById('ammoText').textContent = ammoText;
        }
    }
    updateAbilityCooldown() {
        const player = window.gameEngine.localPlayer;
        const cooldownPercent = player.getAbilityCooldownPercent();
        document.getElementById('abilityCooldown').textContent = Math.round(cooldownPercent) + '%';
        if (cooldownPercent >= 100) {
            document.getElementById('abilityIcon').style.opacity = '1';
        } else {
            document.getElementById('abilityIcon').style.opacity = '0.5';
        }
    }
    updateGrenadeCount() {
        const player = window.gameEngine.localPlayer;
        document.getElementById('grenadeCount').textContent = `Q: ${player.grenadeCount}`;
    }
    showPickupNotification(detail) {
        const message = detail.type === 'health' ? '❤️ Health Restored' : '🔫 Ammo Restored';
        this.showNotification(message, detail.type === 'health' ? '#00FF00' : '#FFD700');
    }
    showAbilityNotification(detail) {
        this.showNotification(`${detail.ability} Ready!`, '#00FFFF');
    }
    showNotification(message, color) {
        const notification = document.createElement('div');
        notification.style.cssText = `position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0, 0, 0, 0.9); color: ${color}; padding: 1rem 2rem; border-radius: 10px; border: 2px solid ${color}; font-weight: bold; font-size: 1.2rem; z-index: 100; animation: fadeInOut 1s ease-in-out; pointer-events: none;`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 1000);
    }
    onPlayerRespawned() {
        const player = window.gameEngine.localPlayer;
        this.updateHealthDisplay({ playerId: player.id });
        this.updateAmmoDisplay({ ammunition: player.weapon.ammunition, ammoReserve: player.weapon.ammoReserve });
    }
    returnToMainMenu() {
        window.gameEngine.stop();
        location.reload();
    }
    updateHUD() {
        if (!window.gameEngine || !window.gameEngine.localPlayer) return;
        const player = window.gameEngine.localPlayer;
        this.updateAbilityCooldown();
        this.updateGrenadeCount();
        this.updateHealthDisplay({ playerId: player.id });
        this.updateAmmoDisplay({ ammunition: player.weapon.ammunition, ammoReserve: player.weapon.ammoReserve });
    }
}
let uiManager = null;
window.addEventListener('DOMContentLoaded', () => {
    uiManager = new UIManager({ togglePause: () => {}, localPlayer: null });
});
const style = document.createElement('style');
style.textContent = `@keyframes fadeInOut { 0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); } 50% { opacity: 1; transform: translate(-50%, -50%) scale(1); } 100% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); } }`;
document.head.appendChild(style);
window.UIManager = UIManager;