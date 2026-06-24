import { type PlacementJob } from "../../shared/types/product";

type Props = {
  job: PlacementJob;
  onClose: () => void;
};

export default function JobDetailModal({ job, onClose }: Props) {
  const badgeClass =
    job.eligibility_status === "eligible"
      ? "elig-eligible"
      : job.eligibility_status === "almost_eligible"
      ? "elig-almost"
      : "elig-not";

  const badgeText =
    job.eligibility_status === "eligible"
      ? "✓ Eligible"
      : job.eligibility_status === "almost_eligible"
      ? "⚠ Almost Eligible"
      : "✗ Not Eligible";

  return (
    <div className="job-detail-overlay" onClick={onClose}>
      <div className="job-detail-modal card shell-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-area">
            <p className="eyebrow">{job.company}</p>
            <h2>{job.title}</h2>
            <div className="job-meta-row">
              <span className="meta-pill">{job.type}</span>
              <span className="meta-pill">{job.work_mode || "Location unspecified"}</span>
              <span className="meta-pill">{job.location}</span>
            </div>
          </div>
          <button className="button button-icon" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        <div className="modal-body stack-lg">
          <section className="eligibility-section">
            <div className="eligibility-header">
              <h3>Eligibility Check</h3>
              <span className={`eligibility-badge ${badgeClass}`}>{badgeText}</span>
            </div>
            <ul className="list-clean">
              {job.eligibility_reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </section>

          <div className="grid-two">
            <section className="detail-section">
              <p className="eyebrow">Compensation</p>
              <p className="large-text">{job.ctc || job.stipend || "Not specified"}</p>
            </section>
            <section className="detail-section">
              <p className="eyebrow">Deadline</p>
              {job.deadline ? (
                <div className="deadline-box">
                  <span className="deadline-date">
                    {new Date(job.deadline).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  {job.deadline_days_left !== null && (
                    <span className="deadline-chip">{job.deadline_days_left} days left</span>
                  )}
                </div>
              ) : (
                <p>No deadline</p>
              )}
            </section>
          </div>

          <section className="detail-section">
            <p className="eyebrow">Required Skills</p>
            <div className="chip-row">
              {job.skills_required.length > 0 ? (
                job.skills_required.map((skill) => (
                  <span className="chip" key={skill}>
                    {skill}
                  </span>
                ))
              ) : (
                <span className="muted">No specific skills listed</span>
              )}
            </div>
          </section>

          <section className="detail-section">
            <p className="eyebrow">Interview Process</p>
            {job.rounds && job.rounds.length > 0 ? (
              <div className="rounds-strip">
                {job.rounds.map((round, i) => (
                  <div className="round-step" key={i}>
                    <div className="round-number">{i + 1}</div>
                    <div className="round-name">{round}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">Interview rounds not specified</p>
            )}
          </section>

          {job.application_link ? (
            <a
              href={job.application_link}
              target="_blank"
              rel="noreferrer"
              className="button button-primary"
            >
              Apply on Company Portal
            </a>
          ) : (
            <button className="button button-primary" disabled>
              Application Link Unavailable
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
