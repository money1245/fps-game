// Visual Effects System
class ParticleEffect {
    constructor(x, y, type = 'bullet') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.particles = [];
        this.createdAt = Date.now();
        this.lifetime = 500; // 500ms

        this.generateParticles();
    }

    // Generate particles based on type
    generateParticles() {
        const particleCount = this.type === 'explosion' ? 15 : 5;

        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
            const speed = Math.random() * 3 + 1;

            this.particles.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                size: Math.random() * 3 + 1,
                color: this.type === 'explosion' ? '#FF6B00' : '#FFD700',
            });
        }
    }

    // Update particles
    update() {
        const elapsed = Date.now() - this.createdAt;
        const progress = elapsed / this.lifetime;

        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1; // gravity
            p.life = Math.max(0, 1 - progress);
            p.size *= 0.98;
        });

        return this.particles.some(p => p.life > 0);
    }

    // Render particles
    render(ctx) {
        this.particles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.life * 0.8;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }

    // Check if effect is still active
    isActive() {
        return Date.now() - this.createdAt < this.lifetime;
    }
}

// Blood Splatter Effect
class BloodEffect {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.splatters = [];
        this.createdAt = Date.now();
        this.lifetime = 1500;

        this.generateSplatters();
    }

    generateSplatters() {
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8 + (Math.random() - 0.5) * 0.3;
            const speed = Math.random() * 4 + 2;

            this.splatters.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                size: Math.random() * 4 + 2,
                rotation: Math.random() * Math.PI * 2,
            });
        }
    }

    update() {
        const elapsed = Date.now() - this.createdAt;
        const progress = elapsed / this.lifetime;

        this.splatters.forEach(s => {
            s.x += s.vx;
            s.y += s.vy;
            s.vy += 0.15; // gravity
            s.life = Math.max(0, 1 - progress);
            s.rotation += 0.1;
        });

        return this.splatters.some(s => s.life > 0);
    }

    render(ctx) {
        this.splatters.forEach(s => {
            ctx.save();
            ctx.globalAlpha = s.life * 0.6;
            ctx.fillStyle = '#8B0000';
            ctx.translate(s.x, s.y);
            ctx.rotate(s.rotation);
            ctx.fillRect(-s.size / 2, -s.size / 2, s.size, s.size);
            ctx.restore();
        });
    }

    isActive() {
        return Date.now() - this.createdAt < this.lifetime;
    }
}

// Explosion Effect
class ExplosionEffect {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.createdAt = Date.now();
        this.lifetime = 600;
        this.maxRadius = radius;
    }

    update() {
        const elapsed = Date.now() - this.createdAt;
        const progress = elapsed / this.lifetime;
        this.radius = this.maxRadius * progress;

        return this.isActive();
    }

    render(ctx) {
        const elapsed = Date.now() - this.createdAt;
        const progress = elapsed / this.lifetime;

        // Shockwave
        ctx.save();
        ctx.strokeStyle = `rgba(255, 100, 0, ${(1 - progress) * 0.8})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();

        // Flash
        ctx.fillStyle = `rgba(255, 200, 0, ${(1 - progress) * 0.3})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    isActive() {
        return Date.now() - this.createdAt < this.lifetime;
    }
}

// Hit Marker Effect
class HitMarkerEffect {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 20;
        this.maxSize = 20;
        this.createdAt = Date.now();
        this.lifetime = 300;
    }

    update() {
        const elapsed = Date.now() - this.createdAt;
        const progress = elapsed / this.lifetime;
        this.size = this.maxSize * (1 + progress * 0.5);

        return this.isActive();
    }

    render(ctx, cameraX, cameraY) {
        const elapsed = Date.now() - this.createdAt;
        const progress = elapsed / this.lifetime;

        ctx.save();
        ctx.globalAlpha = 1 - progress;
        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 2;

        // Cross marker
        ctx.beginPath();
        ctx.moveTo(this.x - this.size / 2, this.y);
        ctx.lineTo(this.x + this.size / 2, this.y);
        ctx.moveTo(this.x, this.y - this.size / 2);
        ctx.lineTo(this.x, this.y + this.size / 2);
        ctx.stroke();

        ctx.restore();
    }

    isActive() {
        return Date.now() - this.createdAt < this.lifetime;
    }
}

// Damage Number Effect
class DamageNumberEffect {
    constructor(x, y, damage, isCritical = false) {
        this.x = x;
        this.y = y;
        this.damage = damage;
        this.isCritical = isCritical;
        this.createdAt = Date.now();
        this.lifetime = 1000;
        this.startY = y;
    }

    update() {
        this.y -= 1.5;
        return this.isActive();
    }

    render(ctx) {
        const elapsed = Date.now() - this.createdAt;
        const progress = elapsed / this.lifetime;

        ctx.save();
        ctx.globalAlpha = 1 - progress;
        ctx.font = `bold ${this.isCritical ? 20 : 16}px Arial`;
        ctx.fillStyle = this.isCritical ? '#FFD700' : '#FF0000';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 4;

        ctx.fillText(this.isCritical ? 'CRIT ' + this.damage : this.damage, this.x, this.y);

        ctx.restore();
    }

    isActive() {
        return Date.now() - this.createdAt < this.lifetime;
    }
}

// Effects Manager
class EffectsManager {
    constructor() {
        this.effects = [];
    }

    addEffect(effect) {
        this.effects.push(effect);
    }

    // Add specific effect types
    addParticleEffect(x, y, type = 'bullet') {
        this.addEffect(new ParticleEffect(x, y, type));
    }

    addBloodEffect(x, y) {
        this.addEffect(new BloodEffect(x, y));
    }

    addExplosionEffect(x, y, radius) {
        this.addEffect(new ExplosionEffect(x, y, radius));
    }

    addHitMarkerEffect(x, y) {
        this.addEffect(new HitMarkerEffect(x, y));
    }

    addDamageNumberEffect(x, y, damage, isCritical = false) {
        this.addEffect(new DamageNumberEffect(x, y, damage, isCritical));
    }

    // Update all effects
    update() {
        for (let i = this.effects.length - 1; i >= 0; i--) {
            if (!this.effects[i].update()) {
                this.effects.splice(i, 1);
            }
        }
    }

    // Render all effects
    render(ctx) {
        this.effects.forEach(effect => {
            effect.render(ctx);
        });
    }

    // Clear all effects
    clear() {
        this.effects = [];
    }
}

// Export for use
window.ParticleEffect = ParticleEffect;
window.ExplosionEffect = ExplosionEffect;
window.EffectsManager = EffectsManager;