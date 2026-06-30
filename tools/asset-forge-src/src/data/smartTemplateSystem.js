export const smartTemplateRecipes = [
  {
    id: "asset-contact-sheet",
    name: "Asset Contact Sheet",
    description: "A clean pack overview for showing many assets or documenting what is inside a pack.",
    baseTemplateId: "square-post",
    sizePresetId: "square-1080",
    bestFor: ["general", "platformer", "ui", "items", "characters", "backgrounds", "puzzle", "rpg", "space"],
    slots: ["pack title", "sample assets", "category notes", "source pack"],
    defaults: {
      title: "{pack}\nAsset Sheet",
      subtitle: "Searchable preview of useful assets from this pack.",
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
    description: "A wide promotional thumbnail for a game scene, prototype, or asset pack showcase.",
    baseTemplateId: "youtube-thumbnail",
    sizePresetId: "thumbnail-1280",
    bestFor: ["general", "platformer", "rpg", "space", "puzzle", "backgrounds", "characters"],
    slots: ["hero asset", "background", "big title", "small subtitle"],
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
    description: "A scene-style template for tiles, terrain, props, enemies, and player sprites.",
    baseTemplateId: "youtube-thumbnail",
    sizePresetId: "thumbnail-1280",
    bestFor: ["platformer", "tiles", "environment"],
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
    description: "A simple presentation card for terrain blocks, tile variations, edges, corners, and hazards.",
    baseTemplateId: "square-post",
    sizePresetId: "square-1080",
    bestFor: ["platformer", "tiles", "environment", "rpg"],
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
    id: "ui-menu-mockup",
    name: "UI Menu Mockup",
    description: "A menu screen concept for buttons, panels, icons, cursors, sliders, and UI frames.",
    baseTemplateId: "square-post",
    sizePresetId: "square-1080",
    bestFor: ["ui"],
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
    description: "A gameplay overlay for health bars, score icons, ability buttons, and status panels.",
    baseTemplateId: "youtube-thumbnail",
    sizePresetId: "thumbnail-1280",
    bestFor: ["ui", "space", "platformer", "rpg"],
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
    id: "inventory-grid",
    name: "Inventory Grid",
    description: "A fantasy/RPG/shop style grid for items, weapons, armor, potions, gems, and icons.",
    baseTemplateId: "flyer",
    sizePresetId: "flyer-letter",
    bestFor: ["items", "rpg", "icons"],
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
    id: "character-showcase",
    name: "Character Showcase",
    description: "A character or enemy roster card for sprites, creatures, NPCs, and portraits.",
    baseTemplateId: "quote-card",
    sizePresetId: "poster-1080",
    bestFor: ["characters", "rpg", "platformer", "creatures"],
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
    id: "card-item-showcase",
    name: "Card / Item Showcase",
    description: "A focused item card for tokens, board-game pieces, loot, resources, and special icons.",
    baseTemplateId: "logo-badge",
    sizePresetId: "icon-1024",
    bestFor: ["items", "board", "cards", "icons", "puzzle"],
    slots: ["main item", "title", "rarity", "category", "badge frame"],
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
    description: "A poster-like layout for backgrounds, parallax layers, environment art, and scene previews.",
    baseTemplateId: "youtube-thumbnail",
    sizePresetId: "thumbnail-1280",
    bestFor: ["backgrounds", "environment", "space", "platformer"],
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
    id: "puzzle-arcade-showcase",
    name: "Puzzle / Arcade Showcase",
    description: "A bright arcade card for puzzle pieces, bricks, balls, paddles, tokens, and pickups.",
    baseTemplateId: "square-post",
    sizePresetId: "square-1080",
    bestFor: ["puzzle", "arcade"],
    slots: ["main puzzle pieces", "score icons", "powerups", "buttons", "title"],
    defaults: {
      title: "Arcade Pack",
      subtitle: "Puzzles, bricks, paddles, balls, icons, and powerups.",
      footer: "PUZZLE / ARCADE",
      backgroundColor: "#171717",
      accentColor: "#f97316",
      titleColor: "#ffffff",
      subtitleColor: "#fed7aa"
    }
  },
  {
    id: "space-shooter-loadout",
    name: "Space Shooter Loadout",
    description: "A wide sci-fi template for ships, lasers, asteroids, planets, powerups, and HUD parts.",
    baseTemplateId: "youtube-thumbnail",
    sizePresetId: "thumbnail-1280",
    bestFor: ["space", "shooter", "sci-fi"],
    slots: ["player ship", "enemy ships", "projectiles", "asteroids", "powerups", "HUD"],
    defaults: {
      title: "Space Loadout",
      subtitle: "Ships, projectiles, hazards, and powerups.",
      footer: "SPACE SHOOTER MOCKUP",
      backgroundColor: "#020617",
      accentColor: "#22d3ee",
      titleColor: "#ffffff",
      subtitleColor: "#a5f3fc"
    }
  }
];

const packKindRules = [
  {
    id: "platformer",
    label: "Platformer / Tileset",
    keywords: ["platformer", "platform", "tile", "tileset", "terrain", "grass", "dirt", "ground", "farm", "jungle", "winter", "adventure"],
    recipeIds: ["platformer-level-mockup", "tileset-preview-sheet", "game-thumbnail", "asset-contact-sheet"]
  },
  {
    id: "ui",
    label: "UI / Interface",
    keywords: ["ui", "interface", "button", "cursor", "hud", "panel", "icon", "icons", "input", "mobile", "game icons"],
    recipeIds: ["ui-menu-mockup", "hud-overlay-mockup", "asset-contact-sheet", "game-thumbnail"]
  },
  {
    id: "characters",
    label: "Characters / Creatures",
    keywords: ["character", "characters", "creature", "creatures", "monster", "enemy", "npc", "animal", "animals", "player", "portrait"],
    recipeIds: ["character-showcase", "game-thumbnail", "asset-contact-sheet"]
  },
  {
    id: "items",
    label: "Items / Icons / Loot",
    keywords: ["item", "items", "inventory", "weapon", "weapons", "sword", "armor", "potion", "gem", "coin", "resource", "tool", "loot", "icon"],
    recipeIds: ["inventory-grid", "card-item-showcase", "asset-contact-sheet"]
  },
  {
    id: "backgrounds",
    label: "Backgrounds / Environments",
    keywords: ["background", "backgrounds", "parallax", "environment", "scene", "landscape", "sky", "space", "water", "forest", "desert"],
    recipeIds: ["background-scene-poster", "game-thumbnail", "asset-contact-sheet"]
  },
  {
    id: "puzzle",
    label: "Puzzle / Arcade",
    keywords: ["puzzle", "arcade", "breakout", "brick", "paddle", "ball", "board", "cards", "card", "token", "dice"],
    recipeIds: ["puzzle-arcade-showcase", "card-item-showcase", "asset-contact-sheet", "game-thumbnail"]
  },
  {
    id: "rpg",
    label: "RPG / Roguelike / Fantasy",
    keywords: ["rpg", "roguelike", "dungeon", "fantasy", "magic", "spell", "knight", "wizard", "skeleton", "slime", "chest"],
    recipeIds: ["inventory-grid", "character-showcase", "tileset-preview-sheet", "asset-contact-sheet"]
  },
  {
    id: "space",
    label: "Space / Shooter / Sci-Fi",
    keywords: ["space", "shooter", "sci-fi", "spaceship", "ship", "laser", "planet", "asteroid", "alien"],
    recipeIds: ["space-shooter-loadout", "hud-overlay-mockup", "game-thumbnail", "asset-contact-sheet"]
  }
];

function normalize(value) {
  if (Array.isArray(value)) return value.join(" ").toLowerCase();
  return String(value || "").toLowerCase();
}

function getPackText(pack) {
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
  ]
    .join(" ")
    .toLowerCase();
}

