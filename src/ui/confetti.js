// Lightweight HTML5 Canvas Confetti implementation

let confettiParticles = [];
let confettiCtx = null;
let confettiCanvas = null;
let animationFrameId = null;

const colors = [
    '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
    '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4CAF50',
    '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800',
    '#FF5722'
];

class ConfettiParticle {
    constructor() {
        this.x = Math.random() * window.innerWidth;
        this.y = Math.random() * window.innerHeight - window.innerHeight;
        this.w = Math.random() * 8 + 5;
        this.h = Math.random() * 5 + 4;
        this.dx = Math.random() * 4 - 2;
        this.dy = Math.random() * 3 + 3;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.tilt = Math.floor(Math.random() * 33) - 11;
        this.tiltAngle = 0;
        this.tiltAngleInc = (Math.random() * 0.07) + 0.05;
    }

    update() {
        this.tiltAngle += this.tiltAngleInc;
        this.y += this.dy;
        this.x += this.dx;
        this.tilt = Math.sin(this.tiltAngle) * 15;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.lineWidth = this.w;
        ctx.strokeStyle = this.color;
        ctx.moveTo(this.x + this.tilt + this.w / 2, this.y);
        ctx.lineTo(this.x + this.tilt, this.y + this.tilt + this.h / 2);
        ctx.stroke();
    }
}

function initCanvas() {
    if (confettiCanvas) return;
    
    confettiCanvas = document.createElement('canvas');
    confettiCanvas.style.position = 'fixed';
    confettiCanvas.style.top = '0';
    confettiCanvas.style.left = '0';
    confettiCanvas.style.width = '100vw';
    confettiCanvas.style.height = '100vh';
    confettiCanvas.style.pointerEvents = 'none';
    confettiCanvas.style.zIndex = '9999';
    
    document.body.appendChild(confettiCanvas);
    confettiCtx = confettiCanvas.getContext('2d');
    
    window.addEventListener('resize', () => {
        if (confettiCanvas) {
            confettiCanvas.width = window.innerWidth;
            confettiCanvas.height = window.innerHeight;
        }
    });
    
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
}

function render() {
    if (!confettiCtx) return;
    
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    
    let activeParticles = 0;
    
    for (let i = 0; i < confettiParticles.length; i++) {
        const p = confettiParticles[i];
        p.update();
        p.draw(confettiCtx);
        if (p.y < confettiCanvas.height) {
            activeParticles++;
        }
    }
    
    if (activeParticles > 0) {
        animationFrameId = requestAnimationFrame(render);
    } else {
        cancelAnimationFrame(animationFrameId);
        if (confettiCanvas && confettiCanvas.parentNode) {
            confettiCanvas.parentNode.removeChild(confettiCanvas);
            confettiCanvas = null;
            confettiCtx = null;
        }
        confettiParticles = [];
    }
}

export function fireConfetti(count = 100) {
    initCanvas();
    
    for (let i = 0; i < count; i++) {
        confettiParticles.push(new ConfettiParticle());
    }
    
    if (!animationFrameId || confettiParticles.length === count) {
        render();
    }
}
