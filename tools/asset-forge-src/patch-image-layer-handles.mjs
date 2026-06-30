import fs from "node:fs";

const appPath = "./src/App.jsx";
const cssPath = "./src/App.css";

let code = fs.readFileSync(appPath, "utf8");

if (!code.includes("function getImageLayerStyle")) {
  const helper = `

function getImageLayerStyle(design, userImage) {
  if (!userImage?.element) return undefined;

  const settings = design.imageSettings || {};
  const image = userImage.element;
  const imageWidth = image.naturalWidth || image.width || 1;
  const imageHeight = image.naturalHeight || image.height || 1;
  const shape = settings.shape || "rounded";
  const widthPercent = clamp(Number(settings.size ?? 32), 5, 150);

  return {
    left: \`\${clamp(Number(settings.x ?? 50), 0, 100)}%\`,
    top: \`\${clamp(Number(settings.y ?? 50), 0, 100)}%\`,
    width: \`\${widthPercent}%\`,
    aspectRatio: shape === "circle" ? "1 / 1" : \`\${imageWidth} / \${imageHeight}\`,
    borderRadius:
      shape === "circle" ? "999px" : shape === "rounded" ? "24px" : "6px"
  };
}
`;

  const insertBefore = "function makeManifest";
  if (!code.includes(insertBefore)) {
    throw new Error("Could not find makeManifest() insertion point.");
  }

  code = code.replace(insertBefore, helper + "\n" + insertBefore);
}

if (!code.includes("const resizeRef = useRef(null);")) {
  code = code.replace(
    "  const fileInputRef = useRef(null);",
    `  const fileInputRef = useRef(null);
  const resizeRef = useRef(null);`
  );
}

if (!code.includes("const [isResizingImage, setIsResizingImage]")) {
  code = code.replace(
    '  const [isDraggingImage, setIsDraggingImage] = useState(false);',
    `  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [isResizingImage, setIsResizingImage] = useState(false);
  const [undoSnapshot, setUndoSnapshot] = useState(null);`
  );
}

if (!code.includes("function captureImageUndo")) {
  const functions = `

  function captureImageUndo() {
    setUndoSnapshot({
      userImage,
      imageSettings: {
        ...(design.imageSettings || {})
      }
    });
  }

  function undoLastImageAction() {
    if (!undoSnapshot) return;

    setUserImage(undoSnapshot.userImage);
    setDesign((current) => ({
      ...current,
      imageSettings: {
        ...(undoSnapshot.imageSettings || current.imageSettings || {})
      }
    }));
    setUndoSnapshot(null);
    setZipStatus("Undid last image action.");
  }

  function deleteImageLayer(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    if (!userImage) return;

    captureImageUndo();
    setUserImage(null);
    setZipStatus("Image layer deleted. Use Undo to restore it.");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }
`;

  const insertBefore = "\n  function updateField(field, value)";
  if (!code.includes(insertBefore)) {
    throw new Error("Could not find updateField() insertion point.");
  }

  code = code.replace(insertBefore, functions + insertBefore);
}

if (!code.includes("function startImageResize")) {
  const resizeFunctions = `

  function startImageResize(event) {
    if (!userImage || !canvasRef.current) return;

    event.preventDefault();
    event.stopPropagation();

    captureImageUndo();
    setIsResizingImage(true);

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const settings = design.imageSettings || {};

    resizeRef.current = {
      pointerId: event.pointerId,
      centerX: rect.left + (Number(settings.x ?? 50) / 100) * rect.width,
      centerY: rect.top + (Number(settings.y ?? 50) / 100) * rect.height,
      rect
    };

    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function continueImageResize(event) {
    if (!isResizingImage || !resizeRef.current) return;

    event.preventDefault();
    event.stopPropagation();

    const { centerX, rect } = resizeRef.current;
    const newWidthPercent = clamp(
      (Math.abs(event.clientX - centerX) * 2 / rect.width) * 100,
      5,
      150
    );

    setDesign((current) => ({
      ...current,
      imageSettings: {
        ...(current.imageSettings || {}),
        size: Math.round(newWidthPercent)
      }
    }));
    setZipStatus("");
  }

  function stopImageResize(event) {
    if (!isResizingImage) return;

    event.preventDefault();
    event.stopPropagation();

    setIsResizingImage(false);
    resizeRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  }
`;

  const insertAfter = /  function stopImageDrag\(event\) \{[\s\S]*?\n  \}/;

  if (!insertAfter.test(code)) {
    throw new Error("Could not find stopImageDrag() insertion point.");
  }

  code = code.replace(insertAfter, (match) => match + resizeFunctions);
}