export function detectPackTemplateProfile(pack) {
  if (!pack) {
    return {
      id: "none",
      label: "No pack loaded",
      confidence: 0,
      matchedKeywords: [],
      recipeIds: ["asset-contact-sheet", "game-thumbnail"]
    };
  }

  const text = getPackText(pack);
  const scored = packKindRules
    .map((rule) => {
      const matchedKeywords = rule.keywords.filter((keyword) => text.includes(keyword));
      return {
        ...rule,
        confidence: matchedKeywords.length,
        matchedKeywords
      };
    })
    .filter((rule) => rule.confidence > 0)
    .sort((a, b) => b.confidence - a.confidence);

  if (!scored.length) {
    return {
      id: "general",
      label: "General Mixed Pack",
      confidence: 1,
      matchedKeywords: [],
      recipeIds: ["asset-contact-sheet", "game-thumbnail", "card-item-showcase"]
    };
  }

  return scored[0];
}

export function getRecommendedSmartTemplates(pack) {
  const profile = detectPackTemplateProfile(pack);
  const recipeIds = [...profile.recipeIds, "asset-contact-sheet", "game-thumbnail"];
  const uniqueIds = Array.from(new Set(recipeIds));

  return uniqueIds
    .map((id) => smartTemplateRecipes.find((recipe) => recipe.id === id))
    .filter(Boolean)
    .slice(0, 6);
}
