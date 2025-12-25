import {AssetDatabase, canvas, Game, Sprite2d, Timer, keys, Collider2d, Vec2, BaseNode, Node2d } from "../ToMiGE.js";

//========================
// Assets
//========================

//---------------
// Images
//---------------
let assets = new AssetDatabase();
assets.setImageFromFile("Player", "images/Santa.png");
assets.setImageFromFile("PlayerLifesBack", "images/playerLifeBack.png");
assets.setImageFromFile("PlayerLifesFront", "images/playerLifeFront.png");
assets.setImageFromFile("Star", "images/Star.png");
for (let i = 0; i <= 31; i++) {
    const idx = i.toString().padStart(2, "0");
    assets.setImageFromFile(`Enemy_${idx}`, `images/enemies/${idx}.png`);
}
assets.setImageFromFile("StarsBG", "images/StarsBG.png");
assets.setImageFromFile("AutoTargeting", "images/items/autoTargeting.png");
assets.setImageFromFile("BigStars", "images/items/bigStars.png");
assets.setImageFromFile("FastShooting", "images/items/fastShooting.png");
assets.setImageFromFile("BonusHp", "images/items/bonusHp.png");

//---------------
// Sounds
//---------------
// assets.setAudioFromFile("BG", "audio/main.wav").loop = true;
// assets.setAudioFromFile("EnemyHurt", "audio/cookie_hurt.wav");
// assets.setAudioFromFile("PlayerHurt", "audio/player_hurt.wav");

//---------------
// Globals
//---------------
let globals = {
    score: 0,
    player: null,
    bigStarsTimer: new Timer(10, true),
    autoTargetingTimer: new Timer(10, true),
    fastShootingTimer: new Timer(10, true)
};
globals.bigStarsTimer.pause();
globals.autoTargetingTimer.pause();
globals.fastShootingTimer.pause();

class SantaShooter extends Game {
    constructor() {
        super("Santa Shooter");

        class Background extends BaseNode {
            constructor() {
                super("Backhround");
                this.x = 0;
                this.img = assets.getImage("StarsBG");
            }
            update(deltaTime) {
                this.x -= 2;
                if (this.x < -canvas.width) {
                    this.x = 0;
                }
            }
            draw(ctx) {
                const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
                gradient.addColorStop(0, "#001d3d");
                gradient.addColorStop(0.5, "#003566");
                gradient.addColorStop(1, "#000000");
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.drawImage(this.img, this.x, 0, canvas.width, canvas.height);
                ctx.drawImage(this.img, this.x+canvas.width, 0, canvas.width, canvas.height);
            }
        }
        this.addObject(new Background());

        this.enemySpawnTimer = new Timer(2.5, false, this.spawnEnemy.bind(this));
        this.itemSpawnTimer = new Timer(30, false, this.spawnItem.bind(this));
    }

    spawnEnemy() {
        this.addObject(new Enemy(canvas.width+50, Math.random() * canvas.height));
    };

    spawnItem() {
        this.addObject(new Item());
    }

    update(deltaTime) {
        if (globals.player.hp <= 0) {
            if (keys["r"] || keys["R"]) {
                // Restart Game after Game Over
                globals.score = 0;
                globals.player.position = new Vec2(globals.player.position.x, canvas.height/2);
                globals.player.hp = globals.player.hpMax;
            }
            return;
        }

        super.update(deltaTime);

        this.enemySpawnTimer.update(deltaTime);
        this.itemSpawnTimer.update(deltaTime);

        globals.autoTargetingTimer.update(deltaTime);
        globals.bigStarsTimer.update(deltaTime);
        globals.fastShootingTimer.update(deltaTime);
    }

    draw(ctx) {
        if (globals.player.hp <= 0) {
            // Game Over
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            ctx.font = "64px Arial";
            ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 80);

            ctx.font = "48px Arial";
            ctx.fillText("Your Score: "+globals.score, canvas.width / 2, canvas.height / 2 - 20);
            ctx.fillText("Highscore: " + localStorage.getItem("santashooter_highscore"), canvas.width / 2, canvas.height / 2 + 10);

            ctx.font = "24px Arial";
            ctx.fillText("Press 'R' to restart",
                canvas.width / 2,
                canvas.height / 2 + 30
            );
            return;
        }

        super.draw(ctx);

        // Draw Score
        ctx.fillStyle = "white";
        ctx.font = "24px Arial";
        ctx.textAlign = "right";
        ctx.textBaseline = "top";
        ctx.fillText("Score: " + globals.score, canvas.width-10, 10);
    }
}
const game = new SantaShooter();

//---------------
// Objects
//---------------
class Item extends Node2d {
    constructor() {
        super(canvas.width/2, canvas.height/2);
        this.addChild(new Collider2d(32, 32)).onCollision = (cld) => {
            // Item Star Collidion
            let obj = cld.parent;
            if (obj && obj.name === "Star" && !this.collected) {
                // Collect
                if (this.name === "ItemBonusHp") {
                    if (globals.player.hp < globals.player.hpMax) {
                        globals.player.hp += 1;
                    }
                } else if (this.name === "ItemBigStars") {
                    globals.bigStarsTimer.reset();
                    globals.bigStarsTimer.unpause();
                } else if (this.name === "ItemAutoTargeting") {
                    globals.autoTargetingTimer.reset();
                    globals.autoTargetingTimer.unpause();
                } else if (this.name === "ItemFastShooting") {
                    globals.fastShootingTimer.reset();
                    globals.fastShootingTimer.unpause();
                }
                obj.dead = true;
                this.dead = true;
                game.emitParticles(this.position.x, this.position.y, 10, "white");
            }
        };


        const r = Math.random();
        if (r < 0.25) {
            this.name = "ItemFastShooting";
            this.addChild(new Sprite2d(assets.getImage("FastShooting"), 32, 32));
        } else if (r < 0.5) {
            this.name = "ItemAutoTargeting";
            this.addChild(new Sprite2d(assets.getImage("AutoTargeting"), 32, 32));
        } else if (r < 0.75) {
            this.name = "ItemBigStars";
            this.addChild(new Sprite2d(assets.getImage("BigStars"), 32, 32));
        } else {
            this.name = "ItemBonusHp";
            this.addChild(new Sprite2d(assets.getImage("BonusHp"), 32, 32));
        }
        this.addChild(new Timer(10, true, () => {this.dead = true}));
    }

