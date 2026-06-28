// Browser file parsing utilities for the ATS checker.

import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const TESSERACT_CDN = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
let tesseractLoadPromise = null;

function friendlyFileError(err, fallback) {
  const message = err?.message || String(err || "");
  if (/password|encrypted/i.test(message)) return "This file appears to be encrypted or password-protected. Remove the password or paste the resume text.";
  if (/Invalid PDF|PDF|document/i.test(message)) return fallback || "This file could not be read. Try exporting it again as PDF/DOCX or paste the text.";
  return message || fallback;
}

const loadTesseract = () => {
  if (typeof window === "undefined") throw new Error("Image OCR only works in a browser.");
  if (window.Tesseract) return Promise.resolve(window.Tesseract);

  if (!tesseractLoadPromise) {
    tesseractLoadPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${TESSERACT_CDN}"]`);
      if (existing) {
        existing.addEventListener("load", () => resolve(window.Tesseract), { once: true });
        existing.addEventListener("error", () => reject(new Error("Could not load the OCR engine.")), { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = TESSERACT_CDN;
      script.async = true;
      script.crossOrigin = "anonymous";
      script.onload = () => {
        if (window.Tesseract) resolve(window.Tesseract);
        else reject(new Error("OCR engine loaded, but Tesseract was not available."));
      };
      script.onerror = () => reject(new Error("Could not load the OCR engine. Check your internet connection and try again."));
      document.head.appendChild(script);
    });
  }

  return tesseractLoadPromise;
};

export const extractImageText = async (file, onProgress) => {
  try {
    const Tesseract = await loadTesseract();
    const result = await Tesseract.recognize(file, "eng", {
      logger: (message) => {
        if (!onProgress || !message) return;
        if (message.status) {
          const pct = typeof message.progress === "number" ? Math.round(message.progress * 100) : null;
          onProgress(pct === null ? message.status : `${message.status} ${pct}%`);
        }
      },
    });

    return result?.data?.text?.replace(/\n{3,}/g, "\n\n").trim() || "";
  } catch (err) {
    throw new Error(friendlyFileError(err, "Could not run OCR. Try a clearer image, a smaller screenshot, or paste the text."));
  }
};

export const extractPDFText = async (file, onProgress) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    const allLines = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      onProgress?.(`Extracting PDF page ${i} of ${pdf.numPages}…`);
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();

      const byY = {};
      content.items.forEach((item) => {
        if (!item.str?.trim()) return;
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
  } catch (err) {
    throw new Error(friendlyFileError(err, "Could not extract PDF text. Try a text-based PDF or paste the resume text."));
  }
};

export const extractDOCXText = async (file) => {
  try {
    const mammoth = await import("mammoth/mammoth.browser");
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    const text = result?.value?.replace(/\n{3,}/g, "\n\n").trim() || "";
    return text;
  } catch (err) {
    throw new Error(friendlyFileError(err, "Could not extract DOCX text. Save the file again as .docx/PDF or paste the text."));
  }
};
