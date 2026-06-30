export const assetRoleRules = [
  {
    role: "background",
    label: "Backgrounds",
    keywords: ["background", "backdrop", "bg", "parallax", "sky", "cloud", "clouds", "mountain", "mountains", "forest", "desert", "space", "water", "cave", "landscape", "scene", "environment"]
  },
  {
    role: "terrain",
    label: "Terrain",
    keywords: ["terrain", "ground", "grass", "dirt", "sand", "snow", "ice", "stone", "rock", "rocks", "water", "lava", "mud", "platform", "slope", "bridge"]
  },
  {
    role: "tile",
    label: "Tiles",
    keywords: ["tile", "tiles", "tileset", "block", "blocks", "corner", "edge", "wall", "floor", "path", "road", "platform"]
  },
  {
    role: "character",
    label: "Characters",
    keywords: ["character", "player", "hero", "person", "human", "npc", "adventurer", "knight", "wizard", "pirate", "robot", "alien"]
  },
  {
    role: "enemy",
    label: "Enemies",
    keywords: ["enemy", "monster", "zombie", "skeleton", "slime", "spider", "bat", "boss", "creature", "dragon", "ghost", "alien"]
  },
  {
    role: "animal",
    label: "Animals",
    keywords: ["animal", "cow", "pig", "sheep", "chicken", "horse", "dog", "cat", "fish", "bird", "frog", "duck", "bear", "deer", "rabbit"]
  },
  {
    role: "item",
    label: "Items",
    keywords: ["item", "items", "pickup", "pick-up", "collectible", "resource", "crate", "box", "barrel", "chest", "key", "door", "ladder"]
  },
  {
    role: "weapon",
    label: "Weapons",
    keywords: ["weapon", "sword", "axe", "bow", "arrow", "gun", "laser", "missile", "bullet", "projectile", "shield", "staff", "wand", "spear"]
  },
  {
    role: "currency",
    label: "Currency",
    keywords: ["coin", "coins", "gem", "gems", "diamond", "gold", "silver", "money", "currency", "token", "star", "medal"]
  },
  {
    role: "ui",
    label: "UI",
    keywords: ["ui", "interface", "button", "buttons", "panel", "window", "frame", "cursor", "pointer", "hud", "menu", "slider", "checkbox", "dialog", "dialogue"]
  },
  {
    role: "icon",
    label: "Icons",
    keywords: ["icon", "icons", "symbol", "badge", "emblem", "sign", "marker", "indicator", "crosshair"]
  },
  {
    role: "vehicle",
    label: "Vehicles",
    keywords: ["vehicle", "car", "truck", "ship", "spaceship", "plane", "aircraft", "boat", "train", "tank", "rocket", "craft"]
  },
  {
    role: "space",
    label: "Space",
    keywords: ["space", "planet", "planets", "asteroid", "asteroids", "ship", "spaceship", "laser", "alien", "meteor", "starfield", "galaxy"]
  },
  {
    role: "card",
    label: "Cards",
    keywords: ["card", "cards", "deck", "playing", "board", "token", "dice", "die", "meeple", "tabletop"]
  },
  {
    role: "effect",
    label: "Effects",
    keywords: ["effect", "effects", "particle", "particles", "explosion", "fire", "smoke", "spark", "sparkle", "magic", "spell", "slash", "impact"]
  },
  {
    role: "food",
    label: "Food",
    keywords: ["food", "fruit", "apple", "banana", "bread", "meat", "fish", "vegetable", "crop", "farm", "farming"]
  },
  {
    role: "building",
    label: "Buildings",
    keywords: ["building", "house", "hut", "castle", "tower", "wall", "fence", "bridge", "door", "window", "roof", "village"]
  }
];

