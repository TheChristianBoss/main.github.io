import { useState, useEffect, useCallback } from "react";
import { analyzeResume } from "./engine/analyzeResume";
import { stripBrackets } from "./components/FillableSection";
import ModePicker from "./modes/ModePicker";
import QuickMode from "./modes/QuickMode";
import GuidedMode from "./modes/GuidedMode";
import FullMode from "./modes/FullMode";
import "./ResumeBuilder.css";

const CATEGORY_POSITIONS = {
  "General Use": "Professional",
  "Technology & IT": "Technology Professional",
  "Healthcare": "Healthcare Professional",
  "Marketing & Creative": "Marketing & Creative Professional",
  "Business & Finance": "Business Professional",
  "Sales & Customer Success": "Sales Professional",
  "Engineering & Trades": "Engineering Professional",
  "Education": "Education Professional",
  "Logistics & Transportation": "Logistics Professional",
  "Legal & Compliance": "Legal Professional",
};

const EMPTY_DATA = {
  name: "", position: "", email: "", phone: "", location: "", linkedin: "", website: "",
  summary: "", experience: "", education: "", skills: "",
  certifications: "", projects: "", volunteer: "",
};

// ─── PDF / DOCX (kept here so all modes share them) ──────────────────────────

const generatePDF = async (data, portraitDataUrl = null) => {
  try {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "letter" });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const ML = 54, MR = 54, MT = 48;
    const usableW = W - ML - MR;
    let y = MT;

    const addPage = () => { doc.addPage(); y = MT; };
    const checkPage = (needed = 20) => { if (y + needed > H - 40) addPage(); };

    const hasPortrait = !!portraitDataUrl;
    const portraitSize = 72;
    const nameX = hasPortrait ? ML + portraitSize + 16 : ML;
    const nameW = hasPortrait ? usableW - portraitSize - 16 : usableW;

    if (hasPortrait) {
      try { doc.addImage(portraitDataUrl, "JPEG", ML, MT, portraitSize, portraitSize, undefined, "MEDIUM"); }
      catch (e) {}
    }

    doc.setFont("helvetica", "bold"); doc.setFontSize(22); doc.setTextColor(20, 20, 20);
    doc.text(data.name || "Your Name", nameX, y + 18);
    if (data.position) {
      doc.setFont("helvetica", "normal"); doc.setFontSize(11); doc.setTextColor(90, 90, 90);
      doc.text(data.position, nameX, y + 34);
    }
    const contactParts = [data.email, data.phone, data.location, data.linkedin, data.website].filter(Boolean);
    if (contactParts.length > 0) {
      doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(80, 80, 80);
      doc.text(contactParts.join("  |  "), nameX, y + (hasPortrait ? 52 : 48));
    }
    y += hasPortrait ? portraitSize + 20 : 60;
    doc.setDrawColor(180, 180, 180); doc.setLineWidth(0.5); doc.line(ML, y, W - MR, y); y += 14;

    const renderSection = (title, content) => {
      if (!content || !content.trim()) return;
      checkPage(40);
      doc.setFont("helvetica", "bold"); doc.setFontSize(9.5); doc.setTextColor(30, 30, 30);
      doc.text(title.toUpperCase(), ML, y); y += 3;
      doc.setDrawColor(160, 160, 160); doc.setLineWidth(0.4); doc.line(ML, y, W - MR, y); y += 10;
      content.split("\n").forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) { y += 4; return; }
        checkPage(16);
        if (/^[-•*·▪▸]/.test(trimmed)) {
          const bulletText = trimmed.replace(/^[-•*·▪▸]\s*/, "");
          doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(40, 40, 40);
          doc.text("•", ML + 4, y);
          const wrapped = doc.splitTextToSize(bulletText, usableW - 18);
          wrapped.forEach((wl, wi) => { checkPage(14); doc.text(wl, ML + 14, y); if (wi < wrapped.length - 1) y += 13; }); y += 14;
        } else if (trimmed.includes("|")) {
          const parts = trimmed.split("|").map(p => p.trim());
          doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(20, 20, 20); doc.text(parts[0] || "", ML, y);
          if (parts.length > 1) {
            const rest = parts.slice(1).join(" | ");
            doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(80, 80, 80);
            doc.text(rest, W - MR - doc.getTextWidth(rest), y);
          }
          y += 14;
        } else {
          doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(40, 40, 40);
          doc.splitTextToSize(trimmed, usableW).forEach(wl => { checkPage(14); doc.text(wl, ML, y); y += 13; });
        }
      });
      y += 8;
    };

    if (data.summary) renderSection("Professional Summary", data.summary);
    if (data.experience) renderSection("Work Experience", data.experience);
    if (data.education) renderSection("Education", data.education);
    if (data.skills) renderSection("Skills", data.skills);
    if (data.certifications) renderSection("Certifications", data.certifications);
    if (data.projects) renderSection("Projects", data.projects);
    if (data.volunteer) renderSection("Volunteer", data.volunteer);
    doc.save("resume.pdf");
  } catch (err) { alert("PDF export failed: " + err.message); }
};

