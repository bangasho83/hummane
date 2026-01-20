'use client'

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User, Company, CompanySize, Employee, Department, LeaveRecord, Role, Job, Applicant, LeaveType, Holiday, EmployeeDocument, FeedbackCard, FeedbackEntry, FeedbackQuestion } from '@/types'
import { COMPANY_SIZES } from '@/types'
import { dataStore } from '@/lib/store/dataStore'
import { firebaseAuth, googleAuthProvider } from '@/lib/firebase/client'
import {
    createUserWithEmailAndPassword,
    getIdToken,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    updateProfile,
    type User as FirebaseUser
} from 'firebase/auth'
import {
    clearApiSession,
    createCompanyApi,
    createEmployeeApi,
    updateCompanyApi,
    fetchCompanyApi,
    exchangeFirebaseToken,
    createDepartmentApi,
    deleteDepartmentApi,
    deleteEmployeeApi,
    createFeedbackCardApi,
    createRoleApi,
    deleteRoleApi,
    fetchRolesApi,
    updateRoleApi,
    createLeaveTypeApi,
    createLeaveApi,
    deleteLeaveTypeApi,
    fetchLeaveTypesApi,
    fetchLeavesApi,
    updateLeaveTypeApi,
    deleteFeedbackCardApi,
    fetchFeedbackCardsApi,
    createFeedbackEntryApi,
    deleteFeedbackEntryApi,
    fetchFeedbackEntriesApi,
    createHolidayApi,
    deleteHolidayApi,
    fetchHolidaysApi,
    fetchEmployeesApi,
    createJobApi,
    deleteJobApi,
    fetchJobsApi,
    updateJobApi,
    createApplicantApi,
    deleteApplicantApi,
    fetchApplicantsApi,
    updateApplicantApi,
    updateFeedbackCardApi,
    updateFeedbackEntryApi,
    updateEmployeeApi,
    updateDepartmentApi,
    fetchDepartmentsApi,
    createDocumentApi,
    deleteDocumentApi,
    fetchDocumentsApi,
    getStoredCompanyId,
    getStoredAccessToken,
    getStoredApiUser,
    persistCompanyId,
    type AuthLoginResponse,
    type ApiUser
} from '@/lib/api/client'
interface AppContextType {
    currentUser: User | null
    currentCompany: Company | null
    employees: Employee[]
    departments: Department[]
    leaves: LeaveRecord[]
    leaveTypes: LeaveType[]
    holidays: Holiday[]
    feedbackCards: FeedbackCard[]
    feedbackEntries: FeedbackEntry[]
    roles: Role[]
    jobs: Job[]
    applicants: Applicant[]
    authLoginResponse: AuthLoginResponse | null
    apiAccessToken: string | null
    companyApiResponse: Company | null
    apiCompanyId: string | null
    login: (email: string, password: string) => Promise<{ success: boolean; message: string }>
    loginWithGoogle: () => Promise<{ success: boolean; message: string }>
    signup: (name: string, email: string, password: string) => Promise<{ success: boolean; message: string }>
    logout: () => Promise<void>
    createCompany: (name: string, industry: string, size: CompanySize) => Promise<Company>
    updateCompany: (id: string, companyData: Partial<Omit<Company, 'id' | 'ownerId' | 'createdAt'>>) => Promise<Company | null>
    createEmployee: (employeeData: Omit<Employee, 'id' | 'companyId' | 'createdAt'>) => Promise<Employee>
    updateEmployee: (id: string, employeeData: Partial<Omit<Employee, 'id' | 'companyId' | 'createdAt'>>) => Promise<Employee | null>
    deleteEmployee: (id: string) => Promise<void>
    refreshEmployees: () => Promise<void>
    createDepartment: (departmentData: Omit<Department, 'id' | 'companyId' | 'createdAt'>) => Promise<Department>
    updateDepartment: (id: string, departmentData: Partial<Omit<Department, 'id' | 'companyId' | 'createdAt'>>) => Promise<Department | null>
    deleteDepartment: (id: string) => Promise<void>
    refreshDepartments: () => Promise<void>
    createHoliday: (holiday: Omit<Holiday, 'id' | 'companyId' | 'createdAt'>) => Promise<Holiday>
    deleteHoliday: (id: string) => Promise<void>
    refreshHolidays: () => Promise<void>
    createFeedbackCard: (cardData: Omit<FeedbackCard, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>) => Promise<FeedbackCard>
    updateFeedbackCard: (id: string, updates: Partial<Omit<FeedbackCard, 'id' | 'companyId' | 'createdAt'>>) => Promise<FeedbackCard | null>
    deleteFeedbackCard: (id: string) => Promise<void>
    refreshFeedbackCards: () => Promise<void>
    createFeedbackEntry: (entry: Omit<FeedbackEntry, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>) => Promise<FeedbackEntry>
    updateFeedbackEntry: (id: string, updates: Partial<Omit<FeedbackEntry, 'id' | 'companyId' | 'createdAt'>>) => Promise<FeedbackEntry | null>
    deleteFeedbackEntry: (id: string) => Promise<void>
    refreshFeedbackEntries: () => Promise<void>
    addDocument: (doc: Omit<EmployeeDocument, 'id' | 'uploadedAt'>) => Promise<EmployeeDocument>
    deleteDocument: (id: string) => Promise<void>
    getDocuments: (employeeId: string) => Promise<EmployeeDocument[]>
    createLeaveType: (leaveTypeData: Omit<LeaveType, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>) => Promise<LeaveType>
    updateLeaveType: (id: string, leaveTypeData: Partial<Omit<LeaveType, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>>) => Promise<LeaveType | null>
    deleteLeaveType: (id: string) => Promise<void>
    refreshLeaveTypes: () => Promise<void>
    addLeave: (leaveData: Omit<LeaveRecord, 'id' | 'companyId' | 'createdAt'> & { startDate?: string; endDate?: string }) => Promise<LeaveRecord>
    createRole: (roleData: Omit<Role, 'id' | 'companyId' | 'createdAt'>) => Promise<Role>
    updateRole: (id: string, roleData: Partial<Omit<Role, 'id' | 'companyId' | 'createdAt'>>) => Promise<Role | null>
    deleteRole: (id: string) => Promise<void>
    refreshRoles: () => Promise<void>
    createJob: (jobData: Omit<Job, 'id' | 'companyId' | 'createdAt'>) => Promise<Job>
    updateJob: (id: string, jobData: Partial<Omit<Job, 'id' | 'companyId' | 'createdAt'>>) => Promise<Job | null>
    deleteJob: (id: string) => Promise<void>
    refreshJobs: () => Promise<void>
    createApplicant: (applicantData: Omit<Applicant, 'id' | 'companyId' | 'createdAt'>) => Promise<Applicant>
    updateApplicant: (id: string, applicantData: Partial<Omit<Applicant, 'id' | 'companyId' | 'createdAt'>>) => Promise<Applicant | null>
    deleteApplicant: (id: string) => Promise<void>
    refreshApplicants: (jobId?: string) => Promise<void>
    isHydrating: boolean
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User | null>(null)
    const [currentCompany, setCurrentCompany] = useState<Company | null>(null)
    const [employees, setEmployees] = useState<Employee[]>([])
    const [departments, setDepartments] = useState<Department[]>([])
    const [leaves, setLeaves] = useState<LeaveRecord[]>([])
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
    const [holidays, setHolidays] = useState<Holiday[]>([])
    const [feedbackCards, setFeedbackCards] = useState<FeedbackCard[]>([])
    const [feedbackEntries, setFeedbackEntries] = useState<FeedbackEntry[]>([])
    const [roles, setRoles] = useState<Role[]>([])
    const [jobs, setJobs] = useState<Job[]>([])
    const [applicants, setApplicants] = useState<Applicant[]>([])
    const [mounted, setMounted] = useState(false)
    const [isHydrating, setIsHydrating] = useState(true)
    const [apiAccessToken, setApiAccessToken] = useState<string | null>(null)
    const [apiUser, setApiUser] = useState<ApiUser | null>(null)
    const [authLoginResponse, setAuthLoginResponse] = useState<AuthLoginResponse | null>(null)
    const [companyApiResponse, setCompanyApiResponse] = useState<Company | null>(null)
    const [apiCompanyId, setApiCompanyId] = useState<string | null>(null)

