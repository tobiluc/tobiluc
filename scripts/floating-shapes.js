
/* Access Canvas */
const canvas = document.getElementById("bg-canvas");
const ctx = canvas.getContext("2d");

/* Resize Canvas to window size */
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

function randomColor(alpha = 0.5) {
    const hue = Math.floor(Math.random() * 360);
    const saturation = Math.floor(Math.random() * 50) + 50;
    const lightness = Math.floor(Math.random() * 40) + 40;
    return `hsl(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
}

class Particle
{
    constructor() {
        this.reset();
    }

    reset() {
        this.pos = [Math.random() * canvas.width, Math.random() * canvas.height];
        this.speed = [Math.random()-0.5, Math.random()-0.5];
        this.rotation = 2*Math.PI*Math.random();
        this.rotation_speed = (Math.random()-0.5)/50.0;
        this.size = [5+10*Math.random(),5+10*Math.random()];
        this.color = randomColor();
        this.filled = (Math.random() < 0.5);
    }

    update() {
        this.pos[0] += this.speed[0];
        this.pos[1] += this.speed[1];
        this.rotation += this.rotation_speed;

        // Loop around
        if (this.pos[0]+this.size[0] < 0) {this.pos[0] = canvas.width+this.size[0];}
        if (this.pos[0]-this.size[0] > canvas.width) {this.pos[0] = -this.size[0];}
        if (this.pos[1]+this.size[1] < 0) {this.pos[1] = canvas.height+this.size[1];}
        if (this.pos[1]-this.size[1] > canvas.height) {this.pos[1] = -this.size[1];}
    }

    draw() {/*to override*/}

    isInside(px, py) {
        return px >= this.pos[0]-this.size[0]
                && px <= this.pos[0]+this.size[0]
                && py >= this.pos[1]-this.size[1]
                && py <= this.pos[1]+this.size[1];
    }
}

class Ball extends Particle
{
    constructor() {
        super();
    }

    draw() {
        ctx.beginPath();
        //ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--icon-color");
        ctx.arc(this.pos[0], this.pos[1], this.size[0], 0, 2*Math.PI);
        if (this.filled) {
            ctx.fillStyle = this.color;
            ctx.fill();
        } else {
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
}

class Triangle extends Particle
{
    constructor() {
        super();
    }

    draw() {
        ctx.save();
        ctx.translate(this.pos[0], this.pos[1]);
        ctx.rotate(this.rotation);
        ctx.beginPath();
        ctx.moveTo(0, -this.size[1]);
        ctx.lineTo(-this.size[0], this.size[1]);
        ctx.lineTo(this.size[0], this.size[1]);
        ctx.closePath();
        
        if (this.filled) {
            ctx.fillStyle = this.color;
            ctx.fill();
        } else {
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        ctx.restore();
    }
}

class Rectangle extends Particle
{
    constructor() {
        super();
    }

    draw() {
        ctx.save();
        ctx.translate(this.pos[0], this.pos[1]);
        ctx.rotate(this.rotation);
        ctx.beginPath();
        ctx.moveTo(-this.size[0], -this.size[1]);
        ctx.lineTo(this.size[0], -this.size[1]);
        ctx.lineTo(this.size[0], this.size[1]);
        ctx.lineTo(-this.size[0], this.size[1]);
        ctx.closePath();
        
        if (this.filled) {
            ctx.fillStyle = this.color;
            ctx.fill();
        } else {
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        ctx.restore();
    }
}

class TextParticle extends Particle {
    constructor(text) {
        super();
        this.text = text || "★";
        this.fontFamily = "Arial, sans-serif";
    }

    draw() {
        ctx.save();
        ctx.translate(this.pos[0], this.pos[1]);
        ctx.rotate(this.rotation);

        ctx.font = `${this.size[0]}px ${this.fontFamily}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        if (this.filled) {
            ctx.fillStyle = this.color;
            ctx.fillText(this.text, 0, 0);
        } else {
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.strokeText(this.text, 0, 0);
        }

        ctx.restore();
    }

    reset() {
        super.reset();
        this.size[0] *= 2.5;
    }
}


/* Create some Shapes */
particles = [];
for (let i = 0; i < 20; i++) {particles.push(new Ball());}
for (let i = 0; i < 20; i++) {particles.push(new Triangle());}
for (let i = 0; i < 20; i++) {particles.push(new Rectangle());}
for (const txt of ["*","@", "Hiii :D", "HexHex", "IGRec", "Sprinkles!", "c(^.^c)"]) {
    particles.push(new TextParticle(txt));
}

/* Click Interaction */
canvas.addEventListener("click", e => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    particles.forEach(particle => {
        if (particle.isInside(x, y)) {
            particle.color = randomColor();
            console.log("Click");
        }
    });
});

// Main Loop
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(particle => {
        particle.update();
        particle.draw();
    });
    requestAnimationFrame(animate);
}

animate();
