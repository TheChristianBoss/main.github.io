import { useState, useCallback, useReducer, useEffect } from "react";
import "./ATS.css";

import roleKeywords from "./data/roleKeywords";
import { scoreResume, rewriteBullet, normalizeKeyword } from "./utils/resumeUtils";

import ErrorBoundary from "./components/ErrorBoundary";
import InputPanel      from "./tabs/InputPanel";
import ResultsPanel    from "./tabs/ResultsPanel";
import EditorPanel     from "./tabs/EditorPanel";
import HistoryPanel    from "./tabs/HistoryPanel";
import ComparisonPanel from "./tabs/ComparisonPanel";

const initialAnalysis = null;

function analysisReducer(state, action) {
  switch (action.type) {
    case "SET":   return action.payload;
    case "CLEAR": return null;
    default:      return state;
  }
}

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

const DRAFT_KEY = "cg_ats_checker_draft_v2";
const HISTORY_KEY = "cg_score_history";
const VERSIONS_KEY = "cg_resume_versions";

function loadJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; } catch { return fallback; }
}

export default function App() {
  const draft = loadJson(DRAFT_KEY, {});

  const [category,       setCategory]       = useState(draft.category || "");
  const [role,           setRole]           = useState(draft.role || "");
  const [resume,         setResume]         = useState(draft.resume || "");
  const [jobDescription, setJobDescription] = useState(draft.jobDescription || "");
  const [comparisonMode, setComparisonMode] = useState(Boolean(draft.comparisonMode));
  const [resumeB,        setResumeB]        = useState(draft.resumeB || "");

  const [analysis,      dispatchAnalysis] = useReducer(analysisReducer, initialAnalysis);
  const [analysisBData, setAnalysisBData] = useState(null);

  const [editedResume, setEditedResume] = useState(draft.resume || "");
  const [activeTab,    setActiveTab]    = useState("input");

  const [tailoredResume, setTailoredResume] = useState("");
  const [isTailoring,    setIsTailoring]    = useState(false);

  const [versions,      setVersions]      = useState(() => loadJson(VERSIONS_KEY, []));
  const [scoreHistory,  setScoreHistory]  = useState(() => loadJson(HISTORY_KEY, []));

  useEffect(() => {
    const payload = { category, role, resume, jobDescription, comparisonMode, resumeB };
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(payload)); } catch {}
  }, [category, role, resume, jobDescription, comparisonMode, resumeB]);

  const saveVersion = useCallback((text, label) => {
    if (!text?.trim()) return;
    setVersions((prev) => {
      const next = [
        ...prev.slice(-19),
        { id: Date.now(), label: label || `Version ${prev.length + 1}`, text, timestamp: new Date().toLocaleString() },
      ];
      try { localStorage.setItem(VERSIONS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const restoreVersion = (v) => {
    setEditedResume(v.text);
    setResume(v.text);
    setActiveTab("editor");
  };

  const clearHistory = () => {
    if (!window.confirm("Clear saved ATS score history and resume versions?")) return;
    setVersions([]);
    setScoreHistory([]);
    try {
      localStorage.removeItem(VERSIONS_KEY);
      localStorage.removeItem(HISTORY_KEY);
    } catch {}
  };

  const resetAll = () => {
    if (!window.confirm("Start over and clear the current resume, job description, comparison resume, and analysis?")) return;
    setResume("");
    setResumeB("");
    setJobDescription("");
    setCategory("");
    setRole("");
    setComparisonMode(false);
    setEditedResume("");
    setTailoredResume("");
    setAnalysisBData(null);
    dispatchAnalysis({ type: "CLEAR" });
    setActiveTab("input");
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
  };

  const analyzeResume = useCallback(() => {
    if (!resume.trim()) return;

    const result = scoreResume(resume, role, jobDescription);
    if (!result) return;

    dispatchAnalysis({ type: "SET", payload: result });
    setEditedResume(resume);

    setScoreHistory((prev) => {
      const next = [
        ...prev.slice(-29),
        {
          score: result.score,
          role:  role || "General",
          time:  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          label: `Run ${prev.length + 1}`,
        },
      ];
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch {}
      return next;
    });

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

  const autoTailor = () => {
    if (!resume.trim() || !jobDescription.trim()) return;
    if (!window.confirm("Auto-tailor adds missing terms only as draft suggestions when they are truthfully supported by your experience. Review, edit, and remove anything that is not accurate before using it.")) return;
    setIsTailoring(true);
    setTimeout(() => {
      const jdTokens = normalizeKeyword(jobDescription).split(/\W+/).filter((w) => w.length > 3 && !ignoredWords.includes(w));
      const resumeNorm = normalizeKeyword(resume);
      const toInject = [...new Set(jdTokens)]
        .filter((t) => skillDatabase.includes(t) && !resumeNorm.includes(t))
        .slice(0, 8);

      let tailored = resume;
      if (toInject.length > 0) {
        tailored += `\n\nDraft Skill Suggestions to Review\n${toInject.join(", ")}`;
      }
      tailored = tailored.split("\n").map((line) => rewriteBullet(line.trim()) || line).join("\n");

      setTailoredResume(tailored);
      setEditedResume(tailored);
      saveVersion(tailored, "Auto-tailored draft to review");
      setIsTailoring(false);
    }, 500);
  };

  const tabs = [
    { id: "input",      label: "Input"    },
    { id: "results",    label: "Results"  },
    { id: "editor",     label: "Editor"   },
    { id: "history",    label: "History"  },
    ...(comparisonMode ? [{ id: "comparison", label: "Compare" }] : []),
  ];

  return (
    <ErrorBoundary>
      <div className="ats-app">
        <header className="ats-header">
          <div className="ats-header-inner">
            <a href="/tools/ats/" className="ats-logo" style={{ textDecoration: "none", color: "inherit" }}>
              <span style={{ color: "var(--accent-ui)" }}>CG</span>&nbsp;ATS Checker <span className="open-beta-badge">Open Beta</span>
            </a>
            <nav className="ats-nav" aria-label="ATS tool links">
              <a className="ats-nav-link" href="/tools/">Tools</a>
              <a className="ats-nav-link" href="/tools/resume/">Resume Builder</a>
              <a className="ats-nav-link" href="/tools/cover/">Cover Letter</a>
            </nav>
          </div>
        </header>

        <main className="ats-main">
          <section className="ats-card ats-intro-card">
            <h1 className="ats-title ats-title-line">ATS Resume Checker <span className="open-beta-badge">Open Beta</span></h1>
            <p className="ats-sub" style={{ marginLeft: 0, marginRight: 0 }}>
              Check a resume against a role or job description using a browser-local heuristic scan. This is a guidance tool, not a guarantee of applicant-tracking-system performance.
            </p>
            <div className="ats-badges" style={{ justifyContent: "flex-start" }}>
              <span className="badge">No signup</span>
              <span className="badge">Local file parsing</span>
              <span className="badge">PDF / DOCX / image OCR</span>
              <span className="badge">Alignment estimate</span>
            </div>
          </section>

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
            <button className="ats-tab ats-tab--danger" onClick={resetAll}>Start over</button>
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
              onClearAnalysis={() => { dispatchAnalysis({ type: "CLEAR" }); setAnalysisBData(null); }}
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
              onClearHistory={clearHistory}
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
    </ErrorBoundary>
  );
}
