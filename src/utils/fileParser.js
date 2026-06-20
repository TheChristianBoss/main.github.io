// ─── FILE PARSING UTILITIES ──────────────────────────────────────────────────
// PDF and DOCX text extraction, shared between upload handlers.

import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

// ─── PDF ──────────────────────────────────────────────────────────────────────

export const extractPDFText = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
  let allLines = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    const byY = {};
    content.items.forEach((item) => {
      if (!item.str.trim()) return;
      const y = Math.round(item.transform[5] / 2) * 2;
      if (!byY[y]) byY[y] = [];
      byY[y].push({ x: item.transform[4], str: item.str });
    });

    const sortedYs = Object.keys(byY).map(Number).sort((a, b) => b - a);
    sortedYs.forEach((y) => {
      const items = byY[y].sort((a, b) => a.x - b.x);
      const lineText = items.map((it) => it.str).join(" ").trim();
      if (lineText) allLines.push(lineText);
    });

    if (i < pdf.numPages) allLines.push("");
  }

  return allLines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
};

// ─── DOCX ─────────────────────────────────────────────────────────────────────

export const extractDOCXText = async (file) => {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);

  const xmlChunks = [];
  let i = 0;
  while (i < bytes.length - 4) {
    if (bytes[i] === 0x50 && bytes[i+1] === 0x4b && bytes[i+2] === 0x03 && bytes[i+3] === 0x04) {
      const compression = bytes[i+8]  | (bytes[i+9]  << 8);
      const compSize    = bytes[i+18] | (bytes[i+19] << 8) | (bytes[i+20] << 16) | (bytes[i+21] << 24);
      const nameLen     = bytes[i+26] | (bytes[i+27] << 8);
      const extraLen    = bytes[i+28] | (bytes[i+29] << 8);
      const nameStart   = i + 30;
      const dataStart   = nameStart + nameLen + extraLen;
      const name        = new TextDecoder().decode(bytes.slice(nameStart, nameStart + nameLen));

      if (name === "word/document.xml") {
        const compressed = bytes.slice(dataStart, dataStart + compSize);
        let xmlBytes;
        if (compression === 0) {
          xmlBytes = compressed;
        } else {
          const ds = new DecompressionStream("deflate-raw");
          const writer = ds.writable.getWriter();
          writer.write(compressed);
          writer.close();
          const reader = ds.readable.getReader();
          const parts = [];
          let done = false;
          while (!done) {
            const { value, done: d } = await reader.read();
            if (value) parts.push(value);
            done = d;
          }
          const total = parts.reduce((s, p) => s + p.length, 0);
          xmlBytes = new Uint8Array(total);
          let offset = 0;
          for (const p of parts) { xmlBytes.set(p, offset); offset += p.length; }
        }
        xmlChunks.push(new TextDecoder("utf-8").decode(xmlBytes));
        break;
      }
      i = dataStart + compSize;
    } else {
      i++;
    }
  }

  if (xmlChunks.length === 0) throw new Error("word/document.xml not found — is this a valid .docx?");

  const xmlText = xmlChunks[0];
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, "application/xml");

  const getParagraphText = (para) =>
    Array.from(para.getElementsByTagNameNS("*", "t")).map((t) => t.textContent).join("").trim();

  const body = xmlDoc.getElementsByTagNameNS("*", "body")[0];
  if (!body) throw new Error("No body element found in document.xml");

  const lines = [];
  Array.from(body.childNodes).forEach((node) => {
    const localName = node.localName || node.nodeName.replace(/^.*:/, "");
    if (localName === "p") {
      lines.push(getParagraphText(node));
    } else if (localName === "tbl") {
      const rows = Array.from(node.getElementsByTagNameNS("*", "tr"));
      rows.forEach((row) => {
        const cells = Array.from(row.childNodes).filter((c) => {
          const n = c.localName || c.nodeName.replace(/^.*:/, "");
          return n === "tc";
        });
        const cellTexts = cells.map((cell) => {
          const cellParas = Array.from(cell.getElementsByTagNameNS("*", "p"));
          return cellParas.map(getParagraphText).filter(Boolean).join(" ");
        }).filter(Boolean);
        if (cellTexts.length > 0) lines.push(cellTexts.join("   |   "));
        lines.push("");
      });
    }
  });

  const processed = lines.map((line) => {
    if ((line.match(/\s*\|\s*/g) || []).length >= 2) {
      const parts = line.split(/\s*\|\s*/).map((p) => p.trim()).filter(Boolean);
      const hasContact = parts.some((p) => /@/.test(p) || /\d{3}/.test(p) || /FL|Tampa/i.test(p));
      if (hasContact) return parts.join("   |   ");
    }
    return line;
  });

  const rawText = processed.join("\n").replace(/\n{3,}/g, "\n\n").trim();

  const lineCount = rawText.split("\n").filter((l) => l.trim()).length;
  const pipeCount = (rawText.match(/\s*\|\s*/g) || []).length;

  if (lineCount <= 3 && pipeCount >= 5) {
    const fragments = rawText.split(/\s*\|\s*/).map((f) => f.trim()).filter(Boolean);
    const reconstructed = [];
    fragments.forEach((frag) => {
      if (/•/.test(frag)) {
        const bullets = frag.split("•").map((b) => b.trim()).filter(Boolean);
        bullets.forEach((b) => reconstructed.push("• " + b));
        return;
      }
      reconstructed.push(frag);
    });
    return reconstructed.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  }

  return rawText;
};
