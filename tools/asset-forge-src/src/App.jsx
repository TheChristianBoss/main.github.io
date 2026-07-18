import JSZip from "jszip";
import { PDFDocument } from "pdf-lib";
import { useEffect, useMemo, useRef, useState } from "react";
import { analyzeLoadedAssets, recommendSetupTemplates } from "./data/templateRecipeEngine";
import "./App.css";

const ASSET_INDEX_URL = "./asset-libraries/kenney-library-index.json";

const templates = [
  {
    id: "square-post",
    name: "Square Post",
    description: "Good for social posts, announcements, and simple graphics.",
    fileName: "square-post.png",
    size: { width: 1080, height: 1080 },
    layout: "squarePost",
    defaults: {
      title: "Your Title Here",
      subtitle: "Subtitle or short description",
      footer: "Made with Goblin Asset Forge",
      backgroundColor: "#111827",
      accentColor: "#facc15",
      titleColor: "#ffffff",
      subtitleColor: "#facc15"
    }
  },
  {
    id: "youtube-thumbnail",
    name: "YouTube Thumbnail",
    description: "Wide 16:9 image for videos, banners, and previews.",
    fileName: "youtube-thumbnail.png",
    size: { width: 1280, height: 720 },
    layout: "thumbnail",
    defaults: {
      title: "Big Thumbnail Title",
      subtitle: "Short punchy subtitle",
      footer: "CHANNEL / SERIES",
      backgroundColor: "#18181b",
      accentColor: "#ef4444",
      titleColor: "#ffffff",
      subtitleColor: "#fde68a"
    }
  },
  {
    id: "flyer",
    name: "Flyer",
    description: "Portrait layout for events, handouts, and printable notices.",
    fileName: "flyer.png",
    size: { width: 816, height: 1056 },
    layout: "flyer",
    defaults: {
      title: "Event Flyer",
      subtitle: "Date - Time - Location - Details",
      footer: "Add contact info, address, or call to action",
      backgroundColor: "#1e1b4b",
      accentColor: "#a78bfa",
      titleColor: "#ffffff",
      subtitleColor: "#ddd6fe"
    }
  },
  {
    id: "quote-card",
    name: "Quote Card",
    description: "Tall quote, scripture, caption, or statement card.",
    fileName: "quote-card.png",
    size: { width: 1080, height: 1350 },
    layout: "quoteCard",
    defaults: {
      title: "A strong quote or statement goes here.",
      subtitle: "- Source or reference",
      footer: "Shareable quote card",
      backgroundColor: "#052e16",
      accentColor: "#86efac",
      titleColor: "#f0fdf4",
      subtitleColor: "#bbf7d0"
    }
  },
  {
    id: "logo-badge",
    name: "Logo Badge",
    description: "Simple badge-style logo, icon, or profile mark.",
    fileName: "logo-badge.png",
    size: { width: 1024, height: 1024 },
    layout: "logoBadge",
    defaults: {
      title: "CG",
      subtitle: "Christian Goblin",
      footer: "Asset Forge",
      backgroundColor: "#0c0a09",
      accentColor: "#f59e0b",
      titleColor: "#ffffff",
      subtitleColor: "#fed7aa"
    }
  }
];

const exportSizes = [
  { id: "template-default", name: "Template default", size: null, fileSuffix: "template" },
  { id: "square-1080", name: "Square 1080 x 1080", size: { width: 1080, height: 1080 }, fileSuffix: "square-1080" },
  { id: "thumbnail-1280", name: "Thumbnail 1280 x 720", size: { width: 1280, height: 720 }, fileSuffix: "thumbnail-1280x720" },
  { id: "poster-1080", name: "Poster 1080 x 1350", size: { width: 1080, height: 1350 }, fileSuffix: "poster-1080x1350" },
  { id: "flyer-letter", name: "Flyer 816 x 1056", size: { width: 816, height: 1056 }, fileSuffix: "flyer-816x1056" },
  { id: "icon-1024", name: "Icon 1024 x 1024", size: { width: 1024, height: 1024 }, fileSuffix: "icon-1024" }
];

function getTemplateById(id) {
  return templates.find((template) => template.id === id) || templates[0];
}

function getExportSizeById(id) {
  return exportSizes.find((size) => size.id === id) || exportSizes[0];
}

function getSizeForDesign(templateId, sizePresetId) {
  const template = getTemplateById(templateId);
  const sizePreset = getExportSizeById(sizePresetId);
  return sizePreset.size || template.size;
}

function createDesign(templateId, sizePresetId = "template-default") {
  const template = getTemplateById(templateId);
  return {
    templateId: template.id,
    sizePresetId,
    size: getSizeForDesign(template.id, sizePresetId),
    layout: template.layout,
    fileName: template.fileName,
    ...template.defaults
  };
}

