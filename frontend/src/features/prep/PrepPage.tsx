import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../shared/api/client";
import { type PrepFormat } from "../../shared/types/product";

type PrepItem = {
  id: string;
  topic: string;
  format: PrepFormat;
  job_id?: string;
  created_at: string;
};

type PrepContent = {
  title: string;
  summary: string;
  sections: Array<{ heading: string; points: string[] }>;
  key_points: string[];
  flashcards: Array<{ question: string; answer: string }>;
};

type PrepDetail = {
  id?: string;
  topic: string;
  format: PrepFormat;
  job_id?: string;
  generated_content: PrepContent;
  created_at?: string;
};

export default function PrepPage() {
  const [searchParams] = useSearchParams();
  const prefillJobId = searchParams.get("job_id");

  const [activeTab, setActiveTab] = useState<PrepFormat>("study_notes");
  
  // Generic form state
  const [topic, setTopic] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [missingSkills, setMissingSkills] = useState("");
  
  // Behavioral state
  const [project, setProject] = useState("");
  const [challenge, setChallenge] = useState("");
  const [action, setAction] = useState("");
  const [result, setResult] = useState("");
  const [tag, setTag] = useState("leadership");
  
  // Company pack state
  const [jobId, setJobId] = useState(prefillJobId || "");
  const [jobs, setJobs] = useState<any[]>([]);

  const [history, setHistory] = useState<PrepItem[]>([]);
  const [selectedPrep, setSelectedPrep] = useState<PrepDetail | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await api.get("/api/v1/prep/history");
      setHistory(res.data.data.items || []);
    } catch (err: any) {
      setError(err?.response?.data?.error?.details?.[0] || "Could not load prep history.");
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadJobs = async () => {
    try {
      // Just fetch tracked applications and their joined job data for the dropdown
      const res = await api.get("/api/v1/applications");
      setJobs(res.data.data || []);
      
      // Auto-set the job if we came from Tracker and have prefill
      if (prefillJobId) {
        setActiveTab("company_pack");
      }
    } catch {
      // best effort
    }
  };

  const loadPrep = async (prepId: string) => {
    setDetailLoading(true);
    setError("");
    try {
      const res = await api.get(`/api/v1/prep/${prepId}`);
      setSelectedPrep(res.data.data);
    } catch (err: any) {
      setError(err?.response?.data?.error?.details?.[0] || "Could not load prep details.");
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
    loadJobs();
  }, []);

  const onGenerate = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSelectedPrep(null);
    
    const payload: any = {
      format: activeTab,
      target_role: targetRole,
    };

    if (activeTab === "study_notes" || activeTab === "flashcards") {
      payload.topic = topic;
    } else if (activeTab === "oa_plan") {
      payload.missing_skills = missingSkills.split(",").map((s) => s.trim()).filter(Boolean);
    } else if (activeTab === "behavioral") {
      payload.project = project;
      payload.challenge = challenge;
      payload.action = action;
      payload.result = result;
      payload.tag = tag;
    } else if (activeTab === "company_pack") {
      payload.job_id = jobId;
    }

    try {
      const res = await api.post("/api/v1/prep/plan", payload);
      setSelectedPrep(res.data.data);
      await loadHistory();
    } catch (err: any) {
      setSelectedPrep(null);
      setError(err?.response?.data?.error?.details?.[0] || "Could not generate prep material.");
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (prepId: string) => {
    setDeletingId(prepId);
    setError("");
    try {
      await api.delete(`/api/v1/prep/${prepId}`);
      setHistory((current) => current.filter((item) => item.id !== prepId));
      setSelectedPrep((current) => {
        const currentId = current?.id;
        return currentId === prepId ? null : current;
      });
    } catch (err: any) {
      setError(err?.response?.data?.error?.details?.[0] || "Could not delete prep item.");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div className="stack-lg">
      <section className="section-block">
        <header className="page-header">
          <p className="eyebrow">Interview Prep</p>
          <h3>Context-Aware Prep Engine</h3>
          <p className="muted">Generate study materials and behavioral stories tailored to your profile and targeted roles.</p>
        </header>
      </section>

      <div className="prep-tabs">
        <button className={`prep-tab ${activeTab === 'study_notes' ? 'active' : ''}`} onClick={() => setActiveTab('study_notes')}>Study Notes</button>
        <button className={`prep-tab ${activeTab === 'behavioral' ? 'active' : ''}`} onClick={() => setActiveTab('behavioral')}>Behavioral STAR</button>
        <button className={`prep-tab ${activeTab === 'company_pack' ? 'active' : ''}`} onClick={() => setActiveTab('company_pack')}>Company Pack</button>
      </div>

      <form className="prep-form panel" onSubmit={onGenerate}>
        {activeTab === "study_notes" && (
          <div className="field-row">
            <label className="field">
              <span className="field-label">Topic</span>
              <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Operating Systems" required />
            </label>
            <label className="field">
              <span className="field-label">Target Role (Optional)</span>
              <input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="e.g. SDE Intern" />
            </label>
          </div>
        )}

        {activeTab === "behavioral" && (
          <div className="stack-sm">
            <div className="field-row">
              <label className="field">
                <span className="field-label">Theme</span>
                <select value={tag} onChange={(e) => setTag(e.target.value)}>
                  <option value="leadership">Leadership</option>
                  <option value="teamwork">Teamwork</option>
                  <option value="conflict">Conflict Resolution</option>
                  <option value="failure">Overcoming Failure</option>
                  <option value="initiative">Taking Initiative</option>
                </select>
              </label>
              <label className="field">
                <span className="field-label">Project / Context</span>
                <input value={project} onChange={(e) => setProject(e.target.value)} required />
              </label>
            </div>
            <label className="field">
              <span className="field-label">Challenge</span>
              <input value={challenge} onChange={(e) => setChallenge(e.target.value)} required />
            </label>
            <label className="field">
              <span className="field-label">Action</span>
              <input value={action} onChange={(e) => setAction(e.target.value)} required />
            </label>
            <label className="field">
              <span className="field-label">Result</span>
              <input value={result} onChange={(e) => setResult(e.target.value)} required />
            </label>
          </div>
        )}

        {activeTab === "company_pack" && (
          <div className="field-row">
            <label className="field">
              <span className="field-label">Select Tracked Application</span>
              <select value={jobId} onChange={(e) => setJobId(e.target.value)} required>
                <option value="">-- Choose a tracked job --</option>
                {jobs.map(j => (
                  <option key={j.job_id} value={j.job_id}>{j.company} - {j.title}</option>
                ))}
              </select>
            </label>
          </div>
        )}

        <div style={{ marginTop: "1rem" }}>
          <button className="button button-primary" type="submit" disabled={loading}>
            {loading ? "Generating..." : "Generate Prep"}
          </button>
        </div>
      </form>

      {error && <p className="error">{error}</p>}

      <div className="notes-layout">
        <section className="panel stack-md">
          <div className="row wrap">
            <div>
              <p className="eyebrow">History</p>
              <h4>Saved Prep</h4>
            </div>
            <span className="meta-pill">{history.length} {history.length === 1 ? "Item" : "Items"}</span>
          </div>
          {historyLoading && <div className="empty-state">Loading history...</div>}
          {!historyLoading && history.length === 0 && (
            <div className="empty-state">
              <p className="eyebrow">No Prep Yet</p>
              <p>Generate your first prep item to populate this history panel.</p>
            </div>
          )}
          <div className="history-list">
            {history.map((n) => (
              <div className="history-row" key={n.id}>
                <button className="history-item" onClick={() => loadPrep(n.id)} type="button">
                  <span className="history-topic">{n.topic}</span>
                  <div className="row" style={{ gap: "0.5rem" }}>
                    <span className="meta-pill text-xs">{n.format}</span>
                    <span className="muted mono history-date text-xs">{new Date(n.created_at).toLocaleDateString()}</span>
                  </div>
                </button>
                <button
                  className="button history-delete history-delete-icon"
                  onClick={() => onDelete(n.id)}
                  type="button"
                  disabled={deletingId === n.id}
                  aria-label={`Delete`}
                  title={`Delete`}
                >
                  {deletingId === n.id ? "..." : "✕"}
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="panel stack-md">
          <div className="row wrap">
            <div>
              <p className="eyebrow">Detail</p>
              <h4>{selectedPrep?.generated_content.title || "Select a Prep Item"}</h4>
            </div>
            {selectedPrep && (
              <span className="meta-pill">{selectedPrep.format.replace("_", " ").toUpperCase()}</span>
            )}
          </div>

          {detailLoading && <div className="empty-state">Loading details...</div>}
          {!detailLoading && !selectedPrep && (
            <div className="empty-state">
              <p>Generate a new prep item or select one from history to inspect the full structured content.</p>
            </div>
          )}

          {selectedPrep && !detailLoading && (
            <div className="stack-md">
              <p className="muted">{selectedPrep.generated_content.summary}</p>

              {selectedPrep.generated_content.sections.length > 0 && (
                <div className="stack-sm">
                  <p><strong>Breakdown</strong></p>
                  {selectedPrep.generated_content.sections.map((section) => (
                    <div className="sub-panel" key={section.heading}>
                      <p className="section-heading">{section.heading}</p>
                      <ul className="list-clean">
                        {section.points.map((point) => (
                          <li key={point}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {selectedPrep.generated_content.key_points.length > 0 && (
                <div className="stack-sm">
                  <p><strong>Key Takeaways</strong></p>
                  <ul className="list-clean">
                    {selectedPrep.generated_content.key_points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedPrep.generated_content.flashcards.length > 0 && (
                <div className="stack-sm">
                  <p><strong>Flashcards & Follow-ups</strong></p>
                  {selectedPrep.generated_content.flashcards.map((flashcard) => (
                    <div className="sub-panel" key={flashcard.question}>
                      <p className="section-heading">{flashcard.question}</p>
                      <p className="muted">{flashcard.answer}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
