/* ============================================================
   components.js — Christian Goblin
   Loads shared HTML components, marks active nav links, and
   enables the mobile navigation toggle.
   ============================================================ */

async function loadComponent(path, targetId) {
    try {
        const res  = await fetch(path, { cache: 'no-cache' });
        if (!res.ok) throw new Error(`${res.status} loading ${path}`);
        const html = await res.text();
        const el   = document.getElementById(targetId);
        if (el) el.innerHTML = html;
    } catch (err) {
        console.warn('Component load failed:', err);
    }
}

function normalizePath(path) {
    if (!path || path === '/') return '/';
    return path.endsWith('/') ? path : `${path}/`;
}

function markActiveLink() {
    const path = normalizePath(window.location.pathname);
    document.querySelectorAll('.cg-nav__links a').forEach((a) => {
        const href = normalizePath(a.getAttribute('href'));
        const isActive = href === '/' ? path === '/' : path.startsWith(href);
        a.classList.toggle('active', isActive);
        if (isActive) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
    });
}

function initMobileNav() {
    const toggle = document.querySelector('.cg-nav__toggle');
    const links = document.querySelector('.cg-nav__links');
    if (!toggle || !links) return;

    function closeNav() {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Open navigation menu');
    }

    toggle.addEventListener('click', () => {
        const open = links.classList.toggle('open');
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    });

    links.addEventListener('click', (event) => {
        if (event.target.closest('a')) closeNav();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeNav();
    });
}

async function initComponents() {
    await Promise.all([
        loadComponent('/components/navbar-main.html', 'navbar'),
        loadComponent('/components/footer.html',      'footer'),
    ]);
    markActiveLink();
    initMobileNav();
}

document.addEventListener('DOMContentLoaded', initComponents);