function getDesignFileName(design) {
  const sizePreset = getExportSizeById(design.sizePresetId || "template-default");
  const baseName = String(design.fileName || "asset.png").replace(/\.png$/i, "");
  if (!sizePreset || sizePreset.fileSuffix === "template") return `${baseName}.png`;
  return `${baseName}-${sizePreset.fileSuffix}.png`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function makeId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `layer-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatBytes(bytes) {
  const value = Number(bytes || 0);
  if (!value) return "0 B";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 99) {
  const safeText = String(text || "");
  const paragraphs = safeText.split(/\n+/);
  let currentY = y;
  let linesDrawn = 0;
  for (const paragraph of paragraphs) {
    const words = paragraph.split(" ");
    let line = "";
    for (const word of words) {
      const testLine = line + word + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && line !== "") {
        if (linesDrawn >= maxLines) return currentY;
        ctx.fillText(line.trim(), x, currentY);
        linesDrawn += 1;
        line = word + " ";
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    if (line.trim()) {
      if (linesDrawn >= maxLines) return currentY;
      ctx.fillText(line.trim(), x, currentY);
      linesDrawn += 1;
      currentY += lineHeight;
    }
    currentY += lineHeight * 0.25;
  }
  return currentY;
}

function roundedRect(ctx, x, y, width, height, radius) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + safeRadius, y);
  ctx.lineTo(x + width - safeRadius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  ctx.lineTo(x + width, y + height - safeRadius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  ctx.lineTo(x + safeRadius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  ctx.lineTo(x, y + safeRadius);
  ctx.quadraticCurveTo(x, y, x + safeRadius, y);
  ctx.closePath();
}

function drawImageCover(ctx, image, x, y, width, height) {
  const imageWidth = image.naturalWidth || image.width;
  const imageHeight = image.naturalHeight || image.height;
  if (!imageWidth || !imageHeight) return;
  const imageRatio = imageWidth / imageHeight;
  const boxRatio = width / height;
  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth;
  let sourceHeight;
  if (imageRatio > boxRatio) {
    sourceHeight = imageHeight;
    sourceWidth = sourceHeight * boxRatio;
    sourceX = (imageWidth - sourceWidth) / 2;
  } else {
    sourceWidth = imageWidth;
    sourceHeight = sourceWidth / boxRatio;
    sourceY = (imageHeight - sourceHeight) / 2;
  }
  ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
}

function drawImageContain(ctx, image, x, y, width, height) {
  const imageWidth = image.naturalWidth || image.width;
  const imageHeight = image.naturalHeight || image.height;
  if (!imageWidth || !imageHeight) return;
  const scale = Math.min(width / imageWidth, height / imageHeight);
  const drawWidth = imageWidth * scale;
  const drawHeight = imageHeight * scale;
  const drawX = x + (width - drawWidth) / 2;
  const drawY = y + (height - drawHeight) / 2;
  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
}

function drawSoftTexture(ctx, width, height, accentColor) {
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 3;
  for (let i = 0; i < 12; i += 1) {
    const x = -120 + i * 140;
    ctx.beginPath();
    ctx.moveTo(x, height + 60);
    ctx.lineTo(x + 520, -60);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBorder(ctx, width, height) {
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.lineWidth = Math.max(6, width * 0.006);
  ctx.strokeRect(width * 0.045, height * 0.045, width * 0.91, height * 0.91);
  ctx.restore();
}

function drawImageLayer(ctx, design, layer) {
  if (!layer?.element) return;
  const { width, height } = design.size;
  const image = layer.element;
  const imageWidth = image.naturalWidth || image.width;
  const imageHeight = image.naturalHeight || image.height;
  if (!imageWidth || !imageHeight) return;
  const centerX = (Number(layer.x ?? 50) / 100) * width;
  const centerY = (Number(layer.y ?? 50) / 100) * height;
  const sizePercent = clamp(Number(layer.size ?? 32), 5, 150);
  const opacity = clamp(Number(layer.opacity ?? 100) / 100, 0.05, 1);
  const shape = layer.shape || "rounded";
  const fit = layer.fit || "cover";
  const rotation = (Number(layer.rotation ?? 0) * Math.PI) / 180;
  let boxWidth = width * (sizePercent / 100);
  let boxHeight = boxWidth * (imageHeight / imageWidth);
  if (shape === "circle") boxHeight = boxWidth;
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(rotation);
  ctx.globalAlpha = opacity;
  ctx.shadowColor = "rgba(0,0,0,0.36)";
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 14;
  const x = -boxWidth / 2;
  const y = -boxHeight / 2;
  const radius = shape === "circle" ? boxWidth / 2 : Math.min(40, boxWidth * 0.12);
  if (shape === "circle") {
    ctx.beginPath();
    ctx.arc(0, 0, Math.min(boxWidth, boxHeight) / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    if (fit === "contain") drawImageContain(ctx, image, x, y, boxWidth, boxHeight);
    else drawImageCover(ctx, image, x, y, boxWidth, boxHeight);
  } else if (shape === "rounded") {
    roundedRect(ctx, x, y, boxWidth, boxHeight, radius);
    ctx.clip();
    if (fit === "contain") drawImageContain(ctx, image, x, y, boxWidth, boxHeight);
    else drawImageCover(ctx, image, x, y, boxWidth, boxHeight);
  } else {
    if (fit === "contain") drawImageContain(ctx, image, x, y, boxWidth, boxHeight);
    else ctx.drawImage(image, x, y, boxWidth, boxHeight);
  }
  ctx.restore();
}

function drawImageLayers(ctx, design, imageLayers) {
  for (const layer of imageLayers) drawImageLayer(ctx, design, layer);
}

function drawSquarePost(ctx, design) {
  const { width, height } = design.size;
  drawSoftTexture(ctx, width, height, design.accentColor);
  ctx.fillStyle = design.accentColor;
  ctx.beginPath();
  ctx.arc(width - 170, 170, 95, 0, Math.PI * 2);
  ctx.fill();
  drawBorder(ctx, width, height);
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = design.titleColor;
  ctx.font = `bold ${Math.max(54, width * 0.089)}px Georgia, serif`;
  drawWrappedText(ctx, design.title, width * 0.083, height * 0.28, width * 0.82, width * 0.1, 4);
  ctx.fillStyle = design.subtitleColor;
  ctx.font = `${Math.max(28, width * 0.039)}px Arial, sans-serif`;
  drawWrappedText(ctx, design.subtitle, width * 0.087, height * 0.52, width * 0.82, width * 0.052, 4);
  ctx.fillStyle = "rgba(255,255,255,0.82)";
  ctx.font = `${Math.max(18, width * 0.026)}px Arial, sans-serif`;
  ctx.fillText(design.footer, width * 0.087, height * 0.89);
}

function drawThumbnail(ctx, design) {
  const { width, height } = design.size;
  ctx.save();
  ctx.fillStyle = design.accentColor;
  ctx.beginPath();
  ctx.moveTo(width * 0.62, 0);
  ctx.lineTo(width, 0);
  ctx.lineTo(width, height);
  ctx.lineTo(width * 0.42, height);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  drawSoftTexture(ctx, width, height, "#ffffff");
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  roundedRect(ctx, width * 0.66, height * 0.15, width * 0.25, height * 0.55, 34);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = `bold ${Math.max(70, width * 0.085)}px Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("PLAY", width * 0.785, height * 0.46);
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = design.titleColor;
  ctx.font = `bold ${Math.max(54, width * 0.067)}px Arial Black, Impact, sans-serif`;
  drawWrappedText(ctx, design.title, width * 0.056, height * 0.17, width * 0.58, width * 0.072, 4);
  ctx.fillStyle = design.subtitleColor;
  ctx.font = `${Math.max(26, width * 0.031)}px Arial, sans-serif`;
  drawWrappedText(ctx, design.subtitle, width * 0.061, height * 0.65, width * 0.55, width * 0.041, 2);
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = `bold ${Math.max(20, width * 0.022)}px Arial, sans-serif`;
  ctx.fillText(design.footer, width * 0.061, height * 0.885);
}

