class Character {
    constructor(type, name, team = 1) { this.type = type; this.name = name; this.team = team; this.config = CONFIG.WEAPONS[type]; this.ability = CONFIG.ABILITIES[type]; this.initializeStats(); }
    initializeStats() {
        switch (this.type) {
            case 'sniper': this.speed = 3; this.jumpPower = 8; this.health = 80; this.armor = 0.8; this.description = 'Long-range specialist. High damage, low fire rate.'; this.color = '#FF6B6B'; break;
            case 'machinegunner': this.speed = 5; this.jumpPower = 7; this.health = 120; this.armor = 0.6; this.description = 'Full auto weapon. High fire rate, medium damage.'; this.color = '#4ECDC4'; break;
            case 'shotgunner': this.speed = 4.5; this.jumpPower = 9; this.health = 110; this.armor = 0.7; this.description = 'Close range fighter. High damage, explosive pellets.'; this.color = '#FFE66D'; break;
            case 'rifleman': this.speed = 4.5; this.jumpPower = 8; this.health = 100; this.armor = 0.8; this.description = 'Balanced fighter. Medium damage, medium fire rate.'; this.color = '#95E1D3'; break;
        }
        this.maxHealth = this.health;
    }
    getWeaponStats() { return this.config; }
    getAbilityInfo() { return this.ability; }
    getDescription() { return this.description; }
    getCharacterColor() { return this.color; }
    calculateDamage(baseDamage) { return Math.round(baseDamage * this.armor); }
    getIcon() { const icons = { sniper: '🎯', machinegunner: '🔫', shotgunner: '💥', rifleman: '🏹' }; return icons[this.type] || '👤'; }
    toJSON() { return { type: this.type, name: this.name, team: this.team, speed: this.speed, jumpPower: this.jumpPower, maxHealth: this.maxHealth, armor: this.armor }; }
}
class CharacterFactory {
    static createCharacter(type, name, team) { if (!CONFIG.WEAPONS[type]) throw new Error('Unknown character type: ' + type); return new Character(type, name, team); }
}
window.Character = Character;
window.CharacterFactory = CharacterFactory;