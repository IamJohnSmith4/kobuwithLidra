const ROOM_TO_NODE = {
    "1301":2, "1302":3, "1303A":4, "1303B":5,
    "1304A":6, "1304B":7, "1305":8, "1306":9,
    "1307":10, "1308":11
};
const TARGET_NODE = ROOM_TO_NODE[ROOM_ID.toUpperCase()] || 0;

// YouTube setup
if (HAS_VIDEO) {
    const tag = document.createElement('script');
    tag.src   = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
} else {
    window.addEventListener('load', () => speak());
}

let player;
let hasSpoken      = false;
let isVideoStarted = false;
let arrived        = false;
let pollInterval   = null;

function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '100%', width: '100%',
        videoId: VIDEO_ID,
        playerVars: {
            autoplay: 0, controls: 0, mute: 1,
            loop: 1, playlist: VIDEO_ID,
            modestbranding: 1, rel: 0
        },
        events: { onStateChange: onPlayerStateChange }
    });
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING && !hasSpoken) {
        player.unMute();
        player.setVolume(40);
        speak();
        hasSpoken = true;
    }
}

function startNav() {
    const overlay = document.getElementById('overlay');
    if (overlay) overlay.classList.add('hidden');
    if (player && player.playVideo) player.playVideo();
    updateStatus('กำลังโหลดวิดีโอและเตรียมการ...', 'cyan');
}

function speak() {
    updateStatus('กำลังเคลื่อนที่อย่างระมัดระวัง...', 'green');
    window.speechSynthesis.cancel();
    const msg       = new SpeechSynthesisUtterance(DUB_TEXT);
    const voices    = window.speechSynthesis.getVoices();
    const thaiVoice = voices.find(v => v.lang.includes('th') && v.name.includes('Google'))
                   || voices.find(v => v.lang.includes('th'));
    if (thaiVoice) msg.voice = thaiVoice;
    msg.lang  = 'th-TH';
    msg.rate  = 0.85;
    msg.pitch = 1.05;
    window.speechSynthesis.speak(msg);
}

function updateStatus(text, color) {
    const bar = document.getElementById('status-bar');
    const txt = document.getElementById('status-text');
    const dot = bar.querySelector('.live-dot');
    const colorMap = {
        cyan:  { text: 'var(--cyan)',  dot: 'var(--cyan)',  border: 'rgba(0,229,255,0.3)'  },
        green: { text: 'var(--green)', dot: 'var(--green)', border: 'rgba(0,255,136,0.3)'  },
        gold:  { text: 'var(--gold)',  dot: 'var(--gold)',  border: 'rgba(255,204,0,0.3)'   },
        red:   { text: '#ff8a80',      dot: '#ff5252',      border: 'rgba(255,82,82,0.3)'   },
    };
    const c = colorMap[color] || colorMap.cyan;
    txt.innerHTML         = text;
    bar.style.color       = c.text;
    bar.style.borderColor = c.border;
    dot.style.background  = c.dot;
    dot.style.boxShadow   = `0 0 8px ${c.dot}`;
}

// ── Progress ──────────────────────────────────────────────────────
function setProgress(pct) {
    const rounded = Math.min(100, Math.max(0, Math.round(pct)));
    const fill    = document.getElementById('progress-fill');
    const text    = document.getElementById('progress-pct');
    if (fill) fill.style.width   = rounded + '%';
    if (text) text.textContent   = rounded + '%';
}

// ── Arrived ───────────────────────────────────────────────────────
function onArrived() {
    if (arrived) return;
    arrived = true;

    if (pollInterval) clearInterval(pollInterval);
    window.speechSynthesis.cancel();
    if (player && player.pauseVideo) player.pauseVideo();

    setProgress(100);
    updateStatus('ถึงจุดหมายแล้ว! กำลังนำท่านไป...', 'gold');

    setTimeout(() => {
        window.location.href = `/arrived?room=${ROOM_ID}`;
    }, 1500);
}

// ── Failed ────────────────────────────────────────────────────────
function onFailed() {
    if (arrived) return;

    if (pollInterval) clearInterval(pollInterval);
    window.speechSynthesis.cancel();

    updateStatus('หุ่นยนต์ไม่สามารถถึงจุดหมายได้ ❌', 'red');

    Swal.fire({
        title: 'ไม่สามารถถึงจุดหมาย',
        text: 'หุ่นยนต์หยุดกลางทาง กรุณาลองใหม่อีกครั้ง',
        icon: 'error',
        confirmButtonText: 'กลับเลือกห้อง',
        background: '#0D1526',
        color: '#fff'
    }).then(() => {
        window.location.href = '/room';
    });
}

// ── Poll Status ───────────────────────────────────────────────────
function checkArrival() {
    if (arrived) return;

    fetch('/api/status')
        .then(res => {
            if (!res.ok) throw new Error('Server error');
            return res.json();
        })
        .then(data => {

            // ── Update progress bar immediately ──
            if (data.current_progress !== undefined) {
                setProgress(data.current_progress);
            }

            // ── Update status text ──
            if (data.is_navigating) {
                const pct = Math.round(data.current_progress || 0);
                if (pct < 30) {
                    updateStatus('กำลังออกจากจุดเริ่มต้น...', 'cyan');
                } else if (pct < 70) {
                    updateStatus('กำลังเคลื่อนที่ไปยังจุดหมาย...', 'green');
                } else {
                    updateStatus('ใกล้ถึงจุดหมายแล้ว...', 'gold');
                }
            }

            // ── Play video at 80% ──
            if ((data.current_progress >= 80) && !isVideoStarted) {
                const overlay = document.getElementById('overlay');
                if (overlay) overlay.classList.add('hidden');
                if (player && player.playVideo) {
                    player.unMute();
                    player.playVideo();
                }
                isVideoStarted = true;
            }

            // ── Check navigation failed ──
            if (data.navigation_failed === true) {
                onFailed();
                return;
            }

            // ── Check arrived ──
            const curNode = data.current_location ?? 1;
            if (data.is_navigating === false
                && !data.navigation_failed
                && String(curNode) === String(TARGET_NODE)) {
                onArrived();
            }

        })
        .catch(err => {
            console.error('Poll error:', err);
            updateStatus('⚠ ไม่พบการเชื่อมต่อ...', 'red');
        });
}

// ── Start polling immediately ─────────────────────────────────────
// Poll every 1.5 seconds starting RIGHT AWAY (no 8 second delay!)
updateStatus('กำลังเริ่มการนำทาง...', 'cyan');
checkArrival();  // ← first check immediately
pollInterval = setInterval(checkArrival, 1500);  // ← then every 1.5s

// ── Cancel ───────────────────────────────────────────────────────
function confirmCancel() {
    window.speechSynthesis.cancel();
    if (player && player.pauseVideo) player.pauseVideo();

    Swal.fire({
        title: 'ยกเลิกการนำทาง?',
        text: 'หุ่นยนต์จะหยุดการเคลื่อนที่ทันที',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#FF5252',
        cancelButtonColor:  '#00E5FF',
        confirmButtonText: '<i class="fas fa-xmark"></i> ยืนยัน ยกเลิก',
        cancelButtonText:  '<i class="fas fa-play"></i> นำทางต่อ',
        background: '#0D1526',
        color: '#ffffff',
        backdrop: 'rgba(0,0,0,0.8)',
    }).then(result => {
        if (result.isConfirmed) {
            fetch('/stop')
                .catch(() => {})
                .finally(() => { window.location.href = '/room'; });
        } else {
            if (player && player.playVideo) player.playVideo();
        }
    });
}

window.speechSynthesis.onvoiceschanged = () => {};