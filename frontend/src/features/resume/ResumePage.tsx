import { FormEvent, useEffect, useState, useRef } from "react";
import { api } from "../../shared/api/client";
import { getStoredUser, syncCurrentUser } from "../auth/auth";
import { PageHeader, EmptyState, BaseCard, CardContent, Button, Input, Badge } from "../../components/ui";
import { UploadCloud, FileText, CheckCircle, AlertTriangle, ChevronRight } from "lucide-react";

type ResumeData = {
  resume_id: string;
  filename: string;
  target_role: string;
  extracted_skills: string[];
  ats_score: number;
  missing_skills: string[];
  suggestions: string[];
  created_at?: string;
};

export default function ResumePage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<ResumeData | null>(null);
  const [targetRole, setTargetRole] = useState(getStoredUser()?.target_role || "Frontend Developer");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let mounted = true;
    const loadLatestResume = async () => {
      try {
        const res = await api.get("/api/v1/resume/latest");
        if (!mounted) return;
        setData(res.data.data);
        setTargetRole(res.data.data.target_role || getStoredUser()?.target_role || "Frontend Developer");
      } catch (err: any) {
        if (!mounted) return;
        const status = err?.response?.status;
        if (status !== 404) {
          setError(err?.response?.data?.error?.details?.[0] || "Could not load your latest resume analysis.");
        }
      } finally {
        if (mounted) setInitialLoading(false);
      }
    };

    loadLatestResume();
    return () => { mounted = false; };
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError("");
    const form = new FormData();
    form.append("file", file);
    form.append("target_role", targetRole);
    try {
      const res = await api.post("/api/v1/resume/upload", form);
      setData(res.data.data);
      setTargetRole(res.data.data.target_role);
      await syncCurrentUser();
    } catch (err: any) {
      setError(err?.response?.data?.error?.details?.[0] || "Could not upload the resume.");
    } finally {
      setLoading(false);
    }
  };

  const renderUploadForm = () => (
    <BaseCard>
      <CardContent className="stack-md">
        <form onSubmit={onSubmit} className="stack-md">
          <div className="field-row">
            <label className="field" style={{ flex: 1 }}>
              <span className="field-label">Target Role</span>
              <Input 
                value={targetRole} 
                onChange={(e) => setTargetRole(e.target.value)} 
                placeholder="e.g. Frontend Developer" 
              />
            </label>
          </div>
          
          <div 
            className={`upload-zone ${file ? 'has-file' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            style={{ 
              border: "2px dashed var(--border)", 
              borderRadius: "var(--radius)", 
              padding: "2rem", 
              textAlign: "center",
              cursor: "pointer",
              transition: "all 0.2s ease",
              backgroundColor: file ? "var(--surface)" : "var(--surface-soft)"
            }}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                setFile(e.dataTransfer.files[0]);
              }
            }}
          >
            <input 
              type="file" 
              accept=".pdf,.txt" 
              onChange={(e) => setFile(e.target.files?.[0] || null)} 
              ref={fileInputRef}
              style={{ display: "none" }}
            />
            {file ? (
              <div className="stack-sm" style={{ alignItems: "center" }}>
                <FileText size={32} className="text-primary" />
                <div>
                  <p style={{ fontWeight: 600 }}>{file.name}</p>
                  <p className="text-sm muted">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
            ) : (
              <div className="stack-sm" style={{ alignItems: "center", color: "var(--muted)" }}>
                <UploadCloud size={32} />
                <p>Click to browse or drag and drop</p>
                <p className="text-sm">PDF or TXT up to 5MB</p>
              </div>
            )}
          </div>
          
          <Button 
            variant="primary" 
            disabled={loading || !file} 
            type="submit"
            style={{ width: "100%" }}
          >
            {loading ? "Analyzing Document..." : "Upload & Analyze Resume"}
          </Button>
        </form>
      </CardContent>
    </BaseCard>
  );

  return (
    <div className="stack-lg">
      <PageHeader
        eyebrow="Resume"
        title="Resume Intelligence"
        description="Upload your resume to get instant feedback on ATS compatibility and skill alignment."
      />

      {error && <p className="error">{error}</p>}
      
      {initialLoading && <EmptyState title="Loading your latest resume analysis..." />}

      {!initialLoading && (
        <div className="stack-lg">
          
          <div className="stack-lg">
            {renderUploadForm()}
            
            {data && (
              <BaseCard>
                <CardContent className="stack-md">
                  <div className="row wrap" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <p className="eyebrow">Analyzed File</p>
                      <h3>{data.filename}</h3>
                      <div style={{ marginTop: "0.25rem" }}>
                        <Badge variant="primary">{data.target_role}</Badge>
                        {data.created_at && <span className="muted text-sm" style={{ marginLeft: "0.5rem" }}>{new Date(data.created_at).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    
                    <div style={{ textAlign: "center" }}>
                      <div style={{ 
                        fontSize: "2rem", 
                        fontWeight: 700, 
                        color: data.ats_score >= 80 ? "var(--success)" : data.ats_score >= 60 ? "var(--warning)" : "var(--danger)",
                        lineHeight: 1 
                      }}>
                        {data.ats_score}
                      </div>
                      <p className="text-sm muted">ATS Score</p>
                    </div>
                  </div>
                  
                  <hr style={{ borderTop: "1px solid var(--border)", margin: "0.5rem 0" }} />
                  
                  <div className="stack-xs">
                    <p className="font-bold">Detected Skills</p>
                    <div className="row wrap" style={{ gap: "0.25rem" }}>
                      {data.extracted_skills.length > 0 ? (
                        data.extracted_skills.map((skill, idx) => (
                          <Badge key={idx} variant="default">{skill}</Badge>
                        ))
                      ) : (
                        <p className="muted text-sm">No skills detected</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </BaseCard>
            )}
          </div>
          
          <div className="stack-lg">
            {!data ? (
              <EmptyState
                icon={<FileText size={48} />}
                title="No Analysis Yet"
                description="Upload a known-good PDF or TXT resume on the left to unlock ATS feedback and recommendations."
              />
            ) : (
              <BaseCard>
                <CardContent className="stack-md">
                  <div>
                    <h3 style={{ marginBottom: "1rem" }}>Actionable Feedback</h3>
                    
                    {data.missing_skills && data.missing_skills.length > 0 && (
                      <div className="stack-sm" style={{ marginBottom: "1.5rem" }}>
                        <div className="row" style={{ alignItems: "center", gap: "0.5rem", color: "var(--warning)" }}>
                          <AlertTriangle size={18} />
                          <h4 style={{ margin: 0, color: "var(--text)" }}>Missing Critical Keywords</h4>
                        </div>
                        <p className="text-sm muted">Consider adding these skills to improve your match rate for <strong>{data.target_role}</strong> roles:</p>
                        <div className="row wrap" style={{ gap: "0.25rem" }}>
                          {data.missing_skills.map((skill, idx) => (
                            <Badge key={idx} variant="warning">{skill}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="stack-sm">
                      <div className="row" style={{ alignItems: "center", gap: "0.5rem", color: "var(--primary)" }}>
                        <CheckCircle size={18} />
                        <h4 style={{ margin: 0, color: "var(--text)" }}>Improvement Suggestions</h4>
                      </div>
                      <ul className="list-clean stack-xs">
                        {data.suggestions && data.suggestions.length > 0 ? (
                          data.suggestions.map((s, idx) => (
                            <li key={idx} className="row" style={{ alignItems: "flex-start", gap: "0.5rem" }}>
                              <ChevronRight size={16} className="text-primary" style={{ marginTop: "0.15rem", flexShrink: 0 }} />
                              <span className="text-sm" style={{ lineHeight: 1.5 }}>{s}</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-sm muted">Your resume looks great! Keep up the good work.</li>
                        )}
                      </ul>
                    </div>
                    
                  </div>
                </CardContent>
              </BaseCard>
            )}
          </div>
          
        </div>
      )}
    </div>
  );
}
