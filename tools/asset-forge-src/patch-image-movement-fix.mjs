import fs from "node:fs";

const appPath = "./src/App.jsx";
let code = fs.readFileSync(appPath, "utf8");

const start = code.indexOf("function drawImageFrame");
const end = code.indexOf("function drawSoftTexture");

if (start === -1 || end === -1 || end <= start) {
  throw new Error("Could not find drawImageFrame() block.");
}

const newDrawImageFrame = `function drawImageFrame(ctx, userImage, x, y, width, height, options = {}) {
  if (!userImage?.element) return;

  const adjustments = options.adjustments || {};

  const radius = options.radius ?? 28;
  const requestedFit = adjustments.fit && adjustments.fit !== "auto"
    ? adjustments.fit
    : options.mode ?? "cover";

  const requestedShape = adjustments.shape || "auto";
  const circle =
    requestedShape === "circle"
      ? true
      : requestedShape === "rounded"
        ? false
        : options.circle ?? false;

  const scaleValue = Number(adjustments.scale ?? 100) / 100;
  const safeScale = Number.isFinite(scaleValue)
    ? Math.max(0.4, Math.min(2.5, scaleValue))
    : 1;

  const xValue = Number(adjustments.x ?? 0);
  const yValue = Number(adjustments.y ?? 0);
  const safeX = Number.isFinite(xValue) ? Math.max(-100, Math.min(100, xValue)) : 0;
  const safeY = Number.isFinite(yValue) ? Math.max(-100, Math.min(100, yValue)) : 0;

  const opacityValue = Number(adjustments.opacity ?? 100) / 100;
  const safeOpacity = Number.isFinite(opacityValue)
    ? Math.max(0.1, Math.min(1, opacityValue))
    : 1;

  const image = userImage.element;
  const imageWidth = image.naturalWidth || image.width;
  const imageHeight = image.naturalHeight || image.height;

  if (!imageWidth || !imageHeight) return;

  ctx.save();

  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 14;

  if (circle) {
    ctx.beginPath();
    ctx.arc(x + width / 2, y + height / 2, Math.min(width, height) / 2, 0, Math.PI * 2);
    ctx.closePath();
  } else {
    roundedRect(ctx, x, y, width, height, radius);
  }

  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fill();
  ctx.clip();

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.globalAlpha *= safeOpacity;

  const imageRatio = imageWidth / imageHeight;
  const boxRatio = width / height;

  let baseDrawWidth;
  let baseDrawHeight;

  if (requestedFit === "contain") {
    const containScale = Math.min(width / imageWidth, height / imageHeight);
    baseDrawWidth = imageWidth * containScale;
    baseDrawHeight = imageHeight * containScale;
  } else {
    if (imageRatio > boxRatio) {
      baseDrawHeight = height;
      baseDrawWidth = height * imageRatio;
    } else {
      baseDrawWidth = width;
      baseDrawHeight = width / imageRatio;
    }
  }

  const drawWidth = baseDrawWidth * safeScale;
  const drawHeight = baseDrawHeight * safeScale;

  const maxOffsetX = width * 0.75;
  const maxOffsetY = height * 0.75;

  const drawX = x + (width - drawWidth) / 2 + (safeX / 100) * maxOffsetX;
  const drawY = y + (height - drawHeight) / 2 + (safeY / 100) * maxOffsetY;

  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);

  ctx.restore();

  ctx.save();

  if (circle) {
    ctx.beginPath();
    ctx.arc(x + width / 2, y + height / 2, Math.min(width, height) / 2, 0, Math.PI * 2);
    ctx.closePath();
  } else {
    roundedRect(ctx, x, y, width, height, radius);
  }

  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = Math.max(4, width * 0.012);
  ctx.stroke();
  ctx.restore();
}

`;

code = code.slice(0, start) + newDrawImageFrame + code.slice(end);

// Make sure every template image frame receives the slider settings.
code = code.replace(
  /mode: "cover"(,?\r?\n\s*adjustments: design\.imageSettings)?/g,
  'mode: "cover",\n      adjustments: design.imageSettings'
);

code = code.replace(
  /mode: "contain"(,?\r?\n\s*adjustments: design\.imageSettings)?/g,
  'mode: "contain",\n      adjustments: design.imageSettings'
);

fs.writeFileSync(appPath, code, "utf8");

console.log("Image movement fix applied.");