    const loadCompanyDataFromApi = async (company: Company, accessToken: string) => {
        setCurrentCompany(company)
        try {
            const [
                apiEmployees,
                apiDepartments,
                apiLeaves,
                apiLeaveTypes,
                apiHolidays,
                apiFeedbackCards,
                apiFeedbackEntries,
                apiRoles,
                apiJobs,
                apiApplicants
            ] = await Promise.all([
                fetchEmployeesApi(accessToken),
                fetchDepartmentsApi(company.id, accessToken),
                fetchLeavesApi(accessToken),
                fetchLeaveTypesApi(accessToken),
                fetchHolidaysApi(accessToken),
                fetchFeedbackCardsApi(accessToken),
                fetchFeedbackEntriesApi(accessToken),
                fetchRolesApi(accessToken),
                fetchJobsApi(accessToken),
                fetchApplicantsApi(accessToken)
            ])
            setEmployees(apiEmployees.map(emp => normalizeEmployee(emp, company.id)))
            setDepartments(apiDepartments.map(dept => normalizeDepartment(dept, company.id)))
            setLeaves(apiLeaves.map(leave => normalizeLeave(leave, company.id)))
            setLeaveTypes(apiLeaveTypes.map(lt => normalizeLeaveType(lt, company.id)))
            setHolidays(apiHolidays.map(h => normalizeHoliday(h, company.id)))
            setFeedbackCards(apiFeedbackCards.map(card => normalizeFeedbackCard(card, company.id)))
            setFeedbackEntries(apiFeedbackEntries.map(entry => normalizeFeedbackEntry(entry, company.id)))
            setRoles(apiRoles.map(role => normalizeRole(role, company.id)))
            setJobs(apiJobs.map(job => normalizeJob(job, company.id)))
            setApplicants(apiApplicants.map(app => normalizeApplicant(app, company.id)))
        } catch (error) {
            console.error('Error loading company data from API:', error)
        }
    }

    const loadCompanyData = (company: Company) => {
        setCurrentCompany(company)
        // Legacy local store loading - only used as fallback when no API access
        setEmployees(dataStore.getEmployeesByCompanyId(company.id))
        setDepartments(dataStore.getDepartmentsByCompanyId(company.id))
        setLeaves(dataStore.getLeavesByCompanyId(company.id))
        // Leave types are loaded only from API, not localStorage
        setLeaveTypes([])
        setHolidays(dataStore.getHolidaysByCompanyId(company.id))
        // Feedback cards are loaded only from API, not localStorage
        setFeedbackCards([])
        setFeedbackEntries([])
        setRoles(dataStore.getRolesByCompanyId(company.id))
        // Jobs are loaded only from API, not localStorage
        setJobs([])
        setApplicants(dataStore.getApplicantsByCompanyId(company.id))
    }

    const clearCompanyData = () => {
        setCurrentCompany(null)
        setEmployees([])
        setDepartments([])
        setLeaves([])
        setLeaveTypes([])
        setHolidays([])
        setFeedbackCards([])
        setFeedbackEntries([])
        setRoles([])
        setJobs([])
        setApplicants([])
    }

    const setUserSession = (user: User) => {
        dataStore.setCurrentUser(user.id)
        setCurrentUser(user)
        const company = dataStore.getCompanyByOwnerId(user.id)
        if (company) {
            loadCompanyData(company)
        } else {
            clearCompanyData()
        }
    }

    const generatePassword = () => {
        return `firebase_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`
    }

    const ensureLocalUser = async (params: { email: string; name: string; password?: string }) => {
        const existing = dataStore.getUserByEmail(params.email)
        if (existing) return existing
        return dataStore.createUser({
            name: params.name,
            email: params.email,
            password: params.password ?? generatePassword()
        })
    }

    const hydrateApiSession = () => {
        setApiAccessToken(getStoredAccessToken())
        setApiUser(getStoredApiUser())
        setApiCompanyId(getStoredCompanyId())
    }

    const normalizeDepartment = (
        department: Partial<Department>,
        companyId: string,
        fallback: Partial<Department> = {}
    ): Department => {
        const now = new Date().toISOString()
        const id =
            department.id ||
            fallback.id ||
            (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `dept_${Date.now()}`)

        const rawDescription = department.description ?? (department as { desc?: string }).desc ?? fallback.description

        return {
            id,
            companyId: department.companyId || fallback.companyId || companyId,
            name: department.name || fallback.name || 'Untitled Department',
            description: rawDescription,
            managerId: department.managerId ?? fallback.managerId,
            createdAt: department.createdAt || fallback.createdAt || now
        }
    }

    const normalizeRole = (role: Partial<Role>, companyId: string, fallback: Partial<Role> = {}): Role => {
        const now = new Date().toISOString()
        const id =
            role.id ||
            fallback.id ||
            (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `role_${Date.now()}`)

        return {
            id,
            companyId: role.companyId || fallback.companyId || companyId,
            title: role.title || fallback.title || 'Role',
            description: role.description || fallback.description || '',
            createdAt: role.createdAt || fallback.createdAt || now
        }
    }

    const normalizeLeaveType = (
        leaveType: Partial<LeaveType>,
        companyId: string,
        fallback: Partial<LeaveType> = {}
    ): LeaveType => {
        const now = new Date().toISOString()
        const fallbackId = (fallback as { leaveTypeId?: string }).leaveTypeId
        const apiId = (leaveType as { leaveTypeId?: string }).leaveTypeId
        const id =
            leaveType.id ||
            apiId ||
            fallback.id ||
            fallbackId ||
            (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `lt_${Date.now()}`)

        return {
            id,
            companyId: leaveType.companyId || fallback.companyId || companyId,
            name: leaveType.name || fallback.name || 'Leave Type',
            code: leaveType.code || fallback.code || 'LT',
            unit: (leaveType.unit || fallback.unit || 'Day') as LeaveType['unit'],
            quota: leaveType.quota ?? fallback.quota ?? 0,
            employmentType: (leaveType.employmentType || fallback.employmentType || 'Full-time') as LeaveType['employmentType'],
            color: leaveType.color || fallback.color,
            createdAt: leaveType.createdAt || fallback.createdAt || now,
            updatedAt: leaveType.updatedAt || fallback.updatedAt
        }
    }

    const normalizeJob = (job: Partial<Job> & { city?: string; country?: string; salaryFrom?: number; salaryTo?: number }, companyId: string): Job => {
        const now = new Date().toISOString()
        const id =
            job.id ||
            (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `job_${Date.now()}`)

        // Map API fields: city/country -> location, salaryFrom/salaryTo -> salary
        const location = job.location ?? (job.city || job.country ? { city: job.city || '', country: job.country || '' } : undefined)
        const salary = job.salary ?? {
            min: job.salaryFrom ?? 0,
            max: job.salaryTo ?? 0,
            currency: currentCompany?.currency || 'USD'
        }

        return {
            id,
            companyId: job.companyId || companyId,
            title: job.title || 'Job',
            roleId: job.roleId,
            roleName: job.roleName,
            departmentId: job.departmentId,
            departmentName: job.departmentName,
            department: job.department,
            employmentType: job.employmentType,
            employmentMode: job.employmentMode,
            location,
            salary,
            experience: job.experience ?? '',
            status: (job.status || 'open') as Job['status'],
            applicantCount: job.applicantCount,
            createdAt: job.createdAt || now,
            updatedAt: job.updatedAt
        }
    }

    const normalizeHoliday = (
        holiday: Partial<Holiday>,
        companyId: string,
        fallback: Partial<Holiday> = {}
    ): Holiday => {
        const now = new Date().toISOString()
        const id =
            holiday.id ||
            fallback.id ||
            (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `holiday_${Date.now()}`)

        return {
            id,
            companyId: holiday.companyId || fallback.companyId || companyId,
            date: holiday.date || fallback.date || new Date().toISOString().slice(0, 10),
            name: holiday.name || fallback.name || 'Holiday',
            createdAt: holiday.createdAt || fallback.createdAt || now
        }
    }

    const normalizeLeave = (
        leave: Partial<LeaveRecord>,
        companyId: string,
        fallback: Partial<LeaveRecord> = {}
    ): LeaveRecord => {
        const now = new Date().toISOString()
        const id =
            leave.id ||
            fallback.id ||
            (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `leave_${Date.now()}`)

        return {
            id,
            companyId: leave.companyId || fallback.companyId || companyId,
            employeeId: leave.employeeId || fallback.employeeId || '',
            startDate: leave.startDate || fallback.startDate,
            endDate: leave.endDate || fallback.endDate,
            date: leave.date || leave.startDate || fallback.date || new Date().toISOString().split('T')[0],
            type: leave.type || fallback.type || 'Leave',
            leaveTypeId: leave.leaveTypeId ?? fallback.leaveTypeId,
            unit: leave.unit ?? fallback.unit,
            amount: leave.amount ?? fallback.amount,
            note: leave.note || fallback.note || '',
            documents: leave.documents ?? fallback.documents,
            attachments: leave.attachments ?? fallback.attachments,
            leaveDays: leave.leaveDays ?? fallback.leaveDays,
            createdAt: leave.createdAt || fallback.createdAt || now
        }
    }