export const setupTemplateRecipes = [
  {
    id: "asset-contact-sheet",
    name: "Asset Contact Sheet",
    family: "general",
    description: "A clean pack overview that works for almost any asset list.",
    baseTemplateId: "square-post",
    sizePresetId: "square-1080",
    requiredRoles: [],
    recommendedRoles: ["item", "icon", "tile", "character", "ui"],
    slots: ["pack title", "asset samples", "role summary", "source pack"],
    defaults: {
      title: "{pack}\nAsset Sheet",
      subtitle: "Searchable preview organized by detected asset roles.",
      footer: "Goblin Asset Forge - Pack Overview",
      backgroundColor: "#111827",
      accentColor: "#facc15",
      titleColor: "#ffffff",
      subtitleColor: "#fde68a"
    }
  },
  {
    id: "game-thumbnail",
    name: "Game Thumbnail",
    family: "promo",
    description: "A wide promotional thumbnail for a prototype, pack preview, or game scene.",
    baseTemplateId: "youtube-thumbnail",
    sizePresetId: "thumbnail-1280",
    requiredRoles: [],
    recommendedRoles: ["background", "character", "enemy", "item", "vehicle"],
    slots: ["background", "hero asset", "title", "subtitle"],
    defaults: {
      title: "{pack}",
      subtitle: "New asset pack preview",
      footer: "GAME ASSET PREVIEW",
      backgroundColor: "#18181b",
      accentColor: "#ef4444",
      titleColor: "#ffffff",
      subtitleColor: "#fde68a"
    }
  },
  {
    id: "platformer-level-mockup",
    name: "Platformer Level Mockup",
    family: "platformer",
    description: "Side-scroller scene setup for terrain, tiles, props, characters, enemies, and pickups.",
    baseTemplateId: "youtube-thumbnail",
    sizePresetId: "thumbnail-1280",
    requiredRoles: ["terrain", "tile"],
    recommendedRoles: ["background", "character", "enemy", "item", "currency"],
    slots: ["background", "ground tiles", "props", "player", "enemy", "collectibles"],
    defaults: {
      title: "Level Mockup",
      subtitle: "Build a quick scene with tiles, props, and characters.",
      footer: "PLATFORMER SCENE",
      backgroundColor: "#0f172a",
      accentColor: "#22c55e",
      titleColor: "#ffffff",
      subtitleColor: "#bbf7d0"
    }
  },
  {
    id: "tileset-preview-sheet",
    name: "Tileset Preview Sheet",
    family: "tiles",
    description: "Organized display for terrain blocks, edges, corners, hazards, and decorations.",
    baseTemplateId: "square-post",
    sizePresetId: "square-1080",
    requiredRoles: ["tile"],
    recommendedRoles: ["terrain", "building", "effect"],
    slots: ["terrain tiles", "corner tiles", "hazards", "decorations", "labels"],
    defaults: {
      title: "Tileset Preview",
      subtitle: "Ground, platforms, edges, hazards, and decorations.",
      footer: "TILESET / ENVIRONMENT",
      backgroundColor: "#052e16",
      accentColor: "#86efac",
      titleColor: "#f0fdf4",
      subtitleColor: "#bbf7d0"
    }
  },
  {
    id: "top-down-room-mockup",
    name: "Top-Down Room Mockup",
    family: "rpg",
    description: "A room or dungeon board setup for tiles, walls, props, doors, and characters.",
    baseTemplateId: "square-post",
    sizePresetId: "square-1080",
    requiredRoles: ["tile"],
    recommendedRoles: ["building", "item", "character", "enemy"],
    slots: ["floor", "walls", "door", "props", "character", "enemy"],
    defaults: {
      title: "Room Mockup",
      subtitle: "Arrange tiles, props, doors, enemies, and pickups.",
      footer: "TOP-DOWN / RPG SCENE",
      backgroundColor: "#1f2937",
      accentColor: "#a78bfa",
      titleColor: "#ffffff",
      subtitleColor: "#ddd6fe"
    }
  },
  {
    id: "ui-menu-mockup",
    name: "Main Menu Mockup",
    family: "ui",
    description: "Menu screen concept for panels, buttons, cursors, sliders, and icons.",
    baseTemplateId: "square-post",
    sizePresetId: "square-1080",
    requiredRoles: ["ui"],
    recommendedRoles: ["icon", "background"],
    slots: ["title panel", "buttons", "icons", "cursor", "background frame"],
    defaults: {
      title: "Main Menu",
      subtitle: "Play - Options - Credits",
      footer: "UI MOCKUP",
      backgroundColor: "#020617",
      accentColor: "#38bdf8",
      titleColor: "#f8fafc",
      subtitleColor: "#bae6fd"
    }
  },
  {
    id: "hud-overlay-mockup",
    name: "HUD Overlay Mockup",
    family: "ui",
    description: "Gameplay overlay setup for health bars, score icons, abilities, and status panels.",
    baseTemplateId: "youtube-thumbnail",
    sizePresetId: "thumbnail-1280",
    requiredRoles: ["ui"],
    recommendedRoles: ["icon", "currency", "weapon", "space"],
    slots: ["health", "score", "ability icons", "minimap", "status panel"],
    defaults: {
      title: "HUD Overlay",
      subtitle: "Health, score, icons, buttons, and status UI.",
      footer: "GAME UI CONCEPT",
      backgroundColor: "#111827",
      accentColor: "#60a5fa",
      titleColor: "#ffffff",
      subtitleColor: "#bfdbfe"
    }
  },
  {
    id: "button-icon-sheet",
    name: "Button / Icon Sheet",
    family: "ui",
    description: "A practical sheet for buttons, icons, cursors, panels, and interaction states.",
    baseTemplateId: "flyer",
    sizePresetId: "flyer-letter",
    requiredRoles: ["ui"],
    recommendedRoles: ["icon"],
    slots: ["button states", "icons", "cursors", "labels"],
    defaults: {
      title: "UI Components",
      subtitle: "Buttons - icons - panels - cursors - states",
      footer: "INTERFACE SHEET",
      backgroundColor: "#0f172a",
      accentColor: "#facc15",
      titleColor: "#ffffff",
      subtitleColor: "#fde68a"
    }
  },
  {
    id: "inventory-grid",
    name: "Inventory Grid",
    family: "items",
    description: "Grid setup for items, weapons, potions, gems, resources, and equipment.",
    baseTemplateId: "flyer",
    sizePresetId: "flyer-letter",
    requiredRoles: ["item"],
    recommendedRoles: ["weapon", "currency", "food", "icon", "ui"],
    slots: ["item icons", "rarity labels", "currency", "item title", "description"],
    defaults: {
      title: "Inventory Preview",
      subtitle: "Weapons - armor - potions - resources - valuables",
      footer: "ITEM GRID / SHOP MOCKUP",
      backgroundColor: "#1e1b4b",
      accentColor: "#a78bfa",
      titleColor: "#ffffff",
      subtitleColor: "#ddd6fe"
    }
  },
  {
    id: "shop-screen",
    name: "Shop Screen Setup",
    family: "items",
    description: "A store layout for buy/sell buttons, item icons, currency, and descriptions.",
    baseTemplateId: "square-post",
    sizePresetId: "square-1080",
    requiredRoles: ["item"],
    recommendedRoles: ["currency", "ui", "icon", "weapon", "food"],
    slots: ["shop panel", "item grid", "currency", "selected item", "buy button"],
    defaults: {
      title: "Item Shop",
      subtitle: "Loot, resources, upgrades, and prices.",
      footer: "SHOP / INVENTORY MOCKUP",
      backgroundColor: "#2e1065",
      accentColor: "#eab308",
      titleColor: "#ffffff",
      subtitleColor: "#fef3c7"
    }
  },
  {
    id: "character-showcase",
    name: "Character Showcase",
    family: "characters",
    description: "Poster layout for sprites, creatures, NPCs, player characters, or portraits.",
    baseTemplateId: "quote-card",
    sizePresetId: "poster-1080",
    requiredRoles: ["character"],
    recommendedRoles: ["enemy", "animal", "weapon", "item"],
    slots: ["main character", "alternate poses", "name", "class/type", "notes"],
    defaults: {
      title: "Character Showcase",
      subtitle: "Player, enemy, NPC, or creature lineup",
      footer: "CHARACTER / CREATURE PREVIEW",
      backgroundColor: "#312e81",
      accentColor: "#f472b6",
      titleColor: "#ffffff",
      subtitleColor: "#fbcfe8"
    }
  },
  {
    id: "enemy-roster",
    name: "Enemy Roster",
    family: "characters",
    description: "Display a lineup of monsters, enemies, creatures, or hazards.",
    baseTemplateId: "flyer",
    sizePresetId: "flyer-letter",
    requiredRoles: ["enemy"],
    recommendedRoles: ["character", "weapon", "effect", "item"],
    slots: ["enemy lineup", "names", "danger labels", "weaknesses"],
    defaults: {
      title: "Enemy Roster",
      subtitle: "Creatures, hazards, monsters, and bosses.",
      footer: "ENEMY / CREATURE SHEET",
      backgroundColor: "#450a0a",
      accentColor: "#f87171",
      titleColor: "#ffffff",
      subtitleColor: "#fecaca"
    }
  },
  {
    id: "animation-strip",
    name: "Animation Strip",
    family: "characters",
    description: "A sequence-style layout for poses, frames, actions, and sprite states.",
    baseTemplateId: "youtube-thumbnail",
    sizePresetId: "thumbnail-1280",
    requiredRoles: ["character"],
    recommendedRoles: ["enemy", "animal"],
    slots: ["idle", "walk", "jump", "attack", "hurt"],
    defaults: {
      title: "Animation Strip",
      subtitle: "Idle - move - jump - attack - hurt frames",
      footer: "SPRITE FRAME PREVIEW",
      backgroundColor: "#111827",
      accentColor: "#34d399",
      titleColor: "#ffffff",
      subtitleColor: "#bbf7d0"
    }
  },
  {
    id: "item-card",
    name: "Item Card",
    family: "items",
    description: "Focused card layout for a weapon, resource, tool, pickup, or special object.",
    baseTemplateId: "logo-badge",
    sizePresetId: "icon-1024",
    requiredRoles: ["item"],
    recommendedRoles: ["weapon", "currency", "food", "icon"],
    slots: ["main item", "name", "rarity", "category", "badge frame"],
    defaults: {
      title: "ITEM",
      subtitle: "Card / token / item preview",
      footer: "SHOWCASE",
      backgroundColor: "#0c0a09",
      accentColor: "#f59e0b",
      titleColor: "#ffffff",
      subtitleColor: "#fed7aa"
    }
  },
  {
    id: "background-scene-poster",
    name: "Background Scene Poster",
    family: "backgrounds",
    description: "Poster layout for backgrounds, environments, parallax layers, or mood scenes.",
    baseTemplateId: "youtube-thumbnail",
    sizePresetId: "thumbnail-1280",
    requiredRoles: ["background"],
    recommendedRoles: ["terrain", "building", "effect"],
    slots: ["background layer", "foreground props", "title", "mood label"],
    defaults: {
      title: "Scene Preview",
      subtitle: "Background, environment, and parallax layout.",
      footer: "BACKGROUND / SCENE",
      backgroundColor: "#082f49",
      accentColor: "#0ea5e9",
      titleColor: "#ffffff",
      subtitleColor: "#bae6fd"
    }
  },
  {
    id: "board-card-template",
    name: "Board/Card Template",
    family: "board",
    description: "A card-style setup for tabletop cards, tokens, icons, dice, and board-game resources.",
    baseTemplateId: "quote-card",
    sizePresetId: "poster-1080",
    requiredRoles: ["card"],
    recommendedRoles: ["icon", "item", "currency"],
    slots: ["card frame", "main icon", "title", "cost", "rules text"],
    defaults: {
      title: "Card Title",
      subtitle: "Token, rule, cost, or ability text.",
      footer: "BOARD / CARD MOCKUP",
      backgroundColor: "#1c1917",
      accentColor: "#fbbf24",
      titleColor: "#ffffff",
      subtitleColor: "#fed7aa"
    }
  },
  {
    id: "space-battle-mockup",
    name: "Space Battle Mockup",
    family: "space",
    description: "Wide sci-fi scene for ships, lasers, asteroids, planets, effects, and HUD parts.",
    baseTemplateId: "youtube-thumbnail",
    sizePresetId: "thumbnail-1280",
    requiredRoles: ["space"],
    recommendedRoles: ["vehicle", "weapon", "effect", "ui", "background"],
    slots: ["space background", "player ship", "enemy ships", "projectiles", "HUD"],
    defaults: {
      title: "Space Battle",
      subtitle: "Ships, projectiles, hazards, and powerups.",
      footer: "SPACE SHOOTER MOCKUP",
      backgroundColor: "#020617",
      accentColor: "#22d3ee",
      titleColor: "#ffffff",
      subtitleColor: "#a5f3fc"
    }
  },
  {
    id: "farm-scene-mockup",
    name: "Farm / Village Scene",
    family: "environment",
    description: "Scene setup for farm animals, crops, food, buildings, fences, terrain, and props.",
    baseTemplateId: "youtube-thumbnail",
    sizePresetId: "thumbnail-1280",
    requiredRoles: [],
    recommendedRoles: ["animal", "food", "building", "terrain", "item"],
    slots: ["ground", "crops", "animals", "buildings", "props"],
    defaults: {
      title: "Farm Scene",
      subtitle: "Animals, crops, buildings, fences, and terrain.",
      footer: "FARM / VILLAGE MOCKUP",
      backgroundColor: "#14532d",
      accentColor: "#fbbf24",
      titleColor: "#ffffff",
      subtitleColor: "#fef3c7"
    }
  },
  {
    id: "effects-sheet",
    name: "Effects Sheet",
    family: "effects",
    description: "Preview sheet for particles, explosions, magic, fire, sparks, impacts, and projectiles.",
    baseTemplateId: "square-post",
    sizePresetId: "square-1080",
    requiredRoles: ["effect"],
    recommendedRoles: ["weapon", "space", "ui"],
    slots: ["effects grid", "labels", "usage notes"],
    defaults: {
      title: "Effects Sheet",
      subtitle: "Particles, magic, projectiles, impacts, and explosions.",
      footer: "VFX / PARTICLE PREVIEW",
      backgroundColor: "#1e1b4b",
      accentColor: "#c084fc",
      titleColor: "#ffffff",
      subtitleColor: "#e9d5ff"
    }
  }
];