const generateDOCX = async (data) => {
  try {
    const { Document, Packer, Paragraph, TextRun, BorderStyle, TabStopType, convertInchesToTwip, AlignmentType } = await import("docx");
    const FONT = "Calibri";
    const PW = convertInchesToTwip(8.5);
    const MARGIN = convertInchesToTwip(0.85);
    const children = [];

    children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 60 }, children: [new TextRun({ text: data.name || "Your Name", font: FONT, size: 44, bold: true, color: "141414" })] }));
    if (data.position) children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 40 }, children: [new TextRun({ text: data.position, font: FONT, size: 22, color: "555555" })] }));
    const contactParts = [data.email, data.phone, data.location, data.linkedin, data.website].filter(Boolean);
    if (contactParts.length > 0) children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 120 }, children: [new TextRun({ text: contactParts.join("  |  "), font: FONT, size: 18, color: "555555" })] }));

    const addSection = (title, content) => {
      if (!content || !content.trim()) return;
      children.push(new Paragraph({ spacing: { before: 200, after: 40 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "bbbbbb", space: 3 } }, children: [new TextRun({ text: title.toUpperCase(), font: FONT, size: 21, bold: true, color: "111111" })] }));
      content.split("\n").forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) { children.push(new Paragraph({ spacing: { before: 40, after: 0 } })); return; }
        if (/^[-•*·▪▸]/.test(trimmed)) {
          children.push(new Paragraph({ spacing: { before: 20, after: 20 }, indent: { left: convertInchesToTwip(0.25), hanging: convertInchesToTwip(0.18) }, children: [new TextRun({ text: "• ", font: FONT, size: 20, color: "888888" }), new TextRun({ text: trimmed.replace(/^[-•*·▪▸]\s*/, ""), font: FONT, size: 20, color: "1a1a1a" })] }));
        } else if (trimmed.includes("|")) {
          const parts = trimmed.split("|").map(p => p.trim());
          children.push(new Paragraph({ spacing: { before: 100, after: 20 }, tabStops: [{ type: TabStopType.RIGHT, position: PW - MARGIN * 2 }], children: [new TextRun({ text: parts[0] || "", font: FONT, size: 21, bold: true, color: "222222" }), new TextRun({ text: "\t" + parts.slice(1).join(" | "), font: FONT, size: 19, color: "555555" })] }));
        } else {
          children.push(new Paragraph({ spacing: { before: 20, after: 20 }, children: [new TextRun({ text: trimmed, font: FONT, size: 20, color: "1a1a1a" })] }));
        }
      });
    };

    if (data.summary) addSection("Professional Summary", data.summary);
    if (data.experience) addSection("Work Experience", data.experience);
    if (data.education) addSection("Education", data.education);
    if (data.skills) addSection("Skills", data.skills);
    if (data.certifications) addSection("Certifications", data.certifications);
    if (data.projects) addSection("Projects", data.projects);
    if (data.volunteer) addSection("Volunteer", data.volunteer);

    const doc = new Document({ sections: [{ properties: { page: { size: { width: convertInchesToTwip(8.5), height: convertInchesToTwip(11) }, margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN } } }, children }] });
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "resume.docx"; a.click();
    URL.revokeObjectURL(url);
  } catch (err) { alert("DOCX export failed: " + err.message); }
};

// ─── ORCHESTRATOR ─────────────────────────────────────────────────────────────

export default function ResumeBuilder() {
  const [mode, setMode] = useState(null);
  const [category, setCategory] = useState("");
  const [role, setRole] = useState("");
  const [data, setData] = useState(EMPTY_DATA);
  const [skipped, setSkipped] = useState({});
  const [portrait, setPortrait] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [view, setView] = useState("form");
  const [exportLoading, setExportLoading] = useState(null);

  // Auto-fill position from role/category
  useEffect(() => {
    if (role) {
      setData((prev) => ({ ...prev, position: prev.position || role }));
    } else if (category) {
      setData((prev) => ({ ...prev, position: prev.position || (CATEGORY_POSITIONS[category] || "") }));
    }
  }, [role, category]);

  // Live analysis
  useEffect(() => {
    const t = setTimeout(() => {
      const effectiveRole = role || (category ? "General Resume" : "");
      if (effectiveRole || Object.values(data).some((v) => v && v.trim())) {
        setAnalysis(analyzeResume(data, effectiveRole || "General Resume"));
      } else {
        setAnalysis(null);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [data, role, category]);

  const handleExportPDF = useCallback(async () => {
    setExportLoading("pdf");
    const cleanData = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, typeof v === "string" ? stripBrackets(v) : v])
    );
    await generatePDF(cleanData, portrait);
    setExportLoading(null);
  }, [data, portrait]);

  const handleExportDOCX = useCallback(async () => {
    setExportLoading("docx");
    const cleanData = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, typeof v === "string" ? stripBrackets(v) : v])
    );
    await generateDOCX(cleanData);
    setExportLoading(null);
  }, [data]);

  const sharedProps = {
    data, setData, analysis, role, category,
    onRoleChange: setRole, onCategoryChange: setCategory,
    onSwitchMode: setMode,
    portrait, setPortrait,
    view, setView,
    skipped, setSkipped,
    onExportPDF: handleExportPDF,
    onExportDOCX: handleExportDOCX,
    exportLoading,
  };

  if (mode === null) {
    return (
      <div className="rb-app">
        <header className="rb-header">
          <div className="rb-header-inner">
            <a href="/" className="rb-logo"><span className="rb-logo-cg">CG</span> Resume Builder</a>
          </div>
        </header>
        <ModePicker onSelect={setMode} />
      </div>
    );
  }

  if (mode === "quick") return <QuickMode {...sharedProps} />;
  if (mode === "guided") return <GuidedMode {...sharedProps} />;
  if (mode === "full") return <FullMode {...sharedProps} />;

  return null;
}
