// ── Particle Background ──────────────────────────────────────────
(function () {
    const c = document.getElementById('canvas');
    const ctx = c.getContext('2d');
    let W, H, pts = [];

    function resize() { W = c.width = innerWidth; H = c.height = innerHeight; }
    addEventListener('resize', resize); resize();

    class P {
        constructor() { this.reset(); }
        reset() {
            this.x = Math.random() * W; this.y = Math.random() * H;
            this.vx = (Math.random() - .5) * .3; this.vy = (Math.random() - .5) * .3;
            this.r = Math.random() * 1.2 + .4; this.a = Math.random() * .35 + .07;
        }
        step() {
            this.x += this.vx; this.y += this.vy;
            if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
        }
        draw() {
            ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0,229,255,${this.a})`; ctx.fill();
        }
    }

    for (let i = 0; i < 70; i++) pts.push(new P());

    function loop() {
        ctx.clearRect(0, 0, W, H);
        const MAX = 100;
        for (let i = 0; i < pts.length; i++) {
            for (let j = i + 1; j < pts.length; j++) {
                const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
                const d = Math.sqrt(dx*dx + dy*dy);
                if (d < MAX) {
                    ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y);
                    ctx.strokeStyle = `rgba(0,229,255,${.05 * (1 - d/MAX)})`; ctx.lineWidth = .5; ctx.stroke();
                }
            }
        }
        pts.forEach(p => { p.step(); p.draw(); });
        requestAnimationFrame(loop);
    }
    loop();
})();

// ── Idle Timer ───────────────────────────────────────────────────
const IDLE_MS = 30000;
let idleTimer;
const idleEl = document.getElementById('idle');

function showIdle() { idleEl.classList.add('active'); }
function hideIdle() { idleEl.classList.remove('active'); }
function resetTimer() {
    clearTimeout(idleTimer);
    if (!idleEl.classList.contains('active')) idleTimer = setTimeout(showIdle, IDLE_MS);
}
function wakeUp(e) { if (e) e.stopPropagation(); hideIdle(); resetTimer(); }

idleEl.addEventListener('click', wakeUp);
idleEl.addEventListener('keydown', e => { if (e.key==='Enter'||e.key===' ') wakeUp(e); });
['touchstart','mousedown','mousemove'].forEach(ev =>
    document.addEventListener(ev, resetTimer, { passive:true, capture:true })
);
resetTimer();

// ── Navigation & Fullscreen ──────────────────────────────────────
function goToRooms() {
    const btn = document.querySelector('.cta');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin" style="font-size:1rem"></i> กำลังโหลด...';
    setTimeout(() => { window.location.href = '/room'; }, 450);
}

function toggleFS() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(()=>{});
    else document.exitFullscreen();
}
