import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../shared/api/client";
import { PageHeader, BaseCard, CardContent, Badge, Modal, Input, Select, TextArea, Button, Skeleton } from "../../components/ui";
import { type StudentApplication, type ApplicationStatus } from "../../shared/types/product";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";

const COLUMNS: { id: ApplicationStatus | "interview"; label: string; statuses: ApplicationStatus[] }[] = [
  { id: "saved", label: "Saved", statuses: ["saved"] },
  { id: "applied", label: "Applied", statuses: ["applied"] },
  { id: "oa", label: "Online Assessment", statuses: ["oa"] },
  { id: "interview", label: "Interviews", statuses: ["technical_interview", "hr"] },
  { id: "offer", label: "Offer", statuses: ["offer"] },
  { id: "rejected", label: "Rejected / Withdrawn", statuses: ["rejected", "withdrawn"] },
];

export default function ApplicationsPage() {
  const [apps, setApps] = useState<StudentApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingApp, setEditingApp] = useState<StudentApplication | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
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
        eyebrow="Application Tracker"
        title="Manage Campus Opportunities"
        description="Track your progress from saved jobs to final offers."
      />

      {error && <p className="error">{error}</p>}
      
      {loading && (
        <div className="kanban-board">
          {COLUMNS.map((col) => (
            <div className="kanban-column" key={col.id}>
              <div className="kanban-header">
                <Skeleton variant="text" width={100} height={20} />
                <Skeleton variant="text" width={24} height={24} style={{ borderRadius: '50%' }} />
              </div>
              <div className="kanban-cards stack-sm">
                {[1, 2, 3].map((i) => (
                  <BaseCard key={i}>
                    <CardContent className="stack-xs" style={{ padding: "1rem" }}>
                      <Skeleton variant="text" width="60%" />
                      <Skeleton variant="text" width="80%" />
                      <Skeleton variant="text" width={80} height={24} style={{ borderRadius: '12px', marginTop: '4px' }} />
                    </CardContent>
                  </BaseCard>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && (
        <div className="kanban-board">
          {COLUMNS.map((col) => {
            const colApps = apps.filter((a) => col.statuses.includes(a.status));
            return (
              <div className="kanban-column" key={col.id}>
                <div className="kanban-header">
                  <h4 className="kanban-title">{col.label}</h4>
                  <span className="kanban-count">{colApps.length}</span>
                </div>
                <div className="kanban-cards stack-sm">
                  {colApps.map((app) => (
                    <BaseCard hoverable key={app._id} onClick={() => setEditingApp(app)}>
                      <CardContent className="stack-xs" style={{ padding: "1rem" }}>
                        <p className="eyebrow" style={{ marginBottom: 0 }}>{app.company || "Unknown Company"}</p>
                        <p style={{ fontWeight: 600, fontSize: "0.92rem", margin: 0 }}>{app.title || "Unknown Role"}</p>
                        {app.next_action && (
                          <div style={{ marginTop: "0.25rem" }}>
                            <Badge variant="primary">Next: {app.next_action}</Badge>
                          </div>
                        )}
                        {!app.next_action && app.deadline && app.status === "saved" && (
                          <div style={{ marginTop: "0.25rem" }}>
                            <Badge variant="warning">
                              Due: {new Date(app.deadline).toLocaleDateString()}
                            </Badge>
                          </div>
                        )}
                        {app.notes && (
                          <p className="muted text-sm" style={{ marginTop: "0.5rem", borderTop: "1px dashed var(--border)", paddingTop: "0.5rem" }}>
                            {app.notes.length > 50 ? app.notes.slice(0, 50) + "..." : app.notes}
                          </p>
                        )}
                      </CardContent>
                    </BaseCard>
                  ))}
                  {colApps.length === 0 && <div className="text-sm muted" style={{ padding: "1rem", textAlign: "center" }}>No items</div>}
                </div>
              </div>
            );
          })}
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