function drawFlyer(ctx, design) {
  const { width, height } = design.size;
  drawSoftTexture(ctx, width, height, design.accentColor);
  ctx.fillStyle = design.accentColor;
  ctx.fillRect(0, 0, width, height * 0.142);
  drawBorder(ctx, width, height);
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  roundedRect(ctx, width * 0.083, height * 0.2, width * 0.834, height * 0.293, 26);
  ctx.fill();
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = design.titleColor;
  ctx.font = `bold ${Math.max(44, width * 0.078)}px Georgia, serif`;
  drawWrappedText(ctx, design.title, width * 0.086, height * 0.53, width * 0.828, width * 0.091, 4);
  ctx.fillStyle = design.subtitleColor;
  ctx.font = `${Math.max(26, width * 0.042)}px Arial, sans-serif`;
  drawWrappedText(ctx, design.subtitle, width * 0.088, height * 0.72, width * 0.824, width * 0.056, 5);
  ctx.fillStyle = "rgba(0,0,0,0.24)";
  ctx.fillRect(0, height - height * 0.152, width, height * 0.152);
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = `${Math.max(20, width * 0.034)}px Arial, sans-serif`;
  drawWrappedText(ctx, design.footer, width * 0.086, height * 0.888, width * 0.828, width * 0.044, 3);
}

function drawQuoteCard(ctx, design) {
  const { width, height } = design.size;
  drawSoftTexture(ctx, width, height, design.accentColor);
  ctx.fillStyle = design.accentColor;
  ctx.globalAlpha = 0.18;
  ctx.beginPath();
  ctx.arc(width * 0.5, height * 0.36, width * 0.31, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  drawBorder(ctx, width, height);
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = design.accentColor;
  ctx.font = `bold ${Math.max(110, width * 0.148)}px Georgia, serif`;
  ctx.fillText('"', width / 2, height * 0.09);
  ctx.fillStyle = design.titleColor;
  ctx.font = `bold ${Math.max(42, width * 0.065)}px Georgia, serif`;
  drawWrappedText(ctx, design.title, width / 2, height * 0.26, width * 0.83, width * 0.08, 7);
  ctx.fillStyle = design.subtitleColor;
  ctx.font = `${Math.max(26, width * 0.033)}px Arial, sans-serif`;
  drawWrappedText(ctx, design.subtitle, width / 2, height * 0.71, width * 0.83, width * 0.046, 3);
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = `${Math.max(18, width * 0.024)}px Arial, sans-serif`;
  ctx.fillText(design.footer, width / 2, height * 0.91);
}

function getInitials(text) {
  const cleaned = String(text || "CG").trim();
  if (cleaned.length <= 4) return cleaned.toUpperCase();
  return cleaned.split(/\s+/).filter(Boolean).slice(0, 3).map((word) => word[0]).join("").toUpperCase();
}

function drawLogoBadge(ctx, design) {
  const { width, height } = design.size;
  const centerX = width / 2;
  const centerY = height / 2;
  drawSoftTexture(ctx, width, height, design.accentColor);
  ctx.strokeStyle = design.accentColor;
  ctx.lineWidth = width * 0.021;
  ctx.beginPath();
  ctx.arc(centerX, centerY, width * 0.34, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = width * 0.005;
  ctx.beginPath();
  ctx.arc(centerX, centerY, width * 0.4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = design.titleColor;
  ctx.font = `bold ${Math.max(120, width * 0.185)}px Georgia, serif`;
  ctx.fillText(getInitials(design.title), centerX, centerY - height * 0.027);
  ctx.textBaseline = "top";
  ctx.fillStyle = design.subtitleColor;
  ctx.font = `bold ${Math.max(28, width * 0.041)}px Arial, sans-serif`;
  drawWrappedText(ctx, design.subtitle, centerX, centerY + height * 0.185, width * 0.785, width * 0.051, 2);
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = `${Math.max(18, width * 0.023)}px Arial, sans-serif`;
  ctx.fillText(design.footer, centerX, height * 0.897);
}

function renderDesign(canvas, design, imageLayers) {
  const ctx = canvas.getContext("2d");
  const { width, height } = design.size;
  canvas.width = width;
  canvas.height = height;
  ctx.fillStyle = design.backgroundColor;
  ctx.fillRect(0, 0, width, height);
  if (design.layout === "thumbnail") drawThumbnail(ctx, design);
  else if (design.layout === "flyer") drawFlyer(ctx, design);
  else if (design.layout === "quoteCard") drawQuoteCard(ctx, design);
  else if (design.layout === "logoBadge") drawLogoBadge(ctx, design);
  else drawSquarePost(ctx, design);
  drawImageLayers(ctx, design, imageLayers);
}

function canvasToBlob(canvas, type = "image/png", quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("The browser could not export this canvas."));
    }, type, quality);
  });
}

async function renderDesignToBlob(design, imageLayers) {
  const canvas = document.createElement("canvas");
  renderDesign(canvas, design, imageLayers);
  return canvasToBlob(canvas, "image/png");
}

async function renderDesignToPdfBlob(design, imageLayers) {
  const imageBlob = await renderDesignToBlob(design, imageLayers);
  const imageBytes = await imageBlob.arrayBuffer();
  const pdfDoc = await PDFDocument.create();
  const embeddedImage = await pdfDoc.embedPng(imageBytes);
  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 36;
  const page = pdfDoc.addPage([pageWidth, pageHeight]);
  const maxImageWidth = pageWidth - margin * 2;
  const maxImageHeight = pageHeight - margin * 2;
  const scale = Math.min(maxImageWidth / embeddedImage.width, maxImageHeight / embeddedImage.height);
  const drawWidth = embeddedImage.width * scale;
  const drawHeight = embeddedImage.height * scale;
  page.drawImage(embeddedImage, {
    x: (pageWidth - drawWidth) / 2,
    y: (pageHeight - drawHeight) / 2,
    width: drawWidth,
    height: drawHeight
  });
  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
}

