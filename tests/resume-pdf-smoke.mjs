import assert from "node:assert/strict";
import { jsPDF } from "jspdf";
import { buildResumePdf } from "../src/pdf/generateResumePdf.js";

const longBullets = Array.from(
  { length: 70 },
  (_, index) => `- Improved workflow ${index + 1} and documented measurable results for the team.`,
).join("\n");

const doc = buildResumePdf(jsPDF, {
  name: "PDF Upgrade Test",
  position: "Software Tester",
  email: "tester@example.com",
  phone: "555-0100",
  location: "Tampa, Florida",
  summary: "A deterministic smoke test for the resume PDF export.",
  experience: `Example Company | 2024-2026\n${longBullets}`,
  education: "Example College | Certificate",
  skills: "JavaScript, testing, documentation",
});

assert.ok(doc.internal.getNumberOfPages() >= 2, "Long resumes should paginate.");

const output = Buffer.from(doc.output("arraybuffer"));
assert.equal(output.subarray(0, 5).toString("ascii"), "%PDF-", "Output should be a PDF.");
assert.ok(output.length > 5_000, "Generated PDF should contain rendered resume content.");

console.log(
  `Resume PDF smoke test passed (${doc.internal.getNumberOfPages()} pages, ${output.length} bytes).`,
);
