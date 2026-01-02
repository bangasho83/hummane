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
    roleId?: string
    startDate: string
    employmentType: 'Permanent' | 'Probation' | 'Contract' | 'Intern' | 'Part-time'
    reportingManager: string
    gender: 'Male' | 'Female' | 'Non-binary' | 'Prefer not to say'
    timeZone: string
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
    currentSalary: string
    expectedSalary: string
    noticePeriod: string
    resumeUrl?: string
    linkedinUrl?: string
    status: 'new' | 'screening' | 'interview' | 'offer' | 'rejected' | 'hired'
    appliedDate: string
    createdAt: string
    updatedAt?: string
}

export interface DataStoreSchema {
    users: User[]
    companies: Company[]
    employees: Employee[]
    departments: Department[]
    leaves: LeaveRecord[]
    leaveTypes: LeaveType[]
    roles: Role[]
    jobs: Job[]
    applicants: Applicant[]
    currentUser: string | null
}
