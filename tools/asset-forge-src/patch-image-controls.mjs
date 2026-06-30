import fs from "node:fs";

const appPath = "./src/App.jsx";
const cssPath = "./src/App.css";

let code = fs.readFileSync(appPath, "utf8");

// Add default image placement settings to every new design.
if (!code.includes("imageSettings: {")) {
  code = code.replace(
    /fileName: template\.fileName,\r?\n    \.\.\.template\.defaults/,
    `fileName: template.fileName,
    imageSettings: {
      x: 0,
      y: 0,
      scale: 100,
      opacity: 100,
      fit: "auto",
      shape: "auto"
    },
    ...template.defaults`
  );
}

// Upgrade drawImageFrame() so placement settings can adjust every image frame.
if (!code.includes("const adjustments = options.adjustments || {};")) {
  const oldBlock = `  const radius = options.radius ?? 28;
  const mode = options.mode ?? "cover";
  const circle = options.circle ?? false;

  ctx.save();`;

  const newBlock = `  const adjustments = options.adjustments || {};

  const scaleValue = Number(adjustments.scale ?? 100) / 100;
  const safeScale = Number.isFinite(scaleValue)
    ? Math.max(0.25, Math.min(3, scaleValue))
    : 1;

  const xValue = Number(adjustments.x ?? 0);
  const yValue = Number(adjustments.y ?? 0);
  const safeX = Number.isFinite(xValue) ? Math.max(-100, Math.min(100, xValue)) : 0;
  const safeY = Number.isFinite(yValue) ? Math.max(-100, Math.min(100, yValue)) : 0;

  const opacityValue = Number(adjustments.opacity ?? 100) / 100;
  const safeOpacity = Number.isFinite(opacityValue)
    ? Math.max(0.05, Math.min(1, opacityValue))
    : 1;

  const adjustedWidth = width * safeScale;
  const adjustedHeight = height * safeScale;

  x = x + (width - adjustedWidth) / 2 + (safeX / 100) * width;
  y = y + (height - adjustedHeight) / 2 + (safeY / 100) * height;
  width = adjustedWidth;
  height = adjustedHeight;

  const radius = options.radius ?? 28;
  const mode =
    adjustments.fit && adjustments.fit !== "auto"
      ? adjustments.fit
      : options.mode ?? "cover";

  const shape = adjustments.shape || "auto";
  const circle =
    shape === "circle" ? true : shape === "rounded" ? false : options.circle ?? false;

  ctx.save();
  ctx.globalAlpha *= safeOpacity;`;

  if (!code.includes(oldBlock)) {
    throw new Error("Could not find drawImageFrame() settings block.");
  }

  code = code.replace(oldBlock, newBlock);
}

// Pass placement settings into every image frame.
if (!code.includes("adjustments: design.imageSettings")) {
  code = code.replaceAll(
    `mode: "cover"
    }`,
    `mode: "cover",
      adjustments: design.imageSettings
    }`
  );

  code = code.replaceAll(
    `mode: "contain"
    }`,
    `mode: "contain",
      adjustments: design.imageSettings
    }`
  );
}

// Add image placement update function inside App().
if (!code.includes("function updateImageSetting")) {
  const imageSettingFunction = `

  function updateImageSetting(field, value) {
    setDesign((current) => ({
      ...current,
      imageSettings: {
        ...(current.imageSettings || {}),
        [field]: value
      }
    }));
    setZipStatus("");
  }
`;

  const insertBefore = /\r?\n  function handleImageUpload\(event\)/;

  if (!insertBefore.test(code)) {
    throw new Error("Could not find handleImageUpload() insertion point.");
  }

  code = code.replace(insertBefore, imageSettingFunction + "\n  function handleImageUpload(event)");
}

// Add image placement controls after the upload panel.
if (!code.includes("Image placement")) {
  const imageControls = `

          {userImage ? (
            <div className="image-controls">
              <h3>Image placement</h3>

              <label>
                Fit
                <select
                  value={design.imageSettings?.fit || "auto"}
                  onChange={(event) => updateImageSetting("fit", event.target.value)}
                >
                  <option value="auto">Auto for template</option>
                  <option value="cover">Cover frame</option>
                  <option value="contain">Contain full image</option>
                </select>
              </label>

              <label>
                Shape
                <select
                  value={design.imageSettings?.shape || "auto"}
                  onChange={(event) => updateImageSetting("shape", event.target.value)}
                >
                  <option value="auto">Auto for template</option>
                  <option value="rounded">Rounded rectangle</option>
                  <option value="circle">Circle</option>
                </select>
              </label>

              <label>
                Scale <span>{design.imageSettings?.scale ?? 100}%</span>
                <input
                  type="range"
                  min="40"
                  max="220"
                  value={design.imageSettings?.scale ?? 100}
                  onChange={(event) =>
                    updateImageSetting("scale", Number(event.target.value))
                  }
                />
              </label>

              <label>
                X position <span>{design.imageSettings?.x ?? 0}</span>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={design.imageSettings?.x ?? 0}
                  onChange={(event) =>
                    updateImageSetting("x", Number(event.target.value))
                  }
                />
              </label>

              <label>
                Y position <span>{design.imageSettings?.y ?? 0}</span>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={design.imageSettings?.y ?? 0}
                  onChange={(event) =>
                    updateImageSetting("y", Number(event.target.value))
                  }
                />
              </label>

              <label>
                Opacity <span>{design.imageSettings?.opacity ?? 100}%</span>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={design.imageSettings?.opacity ?? 100}
                  onChange={(event) =>
                    updateImageSetting("opacity", Number(event.target.value))
                  }
                />
              </label>
            </div>
          ) : null}
`;

  const uploadPanelEnd = /(\r?\n          <div className="color-grid">)/;

  if (!uploadPanelEnd.test(code)) {
    throw new Error("Could not find color-grid insertion point.");
  }

  code = code.replace(uploadPanelEnd, imageControls + "$1");
}

// Include image settings in manifest data.
if (!code.includes("imageSettings: design.imageSettings")) {
  code = code.replace(
    /subtitleColor: design\.subtitleColor(\r?\n    \},)/,
    `subtitleColor: design.subtitleColor,
      imageSettings: design.imageSettings$1`
  );
}

fs.writeFileSync(appPath, code, "utf8");

let css = fs.readFileSync(cssPath, "utf8");

if (!css.includes(".image-controls")) {
  css += `

.image-controls {
  margin: 4px 0 18px;
  padding: 14px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 14px;
  background: rgba(2, 6, 23, 0.35);
}

.image-controls h3 {
  margin: 0 0 12px;
  font-size: 1rem;
}

.image-controls label {
  margin-bottom: 14px;
}

.image-controls label span {
  color: #fde68a;
  font-size: 0.86rem;
  font-weight: 800;
}

.image-controls input[type="range"] {
  padding: 0;
  accent-color: #facc15;
}
`;
}

fs.writeFileSync(cssPath, css, "utf8");

console.log("Asset Forge image placement controls patch applied.");