const familyLabels = {
  platformer: "Platformer / Tileset",
  tiles: "Tiles / Terrain",
  ui: "UI / Interface",
  items: "Items / Inventory",
  characters: "Characters / Creatures",
  backgrounds: "Backgrounds / Environments",
  board: "Board Game / Cards",
  space: "Space / Shooter",
  rpg: "RPG / Top-down",
  environment: "Farm / Village / Environment",
  effects: "Effects / Particles",
  promo: "Promo / General",
  general: "General Mixed Pack"
};

function normalize(value) {
  if (Array.isArray(value)) return value.join(" ").toLowerCase();
  return String(value || "").toLowerCase();
}

function packText(pack) {
  if (!pack) return "";
  return [
    pack.id,
    pack.displayName,
    pack.zipName,
    pack.category,
    pack.description,
    pack.searchText,
    normalize(pack.visibleAssetTypes),
    normalize(pack.tags)
  ].join(" ").toLowerCase();
}

function itemText(item) {
  return [item?.name, item?.path, item?.sourcePath, item?.pack?.displayName].join(" ").toLowerCase();
}

export function classifyAsset(item) {
  const text = itemText(item);
  const roles = assetRoleRules
    .map((rule) => {
      const matchedKeywords = rule.keywords.filter((keyword) => text.includes(keyword));
      return matchedKeywords.length
        ? { role: rule.role, label: rule.label, matchedKeywords }
        : null;
    })
    .filter(Boolean);

  return {
    item,
    roles,
    roleIds: roles.map((role) => role.role)
  };
}

