import { FormEvent, useEffect, useState, useCallback } from "react";
import { api } from "../../shared/api/client";
import { type PlacementJob } from "../../shared/types/product";
import JobDetailModal from "./JobDetailModal";
import { JobCard } from "./components/JobCard";
import { PageHeader, EmptyState, Skeleton, Input, Select, Button } from "../../components/ui";

const TYPE_OPTIONS = ["", "Internship", "Full-time"];
const BRANCH_OPTIONS = ["", "CSE", "IT", "ECE", "EEE", "ME", "CE", "Other"];

function graduationYearOptions(): number[] {
  const years: number[] = [];
  for (let y = 2024; y <= 2029; y++) {
    years.push(y);
  }
  return years;
}

export default function JobsPage() {
  const limit = 10;
  const [items, setItems] = useState<PlacementJob[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState("");
  const [branch, setBranch] = useState("");
  const [gradYear, setGradYear] = useState<number | "">("");
  const [eligibleOnly, setEligibleOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState<"deadline_asc" | "posted_desc">("deadline_asc");

  const [activeFilters, setActiveFilters] = useState({
    title: "",
    company: "",
    location: "",
    type: "",
    branch: "",
    graduation_year: "" as number | "",
    eligible_only: false,
    sort: "deadline_asc" as "deadline_asc" | "posted_desc",
  });

  const [selectedJob, setSelectedJob] = useState<PlacementJob | null>(null);

  const fetchJobs = useCallback(
    async (nextPage: number, filters = activeFilters) => {
      setLoading(true);
      setError("");
      try {
        const params: any = {
          page: nextPage,
          limit,
          sort: filters.sort,
          eligible_only: filters.eligible_only,
        };
        if (filters.title) params.title = filters.title;
        if (filters.company) params.company = filters.company;
        if (filters.location) params.location = filters.location;
        if (filters.type) params.type = filters.type;
        if (filters.branch) params.branch = filters.branch;
        if (filters.graduation_year) params.graduation_year = filters.graduation_year;

        const res = await api.get("/api/v1/jobs", { params });
        setItems(res.data.data.items);
        setTotal(res.data.data.pagination.total);
      } catch (err: any) {
        setError(err?.response?.data?.error?.details?.[0] || "Could not load the job listings.");
        setItems([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [limit]
  );

  useEffect(() => {
    fetchJobs(page);
  }, [page, fetchJobs]);

  const onFilter = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    const nextFilters = {
      title,
      company,
      location,
      type: jobType,
      branch,
      graduation_year: gradYear,
      eligible_only: eligibleOnly,
      sort: sortOrder,
    };
    setActiveFilters(nextFilters);
    setPage(1);
    await fetchJobs(1, nextFilters);
  };

  // Auto-apply filters on toggle/sort change
  useEffect(() => {
    onFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eligibleOnly, sortOrder]);

  const disableNext = page * limit >= total;

  return (
    <div className="stack-lg">
      <PageHeader
        eyebrow="Jobs"
        title="Job Board"
        description="Browse open roles across companies. Filter by location, type, and skills to find the right fit."
      />

      <form onSubmit={onFilter} className="card shell-card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
        <div className="stack-md">
          <div style={{ display: "flex", gap: "1rem" }}>
            <Input style={{ flex: 1 }} placeholder="Search role..." value={title} onChange={(e) => setTitle(e.target.value)} />
            <Input style={{ flex: 1 }} placeholder="Company..." value={company} onChange={(e) => setCompany(e.target.value)} />
            <Input style={{ flex: 1 }} placeholder="Location..." value={location} onChange={(e) => setLocation(e.target.value)} />
            <Select style={{ width: "200px" }} value={jobType} onChange={(e) => setJobType(e.target.value)}>
              <option value="">All Types</option>
              {TYPE_OPTIONS.filter(Boolean).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </div>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <Select style={{ flex: 1 }} value={branch} onChange={(e) => setBranch(e.target.value)}>
              <option value="">Any Branch</option>
              {BRANCH_OPTIONS.filter(Boolean).map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </Select>
            <Select style={{ flex: 1 }} value={gradYear} onChange={(e) => setGradYear(e.target.value ? Number(e.target.value) : "")}>
              <option value="">Any Year</option>
              {graduationYearOptions().map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </Select>
            <Select style={{ flex: 1 }} value={sortOrder} onChange={(e) => setSortOrder(e.target.value as any)}>
              <option value="deadline_asc">Closing Soonest</option>
              <option value="posted_desc">Recently Posted</option>
            </Select>
            
            <label className="toggle-switch" style={{ marginLeft: "1rem", marginRight: "1rem" }}>
              <input type="checkbox" checked={eligibleOnly} onChange={(e) => setEligibleOnly(e.target.checked)} />
              <span className="toggle-slider"></span>
              <span className="toggle-label" style={{ whiteSpace: "nowrap" }}>Show Eligible Only</span>
            </label>

            <Button variant="primary" style={{ height: "42px", padding: "0 2rem" }} type="submit">Search</Button>
          </div>
        </div>
      </form>

      {error && <p className="error">{error}</p>}
      
      {loading && (
        <div className="job-grid-enhanced stack-md">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ padding: "1.5rem", border: "1px solid var(--border)", borderRadius: "var(--radius)", backgroundColor: "var(--surface)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                <div className="stack-sm" style={{ width: "60%" }}>
                  <Skeleton variant="title" width="80%" />
                  <Skeleton variant="text" width="40%" />
                </div>
                <Skeleton variant="rect" width={80} height={30} style={{ borderRadius: "20px" }} />
              </div>
              <Skeleton variant="text" width="100%" />
              <Skeleton variant="text" width="90%" style={{ marginTop: "0.5rem" }} />
              <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                <Skeleton variant="text" width={100} />
                <Skeleton variant="text" width={100} />
                <Skeleton variant="text" width={100} />
              </div>
            </div>
          ))}
        </div>
      )}
      
      {!loading && !error && items.length === 0 && (
        <EmptyState
          title="No Opportunities Found"
          description="Try adjusting your search criteria or turning off the 'Eligible Only' filter."
        />
      )}

      <div className="job-grid-enhanced stack-md">
        {items.map((job) => (
          <JobCard 
            key={job.id} 
            job={job} 
            onClick={() => setSelectedJob(job)} 
            onApply={() => setSelectedJob(job)}
          />
        ))}
      </div>

      <div className="row page-controls">
        <button className="button" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>
          Previous
        </button>
        <span className="meta-pill">
          Page {page} of {Math.max(1, Math.ceil(total / limit))}
        </span>
        <button className="button" disabled={disableNext || loading} onClick={() => setPage((p) => p + 1)}>
          Next
        </button>
      </div>

      {selectedJob && <JobDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} />}
    </div>
  );
}
