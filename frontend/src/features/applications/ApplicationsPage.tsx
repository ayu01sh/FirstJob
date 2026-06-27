import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../shared/api/client";
import { type StudentApplication, type ApplicationStatus } from "../../shared/types/product";

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
      <section className="section-block">
        <header className="page-header">
          <p className="eyebrow">Application Tracker</p>
          <h3>Manage Campus Opportunities</h3>
          <p className="muted">Track your progress from saved jobs to final offers.</p>
        </header>
      </section>

      {error && <p className="error">{error}</p>}
      {loading && <div className="empty-state">Loading your tracker...</div>}

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
                    <article className="kanban-card panel" key={app._id} onClick={() => setEditingApp(app)}>
                      <p className="kanban-company eyebrow">{app.company || "Unknown Company"}</p>
                      <p className="kanban-role">{app.title || "Unknown Role"}</p>
                      {app.next_action && (
                        <div className="kanban-meta-row">
                          <span className="meta-pill action-pill">Next: {app.next_action}</span>
                        </div>
                      )}
                      {!app.next_action && app.deadline && app.status === "saved" && (
                        <div className="kanban-meta-row">
                          <span className="meta-pill warning-pill">
                            Due: {new Date(app.deadline).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {app.notes && (
                        <p className="kanban-notes-preview muted text-sm">
                          {app.notes.length > 50 ? app.notes.slice(0, 50) + "..." : app.notes}
                        </p>
                      )}
                    </article>
                  ))}
                  {colApps.length === 0 && <div className="empty-state text-sm" style={{ padding: "1rem" }}>No items</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editingApp && (
        <div className="job-detail-overlay" onClick={() => setEditingApp(null)}>
          <div className="job-detail-modal card shell-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "600px" }}>
            <div className="modal-header">
              <div className="modal-title-area">
                <p className="eyebrow">{editingApp.company}</p>
                <h2>{editingApp.title}</h2>
                <div style={{ marginTop: "0.5rem" }}>
                  <Link to={`/prep?job_id=${editingApp.job_id}`} className="button button-primary button-sm" style={{ textDecoration: 'none' }}>
                    Prepare for this role
                  </Link>
                </div>
              </div>
              <button className="button button-icon" onClick={() => setEditingApp(null)}>✕</button>
            </div>
            <div className="modal-body stack-md">
              <div className="field-row">
                <label className="field">
                  <span className="field-label">Status</span>
                  <select
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
                  </select>
                </label>
              </div>

              <div className="field-row">
                <label className="field">
                  <span className="field-label">Next Action</span>
                  <input
                    type="text"
                    value={editingApp.next_action || ""}
                    onChange={(e) => setEditingApp({ ...editingApp, next_action: e.target.value })}
                    placeholder="e.g. Complete OA"
                  />
                </label>
                <label className="field">
                  <span className="field-label">Next Action Date</span>
                  <input
                    type="date"
                    value={editingApp.next_action_at?.split("T")[0] || ""}
                    onChange={(e) => setEditingApp({ ...editingApp, next_action_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
                  />
                </label>
              </div>

              <div className="field">
                <span className="field-label">Notes</span>
                <textarea
                  rows={4}
                  value={editingApp.notes || ""}
                  onChange={(e) => setEditingApp({ ...editingApp, notes: e.target.value })}
                  placeholder="Any context or thoughts..."
                />
              </div>

              <div className="row wrap" style={{ justifyContent: "space-between", marginTop: "1rem" }}>
                <button className="button button-danger" onClick={() => handleDelete(editingApp._id)}>
                  Delete Tracker
                </button>
                <div className="row">
                  <button className="button" onClick={() => setEditingApp(null)}>Cancel</button>
                  <button
                    className="button button-primary"
                    onClick={() => handleUpdate(editingApp._id, {
                      status: editingApp.status,
                      next_action: editingApp.next_action,
                      next_action_at: editingApp.next_action_at,
                      notes: editingApp.notes,
                    })}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
