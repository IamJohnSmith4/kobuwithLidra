// ค่าคงที่จาก Flask — กำหนดใน template ก่อน include script นี้:
// const ROOM_ID, VIDEO_ID, DUB_TEXT, HAS_VIDEO

const ROOM_TO_NODE = {
    "1301":2, "1302":3, "1303A":4, "1303B":5,
    "1304A":6, "1304B":7, "1305":8, "1306":9,
    "1307":10, "1308":11
};
const TARGET_NODE = ROOM_TO_NODE[ROOM_ID.toUpperCase()] || 0;

// ── YouTube IFrame API ──────────────────────────────────────────
if (HAS_VIDEO) {
    const tag = document.createElement('script');
    tag.src   = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
} else {
    window.addEventListener('load', () => speak());
}

let player;
let hasSpoken = false;
let isVideoStarted = false;

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

// ── startNav ─────────────────────────────────────────────────────
function startNav() {
    const overlay = document.getElementById('overlay');
    if (overlay) overlay.classList.add('hidden');
    if (player && player.playVideo) player.playVideo();
    updateStatus('กำลังโหลดวิดีโอและเตรียมการ...', 'cyan');
}

// ── Text-to-Speech ────────────────────────────────────────────────
function speak() {
    updateStatus('กำลังเคลื่อนที่อย่างระมัดระวัง...', 'green');
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(DUB_TEXT);
    const voices    = window.speechSynthesis.getVoices();
    const thaiVoice = voices.find(v => v.lang.includes('th') && v.name.includes('Google'))
                   || voices.find(v => v.lang.includes('th'));
    if (thaiVoice) msg.voice = thaiVoice;
    msg.lang  = 'th-TH';
    msg.rate  = 0.85;
    msg.pitch = 1.05;
    window.speechSynthesis.speak(msg);
}

// ── updateStatus ─────────────────────────────────────────────────
function updateStatus(text, color) {
    const bar  = document.getElementById('status-bar');
    const txt  = document.getElementById('status-text');
    const dot  = bar.querySelector('.live-dot');
    const colorMap = {
        cyan:  { text: 'var(--cyan)',  dot: 'var(--cyan)',  border: 'rgba(0,229,255,0.3)' },
        green: { text: 'var(--green)', dot: 'var(--green)', border: 'rgba(0,255,136,0.3)' },
        gold:  { text: 'var(--gold)',  dot: 'var(--gold)',  border: 'rgba(255,204,0,0.3)'  },
        red:   { text: 'var(--red)',   dot: 'var(--red)',   border: 'rgba(255,82,82,0.3)'  },
    };
    const c = colorMap[color] || colorMap.cyan;
    txt.innerHTML        = text;
    bar.style.color      = c.text;
    bar.style.borderColor= c.border;
    dot.style.background = c.dot;
    dot.style.boxShadow  = `0 0 8px ${c.dot}`;
}

// ── Progress control ─────────────────────────────────────────────
let isRobotOnline = false;
let simPct        = 0;
let simInterval   = null;
let arrived       = false;

function setProgress(pct, label) {
    const rounded = Math.round(pct);
    document.getElementById('progress-fill').style.width = rounded + '%';
    document.getElementById('progress-pct').textContent  = (label || rounded) + '%';
}

function onArrived() {
    if (arrived) return;
    arrived = true;
    if (simInterval) clearInterval(simInterval);
    window.speechSynthesis.cancel();
    if (player && player.pauseVideo) player.pauseVideo();
    setProgress(100, '100');
    updateStatus('ถึงจุดหมายแล้ว! กำลังนำท่านไป...', 'gold');
    setTimeout(() => { window.location.href = `/arrived?room=${ROOM_ID}`; }, 1000);
}

// ── Real-time polling ─────────────────────────────────────────────
function checkArrival() {
    fetch('/api/status')
        .then(res => {
            if (!res.ok) throw new Error('Server error');
            return res.json();
        })
        .then(data => {
            if (data.robot_online === false) {
                if (!isRobotOnline && !simInterval && !arrived) startSimulation();
                return;
            }
            if (!isRobotOnline) {
                isRobotOnline = true;
                if (simInterval) { clearInterval(simInterval); simInterval = null; }
                updateStatus('กำลังเคลื่อนที่อย่างระมัดระวัง...', 'green');
            }
            const curNode = data.current_location ?? data.current_node ?? 0;
            if (data.is_navigating === true && data.current_progress !== undefined) {
                setProgress(data.current_progress);
            }
            if (data.current_progress >= 80 && !isVideoStarted && player && player.playVideo) {
                const overlay = document.getElementById('overlay');
                if (overlay) overlay.classList.add('hidden');
                player.unMute();
                player.playVideo();
                isVideoStarted = true;
            }
            if (data.is_navigating === false && String(curNode) === String(TARGET_NODE)) {
                onArrived();
            }
        })
        .catch(() => {
            if (!isRobotOnline && !simInterval && !arrived) startSimulation();
        });
}

// ── Simulation mode ───────────────────────────────────────────────
function startSimulation() {
    if (simInterval) return;
    updateStatus('กำลังเคลื่อนที่... (โหมดจำลอง)', 'cyan');
    const totalNodes   = TARGET_NODE || 6;
    const msPerPercent = (totalNodes * 1200) / 100;

    simInterval = setInterval(() => {
        if (arrived) { clearInterval(simInterval); return; }
        simPct += 1;
        setProgress(simPct);

        if (simPct >= 75 && !isVideoStarted && player && player.playVideo) {
            const overlay = document.getElementById('overlay');
            if (overlay) overlay.classList.add('hidden');
            player.unMute();
            player.playVideo();
            isVideoStarted = true;
        }

        if (simPct < 30) {
            updateStatus('กำลังออกจากจุดเริ่มต้น...', 'cyan');
        } else if (simPct < 70) {
            updateStatus('กำลังเคลื่อนที่ไปยังจุดหมาย...', 'green');
        } else if (simPct < 100) {
            updateStatus('ใกล้ถึงจุดหมายแล้ว...', 'gold');
        }

        if (simPct >= 100) {
            clearInterval(simInterval);
            simInterval = null;
            onArrived();
        }
    }, msPerPercent);
}

setTimeout(() => {
    checkArrival();
    setInterval(checkArrival, 3000);
}, 8000);

// ── Cancel navigation ─────────────────────────────────────────────
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
