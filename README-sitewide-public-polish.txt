Christian Goblin Sitewide Public-Readiness Patch

Purpose:
- Remove the Store card from /tools/ so the tools hub only contains free tools.
- Keep Store as its own top-level navigation/footer destination.
- Add Bible to shared navigation and footer.
- Improve mobile navigation with a working menu button.
- Replace the old “site rebuild” 404 page with a public-ready page-not-found screen.
- Add root Privacy and Terms pages.
- Add accessibility polish: skip link, focus-visible styling, clearer tool categories.
- Update homepage and tools page wording to avoid overpromising.

Files included:
- index.html
- 404.html
- privacy.html
- terms.html
- tools/index.html
- components/navbar-main.html
- components/footer.html
- assets/js/components.js
- assets/css/main.css

Notes:
- This patch intentionally does not modify the store app itself.
- The Store remains in the main nav/footer and homepage, but not in the Tools page card grid.
- Privacy/Terms pages are plain-language placeholders and should be reviewed before a public launch.
