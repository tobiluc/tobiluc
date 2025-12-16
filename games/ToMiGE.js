// Minimal Game Engine

export const canvas = document.getElementById("gameCanvas");
export const ctx = canvas.getContext("2d");
export const keys = {};

// ==================
// Utils
// ==================
export class Vec2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    directionTo(to) {
        let dx = to.x - this.x;
        let dy = to.y - this.y;
        let d = Math.sqrt(dx*dx + dy*dy);
        return new Vec2(dx/d, dy/d);
    }

    get sqNorm() {
        return this.x*this.x + this.y*this.y;
    }

    get norm() {
        return Math.sqrt(this.sqNorm);
    }
}

// ==================
// Components
// ==================
export class AABB {
    constructor(cx, cy, w, h) {
        this.w = w;
        this.h = h;
        this.min = new Vec2(cx-w/2, cy-h/2);
        this.max = new Vec2(cx+w/2, cy+h/2);
    }

    translate(dx, dy) {
        this.min.x += dx;
        this.max.x += dx;
        this.min.y += dy;
        this.max.y += dy;
    }

    get center() {
        return new Vec2(
            (this.min.x + this.max.x) / 2,
            (this.min.y + this.max.y) / 2
        );
    }

    get size() {
        return new Vec2(
            this.max.x - this.min.x,
            this.max.y - this.min.y
        );
    }

    intersects(aabb) {
        return  this.min.x < aabb.max.x &&
                this.max.x > aabb.min.x &&
                this.min.y < aabb.max.y &&
                this.max.y > aabb.min.y;
    };
}

export class Collider {
    constructor(aabb, layer = 0, mask = 0b1111) {
        this.aabb = aabb;
        this.layer = layer;
        this.mask = mask; // bitmask of layers it collides with
    }

    canCollideWith(other) {
        return (this.mask & (1 << other.layer)) !== 0;
    }
}

export class Sprite {
    constructor(image) {
        this.image = image;
        this.rotation = 0;
    }

    draw(ctx, aabb) {
        ctx.save();
        ctx.translate(aabb.center.x, aabb.center.y);
        ctx.rotate(this.rotation);
        ctx.drawImage(this.image, -aabb.w/2, -aabb.h/2, aabb.w, aabb.h);
        ctx.restore();
    }
}

export class Sound {
    constructor(audio) {
        this.audio = audio;
    }

    play() {
        this.audio.play();
    }
}

export class Timer {
    constructor(cooldown, oneShot = false, onTimeout = null) {
        this.cooldown = cooldown;
        this.reset();
        this.onTimeout = onTimeout;
        this.oneShot = oneShot;
        this.paused = false;
    }

    reset() {
        this.counter = this.cooldown;
    }

    pause() {
        this.paused = true;
    }

    unpause() {
        this.paused = false;
    }

    update(deltaTime) {
        if (this.counter > 0 && !this.paused) {
            this.counter -= deltaTime || 0;
            if (this.counter <= 0) {
                if (this.onTimeout != null) {this.onTimeout();}
                if (!this.oneShot) {this.counter += this.cooldown;}
            }
        }
    }
}

// ==================
// Objects
// ==================
export class GameObject {
    constructor(name) {
        this.name = name;
        this.dead = false;
        this.collider = null;
        this.sprite = null;
    }

    update(deltaTime) {}

    draw(ctx) {
        if (this.sprite && this.collider) {
            this.sprite.draw(ctx, this.collider.aabb);
        }
    }

    onCollision(obj) {}

    get position() {
        if (this.collider) {return this.collider.aabb.center;}
        return null;
    }

    set position(pos) {
        if (this.collider) {
            this.collider.aabb.min.x = pos.x - this.collider.aabb.w/2;
            this.collider.aabb.max.x = pos.x + this.collider.aabb.w/2;
            this.collider.aabb.min.y = pos.y - this.collider.aabb.h/2;
            this.collider.aabb.max.y = pos.y + this.collider.aabb.h/2;
        }
    }
}

// ==================
// Particles
// ==================
export class Particle extends GameObject {
    constructor(x, y, vx, vy, life, size, color) {
        super("Particle");
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = life;
        this.maxLife = life;
        this.size = size;
        this.color = color;
    }

    update(dt) {
        this.life -= dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.dead = this.life <= 0;
    }

