import { FormEvent, useEffect, useState } from "react";
import { api } from "../../shared/api/client";

type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  skills_required: string[];
};

export default function JobsPage() {
  const limit = 10;
  const [items, setItems] = useState<Job[]>([]);
  const [page, setPage] = useState(1);
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState("");
  const [activeFilters, setActiveFilters] = useState({ title: "", location: "", type: "" });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchJobs = async (nextPage: number, filters = activeFilters) => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/api/v1/jobs", {
        params: { page: nextPage, limit, title: filters.title, location: filters.location, type: filters.type },
      });
      setItems(res.data.data.items);
      setTotal(res.data.data.pagination.total);
    } catch (err: any) {
      setError(err?.response?.data?.error?.details?.[0] || "Could not load the job listings.");
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs(page);
  }, [page]);

  const onFilter = async (e: FormEvent) => {
    e.preventDefault();
    const nextFilters = { title, location, type: jobType };
    setActiveFilters(nextFilters);
    setPage(1);
    await fetchJobs(1, nextFilters);
  };

  const disableNext = page * limit >= total;

  return (
    <div className="stack-lg">
      <section className="section-block">
        <p className="eyebrow">Jobs</p>
        <h3>Curated Listings</h3>
        <p className="muted">Filter the local dataset first, then compare it against your role-aware matches.</p>
      </section>
      <form onSubmit={onFilter} className="form-inline">
        <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
        <select value={jobType} onChange={(e) => setJobType(e.target.value)}>
          <option value="">All Types</option>
          <option value="Internship">Internship</option>
          <option value="Full-time">Full-Time</option>
        </select>
        <button className="button button-primary" type="submit">Filter</button>
      </form>

      {error && <p className="error">{error}</p>}
      {loading && <div className="empty-state">Loading jobs...</div>}
      {!loading && !error && items.length === 0 && (
        <div className="empty-state">
          <p className="eyebrow">No Results</p>
          <p>Try adjusting the title, location, or type filters.</p>
        </div>
      )}

      <div className="job-grid">
        {items.map((job) => (
          <article className="panel" key={job.id}>
            <div className="row wrap">
              <div>
                <p className="eyebrow">Listing</p>
                <h4>{job.title}</h4>
              </div>
              <span className="meta-pill">{job.type}</span>
            </div>
            <p className="muted">{job.company} | {job.location}</p>
            <div className="chip-row">
              {job.skills_required.map((skill) => (
                <span className="chip" key={skill}>{skill}</span>
              ))}
            </div>
          </article>
        ))}
      </div>

      <div className="row page-controls">
        <button className="button" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>Previous</button>
        <span className="meta-pill">Page {page}</span>
        <button className="button" disabled={disableNext || loading} onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>
    </div>
  );
}
