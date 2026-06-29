import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../shared/api/client";
import { type PrepFormat } from "../../shared/types/product";
import { PageHeader, EmptyState, BaseCard, CardContent, Input, Select, Button, Badge } from "../../components/ui";
import { Trash2, FileText, ChevronRight, MessageSquare, Briefcase, CheckCircle, Clock, X } from "lucide-react";

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

  const [activeTab, setActiveTab] = useState<PrepFormat | "history">("study_notes");
  
  // Generic form state
  const [topic, setTopic] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [missingSkills] = useState("");
  
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
      const res = await api.get("/api/v1/applications");
      setJobs(res.data.data || []);
      
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

  const onDelete = async (e: React.MouseEvent, prepId: string) => {
    e.stopPropagation();
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
      <PageHeader
        eyebrow="Interview Prep"
        title="Context-Aware Prep Engine"
        description="Generate study materials and behavioral stories tailored to your profile and targeted roles."
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
        {[
          { key: "study_notes", label: "Study Notes", icon: <FileText size={20} />, color: "var(--primary)" },
          { key: "behavioral", label: "Behavioral STAR", icon: <MessageSquare size={20} />, color: "#059669" },
          { key: "company_pack", label: "Company Pack", icon: <Briefcase size={20} />, color: "var(--purple)" },
          { key: "history", label: "History", icon: <Clock size={20} />, color: "var(--muted)" }
        ].map(tab => (
          <BaseCard 
            hoverable 
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{ 
              borderColor: activeTab === tab.key ? tab.color : "var(--border)",
              boxShadow: activeTab === tab.key ? `0 0 0 1px ${tab.color}` : "none",
              backgroundColor: activeTab === tab.key ? `color-mix(in srgb, ${tab.color} 5%, transparent)` : "var(--surface)",
              transition: "all 0.2s"
            }}
          >
            <CardContent style={{ padding: "1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: "76px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: activeTab === tab.key ? tab.color : "var(--text)" }}>
                {tab.icon}
                <span style={{ fontWeight: 600 }}>{tab.label}</span>
              </div>
            </CardContent>
          </BaseCard>
        ))}
      </div>

      {activeTab !== "history" && (
        <BaseCard>
          <CardContent>
            <form className="stack-md" onSubmit={onGenerate}>
              {activeTab === "study_notes" && (
                <div className="field-row">
                  <label className="field" style={{ flex: 1 }}>
                    <span className="field-label">Topic</span>
                    <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Operating Systems" required />
                  </label>
                  <label className="field" style={{ flex: 1 }}>
                    <span className="field-label">Target Role (Optional)</span>
                    <Input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="e.g. SDE Intern" />
                  </label>
                </div>
              )}

              {activeTab === "behavioral" && (
                <div className="stack-sm">
                  <div className="field-row">
                    <label className="field" style={{ flex: 1 }}>
                      <span className="field-label">Theme</span>
                      <Select value={tag} onChange={(e) => setTag(e.target.value)}>
                        <option value="leadership">Leadership</option>
                        <option value="teamwork">Teamwork</option>
                        <option value="conflict">Conflict Resolution</option>
                        <option value="failure">Overcoming Failure</option>
                        <option value="initiative">Taking Initiative</option>
                      </Select>
                    </label>
                    <label className="field" style={{ flex: 2 }}>
                      <span className="field-label">Project / Context</span>
                      <Input value={project} onChange={(e) => setProject(e.target.value)} required />
                    </label>
                  </div>
                  <div className="field-row">
                    <label className="field" style={{ flex: 1 }}>
                      <span className="field-label">Challenge</span>
                      <Input value={challenge} onChange={(e) => setChallenge(e.target.value)} required />
                    </label>
                    <label className="field" style={{ flex: 1 }}>
                      <span className="field-label">Action</span>
                      <Input value={action} onChange={(e) => setAction(e.target.value)} required />
                    </label>
                    <label className="field" style={{ flex: 1 }}>
                      <span className="field-label">Result</span>
                      <Input value={result} onChange={(e) => setResult(e.target.value)} required />
                    </label>
                  </div>
                </div>
              )}

              {activeTab === "company_pack" && (
                <div className="field-row">
                  <label className="field" style={{ flex: 1 }}>
                    <span className="field-label">Select Tracked Application</span>
                    <Select value={jobId} onChange={(e) => setJobId(e.target.value)} required>
                      <option value="">-- Choose a tracked job --</option>
                      {jobs.map(j => (
                        <option key={j.job_id} value={j.job_id}>{j.company} - {j.title}</option>
                      ))}
                    </Select>
                  </label>
                </div>
              )}

              <div>
                <Button variant="primary" type="submit" disabled={loading}>
                  {loading ? "Generating..." : "Generate Prep"}
                </Button>
              </div>
            </form>
          </CardContent>
        </BaseCard>
      )}

      {activeTab === "history" && (
        <BaseCard>
          <CardContent className="stack-md">
            <div className="row wrap" style={{ justifyContent: "space-between" }}>
              <div>
                <p className="eyebrow" style={{ marginBottom: 0 }}>History</p>
                <h4 style={{ margin: 0 }}>Saved Prep</h4>
              </div>
              <Badge variant="default">{history.length}</Badge>
            </div>
            
            {historyLoading && <EmptyState title="Loading history..." />}
            {!historyLoading && history.length === 0 && (
              <p className="text-sm muted" style={{ textAlign: "center", padding: "1rem 0" }}>No history yet.</p>
            )}
            
            {!historyLoading && history.length > 0 && (
              <div className="stack-sm" style={{ maxHeight: "400px", overflowY: "auto" }}>
                {history.map((n) => (
                  <div 
                    key={n.id} 
                    onClick={() => loadPrep(n.id)}
                    style={{ 
                      padding: "0.75rem", 
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border)",
                      backgroundColor: selectedPrep?.id === n.id ? "var(--primary-softest)" : "var(--surface)",
                      borderColor: selectedPrep?.id === n.id ? "var(--primary-light)" : "var(--border)",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <div className="stack-xs" style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: "0.9rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", margin: 0 }}>
                        {n.topic}
                      </p>
                      <div className="row" style={{ gap: "0.5rem" }}>
                        <Badge variant="default" style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem" }}>
                          {n.format.replace("_", " ")}
                        </Badge>
                        <span className="muted text-xs">{new Date(n.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => onDelete(e, n.id)}
                      disabled={deletingId === n.id}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--muted)",
                        cursor: "pointer",
                        padding: "0.25rem",
                        marginLeft: "0.5rem"
                      }}
                    >
                      {deletingId === n.id ? "..." : <Trash2 size={16} />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </BaseCard>
      )}

      {error && <p className="error">{error}</p>}

      <div className="stack-lg">
        
        {/* Right Panel: Detail */}
        {(selectedPrep || activeTab !== "history") && (
        <BaseCard>
          <CardContent className="stack-md">
            <div className="row wrap" style={{ justifyContent: "space-between" }}>
              <div>
                <p className="eyebrow" style={{ marginBottom: 0 }}>Detail</p>
                <h3 style={{ margin: 0 }}>{selectedPrep?.generated_content.title || "Select a Prep Item"}</h3>
              </div>
              {selectedPrep && (
                <div className="row" style={{ gap: "0.5rem", alignItems: "center" }}>
                  <Badge variant="primary">{selectedPrep.format.replace("_", " ").toUpperCase()}</Badge>
                  <button 
                    onClick={() => setSelectedPrep(null)}
                    style={{ 
                      background: "transparent", 
                      border: "none", 
                      cursor: "pointer", 
                      color: "var(--muted)", 
                      padding: "0.25rem", 
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "50%",
                      transition: "background 0.2s"
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = "var(--surface-soft)"}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    aria-label="Close detail"
                    title="Close"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
            </div>

            {detailLoading && <EmptyState title="Loading details..." />}
            {!detailLoading && !selectedPrep && (
              <EmptyState 
                icon={<FileText size={48} />}
                title="No Item Selected" 
                description="Generate a new prep item or select one from history to inspect the full structured content." 
              />
            )}

            {selectedPrep && !detailLoading && (
              <div className="stack-md">
                <p className="muted" style={{ fontSize: "1.05rem", lineHeight: 1.6 }}>
                  {selectedPrep.generated_content.summary}
                </p>

                {selectedPrep.generated_content.sections.length > 0 && (
                  <div className="stack-md" style={{ marginTop: "1rem" }}>
                    {selectedPrep.generated_content.sections.map((section, idx) => (
                      <div key={idx} style={{ 
                        padding: "1.25rem", 
                        backgroundColor: "var(--surface-soft)",
                        borderRadius: "var(--radius)",
                        border: "1px solid var(--border)"
                      }}>
                        <h4 style={{ marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <ChevronRight size={18} className="text-primary" />
                          {section.heading}
                        </h4>
                        <ul className="list-clean stack-sm">
                          {section.points.map((point, pIdx) => (
                            <li key={pIdx} style={{ paddingLeft: "1.5rem", position: "relative", lineHeight: 1.5 }}>
                              <span style={{ 
                                position: "absolute", left: "0.25rem", top: "0.4rem",
                                width: "6px", height: "6px", borderRadius: "50%",
                                backgroundColor: "var(--primary)"
                              }}></span>
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {selectedPrep.generated_content.key_points.length > 0 && (
                  <div className="stack-sm" style={{ marginTop: "1rem" }}>
                    <h4 style={{ borderBottom: "2px solid var(--primary-light)", paddingBottom: "0.5rem" }}>Key Takeaways</h4>
                    <ul className="list-clean stack-xs">
                      {selectedPrep.generated_content.key_points.map((point, idx) => (
                        <li key={idx} className="row" style={{ alignItems: "flex-start", gap: "0.5rem", lineHeight: 1.5 }}>
                          <CheckCircle size={16} className="text-success" style={{ marginTop: "0.15rem", flexShrink: 0 }} />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedPrep.generated_content.flashcards.length > 0 && (
                  <div className="stack-md" style={{ marginTop: "1rem" }}>
                    <h4 style={{ borderBottom: "2px solid var(--primary-light)", paddingBottom: "0.5rem" }}>Flashcards & Follow-ups</h4>
                    <div style={{ display: "grid", gap: "1rem" }}>
                      {selectedPrep.generated_content.flashcards.map((flashcard, idx) => (
                        <div key={idx} style={{ 
                          padding: "1rem",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius-sm)",
                          backgroundColor: "var(--surface)"
                        }}>
                          <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Q: {flashcard.question}</p>
                          <p className="muted" style={{ lineHeight: 1.5 }}>A: {flashcard.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </BaseCard>
      )}

      {/* Old History position removed because we moved it to the tabs section */}
      </div>
    </div>
  );
}