    update(deltaTime) {
        super.update(deltaTime);
    }

    draw(ctx) {
        if (!this.collected) {
            super.draw(ctx);
        }
    }
}

class Star extends Node2d {
    constructor(x, y, big) {
        super(x,y);
        this.name = "Star";
        this.dmg = big? 1000 : 1;
        this.hp = 5;
        let size = big? 32 : 16;
        this.addChild(new Sprite2d(assets.getImage("Star"), size, size));
        this.addChild(new Collider2d(size, size));
        this.spd = 400;
    }

    update(deltaTime) {
        super.update(deltaTime);

        if (globals.autoTargetingTimer.counter > 0 && !globals.autoTargetingTimer.paused) {
            const enemy = game.nearestObject(this.position.x, this.position.y, /^Enemy$/);
            if (enemy) {
                let dx = enemy.position.x - this.position.x;
                let dy = enemy.position.y - this.position.y;
                let d = Math.sqrt(dx*dx + dy*dy);
                this.position.x += deltaTime * this.spd * dx / d;
                this.position.y += deltaTime * this.spd * dy / d;
            } else {
                this.position.x += deltaTime * this.spd;
            }
        } else {
            this.position.x += deltaTime * this.spd;
        }

        if (this.globalPosition.x > canvas.width) {
            this.dead = true;
        }
    }

    draw(ctx) {
        super.draw(ctx);
    }
}

class Player extends Node2d {
    constructor(x, y) {
        super(x,y);
        this.name = "Player";
        this.hpMax = 10;
        this.hp = 5;
        this.addChild(new Sprite2d(assets.getImage("Player"), 64, 64));
        this.addChild(new Collider2d(64, 64)).onCollision = (cld) => {
            if (cld.parent && cld.parent.name === "Enemy") {
                this.hp -= 1;
                if (this.hp <= 0) {
                    if (globals.score > localStorage.getItem("santashooter_highscore")) {
                        localStorage.setItem("santashooter_highscore", globals.score);
                    }
                }
                cld.parent.dead = true;
            }
        };
        this.shootTimer = this.addChild(new Timer(0.3, false, this.shoot.bind(this)));
    }

    shoot() {
        game.addObject(new Star(
            this.globalPosition.x,
            this.globalPosition.y,
            (!globals.bigStarsTimer.paused && globals.bigStarsTimer.counter > 0)));
    }

    update(deltaTime) {
        super.update(deltaTime);

        // Move
        const spd = deltaTime * (80+(globals.score/5000.0));
        if (keys["ArrowUp"] || keys["w"]) {
            if (this.globalPosition.y > 0) {
                this.position.y -= spd;
            }
        }
        if (keys["ArrowDown"] || keys["s"]) {
            if (this.globalPosition.y < canvas.height) {
                this.position.y += spd;
            }
        }

        this.shootTimer.cooldown = (!globals.fastShootingTimer.paused && globals.fastShootingTimer.counter > 0)? 0.1 : 0.3;
    }

    draw(ctx) {
        super.draw(ctx);

        // Draw Player HP
        for (let i = 0; i < this.hpMax; i++) {
            if (i < this.hp) {
                ctx.drawImage(assets.getImage("PlayerLifesFront"), 8+32*i, 8, 32, 32);
            } else {
                ctx.drawImage(assets.getImage("PlayerLifesBack"), 8+32*i, 8, 32, 32);
            }
        }
    }
}
globals.player = new Player(100,canvas.height/2);
game.addObject(globals.player);

class Enemy extends Node2d {
    constructor(x, y) {
        super(x,y);
        this.name = "Enemy";

        this.addChild(new Collider2d(40, 40)).onCollision = (cld) => {
            let obj = cld.parent;
            if (obj.name === "Star") {
                // Enemy Star Collision
                obj.dead = true;

                this.hp -= obj.dmg;
                let numParticles = 0;
                let addScore = 0;
                if (this.hp <= 0) {
                    this.dead = true;
                    numParticles = 10;
                    addScore = 100;
                } else {
                    numParticles = 3;
                    addScore = 10;
                }
                game.emitParticles(
                    this.globalPosition.x,
                    this.globalPosition.y,
                    numParticles, "yellow");
                globals.score += addScore;
            }
        };


        const idx = (Math.floor(Math.random()*32)).toString().padStart(2, "0");
        this.addChild(new Sprite2d(assets.getImage(`Enemy_${idx}`), 40, 40));
        this.hp = (Math.floor(Math.random()*5) + 1) + (globals.score / 75000.0);
        this.maxHp = this.hp;

        this.velocity = this.position.directionTo(globals.player.position).scaled(75);
    }

    update(deltaTime) {
        super.update(deltaTime);

        this.position.x += deltaTime * this.velocity.x;
        this.position.y += deltaTime * this.velocity.y;

        if (this.globalPosition.x < 0) {
            this.dead = true;
        }
    }

    draw(ctx) {
        super.draw(ctx);
    }
}

game.run();