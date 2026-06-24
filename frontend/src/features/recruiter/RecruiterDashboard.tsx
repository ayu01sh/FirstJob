import { useEffect, useState } from "react";
import { api } from "../../shared/api/client";

type RecruiterJob = {
  id: string;
  title: string;
  company: string;
  type: string;
  applicant_count: number;
  created_at: string;
};

type Applicant = {
  application_id: string;
  status: string;
  student: {
    name: string;
    email: string;
    degree: string;
    branch: string;
    graduation_year: number;
    cgpa: number;
    skills: string[];
  };
};

export default function RecruiterDashboard() {
  const [jobs, setJobs] = useState<RecruiterJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingApps, setLoadingApps] = useState(false);

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const res = await api.get("/api/v1/recruiter/jobs");
        setJobs(res.data.data.items);
      } catch (err) {
        // error handling
      } finally {
        setLoading(false);
      }
    };
    loadJobs();
  }, []);

  const viewApplicants = async (jobId: string) => {
    setSelectedJobId(jobId);
    setLoadingApps(true);
    try {
      const res = await api.get(`/api/v1/recruiter/jobs/${jobId}/applicants`);
      setApplicants(res.data.data.items);
    } catch {
      // error
    } finally {
      setLoadingApps(false);
    }
  };

  const updateStatus = async (appId: string, status: string) => {
    try {
      await api.patch(`/api/v1/recruiter/applications/${appId}`, { status });
      setApplicants((prev) => prev.map((a) => (a.application_id === appId ? { ...a, status } : a)));
    } catch {
      // error
    }
  };

  if (loading) return <div className="empty-state">Loading recruiter dashboard...</div>;

  return (
    <div className="stack-lg">
      <section className="section-block">
        <p className="eyebrow">Recruiter Workspace</p>
        <h3>Active Postings</h3>
      </section>

      <div className="table-dense-container panel">
        <table className="table-dense">
          <thead>
            <tr>
              <th>Role</th>
              <th>Company</th>
              <th>Type</th>
              <th>Applicants</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 && (
              <tr>
                <td colSpan={5} className="empty-state">No jobs posted yet.</td>
              </tr>
            )}
            {jobs.map((job) => (
              <tr key={job.id}>
                <td><strong>{job.title}</strong></td>
                <td>{job.company}</td>
                <td>{job.type.replace("_", " ")}</td>
                <td><span className="badge badge-info">{job.applicant_count}</span></td>
                <td>
                  <button className="button button-sm" onClick={() => viewApplicants(job.id)}>View Applicants</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedJobId && (
        <section className="panel">
          <div className="row wrap" style={{ justifyContent: "space-between", marginBottom: "1rem" }}>
            <h4>Applicant Queue</h4>
            <button className="button button-sm" onClick={() => setSelectedJobId(null)}>Close</button>
          </div>
          {loadingApps ? (
            <p>Loading applicants...</p>
          ) : applicants.length === 0 ? (
            <p className="empty-state">No applicants for this role yet.</p>
          ) : (
            <div className="table-dense-container">
              <table className="table-dense">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Email</th>
                    <th>Academics</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applicants.map((app) => (
                    <tr key={app.application_id}>
                      <td><strong>{app.student.name}</strong></td>
                      <td>{app.student.email}</td>
                      <td>{app.student.degree} • {app.student.branch} • {app.student.graduation_year} • CGPA {app.student.cgpa}</td>
                      <td>
                        <span className={`badge ${app.status === 'rejected' ? 'badge-rejected' : app.status === 'offer' ? 'badge-verified' : 'badge-neutral'}`}>
                          {app.status.replace("_", " ").toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div className="row" style={{ gap: "0.25rem" }}>
                          <button className="button button-sm button-primary" onClick={() => updateStatus(app.application_id, "technical_interview")}>Shortlist</button>
                          <button className="button button-sm button-danger" onClick={() => updateStatus(app.application_id, "rejected")}>Reject</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