    draw(ctx) {
        const alpha = Math.max(this.life / this.maxLife, 0);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    get position() {
        return new Vec2(this.x, this.y);
    }
}

// ==================
// Game
// ==================
export class Game {
    constructor(name) {
        this.name = name;
        this.lastTimestamp = 0;
        this.deltaTime = 0.1;
        this.gameObjects = [];

        // Input handling
        window.addEventListener("keydown", (e) => keys[e.key] = true);
        window.addEventListener("keyup", (e) => keys[e.key] = false);
    }

    addObject(gameObject) {
        this.gameObjects.push(gameObject);
    }

    deleteObject(gameObject) {
        gameObject.dead = true;
    }

    nearestObject(x, y, rgx = /.*/) {
        let best = null;
        let bestDistSq = Infinity;
        for (const obj of this.gameObjects) {
            if (obj.dead) {continue;}
            if (!rgx.test(obj.name)) {continue;}

            const pos = obj.position;
            if (!pos) {continue;}

            const dx = pos.x - x;
            const dy = pos.y - y;
            const distSq = dx*dx + dy*dy;

            if (distSq < bestDistSq) {
                bestDistSq = distSq;
                best = obj;
            }
        }
        return best;
    }


    run(timestamp) {
        this.deltaTime = (timestamp - this.lastTimestamp) / 1000; // in seconds
        this.lastTimestamp = timestamp;
        this.update(this.deltaTime);
        this.draw(ctx);
        requestAnimationFrame(this.run.bind(this));
    }

    update(deltaTime) {
        // Update Game Objects
        this.gameObjects.forEach(obj => {
            if (!obj.dead) {
                obj.update(deltaTime);
            }
        });

        // Collision pass
        const collidables = this.gameObjects.filter(o => o.collider);
        for (let i = 0; i < collidables.length; i++) {
            const a = collidables[i];
            for (let j = i + 1; j < collidables.length; j++) {
                const b = collidables[j];
                if (a.collider.canCollideWith(b.collider) && a.collider.aabb.intersects(b.collider.aabb)) {
                    a.onCollision(b);
                }
            }
        }


        // Cleanup
        this.gameObjects = this.gameObjects.filter(obj => !obj.dead);
    }

    draw(ctx) {
        // Clear
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        this.gameObjects.forEach(obj => {
            obj.draw(ctx);
        });

        // Debug
        ctx.fillStyle = "red";
        ctx.font = "24px Arial";
        ctx.textAlign = "right";
        ctx.textBaseline = "bottom";
        ctx.fillText("FPS: "+String((1/this.deltaTime)|0), canvas.width-10, canvas.height-60);
        ctx.fillText("#Obj: "+this.gameObjects.length, canvas.width-10, canvas.height-30);
    }

    emitParticles(x, y, count = 20, color="orange") {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 200 + 50;

            this.addObject(
                new Particle(
                    x, y,
                    Math.cos(angle) * speed,
                    Math.sin(angle) * speed,
                    Math.random() * 0.5 + 0.3,
                    Math.random() * 3 + 2,
                    color
                )
            );
        }
    }
}

// ==================
// Assets
// ==================
export class AssetDatabase {
    constructor() {
        this.images = {};
        this.audios = {};
    }

    getImage(name) {
        return this.images[name] ?? null;
    }

    setImage(name, sprite) {
        if(Object.values(this.images).includes(name)) {
            console.error("Sprite with name "+name+" already exists!");
            return null;
        }
        this.images[name] = sprite;
        return sprite;
    }

    loadImageFromFile(path) {
        const spr = new Image();
        spr.src = path;
        return spr;
    }

    setImageFromFile(name, filepath) {
        return this.setImage(name, this.loadImageFromFile(filepath));
    }

    getAudio(name) {
        return this.sounds[name] ?? null;
    }

    setAudio(name, sound) {
        if(Object.values(this.sounds).includes(name)) {
            console.error("Sound with name "+name+" already exists!");
            return null;
        }
        this.sounds[name] = sound;
        return sound;
    }

    loadAudioFromFile(path) {
        return new Audio(path); 
    }

    setAudioFromFile(name, filepath) {
        return this.setAudio(name, this.loadAudioFromFile(filepath));
    }
}

export class Dummy {
    printHelloWorld() {
        console.log("Hello World");
    }
}