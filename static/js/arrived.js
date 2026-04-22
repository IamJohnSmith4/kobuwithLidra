// ── Particle Burst ────────────────────────────────────────────────
(function () {
    const canvas = document.getElementById('canvas');
    const ctx    = canvas.getContext('2d');
    let W, H;

    function resize() { W = canvas.width = innerWidth; H = canvas.height = innerHeight; }
    addEventListener('resize', resize); resize();

    const COLORS = ['#00FF88','#00E5FF','#FFCC00','#ffffff','#00FF88','#00FF88'];

    class Particle {
        constructor() {
            this.x  = W / 2; this.y = H / 2;
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 8 + 3;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.r  = Math.random() * 4 + 1;
            this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
            this.alpha = 1;
            this.gravity = 0.15;
            this.drag    = 0.97;
        }
        update() {
            this.vy   += this.gravity;
            this.vx   *= this.drag;
            this.vy   *= this.drag;
            this.x    += this.vx;
            this.y    += this.vy;
            this.alpha -= 0.018;
        }
        draw() {
            ctx.save();
            ctx.globalAlpha = Math.max(0, this.alpha);
            ctx.fillStyle   = this.color;
            ctx.shadowColor = this.color;
            ctx.shadowBlur  = 6;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    let particles = [];
    let burstDone = false;

    function burst(count) {
        for (let i = 0; i < count; i++) particles.push(new Particle());
    }

    burst(120);
    setTimeout(() => burst(80),  400);
    setTimeout(() => burst(60),  800);
    setTimeout(() => { burstDone = true; }, 1200);

    function loop() {
        ctx.clearRect(0, 0, W, H);
        particles = particles.filter(p => p.alpha > 0);
        particles.forEach(p => { p.update(); p.draw(); });
        if (particles.length > 0 || !burstDone) requestAnimationFrame(loop);
    }
    loop();
})();

// ── Auto countdown ────────────────────────────────────────────────
let countVal = 30;
const countEl = document.getElementById('count');

const countTimer = setInterval(() => {
    countVal--;
    countEl.textContent = countVal;
    if (countVal <= 0) {
        clearInterval(countTimer);
        window.location.href = '/';
    }
}, 1000);

// ── Return to base ────────────────────────────────────────────────
function returnToBase() {
    clearInterval(countTimer);
    countEl.parentElement.textContent = '';

    Swal.fire({
        title: 'ส่งหุ่นกลับจุดเริ่มต้น?',
        text: 'หุ่นยนต์จะเดินทางกลับไปยัง Home (node 1)',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#00E5FF',
        cancelButtonColor:  '#555',
        confirmButtonText: '<i class="fas fa-rotate-left"></i> ยืนยัน',
        cancelButtonText:  'ยกเลิก',
        background: '#0D1526', color: '#ffffff',
        backdrop: 'rgba(0,0,0,0.8)',
    }).then(result => {
        if (result.isConfirmed) {
            fetch('/api/move_to/Home')
                .catch(() => {})
                .finally(() => { window.location.href = '/'; });
        } else {
            countVal = 30;
            countEl.parentElement.innerHTML =
                `กลับหน้าหลักอัตโนมัติใน <span id="count">30</span> วินาที`;
            const newCountEl = document.getElementById('count');
            const newTimer = setInterval(() => {
                countVal--;
                newCountEl.textContent = countVal;
                if (countVal <= 0) {
                    clearInterval(newTimer);
                    window.location.href = '/';
                }
            }, 1000);
        }
    });
}
