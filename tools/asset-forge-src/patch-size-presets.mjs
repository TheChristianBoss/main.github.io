import fs from "node:fs";

const appPath = "./src/App.jsx";
const cssPath = "./src/App.css";

let code = fs.readFileSync(appPath, "utf8");

if (!code.includes("const exportSizes = [")) {
  const exportSizesBlock = `

const exportSizes = [
  {
    id: "template-default",
    name: "Template default",
    description: "Use the selected template's original size.",
    size: null,
    fileSuffix: "template"
  },
  {
    id: "square-1080",
    name: "Square 1080 × 1080",
    description: "Good for social posts and profile graphics.",
    size: { width: 1080, height: 1080 },
    fileSuffix: "square-1080"
  },
  {
    id: "thumbnail-1280",
    name: "Thumbnail 1280 × 720",
    description: "Good for YouTube thumbnails and wide banners.",
    size: { width: 1280, height: 720 },
    fileSuffix: "thumbnail-1280x720"
  },
  {
    id: "poster-1080",
    name: "Poster 1080 × 1350",
    description: "Good for tall social posts and promotional graphics.",
    size: { width: 1080, height: 1350 },
    fileSuffix: "poster-1080x1350"
  },
  {
    id: "flyer-letter",
    name: "Flyer 816 × 1056",
    description: "Good for printable letter-ratio flyers.",
    size: { width: 816, height: 1056 },
    fileSuffix: "flyer-816x1056"
  },
  {
    id: "icon-1024",
    name: "Icon 1024 × 1024",
    description: "Good for badges, icons, and profile marks.",
    size: { width: 1024, height: 1024 },
    fileSuffix: "icon-1024"
  }
];
`;

  code = code.replace(
    /\];\r?\n\r?\nfunction getTemplateById/,
    `];${exportSizesBlock}

function getTemplateById`
  );
}

if (!code.includes("function getExportSizeById")) {
  const helperBlock = `

function getExportSizeById(id) {
  return exportSizes.find((size) => size.id === id) || exportSizes[0];
}

function getSizeForDesign(templateId, sizePresetId) {
  const template = getTemplateById(templateId);
  const sizePreset = getExportSizeById(sizePresetId);

  return sizePreset.size || template.size;
}

function getDesignFileName(design) {
  const sizePreset = getExportSizeById(design.sizePresetId || "template-default");
  const baseName = String(design.fileName || "asset.png").replace(/\\.png$/i, "");

  if (!sizePreset || sizePreset.fileSuffix === "template") {
    return \`\${baseName}.png\`;
  }

  return \`\${baseName}-\${sizePreset.fileSuffix}.png\`;
}
`;

  code = code.replace(
    /\r?\nfunction drawWrappedText/,
    `${helperBlock}

function drawWrappedText`
  );
}

if (!code.includes('sizePresetId: "template-default"')) {
  code = code.replace(
    /return \{\r?\n    templateId: template\.id,\r?\n    size: template\.size,/,
    `return {
    templateId: template.id,
    sizePresetId: "template-default",
    size: template.size,`
  );
}

if (!code.includes("function changeExportSize")) {
  const changeExportSizeBlock = `

  function changeExportSize(sizePresetId) {
    setDesign((current) => ({
      ...current,
      sizePresetId,
      size: getSizeForDesign(current.templateId, sizePresetId)
    }));
    setZipStatus("");
  }
`;

  code = code.replace(
    /\r?\n  function handleImageUpload\(event\)/,
    `${changeExportSizeBlock}

  function handleImageUpload(event)`
  );
}

if (!code.includes("Export size")) {
  const exportSizeControl = `

          <label>
            Export size
            <select
              value={design.sizePresetId || "template-default"}
              onChange={(event) => changeExportSize(event.target.value)}
            >
              {exportSizes.map((size) => (
                <option key={size.id} value={size.id}>
                  {size.name}
                </option>
              ))}
            </select>
          </label>

          <p className="template-note size-note">
            Output: {design.size.width} × {design.size.height}px. Template style
            and export size can be mixed.
          </p>
`;

  code = code.replace(
    /(<p className="template-note">\{activeTemplate\.description\}<\/p>)/,
    `$1${exportSizeControl}`
  );
}

code = code.replaceAll(
  "`asset-forge-${design.fileName}`",
  "`asset-forge-${getDesignFileName(design)}`"
);

code = code.replace(
  "downloadBlob(pdfBlob, `asset-forge-${activeTemplate.id}.pdf`);",
  'downloadBlob(pdfBlob, `asset-forge-${getDesignFileName(design).replace(/\\\\.png$/, ".pdf")}`);'
);

code = code.replace(
  "size: design.size,\n      layout: design.layout",
  'size: design.size,\n      layout: design.layout,\n      sizePresetId: design.sizePresetId || "template-default"'
);

code = code.replaceAll("Building all template PNGs...", "Building all layout exports...");
code = code.replaceAll("This ZIP contains one PNG export for every template.", "This ZIP contains one PNG export for every layout.");
code = code.replaceAll("Included templates:", "Included layouts:");
code = code.replaceAll("asset-forge-all-template-pack.zip", "asset-forge-all-layouts-pack.zip");
code = code.replaceAll("All-template asset pack ready.", "All-layout asset pack ready.");
code = code.replaceAll("Download all templates as ZIP", "Export current design in all layouts");

fs.writeFileSync(appPath, code, "utf8");

let css = fs.readFileSync(cssPath, "utf8");

if (!css.includes(".size-note")) {
  css += `

.size-note {
  margin-top: -8px;
}
`;
}

fs.writeFileSync(cssPath, css, "utf8");

console.log("Asset Forge v0.6 size preset patch applied.");
