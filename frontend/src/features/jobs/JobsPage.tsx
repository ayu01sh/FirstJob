import { FormEvent, useEffect, useState, useCallback } from "react";
import { api } from "../../shared/api/client";
import { type PlacementJob } from "../../shared/types/product";
import JobDetailModal from "./JobDetailModal";

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
      <section className="section-block">
        <div className="row wrap">
          <div>
            <p className="eyebrow">Campus Opportunities</p>
            <h3>Eligible Jobs Marketplace</h3>
            <p className="muted">
              Discover opportunities tailored to your profile. Eligibility is computed based on your current academic
              and verification details.
            </p>
          </div>
        </div>
      </section>

      <form onSubmit={onFilter} className="filter-bar panel">
        <div className="filter-row main-filters">
          <input className="flex-1" placeholder="Search role..." value={title} onChange={(e) => setTitle(e.target.value)} />
          <input className="flex-1" placeholder="Company..." value={company} onChange={(e) => setCompany(e.target.value)} />
          <input className="flex-1" placeholder="Location..." value={location} onChange={(e) => setLocation(e.target.value)} />
          <select value={jobType} onChange={(e) => setJobType(e.target.value)}>
            <option value="">All Types</option>
            {TYPE_OPTIONS.filter(Boolean).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="filter-row adv-filters">
          <select value={branch} onChange={(e) => setBranch(e.target.value)}>
            <option value="">Any Branch</option>
            {BRANCH_OPTIONS.filter(Boolean).map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          <select value={gradYear} onChange={(e) => setGradYear(e.target.value ? Number(e.target.value) : "")}>
            <option value="">Any Year</option>
            {graduationYearOptions().map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as any)}>
            <option value="deadline_asc">Closing Soonest</option>
            <option value="posted_desc">Recently Posted</option>
          </select>
          <button className="button button-primary" type="submit">Search</button>
        </div>
        <div className="filter-row toggle-row">
          <label className="toggle-switch">
            <input type="checkbox" checked={eligibleOnly} onChange={(e) => setEligibleOnly(e.target.checked)} />
            <span className="toggle-slider"></span>
            <span className="toggle-label">Show Eligible Only</span>
          </label>
        </div>
      </form>

      {error && <p className="error">{error}</p>}
      {loading && <div className="empty-state">Loading campus opportunities...</div>}
      {!loading && !error && items.length === 0 && (
        <div className="empty-state">
          <p className="eyebrow">No Opportunities Found</p>
          <p>Try adjusting your search criteria or turning off the 'Eligible Only' filter.</p>
        </div>
      )}

      <div className="job-grid-enhanced stack-md">
        {items.map((job) => {
          const badgeClass =
            job.eligibility_status === "eligible"
              ? "elig-eligible"
              : job.eligibility_status === "almost_eligible"
              ? "elig-almost"
              : "elig-not";

          const badgeText =
            job.eligibility_status === "eligible"
              ? "Eligible"
              : job.eligibility_status === "almost_eligible"
              ? "Almost Eligible"
              : "Not Eligible";

          return (
            <article className="job-card-enhanced panel" key={job.id} onClick={() => setSelectedJob(job)}>
              <div className="job-card-header">
                <div className="job-card-title-group">
                  <h4>{job.title}</h4>
                  <p className="muted">{job.company}</p>
                </div>
                <div className="job-card-status">
                  <span className={`eligibility-badge ${badgeClass}`}>{badgeText}</span>
                  {job.deadline_days_left !== null && (
                    <span className="deadline-chip">{job.deadline_days_left}d left</span>
                  )}
                </div>
              </div>
              <div className="job-meta-row">
                <span className="meta-pill">{job.type}</span>
                <span className="meta-pill">{job.location}</span>
                <span className="meta-pill">{job.ctc || job.stipend || "Compensation unlisted"}</span>
                {job.rounds && job.rounds.length > 0 && <span className="meta-pill">{job.rounds.length} rounds</span>}
              </div>
              {job.eligibility_status !== "eligible" && job.eligibility_reasons.length > 0 && (
                <div className="job-reasons-preview">
                  <span className="reason-label">⚠ {job.eligibility_reasons[0]}</span>
                  {job.eligibility_reasons.length > 1 && (
                    <span className="muted"> + {job.eligibility_reasons.length - 1} more</span>
                  )}
                </div>
              )}
            </article>
          );
        })}
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
