import { useEffect, useRef, useState } from "react";
import "./App.css";

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
      subtitle: "Date • Time • Location • Details",
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
      subtitle: "— Source or reference",
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

function getTemplateById(id) {
  return templates.find((template) => template.id === id) || templates[0];
}

function createDesign(templateId) {
  const template = getTemplateById(templateId);

  return {
    templateId: template.id,
    size: template.size,
    layout: template.layout,
    fileName: template.fileName,
    ...template.defaults
  };
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
  ctx.font = "bold 96px Georgia, serif";
  drawWrappedText(ctx, design.title, 90, 330, width - 180, 108, 4);

  ctx.fillStyle = design.subtitleColor;
  ctx.font = "42px Arial, sans-serif";
  drawWrappedText(ctx, design.subtitle, 94, 585, width - 188, 56, 4);

  ctx.fillStyle = "rgba(255,255,255,0.82)";
  ctx.font = "28px Arial, sans-serif";
  ctx.fillText(design.footer, 94, height - 120);
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

  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = design.titleColor;
  ctx.font = "bold 88px Arial Black, Impact, sans-serif";
  drawWrappedText(ctx, design.title, 72, 135, width * 0.64, 94, 4);

  ctx.fillStyle = design.subtitleColor;
  ctx.font = "40px Arial, sans-serif";
  drawWrappedText(ctx, design.subtitle, 78, 470, width * 0.58, 52, 2);

  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = "bold 28px Arial, sans-serif";
  ctx.fillText(design.footer, 78, height - 82);

  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.fillRect(width - 300, 85, 190, 190);
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = "bold 78px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("?", width - 205, 136);
}

function drawFlyer(ctx, design) {
  const { width, height } = design.size;

  drawSoftTexture(ctx, width, height, design.accentColor);

  ctx.fillStyle = design.accentColor;
  ctx.fillRect(0, 0, width, 150);

  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.fillRect(48, 198, width - 96, height - 360);

  drawBorder(ctx, width, height);

  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = design.titleColor;
  ctx.font = "bold 72px Georgia, serif";
  drawWrappedText(ctx, design.title, 70, 230, width - 140, 82, 5);

  ctx.fillStyle = design.subtitleColor;
  ctx.font = "36px Arial, sans-serif";
  drawWrappedText(ctx, design.subtitle, 72, 560, width - 144, 50, 6);

  ctx.fillStyle = "rgba(0,0,0,0.24)";
  ctx.fillRect(0, height - 160, width, 160);

  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = "28px Arial, sans-serif";
  drawWrappedText(ctx, design.footer, 70, height - 118, width - 140, 36, 3);
}

