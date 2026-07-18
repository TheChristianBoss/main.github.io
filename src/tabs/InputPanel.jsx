import { useState } from "react";
import jobCategories from "../data/jobCategories";
import { extractPDFText, extractDOCXText, extractImageText } from "../utils/fileParser";
import { exportToDOCX } from "../utils/docxExport";

const MAX_PARSE_SIZE_MB = 25;
const IMAGE_MAX_PARSE_SIZE_MB = 12;

function formatBytes(bytes = 0) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(size >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}

function getAcceptForInputType(inputType) {
  if (inputType === "pdf") return ".pdf,application/pdf";
  if (inputType === "docx") return ".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (inputType === "image") return "image/png,image/jpeg,image/webp,image/bmp,.png,.jpg,.jpeg,.webp,.bmp";
  return ".pdf,.docx,image/png,image/jpeg,image/webp,image/bmp";
}

function detectUploadType(file) {
  const name = file?.name?.toLowerCase() || "";
  const type = file?.type || "";
  if (name.endsWith(".pdf") || type === "application/pdf") return "pdf";
  if (name.endsWith(".docx")) return "docx";
  if (type.startsWith("image/") || /\.(png|jpe?g|webp|bmp)$/i.test(name)) return "image";
  if (name.endsWith(".doc")) return "doc";
  return "unknown";
}

function UploadBox({ id, inputType, onFile, loading, error, progress, fileMeta, onClear }) {
  return (
    <div
      className="ats-upload-box"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) onFile(file);
      }}
    >
      <input
        id={id}
        type="file"
        accept={getAcceptForInputType(inputType)}
        disabled={loading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
        className="ats-file-input"
      />
      <p className="ats-muted ats-small">Drop a file here, or choose one. Existing text is replaced only after a readable file is loaded.</p>
      {fileMeta && (
        <div className="ats-file-pill">
          <span>{fileMeta.name}</span>
          <span>{formatBytes(fileMeta.size)}</span>
          <button type="button" onClick={onClear}>Remove</button>
        </div>
      )}
      {loading && <p className="ats-muted ats-small">{progress || "Reading file…"}</p>}
      {error && <p className="ats-error-text">{error}</p>}
    </div>
    );
}

