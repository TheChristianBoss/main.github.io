/* ============================================================
   components.js — Christian Goblin
   Loads shared HTML components (navbar, footer) into pages,
   then marks the active nav link based on the current path.
   ============================================================ */

async function loadComponent(path, targetId) {
    try {
        const res  = await fetch(path);
        if (!res.ok) throw new Error(`${res.status} loading ${path}`);
        const html = await res.text();
        const el   = document.getElementById(targetId);
        if (el) el.innerHTML = html;
    } catch (err) {
        console.warn('Component load failed:', err);
    }
}

function markActiveLink() {
    const path = window.location.pathname;
    document.querySelectorAll('.cg-nav__links a').forEach(a => {
        const href = a.getAttribute('href');
        if (href === '/' ? path === '/' : path.startsWith(href)) {
            a.classList.add('active');
        }
    });
}

async function initComponents() {
    await Promise.all([
        loadComponent('/components/navbar-main.html', 'navbar'),
        loadComponent('/components/footer.html',      'footer'),
    ]);
    markActiveLink();
}

document.addEventListener('DOMContentLoaded', initComponents);