function makeManifest(design, activeTemplate, imageLayers) {
  return {
    generator: "Goblin Asset Forge",
    version: "0.10-open-beta",
    generatedAt: new Date().toISOString(),
    template: {
      id: activeTemplate.id,
      name: activeTemplate.name,
      size: design.size,
      layout: design.layout,
      sizePresetId: design.sizePresetId || "template-default"
    },
    design: {
      title: design.title,
      subtitle: design.subtitle,
      footer: design.footer,
      backgroundColor: design.backgroundColor,
      accentColor: design.accentColor,
      titleColor: design.titleColor,
      subtitleColor: design.subtitleColor,
      smartTemplateId: design.smartTemplateId || null,
      smartTemplateName: design.smartTemplateName || null,
      setupTemplateFamily: design.setupTemplateFamily || null,
      detectedPackProfile: design.detectedPackProfile || null,
      assetRoleProfile: design.assetRoleProfile || null
    },
    imageLayers: imageLayers.map((layer) => ({
      id: layer.id,
      name: layer.name,
      sourcePack: layer.sourcePack || null,
      sourcePath: layer.sourcePath || null,
      x: layer.x,
      y: layer.y,
      size: layer.size,
      opacity: layer.opacity,
      rotation: layer.rotation,
      fit: layer.fit,
      shape: layer.shape
    })),
    privacy: "Generated in the browser. No server upload is required for this prototype."
  };
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function getLayerStyle(layer) {
  if (!layer?.element) return undefined;
  const image = layer.element;
  const imageWidth = image.naturalWidth || image.width || 1;
  const imageHeight = image.naturalHeight || image.height || 1;
  const shape = layer.shape || "rounded";
  const widthPercent = clamp(Number(layer.size ?? 32), 5, 150);
  return {
    left: `${clamp(Number(layer.x ?? 50), 0, 100)}%`,
    top: `${clamp(Number(layer.y ?? 50), 0, 100)}%`,
    width: `${widthPercent}%`,
    aspectRatio: shape === "circle" ? "1 / 1" : `${imageWidth} / ${imageHeight}`,
    borderRadius: shape === "circle" ? "999px" : shape === "rounded" ? "24px" : "6px",
    transform: `translate(-50%, -50%) rotate(${Number(layer.rotation ?? 0)}deg)`
  };
}

function imageFromUrl(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("The browser could not load that image."));
    image.src = url;
  });
}

