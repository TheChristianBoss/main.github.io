import { useState, useCallback, useReducer } from "react";
import "./ATS.css";

import jobCategories from "./data/jobCategories";
import roleKeywords from "./data/roleKeywords";
import { scoreResume, rewriteBullet, normalizeKeyword } from "./utils/resumeUtils";

import InputPanel      from "./tabs/InputPanel";
import ResultsPanel    from "./tabs/ResultsPanel";
import EditorPanel     from "./tabs/EditorPanel";
import HistoryPanel    from "./tabs/HistoryPanel";
import ComparisonPanel from "./tabs/ComparisonPanel";

// ─── STATE REDUCER ────────────────────────────────────────────────────────────
// All analysis results in one object so they're updated atomically.

const initialAnalysis = null;

function analysisReducer(state, action) {
  switch (action.type) {
    case "SET":   return action.payload;
    case "CLEAR": return null;
    default:      return state;
  }
}

// ─── IGNORED WORDS (for auto-tailor JD token filtering) ──────────────────────
const ignoredWords = [
  "the","and","for","with","you","your","are","this","that","will","have",
  "from","our","job","work","team","role","was","has","not","but","can",
];

const skillDatabase = [
  "javascript","typescript","react","vue","angular","node","express",
  "mongodb","sql","postgresql","python","java","aws","docker","git",
  "github","excel","leadership","communication","customer service",
  "project management","sales","marketing","cyber security","machine learning",
  "ci/cd","kubernetes","terraform","redux","graphql","rest api",
];

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function App() {
  // — Inputs —
  const [category,       setCategory]       = useState("");
  const [role,           setRole]           = useState("");
  const [resume,         setResume]         = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [comparisonMode, setComparisonMode] = useState(false);
  const [resumeB,        setResumeB]        = useState("");

  // — Analysis results (atomic) —
  const [analysis,      dispatchAnalysis] = useReducer(analysisReducer, initialAnalysis);
  const [analysisBData, setAnalysisBData] = useState(null);

  // — Editor —
  const [editedResume, setEditedResume] = useState("");
  const [activeTab,    setActiveTab]    = useState("input");

  // — Auto-tailor —
  const [tailoredResume, setTailoredResume] = useState("");
  const [isTailoring,    setIsTailoring]    = useState(false);

  // — History (persisted to localStorage) —
  const [versions,      setVersions]      = useState(() => {
    try { return JSON.parse(localStorage.getItem("cg_resume_versions") || "[]"); } catch { return []; }
  });
  const [scoreHistory,  setScoreHistory]  = useState(() => {
    try { return JSON.parse(localStorage.getItem("cg_score_history") || "[]"); } catch { return []; }
  });

  // ── Version helpers ────────────────────────────────────────────────────────

  const saveVersion = useCallback((text, label) => {
    setVersions((prev) => {
      const next = [
        ...prev,
        { id: prev.length + 1, label: label || `Version ${prev.length + 1}`, text, timestamp: new Date().toLocaleTimeString() },
      ];
      try { localStorage.setItem("cg_resume_versions", JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const restoreVersion = (v) => {
    setEditedResume(v.text);
    setResume(v.text);
  };

  // ── Main analysis ──────────────────────────────────────────────────────────

  const analyzeResume = useCallback(() => {
    if (!resume.trim()) return;

    const result = scoreResume(resume, role, jobDescription);
    if (!result) return;

    dispatchAnalysis({ type: "SET", payload: result });
    setEditedResume(resume);

    // Score history (persisted)
    setScoreHistory((prev) => {
      const next = [
        ...prev,
        {
          score: result.score,
          role:  role || "General",
          time:  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          label: `Run ${prev.length + 1}`,
        },
      ];
      try { localStorage.setItem("cg_score_history", JSON.stringify(next)); } catch {}
      return next;
    });

    // Resume B comparison
    if (comparisonMode && resumeB.trim()) {
      const bResult = scoreResume(resumeB, role, jobDescription);
      setAnalysisBData(bResult);
    } else {
      setAnalysisBData(null);
    }

    setActiveTab("results");
    setTimeout(() => {
      document.getElementById("results-section")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, [resume, resumeB, role, jobDescription, comparisonMode]);

  // ── Auto-tailor ────────────────────────────────────────────────────────────

  const autoTailor = () => {
    if (!resume.trim() || !jobDescription.trim()) return;
    setIsTailoring(true);
    setTimeout(() => {
      const jdTokens = normalizeKeyword(jobDescription).split(/\W+/).filter((w) => w.length > 3 && !ignoredWords.includes(w));
      const resumeNorm = normalizeKeyword(resume);
      // Only inject tokens that are in the skillDatabase allowlist, preventing garbage tokens
      const toInject = [...new Set(jdTokens)]
        .filter((t) => skillDatabase.includes(t) && !resumeNorm.includes(t))
        .slice(0, 8);

      let tailored = resume;
      if (toInject.length > 0) {
        tailored += `\n\nTailored Skills (matched to job):\n${toInject.join(", ")}`;
      }
      tailored = tailored.split("\n").map((line) => rewriteBullet(line.trim()) || line).join("\n");

      setTailoredResume(tailored);
      setEditedResume(tailored);
      saveVersion(tailored, "Auto-tailored to JD");
      setIsTailoring(false);
    }, 800);
  };

  // ── Tabs ───────────────────────────────────────────────────────────────────

  const tabs = [
    { id: "input",      label: "📄 Input"    },
    { id: "results",    label: "📊 Results"  },
    { id: "editor",     label: "✏️ Editor"   },
    { id: "history",    label: "🕐 History"  },
    // Comparison tab only shown when mode is active
    ...(comparisonMode ? [{ id: "comparison", label: "⚖️ Compare" }] : []),
  ];

  return (
    <div className="ats-app">
      <header className="ats-header">
        <div className="ats-header-inner">
          {/* Fixed: correct tool name */}
          <a href="/" className="ats-logo" style={{ textDecoration: "none", color: "inherit" }}>
            <span style={{ color: "var(--accent-ui)" }}>CG</span>&nbsp;Resume Builder
          </a>
        </div>
      </header>

      <main className="ats-main">
        <div className="ats-tabs">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={`ats-tab${activeTab === t.id ? " ats-tab--active" : ""}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === "input" && (
          <InputPanel
            category={category}         setCategory={setCategory}
            role={role}                 setRole={setRole}
            resume={resume}             setResume={setResume}
            jobDescription={jobDescription} setJobDescription={setJobDescription}
            comparisonMode={comparisonMode} setComparisonMode={setComparisonMode}
            resumeB={resumeB}           setResumeB={setResumeB}
            onAnalyze={analyzeResume}
            onAutoTailor={autoTailor}
            isTailoring={isTailoring}
            tailoredResume={tailoredResume}
          />
        )}

        {activeTab === "results" && (
          <ResultsPanel analysis={analysis} />
        )}

        {activeTab === "editor" && (
          <EditorPanel
            editedResume={editedResume}
            setEditedResume={setEditedResume}
            missingCriticalKeywords={analysis?.missingCritical ?? []}
            missingPhrases={analysis?.missingPhrases ?? []}
            role={role}
            roleKeywords={roleKeywords}
            resumeB={resumeB}
            onSaveVersion={saveVersion}
          />
        )}

        {activeTab === "history" && (
          <HistoryPanel
            scoreHistory={scoreHistory}
            versions={versions}
            onRestoreVersion={restoreVersion}
          />
        )}

        {activeTab === "comparison" && comparisonMode && (
          <ComparisonPanel
            analysis={analysis}
            analysisBData={analysisBData}
            comparisonMode={comparisonMode}
          />
        )}
      </main>
    </div>
  );
}