    const normalizeFeedbackCard = (
        card: Partial<FeedbackCard>,
        companyId: string,
        fallback: Partial<FeedbackCard> = {}
    ): FeedbackCard => {
        const now = new Date().toISOString()
        const id =
            card.id ||
            fallback.id ||
            (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `card_${Date.now()}`)

        const subject = (card.subject || fallback.subject || 'Team Member') as FeedbackCard['subject']
        const rawQuestions = Array.isArray(card.questions) && card.questions.length > 0
            ? card.questions
            : (fallback.questions || [])

        const questions: FeedbackQuestion[] = rawQuestions.map((question, index) => {
            const fallbackQuestion = fallback.questions?.[index]
            const rawKind = (question as { kind?: string; type?: string }).kind || (question as { type?: string }).type
            const kind: FeedbackQuestion['kind'] =
                rawKind === 'comment' || rawKind === 'text'
                    ? 'comment'
                    : rawKind === 'content'
                        ? 'content'
                        : 'score'
            const weight = kind === 'score'
                ? question.weight ?? fallbackQuestion?.weight ?? 1
                : undefined
            const questionId =
                question.id ||
                fallbackQuestion?.id ||
                (typeof crypto !== 'undefined' && 'randomUUID' in crypto
                    ? crypto.randomUUID()
                    : `fq_${Date.now()}_${index}`)

            return {
                id: questionId,
                kind,
                prompt: question.prompt || fallbackQuestion?.prompt || '',
                weight
            }
        })

        return {
            id,
            companyId: card.companyId || fallback.companyId || companyId,
            title: card.title || fallback.title || 'Feedback Card',
            subject,
            questions,
            createdAt: card.createdAt || fallback.createdAt || now,
            updatedAt: card.updatedAt || fallback.updatedAt
        }
    }

    const normalizeFeedbackEntry = (
        entry: Partial<FeedbackEntry>,
        companyId: string,
        _fallback: Partial<FeedbackEntry> = {}
    ): FeedbackEntry => {
        // Use raw API response directly without any transformation
        return {
            id: entry.id || '',
            companyId: entry.companyId || companyId,
            cardId: entry.cardId || '',
            type: entry.type,
            subjectType: entry.subjectType,
            subjectId: entry.subjectId,
            subjectName: entry.subjectName,
            authorId: entry.authorId,
            authorName: entry.authorName,
            answers: entry.answers || [],
            createdAt: entry.createdAt || new Date().toISOString(),
            updatedAt: entry.updatedAt
        }
    }

    const normalizeEmployee = (
        employee: Partial<Employee>,
        companyId: string,
        fallback: Partial<Employee> = {}
    ): Employee => {
        const now = new Date().toISOString()
        const id =
            employee.id ||
            fallback.id ||
            (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `emp_${Date.now()}`)

        const salaryValue = employee.salary ?? fallback.salary
        const salary = Number.isFinite(salaryValue) ? Number(salaryValue) : 0

        return {
            id,
            companyId: employee.companyId || fallback.companyId || companyId,
            employeeId: employee.employeeId || fallback.employeeId || `LEGACY-${id}`,
            userId: employee.userId ?? fallback.userId,
            departmentId: employee.departmentId ?? fallback.departmentId,
            departmentName: (employee as { departmentName?: string | null }).departmentName
                ?? (fallback as { departmentName?: string | null }).departmentName,
            reportingManagerId: employee.reportingManagerId ?? fallback.reportingManagerId,
            reportingManagerName: (employee as { reportingManagerName?: string | null }).reportingManagerName
                ?? (fallback as { reportingManagerName?: string | null }).reportingManagerName,
            roleName: (employee as { roleName?: string | null }).roleName
                ?? (fallback as { roleName?: string | null }).roleName,
            name: employee.name || fallback.name || 'Employee',
            email: employee.email || fallback.email || '',
            position: employee.position || fallback.position || '',
            department: employee.department || fallback.department || '',
            roleId: employee.roleId || fallback.roleId || '',
            startDate: employee.startDate || fallback.startDate || new Date().toISOString().split('T')[0],
            employmentType: (employee.employmentType || fallback.employmentType || 'Full-time') as Employee['employmentType'],
            employmentMode: (employee.employmentMode || fallback.employmentMode || 'Onsite') as Employee['employmentMode'],
            reportingManager: employee.reportingManager || fallback.reportingManager || 'Unassigned',
            gender: (employee.gender || fallback.gender || 'Prefer not to say') as Employee['gender'],
            salary,
            createdAt: employee.createdAt || fallback.createdAt || now,
            updatedAt: employee.updatedAt || fallback.updatedAt,
            // New fields for personal details (no fallback - use API data only)
            photoUrl: employee.photoUrl,
            dob: employee.dob,
            personalDetails: employee.personalDetails
        }
    }

    const normalizeApplicant = (
        applicant: Partial<Applicant>,
        companyId: string,
        fallback: Partial<Applicant> = {}
    ): Applicant => {
        const now = new Date().toISOString()
        const id =
            applicant.id ||
            fallback.id ||
            (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `app_${Date.now()}`)

        const fallbackResume = fallback.resumeFile
        const documentFiles = (applicant as { documents?: { files?: string[] } }).documents?.files
            || (fallback as { documents?: { files?: string[] } }).documents?.files
            || (applicant.resumeFile?.dataUrl ? [applicant.resumeFile.dataUrl] : fallbackResume?.dataUrl ? [fallbackResume.dataUrl] : [])
        const resumeFromDocuments = documentFiles?.[0]
            ? {
                name: documentFiles[0].split('/').pop() || 'document',
                type: '',
                dataUrl: documentFiles[0]
            }
            : undefined
        const documents = documentFiles && documentFiles.length > 0
            ? { files: [...documentFiles] }
            : undefined

        return {
            id,
            companyId: applicant.companyId || fallback.companyId || companyId,
            fullName: applicant.fullName || fallback.fullName || 'Applicant',
            email: applicant.email || fallback.email || '',
            phone: applicant.phone ?? fallback.phone ?? '',
            positionApplied: applicant.positionApplied ?? fallback.positionApplied ?? '',
            jobId: applicant.jobId ?? fallback.jobId,
            departmentId: applicant.departmentId ?? fallback.departmentId,
            departmentName: applicant.departmentName ?? fallback.departmentName,
            yearsOfExperience: applicant.yearsOfExperience ?? fallback.yearsOfExperience ?? 0,
            currentSalary: applicant.currentSalary ?? fallback.currentSalary ?? 0,
            expectedSalary: applicant.expectedSalary ?? fallback.expectedSalary ?? 0,
            noticePeriod: applicant.noticePeriod ?? fallback.noticePeriod ?? '',
            resumeFile: applicant.resumeFile ?? resumeFromDocuments ?? fallbackResume,
            documents,
            linkedinUrl: applicant.linkedinUrl ?? fallback.linkedinUrl,
            status: (applicant.status || fallback.status || 'new') as Applicant['status'],
            appliedDate: applicant.appliedDate || fallback.appliedDate || new Date().toISOString().split('T')[0],
            createdAt: applicant.createdAt || fallback.createdAt || now,
            updatedAt: applicant.updatedAt || fallback.updatedAt
        }
    }

    const normalizeCompany = (
        company: Partial<Company> | undefined,
        ownerId: string,
        fallback: Partial<Company> = {}
    ): Company | null => {
        const companyId = company?.id || fallback.id
        if (!companyId) return null

        const sizeValue = (company?.size || fallback.size) as CompanySize | undefined
        const size = COMPANY_SIZES.includes(sizeValue as CompanySize)
            ? (sizeValue as CompanySize)
            : COMPANY_SIZES[0]

        return {
            id: companyId,
            name: company?.name || fallback.name || 'Company',
            industry: company?.industry || fallback.industry || 'Unknown',
            size,
            currency: company?.currency || fallback.currency,
            timezone: company?.timezone || fallback.timezone,
            workingHours: company?.workingHours || fallback.workingHours,
            ownerId,
            createdAt: company?.createdAt || fallback.createdAt || new Date().toISOString()
        }
    }

    const syncApiSession = async (firebaseUser: FirebaseUser) => {
        const firebaseToken = await getIdToken(firebaseUser, true)
        const { accessToken, user, company, companyId, authResponse } = await exchangeFirebaseToken(firebaseToken)
        setApiAccessToken(accessToken)
        setApiUser(user)
        setApiCompanyId(companyId)
        setAuthLoginResponse(authResponse ?? null)
        return { accessToken, user, company, companyId }
    }

