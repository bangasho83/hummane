import type {
    ApplicantStatus,
    CompanySize,
    DocumentKind,
    EmploymentMode,
    EmploymentType,
    FeedbackSubject,
    Gender,
    JobStatus,
    LeaveUnit
} from './enums'

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
    size: CompanySize
    currency?: string
    timezone?: string
    workingHours?: Record<
        'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday',
        {
            open: boolean
            start: string
            end: string
        }
    >
    ownerId: string
    createdAt: string
}

export const BLOOD_GROUP_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const
export type BloodGroup = typeof BLOOD_GROUP_OPTIONS[number]

// Personal Details JSON structure for employee (matches API)
export interface EmployeePersonalDetails {
    personalInfo?: {
        email?: string
        number?: string
    }
    nationalId?: string
    address?: {
        permanentAddress?: string
        temporaryAddress?: string
    }
    emergencyContact?: {
        relation?: string
        name?: string
        number?: string
    }
    bloodGroup?: BloodGroup
    bankAccount?: {
        title?: string
        bankName?: string
        accountNumber?: string
    }
}

export interface Employee {
    id: string
    employeeId: string
    companyId: string
    userId?: string
    departmentId?: string
    departmentName?: string | null
    reportingManagerId?: string
    reportingManagerName?: string | null
    roleName?: string | null
    name: string
    email: string
    position: string
    department: string
    roleId: string
    startDate: string
    employmentType: EmploymentType
    employmentMode: EmploymentMode
    reportingManager: string
    gender: Gender
    salary: number
    createdAt: string
    updatedAt?: string
    // Profile photo
    profilePicture?: string
    photoUrl?: string
    // Date fields
    dob?: string
    dateOfBirth?: string  // legacy alias
    jobConfirmationDate?: string
    // Personal details as JSON (matches API)
    personalDetails?: EmployeePersonalDetails
    // Legacy fields (kept for backward compatibility)
    personalEmail?: string
    personalContact?: string
    cnicNumber?: string
    permanentAddress?: string
    temporaryAddress?: string
    emergencyContactName?: string
    emergencyContactNumber?: string
    bloodGroup?: BloodGroup
    bankAccountTitle?: string
    bankName?: string
    accountNumber?: string
}

export interface EmployeeApi {
    id?: string
    employeeId?: string | null
    companyId?: string
    userId?: string | null
    departmentId?: string | null
    departmentName?: string | null
    roleId?: string | null
    roleName?: string | null
    reportingManagerId?: string | null
    reportingManager?: string | null
    reportingManagerName?: string | null
    name?: string | null
    email?: string | null
    position?: string | null
    department?: string | null
    startDate?: string | null
    employmentType?: EmploymentType
    employmentMode?: EmploymentMode
    gender?: Gender
    salary?: number | null
    createdAt?: string
    updatedAt?: string
    // Profile photo
    profilePicture?: string | null
    photoUrl?: string | null
    // Date fields
    dob?: string | null
    dateOfBirth?: string | null  // legacy alias
    jobConfirmationDate?: string | null
    // Personal details as JSON (matches API)
    personalDetails?: EmployeePersonalDetails | null
    // Legacy fields (for backward compatibility)
    personalEmail?: string | null
    personalContact?: string | null
    cnicNumber?: string | null
    permanentAddress?: string | null
    temporaryAddress?: string | null
    emergencyContactName?: string | null
    emergencyContactNumber?: string | null
    bloodGroup?: BloodGroup | null
    bankAccountTitle?: string | null
    bankName?: string | null
    accountNumber?: string | null
}

export interface Department {
    id: string
    companyId: string
    name: string
    description?: string
    managerId?: string
    createdAt: string
}

export interface LeaveRecord {
    id: string
    companyId: string
    employeeId: string
    startDate?: string
    endDate?: string
    date: string
    type: string
    leaveTypeId?: string
    leaveTypeName?: string
    leaveTypeCode?: string
    leaveTypeQuota?: number
    unit?: LeaveUnit
    amount?: number
    note: string
    documents?: {
        files: string[]
    }
    attachments?: {
        name: string
        type: string
        dataUrl: string
    }[]
    leaveDays?: LeaveDay[]
    createdAt: string
}

export interface WorkingHours {
    open: boolean
    start: string
    end: string
}

export interface LeaveDay {
    id: string
    date: string
    dayOfWeek: string
    amount: number
    isWorkingDay: boolean
    isHoliday: boolean
    isClosed: boolean
    countsTowardQuota: boolean
    workingHours: WorkingHours
}

export interface LeaveType {
    id: string
    companyId: string
    name: string
    code: string
    unit: LeaveUnit
    quota: number
    employmentType: EmploymentType
    color?: string
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
    departmentId?: string
    department?: string
    employmentType?: EmploymentType
    employmentMode?: EmploymentMode
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
    status: JobStatus
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
    documents?: {
        files: string[]
    }
    linkedinUrl?: string
    status: ApplicantStatus
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
    kind: 'score' | 'comment' | 'content'
    prompt: string
    weight?: number
}

export interface FeedbackCard {
    id: string
    companyId: string
    title: string
    subject: FeedbackSubject
    questions: FeedbackQuestion[]
    createdAt: string
    updatedAt?: string
}

export interface FeedbackEntryAnswer {
    questionId: string
    answer?: string
    score?: number
    comment?: string
}

export interface FeedbackEntry {
    id: string
    companyId: string
    cardId: string
    type?: FeedbackSubject | null
    subjectType?: string | null
    subjectId?: string
    subjectName?: string
    authorId?: string | null
    authorName?: string | null
    authorEmployeeId?: string | null
    answers: FeedbackEntryAnswer[]
    createdAt: string
    updatedAt?: string
}

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

export * from './enums'
