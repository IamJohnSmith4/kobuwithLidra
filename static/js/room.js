function selectRoom(cardEl, roomId) {
    const allCards   = document.querySelectorAll('.room-card');
    const statusBar  = document.getElementById('status-bar');
    const statusText = document.getElementById('status-text');

    allCards.forEach(c => c.classList.add('dimmed'));
    cardEl.classList.remove('dimmed');
    cardEl.classList.add('selected');

    statusBar.style.borderColor = 'var(--gold)';
    statusBar.style.color       = 'var(--gold)';
    statusBar.querySelector('.status-dot').style.background = 'var(--gold)';
    statusBar.querySelector('.status-dot').style.boxShadow  = '0 0 8px var(--gold)';
    statusText.innerHTML = `กำลังเตรียมนำทางไปห้อง <strong>${roomId.toUpperCase()}</strong>...`;

    fetch('/api/move_to/' + roomId.toUpperCase())
        .then(res => {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json();
        })
        .then(data => {
            if (data.status === 'moving' || data.status === 'ok') {
                setTimeout(() => {
                    window.location.href = '/navigate/' + roomId;
                }, 800);
            } else {
                throw new Error(data.msg || 'Unknown error');
            }
        })
        .catch(err => {
            console.error('API Error:', err);
            allCards.forEach(c => c.classList.remove('dimmed', 'selected'));
            statusBar.style.borderColor = 'rgba(255,82,82,0.5)';
            statusBar.style.color       = '#ff8a80';
            statusText.innerHTML = '⚠ เชื่อมต่อไม่ได้ กรุณาลองใหม่อีกครั้ง';
            setTimeout(() => {
                statusBar.removeAttribute('style');
                statusText.innerHTML = 'กรุณาเลือกห้องที่ต้องการให้หุ่นยนต์นำทาง';
            }, 3000);
        });
}

// Keyboard support
document.querySelectorAll('.room-card').forEach(card => {
    card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            card.click();
        }
    });
});

function confirmResetHome() {
    Swal.fire({
        title: 'ยืนยันการ Reset System?',
        text: "หุ่นยนต์จะกลับไปเริ่มทำ Home Sequence (ตั้งค่าจุดเริ่มต้นใหม่)",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ff2e63',
        cancelButtonColor: '#d33',
        confirmButtonText: 'ยืนยัน',
        cancelButtonText: 'ยกเลิก',
        background: '#1a1a1a',
        color: '#ffffff',
    }).then((result) => {
        if (result.isConfirmed) {
            triggerResetHome();
        }
    });
}

function triggerResetHome() {
    Swal.fire({
        title: 'กำลังส่งคำสั่ง...',
        html: 'กรุณารอสักครู่',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
    });

    fetch('/api/reset-home', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(data => {
        Swal.close();
        if (data.status === 'success') {
            Swal.fire({
                title: 'เริ่มระบบ Reset Home แล้ว',
                text: data.message,
                icon: 'success',
                timer: 3000,
                showConfirmButton: false,
                background: '#1a1a1a',
                color: '#ffffff',
            }).then(() => { window.location.href = "/"; });
        } else {
            Swal.fire({ title: 'เกิดข้อผิดพลาด!', text: data.message, icon: 'error', background: '#1a1a1a', color: '#ffffff' });
        }
    })
    .catch(error => {
        Swal.close();
        console.error('Error:', error);
        Swal.fire({ title: 'ผิดพลาด!', text: 'ไม่สามารถติดต่อหุ่นยนต์ได้', icon: 'error', background: '#1a1a1a', color: '#ffffff' });
    });
}

// Prevent pinch zoom (Kiosk)
document.addEventListener('touchstart', e => {
    if (e.touches.length > 1) e.preventDefault();
}, { passive: false });

function toggleFS() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(()=>{});
    else document.exitFullscreen();
}
