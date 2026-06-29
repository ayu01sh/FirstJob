import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../shared/api/client";
import { PageHeader, BaseCard, CardContent, Badge, Modal, Input, Select, TextArea, Button, Skeleton } from "../../components/ui";
import { type StudentApplication, type ApplicationStatus } from "../../shared/types/product";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";
import { Activity, Bookmark, Award, Archive } from "lucide-react";

type TabKey = "active" | "saved" | "offers" | "archived";

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  saved: "Saved",
  applied: "Applied",
  oa: "Online Assessment",
  technical_interview: "Technical Interview",
  hr: "HR Round",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export default function ApplicationsPage() {
  const [apps, setApps] = useState<StudentApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingApp, setEditingApp] = useState<StudentApplication | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("active");
  const { width, height } = useWindowSize();

  const fetchApps = async () => {
    try {
      const res = await api.get("/api/v1/applications");
      setApps(res.data.data);
    } catch (err: any) {
      setError(err?.response?.data?.error?.details?.[0] || "Could not load applications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const handleUpdate = async (id: string, updates: Partial<StudentApplication>) => {
    try {
      await api.patch(`/api/v1/applications/${id}`, updates);
      
      // Trigger confetti if status changes to offer
      if (updates.status === "offer") {
        const originalApp = apps.find(a => a._id === id);
        if (originalApp && originalApp.status !== "offer") {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 6000);
        }
      }
      
      await fetchApps();
      if (editingApp && editingApp._id === id) {
        setEditingApp(null);
      }
    } catch (err: any) {
      alert("Failed to update: " + (err?.response?.data?.error?.details?.[0] || err.message));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this application?")) return;
    try {
      await api.delete(`/api/v1/applications/${id}`);
      await fetchApps();
      setEditingApp(null);
    } catch (err: any) {
      alert("Failed to delete: " + (err?.response?.data?.error?.details?.[0] || err.message));
    }
  };

  const filteredApps = apps.filter(app => {
    if (activeTab === "active") return ["applied", "oa", "technical_interview", "hr"].includes(app.status);
    if (activeTab === "saved") return app.status === "saved";
    if (activeTab === "offers") return app.status === "offer";
    if (activeTab === "archived") return ["rejected", "withdrawn"].includes(app.status);
    return false;
  });

  const activeCount = apps.filter(a => ["applied", "oa", "technical_interview", "hr"].includes(a.status)).length;
  const savedCount = apps.filter(a => a.status === "saved").length;
  const offersCount = apps.filter(a => a.status === "offer").length;
  const archivedCount = apps.filter(a => ["rejected", "withdrawn"].includes(a.status)).length;

  return (
    <div className="stack-lg">
      {showConfetti && (
        <Confetti 
          width={width} 
          height={height} 
          recycle={false} 
          numberOfPieces={500} 
          gravity={0.2}
          style={{ position: 'fixed', top: 0, left: 0, zIndex: 9999 }} 
        />
      )}
      
      <PageHeader
        title="Manage Campus Opportunities"
        description="Track your progress from saved jobs to final offers."
      />

      {error && <p className="error">{error}</p>}
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
        {[
          { key: "active", label: "Active", count: activeCount, color: "var(--primary)", icon: <Activity size={18} /> },
          { key: "saved", label: "Saved", count: savedCount, color: "var(--text)", icon: <Bookmark size={18} /> },
          { key: "offers", label: "Offers", count: offersCount, color: "#059669", icon: <Award size={18} /> },
          { key: "archived", label: "Archived", count: archivedCount, color: "var(--muted)", icon: <Archive size={18} /> }
        ].map(tab => (
          <BaseCard 
            hoverable 
            key={tab.key}
            onClick={() => setActiveTab(tab.key as TabKey)}
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
              <span style={{ fontSize: "1.75rem", fontWeight: 700, color: activeTab === tab.key ? tab.color : "var(--text)", lineHeight: 1 }}>{tab.count}</span>
            </CardContent>
          </BaseCard>
        ))}
      </div>

      {loading && (
        <div className="grid-three">
          {[1, 2, 3].map((i) => (
            <BaseCard key={i}>
              <CardContent className="stack-sm" style={{ padding: "1.25rem" }}>
                <Skeleton variant="text" width="40%" />
                <Skeleton variant="text" width="80%" height={24} />
                <Skeleton variant="text" width={100} height={24} style={{ borderRadius: '12px', marginTop: '8px' }} />
              </CardContent>
            </BaseCard>
          ))}
        </div>
      )}

      {!loading && !error && (
        <div className="grid-three">
          {filteredApps.map((app) => (
            <BaseCard hoverable key={app._id} onClick={() => setEditingApp(app)}>
              <CardContent className="stack-xs" style={{ padding: "1.25rem" }}>
                <p className="eyebrow" style={{ marginBottom: 0 }}>{app.company || "Unknown Company"}</p>
                <p style={{ fontWeight: 600, fontSize: "1.05rem", margin: 0, lineHeight: 1.3 }}>{app.title || "Unknown Role"}</p>
                
                <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <Badge variant="default">{STATUS_LABELS[app.status]}</Badge>
                  {app.next_action && (
                    <Badge variant="primary">Next: {app.next_action}</Badge>
                  )}
                  {!app.next_action && app.deadline && app.status === "saved" && (
                    <Badge variant="warning">
                      Due: {new Date(app.deadline).toLocaleDateString()}
                    </Badge>
                  )}
                </div>
                
                {app.notes && (
                  <p className="muted text-sm" style={{ marginTop: "0.75rem", borderTop: "1px dashed var(--border)", paddingTop: "0.75rem" }}>
                    {app.notes.length > 80 ? app.notes.slice(0, 80) + "..." : app.notes}
                  </p>
                )}
              </CardContent>
            </BaseCard>
          ))}
          
          {filteredApps.length === 0 && (
            <div style={{ gridColumn: "1 / -1", marginTop: "2rem" }}>
              <div style={{ textAlign: "center", marginBottom: "3rem" }}>
                <div style={{ 
                  width: "64px", height: "64px", borderRadius: "32px", 
                  backgroundColor: "var(--surface)", display: "flex", 
                  alignItems: "center", justifyContent: "center", 
                  margin: "0 auto 1.5rem auto", color: "var(--muted)" 
                }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M9 3v18" />
                  </svg>
                </div>
                <h3 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>No applications found</h3>
                <p className="muted" style={{ maxWidth: "400px", margin: "0 auto" }}>
                  When you apply to jobs or save them for later, they will appear in this section.
                </p>
              </div>

              <section className="feature-grid">
                <Link
                  to="/matches"
                  className="feature-card"
                  style={{ "--feature-color": "#059669" } as React.CSSProperties}
                >
                  <div className="icon-circle icon-circle-green">
                    <svg width="24" height="24" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 2l1.6 5h5.4l-4.4 3.2 1.6 5-4.2-3.2-4.2 3.2 1.6-5-4.4-3.2h5.4L10 2z" />
                    </svg>
                  </div>
                  <h3 className="feature-card-title">Recommendations</h3>
                  <p className="feature-card-desc">
                    Find placement-aware job matches tailored specifically to your profile.
                  </p>
                  <span className="feature-card-link">View Recommendations &rarr;</span>
                </Link>

                <Link
                  to="/jobs"
                  className="feature-card"
                  style={{ "--feature-color": "var(--primary)" } as React.CSSProperties}
                >
                  <div className="icon-circle icon-circle-blue">
                    <svg width="24" height="24" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="6.5" width="16" height="10.5" rx="2" />
                      <path d="M6.5 6.5V5a2 2 0 012-2h3a2 2 0 012 2v1.5" />
                      <line x1="2" y1="11.5" x2="18" y2="11.5" />
                    </svg>
                  </div>
                  <h3 className="feature-card-title">Browse Jobs</h3>
                  <p className="feature-card-desc">
                    Explore all eligible campus placements and apply directly.
                  </p>
                  <span className="feature-card-link">Explore Jobs →</span>
                </Link>

                <Link
                  to="/prep"
                  className="feature-card"
                  style={{ "--feature-color": "var(--primary)" } as React.CSSProperties}
                >
                  <div className="icon-circle icon-circle-blue">
                    <svg width="24" height="24" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2.5 3.5H8a2 2 0 012 2v12A1.5 1.5 0 008.5 16H2.5V3.5z" />
                      <path d="M17.5 3.5H12a2 2 0 00-2 2v12a1.5 1.5 0 011.5-1.5h6V3.5z" />
                    </svg>
                  </div>
                  <h3 className="feature-card-title">Interview Prep</h3>
                  <p className="feature-card-desc">
                    Practice with AI-generated interview questions and study materials.
                  </p>
                  <span className="feature-card-link">Start Prep →</span>
                </Link>
              </section>
            </div>
          )}
        </div>
      )}

      {editingApp && (
        <Modal
          isOpen={true}
          onClose={() => setEditingApp(null)}
          title="Edit Application"
          footer={
            <div className="row wrap" style={{ justifyContent: "space-between", width: "100%" }}>
              <Button variant="danger" onClick={() => handleDelete(editingApp._id)}>
                Delete
              </Button>
              <div className="row">
                <Button variant="ghost" onClick={() => setEditingApp(null)}>Cancel</Button>
                <Button
                  variant="primary"
                  onClick={() => handleUpdate(editingApp._id, {
                    status: editingApp.status,
                    next_action: editingApp.next_action,
                    next_action_at: editingApp.next_action_at,
                    notes: editingApp.notes,
                  })}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          }
        >
          <div className="stack-md">
            <div>
              <p className="eyebrow">{editingApp.company}</p>
              <h2>{editingApp.title}</h2>
              <div style={{ marginTop: "0.5rem" }}>
                <Link to={`/prep?job_id=${editingApp.job_id}`}>
                  <Button variant="primary" size="sm">
                    Prepare for this role
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="field-row">
              <label className="field">
                <span className="field-label">Status</span>
                <Select
                  value={editingApp.status}
                  onChange={(e) => setEditingApp({ ...editingApp, status: e.target.value as ApplicationStatus })}
                >
                  <option value="saved">Saved</option>
                  <option value="applied">Applied</option>
                  <option value="oa">Online Assessment</option>
                  <option value="technical_interview">Technical Interview</option>
                  <option value="hr">HR Round</option>
                  <option value="offer">Offer</option>
                  <option value="rejected">Rejected</option>
                  <option value="withdrawn">Withdrawn</option>
                </Select>
              </label>
            </div>

            <div className="field-row">
              <label className="field">
                <span className="field-label">Next Action</span>
                <Input
                  type="text"
                  value={editingApp.next_action || ""}
                  onChange={(e) => setEditingApp({ ...editingApp, next_action: e.target.value })}
                  placeholder="e.g. Complete OA"
                />
              </label>
              <label className="field">
                <span className="field-label">Next Action Date</span>
                <Input
                  type="date"
                  value={editingApp.next_action_at?.split("T")[0] || ""}
                  onChange={(e) => setEditingApp({ ...editingApp, next_action_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
                />
              </label>
            </div>

            <div className="field">
              <span className="field-label">Notes</span>
              <TextArea
                rows={4}
                value={editingApp.notes || ""}
                onChange={(e) => setEditingApp({ ...editingApp, notes: e.target.value })}
                placeholder="Any context or thoughts..."
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
