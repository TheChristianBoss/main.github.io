import assert from "node:assert/strict";
import { buildResumePdf } from "../src/pdf/generateResumePdf.js";

class FakeJsPDF {
  constructor() {
    this.pages = 1;
    this.textCalls = [];
    this.internal = {
      pageSize: {
        getWidth: () => 612,
        getHeight: () => 792,
      },
      getNumberOfPages: () => this.pages,
    };
  }

  addPage() { this.pages += 1; }
  addImage() { throw new Error("Invalid test portrait"); }
  setFont() {}
  setFontSize() {}
  setTextColor() {}
  setDrawColor() {}
  setLineWidth() {}
  line() {}
  getTextWidth(value) { return String(value).length * 4; }
  splitTextToSize(value, width) {
    const text = String(value);
    const charsPerLine = Math.max(1, Math.floor(width / 5));
    const lines = [];
    for (let index = 0; index < text.length; index += charsPerLine) {
      lines.push(text.slice(index, index + charsPerLine));
    }
    return lines.length ? lines : [""];
  }
  text(value, x, y) { this.textCalls.push({ value: String(value), x, y, page: this.pages }); }
}

const longExperience = Array.from(
  { length: 90 },
  (_, index) => `- Completed responsibility ${index + 1} with clear documentation and measurable results.`,
).join("\n");

const doc = buildResumePdf(
  FakeJsPDF,
  {
    name: "Layout Test",
    position: "Tester",
    email: "layout@example.com",
    summary: "Checks headings, content, portrait fallback, and pagination.",
    experience: `Example Company | 2024-2026\n${longExperience}`,
    skills: "Testing, JavaScript, documentation",
  },
  "data:image/jpeg;base64,invalid-test-image",
);

assert.ok(doc.pages >= 2, "Long content should create additional pages.");
assert.ok(doc.textCalls.some(({ value }) => value === "Layout Test"));
assert.ok(doc.textCalls.some(({ value }) => value === "WORK EXPERIENCE"));
assert.ok(doc.textCalls.some(({ value }) => value === "SKILLS"));
assert.ok(doc.textCalls.some(({ value }) => value.includes("Completed responsibility")));

console.log(`Resume PDF layout test passed (${doc.pages} pages, ${doc.textCalls.length} text calls).`);