export function analyzeLoadedAssets(pack, items = []) {
  const classifiedAssets = items.map(classifyAsset);
  const roleCounts = new Map();
  const roleExamples = new Map();

  for (const asset of classifiedAssets) {
    for (const role of asset.roles) {
      roleCounts.set(role.role, (roleCounts.get(role.role) || 0) + 1);
      if (!roleExamples.has(role.role)) roleExamples.set(role.role, []);
      if (roleExamples.get(role.role).length < 5) {
        roleExamples.get(role.role).push(asset.item?.name || asset.item?.path || "asset");
      }
    }
  }

  const text = `${packText(pack)} ${items.map(itemText).join(" ")}`;
  const packKeywordRoles = assetRoleRules
    .map((rule) => ({
      role: rule.role,
      label: rule.label,
      matchedKeywords: rule.keywords.filter((keyword) => text.includes(keyword))
    }))
    .filter((rule) => rule.matchedKeywords.length > 0);

  for (const match of packKeywordRoles) {
    if (!roleCounts.has(match.role)) roleCounts.set(match.role, 1);
    if (!roleExamples.has(match.role)) roleExamples.set(match.role, []);
  }

  const roleSummary = Array.from(roleCounts.entries())
    .map(([role, count]) => ({
      role,
      label: assetRoleRules.find((rule) => rule.role === role)?.label || role,
      count,
      examples: roleExamples.get(role) || []
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  const roleSet = new Set(roleSummary.map((role) => role.role));

  const familyScores = new Map();
  for (const recipe of setupTemplateRecipes) {
    let score = 0;
    for (const role of recipe.requiredRoles || []) {
      if (roleSet.has(role)) score += 4;
    }
    for (const role of recipe.recommendedRoles || []) {
      if (roleSet.has(role)) score += 2;
    }
    if (score > 0) {
      familyScores.set(recipe.family, (familyScores.get(recipe.family) || 0) + score);
    }
  }

  const topFamily = Array.from(familyScores.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "general";

  return {
    pack,
    totalAssets: items.length,
    classifiedAssets,
    roleSummary,
    roleSet,
    profileId: topFamily,
    profileLabel: familyLabels[topFamily] || "General Mixed Pack",
    matchedKeywords: packKeywordRoles.flatMap((match) => match.matchedKeywords).slice(0, 12)
  };
}

export function recommendSetupTemplates(analysis) {
  const roleSet = analysis?.roleSet || new Set();
  const totalAssets = analysis?.totalAssets || 0;

  const scored = setupTemplateRecipes.map((recipe) => {
    const requiredRoles = recipe.requiredRoles || [];
    const recommendedRoles = recipe.recommendedRoles || [];
    const matchedRequiredRoles = requiredRoles.filter((role) => roleSet.has(role));
    const matchedRecommendedRoles = recommendedRoles.filter((role) => roleSet.has(role));
    const missingRequiredRoles = requiredRoles.filter((role) => !roleSet.has(role));
    const matchedRoles = [...matchedRequiredRoles, ...matchedRecommendedRoles];

    let score = 0;
    score += matchedRequiredRoles.length * 10;
    score += matchedRecommendedRoles.length * 4;
    if (!requiredRoles.length) score += 2;
    if (recipe.family === analysis?.profileId) score += 6;
    if (missingRequiredRoles.length) score -= missingRequiredRoles.length * 3;
    if (totalAssets && recipe.id === "asset-contact-sheet") score += 4;
    if (totalAssets && recipe.id === "game-thumbnail") score += 2;

    return {
      ...recipe,
      score,
      matchedRoles,
      missingRequiredRoles,
      matchLabel:
        matchedRoles.length > 0
          ? `${matchedRoles.length} role match${matchedRoles.length === 1 ? "" : "es"}`
          : "general fallback"
    };
  });

  return scored
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, 10);
}
