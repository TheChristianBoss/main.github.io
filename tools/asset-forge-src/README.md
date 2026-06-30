# Asset Forge Template Recipe Engine + Visual Polish Patch

This patch upgrades Goblin Asset Forge with a richer setup-template system and a cleaner visual style.

## Adds

- `src/data/templateRecipeEngine.js`
- Asset role detection from the currently loaded asset list
- Recommended setup templates based on actual asset filenames/paths
- Role chips such as Tiles, Terrain, Characters, UI, Items, Weapons, Backgrounds, etc.
- More setup templates: platformer scene, tileset sheet, top-down room, UI menu, HUD, inventory, shop, character showcase, enemy roster, effects sheet, space battle, farm scene, and more
- Manifest metadata for setup template family and detected asset role profile
- A cleaner dark/amber tool-suite visual style with less glow

## Test

1. Run `npm run build`.
2. Run `npm run dev`.
3. Attach `assetprimary.zip` inside the Asset Library panel.
4. Load a pack.
5. Confirm role chips appear.
6. Confirm setup template cards appear based on the loaded assets.
7. Click a template card.
8. Confirm text/colors/layout/export size update.
9. Click asset thumbnails to place them on the canvas.
10. Export PNG/PDF/ZIP.

Do not commit `assetprimary.zip`.