    useEffect(() => {
        setMounted(true)
        hydrateApiSession()
        // Check if user is logged in
        const user = dataStore.getCurrentUser()
        if (user) {
            setUserSession(user)
        }
        const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
            if (!firebaseUser || !firebaseUser.email) return
            const localUser = await ensureLocalUser({
                email: firebaseUser.email,
                name: firebaseUser.displayName || firebaseUser.email.split('@')[0]
            })
            setUserSession(localUser)
        })
        return () => unsubscribe()
    }, [])

    const login = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
        try {
            const credential = await signInWithEmailAndPassword(firebaseAuth, email, password)
            if (!credential.user.email) {
                return { success: false, message: 'Email is required to sign in.' }
            }

            let apiSession: Awaited<ReturnType<typeof syncApiSession>>
            try {
                apiSession = await syncApiSession(credential.user)
            } catch (error) {
                await logout()
                const message = error instanceof Error ? error.message : 'Missing company id in session'
                return { success: false, message }
            }
            const localUser = await ensureLocalUser({
                email: credential.user.email,
                name: credential.user.displayName || credential.user.email.split('@')[0],
                password
            })
            setCurrentUser(localUser)
            if (apiSession.company && apiSession.accessToken) {
                const normalizedCompany = normalizeCompany(apiSession.company, localUser.id)
                if (normalizedCompany) {
                    await loadCompanyDataFromApi(normalizedCompany, apiSession.accessToken)
                }
            } else {
                clearCompanyData()
            }
            return { success: true, message: 'Welcome back!' }
        } catch (firebaseError) {
            console.error('Login error:', firebaseError)
            return { success: false, message: 'An error occurred during login. Please try again.' }
        }
    }

    const loginWithGoogle = async (): Promise<{ success: boolean; message: string }> => {
        try {
            const credential = await signInWithPopup(firebaseAuth, googleAuthProvider)
            if (!credential.user.email) {
                return { success: false, message: 'Google account email is required.' }
            }

            let apiSession: Awaited<ReturnType<typeof syncApiSession>>
            try {
                apiSession = await syncApiSession(credential.user)
            } catch (error) {
                await logout()
                const message = error instanceof Error ? error.message : 'Missing company id in session'
                return { success: false, message }
            }
            const localUser = await ensureLocalUser({
                email: credential.user.email,
                name: credential.user.displayName || credential.user.email.split('@')[0]
            })
            setCurrentUser(localUser)
            if (apiSession.company && apiSession.accessToken) {
                const normalizedCompany = normalizeCompany(apiSession.company, localUser.id)
                if (normalizedCompany) {
                    await loadCompanyDataFromApi(normalizedCompany, apiSession.accessToken)
                }
            } else {
                clearCompanyData()
            }
            return { success: true, message: 'Welcome back!' }
        } catch (error) {
            console.error('Google login error:', error)
            const message = error instanceof Error ? error.message : 'Google sign-in failed. Please try again.'
            return { success: false, message }
        }
    }

    const signup = async (name: string, email: string, password: string): Promise<{ success: boolean; message: string }> => {
        try {
            // Enhanced password validation
            if (password.length < 8) {
                return { success: false, message: 'Password must be at least 8 characters' }
            }

            if (!/[A-Z]/.test(password)) {
                return { success: false, message: 'Password must contain at least one uppercase letter' }
            }

            if (!/[a-z]/.test(password)) {
                return { success: false, message: 'Password must contain at least one lowercase letter' }
            }

            if (!/[0-9]/.test(password)) {
                return { success: false, message: 'Password must contain at least one number' }
            }

            const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password)
            if (credential.user) {
                await updateProfile(credential.user, { displayName: name })
            }

            let apiSession: Awaited<ReturnType<typeof syncApiSession>>
            try {
                apiSession = await syncApiSession(credential.user)
            } catch (error) {
                await logout()
                const message = error instanceof Error ? error.message : 'Missing company id in session'
                return { success: false, message }
            }
            const localUser = await ensureLocalUser({ name, email, password })
            setCurrentUser(localUser)
            if (apiSession.company && apiSession.accessToken) {
                const normalizedCompany = normalizeCompany(apiSession.company, localUser.id)
                if (normalizedCompany) {
                    await loadCompanyDataFromApi(normalizedCompany, apiSession.accessToken)
                }
            } else {
                clearCompanyData()
            }

            return { success: true, message: 'Account created successfully!' }
        } catch (error) {
            console.error('Signup error:', error)
            const message = error instanceof Error ? error.message : 'An error occurred during signup. Please try again.'
            return { success: false, message }
        }
    }

    const logout = async () => {
        try {
            await signOut(firebaseAuth)
            dataStore.logout()
            setCurrentUser(null)
            clearCompanyData()
            clearApiSession()
            setApiAccessToken(null)
            setApiUser(null)
            setAuthLoginResponse(null)
            setCompanyApiResponse(null)
            setApiCompanyId(null)
        } catch (error) {
            console.error('Logout error:', error)
            throw new Error('Failed to logout. Please try again.')
        }
    }

    const createCompany = async (name: string, industry: string, size: CompanySize): Promise<Company> => {
        try {
            if (!currentUser) throw new Error('No user logged in')
            if (!apiAccessToken) throw new Error('API access required')

            const ownerId = apiUser?.id
            if (!ownerId) {
                throw new Error('API user not available')
            }
            const apiCompany = await createCompanyApi(
                {
                    name,
                    industry,
                    size,
                    ownerId
                },
                apiAccessToken
            )
            const firebaseUser = firebaseAuth.currentUser
            if (!firebaseUser) {
                throw new Error('Company created. Please sign in again to finish setup.')
            }
            let refreshedSession: Awaited<ReturnType<typeof syncApiSession>>
            try {
                refreshedSession = await syncApiSession(firebaseUser)
            } catch (error) {
                console.error('Refresh auth session error:', error)
                throw new Error('Company created. Please sign in again to finish setup.')
            }
            if (!refreshedSession.companyId) {
                throw new Error('Company created. Please sign in again to finish setup.')
            }
            const normalizedCompany = normalizeCompany(apiCompany, currentUser.id, {
                name,
                industry,
                size
            })
            if (!normalizedCompany) {
                throw new Error('Invalid company response')
            }
            setApiCompanyId(refreshedSession.companyId)
            persistCompanyId(refreshedSession.companyId)
            await loadCompanyDataFromApi(normalizedCompany, refreshedSession.accessToken)
            return normalizedCompany
        } catch (error) {
            console.error('Create company error:', error)
            throw error
        }
    }

    const updateCompany = async (id: string, companyData: Partial<Omit<Company, 'id' | 'ownerId' | 'createdAt'>>): Promise<Company | null> => {
        try {
            if (!currentUser) throw new Error('No user logged in')
            if (!apiAccessToken) throw new Error('API access required')

            const apiCompany = await updateCompanyApi(id, companyData, apiAccessToken)
            const ownerId = currentUser.id
            const normalizedCompany = normalizeCompany(apiCompany, ownerId, {
                ...(currentCompany || {}),
                ...companyData,
                id
            })
            if (!normalizedCompany) {
                throw new Error('Invalid company response')
            }
            setCurrentCompany(normalizedCompany)
            return normalizedCompany
        } catch (error) {
            console.error('Update company error:', error)
            throw error
        }
    }

    const createEmployee = async (employeeData: Omit<Employee, 'id' | 'companyId' | 'createdAt'>): Promise<Employee> => {
        try {
            if (!currentCompany) throw new Error('No company set up')
            if (!apiAccessToken) throw new Error('API access required')

            const departmentId = employeeData.departmentId
                || (employeeData.department
                    ? departments.find(dept => dept.id === employeeData.department)?.id
                        || departments.find(dept => dept.name === employeeData.department)?.id
                    : undefined)
            const reportingManagerId = employeeData.reportingManagerId
                ?? (employeeData.reportingManager
                    ? employees.find(emp => emp.name === employeeData.reportingManager)?.id
                    : undefined)
            const payload = {
                employeeId: employeeData.employeeId || '',
                companyId: currentCompany.id,
                userId: employeeData.userId,
                departmentId,
                reportingManagerId,
                roleId: employeeData.roleId,
                name: employeeData.name || '',
                email: employeeData.email || '',
                startDate: employeeData.startDate || '',
                employmentType: employeeData.employmentType || 'Full-time',
                employmentMode: employeeData.employmentMode,
                gender: employeeData.gender || 'Prefer not to say',
                salary: employeeData.salary,
                // New fields for personal details
                photoUrl: employeeData.photoUrl,
                dob: employeeData.dob,
                personalDetails: employeeData.personalDetails
            }
            const apiEmployee = await createEmployeeApi(payload, apiAccessToken)
            const normalized = normalizeEmployee(apiEmployee, currentCompany.id, employeeData)
            setEmployees(prev => [...prev, normalized])
            return normalized
        } catch (error) {
            console.error('Create employee error:', error)
            throw error
        }
    }

    const updateEmployee = async (id: string, employeeData: Partial<Omit<Employee, 'id' | 'companyId' | 'createdAt'>>): Promise<Employee | null> => {
        try {
            if (!currentCompany) throw new Error('No company set up')
            if (!apiAccessToken) throw new Error('API access required')

            const existing = employees.find(emp => emp.id === id)
            const departmentId = employeeData.departmentId
                || (employeeData.department
                    ? departments.find(dept => dept.id === employeeData.department)?.id
                        || departments.find(dept => dept.name === employeeData.department)?.id
                    : undefined)
            const reportingManagerId = employeeData.reportingManagerId
                ?? (employeeData.reportingManager
                    ? employees.find(emp => emp.name === employeeData.reportingManager)?.id
                    : undefined)
            const payload: {
                companyId: string
                employeeId?: string
                userId?: string
                departmentId?: string
                reportingManagerId?: string
                name?: string
                email?: string
                department?: string
                roleId?: string
                startDate?: string
                employmentType?: Employee['employmentType']
                employmentMode?: Employee['employmentMode']
                reportingManager?: string
                gender?: Employee['gender']
                salary?: number
                // photoUrl is sent independently on upload, not here
                dob?: string
                personalDetails?: Employee['personalDetails']
            } = {
                companyId: currentCompany.id
            }

            if (employeeData.employeeId !== undefined) payload.employeeId = employeeData.employeeId
            if (employeeData.userId !== undefined) payload.userId = employeeData.userId
            if (employeeData.department !== undefined) payload.departmentId = departmentId
            if (employeeData.reportingManagerId !== undefined || employeeData.reportingManager !== undefined) {
                payload.reportingManagerId = reportingManagerId
            }
            if (employeeData.name !== undefined) payload.name = employeeData.name
            if (employeeData.email !== undefined) payload.email = employeeData.email
            if (employeeData.department !== undefined) payload.department = employeeData.department
            if (employeeData.roleId !== undefined) payload.roleId = employeeData.roleId
            if (employeeData.startDate !== undefined) payload.startDate = employeeData.startDate
            if (employeeData.employmentType !== undefined) payload.employmentType = employeeData.employmentType
            if (employeeData.employmentMode !== undefined) payload.employmentMode = employeeData.employmentMode
            if (employeeData.reportingManager !== undefined) payload.reportingManager = employeeData.reportingManager
            if (employeeData.gender !== undefined) payload.gender = employeeData.gender
            if (employeeData.salary !== undefined) payload.salary = employeeData.salary
            // Profile photo (photoUrl) is sent independently on upload, not with form submission
            // New fields for personal details
            if (employeeData.dob !== undefined) payload.dob = employeeData.dob
            if (employeeData.personalDetails !== undefined) payload.personalDetails = employeeData.personalDetails

            const apiEmployee = await updateEmployeeApi(id, payload, apiAccessToken)
            const normalized = normalizeEmployee(apiEmployee, currentCompany.id, {
                ...(existing || {}),
                ...employeeData,
                id,
                companyId: currentCompany.id
            })
            setEmployees(prev => prev.map(emp => emp.id === id ? normalized : emp))
            return normalized
        } catch (error) {
            console.error('Update employee error:', error)
            throw error
        }
    }

    const deleteEmployee = async (id: string) => {
        try {
            if (!currentCompany) return
            if (!apiAccessToken) throw new Error('API access required')
            await deleteEmployeeApi(id, apiAccessToken)
            setEmployees(prev => prev.filter(emp => emp.id !== id))
        } catch (error) {
            console.error('Delete employee error:', error)
            throw error
        }
    }

    const refreshEmployees = async () => {
        try {
            if (!currentCompany) return
            if (!apiAccessToken) return
            const apiEmployees = await fetchEmployeesApi(apiAccessToken)
            const normalized = apiEmployees.map(employee => normalizeEmployee(employee, currentCompany.id))
            setEmployees(normalized)
        } catch (error) {
            console.error('Refresh employees error:', error)
        }
    }

    useEffect(() => {
        if (!currentCompany || !apiAccessToken) return
        void refreshEmployees()
    }, [currentCompany?.id, apiAccessToken])

    const createDepartment = async (departmentData: Omit<Department, 'id' | 'companyId' | 'createdAt'>): Promise<Department> => {
        try {
            if (!currentCompany) throw new Error('No company set up')
            if (!apiAccessToken) throw new Error('API access required')

            const payload: { companyId: string; name: string; description?: string; managerId?: string } = {
                companyId: currentCompany.id,
                name: departmentData.name
            }
            if (departmentData.description) {
                payload.description = departmentData.description
            }
            if (departmentData.managerId) {
                payload.managerId = departmentData.managerId
            }

            const apiDepartment = await createDepartmentApi(payload, apiAccessToken)
            const normalized = normalizeDepartment(apiDepartment, currentCompany.id, departmentData)
            setDepartments(prev => [...prev, normalized])
            return normalized
        } catch (error) {
            console.error('Create department error:', error)
            throw error
        }
    }

    const updateDepartment = async (
        id: string,
        departmentData: Partial<Omit<Department, 'id' | 'companyId' | 'createdAt'>>
    ): Promise<Department | null> => {
        try {
            if (!currentCompany) throw new Error('No company set up')
            if (!apiAccessToken) throw new Error('API access required')

            const payload: { companyId: string; name?: string; description?: string } = {
                companyId: currentCompany.id
            }
            if (departmentData.name) {
                payload.name = departmentData.name
            }
            if (departmentData.description !== undefined) {
                payload.description = departmentData.description
            }

            const apiDepartment = await updateDepartmentApi(id, payload, apiAccessToken)
            const existing = departments.find(dept => dept.id === id)
            const normalized = normalizeDepartment(apiDepartment, currentCompany.id, {
                ...(existing || {}),
                ...departmentData,
                id,
                companyId: currentCompany.id
            })
            setDepartments(prev => prev.map(dept => dept.id === id ? normalized : dept))
            return normalized
        } catch (error) {
            console.error('Update department error:', error)
            throw error
        }
    }

    const deleteDepartment = async (id: string) => {
        try {
            if (!currentCompany) return
            if (!apiAccessToken) throw new Error('API access required')
            await deleteDepartmentApi(id, apiAccessToken)
            setDepartments(prev => prev.filter(dept => dept.id !== id))
        } catch (error) {
            console.error('Delete department error:', error)
            throw error
        }
    }

    const refreshDepartments = async () => {
        try {
            if (!currentCompany) return
            if (!apiAccessToken) return
            const apiDepartments = await fetchDepartmentsApi(currentCompany.id, apiAccessToken)
            const normalized = apiDepartments.map(dept => normalizeDepartment(dept, currentCompany.id))
            setDepartments(normalized)
        } catch (error) {
            console.error('Refresh departments error:', error)
        }
    }

    useEffect(() => {
        if (!currentCompany || !apiAccessToken) return
        void refreshDepartments()
    }, [currentCompany?.id, apiAccessToken])

    useEffect(() => {
        if (!currentCompany || !apiAccessToken) return
        void refreshLeaveTypes()
    }, [currentCompany?.id, apiAccessToken])

    useEffect(() => {
        if (!currentCompany || !apiAccessToken) return
        void refreshHolidays()
    }, [currentCompany?.id, apiAccessToken])

    useEffect(() => {
        if (!currentCompany || !apiAccessToken || !currentUser) return
        const syncCompany = async () => {
            try {
                const apiCompany = await fetchCompanyApi(currentCompany.id, apiAccessToken)
                setCompanyApiResponse(apiCompany)
                const ownerId = currentUser.id
                const normalizedCompany = normalizeCompany(apiCompany, ownerId, {
                    ...(currentCompany || {}),
                    id: currentCompany.id
                })
                if (!normalizedCompany) return
                setCurrentCompany(normalizedCompany)
            } catch (error) {
                console.error('Fetch company error:', error)
            }
        }
        void syncCompany()
    }, [apiAccessToken, currentCompany?.id, currentUser])

    useEffect(() => {
        if (!apiAccessToken || !apiCompanyId || !currentUser) {
            // No API session to hydrate from, stop hydrating
            if (mounted && !apiAccessToken) {
                setIsHydrating(false)
            }
            return
        }
        if (currentCompany?.id === apiCompanyId) {
            setIsHydrating(false)
            return
        }
        const hydrateCompany = async () => {
            try {
                const apiCompany = await fetchCompanyApi(apiCompanyId, apiAccessToken)
                setCompanyApiResponse(apiCompany)
                const normalizedCompany = normalizeCompany(apiCompany, currentUser.id, {
                    id: apiCompanyId
                })
                if (!normalizedCompany) return
                setCurrentCompany(normalizedCompany)
            } catch (error) {
                console.error('Hydrate company error:', error)
            } finally {
                setIsHydrating(false)
            }
        }
        void hydrateCompany()
    }, [apiAccessToken, apiCompanyId, currentCompany?.id, currentUser, mounted])

    const createHoliday = async (holiday: Omit<Holiday, 'id' | 'companyId' | 'createdAt'>) => {
        try {
            if (!currentCompany) throw new Error('No company set up')
            if (!apiAccessToken) throw new Error('API access required')

            const apiHoliday = await createHolidayApi(
                {
                    date: holiday.date,
                    name: holiday.name,
                    companyId: currentCompany.id
                },
                apiAccessToken
            )
            const normalized = normalizeHoliday(apiHoliday, currentCompany.id, holiday)
            setHolidays(prev => [...prev, normalized])
            return normalized
        } catch (error) {
            console.error('Create holiday error:', error)
            throw error
        }
    }

    const deleteHoliday = async (id: string) => {
        try {
            if (!currentCompany) return
            if (!apiAccessToken) throw new Error('API access required')
            await deleteHolidayApi(id, apiAccessToken)
            setHolidays(prev => prev.filter(h => h.id !== id))
        } catch (error) {
            console.error('Delete holiday error:', error)
            throw error
        }
    }

    const refreshHolidays = async () => {
        try {
            if (!currentCompany) return
            if (!apiAccessToken) return
            const apiHolidays = await fetchHolidaysApi(apiAccessToken)
            const normalized = apiHolidays.map(h => normalizeHoliday(h, currentCompany.id))
            setHolidays(normalized)
        } catch (error) {
            console.error('Refresh holidays error:', error)
        }
    }

    const createFeedbackCard = async (cardData: Omit<FeedbackCard, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>): Promise<FeedbackCard> => {
        try {
            if (!currentCompany) throw new Error('No company set up')
            if (!apiAccessToken) throw new Error('API access required')

            const questions = cardData.questions.map(question => ({
                prompt: question.prompt,
                kind: question.kind,
                weight: question.kind === 'score' ? question.weight : undefined
            }))
            const apiCard = await createFeedbackCardApi(
                {
                    title: cardData.title,
                    subject: cardData.subject,
                    questions,
                    companyId: currentCompany.id
                },
                apiAccessToken
            )
            const normalized = normalizeFeedbackCard(apiCard, currentCompany.id, cardData)
            setFeedbackCards(prev => [...prev, normalized])
            return normalized
        } catch (error) {
            console.error('Create feedback card error:', error)
            throw error
        }
    }

    const updateFeedbackCard = async (id: string, updates: Partial<Omit<FeedbackCard, 'id' | 'companyId' | 'createdAt'>>): Promise<FeedbackCard | null> => {
        try {
            if (!currentCompany) throw new Error('No company set up')
            if (!apiAccessToken) throw new Error('API access required')

            const payload: {
                companyId: string
                title?: string
                subject?: string
                questions?: { prompt: string; kind: 'score' | 'comment' | 'content'; weight?: number }[]
            } = {
                companyId: currentCompany.id
            }
            if (updates.title !== undefined) payload.title = updates.title
            if (updates.subject !== undefined) payload.subject = updates.subject
            if (updates.questions) {
                payload.questions = updates.questions.map(question => ({
                    prompt: question.prompt,
                    kind: question.kind,
                    weight: question.kind === 'score' ? question.weight : undefined
                }))
            }

            const apiCard = await updateFeedbackCardApi(id, payload, apiAccessToken)
            const existing = feedbackCards.find(card => card.id === id)
            const normalized = normalizeFeedbackCard(apiCard, currentCompany.id, {
                ...(existing || {}),
                ...updates,
                id,
                companyId: currentCompany.id
            })
            setFeedbackCards(prev => prev.map(card => card.id === id ? normalized : card))
            return normalized
        } catch (error) {
            console.error('Update feedback card error:', error)
            throw error
        }
    }

    const deleteFeedbackCard = async (id: string) => {
        try {
            if (!currentCompany) return
            if (!apiAccessToken) throw new Error('API access required')
            await deleteFeedbackCardApi(id, apiAccessToken)
            setFeedbackCards(prev => prev.filter(card => card.id !== id))
        } catch (error) {
            console.error('Delete feedback card error:', error)
            throw error
        }
    }

    const refreshFeedbackCards = async () => {
        try {
            if (!currentCompany) return
            if (!apiAccessToken) return
            const apiCards = await fetchFeedbackCardsApi(apiAccessToken)
            const normalized = apiCards.map(card => normalizeFeedbackCard(card, currentCompany.id))
            setFeedbackCards(normalized)
        } catch (error) {
            console.error('Refresh feedback cards error:', error)
        }
    }

    useEffect(() => {
        if (!currentCompany || !apiAccessToken) return
        void refreshFeedbackCards()
    }, [currentCompany?.id, apiAccessToken])

    const createFeedbackEntry = async (entry: Omit<FeedbackEntry, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>): Promise<FeedbackEntry> => {
        try {
            if (!currentCompany) throw new Error('No company set up')
            if (!apiAccessToken) throw new Error('API access required')

            const card = feedbackCards.find(item => item.id === entry.cardId)
            const apiAnswers = entry.answers.map((answer) => {
                const questionDef = card?.questions.find(q => q.id === answer.questionId)
                const kind = questionDef?.kind || 'comment'
                const value = kind === 'comment'
                    ? answer.comment || ''
                    : Number.isFinite(answer.score)
                        ? String(answer.score)
                        : answer.comment || ''
                return {
                    questionId: answer.questionId,
                    answer: value,
                    question: {
                        id: answer.questionId,
                        questionId: answer.questionId,
                        prompt: questionDef?.prompt || '',
                        kind,
                        ...(questionDef?.weight !== undefined ? { weight: questionDef.weight } : {})
                    }
                }
            })
            const subjectType = entry.type === 'Applicant' ? 'Applicant' : 'Employee'
            const apiEntry = await createFeedbackEntryApi(
                {
                    cardId: entry.cardId,
                    subjectType,
                    subjectId: entry.subjectId,
                    subjectName: entry.subjectName,
                    authorId: entry.authorId || undefined,
                    type: entry.type === 'Applicant' ? 'applicant' : 'performance',
                    answers: apiAnswers,
                    companyId: currentCompany.id
                },
                apiAccessToken
            )
            const normalized = normalizeFeedbackEntry(apiEntry, currentCompany.id, entry)
            setFeedbackEntries(prev => [...prev, normalized])
            return normalized
        } catch (error) {
            console.error('Create feedback entry error:', error)
            throw error
        }
    }

    const updateFeedbackEntry = async (id: string, updates: Partial<Omit<FeedbackEntry, 'id' | 'companyId' | 'createdAt'>>): Promise<FeedbackEntry | null> => {
        try {
            if (!currentCompany) throw new Error('No company set up')
            if (!apiAccessToken) throw new Error('API access required')

            const existing = feedbackEntries.find(entry => entry.id === id)
            const cardId = updates.cardId || existing?.cardId || ''
            const card = feedbackCards.find(item => item.id === cardId)
            const answers = updates.answers || existing?.answers || []
            const apiAnswers = answers.map((answer) => {
                const kind = card?.questions.find(q => q.id === answer.questionId)?.kind
                const value = kind === 'comment'
                    ? answer.comment || ''
                    : Number.isFinite(answer.score)
                        ? String(answer.score)
                        : answer.comment || ''
                return {
                    questionId: answer.questionId,
                    answer: value
                }
            })
            const apiEntry = await updateFeedbackEntryApi(
                id,
                {
                    answers: apiAnswers,
                    companyId: currentCompany.id
                },
                apiAccessToken
            )
            const normalized = normalizeFeedbackEntry(apiEntry, currentCompany.id, {
                ...(existing || {}),
                ...updates,
                id,
                companyId: currentCompany.id
            })
            setFeedbackEntries(prev => prev.map(entry => entry.id === id ? normalized : entry))
            return normalized
        } catch (error) {
            console.error('Update feedback entry error:', error)
            throw error
        }
    }

    const deleteFeedbackEntry = async (id: string) => {
        try {
            if (!currentCompany) return
            if (!apiAccessToken) throw new Error('API access required')
            await deleteFeedbackEntryApi(id, apiAccessToken)
            setFeedbackEntries(prev => prev.filter(entry => entry.id !== id))
        } catch (error) {
            console.error('Delete feedback entry error:', error)
            throw error
        }
    }

    const refreshFeedbackEntries = async () => {
        try {
            if (!currentCompany) return
            if (!apiAccessToken) return
            const apiEntries = await fetchFeedbackEntriesApi(apiAccessToken)
            const normalized = apiEntries.map(entry => normalizeFeedbackEntry(entry, currentCompany.id))
            setFeedbackEntries(normalized)
        } catch (error) {
            console.error('Refresh feedback entries error:', error)
        }
    }

    useEffect(() => {
        if (!currentCompany || !apiAccessToken) return
        void refreshFeedbackEntries()
    }, [currentCompany?.id, apiAccessToken])

    const addDocument = async (doc: Omit<EmployeeDocument, 'id' | 'uploadedAt'>): Promise<EmployeeDocument> => {
        try {
            if (!currentCompany) throw new Error('No company set up')
            if (!apiAccessToken) throw new Error('API access required')

            const payload = {
                employeeId: doc.employeeId,
                name: doc.name,
                type: doc.type,
                dataUrl: doc.dataUrl,
                companyId: currentCompany.id
            }
            const apiDoc = await createDocumentApi(payload, apiAccessToken)
            const now = new Date().toISOString()
            const normalized: EmployeeDocument = {
                id: apiDoc.id || `doc_${Date.now()}`,
                employeeId: apiDoc.employeeId || doc.employeeId,
                name: apiDoc.name || doc.name,
                type: (apiDoc.type || doc.type) as EmployeeDocument['type'],
                dataUrl: apiDoc.dataUrl || doc.dataUrl,
                uploadedAt: apiDoc.uploadedAt || now
            }
            return normalized
        } catch (error) {
            console.error('Add document error:', error)
            throw error
        }
    }

    const deleteDocument = async (id: string): Promise<void> => {
        try {
            if (!apiAccessToken) throw new Error('API access required')
            await deleteDocumentApi(id, apiAccessToken)
        } catch (error) {
            console.error('Delete document error:', error)
            throw error
        }
    }

    const getDocuments = async (employeeId: string): Promise<EmployeeDocument[]> => {
        try {
            if (!apiAccessToken) return []
            const apiDocs = await fetchDocumentsApi(apiAccessToken, employeeId)
            const normalized = apiDocs.map((doc) => ({
                id: doc.id || `doc_${Date.now()}`,
                employeeId: doc.employeeId || employeeId,
                name: doc.name || 'Document',
                type: (doc.type || 'Government ID') as EmployeeDocument['type'],
                dataUrl: doc.dataUrl || '',
                uploadedAt: doc.uploadedAt || new Date().toISOString()
            }))
            return normalized
        } catch (error) {
            console.error('Get documents error:', error)
            return []
        }
    }

    const createLeaveType = async (leaveTypeData: Omit<LeaveType, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>) => {
        try {
            if (!currentCompany) throw new Error('No company set up')
            if (!apiAccessToken) throw new Error('API access required')

            const payload: {
                name: string
                unit: string
                quota: number
                companyId: string
                code?: string
                employmentType?: string
                color?: string
            } = {
                name: leaveTypeData.name,
                unit: leaveTypeData.unit,
                quota: leaveTypeData.quota,
                companyId: currentCompany.id
            }

            if (leaveTypeData.code) payload.code = leaveTypeData.code
            if (leaveTypeData.employmentType) payload.employmentType = leaveTypeData.employmentType
            if (leaveTypeData.color) payload.color = leaveTypeData.color

            const apiLeaveType = await createLeaveTypeApi(payload, apiAccessToken)
            const normalized = normalizeLeaveType(apiLeaveType, currentCompany.id, leaveTypeData)
            setLeaveTypes(prev => [...prev, normalized])
            return normalized
        } catch (error) {
            console.error('Create leave type error:', error)
            throw error
        }
    }

    const deleteLeaveType = async (id: string) => {
        try {
            if (!currentCompany) return
            if (!apiAccessToken) throw new Error('API access required')
            await deleteLeaveTypeApi(id, apiAccessToken)
            setLeaveTypes(prev => prev.filter(lt => lt.id !== id))
        } catch (error) {
            console.error('Delete leave type error:', error)
            throw error
        }
    }

    const updateLeaveType = async (
        id: string,
        leaveTypeData: Partial<Omit<LeaveType, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>>
    ) => {
        try {
            if (!currentCompany) throw new Error('No company set up')
            if (!apiAccessToken) throw new Error('API access required')

            const payload: {
                quota?: number
                companyId: string
                name?: string
                unit?: string
                code?: string
                employmentType?: string
                color?: string
            } = {
                companyId: currentCompany.id
            }

            if (leaveTypeData.quota !== undefined) payload.quota = leaveTypeData.quota
            if (leaveTypeData.name) payload.name = leaveTypeData.name
            if (leaveTypeData.unit) payload.unit = leaveTypeData.unit
            if (leaveTypeData.code) payload.code = leaveTypeData.code
            if (leaveTypeData.employmentType) payload.employmentType = leaveTypeData.employmentType
            if (leaveTypeData.color) payload.color = leaveTypeData.color

            const apiLeaveType = await updateLeaveTypeApi(id, payload, apiAccessToken)
            const existing = leaveTypes.find(lt => lt.id === id)
            const normalized = normalizeLeaveType(apiLeaveType, currentCompany.id, {
                ...(existing || {}),
                ...leaveTypeData,
                id,
                companyId: currentCompany.id
            })
            setLeaveTypes(prev => prev.map(lt => lt.id === id ? normalized : lt))
            return normalized
        } catch (error) {
            console.error('Update leave type error:', error)
            throw error
        }
    }

    const refreshLeaveTypes = async () => {
        try {
            if (!currentCompany) return
            if (!apiAccessToken) {
                setLeaveTypes([])
                return
            }
            const apiLeaveTypes = await fetchLeaveTypesApi(apiAccessToken)
            const normalized = apiLeaveTypes.map(lt => normalizeLeaveType(lt, currentCompany.id))
            setLeaveTypes(normalized)
        } catch (error) {
            console.error('Refresh leave types error:', error)
        }
    }

    const addLeave = async (
        leaveData: Omit<LeaveRecord, 'id' | 'companyId' | 'createdAt'> & { startDate?: string; endDate?: string }
    ): Promise<LeaveRecord> => {
        try {
            if (!currentCompany) throw new Error('No company set up')
            if (!apiAccessToken) throw new Error('API access required')

            const documents = leaveData.documents
                || (leaveData.attachments?.length
                    ? { files: leaveData.attachments.map(file => file.dataUrl) }
                    : undefined)
            const startDate = leaveData.startDate || leaveData.date
            const endDate = leaveData.endDate || leaveData.date
            const apiLeave = await createLeaveApi(
                {
                    employeeId: leaveData.employeeId,
                    startDate,
                    endDate,
                    unit: leaveData.unit,
                    amount: leaveData.amount,
                    companyId: currentCompany.id,
                    note: leaveData.note,
                    leaveTypeId: leaveData.leaveTypeId,
                    documents
                },
                apiAccessToken
            )
            const responseLeaves = Array.isArray(apiLeave) ? apiLeave : [apiLeave]
            const normalizedLeaves = responseLeaves.map((leave) => normalizeLeave(leave, currentCompany.id, leaveData))
            setLeaves(prev => [...prev, ...normalizedLeaves])
            return normalizedLeaves[0]
        } catch (error) {
            console.error('Add leave error:', error)
            throw error
        }
    }

    const refreshLeaves = async () => {
        try {
            if (!currentCompany) return
            if (!apiAccessToken) return
            const apiLeaves = await fetchLeavesApi(apiAccessToken)
            const normalized = apiLeaves.map(leave => normalizeLeave(leave, currentCompany.id))
            setLeaves(normalized)
        } catch (error) {
            console.error('Refresh leaves error:', error)
        }
    }

    useEffect(() => {
        if (!currentCompany || !apiAccessToken) return
        void refreshLeaves()
    }, [currentCompany?.id, apiAccessToken])

    const createRole = async (roleData: Omit<Role, 'id' | 'companyId' | 'createdAt'>): Promise<Role> => {
        try {
            if (!currentCompany) throw new Error('No company set up')
            if (!apiAccessToken) throw new Error('API access required')

            const apiRole = await createRoleApi(
                {
                    title: roleData.title,
                    description: roleData.description,
                    companyId: currentCompany.id
                },
                apiAccessToken
            )
            const normalized = normalizeRole(apiRole, currentCompany.id, roleData)
            setRoles(prev => [...prev, normalized])
            return normalized
        } catch (error) {
            console.error('Create role error:', error)
            throw error
        }
    }

    const updateRole = async (id: string, roleData: Partial<Omit<Role, 'id' | 'companyId' | 'createdAt'>>): Promise<Role | null> => {
        try {
            if (!currentCompany) throw new Error('No company set up')
            if (!apiAccessToken) throw new Error('API access required')

            const payload: { description?: string; companyId: string; title?: string } = {
                companyId: currentCompany.id
            }
            if (roleData.description !== undefined) {
                payload.description = roleData.description
            }
            if (roleData.title) {
                payload.title = roleData.title
            }

            const apiRole = await updateRoleApi(id, payload, apiAccessToken)
            const existing = roles.find(role => role.id === id)
            const normalized = normalizeRole(apiRole, currentCompany.id, {
                ...(existing || {}),
                ...roleData,
                id,
                companyId: currentCompany.id
            })
            setRoles(prev => prev.map(role => role.id === id ? normalized : role))
            return normalized
        } catch (error) {
            console.error('Update role error:', error)
            throw error
        }
    }

    const deleteRole = async (id: string) => {
        try {
            if (!currentCompany) return
            if (!apiAccessToken) throw new Error('API access required')
            await deleteRoleApi(id, apiAccessToken)
            setRoles(prev => prev.filter(role => role.id !== id))
        } catch (error) {
            console.error('Delete role error:', error)
            throw error
        }
    }

    const refreshRoles = async () => {
        try {
            if (!currentCompany) return
            if (!apiAccessToken) return
            const apiRoles = await fetchRolesApi(apiAccessToken)
            const normalized = apiRoles.map(role => normalizeRole(role, currentCompany.id))
            setRoles(normalized)
        } catch (error) {
            console.error('Refresh roles error:', error)
        }
    }

    useEffect(() => {
        if (!currentCompany || !apiAccessToken) return
        void refreshRoles()
    }, [currentCompany?.id, apiAccessToken])

    useEffect(() => {
        if (!currentCompany || !apiAccessToken) return
        void refreshJobs()
    }, [currentCompany?.id, apiAccessToken])

    const createJob = async (jobData: Omit<Job, 'id' | 'companyId' | 'createdAt'>): Promise<Job> => {
        try {
            if (!currentCompany) throw new Error('No company found')
            if (!apiAccessToken) throw new Error('API access required')

            const departmentId = jobData.department
                ? departments.find(dept => dept.name === jobData.department)?.id
                : undefined
            const apiJob = await createJobApi(
                {
                    title: jobData.title,
                    status: jobData.status || 'open',
                    employmentType: jobData.employmentType,
                    employmentMode: jobData.employmentMode,
                    departmentId,
                    roleId: jobData.roleId || undefined,
                    city: jobData.location?.city,
                    country: jobData.location?.country,
                    salaryFrom: jobData.salary?.min,
                    salaryTo: jobData.salary?.max,
                    experience: jobData.experience,
                    companyId: currentCompany.id
                },
                apiAccessToken
            )
            const normalized = normalizeJob(apiJob, currentCompany.id)
            setJobs(prev => [...prev, normalized])
            return normalized
        } catch (error) {
            console.error('Create job error:', error)
            throw error
        }
    }

    const updateJob = async (id: string, jobData: Partial<Omit<Job, 'id' | 'companyId' | 'createdAt'>>): Promise<Job | null> => {
        try {
            if (!currentCompany) throw new Error('No company found')
            if (!apiAccessToken) throw new Error('API access required')

            const departmentId = jobData.department
                ? departments.find(dept => dept.name === jobData.department)?.id
                : undefined
            const payload: {
                status?: string
                companyId: string
                title?: string
                employmentType?: string
                employmentMode?: string
                departmentId?: string
                roleId?: string
                city?: string
                country?: string
                salaryFrom?: number
                salaryTo?: number
                experience?: string
            } = {
                companyId: currentCompany.id
            }
            if (jobData.status) payload.status = jobData.status
            if (jobData.title) payload.title = jobData.title
            if (jobData.employmentType) payload.employmentType = jobData.employmentType
            if (jobData.employmentMode) payload.employmentMode = jobData.employmentMode
            if (departmentId) payload.departmentId = departmentId
            if (jobData.roleId) payload.roleId = jobData.roleId
            if (jobData.location?.city) payload.city = jobData.location.city
            if (jobData.location?.country) payload.country = jobData.location.country
            if (jobData.salary?.min !== undefined) payload.salaryFrom = jobData.salary.min
            if (jobData.salary?.max !== undefined) payload.salaryTo = jobData.salary.max
            if (jobData.experience) payload.experience = jobData.experience

            const apiJob = await updateJobApi(id, payload, apiAccessToken)
            const normalized = normalizeJob(apiJob, currentCompany.id)
            setJobs(prev => prev.map(job => job.id === id ? normalized : job))
            return normalized
        } catch (error) {
            console.error('Update job error:', error)
            throw error
        }
    }

    const deleteJob = async (id: string) => {
        try {
            if (!currentCompany) return
            if (!apiAccessToken) throw new Error('API access required')
            await deleteJobApi(id, apiAccessToken)
            setJobs(prev => prev.filter(job => job.id !== id))
        } catch (error) {
            console.error('Delete job error:', error)
            throw error
        }
    }

    const refreshJobs = async () => {
        try {
            if (!currentCompany) return
            if (!apiAccessToken) return
            const apiJobs = await fetchJobsApi(apiAccessToken)
            const normalized = apiJobs.map(job => normalizeJob(job, currentCompany.id))
            setJobs(normalized)
        } catch (error) {
            console.error('Refresh jobs error:', error)
        }
    }

    const createApplicant = async (applicantData: Omit<Applicant, 'id' | 'companyId' | 'createdAt'>): Promise<Applicant> => {
        try {
            if (!currentCompany) throw new Error('No company found')
            if (!apiAccessToken) throw new Error('API access required')

            const appliedDate = applicantData.appliedDate || new Date().toISOString().split('T')[0]
            const payload: {
                fullName: string
                email: string
                status: string
                appliedDate: string
                companyId: string
                documents?: { files: string[] }
                linkedinUrl?: string
                phone?: string
                positionApplied?: string
                yearsOfExperience?: number
                currentSalary?: number
                expectedSalary?: number
                noticePeriod?: string
                jobId?: string
            } = {
                fullName: applicantData.fullName,
                email: applicantData.email,
                status: applicantData.status || 'new',
                appliedDate,
                companyId: currentCompany.id
            }

            if (applicantData.resumeFile) {
                payload.documents = { files: [applicantData.resumeFile.dataUrl] }
            }
            if (applicantData.linkedinUrl) payload.linkedinUrl = applicantData.linkedinUrl
            if (applicantData.phone) payload.phone = applicantData.phone
            if (applicantData.positionApplied) payload.positionApplied = applicantData.positionApplied
            if (applicantData.yearsOfExperience !== undefined) payload.yearsOfExperience = applicantData.yearsOfExperience
            if (applicantData.currentSalary !== undefined) payload.currentSalary = applicantData.currentSalary
            if (applicantData.expectedSalary !== undefined) payload.expectedSalary = applicantData.expectedSalary
            if (applicantData.noticePeriod) payload.noticePeriod = applicantData.noticePeriod
            if (applicantData.jobId) payload.jobId = applicantData.jobId

            const apiApplicant = await createApplicantApi(payload, apiAccessToken)
            const normalized = normalizeApplicant(apiApplicant, currentCompany.id, {
                ...applicantData,
                appliedDate
            })
            setApplicants(prev => [...prev, normalized])
            return normalized
        } catch (error) {
            console.error('Create applicant error:', error)
            throw error
        }
    }

    const updateApplicant = async (id: string, applicantData: Partial<Omit<Applicant, 'id' | 'companyId' | 'createdAt'>>): Promise<Applicant | null> => {
        try {
            if (!currentCompany) throw new Error('No company found')
            if (!apiAccessToken) throw new Error('API access required')

            const existing = applicants.find(applicant => applicant.id === id)
            const status = (applicantData.status || existing?.status || 'new') as Applicant['status']
            const apiApplicant = await updateApplicantApi(
                id,
                {
                    status,
                    companyId: currentCompany.id
                },
                apiAccessToken
            )
            const normalized = normalizeApplicant(apiApplicant, currentCompany.id, {
                ...(existing || {}),
                ...applicantData,
                id,
                companyId: currentCompany.id,
                status
            })
            setApplicants(prev => prev.map(applicant => applicant.id === id ? normalized : applicant))
            return normalized
        } catch (error) {
            console.error('Update applicant error:', error)
            throw error
        }
    }

    const deleteApplicant = async (id: string) => {
        try {
            if (!currentCompany) return
            if (!apiAccessToken) throw new Error('API access required')
            await deleteApplicantApi(id, apiAccessToken)
            setApplicants(prev => prev.filter(applicant => applicant.id !== id))
        } catch (error) {
            console.error('Delete applicant error:', error)
            throw error
        }
    }

    const refreshApplicants = async (jobId?: string) => {
        try {
            if (!currentCompany) return
            if (!apiAccessToken) return
            const apiApplicants = await fetchApplicantsApi(apiAccessToken, jobId)
            const normalized = apiApplicants.map(applicant => normalizeApplicant(applicant, currentCompany.id))
            setApplicants(normalized)
        } catch (error) {
            console.error('Refresh applicants error:', error)
        }
    }

    // Applicants are fetched on-demand when visiting the applicants page, not on login

    if (!mounted) {
        return null // Prevent SSR mismatch
    }

    return (
        <AppContext.Provider
            value={{
                currentUser,
                currentCompany,
                employees,
                departments,
                leaves,
                leaveTypes,
                holidays,
                feedbackCards,
                feedbackEntries,
                roles,
                jobs,
                applicants,
                authLoginResponse,
                apiAccessToken,
                companyApiResponse,
                apiCompanyId,
                login,
                loginWithGoogle,
                signup,
                logout,
                createCompany,
                updateCompany,
                createEmployee,
                updateEmployee,
                deleteEmployee,
                refreshEmployees,
                createDepartment,
                updateDepartment,
                deleteDepartment,
                refreshDepartments,
                createHoliday,
                deleteHoliday,
                refreshHolidays,
                createFeedbackCard,
                updateFeedbackCard,
                deleteFeedbackCard,
                refreshFeedbackCards,
                createFeedbackEntry,
                updateFeedbackEntry,
                deleteFeedbackEntry,
                refreshFeedbackEntries,
                createLeaveType,
                updateLeaveType,
                deleteLeaveType,
                refreshLeaveTypes,
                addDocument,
                deleteDocument,
                getDocuments,
                addLeave,
                createRole,
                updateRole,
                deleteRole,
                refreshRoles,
                createJob,
                updateJob,
                deleteJob,
                refreshJobs,
                createApplicant,
                updateApplicant,
                deleteApplicant,
                refreshApplicants,
                isHydrating
            }}
        >
            {children}
        </AppContext.Provider>
    )
}

export function useApp() {
    const context = useContext(AppContext)
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider')
    }
    return context
}
