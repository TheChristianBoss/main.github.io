/* ============================================================
   tools-components.js — Christian Goblin Tools
   Loads the shared tools nav and marks the active link.
   ============================================================ */


function ensureBetaBadgeStyles() {
    if (document.getElementById('cg-open-beta-styles')) return;
    const style = document.createElement('style');
    style.id = 'cg-open-beta-styles';
    style.textContent = `
        .open-beta-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            vertical-align: middle;
            margin-left: .55rem;
            padding: .18rem .45rem;
            border: 1px solid rgba(201,168,76,.42);
            border-radius: 999px;
            background: rgba(201,168,76,.10);
            color: var(--gold-light, var(--accent, var(--gold-strong, #e0c16d)));
            font-family: var(--font-ui, Inter, Arial, sans-serif);
            font-size: .62rem;
            font-weight: 700;
            letter-spacing: .12em;
            line-height: 1.1;
            text-transform: uppercase;
            white-space: nowrap;
        }
        .cg-nav__links a {
            display: inline-flex;
            align-items: center;
            gap: .45rem;
        }
        .cg-nav__links a .open-beta-badge {
            margin-left: 0;
            font-size: .56rem;
            padding: .14rem .36rem;
            opacity: .88;
        }
        .tool-title-line {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: .55rem;
        }
        .tool-title-line .open-beta-badge,
        h1 .open-beta-badge,
        h2 .open-beta-badge {
            margin-left: 0;
        }
    `;
    document.head.appendChild(style);
}

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
    ensureBetaBadgeStyles();
    await loadToolsNav();
    markActiveLink();
}
 
document.addEventListener('DOMContentLoaded', initToolsNav);
