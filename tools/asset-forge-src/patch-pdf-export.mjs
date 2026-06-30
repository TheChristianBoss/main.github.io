import fs from "node:fs";

const appPath = "./src/App.jsx";
const cssPath = "./src/App.css";

let code = fs.readFileSync(appPath, "utf8");

if (!code.includes('import { PDFDocument } from "pdf-lib";')) {
  code = code.replace(
    'import JSZip from "jszip";',
    'import JSZip from "jszip";\nimport { PDFDocument } from "pdf-lib";'
  );
}

if (!code.includes("async function renderDesignToPdfBlob")) {
  const pdfHelper = `

async function renderDesignToPdfBlob(design, userImage) {
  const imageBlob = await renderDesignToBlob(design, userImage);
  const imageBytes = await imageBlob.arrayBuffer();

  const pdfDoc = await PDFDocument.create();
  const embeddedImage = await pdfDoc.embedPng(imageBytes);

  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 36;

  const page = pdfDoc.addPage([pageWidth, pageHeight]);

  const maxImageWidth = pageWidth - margin * 2;
  const maxImageHeight = pageHeight - margin * 2;

  const imageWidth = embeddedImage.width;
  const imageHeight = embeddedImage.height;

  const scale = Math.min(
    maxImageWidth / imageWidth,
    maxImageHeight / imageHeight
  );

  const drawWidth = imageWidth * scale;
  const drawHeight = imageHeight * scale;
  const drawX = (pageWidth - drawWidth) / 2;
  const drawY = (pageHeight - drawHeight) / 2;

  page.drawImage(embeddedImage, {
    x: drawX,
    y: drawY,
    width: drawWidth,
    height: drawHeight
  });

  const pdfBytes = await pdfDoc.save();

  return new Blob([pdfBytes], {
    type: "application/pdf"
  });
}
`;

  const downloadBlobRegex =
    /function downloadBlob\(blob, fileName\) \{[\s\S]*?URL\.revokeObjectURL\(url\);\r?\n\}/;

  if (!downloadBlobRegex.test(code)) {
    throw new Error("Could not find downloadBlob() to insert PDF helper.");
  }

  code = code.replace(downloadBlobRegex, (match) => match + pdfHelper);
}

if (!code.includes("async function downloadCurrentPdf")) {
  const pdfFunction = `

  async function downloadCurrentPdf() {
    try {
      setZipStatus("Building PDF...");

      const pdfBlob = await renderDesignToPdfBlob(design, userImage);
      downloadBlob(pdfBlob, \`asset-forge-\${activeTemplate.id}.pdf\`);

      setZipStatus("PDF ready.");
    } catch (error) {
      setZipStatus(error.message || "The browser could not build this PDF.");
    }
  }
`;

  const functionInsertRegex =
    /(\r?\n  async function downloadCurrentZip\(\) \{)/;

  if (!functionInsertRegex.test(code)) {
    throw new Error("Could not find downloadCurrentZip() to insert PDF function.");
  }

  code = code.replace(functionInsertRegex, pdfFunction + "$1");
}

if (!code.includes("onClick={downloadCurrentPdf}")) {
  const pdfButton = `

          <button
            type="button"
            className="secondary-button single-export-button"
            onClick={downloadCurrentPdf}
          >
            Download PDF
          </button>
`;

  const pngButtonRegex =
    /(<button type="button" onClick=\{downloadPng\}>\r?\n\s*Download PNG\r?\n\s*<\/button>)/;

  if (!pngButtonRegex.test(code)) {
    throw new Error("Could not find Download PNG button to insert PDF button.");
  }

  code = code.replace(pngButtonRegex, "$1" + pdfButton);
}

fs.writeFileSync(appPath, code, "utf8");

let css = fs.readFileSync(cssPath, "utf8");

if (!css.includes(".single-export-button")) {
  css += `

.single-export-button {
  margin-top: 10px;
}
`;
}

fs.writeFileSync(cssPath, css, "utf8");

console.log("PDF export patch applied.");
