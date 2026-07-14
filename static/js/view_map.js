// ค่าคงที่จาก Flask — กำหนดใน template ก่อน include script นี้:
// const ROOM_ID

const NODE_POS = {
    1:  { x: 145, y: 580 },
    2:  { x: 145, y: 398 },
    3:  { x: 145, y: 281 },
    4:  { x: 145, y: 150 },
    5:  { x: 145, y: 50  },
    6:  { x: 335, y: 50  },
    7:  { x: 335, y: 150 },
    8:  { x: 335, y: 267 },
    9:  { x: 335, y: 360 },
    10: { x: 335, y: 454 },
    11: { x: 335, y: 545 }
};

const ROOM_TO_NODE = {
    "HOME":1,
    "1301":2, "1302":3, "1303A":4, "1303B":5,
    "1304A":6, "1304B":7, "1305":8, "1306":9,
    "1307":10, "1308":11
};

const TARGET_NODE = ROOM_TO_NODE[ROOM_ID.toUpperCase()] || 0;

// แสดง target marker
if (TARGET_NODE && NODE_POS[TARGET_NODE]) {
    const tm  = document.getElementById('target-marker');
    const pos = NODE_POS[TARGET_NODE];
    tm.setAttribute('transform', `translate(${pos.x},${pos.y})`);
    tm.setAttribute('opacity', '1');
    highlightTargetRoom();
}

function highlightTargetRoom() {
    const roomEl = document.getElementById('room-' + ROOM_ID.toUpperCase());
    if (roomEl) {
        roomEl.setAttribute('stroke-opacity', '1');
        roomEl.setAttribute('stroke-width', '2.5');
        roomEl.setAttribute('fill', '#0d1e35');
    }
}

function highlightRoom(id) {
    document.querySelectorAll('.room-fill').forEach(r => {
        r.setAttribute('stroke-opacity', '0.4');
        r.setAttribute('stroke-width', '1.5');
    });
    const el = document.getElementById('room-' + id);
    if (el) {
        el.setAttribute('stroke-opacity', '1');
        el.setAttribute('stroke-width', '2.5');
    }
}

// ── Move robot marker ─────────────────────────────────────────────
function moveRobot(fromNode, toNode, pct) {
    if (!NODE_POS[fromNode]) return;
    const marker = document.getElementById('robot-marker');
    let x, y;
    if (toNode !== undefined && pct !== undefined && NODE_POS[toNode]) {
        const t = Math.min(Math.max(pct / 100, 0), 1);
        x = NODE_POS[fromNode].x + (NODE_POS[toNode].x - NODE_POS[fromNode].x) * t;
        y = NODE_POS[fromNode].y + (NODE_POS[toNode].y - NODE_POS[fromNode].y) * t;
    } else {
        x = NODE_POS[fromNode].x;
        y = NODE_POS[fromNode].y;
    }
    marker.setAttribute('transform', `translate(${x},${y})`);
}

// ── Poll status ───────────────────────────────────────────────────
function updateMap() {
    fetch('/api/status')
        .then(r => { if (!r.ok) throw new Error(); return r.json(); })
        .then(data => {
            const node     = data.current_location ?? data.current_node ?? 1;
            const progress = data.current_progress ?? 0;
            const statusText = document.getElementById('status-text');

            if (data.is_navigating === true && TARGET_NODE && NODE_POS[TARGET_NODE]) {
                moveRobot(node, TARGET_NODE, progress);
                statusText.textContent = `หุ่นยนต์กำลังเดิน ${progress}% — มุ่งหน้าห้อง ${ROOM_ID}`;
                document.getElementById('live-dot').style.background = '#00FF88';
                document.getElementById('live-dot').style.boxShadow  = '0 0 6px #00FF88';
            } else if (data.is_navigating === false && String(node) === String(TARGET_NODE)) {
                moveRobot(node);
                statusText.textContent = '✓ หุ่นยนต์ถึงจุดหมายแล้ว';
                document.getElementById('live-dot').style.background = '#FFCC00';
                document.getElementById('live-dot').style.boxShadow  = '0 0 6px #FFCC00';
            } else {
                moveRobot(node);
                statusText.textContent = `หุ่นยนต์อยู่ที่ node ${node} — กำลังมุ่งหน้าไปห้อง ${ROOM_ID}`;
            }
        })
        .catch(() => {
            document.getElementById('status-text').textContent = 'ไม่พบการเชื่อมต่อกับหุ่นยนต์';
            document.getElementById('live-dot').style.background = '#FF5252';
            document.getElementById('live-dot').style.boxShadow  = '0 0 6px #FF5252';
        });
}

setInterval(updateMap, 2000);
updateMap();

// ── Cancel navigation ─────────────────────────────────────────────
function cancelNav() {
    Swal.fire({
        title: 'ยกเลิกการนำทาง?',
        text: 'หุ่นยนต์จะหยุดการเคลื่อนที่',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#FF5252',
        cancelButtonColor: '#00E5FF',
        confirmButtonText: 'ยืนยัน',
        cancelButtonText: 'กลับ',
        background: '#0D1526', color: '#ffffff',
        backdrop: 'rgba(0,0,0,0.8)',
    }).then(r => {
        if (r.isConfirmed) {
            fetch('/stop').catch(() => {}).finally(() => {
                window.location.href = '/room';
            });
        }
    });
}
