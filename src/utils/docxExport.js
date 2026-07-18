// ─── DOCX EXPORT ─────────────────────────────────────────────────────────────

const knownSections = [
  "summary", "professional summary", "objective", "profile",
  "skills", "technical skills", "core competencies", "technologies",
  "experience", "professional experience", "work experience", "employment",
  "education", "certifications", "certifications & training", "training",
  "projects", "volunteer", "awards", "publications", "references",
  "additional", "languages", "interests",
];

const parseResumeStructure = (text) => {
  const lines = text.split("\n");
  const blocks = [];
  let nameFound = false;
  let contactFound = false;

  lines.forEach((raw) => {
    const line = raw.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      blocks.push({ type: "spacer", text: "" });
      return;
    }

    if (!nameFound && !contactFound) {
      const looksLikeName =
        trimmed.length < 50 &&
        !/[@()\d]/.test(trimmed) &&
        /^[A-Z]/.test(trimmed) &&
        trimmed.split(" ").length <= 5;
      if (looksLikeName) {
        blocks.push({ type: "name", text: trimmed });
        nameFound = true;
        return;
      }
    }

    if (nameFound && !contactFound) {
      const isContact =
        /@/.test(trimmed) ||
        /\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/.test(trimmed) ||
        /,\s*[A-Z]{2}/.test(trimmed) ||
        /linkedin|github/i.test(trimmed) ||
        (trimmed.includes("|") &&
          trimmed.split("|").length >= 2 &&
          trimmed.split("|").some((p) => /@/.test(p) || /\d{3}/.test(p)));
      if (isContact) {
        const normalized = trimmed.replace(/\s*\|\s*/g, "   |   ").replace(/\s{4,}/g, "   |   ");
        blocks.push({ type: "contact", text: normalized });
        contactFound = true;
        return;
      }
    }

    const lower = trimmed.toLowerCase().replace(/[^a-z &]/g, "");
    if (knownSections.includes(lower) || knownSections.some((s) => lower === s + "s")) {
      blocks.push({ type: "heading", text: trimmed.toUpperCase() });
      return;
    }

    if (/^[-•*·▪▸]\s+/.test(trimmed) || /^[a-z]?\d+\.\s+/i.test(trimmed)) {
      blocks.push({ type: "bullet", text: trimmed.replace(/^[-•*·▪▸]\s+/, "").replace(/^\d+\.\s+/, "") });
      return;
    }

    const hasDates =
      /\d{4}/.test(trimmed) &&
      (/present|current/i.test(trimmed) || /[–—-]/.test(trimmed) || /\d{4}\s*[-–—]\s*\d{4}/.test(trimmed));
    const hasLocation = /,\s*[A-Z]{2}\b/.test(trimmed) || /remote/i.test(trimmed);
    if (hasDates || (hasLocation && trimmed.length < 80)) {
      blocks.push({ type: "meta", text: trimmed });
      return;
    }

    blocks.push({ type: "body", text: trimmed });
  });

  return blocks;
};

export const exportToDOCX = async (resumeText, filename = "resume") => {
  try {
    const {
      Document, Packer, Paragraph, TextRun, BorderStyle,
      AlignmentType, TabStopType, convertInchesToTwip,
    } = await import("docx");

    const FONT    = "Calibri";
    const PAGE_W  = convertInchesToTwip(8.5);
    const PAGE_H  = convertInchesToTwip(11);
    const MARGIN  = convertInchesToTwip(0.85);

    // Colors chosen for printed white-background output (not dark-theme)
    const COLOR_NAME    = "111111";
    const COLOR_CONTACT = "555555";
    const COLOR_HEADING = "111111";
    const COLOR_META    = "222222";
    const COLOR_BODY    = "1a1a1a";
    const COLOR_BULLET_DOT = "999999"; // accessible gray on white

    const blocks = parseResumeStructure(resumeText);
    const children = [];
    let lastType = null;

    blocks.forEach((block) => {
      if (block.type === "spacer") {
        if (lastType === "spacer" || lastType === "heading" || lastType === "name" || lastType === "contact") return;
        children.push(new Paragraph({ spacing: { before: 80, after: 0 } }));
        lastType = "spacer";
        return;
      }

      if (block.type === "name") {
        children.push(new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 40 },
          children: [new TextRun({ text: block.text, font: FONT, size: 36, bold: true, color: COLOR_NAME })],
        }));
      } else if (block.type === "contact") {
        children.push(new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 60 },
          children: [new TextRun({ text: block.text, font: FONT, size: 19, color: COLOR_CONTACT })],
        }));
      } else if (block.type === "heading") {
        children.push(new Paragraph({
          spacing: { before: 160, after: 40 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "cccccc", space: 4 } },
          children: [new TextRun({ text: block.text, font: FONT, size: 21, bold: true, color: COLOR_HEADING, allCaps: true })],
        }));
      } else if (block.type === "meta") {
        const parts = block.text.split(/\s{2,}|\s*[|·—]\s*/).map((p) => p.trim()).filter(Boolean);
        if (parts.length >= 2) {
          const left  = parts.slice(0, parts.length - 1).join("   |   ");
          const right = parts[parts.length - 1];
          children.push(new Paragraph({
            spacing: { before: 100, after: 20 },
            tabStops: [{ type: TabStopType.RIGHT, position: PAGE_W - MARGIN * 2 }],
            children: [
              new TextRun({ text: left,        font: FONT, size: 21, bold: true, color: COLOR_META }),
              new TextRun({ text: "\t" + right, font: FONT, size: 19,            color: COLOR_CONTACT }),
            ],
          }));
        } else {
          children.push(new Paragraph({
            spacing: { before: 100, after: 20 },
            children: [new TextRun({ text: block.text, font: FONT, size: 21, bold: true, color: COLOR_META })],
          }));
        }
      } else if (block.type === "bullet") {
        children.push(new Paragraph({
          spacing: { before: 20, after: 20 },
          indent: { left: convertInchesToTwip(0.25), hanging: convertInchesToTwip(0.18) },
          children: [
            new TextRun({ text: "•  ", font: FONT, size: 20, color: COLOR_BULLET_DOT }),
            new TextRun({ text: block.text, font: FONT, size: 20, color: COLOR_BODY }),
          ],
        }));
      } else if (block.type === "body") {
        children.push(new Paragraph({
          spacing: { before: 20, after: 20 },
          children: [new TextRun({ text: block.text, font: FONT, size: 21, color: COLOR_BODY })],
        }));
      }

      lastType = block.type;
    });

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            size: { width: PAGE_W, height: PAGE_H },
            margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
          },
        },
        children,
      }],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("DOCX export error:", err);
    alert("Export failed: " + (err?.message || String(err)) + "\n\nCheck the browser console for details.");
  }
};
