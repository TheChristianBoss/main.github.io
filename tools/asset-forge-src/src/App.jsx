import { useEffect, useRef, useState } from "react";
import "./App.css";

const defaultDesign = {
  size: { width: 1080, height: 1080 },
  title: "Your Title Here",
  subtitle: "Subtitle or short description",
  footer: "Made with Goblin Asset Forge",
  backgroundColor: "#111827",
  accentColor: "#facc15",
  titleColor: "#ffffff",
  subtitleColor: "#facc15"
};

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  let currentY = y;

  for (const word of words) {
    const testLine = line + word + " ";
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && line !== "") {
      ctx.fillText(line.trim(), x, currentY);
      line = word + " ";
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }

  ctx.fillText(line.trim(), x, currentY);
}

function renderDesign(canvas, design) {
  const ctx = canvas.getContext("2d");
  const { width, height } = design.size;

  canvas.width = width;
  canvas.height = height;

  ctx.fillStyle = design.backgroundColor;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = design.accentColor;
  ctx.beginPath();
  ctx.arc(width - 170, 170, 95, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.lineWidth = 8;
  ctx.strokeRect(46, 46, width - 92, height - 92);

  ctx.fillStyle = design.titleColor;
  ctx.font = "bold 96px Georgia, serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  drawWrappedText(ctx, design.title, 90, 330, width - 180, 108);

  ctx.fillStyle = design.subtitleColor;
  ctx.font = "42px Arial, sans-serif";
  drawWrappedText(ctx, design.subtitle, 94, 575, width - 188, 56);

  ctx.fillStyle = "rgba(255,255,255,0.82)";
  ctx.font = "28px Arial, sans-serif";
  ctx.fillText(design.footer, 94, height - 120);
}

export default function App() {
  const canvasRef = useRef(null);
  const [design, setDesign] = useState(defaultDesign);

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

  function downloadPng() {
    const canvas = canvasRef.current;

    canvas.toBlob((blob) => {
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "asset-forge-square.png";
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
          This first version renders one customizable square image.
        </p>
      </section>

      <section className="workspace">
        <aside className="controls">
          <h2>Design controls</h2>

          <label>
            Title
            <textarea
              value={design.title}
              onChange={(event) => updateField("title", event.target.value)}
              rows="3"
            />
          </label>

          <label>
            Subtitle
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
        </aside>

        <section className="preview-panel">
          <div className="canvas-frame">
            <canvas ref={canvasRef} aria-label="Asset preview canvas" />
          </div>
        </section>
      </section>
    </main>
  );
}
