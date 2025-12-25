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

    scaled(s) {
        return new Vec2(s*this.x, s*this.y);
    }

    get sqNorm() {
        return this.x*this.x + this.y*this.y;
    }

    get norm() {
        return Math.sqrt(this.sqNorm);
    }
}

// export class Sound {
//     constructor(audio) {
//         this.audio = audio;
//     }

//     play() {
//         this.audio.play();
//     }
// }
// A BaseNode has one parent and * children
// update on a node calls update on children nodes (same with draw)
// the positioning is relative to the parent (where Root is the base parent with position (0,0))
export class BaseNode {
    constructor(name) {
        this.name = name;
        this.dead = false;
        this.parent = null;
        this.children = [];
    }

    update(deltaTime) {
        this.children.forEach(child => {
            child.update(deltaTime);
        });

        // Cleanup
        this.children = this.children.filter(child => !child.dead);
    }

    draw(ctx) {
        this.children.forEach(child => {
            child.draw(ctx);
        });
    }

    addChild(child) {
        child.parent = this;
        this.children.push(child);
        return child;
    }

    getChildren(predicate, recursive=true) {
        let res = [];
        for (let i = 0; i < this.children.length; i++) {
            if (predicate(this.children[i])) {res.push(this.children[i]);}
            if (recursive) {
                res.push.apply(res, this.children[i].getChildren(predicate, recursive));
            }
        }
        return res;
    }

    getChildrenByName(name, recursive=true) {
        return this.getChildren((child) => {return child.name === name;}, recursive);
    }

    getChildrenByType(type, recursive=true) {
        return this.getChildren((child) => {return child instanceof type;}, recursive);
    }
}

export class Node2d extends BaseNode {
    constructor(x, y) {
        super("Node2d");
        this.position = new Vec2(x, y);
    }

    get globalPosition() {
        if (this.parent instanceof Node2d) {return new Vec2(
            this.parent.globalPosition.x + this.position.x,
            this.parent.globalPosition.y + this.position.y,
        )};
        return this.position; // no parent
    }
}

export class Sprite2d extends Node2d {
    constructor(image, w, h) {
        super(0,0);
        this.name = "Sprite2d";
        this.image = image;
        this.w = w;
        this.h = h;
    }

    draw(ctx) {
        super.draw(ctx);
        ctx.drawImage(this.image,
            this.globalPosition.x-this.w/2, this.globalPosition.y-this.h/2,
            this.w, this.h);
    }
}

export class Collider2d extends Node2d {
    constructor(w, h, layer = 0, mask = 0b1111) {
        super(0,0);
        this.name = "Collider2d";
        this.w = w;
        this.h = h;
        this.layer = layer; // 0,1,2,3
        this.mask = mask; // bitmask of layers it collides with
        this.onCollision = null;
    }

    canCollideWith(cld) {
        return (this.mask & (1 << cld.layer)) !== 0;
    }

    collidesWith(cld) {
        return  this.globalPosition.x-this.w/2 < cld.globalPosition.x+cld.w/2 &&
                this.globalPosition.x+this.w/2 > cld.globalPosition.x-cld.w/2 &&
                this.globalPosition.y-this.h/2 < cld.globalPosition.y+cld.h/2 &&
                this.globalPosition.y+this.h/2 > cld.globalPosition.y-cld.h/2;
    }

    draw(ctx) {
        super.draw(ctx);
        ctx.strokeStyle = "rgba(255,0,0,0.5)";
        ctx.strokeRect(
            this.globalPosition.x - this.w/2,
            this.globalPosition.y - this.h/2,
            this.w,
            this.h
        );
    }
}

export class Timer extends BaseNode {
    constructor(cooldown, oneShot = false, onTimeout = null) {
        super("Timer");
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
        super.update(deltaTime);
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
// Particles
// ==================
export class Particle {
    constructor(x, y, vx, vy, life, size, color) {
        //super("Particle");
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
        this.particles = [];

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
            if (!obj.dead) {obj.update(deltaTime);}
        });
        this.particles.forEach(particle => {
            if (!particle.dead) {particle.update(deltaTime);}
        });

        // Collision pass
        const colliders = [];
        for (let i = 0; i < this.gameObjects.length; i++) {
            if (this.gameObjects[i] instanceof Collider2d) {colliders.push(this.gameObjects[i]);}
            colliders.push.apply(colliders, this.gameObjects[i].getChildrenByType(Collider2d));
        }
        for (let i = 0; i < colliders.length; i++) {
            const a = colliders[i];
            if (a.dead) {continue;}
            for (let j = i + 1; j < colliders.length; j++) {
                const b = colliders[j];
                if (b.dead) {continue;}
                if (a.canCollideWith(b) && a.collidesWith(b)) {
                    if (a.onCollision) {a.onCollision(b);}
                    if (b.onCollision) {b.onCollision(a);}
                }
            }
        }

        // Cleanup
        this.gameObjects = this.gameObjects.filter(obj => !obj.dead);
        this.particles = this.particles.filter(particle => !particle.dead);
    }

    draw(ctx) {
        // Clear
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        this.gameObjects.forEach(obj => {
            obj.draw(ctx);
        });
        this.particles.forEach(particle => {
            particle.draw(ctx);
        });

        // Debug
        ctx.fillStyle = "red";
        ctx.font = "24px Arial";
        ctx.textAlign = "right";
        ctx.textBaseline = "bottom";
        ctx.fillText("FPS: "+String((1/this.deltaTime)|0), canvas.width-10, canvas.height-90);
        ctx.fillText("#Obj: "+this.gameObjects.length, canvas.width-10, canvas.height-60);
        ctx.fillText("#Part: "+this.particles.length, canvas.width-10, canvas.height-30);
    }

    emitParticles(x, y, count = 20, color="orange") {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 200 + 50;

            this.particles.push(
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
const defaultImage = new Image();
const defaultAudio = new Audio();
export class AssetDatabase {
    constructor() {
        this.images = {};
        this.audios = {};
    }

    getImage(name) {
        return this.images[name] ?? defaultImage;
    }

    setImage(name, sprite) {
        if(Object.values(this.images).includes(name)) {
            console.error("Sprite with name "+name+" already exists!");
            return defaultImage;
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
        return this.sounds[name] ?? defaultAudio;
    }

    setAudio(name, sound) {
        if(Object.values(this.sounds).includes(name)) {
            console.error("Sound with name "+name+" already exists!");
            return defaultAudio;
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