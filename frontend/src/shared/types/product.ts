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
  skills_required: string[];
  eligibility?: JobEligibility;
  deadline?: string;
  ctc?: string;
  stipend?: string;
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
  id: string;
  job_id: string;
  status: ApplicationStatus;
  next_action?: string;
  next_action_at?: string;
  notes?: string;
};

export type PrepFormat = "notes" | "flashcards" | "oa_plan" | "behavioral" | "company_pack";

export type PrepItem = {
  id: string;
  title: string;
  format: PrepFormat;
  source_job_id?: string;
  created_at: string;
};
