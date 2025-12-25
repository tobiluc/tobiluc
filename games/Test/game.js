import { Game, Timer, canvas, Vec2, keys, AssetDatabase, Node2d, Collider2d } from "../ToMiGE.js";

let game = new Game("Test");

class Player extends Node2d {
    constructor(x, y) {
        super(x, y);
        this.name = "Player";
        this.spd = 80;
        let cld = new Collider2d(16, 16);
        cld.onCollision = (wall) => console.log(wall);
        this.addChild(cld);
        this.addChild(new Timer(1, false, () => console.log("1 second has passed")));
    }

    update(deltaTime) {
        super.update(deltaTime);

        // Move
        let dir = new Vec2(0,0);
        if (keys["ArrowUp"] || keys["w"]) {dir.y -= 1;}
        if (keys["ArrowDown"] || keys["s"]) {dir.y += 1;}
        if (keys["ArrowRight"] || keys["d"]) {dir.x += 1;}
        if (keys["ArrowLeft"] || keys["a"]) {dir.x -= 1;}
        let n = dir.norm;
        if (n > 0) {
            this.position.x += deltaTime * this.spd * dir.x / n;
            this.position.y += deltaTime * this.spd * dir.y / n
        }
    }

    draw(ctx) {
        super.draw(ctx);

        ctx.fillStyle = "red";
        ctx.fillRect(this.position.x-8,this.position.y-8,16,16);
    }
}

class Wall extends Collider2d {
    constructor(x, y) {
        super(32, 32);
        this.position.x = x;
        this.position.y = y;
    }

    update(deltaTime) {
        super.update(deltaTime);
    }

    draw(ctx) {
        super.draw(ctx);

        ctx.fillStyle = "black";
        ctx.fillRect(this.position.x-16,this.position.y-16,32,32);
    }
}

game.addObject(new Player(canvas.width/2, canvas.height/2));
game.addObject(new Wall(100,100));

game.run(0);


// -> .../tobiluc
// python3 -m http.server
// -> http://[::]:8000/games/Test