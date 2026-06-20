import { useState } from "react";
import jobCategories from "../data/jobCategories";
import { extractPDFText, extractDOCXText } from "../utils/fileParser";
import { exportToDOCX } from "../utils/docxExport";

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
}) {
  const [resumeInputType,  setResumeInputType]  = useState("pdf");
  const [resumeBInputType, setResumeBInputType] = useState("pdf");
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);
  const [errorA,   setErrorA]   = useState("");
  const [errorB,   setErrorB]   = useState("");

  const handleUpload = async (file, setter, setLoading, setError) => {
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const text = file.name.endsWith(".pdf")
        ? await extractPDFText(file)
        : await extractDOCXText(file);
      if (!text.trim()) throw new Error("No text could be extracted from this file. Try converting to PDF first.");
      setter(text);
    } catch (err) {
      console.error("File parse error:", err);
      setError(err.message || "Could not read file. Try uploading a different format.");
    } finally {
      setLoading(false);
    }
  };

  const FileInput = ({ accept, onFile, loading, error, id }) => (
    <div>
      <input
        id={id}
        type="file"
        accept={accept}
        disabled={loading}
        onChange={(e) => onFile(e.target.files[0])}
        className="ats-textarea"
        style={{ opacity: loading ? 0.5 : 1 }}
      />
      {loading && <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: 6 }}>Reading file…</p>}
      {error   && <p style={{ color: "var(--danger)", fontSize: "0.85rem", marginTop: 6 }}>⚠ {error}</p>}
    </div>
  );

  return (
    <div className="ats-card">
      <h1 className="ats-title">ATS Resume Checker</h1>

      {/* Job Category */}
      <label>Job Category</label>
      <select
        value={category}
        onChange={(e) => { setCategory(e.target.value); setRole(""); }}
        className="ats-textarea"
      >
        <option value="">Select Category</option>
        {Object.keys(jobCategories).map((cat) => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>

      {/* Job Role */}
      <label>Job Role</label>
      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className="ats-textarea"
      >
        <option value="">Select Role</option>
        {category && jobCategories[category].map((job) => (
          <option key={job} value={job}>{job}</option>
        ))}
      </select>

      {/* Resume A input */}
      <label>Resume A — Input Method</label>
      <select
        value={resumeInputType}
        onChange={(e) => setResumeInputType(e.target.value)}
        className="ats-textarea"
      >
        <option value="pdf">Upload PDF</option>
        <option value="docx">Upload DOCX / Word</option>
        <option value="paste">Paste Resume Text</option>
      </select>

      {resumeInputType === "paste" ? (
        <textarea
          rows="10"
          value={resume}
          onChange={(e) => setResume(e.target.value)}
          className="ats-textarea"
          placeholder="Paste Resume A here…"
        />
      ) : (
        <FileInput
          id="upload-a"
          accept={resumeInputType === "pdf" ? ".pdf" : ".docx,.doc"}
          onFile={(file) => handleUpload(file, setResume, setLoadingA, setErrorA)}
          loading={loadingA}
          error={errorA}
        />
      )}

      {/* Job Description */}
      <label>Job Description (optional — enables skill gap & auto-tailor)</label>
      <textarea
        rows="6"
        value={jobDescription}
        onChange={(e) => setJobDescription(e.target.value)}
        className="ats-textarea"
        placeholder="Paste the job description here…"
      />

      {/* Comparison toggle */}
      <label className="ats-label">
        <input
          type="checkbox"
          checked={comparisonMode}
          onChange={(e) => setComparisonMode(e.target.checked)}
          style={{ marginRight: 8 }}
        />
        Compare Two Resumes
      </label>

      {comparisonMode && (
        <>
          <label>Resume B — Input Method</label>
          <select
            value={resumeBInputType}
            onChange={(e) => setResumeBInputType(e.target.value)}
            className="ats-textarea"
          >
            <option value="pdf">Upload PDF</option>
            <option value="docx">Upload DOCX / Word</option>
            <option value="paste">Paste Resume Text</option>
          </select>

          {resumeBInputType === "paste" ? (
            <textarea
              rows="8"
              value={resumeB}
              onChange={(e) => setResumeB(e.target.value)}
              className="ats-textarea"
              placeholder="Paste Resume B here…"
            />
          ) : (
            <FileInput
              id="upload-b"
              accept={resumeBInputType === "pdf" ? ".pdf" : ".docx,.doc"}
              onFile={(file) => handleUpload(file, setResumeB, setLoadingB, setErrorB)}
              loading={loadingB}
              error={errorB}
            />
          )}
        </>
      )}

      <button className="ats-btn" onClick={onAnalyze} disabled={!resume.trim() || loadingA || loadingB}>
        {loadingA || loadingB ? "Reading file…" : "Analyze Resume"}
      </button>

      {jobDescription.trim() && resume.trim() && (
        <button className="ats-btn ats-btn--secondary" onClick={onAutoTailor} disabled={isTailoring}>
          {isTailoring ? "Tailoring…" : "⚡ Auto-Tailor to Job Description"}
        </button>
      )}

      {tailoredResume && (
        <div style={{ marginTop: 12 }}>
          <label>Auto-Tailored Resume Preview</label>
          <textarea rows="8" className="ats-textarea" value={tailoredResume} readOnly />
          <button
            className="ats-btn ats-btn--small"
            onClick={() => exportToDOCX(tailoredResume, "tailored-resume")}
          >
            ⬇ Export Tailored Resume (.docx)
          </button>
        </div>
      )}
    </div>
  );
}
