let idleTimer;
const IDLE_TIME_LIMIT = 10000; // 10 วินาที

function resetTimer() {
    clearTimeout(idleTimer);
    // ถ้านิ่งครบ 10 วินาที ให้เปลี่ยนไปหน้า idle.html (หรือ route ที่คุณตั้งไว้)
    idleTimer = setTimeout(() => {
        window.location.href = "/idle"; // สมมติว่าตั้ง route ใน app.py ไว้แบบนี้
    }, IDLE_TIME_LIMIT);
}
function wakeUp() {
    window.location.href = '/';
}

// ตรวจจับการขยับเมาส์หรือแตะหน้าจอ
window.onload = resetTimer;
document.onmousemove = resetTimer;
document.onkeypress = resetTimer;
document.ontouchstart = resetTimer;