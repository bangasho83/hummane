export interface User {
    id: string
    name: string
    email: string
    password: string
    companyId?: string
    createdAt: string
}

export interface Company {
    id: string
    name: string
    industry: string
    size: string
    currency?: string
    ownerId: string
    createdAt: string
}

export interface Employee {
    id: string
    employeeId: string
    companyId: string
    name: string
    email: string
    position: string
    department: string
    roleId: string
    startDate: string
    employmentType: 'Contract' | 'Full-time' | 'Intern' | 'Part-time'
    reportingManager: string
    gender: 'Male' | 'Female' | 'Non-binary' | 'Prefer not to say'
    salary: number
    createdAt: string
    updatedAt?: string
}

export interface Department {
    id: string
    companyId: string
    name: string
    description?: string
    createdAt: string
}

export interface LeaveRecord {
    id: string
    companyId: string
    employeeId: string
    date: string
    type: string
    leaveTypeId?: string
    unit?: 'Day' | 'Hour'
    amount?: number
    note: string
    attachments?: {
        name: string
        type: string
        dataUrl: string
    }[]
    createdAt: string
}

export interface LeaveType {
    id: string
    companyId: string
    name: string
    code: string
    unit: 'Day' | 'Hour'
    quota: number
    employmentType: Employee['employmentType']
    createdAt: string
    updatedAt?: string
}

export interface Role {
    id: string
    companyId: string
    title: string
    description: string
    createdAt: string
}

export interface Job {
    id: string
    companyId: string
    title: string
    roleId?: string
    department?: string
    employmentType?: Employee['employmentType']
    location?: {
        city: string
        country: string
    }
    salary: {
        min: number
        max: number
        currency: string
    }
    experience: string
    status: 'open' | 'closed'
    createdAt: string
    updatedAt?: string
}

export interface Applicant {
    id: string
    companyId: string
    jobId?: string
    fullName: string
    email: string
    phone: string
    positionApplied: string
    yearsOfExperience: number
    currentSalary: number
    expectedSalary: number
    noticePeriod: string
    resumeFile?: {
        name: string
        type: string
        dataUrl: string
    }
    linkedinUrl?: string
    status: 'new' | 'screening' | 'interview' | 'offer' | 'rejected' | 'hired'
    appliedDate: string
    createdAt: string
    updatedAt?: string
}

export interface Holiday {
    id: string
    companyId: string
    date: string
    name: string
    createdAt: string
}

export interface FeedbackQuestion {
    id: string
    kind: 'score' | 'comment'
    prompt: string
    weight?: number
}

export interface FeedbackCard {
    id: string
    companyId: string
    title: string
    subject: 'Team Member' | 'Applicant'
    questions: FeedbackQuestion[]
    createdAt: string
    updatedAt?: string
}

export interface FeedbackEntryAnswer {
    questionId: string
    score: number
    comment?: string
}

export interface FeedbackEntry {
    id: string
    companyId: string
    type: 'Team Member' | 'Applicant'
    cardId: string
    subjectId?: string
    subjectName?: string
    answers: FeedbackEntryAnswer[]
    createdAt: string
    updatedAt?: string
}

export type DocumentKind =
    | 'Government ID'
    | 'CV (Curriculum Vitae)'
    | 'Educational Documents'
    | 'Experience Letter'
    | 'Salary Slip'
    | 'Personality Test Report'
    | 'Contract'

export interface EmployeeDocument {
    id: string
    employeeId: string
    name: string
    type: DocumentKind
    dataUrl: string
    uploadedAt: string
}

export interface DataStoreSchema {
    users: User[]
    companies: Company[]
    employees: Employee[]
    departments: Department[]
    leaves: LeaveRecord[]
    leaveTypes: LeaveType[]
    holidays: Holiday[]
    feedbackCards: FeedbackCard[]
    feedbackEntries: FeedbackEntry[]
    documents: EmployeeDocument[]
    roles: Role[]
    jobs: Job[]
    applicants: Applicant[]
    currentUser: string | null
}
