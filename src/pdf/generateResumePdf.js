/**
 * Render resume data into a jsPDF document.
 *
 * Keeping document construction separate from browser download behavior makes
 * the PDF output testable in Node and keeps the UI component smaller.
 */
export function buildResumePdf(jsPDF, data, portraitDataUrl = null) {
  if (typeof jsPDF !== "function") {
    throw new TypeError("A jsPDF constructor is required.");
  }

  const safeData = data && typeof data === "object" ? data : {};
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 54;
  const marginRight = 54;
  const marginTop = 48;
  const usableWidth = pageWidth - marginLeft - marginRight;
  let y = marginTop;

  const addPage = () => {
    doc.addPage();
    y = marginTop;
  };

  const checkPage = (needed = 20) => {
    if (y + needed > pageHeight - 40) addPage();
  };

  const hasPortrait = typeof portraitDataUrl === "string" && portraitDataUrl.length > 0;
  const portraitSize = 72;
  const nameX = hasPortrait ? marginLeft + portraitSize + 16 : marginLeft;

  if (hasPortrait) {
    try {
      doc.addImage(
        portraitDataUrl,
        "JPEG",
        marginLeft,
        marginTop,
        portraitSize,
        portraitSize,
        undefined,
        "MEDIUM",
      );
    } catch {
      // A malformed portrait should not prevent the text resume from exporting.
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(20, 20, 20);
  doc.text(safeData.name || "Your Name", nameX, y + 18);

  if (safeData.position) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(90, 90, 90);
    doc.text(safeData.position, nameX, y + 34);
  }

  const contactParts = [
    safeData.email,
    safeData.phone,
    safeData.location,
    safeData.linkedin,
    safeData.website,
  ].filter(Boolean);

  if (contactParts.length > 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(contactParts.join("  |  "), nameX, y + (hasPortrait ? 52 : 48));
  }

  y += hasPortrait ? portraitSize + 20 : 60;
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.5);
  doc.line(marginLeft, y, pageWidth - marginRight, y);
  y += 14;

  const renderSection = (title, content) => {
    if (typeof content !== "string" || !content.trim()) return;

    checkPage(40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(30, 30, 30);
    doc.text(title.toUpperCase(), marginLeft, y);
    y += 3;
    doc.setDrawColor(160, 160, 160);
    doc.setLineWidth(0.4);
    doc.line(marginLeft, y, pageWidth - marginRight, y);
    y += 10;

    content.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        y += 4;
        return;
      }

      checkPage(16);

      if (/^[-•*·▪▸]/.test(trimmed)) {
        const bulletText = trimmed.replace(/^[-•*·▪▸]\s*/, "");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(40, 40, 40);
        doc.text("•", marginLeft + 4, y);
        const wrapped = doc.splitTextToSize(bulletText, usableWidth - 18);
        wrapped.forEach((wrappedLine, index) => {
          checkPage(14);
          doc.text(wrappedLine, marginLeft + 14, y);
          if (index < wrapped.length - 1) y += 13;
        });
        y += 14;
        return;
      }

      if (trimmed.includes("|")) {
        const parts = trimmed.split("|").map((part) => part.trim());
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(20, 20, 20);
        doc.text(parts[0] || "", marginLeft, y);

        if (parts.length > 1) {
          const rest = parts.slice(1).join(" | ");
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(80, 80, 80);
          doc.text(rest, pageWidth - marginRight - doc.getTextWidth(rest), y);
        }

        y += 14;
        return;
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(40, 40, 40);
      doc.splitTextToSize(trimmed, usableWidth).forEach((wrappedLine) => {
        checkPage(14);
        doc.text(wrappedLine, marginLeft, y);
        y += 13;
      });
    });

    y += 8;
  };

  renderSection("Professional Summary", safeData.summary);
  renderSection("Work Experience", safeData.experience);
  renderSection("Education", safeData.education);
  renderSection("Skills", safeData.skills);
  renderSection("Certifications", safeData.certifications);
  renderSection("Projects", safeData.projects);
  renderSection("Volunteer", safeData.volunteer);

  return doc;
}

export async function downloadResumePdf(data, portraitDataUrl = null) {
  const { jsPDF } = await import("jspdf");
  const doc = buildResumePdf(jsPDF, data, portraitDataUrl);
  doc.save("resume.pdf");
}