function drawQuoteCard(ctx, design) {
  const { width, height } = design.size;

  drawSoftTexture(ctx, width, height, design.accentColor);

  ctx.fillStyle = design.accentColor;
  ctx.globalAlpha = 0.18;
  ctx.beginPath();
  ctx.arc(width * 0.5, height * 0.36, 330, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  drawBorder(ctx, width, height);

  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  ctx.fillStyle = design.accentColor;
  ctx.font = "bold 160px Georgia, serif";
  ctx.fillText("“", width / 2, 120);

  ctx.fillStyle = design.titleColor;
  ctx.font = "bold 70px Georgia, serif";
  drawWrappedText(ctx, design.title, width / 2, 350, width - 180, 86, 7);

  ctx.fillStyle = design.subtitleColor;
  ctx.font = "36px Arial, sans-serif";
  drawWrappedText(ctx, design.subtitle, width / 2, 960, width - 180, 50, 3);

  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = "26px Arial, sans-serif";
  ctx.fillText(design.footer, width / 2, height - 120);
}

function getInitials(text) {
  const cleaned = String(text || "CG").trim();

  if (cleaned.length <= 4) return cleaned.toUpperCase();

  return cleaned
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function drawLogoBadge(ctx, design) {
  const { width, height } = design.size;
  const centerX = width / 2;
  const centerY = height / 2;

  drawSoftTexture(ctx, width, height, design.accentColor);

  ctx.strokeStyle = design.accentColor;
  ctx.lineWidth = 22;
  ctx.beginPath();
  ctx.arc(centerX, centerY, width * 0.34, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(centerX, centerY, width * 0.4, 0, Math.PI * 2);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = design.titleColor;
  ctx.font = "bold 190px Georgia, serif";
  ctx.fillText(getInitials(design.title), centerX, centerY - 28);

  ctx.textBaseline = "top";
  ctx.fillStyle = design.subtitleColor;
  ctx.font = "bold 42px Arial, sans-serif";
  drawWrappedText(ctx, design.subtitle, centerX, centerY + 190, width - 220, 52, 2);

  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "24px Arial, sans-serif";
  ctx.fillText(design.footer, centerX, height - 105);
}

function renderDesign(canvas, design) {
  const ctx = canvas.getContext("2d");
  const { width, height } = design.size;

  canvas.width = width;
  canvas.height = height;

  ctx.fillStyle = design.backgroundColor;
  ctx.fillRect(0, 0, width, height);

  if (design.layout === "thumbnail") {
    drawThumbnail(ctx, design);
  } else if (design.layout === "flyer") {
    drawFlyer(ctx, design);
  } else if (design.layout === "quoteCard") {
    drawQuoteCard(ctx, design);
  } else if (design.layout === "logoBadge") {
    drawLogoBadge(ctx, design);
  } else {
    drawSquarePost(ctx, design);
  }
}

export default function App() {
  const canvasRef = useRef(null);
  const [design, setDesign] = useState(() => createDesign("square-post"));

  const activeTemplate = getTemplateById(design.templateId);

  useEffect(() => {
    if (canvasRef.current) {
      renderDesign(canvasRef.current, design);
    }
  }, [design]);

  function updateField(field, value) {
    setDesign((current) => ({
      ...current,
      [field]: value
    }));
  }

  function changeTemplate(templateId) {
    setDesign(createDesign(templateId));
  }

  function downloadPng() {
    const canvas = canvasRef.current;

    canvas.toBlob((blob) => {
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `asset-forge-${design.fileName}`;
      link.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">Open Beta</p>
        <h1>Goblin Asset Forge</h1>
        <p>
          Create simple browser-only image assets without paid design services.
          Choose a template, customize the text and colors, then export a PNG.
        </p>
      </section>

      <section className="workspace">
        <aside className="controls">
          <h2>Design controls</h2>

          <label>
            Template
            <select
              value={design.templateId}
              onChange={(event) => changeTemplate(event.target.value)}
            >
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </label>

          <p className="template-note">{activeTemplate.description}</p>

          <label>
            Title / Main text
            <textarea
              value={design.title}
              onChange={(event) => updateField("title", event.target.value)}
              rows="3"
            />
          </label>

          <label>
            Subtitle / Details
            <textarea
              value={design.subtitle}
              onChange={(event) => updateField("subtitle", event.target.value)}
              rows="3"
            />
          </label>

          <label>
            Footer
            <input
              value={design.footer}
              onChange={(event) => updateField("footer", event.target.value)}
            />
          </label>

          <div className="color-grid">
            <label>
              Background
              <input
                type="color"
                value={design.backgroundColor}
                onChange={(event) =>
                  updateField("backgroundColor", event.target.value)
                }
              />
            </label>

            <label>
              Accent
              <input
                type="color"
                value={design.accentColor}
                onChange={(event) =>
                  updateField("accentColor", event.target.value)
                }
              />
            </label>

            <label>
              Title
              <input
                type="color"
                value={design.titleColor}
                onChange={(event) =>
                  updateField("titleColor", event.target.value)
                }
              />
            </label>

            <label>
              Subtitle
              <input
                type="color"
                value={design.subtitleColor}
                onChange={(event) =>
                  updateField("subtitleColor", event.target.value)
                }
              />
            </label>
          </div>

          <button type="button" onClick={downloadPng}>
            Download PNG
          </button>

          <p className="privacy-note">
            Browser-only prototype: the design renders on your device. No upload
            or paid image service is needed for this version.
          </p>
        </aside>

        <section className="preview-panel">
          <div className="preview-head">
            <div>
              <h2>{activeTemplate.name}</h2>
              <p>
                {design.size.width} × {design.size.height}px
              </p>
            </div>
          </div>

          <div className="canvas-frame">
            <canvas ref={canvasRef} aria-label="Asset preview canvas" />
          </div>
        </section>
      </section>
    </main>
  );
}
