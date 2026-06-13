class NetworkManager {
    constructor() { this.players = new Map(); this.localPlayerId = null; this.gameMode = null; this.sessionId = this.generateSessionId(); this.isHost = false; this.connectedPlayers = []; this.simulateMultiplayer = true; }
    generateSessionId() { return 'session_' + Math.random().toString(36).substr(2, 9); }
    initializeLocalPlayer(playerData) { this.localPlayerId = playerData.id; this.players.set(playerData.id, playerData); console.log('Local player initialized:', playerData); }
    addRemotePlayer(playerData) { this.players.set(playerData.id, playerData); this.connectedPlayers.push(playerData.id); console.log('Remote player added:', playerData); }
    removePlayer(playerId) { this.players.delete(playerId); this.connectedPlayers = this.connectedPlayers.filter(id => id !== playerId); }
    getPlayer(playerId) { return this.players.get(playerId); }
    getAllPlayers() { return Array.from(this.players.values()); }
    getPlayersByTeam(team) { return Array.from(this.players.values()).filter(p => p.team === team); }
    broadcastPlayerState(playerState) { if (this.simulateMultiplayer) { setTimeout(() => { this.handlePlayerStateUpdate(playerState); }, Math.random() * 50); } }
    handlePlayerStateUpdate(state) { if (this.players.has(state.id)) { const player = this.players.get(state.id); if (state.x !== undefined) player.x = state.x; if (state.y !== undefined) player.y = state.y; if (state.vx !== undefined) player.vx = state.vx; if (state.vy !== undefined) player.vy = state.vy; if (state.health !== undefined) player.health = state.health; if (state.ammunition !== undefined) player.ammunition = state.ammunition; if (state.angle !== undefined) player.angle = state.angle; if (state.isAiming !== undefined) player.isAiming = state.isAiming; } }
    disconnect() { this.players.clear(); this.connectedPlayers = []; console.log('Network disconnected'); }
}
window.networkManager = new NetworkManager();