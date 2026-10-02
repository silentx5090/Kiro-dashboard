// ĐÁNH CHẶN TỰ ĐỘNG: Chuyển hướng mọi API về Hosting Panel & Gắn Token
const originalFetch = window.fetch;
window.fetch = async function(...args) {
    let [resource, config] = args;
    if (typeof resource === 'string' && resource.startsWith('/api')) {
        resource = (typeof API_BASE !== 'undefined' ? API_BASE : '') + resource;
        config = config || {};
        config.headers = config.headers || {};
        const token = localStorage.getItem('kiro_auth_token');
        if (token) config.headers['Authorization'] = `Bearer ${token}`;
        return originalFetch(resource, config);
    }
    return originalFetch(...args);
};

// KIỂM SOÁT PHIÊN
async function checkAuthSession() {
    const token = localStorage.getItem('kiro_auth_token');
    if (!token) return window.location.href = 'login.html';
    try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (!data.authenticated) {
            localStorage.removeItem('kiro_auth_token');
            window.location.href = 'login.html';
        } else {
            const userTag = document.getElementById('currentUserTag');
            if (userTag) userTag.textContent = data.user.username;
        }
    } catch {}
}
if(!window.location.pathname.includes('login')) checkAuthSession();

async function logout() {
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch (e) {}
    localStorage.removeItem('kiro_auth_token');
    window.location.href = 'login.html';
}

// ĐỒNG HỒ & LOG
setInterval(() => {
    const el = document.getElementById('sys-clock');
    if (el) el.textContent = new Date().toLocaleTimeString();
}, 1000);

function log(msg) {
    const consoleEl = document.getElementById('consoleOutput');
    if (!consoleEl) return;
    const time = new Date().toLocaleTimeString();
    const line = document.createElement('div');
    line.className = 'log-item';
    line.textContent = `[${time}] ${msg}`;
    consoleEl.appendChild(line);
    consoleEl.scrollTop = consoleEl.scrollHeight;
}

// GIAO DIỆN & ĐIỀU HƯỚNG
function toggleMenu() {
    document.getElementById('sidebarDrawer').classList.toggle('active');
    document.getElementById('drawerBackdrop').classList.toggle('active');
}

function navigate(viewName) {
    document.querySelectorAll('.view-stage').forEach(stage => stage.classList.remove('active'));
    const target = document.getElementById(`view-${viewName}`);
    if (target) setTimeout(() => target.classList.add('active'), 50);

    document.querySelectorAll('.nav-link').forEach(link => {
        const isMatch = link.getAttribute('onclick')?.includes(viewName);
        link.classList.toggle('active', !!isMatch);
    });

    document.getElementById('sidebarDrawer')?.classList.remove('active');
    document.getElementById('drawerBackdrop')?.classList.remove('active');
    localStorage.setItem('kiro_current_tab', viewName);

    if (viewName === 'tool-voice' && typeof updateVoiceStatus === 'function') updateVoiceStatus();
    log(`NEXUS ROUTING: Chuyển hướng [${viewName.toUpperCase()}]`);
}

if(!window.location.pathname.includes('login')) {
    navigate(localStorage.getItem('kiro_current_tab') || 'overview');
}