export default function App() {
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const actionRef = useRef(null);
  const [design, setDesign] = useState(() => createDesign("square-post"));
  const [imageLayers, setImageLayers] = useState([]);
  const [selectedLayerId, setSelectedLayerId] = useState(null);
  const [imageError, setImageError] = useState("");
  const [zipStatus, setZipStatus] = useState("");
  const [undoSnapshot, setUndoSnapshot] = useState(null);
  const [assetIndex, setAssetIndex] = useState(null);
  const [assetIndexError, setAssetIndexError] = useState("");
  const [assetQuery, setAssetQuery] = useState("");
  const [assetCategory, setAssetCategory] = useState("all");
  const [assetBundleZip, setAssetBundleZip] = useState(null);
  const [assetBundleName, setAssetBundleName] = useState("");
  const [assetStatus, setAssetStatus] = useState("");
  const [loadedPack, setLoadedPack] = useState(null);

  const activeTemplate = getTemplateById(design.templateId);
  const selectedLayer = imageLayers.find((layer) => layer.id === selectedLayerId) || null;
  const loadedAssetAnalysis = useMemo(
    () => analyzeLoadedAssets(loadedPack?.pack, loadedPack?.items || []),
    [loadedPack]
  );
  const recommendedSetupTemplates = useMemo(
    () => recommendSetupTemplates(loadedAssetAnalysis),
    [loadedAssetAnalysis]
  );
  const assetPacks = useMemo(() => assetIndex?.packs || [], [assetIndex]);

  const assetCategories = useMemo(() => {
    return Array.from(new Set(assetPacks.map((pack) => pack.category || "Uncategorized"))).sort();
  }, [assetPacks]);

  const filteredAssetPacks = useMemo(() => {
    const query = assetQuery.trim().toLowerCase();
    return assetPacks
      .filter((pack) => assetCategory === "all" || (pack.category || "Uncategorized") === assetCategory)
      .filter((pack) => !query || String(pack.searchText || "").includes(query))
      .slice(0, 30);
  }, [assetPacks, assetCategory, assetQuery]);

  useEffect(() => {
    let isMounted = true;
    fetch(ASSET_INDEX_URL)
      .then((response) => {
        if (!response.ok) throw new Error("Asset library index was not found.");
        return response.json();
      })
      .then((data) => {
        if (!isMounted) return;
        setAssetIndex(data);
        setAssetIndexError("");
      })
      .catch((error) => {
        if (!isMounted) return;
        setAssetIndexError(error.message || "Could not load asset library index.");
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (canvasRef.current) renderDesign(canvasRef.current, design, imageLayers);
  }, [design, imageLayers]);

  function captureUndo() {
    setUndoSnapshot({ imageLayers, selectedLayerId });
  }

  function undoLastImageAction() {
    if (!undoSnapshot) return;
    setImageLayers(undoSnapshot.imageLayers);
    setSelectedLayerId(undoSnapshot.selectedLayerId);
    setUndoSnapshot(null);
    setZipStatus("Undid last image action.");
  }

  function updateField(field, value) {
    setDesign((current) => ({ ...current, [field]: value }));
    setZipStatus("");
  }

  function updateSelectedLayer(field, value) {
    if (!selectedLayerId) return;
    setImageLayers((current) =>
      current.map((layer) => (layer.id === selectedLayerId ? { ...layer, [field]: value } : layer))
    );
    setZipStatus("");
  }

  function changeTemplate(templateId) {
    setDesign((current) => createDesign(templateId, current.sizePresetId || "template-default"));
    setZipStatus("");
  }

  function changeExportSize(sizePresetId) {
    setDesign((current) => ({
      ...current,
      sizePresetId,
      size: getSizeForDesign(current.templateId, sizePresetId)
    }));
    setZipStatus("");
  }

  function smartTemplateText(value) {
    return String(value || "").replaceAll(
      "{pack}",
      loadedPack?.pack?.displayName || "Selected Pack"
    );
  }

  function applySmartTemplate(recipe) {
    if (!recipe) return;

    const nextDesign = createDesign(
      recipe.baseTemplateId || design.templateId,
      recipe.sizePresetId || design.sizePresetId || "template-default"
    );

    setDesign({
      ...nextDesign,
      ...recipe.defaults,
      title: smartTemplateText(recipe.defaults?.title || nextDesign.title),
      subtitle: smartTemplateText(recipe.defaults?.subtitle || nextDesign.subtitle),
      footer: smartTemplateText(recipe.defaults?.footer || nextDesign.footer),
      smartTemplateId: recipe.id,
      smartTemplateName: recipe.name,
      setupTemplateFamily: recipe.family || "general",
      detectedPackProfile: loadedAssetAnalysis?.profileLabel || "General",
      assetRoleProfile: loadedAssetAnalysis?.roleSummary?.slice(0, 12) || []
    });

    setZipStatus(`Applied setup template: ${recipe.name}.`);
    setAssetStatus(`Setup template ready: ${recipe.name}. Click assets from the loaded pack to place them.`);
  }

  function canvasPointToPercent(event) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100),
      y: clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100),
      rect
    };
  }

  function startLayerDrag(event, layerId) {
    event.preventDefault();
    event.stopPropagation();
    const layer = imageLayers.find((item) => item.id === layerId);
    if (!layer || !canvasRef.current) return;
    captureUndo();
    setSelectedLayerId(layerId);
    const point = canvasPointToPercent(event);
    actionRef.current = {
      type: "drag",
      layerId,
      pointerId: event.pointerId,
      offsetX: point.x - Number(layer.x ?? 50),
      offsetY: point.y - Number(layer.y ?? 50)
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function startLayerResize(event, layerId) {
    event.preventDefault();
    event.stopPropagation();
    const layer = imageLayers.find((item) => item.id === layerId);
    if (!layer || !canvasRef.current) return;
    captureUndo();
    setSelectedLayerId(layerId);
    const rect = canvasRef.current.getBoundingClientRect();
    const centerX = rect.left + (Number(layer.x ?? 50) / 100) * rect.width;
    actionRef.current = { type: "resize", layerId, pointerId: event.pointerId, centerX, rect };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function startLayerRotate(event, layerId) {
    event.preventDefault();
    event.stopPropagation();
    const layer = imageLayers.find((item) => item.id === layerId);
    if (!layer || !canvasRef.current) return;
    captureUndo();
    setSelectedLayerId(layerId);
    const rect = canvasRef.current.getBoundingClientRect();
    const centerX = rect.left + (Number(layer.x ?? 50) / 100) * rect.width;
    const centerY = rect.top + (Number(layer.y ?? 50) / 100) * rect.height;
    actionRef.current = { type: "rotate", layerId, pointerId: event.pointerId, centerX, centerY };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function continueLayerAction(event) {
    const action = actionRef.current;
    if (!action) return;
    event.preventDefault();
    event.stopPropagation();
    if (action.type === "drag") {
      const point = canvasPointToPercent(event);
      setImageLayers((current) =>
        current.map((layer) =>
          layer.id === action.layerId
            ? { ...layer, x: clamp(point.x - action.offsetX, 0, 100), y: clamp(point.y - action.offsetY, 0, 100) }
            : layer
        )
      );
    }
    if (action.type === "resize") {
      const newWidthPercent = clamp((Math.abs(event.clientX - action.centerX) * 2 / action.rect.width) * 100, 5, 150);
      setImageLayers((current) =>
        current.map((layer) => (layer.id === action.layerId ? { ...layer, size: Math.round(newWidthPercent) } : layer))
      );
    }
    if (action.type === "rotate") {
      const angle = Math.atan2(event.clientY - action.centerY, event.clientX - action.centerX) * (180 / Math.PI) + 90;
      setImageLayers((current) =>
        current.map((layer) => (layer.id === action.layerId ? { ...layer, rotation: Math.round(angle) } : layer))
      );
    }
    setZipStatus("");
  }

  function stopLayerAction(event) {
    if (!actionRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    actionRef.current = null;
  }

  async function addImageLayerFromSource({ name, src, element, sourcePack = null, sourcePath = null }) {
    captureUndo();
    const id = makeId();
    const index = imageLayers.length;
    const layer = {
      id,
      name,
      src,
      element,
      sourcePack,
      sourcePath,
      x: clamp(50 + index * 4, 5, 95),
      y: clamp(50 + index * 4, 5, 95),
      size: 32,
      opacity: 100,
      rotation: 0,
      fit: "cover",
      shape: "rounded"
    };
    setImageLayers((current) => [...current, layer]);
    setSelectedLayerId(id);
    setZipStatus("");
  }

  function handleImageUpload(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const validFiles = files.filter((file) => file.type.startsWith("image/"));
    if (validFiles.length !== files.length) setImageError("Only image files were added. Non-image files were skipped.");
    else setImageError("");
    const oversized = validFiles.find((file) => file.size > 8 * 1024 * 1024);
    if (oversized) {
      setImageError("One image is over 8 MB. Try smaller files for smoother browser rendering.");
      return;
    }
    captureUndo();
    Promise.all(
      validFiles.map((file, index) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = String(reader.result || "");
            const image = new Image();
            image.onload = () => resolve({
              id: makeId(),
              name: file.name,
              src: dataUrl,
              element: image,
              x: clamp(50 + index * 4, 5, 95),
              y: clamp(50 + index * 4, 5, 95),
              size: 32,
              opacity: 100,
              rotation: 0,
              fit: "cover",
              shape: "rounded"
            });
            image.onerror = () => resolve(null);
            image.src = dataUrl;
          };
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(file);
        })
      )
    ).then((newLayers) => {
      const cleanLayers = newLayers.filter(Boolean);
      if (!cleanLayers.length) {
        setImageError("The browser could not load those images.");
        return;
      }
      setImageLayers((current) => [...current, ...cleanLayers]);
      setSelectedLayerId(cleanLayers[cleanLayers.length - 1].id);
      setZipStatus("");
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleAssetBundleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".zip")) {
      setAssetStatus("Choose assetprimary.zip or another ZIP bundle.");
      return;
    }
    try {
      setAssetStatus("Reading local asset ZIP...");
      const buffer = await file.arrayBuffer();
      const outerZip = await JSZip.loadAsync(buffer);
      setAssetBundleZip(outerZip);
      setAssetBundleName(`${file.name} (${formatBytes(file.size)})`);
      setAssetStatus("Local asset bundle attached. Search a pack, then load pack assets.");
    } catch (error) {
      setAssetStatus(error.message || "Could not read that ZIP file.");
    }
  }

  async function loadPackAssets(pack) {
    if (!assetBundleZip) {
      setAssetStatus("Attach assetprimary.zip first, then load a pack.");
      return;
    }
    try {
      setAssetStatus(`Loading ${pack.displayName}...`);
      if (loadedPack?.items?.length) {
        for (const item of loadedPack.items) URL.revokeObjectURL(item.url);
      }
      const zipEntry = assetBundleZip.file(pack.zipName);
      if (!zipEntry) throw new Error(`Could not find ${pack.zipName} in the local ZIP.`);
      const innerBlob = await zipEntry.async("blob");
      const innerZip = await JSZip.loadAsync(innerBlob);
      const imageEntries = Object.values(innerZip.files)
        .filter((entry) => !entry.dir && /\.(png|svg|jpg|jpeg|webp)$/i.test(entry.name))
        .filter((entry) => !entry.name.includes("__MACOSX"));
      const previewEntries = imageEntries.slice(0, 80);
      const items = await Promise.all(
        previewEntries.map(async (entry) => {
          const blob = await entry.async("blob");
          const url = URL.createObjectURL(blob);
          return { path: entry.name, name: entry.name.split("/").pop(), url, blob, pack };
        })
      );
      setLoadedPack({ pack, items, total: imageEntries.length });
      setAssetStatus(`Loaded ${items.length} preview assets from ${pack.displayName}. Click a thumbnail to add it.`);
    } catch (error) {
      setAssetStatus(error.message || "Could not load that pack from the local ZIP.");
    }
  }

  async function addAssetThumbnailToCanvas(item) {
    try {
      const element = await imageFromUrl(item.url);
      await addImageLayerFromSource({
        name: item.name,
        src: item.url,
        element,
        sourcePack: item.pack?.displayName || null,
        sourcePath: item.path
      });
      setAssetStatus(`Added ${item.name} to the canvas.`);
    } catch (error) {
      setAssetStatus(error.message || "Could not add that asset to the canvas.");
    }
  }

  function deleteSelectedLayer(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if (!selectedLayerId) return;
    captureUndo();
    setImageLayers((current) => current.filter((layer) => layer.id !== selectedLayerId));
    setSelectedLayerId(null);
    setZipStatus("Image layer deleted. Use Undo to restore it.");
  }

  function clearAllImages() {
    if (!imageLayers.length) return;
    captureUndo();
    setImageLayers([]);
    setSelectedLayerId(null);
    setZipStatus("All image layers cleared. Use Undo to restore them.");
  }

  function resetSelectedLayer() {
    if (!selectedLayerId) return;
    captureUndo();
    setImageLayers((current) =>
      current.map((layer) =>
        layer.id === selectedLayerId ? { ...layer, x: 50, y: 50, size: 32, opacity: 100, rotation: 0 } : layer
      )
    );
    setZipStatus("");
  }

  async function downloadPng() {
    const canvas = canvasRef.current;
    try {
      const blob = await canvasToBlob(canvas, "image/png");
      downloadBlob(blob, `asset-forge-${getDesignFileName(design)}`);
      setZipStatus("PNG ready.");
    } catch (error) {
      setZipStatus(error.message || "The browser could not export this PNG.");
    }
  }

  async function downloadCurrentPdf() {
    try {
      setZipStatus("Building PDF...");
      const pdfBlob = await renderDesignToPdfBlob(design, imageLayers);
      downloadBlob(pdfBlob, `asset-forge-${getDesignFileName(design).replace(/\.png$/, ".pdf")}`);
      setZipStatus("PDF ready.");
    } catch (error) {
      setZipStatus(error.message || "The browser could not build this PDF.");
    }
  }

  async function downloadCurrentZip() {
    try {
      setZipStatus("Building asset pack...");
      const zip = new JSZip();
      const imageBlob = await renderDesignToBlob(design, imageLayers);
      const pdfBlob = await renderDesignToPdfBlob(design, imageLayers);
      const manifest = makeManifest(design, activeTemplate, imageLayers);
      const pngName = `asset-forge-${getDesignFileName(design)}`;
      const pdfName = pngName.replace(/\.png$/, ".pdf");
      zip.file(`images/${pngName}`, imageBlob);
      zip.file(`pdf/${pdfName}`, pdfBlob);
      zip.file("metadata/manifest.json", JSON.stringify(manifest, null, 2));
      zip.file("README.txt", [
        "Goblin Asset Forge",
        "",
        `Template: ${activeTemplate.name}`,
        `Generated: ${manifest.generatedAt}`,
        "",
        "This asset pack was generated in the browser.",
        "Review text, layout, and image placement before publishing."
      ].join("\n"));
      const zipBlob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
      downloadBlob(zipBlob, `asset-forge-${activeTemplate.id}-pack.zip`);
      setZipStatus("Asset pack ready.");
    } catch (error) {
      setZipStatus(error.message || "The browser could not build the ZIP file.");
    }
  }

  async function downloadAllLayoutsZip() {
    try {
      setZipStatus("Building all layout exports...");
      const zip = new JSZip();
      const imageFolder = zip.folder("images");
      const metadataFolder = zip.folder("metadata");
      const sharedDesignData = {
        title: design.title,
        subtitle: design.subtitle,
        footer: design.footer,
        backgroundColor: design.backgroundColor,
        accentColor: design.accentColor,
        titleColor: design.titleColor,
        subtitleColor: design.subtitleColor
      };
      const manifest = {
        generator: "Goblin Asset Forge",
        version: "0.10-open-beta",
        generatedAt: new Date().toISOString(),
        exports: [],
        imageLayerCount: imageLayers.length,
        privacy: "Generated in the browser. No server upload is required for this prototype."
      };
      for (const template of templates) {
        const templateDesign = { ...createDesign(template.id, "template-default"), ...sharedDesignData };
        const blob = await renderDesignToBlob(templateDesign, imageLayers);
        const fileName = `asset-forge-${template.fileName}`;
        imageFolder.file(fileName, blob);
        manifest.exports.push({ templateId: template.id, templateName: template.name, fileName: `images/${fileName}`, width: template.size.width, height: template.size.height });
      }
      metadataFolder.file("manifest.json", JSON.stringify(manifest, null, 2));
      zip.file("README.txt", [
        "Goblin Asset Forge",
        "",
        "This ZIP contains one PNG export for every layout.",
        "",
        "Included layouts:",
        ...templates.map((template) => `- ${template.name}: ${template.size.width} x ${template.size.height}px`),
        "",
        "Generated in the browser. No paid image service is required.",
        "Review text, layout, and image placement before publishing."
      ].join("\n"));
      const zipBlob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
      downloadBlob(zipBlob, "asset-forge-all-layouts-pack.zip");
      setZipStatus("All-layout asset pack ready.");
    } catch (error) {
      setZipStatus(error.message || "The browser could not build the ZIP file.");
    }
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">Open Beta</p>
        <h1>Goblin Asset Forge</h1>
        <p>
          Create browser-only image assets. Load a Kenney pack, let Asset Forge
          detect the asset types inside it, then choose setup templates matched
          to the currently loaded content.
        </p>
      </section>

      <section className="workspace">
        <aside className="controls">
          <h2>Design controls</h2>

          <label>
            Template
            <select value={design.templateId} onChange={(event) => changeTemplate(event.target.value)}>
              {templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
            </select>
          </label>

          <p className="template-note">{activeTemplate.description}</p>

          <label>
            Export size
            <select value={design.sizePresetId || "template-default"} onChange={(event) => changeExportSize(event.target.value)}>
              {exportSizes.map((size) => <option key={size.id} value={size.id}>{size.name}</option>)}
            </select>
          </label>

          <p className="template-note size-note">Output: {design.size.width} x {design.size.height}px. Template style and export size can be mixed.</p>

          <div className="asset-library-panel">
            <h3>Asset Library</h3>
            {assetIndex ? (
              <p className="library-summary">{assetIndex.packCount} packs indexed. {assetIndex.imageAssetCount?.toLocaleString()} image assets searchable by pack.</p>
            ) : (
              <p className="library-summary">Loading lightweight asset index...</p>
            )}
            {assetIndexError ? <p className="error-note">{assetIndexError}</p> : null}

            <label>
              Attach local assetprimary.zip
              <input type="file" accept=".zip,application/zip" onChange={handleAssetBundleUpload} />
            </label>
            <p className="upload-hint">
              The search index is built in. The large asset ZIP stays local on your computer and is only read when you choose it here.
            </p>
            {assetBundleName ? <p className="status-note">Attached: {assetBundleName}</p> : null}

            <label>
              Search packs
              <input value={assetQuery} onChange={(event) => setAssetQuery(event.target.value)} placeholder="Try swords, UI, animals, tiles, platformer..." />
            </label>

            <label>
              Category
              <select value={assetCategory} onChange={(event) => setAssetCategory(event.target.value)}>
                <option value="all">All categories</option>
                {assetCategories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </label>

            <div className="pack-results">
              {filteredAssetPacks.map((pack) => (
                <article className="pack-card" key={pack.id}>
                  <div>
                    <h4>{pack.displayName}</h4>
                    <p>{pack.description || pack.category}</p>
                    <small>{pack.zipName} - {pack.imageCount?.toLocaleString()} images - {pack.license}</small>
                  </div>
                  <button type="button" className="secondary-button" onClick={() => loadPackAssets(pack)}>
                    Load pack assets
                  </button>
                </article>
              ))}
            </div>

            {loadedPack ? (
              <div className="loaded-pack-panel">
                <h4>{loadedPack.pack.displayName}</h4>
                <p className="upload-hint">Showing {loadedPack.items.length} of {loadedPack.total.toLocaleString()} assets. Click a thumbnail to add it to the canvas.</p>
                <div className="asset-thumb-grid">
                  {loadedPack.items.map((item) => (
                    <button type="button" className="asset-thumb" key={item.path} title={item.path} onClick={() => addAssetThumbnailToCanvas(item)}>
                      <img src={item.url} alt="" loading="lazy" />
                      <span>{item.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {loadedPack ? (
              <div className="setup-template-panel">
                <div className="panel-title-row">
                  <div>
                    <h4>Setup templates for current assets</h4>
                    <p className="upload-hint">
                      Detected: <strong>{loadedAssetAnalysis.profileLabel}</strong> from
                      {" "}{loadedAssetAnalysis.totalAssets.toLocaleString()} loaded preview assets.
                    </p>
                  </div>
                </div>

                {loadedAssetAnalysis.roleSummary.length ? (
                  <div className="role-chip-row" aria-label="Detected asset roles">
                    {loadedAssetAnalysis.roleSummary.slice(0, 12).map((role) => (
                      <span className="role-chip" key={role.role}>
                        {role.label} <strong>{role.count}</strong>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="upload-hint">No strong roles detected yet. Generic pack templates are available.</p>
                )}

                <div className="smart-template-grid">
                  {recommendedSetupTemplates.map((recipe) => (
                    <button
                      type="button"
                      className="smart-template-card"
                      key={recipe.id}
                      onClick={() => applySmartTemplate(recipe)}
                    >
                      <span>{recipe.name}</span>
                      <small>{recipe.description}</small>
                      <em>Matches: {recipe.matchedRoles.length ? recipe.matchedRoles.slice(0, 5).join(", ") : "general pack setup"}</em>
                      <b>{recipe.matchLabel}</b>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {assetStatus ? <p className="status-note">{assetStatus}</p> : null}
          </div>

          <label>
            Title / Main text
            <textarea value={design.title} onChange={(event) => updateField("title", event.target.value)} rows="3" />
          </label>

          <label>
            Subtitle / Details
            <textarea value={design.subtitle} onChange={(event) => updateField("subtitle", event.target.value)} rows="3" />
          </label>

          <label>
            Footer
            <input value={design.footer} onChange={(event) => updateField("footer", event.target.value)} />
          </label>

          <div className="upload-panel">
            <label>
              Upload your own image layers
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} />
            </label>
            <p className="upload-hint">Add one or more images. Select a layer on the preview, then drag, resize, or rotate it.</p>
            {imageError ? <p className="error-note">{imageError}</p> : null}
          </div>

          {imageLayers.length ? (
            <div className="image-controls">
              <h3>Image layers</h3>
              <label>
                Selected layer
                <select value={selectedLayerId || ""} onChange={(event) => setSelectedLayerId(event.target.value)}>
                  <option value="">Choose a layer</option>
                  {imageLayers.map((layer, index) => <option key={layer.id} value={layer.id}>{index + 1}. {layer.name}</option>)}
                </select>
              </label>
              {selectedLayer ? (
                <>
                  <p className="drag-note">Drag the layer. Use the yellow corner to resize and the blue top handle to rotate.</p>
                  {selectedLayer.sourcePack ? <p className="upload-hint">From: {selectedLayer.sourcePack} / {selectedLayer.sourcePath}</p> : null}
                  <label>Fit<select value={selectedLayer.fit || "cover"} onChange={(event) => updateSelectedLayer("fit", event.target.value)}><option value="cover">Cover cropped frame</option><option value="contain">Contain full image</option></select></label>
                  <label>Shape<select value={selectedLayer.shape || "rounded"} onChange={(event) => updateSelectedLayer("shape", event.target.value)}><option value="original">Original rectangle</option><option value="rounded">Rounded rectangle</option><option value="circle">Circle crop</option></select></label>
                  <label>Size <span>{selectedLayer.size ?? 32}%</span><input type="range" min="5" max="150" value={selectedLayer.size ?? 32} onChange={(event) => updateSelectedLayer("size", Number(event.target.value))} /></label>
                  <label>Rotation <span>{selectedLayer.rotation ?? 0} deg</span><input type="range" min="-180" max="180" value={selectedLayer.rotation ?? 0} onChange={(event) => updateSelectedLayer("rotation", Number(event.target.value))} /></label>
                  <label>Opacity <span>{selectedLayer.opacity ?? 100}%</span><input type="range" min="10" max="100" value={selectedLayer.opacity ?? 100} onChange={(event) => updateSelectedLayer("opacity", Number(event.target.value))} /></label>
                  <div className="layer-action-grid"><button type="button" className="secondary-button" onClick={resetSelectedLayer}>Reset selected layer</button><button type="button" className="secondary-button danger-button" onClick={deleteSelectedLayer}>Delete selected layer</button></div>
                </>
              ) : null}
              <div className="layer-action-grid lower-grid"><button type="button" className="secondary-button" onClick={undoLastImageAction} disabled={!undoSnapshot}>Undo last image action</button><button type="button" className="secondary-button danger-button" onClick={clearAllImages}>Clear all images</button></div>
            </div>
          ) : null}

          <div className="color-grid">
            <label>Background<input type="color" value={design.backgroundColor} onChange={(event) => updateField("backgroundColor", event.target.value)} /></label>
            <label>Accent<input type="color" value={design.accentColor} onChange={(event) => updateField("accentColor", event.target.value)} /></label>
            <label>Title<input type="color" value={design.titleColor} onChange={(event) => updateField("titleColor", event.target.value)} /></label>
            <label>Subtitle<input type="color" value={design.subtitleColor} onChange={(event) => updateField("subtitleColor", event.target.value)} /></label>
          </div>

          <button type="button" onClick={downloadPng}>Download PNG</button>
          <button type="button" className="secondary-button single-export-button" onClick={downloadCurrentPdf}>Download PDF</button>
          <div className="export-grid"><button type="button" className="secondary-button" onClick={downloadCurrentZip}>Download current as ZIP</button><button type="button" className="secondary-button" onClick={downloadAllLayoutsZip}>Export current design in all layouts</button></div>
          {zipStatus ? <p className="status-note">{zipStatus}</p> : null}
          <p className="privacy-note">Browser-only prototype: your design renders on your device. No upload, account, or paid image service is needed for this version.</p>
        </aside>

        <section className="preview-panel">
          <div className="preview-head"><div><h2>{activeTemplate.name}</h2><p>{design.size.width} x {design.size.height}px</p></div></div>
          <div className="canvas-frame">
            <div className="canvas-stage">
              <canvas ref={canvasRef} aria-label="Asset preview canvas" />
              {imageLayers.map((layer) => (
                <div key={layer.id} className={`image-layer-outline ${layer.id === selectedLayerId ? "is-selected" : ""}`} style={getLayerStyle(layer)} onPointerDown={(event) => startLayerDrag(event, layer.id)} onPointerMove={continueLayerAction} onPointerUp={stopLayerAction} onPointerCancel={stopLayerAction}>
                  {layer.id === selectedLayerId ? (
                    <>
                      <button type="button" className="image-delete-button" aria-label="Delete image layer" onPointerDown={(event) => event.stopPropagation()} onClick={deleteSelectedLayer}>X</button>
                      <div className="image-rotate-handle" aria-label="Rotate image layer" role="button" tabIndex={0} onPointerDown={(event) => startLayerRotate(event, layer.id)} onPointerMove={continueLayerAction} onPointerUp={stopLayerAction} onPointerCancel={stopLayerAction} />
                      <div className="image-resize-handle" aria-label="Resize image layer" role="button" tabIndex={0} onPointerDown={(event) => startLayerResize(event, layer.id)} onPointerMove={continueLayerAction} onPointerUp={stopLayerAction} onPointerCancel={stopLayerAction} />
                    </>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
