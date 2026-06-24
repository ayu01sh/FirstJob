export type VerificationStatus = "unverified" | "verified" | "rejected";

export type JobPreference = "internship" | "full_time" | "remote";

export type StudentProfile = {
  id: string;
  email: string;
  name?: string;
  college_name?: string;
  college_email?: string;
  college_domain?: string;
  degree?: string;
  branch?: string;
  graduation_year?: number;
  cgpa?: number;
  backlogs?: number;
  preferred_locations?: string[];
  job_preferences?: JobPreference[];
  target_role: string;
  skills?: string[];
  verification_status?: VerificationStatus;
};

export type ProfileCompleteness = {
  score: number;
  completed: string[];
  missing: string[];
  next_action: string;
};

export type EligibilityStatus = "eligible" | "almost_eligible" | "not_eligible" | "unknown";

export type JobEligibility = {
  status: EligibilityStatus;
  reasons: string[];
};

export type PlacementJob = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  work_mode: string;
  ctc: string;
  stipend: string;
  deadline: string;
  deadline_days_left: number | null;
  skills_required: string[];
  eligible_degrees: string[];
  eligible_branches: string[];
  eligible_graduation_years: number[];
  min_cgpa: number | null;
  max_backlogs: number | null;
  rounds: string[];
  application_link: string;
  source: string;
  is_verified: boolean;
  posted_at: string;
  eligibility_status: EligibilityStatus;
  eligibility_reasons: string[];
};

export type JobMatch = {
  job_id: string;
  title: string;
  company: string;
  score: number;
  fit_level: "strong" | "good" | "stretch";
  matched_skills: string[];
  missing_skills: string[];
  eligibility_status: EligibilityStatus;
  reasons: string[];
  eligibility_reasons: string[];
  next_action: string;
  posted_at: string;
  deadline_days_left: number | null;
};

export type MatchSourceSummary = {
  source_type: "resume" | "profile" | "none";
  readiness_warnings: string[];
  recommended_action: string;
};

export type MatchesResponseData = {
  source_summary: MatchSourceSummary;
  items: JobMatch[];
};

export type ApplicationStatus =
  | "saved"
  | "applied"
  | "oa"
  | "technical_interview"
  | "hr"
  | "offer"
  | "rejected"
  | "withdrawn";

export type StudentApplication = {
  _id: string;
  user_id: string;
  job_id: string;
  status: ApplicationStatus;
  source: string;
  applied_at: string | null;
  deadline: string | null;
  next_action: string | null;
  next_action_at: string | null;
  notes: string;
  round_history: { status: string; timestamp: string }[];
  company?: string;
  title?: string;
  job_type?: string;
};

export type PrepFormat = "study_notes" | "flashcards" | "oa_plan" | "behavioral" | "company_pack";

export type PrepItem = {
  id: string;
  title: string;
  format: PrepFormat;
  source_job_id?: string;
  created_at: string;
};