export default function InputPanel({
  category, setCategory,
  role, setRole,
  resume, setResume,
  jobDescription, setJobDescription,
  comparisonMode, setComparisonMode,
  resumeB, setResumeB,
  onAnalyze,
  onAutoTailor,
  isTailoring,
  tailoredResume,
  onClearAnalysis,
}) {
  const [resumeInputType,  setResumeInputType]  = useState("pdf");
  const [resumeBInputType, setResumeBInputType] = useState("pdf");
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);
  const [errorA,   setErrorA]   = useState("");
  const [errorB,   setErrorB]   = useState("");
  const [progressA, setProgressA] = useState("");
  const [progressB, setProgressB] = useState("");
  const [fileA, setFileA] = useState(null);
  const [fileB, setFileB] = useState(null);

  const handleUpload = async (file, setter, setFile, setLoading, setError, setProgress) => {
    if (!file) return;
    const uploadType = detectUploadType(file);
    if (uploadType === "unknown") {
      setError("Unsupported file type. Upload PDF, DOCX, PNG, JPG, WEBP, or paste resume text.");
      return;
    }
    if (uploadType === "doc") {
      setError("Old .doc files are not supported in this browser tool. Save/export as .docx or PDF first.");
      return;
    }

    const limit = uploadType === "image" ? IMAGE_MAX_PARSE_SIZE_MB : MAX_PARSE_SIZE_MB;
    if (file.size > limit * 1024 * 1024) {
      setError(`This file is ${formatBytes(file.size)}. Try a file under ${limit} MB or paste the resume text.`);
      return;
    }

    setLoading(true);
    setError("");
    setProgress?.("");
    setFile({ name: file.name, size: file.size, type: uploadType });
    try {
      let text;
      if (uploadType === "pdf") {
        setProgress?.("Extracting PDF text…");
        text = await extractPDFText(file, (msg) => setProgress?.(msg));
      } else if (uploadType === "docx") {
        setProgress?.("Extracting DOCX text…");
        text = await extractDOCXText(file);
      } else if (uploadType === "image") {
        setProgress?.("Starting OCR…");
        text = await extractImageText(file, setProgress);
      }

      if (!text?.trim()) {
        if (uploadType === "image") {
          throw new Error("OCR could not find readable resume text. Try a clearer screenshot/photo or paste the text manually.");
        }
        throw new Error("No readable text was extracted. Try a text-based PDF/DOCX or paste the resume text.");
      }
      setter(text);
      setProgress?.("");
      onClearAnalysis?.();
    } catch (err) {
      console.error("File parse error:", err);
      setError(err.message || "Could not read file. Try another format or paste the text.");
    } finally {
      setLoading(false);
      setProgress?.("");
    }
  };

  const clearResumeA = () => {
    setResume("");
    setFileA(null);
    setErrorA("");
    setProgressA("");
    onClearAnalysis?.();
  };

  const clearResumeB = () => {
    setResumeB("");
    setFileB(null);
    setErrorB("");
    setProgressB("");
    onClearAnalysis?.();
  };

  return (
    <div className="ats-card">
      <div className="ats-form-header">
        <div>
          <h2 className="ats-title ats-title--sm">Resume Input</h2>
          <p className="ats-muted">Upload or paste a resume, then optionally add a job description for a more targeted score.</p>
        </div>
      </div>

      <div className="ats-notice">
        Scores are estimates based on keywords, sections, formatting signals, and job-description overlap. Real employer systems vary.
      </div>

      <div className="ats-form-grid">
        <div>
          <label>Job Category</label>
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setRole(""); onClearAnalysis?.(); }}
            className="ats-textarea"
          >
            <option value="">General / no category</option>
            {Object.keys(jobCategories).map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label>Job Role</label>
          <select
            value={role}
            onChange={(e) => { setRole(e.target.value); onClearAnalysis?.(); }}
            className="ats-textarea"
            disabled={!category}
          >
            <option value="">General role</option>
            {category && jobCategories[category].map((job) => (
              <option key={job} value={job}>{job}</option>
            ))}
          </select>
        </div>
      </div>

      <label>Resume A — Input Method</label>
      <select
        value={resumeInputType}
        onChange={(e) => setResumeInputType(e.target.value)}
        className="ats-textarea"
      >
        <option value="pdf">Upload PDF</option>
        <option value="docx">Upload DOCX / Word</option>
        <option value="image">Upload Image / Screenshot OCR</option>
        <option value="paste">Paste Resume Text</option>
      </select>

      {resumeInputType === "paste" ? (
        <textarea
          rows="10"
          value={resume}
          onChange={(e) => { setResume(e.target.value); setFileA(null); onClearAnalysis?.(); }}
          className="ats-textarea"
          placeholder="Paste Resume A here…"
        />
      ) : (
        <UploadBox
          id="upload-a"
          inputType={resumeInputType}
          onFile={(file) => handleUpload(file, setResume, setFileA, setLoadingA, setErrorA, setProgressA)}
          loading={loadingA}
          error={errorA}
          progress={progressA}
          fileMeta={fileA}
          onClear={clearResumeA}
        />
      )}

      <div className="ats-inline-actions">
        <button type="button" className="ats-btn ats-btn--small" onClick={clearResumeA} disabled={!resume && !fileA}>Clear Resume A</button>
        {resume && <span className="ats-muted ats-small">{resume.split(/\s+/).filter(Boolean).length} words detected</span>}
      </div>

      <label>Job Description</label>
      <textarea
        rows="6"
        value={jobDescription}
        onChange={(e) => { setJobDescription(e.target.value); onClearAnalysis?.(); }}
        className="ats-textarea"
        placeholder="Paste the job description here for a more targeted match score…"
      />
      <div className="ats-inline-actions">
        <button type="button" className="ats-btn ats-btn--small" onClick={() => { setJobDescription(""); onClearAnalysis?.(); }} disabled={!jobDescription.trim()}>Clear Job Description</button>
        {jobDescription && <span className="ats-muted ats-small">{jobDescription.split(/\s+/).filter(Boolean).length} job-description words</span>}
      </div>

      <label className="ats-label ats-checkbox-label">
        <input
          type="checkbox"
          checked={comparisonMode}
          onChange={(e) => { setComparisonMode(e.target.checked); onClearAnalysis?.(); }}
        />
        Compare Two Resumes
      </label>

      {comparisonMode && (
        <div className="ats-compare-input-block">
          <label>Resume B — Input Method</label>
          <select
            value={resumeBInputType}
            onChange={(e) => setResumeBInputType(e.target.value)}
            className="ats-textarea"
          >
            <option value="pdf">Upload PDF</option>
            <option value="docx">Upload DOCX / Word</option>
            <option value="image">Upload Image / Screenshot OCR</option>
            <option value="paste">Paste Resume Text</option>
          </select>

          {resumeBInputType === "paste" ? (
            <textarea
              rows="8"
              value={resumeB}
              onChange={(e) => { setResumeB(e.target.value); setFileB(null); onClearAnalysis?.(); }}
              className="ats-textarea"
              placeholder="Paste Resume B here…"
            />
          ) : (
            <UploadBox
              id="upload-b"
              inputType={resumeBInputType}
              onFile={(file) => handleUpload(file, setResumeB, setFileB, setLoadingB, setErrorB, setProgressB)}
              loading={loadingB}
              error={errorB}
              progress={progressB}
              fileMeta={fileB}
              onClear={clearResumeB}
            />
          )}
          <button type="button" className="ats-btn ats-btn--small" onClick={clearResumeB} disabled={!resumeB && !fileB}>Clear Resume B</button>
        </div>
      )}

      <button className="ats-btn" onClick={onAnalyze} disabled={!resume.trim() || loadingA || loadingB}>
        {loadingA || loadingB ? "Reading file…" : "Analyze Resume"}
      </button>

      {jobDescription.trim() && resume.trim() && (
        <button className="ats-btn ats-btn--secondary" onClick={onAutoTailor} disabled={isTailoring}>
          {isTailoring ? "Tailoring…" : "Suggest truthful tailoring edits"}
        </button>
      )}

      {tailoredResume && (
        <div className="ats-tailored-preview">
          <label>Draft Tailoring Suggestions Preview</label>
          <textarea rows="8" className="ats-textarea" value={tailoredResume} readOnly />
          <button
            className="ats-btn ats-btn--small"
            onClick={() => exportToDOCX(tailoredResume, "tailored-resume")}
          >
            Export reviewed draft (.docx)
          </button>
        </div>
      )}
    </div>
  );
}
