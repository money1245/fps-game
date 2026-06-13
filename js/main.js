document.addEventListener('DOMContentLoaded', () => {
    console.log('FPS Shooter Game Initialized');
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    const startButton = document.getElementById('startGameBtn');
    const playerNameInput = document.getElementById('playerName');
    playerNameInput.addEventListener('input', checkCanStart);
    function checkCanStart() {
        const playerName = playerNameInput.value.trim();
        const hasCharacter = document.querySelector('.character-card.selected');
        const hasMode = document.querySelector('.mode-btn.selected');
        startButton.disabled = !(playerName && hasCharacter && hasMode);
    }
    window.initializeGame = function() {
        const playerName = playerNameInput.value.trim();
        const character = document.querySelector('.character-card.selected')?.dataset.character;
        const gameMode = document.querySelector('.mode-btn.selected')?.dataset.mode;
        if (!playerName || !character || !gameMode) {
            alert('Please fill all fields');
            return;
        }
        document.getElementById('homeScreen').classList.remove('active');
        document.getElementById('gameScreen').classList.add('active');
        window.gameConfig = { playerName: playerName, character: character, gameMode: gameMode };
        window.gameEngine = new GameEngine(window.gameConfig);
        window.gameEngine.start();
        document.getElementById('playerNameDisplay').textContent = playerName;
        document.getElementById('characterDisplay').textContent = character;
        startHUDUpdates();
    };
    startButton.addEventListener('click', window.initializeGame);
    function startHUDUpdates() {
        const hudUpdateInterval = setInterval(() => {
            if (!window.gameEngine || !window.gameEngine.isRunning) {
                clearInterval(hudUpdateInterval);
                return;
            }
            const player = window.gameEngine.localPlayer;
            if (!player) return;
            const healthPercent = (player.health / player.character.maxHealth) * 100;
            const healthBar = document.getElementById('healthBar');
            healthBar.style.width = healthPercent + '%';
            document.getElementById('healthText').textContent = `${Math.round(player.health)}/${player.character.maxHealth}`;
            document.getElementById('ammoText').textContent = `${player.weapon.ammunition}/${player.weapon.ammoReserve}`;
            const cooldown = player.getAbilityCooldownPercent();
            document.getElementById('abilityCooldown').textContent = Math.round(cooldown) + '%';
            document.getElementById('grenadeCount').textContent = `Q: ${player.grenadeCount}`;
        }, 100);
    }
    console.log(`╔════════════════════════════════════════╗\n║  FPS SHOOTER - KEYBOARD SHORTCUTS      ║\n╠════════════════════════════════════════╣\n║  W/A/S/D ............ Move             ║\n║  SPACE .............. Jump             ║\n║  LEFT CLICK ......... Shoot            ║\n║  RIGHT CLICK ........ Aim              ║\n║  R .................. Reload           ║\n║  Q .................. Grenade          ║\n║  E .................. Ability          ║\n║  F .................. Use Lootbox      ║\n║  TAB ................ Player List      ║\n║  ESC ................ Pause Menu       ║\n╚════════════════════════════════════════╝`);
});
console.log('%cFPS SHOOTER v1.0', 'color: #00FF00; font-size: 16px; font-weight: bold;');
console.log('%cOnline Multiplayer FPS Game', 'color: #FFD700; font-size: 12px;');