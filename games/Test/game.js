import { Game, GameObject, Timer, canvas, Vec2, keys, AssetDatabase, Collider, AABB } from "../ToMiGE.js";

let game = new Game("Test");

class Player extends GameObject {
    constructor(x, y) {
        super("Player");
        this.collider = new Collider(new AABB(x, y, 16, 16));
        this.timer = new Timer(1, false, () => console.log("1 second has passed"));
    }

    update(deltaTime) {
        if (keys["ArrowUp"] || keys["w"]) {this.position.y -= 1;}
        if (keys["ArrowDown"] || keys["s"]) {this.position.y += 1;}
        if (keys["ArrowRight"] || keys["d"]) {this.position.x += 1;}
        if (keys["ArrowLeft"] || keys["a"]) {this.position.x -= 1;}

        this.timer.update(deltaTime);
    }

    draw(ctx) {
        ctx.fillStyle = "blue";
        ctx.fillRect(this.position.x-8,this.position.y-8,16,16);
    }
}

game.addObject(new Player(canvas.width/2, canvas.height/2));

game.run(0);


// -> .../tobiluc
// python3 -m http.server
// -> http://[::]:8000/games/Test