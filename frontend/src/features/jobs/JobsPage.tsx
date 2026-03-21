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
  const [items, setItems] = useState<Job[]>([]);
  const [page, setPage] = useState(1);
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");

  const fetchJobs = async () => {
    const res = await api.get("/api/v1/jobs", { params: { page, limit: 10, title, location } });
    setItems(res.data.data.items);
  };

  useEffect(() => {
    fetchJobs();
  }, [page]);

  const onFilter = async (e: FormEvent) => {
    e.preventDefault();
    setPage(1);
    await fetchJobs();
  };

  return (
    <div>
      <h3>Jobs List</h3>
      <form onSubmit={onFilter} className="form-inline">
        <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
        <button type="submit">Filter</button>
      </form>
      <ul>
        {items.map((job) => (
          <li key={job.id}>
            <strong>{job.title}</strong> - {job.company} ({job.location}) [{job.type}]
          </li>
        ))}
      </ul>
      <div className="row">
        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
        <span>Page {page}</span>
        <button onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>
    </div>
  );
}