code = code.replace(
  "  function startImageDrag(event) {\n    if (!userImage) return;",
  `  function startImageDrag(event) {
    if (!userImage) return;

    captureImageUndo();`
);

if (!code.includes("className=\"canvas-stage\"")) {
  const canvasBlockRegex =
    /          <div className="canvas-frame">[\s\S]*?          <\/div>\r?\n        <\/section>/;

  if (!canvasBlockRegex.test(code)) {
    throw new Error("Could not find canvas-frame block.");
  }

  const newCanvasBlock = `          <div className="canvas-frame">
            <div className="canvas-stage">
              <canvas
                ref={canvasRef}
                className={userImage ? "drag-canvas" : ""}
                aria-label="Asset preview canvas"
                onPointerDown={startImageDrag}
                onPointerMove={continueImageDrag}
                onPointerUp={stopImageDrag}
                onPointerCancel={stopImageDrag}
                onPointerLeave={stopImageDrag}
              />

              {userImage ? (
                <div
                  className="image-layer-outline"
                  style={getImageLayerStyle(design, userImage)}
                  onPointerDown={startImageDrag}
                  onPointerMove={continueImageDrag}
                  onPointerUp={stopImageDrag}
                  onPointerCancel={stopImageDrag}
                >
                  <button
                    type="button"
                    className="image-delete-button"
                    aria-label="Delete image layer"
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={deleteImageLayer}
                  >
                    ×
                  </button>

                  <div
                    className="image-resize-handle"
                    aria-label="Resize image layer"
                    role="button"
                    tabIndex={0}
                    onPointerDown={startImageResize}
                    onPointerMove={continueImageResize}
                    onPointerUp={stopImageResize}
                    onPointerCancel={stopImageResize}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </section>`;

  code = code.replace(canvasBlockRegex, newCanvasBlock);
}

if (!code.includes("Undo last image move")) {
  code = code.replace(
    `              <button
                type="button"
                className="secondary-button"
                onClick={resetImagePosition}
              >
                Reset image layer
              </button>`,
    `              <div className="layer-action-grid">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={resetImagePosition}
                >
                  Reset image layer
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={undoLastImageAction}
                  disabled={!undoSnapshot}
                >
                  Undo last image move
                </button>

                <button
                  type="button"
                  className="secondary-button danger-button"
                  onClick={deleteImageLayer}
                >
                  Delete image layer
                </button>
              </div>`
  );
}

fs.writeFileSync(appPath, code, "utf8");

let css = fs.readFileSync(cssPath, "utf8");

if (!css.includes(".canvas-stage")) {
  css += `

.canvas-stage {
  position: relative;
  display: inline-block;
  max-width: 100%;
}

.canvas-stage canvas {
  display: block;
}

.image-layer-outline {
  position: absolute;
  transform: translate(-50%, -50%);
  border: 2px solid #facc15;
  box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.7), 0 0 18px rgba(250, 204, 21, 0.35);
  z-index: 5;
  touch-action: none;
  cursor: move;
  pointer-events: auto;
}

.image-delete-button {
  position: absolute;
  top: -16px;
  right: -16px;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  min-width: 30px;
  padding: 0;
  border-radius: 999px;
  color: #fff;
  background: #dc2626;
  border: 2px solid rgba(255, 255, 255, 0.85);
  font-size: 20px;
  line-height: 1;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
  cursor: pointer;
}

.image-resize-handle {
  position: absolute;
  right: -12px;
  bottom: -12px;
  width: 26px;
  height: 26px;
  border-radius: 7px;
  background: #facc15;
  border: 2px solid #111827;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.38);
  cursor: nwse-resize;
}

.layer-action-grid {
  display: grid;
  gap: 10px;
}

.danger-button {
  color: #fff;
  background: rgba(220, 38, 38, 0.74);
  border-color: rgba(254, 202, 202, 0.38);
}

button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
`;
}

fs.writeFileSync(cssPath, css, "utf8");

console.log("Image layer handles patch applied.");
