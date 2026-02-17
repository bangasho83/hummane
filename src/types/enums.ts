export const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '500+'] as const
export type CompanySize = typeof COMPANY_SIZES[number]

export const EMPLOYMENT_TYPES = ['Contract', 'Full-time', 'Intern', 'Part-time', 'Probation'] as const
export type EmploymentType = typeof EMPLOYMENT_TYPES[number]

export const EMPLOYMENT_MODES = ['Onsite', 'Hybrid', 'Remote'] as const
export type EmploymentMode = typeof EMPLOYMENT_MODES[number]

export const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'] as const
export type Gender = typeof GENDER_OPTIONS[number]

export const LEAVE_UNITS = ['Day', 'Hour'] as const
export type LeaveUnit = typeof LEAVE_UNITS[number]

export const JOB_STATUSES = ['open', 'closed'] as const
export type JobStatus = typeof JOB_STATUSES[number]

export const APPLICANT_STATUSES = [
  'new',
  'first interview',
  'second interview',
  'final interview',
  'initiate documentation',
  'hired',
  'rejected'
] as const
export type ApplicantStatus = typeof APPLICANT_STATUSES[number]

export const FEEDBACK_SUBJECTS = ['Team Member', 'Applicant'] as const
export type FeedbackSubject = typeof FEEDBACK_SUBJECTS[number]

export const DOCUMENT_KINDS = [
  'Government ID',
  'CV (Curriculum Vitae)',
  'Educational Documents',
  'Experience Letter',
  'Salary Slip',
  'Personality Test Report',
  'Contract'
] as const
export type DocumentKind = typeof DOCUMENT_KINDS[number]
