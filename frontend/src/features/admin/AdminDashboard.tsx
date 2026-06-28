import { useEffect, useState, FormEvent } from "react";
import { api } from "../../shared/api/client";
import { PageHeader, EmptyState } from "../../components/ui";

type AdminStudent = {
  id: string;
  email: string;
  name: string;
  college_name: string;
  college_domain: string;
  verification_status: string;
  created_at: string;
};

export default function AdminDashboard() {
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [collegeName, setCollegeName] = useState("");
  const [domain, setDomain] = useState("");
  const [addingCollege, setAddingCollege] = useState(false);
  const [collegeMessage, setCollegeMessage] = useState("");

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const res = await api.get("/api/v1/admin/students");
        setStudents(res.data.data.items);
      } catch (err) {
        // error
      } finally {
        setLoading(false);
      }
    };
    loadStudents();
  }, []);

  const updateVerification = async (studentId: string, status: string) => {
    try {
      await api.patch(`/api/v1/admin/students/${studentId}/verification`, { status });
      setStudents((prev) => prev.map((s) => (s.id === studentId ? { ...s, verification_status: status } : s)));
    } catch {
      // error
    }
  };

  const onAddCollege = async (e: FormEvent) => {
    e.preventDefault();
    setAddingCollege(true);
    setCollegeMessage("");
    try {
      await api.post("/api/v1/admin/colleges", { college_name: collegeName, domain });
      setCollegeMessage(`Added domain @${domain} to ${collegeName}.`);
      setCollegeName("");
      setDomain("");
    } catch (err: any) {
      setCollegeMessage(err?.response?.data?.detail || "Failed to add college domain.");
    } finally {
      setAddingCollege(false);
    }
  };

  if (loading) return <EmptyState title="Loading admin dashboard..." />;

  return (
    <div className="stack-lg">
      <PageHeader
        eyebrow="Campus Admin Workspace"
        title="Student Management"
      />

      <div className="table-dense-container panel">
        <table className="table-dense">
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Email</th>
              <th>College</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", color: "var(--muted)", padding: "2rem" }}>No students registered yet.</td>
              </tr>
            )}
            {students.map((student) => (
              <tr key={student.id}>
                <td><strong>{student.name || "Pending Profile"}</strong></td>
                <td>{student.email}</td>
                <td>{student.college_name} <span className="muted">@{student.college_domain}</span></td>
                <td>
                  <span className={`badge ${student.verification_status === 'verified' ? 'badge-verified' : student.verification_status === 'rejected' ? 'badge-rejected' : 'badge-unverified'}`}>
                    {student.verification_status.toUpperCase()}
                  </span>
                </td>
                <td>
                  <div className="row" style={{ gap: "0.25rem" }}>
                    <button className="button button-sm button-primary" onClick={() => updateVerification(student.id, "verified")}>Verify</button>
                    <button className="button button-sm button-danger" onClick={() => updateVerification(student.id, "rejected")}>Reject</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="panel stack-sm">
        <h4>Add College Domain Allowlist</h4>
        <p className="muted">Authorize a new campus email domain to allow students to register.</p>
        <form className="form-inline" onSubmit={onAddCollege}>
          <input 
            placeholder="College Name (e.g. Example Tech)" 
            value={collegeName} 
            onChange={(e) => setCollegeName(e.target.value)} 
            required 
          />
          <input 
            placeholder="Domain (e.g. example.edu)" 
            value={domain} 
            onChange={(e) => setDomain(e.target.value)} 
            required 
          />
          <button className="button button-primary" type="submit" disabled={addingCollege}>
            {addingCollege ? "Adding..." : "Authorize Domain"}
          </button>
        </form>
        {collegeMessage && <p className="meta-pill">{collegeMessage}</p>}
      </section>
    </div>
  );
}
