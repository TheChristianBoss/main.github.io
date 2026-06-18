/* ============================================================
   tools-components.js — Christian Goblin Tools
   Loads the shared tools nav and marks the active link.
   ============================================================ */

async function loadToolsNav() {
    try {
        const res  = await fetch('/tools/components/tools-nav.html');
        if (!res.ok) throw new Error(`${res.status}`);
        const html = await res.text();
        const el   = document.getElementById('tools-navbar');
        if (el) el.innerHTML = html;
    } catch (err) {
        console.warn('Tools nav load failed:', err);
    }
}

function markActiveLink() {
    const path = window.location.pathname;
    document.querySelectorAll('.cg-nav__links a').forEach(a => {
        const href = a.getAttribute('href');
        // match exact tool paths so /tools/ doesn't highlight on every tool page
        if (path === href || path === href + 'index.html') {
            a.classList.add('active');
        }
    });
}

async function initToolsNav() {
    await loadToolsNav();
    markActiveLink();
}
 
document.addEventListener('DOMContentLoaded', initToolsNav);
