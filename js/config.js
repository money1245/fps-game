const CONFIG = {
    CANVAS_WIDTH: window.innerWidth,
    CANVAS_HEIGHT: window.innerHeight,
    MAP_WIDTH: 2000,
    MAP_HEIGHT: 2000,
    MAP_PADDING: 200,
    PLAYER_SIZE: 20,
    PLAYER_SPEED: 5,
    PLAYER_JUMP_STRENGTH: 15,
    PLAYER_FRICTION: 0.95,
    PLAYER_ACCELERATION: 0.8,
    PLAYER_MAX_HEALTH: 100,
    PLAYER_GRAVITY: 0.6,
    PLAYER_RESPAWN_TIME: 5000,
    WEAPONS: {
        sniper: { name: 'Sniper Rifle', damage: 100, fireRate: 300, magazineSize: 8, reloadTime: 2000, bulletSpeed: 15, accuracy: 0.95, range: 1500, spread: 5 },
        machinegunner: { name: 'Machine Gun', damage: 25, fireRate: 50, magazineSize: 30, reloadTime: 2500, bulletSpeed: 12, accuracy: 0.70, range: 800, spread: 15 },
        shotgunner: { name: 'Shotgun', damage: 80, fireRate: 800, magazineSize: 8, reloadTime: 2000, bulletSpeed: 8, accuracy: 0.60, range: 300, spread: 40, pellets: 8 },
        rifleman: { name: 'Assault Rifle', damage: 40, fireRate: 100, magazineSize: 20, reloadTime: 2000, bulletSpeed: 12, accuracy: 0.85, range: 1000, spread: 10 }
    },
    GRENADE_DAMAGE: 60, GRENADE_RADIUS: 200, GRENADE_SPEED: 8, GRENADE_GRAVITY: 0.3, GRENADE_MAX: 3,
    ABILITIES: {
        sniper: { name: 'Headshot Precision', cooldown: 15000, effect: 'double_damage_next_shot' },
        machinegunner: { name: 'Suppressive Fire', cooldown: 20000, effect: 'increased_fire_rate' },
        shotgunner: { name: 'Blast Wave', cooldown: 18000, effect: 'knockback_explosion' },
        rifleman: { name: 'Quick Reload', cooldown: 12000, effect: 'instant_reload' }
    },
    LOOTBOX_SIZE: 20, LOOTBOX_SPAWN_INTERVAL: 10000, LOOTBOX_MAX: 20, LOOTBOX_HEALTH: 40, LOOTBOX_AMMO: 30, LOOTBOX_RESPAWN_TIME: 15000,
    BULLET_SIZE: 5, BULLET_MAX: 500,
    GAME_MODES: { solo: { name: 'Solo', maxPlayers: 1, teams: 1 }, '2v2': { name: '2v2', maxPlayers: 4, teams: 2, playersPerTeam: 2 }, '4v4': { name: '4v4', maxPlayers: 8, teams: 2, playersPerTeam: 4 } },
    SPAWN_LOCATIONS: { solo: [{ x: 1000, y: 1000 }], '2v2': [{ x: 300, y: 300 }, { x: 1700, y: 1700 }, { x: 300, y: 1700 }, { x: 1700, y: 300 }], '4v4': [{ x: 200, y: 200 }, { x: 200, y: 400 }, { x: 300, y: 250 }, { x: 400, y: 300 }, { x: 1800, y: 1800 }, { x: 1800, y: 1600 }, { x: 1700, y: 1750 }, { x: 1600, y: 1700 }] },
    UPDATE_RATE: 60, NETWORK_TICK: 100, CONNECTION_TIMEOUT: 5000,
    CAMERA_LERP: 0.1, HUD_FONT: '12px Arial', HUD_COLOR: '#00ff00', HUD_SHADOW: 'rgba(0, 0, 0, 0.8)'
};
window.CONFIG = CONFIG;