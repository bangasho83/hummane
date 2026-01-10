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
    addDocument: (doc: Omit<EmployeeDocument, 'id' | 'uploadedAt'>) => EmployeeDocument
    deleteDocument: (id: string) => void
    getDocuments: (employeeId: string) => EmployeeDocument[]
    createLeaveType: (leaveTypeData: Omit<LeaveType, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>) => Promise<LeaveType>
    updateLeaveType: (id: string, leaveTypeData: Partial<Omit<LeaveType, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>>) => Promise<LeaveType | null>
    deleteLeaveType: (id: string) => Promise<void>
    refreshLeaveTypes: () => Promise<void>
    addLeave: (leaveData: Omit<LeaveRecord, 'id' | 'companyId' | 'createdAt'>) => Promise<LeaveRecord>
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
    refreshApplicants: () => Promise<void>
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
    const [apiAccessToken, setApiAccessToken] = useState<string | null>(null)
    const [apiUser, setApiUser] = useState<ApiUser | null>(null)
    const [authLoginResponse, setAuthLoginResponse] = useState<AuthLoginResponse | null>(null)
    const [companyApiResponse, setCompanyApiResponse] = useState<Company | null>(null)
    const [apiCompanyId, setApiCompanyId] = useState<string | null>(null)

    const loadCompanyData = (company: Company) => {
        setCurrentCompany(company)
        setEmployees(dataStore.getEmployeesByCompanyId(company.id))
        setDepartments(dataStore.getDepartmentsByCompanyId(company.id))
        setLeaves(dataStore.getLeavesByCompanyId(company.id))
        setLeaveTypes(dataStore.getLeaveTypesByCompanyId(company.id))
        setHolidays(dataStore.getHolidaysByCompanyId(company.id))
        setFeedbackCards(dataStore.getFeedbackCardsByCompanyId(company.id))
        setFeedbackEntries(dataStore.getFeedbackEntriesByCompanyId(company.id))
        setRoles(dataStore.getRolesByCompanyId(company.id))
        setJobs(dataStore.getJobsByCompanyId(company.id))
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
        const id =
            leaveType.id ||
            fallback.id ||
            (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `lt_${Date.now()}`)

        return {
            id,
            companyId: leaveType.companyId || fallback.companyId || companyId,
            name: leaveType.name || fallback.name || 'Leave Type',
            code: leaveType.code || fallback.code || 'LT',
            unit: (leaveType.unit || fallback.unit || 'Day') as LeaveType['unit'],
            quota: leaveType.quota ?? fallback.quota ?? 0,
            employmentType: (leaveType.employmentType || fallback.employmentType || 'Full-time') as LeaveType['employmentType'],
            createdAt: leaveType.createdAt || fallback.createdAt || now,
            updatedAt: leaveType.updatedAt || fallback.updatedAt
        }
    }

    const normalizeJob = (job: Partial<Job>, companyId: string, fallback: Partial<Job> = {}): Job => {
        const now = new Date().toISOString()
        const id =
            job.id ||
            fallback.id ||
            (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `job_${Date.now()}`)

        const salary = job.salary || fallback.salary || { min: 0, max: 0, currency: currentCompany?.currency || 'USD' }

        return {
            id,
            companyId: job.companyId || fallback.companyId || companyId,
            title: job.title || fallback.title || 'Job',
            roleId: job.roleId ?? fallback.roleId,
            department: job.department ?? fallback.department,
            employmentType: job.employmentType ?? fallback.employmentType,
            location: job.location ?? fallback.location,
            salary,
            experience: job.experience ?? fallback.experience ?? '',
            status: (job.status || fallback.status || 'open') as Job['status'],
            createdAt: job.createdAt || fallback.createdAt || now,
            updatedAt: job.updatedAt || fallback.updatedAt
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
            date: leave.date || fallback.date || new Date().toISOString().split('T')[0],
            type: leave.type || fallback.type || 'Leave',
            leaveTypeId: leave.leaveTypeId ?? fallback.leaveTypeId,
            unit: leave.unit ?? fallback.unit,
            amount: leave.amount ?? fallback.amount,
            note: leave.note || fallback.note || '',
            documents: leave.documents ?? fallback.documents,
            attachments: leave.attachments ?? fallback.attachments,
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
                rawKind === 'comment' || rawKind === 'text' ? 'comment' : 'score'
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
        fallback: Partial<FeedbackEntry> = {}
    ): FeedbackEntry => {
        const now = new Date().toISOString()
        const id =
            entry.id ||
            fallback.id ||
            (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `entry_${Date.now()}`)

        const cardId = entry.cardId || fallback.cardId || ''
        const card = feedbackCards.find(item => item.id === cardId)
        const questionKindById = new Map(card?.questions.map(q => [q.id, q.kind]) || [])
        const sourceAnswers = Array.isArray(entry.answers) && entry.answers.length > 0
            ? entry.answers
            : (fallback.answers || [])

        const answers = sourceAnswers.map((answer) => {
            const questionId = answer.questionId
            const kind = questionKindById.get(questionId)
            const rawText = typeof (answer as { answer?: string }).answer === 'string'
                ? (answer as { answer?: string }).answer
                : answer.comment
            const rawScore = typeof answer.score === 'number' ? answer.score : undefined
            let score = 0
            let comment: string | undefined

            if (kind === 'comment') {
                comment = rawText ?? ''
            } else if (rawScore !== undefined && Number.isFinite(rawScore)) {
                score = rawScore
            } else if (typeof rawText === 'string') {
                const parsed = Number.parseFloat(rawText)
                if (Number.isFinite(parsed)) {
                    score = parsed
                } else {
                    comment = rawText
                }
            }

            if (Number.isFinite(score)) {
                score = Math.min(5, Math.max(0, Math.round(score)))
            }

            return {
                questionId,
                score,
                comment: comment?.trim() ? comment : undefined
            }
        })

        return {
            id,
            companyId: entry.companyId || fallback.companyId || companyId,
            type: (entry.type || fallback.type || card?.subject || 'Team Member') as FeedbackEntry['type'],
            cardId,
            subjectId: entry.subjectId ?? fallback.subjectId,
            subjectName: entry.subjectName || fallback.subjectName,
            authorId: entry.authorId ?? fallback.authorId,
            authorName: entry.authorName || fallback.authorName,
            answers,
            createdAt: entry.createdAt || fallback.createdAt || now,
            updatedAt: entry.updatedAt || fallback.updatedAt
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
            name: employee.name || fallback.name || 'Employee',
            email: employee.email || fallback.email || '',
            position: employee.position || fallback.position || '',
            department: employee.department || fallback.department || '',
            roleId: employee.roleId || fallback.roleId || '',
            startDate: employee.startDate || fallback.startDate || new Date().toISOString().split('T')[0],
            employmentType: (employee.employmentType || fallback.employmentType || 'Full-time') as Employee['employmentType'],
            reportingManager: employee.reportingManager || fallback.reportingManager || 'Unassigned',
            gender: (employee.gender || fallback.gender || 'Prefer not to say') as Employee['gender'],
            salary,
            documents: employee.documents ?? fallback.documents,
            createdAt: employee.createdAt || fallback.createdAt || now,
            updatedAt: employee.updatedAt || fallback.updatedAt
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
            if (apiSession.company) {
                const normalizedCompany = normalizeCompany(apiSession.company, localUser.id)
                if (normalizedCompany) {
                    dataStore.upsertCompany(normalizedCompany)
                }
            }
            setUserSession(localUser)
            return { success: true, message: 'Welcome back!' }
        } catch (firebaseError) {
            try {
                // Fallback to local auth for existing demo accounts
                const user = await dataStore.verifyUserPassword(email, password)
                if (!user) {
                    return { success: false, message: 'Invalid email or password' }
                }
                setUserSession(user)
                return { success: true, message: 'Welcome back!' }
            } catch (error) {
                console.error('Login error:', error || firebaseError)
                return { success: false, message: 'An error occurred during login. Please try again.' }
            }
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
            if (apiSession.company) {
                const normalizedCompany = normalizeCompany(apiSession.company, localUser.id)
                if (normalizedCompany) {
                    dataStore.upsertCompany(normalizedCompany)
                }
            }
            setUserSession(localUser)
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
            if (apiSession.company) {
                const normalizedCompany = normalizeCompany(apiSession.company, localUser.id)
                if (normalizedCompany) {
                    dataStore.upsertCompany(normalizedCompany)
                }
            }
            setUserSession(localUser)

            return { success: true, message: 'Account created successfully!' }
        } catch (error) {
            console.error('Signup error:', error)
            return { success: false, message: 'An error occurred during signup. Please try again.' }
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
            if (apiAccessToken) {
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
                const normalizedCompany = normalizeCompany(apiCompany, currentUser.id, {
                    name,
                    industry,
                    size
                })
                if (!normalizedCompany) {
                    throw new Error('Invalid company response')
                }
                dataStore.upsertCompany(normalizedCompany)
                setApiCompanyId(normalizedCompany.id)
                persistCompanyId(normalizedCompany.id)
                loadCompanyData(normalizedCompany)
                return normalizedCompany
            }

            const company = dataStore.createCompany({ name, industry, size }, currentUser.id)
            loadCompanyData(company)
            return company
        } catch (error) {
            console.error('Create company error:', error)
            throw error
        }
    }

    const updateCompany = async (id: string, companyData: Partial<Omit<Company, 'id' | 'ownerId' | 'createdAt'>>): Promise<Company | null> => {
        try {
            if (!currentUser) {
                throw new Error('No user logged in')
            }

            if (apiAccessToken) {
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
                dataStore.upsertCompany(normalizedCompany)
                setCurrentCompany(normalizedCompany)
                return normalizedCompany
            }

            const company = dataStore.updateCompany(id, companyData)
            if (company) {
                setCurrentCompany(company)
            }
            return company
        } catch (error) {
            console.error('Update company error:', error)
            throw error
        }
    }

    const createEmployee = async (employeeData: Omit<Employee, 'id' | 'companyId' | 'createdAt'>): Promise<Employee> => {
        try {
            if (!currentCompany) throw new Error('No company set up')

            if (apiAccessToken) {
                const payload = {
                    employeeId: employeeData.employeeId,
                    companyId: currentCompany.id,
                    name: employeeData.name,
                    email: employeeData.email,
                    startDate: employeeData.startDate,
                    employmentType: employeeData.employmentType,
                    gender: employeeData.gender,
                    documents: employeeData.documents
                }
                const apiEmployee = await createEmployeeApi(payload, apiAccessToken)
                const normalized = normalizeEmployee(apiEmployee, currentCompany.id, employeeData)
                dataStore.upsertEmployee(normalized)
                setEmployees(dataStore.getEmployeesByCompanyId(currentCompany.id))
                return normalized
            }

            const employee = dataStore.createEmployee(employeeData, currentCompany.id)
            setEmployees(dataStore.getEmployeesByCompanyId(currentCompany.id))
            return employee
        } catch (error) {
            console.error('Create employee error:', error)
            throw error
        }
    }

    const updateEmployee = async (id: string, employeeData: Partial<Omit<Employee, 'id' | 'companyId' | 'createdAt'>>): Promise<Employee | null> => {
        try {
            if (!currentCompany) throw new Error('No company set up')

            if (apiAccessToken) {
                const existing = dataStore.getEmployeesByCompanyId(currentCompany.id).find(emp => emp.id === id)
                const payload: {
                    companyId: string
                    employeeId?: string
                    name?: string
                    email?: string
                    department?: string
                    roleId?: string
                    startDate?: string
                    employmentType?: Employee['employmentType']
                    reportingManager?: string
                    gender?: Employee['gender']
                    salary?: number
                    documents?: Employee['documents']
                } = {
                    companyId: currentCompany.id
                }

                if (employeeData.employeeId !== undefined) payload.employeeId = employeeData.employeeId
                if (employeeData.name !== undefined) payload.name = employeeData.name
                if (employeeData.email !== undefined) payload.email = employeeData.email
                if (employeeData.department !== undefined) payload.department = employeeData.department
                if (employeeData.roleId !== undefined) payload.roleId = employeeData.roleId
                if (employeeData.startDate !== undefined) payload.startDate = employeeData.startDate
                if (employeeData.employmentType !== undefined) payload.employmentType = employeeData.employmentType
                if (employeeData.reportingManager !== undefined) payload.reportingManager = employeeData.reportingManager
                if (employeeData.gender !== undefined) payload.gender = employeeData.gender
                if (employeeData.salary !== undefined) payload.salary = employeeData.salary
                if (employeeData.documents !== undefined) payload.documents = employeeData.documents

                const apiEmployee = await updateEmployeeApi(id, payload, apiAccessToken)
                const normalized = normalizeEmployee(apiEmployee, currentCompany.id, {
                    ...(existing || {}),
                    ...employeeData,
                    id,
                    companyId: currentCompany.id
                })
                dataStore.upsertEmployee(normalized)
                setEmployees(dataStore.getEmployeesByCompanyId(currentCompany.id))
                return normalized
            }

            const employee = dataStore.updateEmployee(id, employeeData)
            if (currentCompany) {
                setEmployees(dataStore.getEmployeesByCompanyId(currentCompany.id))
            }
            return employee
        } catch (error) {
            console.error('Update employee error:', error)
            throw error
        }
    }

    const deleteEmployee = async (id: string) => {
        try {
            if (!currentCompany) return
            if (apiAccessToken) {
                await deleteEmployeeApi(id, apiAccessToken)
            }
            dataStore.deleteEmployee(id)
            if (currentCompany) {
                setEmployees(dataStore.getEmployeesByCompanyId(currentCompany.id))
            }
        } catch (error) {
            console.error('Delete employee error:', error)
            throw error
        }
    }

    const refreshEmployees = async () => {
        try {
            if (!currentCompany) return
            if (apiAccessToken) {
                const apiEmployees = await fetchEmployeesApi(apiAccessToken)
                const existing = dataStore.getEmployeesByCompanyId(currentCompany.id)
                const normalized = apiEmployees.map(employee => {
                    const fallback = existing.find(entry => entry.id === employee.id)
                    return normalizeEmployee(employee, currentCompany.id, fallback)
                })
                dataStore.setEmployeesForCompany(currentCompany.id, normalized)
            }
            setEmployees(dataStore.getEmployeesByCompanyId(currentCompany.id))
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

            if (apiAccessToken) {
                const payload: { companyId: string; name: string; desc?: string; managerId?: string } = {
                    companyId: currentCompany.id,
                    name: departmentData.name
                }
                if (departmentData.description) {
                    payload.desc = departmentData.description
                }
                if (departmentData.managerId) {
                    payload.managerId = departmentData.managerId
                }

                const apiDepartment = await createDepartmentApi(payload, apiAccessToken)
                const normalized = normalizeDepartment(apiDepartment, currentCompany.id, departmentData)
                dataStore.upsertDepartment(normalized)
                setDepartments(dataStore.getDepartmentsByCompanyId(currentCompany.id))
                return normalized
            }

            const department = dataStore.createDepartment(departmentData, currentCompany.id)
            setDepartments(dataStore.getDepartmentsByCompanyId(currentCompany.id))
            return department
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
            if (!currentCompany) {
                throw new Error('No company set up')
            }

            if (apiAccessToken) {
                const payload: { companyId: string; name?: string; desc?: string } = {
                    companyId: currentCompany.id
                }
                if (departmentData.name) {
                    payload.name = departmentData.name
                }
                if (departmentData.description !== undefined) {
                    payload.desc = departmentData.description
                }

                const apiDepartment = await updateDepartmentApi(id, payload, apiAccessToken)
                const existing = dataStore.getDepartmentsByCompanyId(currentCompany.id).find(dept => dept.id === id)
                const normalized = normalizeDepartment(apiDepartment, currentCompany.id, {
                    ...(existing || {}),
                    ...departmentData,
                    id,
                    companyId: currentCompany.id
                })

                if (existing) {
                    const updated = dataStore.updateDepartment(id, {
                        name: normalized.name,
                        description: normalized.description,
                        managerId: normalized.managerId
                    })
                    setDepartments(dataStore.getDepartmentsByCompanyId(currentCompany.id))
                    setEmployees(dataStore.getEmployeesByCompanyId(currentCompany.id))
                    return updated
                }

                dataStore.upsertDepartment(normalized)
                setDepartments(dataStore.getDepartmentsByCompanyId(currentCompany.id))
                return normalized
            }

            const updated = dataStore.updateDepartment(id, departmentData)
            setDepartments(dataStore.getDepartmentsByCompanyId(currentCompany.id))
            setEmployees(dataStore.getEmployeesByCompanyId(currentCompany.id))
            return updated
        } catch (error) {
            console.error('Update department error:', error)
            throw error
        }
    }

    const deleteDepartment = async (id: string) => {
        try {
            if (!currentCompany) return
            if (apiAccessToken) {
                await deleteDepartmentApi(id, apiAccessToken)
            }
            dataStore.deleteDepartment(id)
            setDepartments(dataStore.getDepartmentsByCompanyId(currentCompany.id))
        } catch (error) {
            console.error('Delete department error:', error)
            throw error
        }
    }

    const refreshDepartments = async () => {
        try {
            if (!currentCompany) return
            if (apiAccessToken) {
                const apiDepartments = await fetchDepartmentsApi(currentCompany.id, apiAccessToken)
                const normalized = apiDepartments.map(dept => normalizeDepartment(dept, currentCompany.id))
                dataStore.setDepartmentsForCompany(currentCompany.id, normalized)
            }
            setDepartments(dataStore.getDepartmentsByCompanyId(currentCompany.id))
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
                dataStore.upsertCompany(normalizedCompany)
                setCurrentCompany(normalizedCompany)
            } catch (error) {
                console.error('Fetch company error:', error)
            }
        }
        void syncCompany()
    }, [apiAccessToken, currentCompany?.id, currentUser])

    useEffect(() => {
        if (!apiAccessToken) return
        if (!apiCompanyId) {
            void logout()
        }
    }, [apiAccessToken, apiCompanyId])

    useEffect(() => {
        if (!apiAccessToken || !apiCompanyId || !currentUser) return
        if (currentCompany?.id === apiCompanyId) return
        const hydrateCompany = async () => {
            try {
                const apiCompany = await fetchCompanyApi(apiCompanyId, apiAccessToken)
                setCompanyApiResponse(apiCompany)
                const normalizedCompany = normalizeCompany(apiCompany, currentUser.id, {
                    id: apiCompanyId
                })
                if (!normalizedCompany) return
                dataStore.upsertCompany(normalizedCompany)
                setCurrentCompany(normalizedCompany)
            } catch (error) {
                console.error('Hydrate company error:', error)
            }
        }
        void hydrateCompany()
    }, [apiAccessToken, apiCompanyId, currentCompany?.id, currentUser])

    const createHoliday = async (holiday: Omit<Holiday, 'id' | 'companyId' | 'createdAt'>) => {
        try {
            if (!currentCompany) throw new Error('No company set up')

            if (apiAccessToken) {
                const apiHoliday = await createHolidayApi(
                    {
                        date: holiday.date,
                        name: holiday.name,
                        companyId: currentCompany.id
                    },
                    apiAccessToken
                )
                const normalized = normalizeHoliday(apiHoliday, currentCompany.id, holiday)
                dataStore.upsertHoliday(normalized)
                setHolidays(dataStore.getHolidaysByCompanyId(currentCompany.id))
                return normalized
            }

            const created = dataStore.createHoliday(holiday, currentCompany.id)
            setHolidays(dataStore.getHolidaysByCompanyId(currentCompany.id))
            return created
        } catch (error) {
            console.error('Create holiday error:', error)
            throw error
        }
    }

    const deleteHoliday = async (id: string) => {
        try {
            if (!currentCompany) return
            if (apiAccessToken) {
                await deleteHolidayApi(id, apiAccessToken)
            }
            dataStore.deleteHoliday(id)
            setHolidays(dataStore.getHolidaysByCompanyId(currentCompany.id))
        } catch (error) {
            console.error('Delete holiday error:', error)
            throw error
        }
    }

    const refreshHolidays = async () => {
        try {
            if (!currentCompany) return
            if (apiAccessToken) {
                const apiHolidays = await fetchHolidaysApi(apiAccessToken)
                const normalized = apiHolidays.map(h => normalizeHoliday(h, currentCompany.id))
                dataStore.setHolidaysForCompany(currentCompany.id, normalized)
            }
            setHolidays(dataStore.getHolidaysByCompanyId(currentCompany.id))
        } catch (error) {
            console.error('Refresh holidays error:', error)
        }
    }

    const createFeedbackCard = async (cardData: Omit<FeedbackCard, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>): Promise<FeedbackCard> => {
        try {
            if (!currentCompany) throw new Error('No company set up')
            if (apiAccessToken) {
                const questions = cardData.questions.map(question => ({
                    prompt: question.prompt,
                    type: question.kind === 'comment' ? 'text' : 'score',
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
                dataStore.upsertFeedbackCard(normalized)
                setFeedbackCards(dataStore.getFeedbackCardsByCompanyId(currentCompany.id))
                return normalized
            }
            const created = dataStore.createFeedbackCard(currentCompany.id, cardData)
            setFeedbackCards(dataStore.getFeedbackCardsByCompanyId(currentCompany.id))
            return created
        } catch (error) {
            console.error('Create feedback card error:', error)
            throw error
        }
    }

    const updateFeedbackCard = async (id: string, updates: Partial<Omit<FeedbackCard, 'id' | 'companyId' | 'createdAt'>>): Promise<FeedbackCard | null> => {
        try {
            if (!currentCompany) throw new Error('No company set up')
            if (apiAccessToken) {
                const payload: {
                    companyId: string
                    title?: string
                    subject?: string
                    questions?: { prompt: string; type: string; weight?: number }[]
                } = {
                    companyId: currentCompany.id
                }
                if (updates.title !== undefined) payload.title = updates.title
                if (updates.subject !== undefined) payload.subject = updates.subject
                if (updates.questions) {
                    payload.questions = updates.questions.map(question => ({
                        prompt: question.prompt,
                        type: question.kind === 'comment' ? 'text' : 'score',
                        weight: question.kind === 'score' ? question.weight : undefined
                    }))
                }

                const apiCard = await updateFeedbackCardApi(id, payload, apiAccessToken)
                const existing = dataStore.getFeedbackCardsByCompanyId(currentCompany.id).find(card => card.id === id)
                const normalized = normalizeFeedbackCard(apiCard, currentCompany.id, {
                    ...(existing || {}),
                    ...updates,
                    id,
                    companyId: currentCompany.id
                })
                dataStore.upsertFeedbackCard(normalized)
                setFeedbackCards(dataStore.getFeedbackCardsByCompanyId(currentCompany.id))
                return normalized
            }
            const updated = dataStore.updateFeedbackCard(id, updates)
            if (currentCompany) {
                setFeedbackCards(dataStore.getFeedbackCardsByCompanyId(currentCompany.id))
            }
            return updated
        } catch (error) {
            console.error('Update feedback card error:', error)
            throw error
        }
    }

    const deleteFeedbackCard = async (id: string) => {
        try {
            if (!currentCompany) return
            if (apiAccessToken) {
                await deleteFeedbackCardApi(id, apiAccessToken)
            }
            dataStore.deleteFeedbackCard(id)
            if (currentCompany) {
                setFeedbackCards(dataStore.getFeedbackCardsByCompanyId(currentCompany.id))
            }
        } catch (error) {
            console.error('Delete feedback card error:', error)
            throw error
        }
    }

    const refreshFeedbackCards = async () => {
        try {
            if (!currentCompany) return
            if (apiAccessToken) {
                const apiCards = await fetchFeedbackCardsApi(apiAccessToken)
                const existing = dataStore.getFeedbackCardsByCompanyId(currentCompany.id)
                const normalized = apiCards.map(card => {
                    const fallback = existing.find(entry => entry.id === card.id)
                    return normalizeFeedbackCard(card, currentCompany.id, fallback)
                })
                dataStore.setFeedbackCardsForCompany(currentCompany.id, normalized)
            }
            setFeedbackCards(dataStore.getFeedbackCardsByCompanyId(currentCompany.id))
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
            if (apiAccessToken) {
                const card = feedbackCards.find(item => item.id === entry.cardId)
                const apiAnswers = entry.answers.map((answer) => {
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
                const apiEntry = await createFeedbackEntryApi(
                    {
                        cardId: entry.cardId,
                        subjectId: entry.subjectId,
                        subjectName: entry.subjectName,
                        answers: apiAnswers,
                        companyId: currentCompany.id
                    },
                    apiAccessToken
                )
                const normalized = normalizeFeedbackEntry(apiEntry, currentCompany.id, entry)
                dataStore.upsertFeedbackEntry(normalized)
                setFeedbackEntries(dataStore.getFeedbackEntriesByCompanyId(currentCompany.id))
                return normalized
            }
            const created = dataStore.createFeedbackEntry(currentCompany.id, entry)
            setFeedbackEntries(dataStore.getFeedbackEntriesByCompanyId(currentCompany.id))
            return created
        } catch (error) {
            console.error('Create feedback entry error:', error)
            throw error
        }
    }

    const updateFeedbackEntry = async (id: string, updates: Partial<Omit<FeedbackEntry, 'id' | 'companyId' | 'createdAt'>>): Promise<FeedbackEntry | null> => {
        try {
            if (!currentCompany) throw new Error('No company set up')
            if (apiAccessToken) {
                const existing = dataStore.getFeedbackEntriesByCompanyId(currentCompany.id).find(entry => entry.id === id)
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
                dataStore.upsertFeedbackEntry(normalized)
                setFeedbackEntries(dataStore.getFeedbackEntriesByCompanyId(currentCompany.id))
                return normalized
            }
            const updated = dataStore.updateFeedbackEntry(id, updates)
            if (currentCompany) {
                setFeedbackEntries(dataStore.getFeedbackEntriesByCompanyId(currentCompany.id))
            }
            return updated
        } catch (error) {
            console.error('Update feedback entry error:', error)
            throw error
        }
    }

    const deleteFeedbackEntry = async (id: string) => {
        try {
            if (!currentCompany) return
            if (apiAccessToken) {
                await deleteFeedbackEntryApi(id, apiAccessToken)
            }
            dataStore.deleteFeedbackEntry(id)
            if (currentCompany) {
                setFeedbackEntries(dataStore.getFeedbackEntriesByCompanyId(currentCompany.id))
            }
        } catch (error) {
            console.error('Delete feedback entry error:', error)
            throw error
        }
    }

    const refreshFeedbackEntries = async () => {
        try {
            if (!currentCompany) return
            if (apiAccessToken) {
                const apiEntries = await fetchFeedbackEntriesApi(apiAccessToken)
                const existing = dataStore.getFeedbackEntriesByCompanyId(currentCompany.id)
                const normalized = apiEntries.map(entry => {
                    const fallback = existing.find(item => item.id === entry.id)
                    return normalizeFeedbackEntry(entry, currentCompany.id, fallback)
                })
                dataStore.setFeedbackEntriesForCompany(currentCompany.id, normalized)
            }
            setFeedbackEntries(dataStore.getFeedbackEntriesByCompanyId(currentCompany.id))
        } catch (error) {
            console.error('Refresh feedback entries error:', error)
        }
    }

    useEffect(() => {
        if (!currentCompany || !apiAccessToken) return
        void refreshFeedbackEntries()
    }, [currentCompany?.id, apiAccessToken])

    const addDocument = (doc: Omit<EmployeeDocument, 'id' | 'uploadedAt'>) => {
        try {
            return dataStore.addDocument(doc)
        } catch (error) {
            console.error('Add document error:', error)
            throw error
        }
    }

    const deleteDocument = (id: string) => {
        try {
            dataStore.deleteDocument(id)
        } catch (error) {
            console.error('Delete document error:', error)
            throw error
        }
    }

    const getDocuments = (employeeId: string): EmployeeDocument[] => {
        try {
            return dataStore.getDocumentsByEmployeeId(employeeId)
        } catch (error) {
            console.error('Get documents error:', error)
            return []
        }
    }

    const createLeaveType = async (leaveTypeData: Omit<LeaveType, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>) => {
        try {
            if (!currentCompany) throw new Error('No company set up')

            if (apiAccessToken) {
                const payload: {
                    name: string
                    unit: string
                    quota: number
                    companyId: string
                    code?: string
                    employmentType?: string
                } = {
                    name: leaveTypeData.name,
                    unit: leaveTypeData.unit,
                    quota: leaveTypeData.quota,
                    companyId: currentCompany.id
                }

                if (leaveTypeData.code) payload.code = leaveTypeData.code
                if (leaveTypeData.employmentType) payload.employmentType = leaveTypeData.employmentType

                const apiLeaveType = await createLeaveTypeApi(payload, apiAccessToken)
                const normalized = normalizeLeaveType(apiLeaveType, currentCompany.id, leaveTypeData)
                dataStore.upsertLeaveType(normalized)
                setLeaveTypes(dataStore.getLeaveTypesByCompanyId(currentCompany.id))
                return normalized
            }

            const leaveType = dataStore.createLeaveType(leaveTypeData, currentCompany.id)
            setLeaveTypes(dataStore.getLeaveTypesByCompanyId(currentCompany.id))
            return leaveType
        } catch (error) {
            console.error('Create leave type error:', error)
            throw error
        }
    }

    const deleteLeaveType = async (id: string) => {
        try {
            if (!currentCompany) return
            if (apiAccessToken) {
                await deleteLeaveTypeApi(id, apiAccessToken)
            }
            dataStore.deleteLeaveType(id)
            setLeaveTypes(dataStore.getLeaveTypesByCompanyId(currentCompany.id))
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

            if (apiAccessToken) {
                const payload: {
                    quota?: number
                    companyId: string
                    name?: string
                    unit?: string
                    code?: string
                    employmentType?: string
                } = {
                    companyId: currentCompany.id
                }

                if (leaveTypeData.quota !== undefined) payload.quota = leaveTypeData.quota
                if (leaveTypeData.name) payload.name = leaveTypeData.name
                if (leaveTypeData.unit) payload.unit = leaveTypeData.unit
                if (leaveTypeData.code) payload.code = leaveTypeData.code
                if (leaveTypeData.employmentType) payload.employmentType = leaveTypeData.employmentType

                const apiLeaveType = await updateLeaveTypeApi(id, payload, apiAccessToken)
                const existing = dataStore.getLeaveTypesByCompanyId(currentCompany.id).find(lt => lt.id === id)
                const normalized = normalizeLeaveType(apiLeaveType, currentCompany.id, {
                    ...(existing || {}),
                    ...leaveTypeData,
                    id,
                    companyId: currentCompany.id
                })

                if (existing) {
                    const updated = dataStore.updateLeaveType(id, {
                        name: normalized.name,
                        code: normalized.code,
                        unit: normalized.unit,
                        quota: normalized.quota,
                        employmentType: normalized.employmentType
                    })
                    setLeaveTypes(dataStore.getLeaveTypesByCompanyId(currentCompany.id))
                    setLeaves(dataStore.getLeavesByCompanyId(currentCompany.id))
                    return updated
                }

                dataStore.upsertLeaveType(normalized)
                setLeaveTypes(dataStore.getLeaveTypesByCompanyId(currentCompany.id))
                return normalized
            }

            const updated = dataStore.updateLeaveType(id, leaveTypeData)
            setLeaveTypes(dataStore.getLeaveTypesByCompanyId(currentCompany.id))
            setLeaves(dataStore.getLeavesByCompanyId(currentCompany.id))
            return updated
        } catch (error) {
            console.error('Update leave type error:', error)
            throw error
        }
    }

    const refreshLeaveTypes = async () => {
        try {
            if (!currentCompany) return
            if (apiAccessToken) {
                const apiLeaveTypes = await fetchLeaveTypesApi(apiAccessToken)
                const normalized = apiLeaveTypes.map(lt => normalizeLeaveType(lt, currentCompany.id))
                dataStore.setLeaveTypesForCompany(currentCompany.id, normalized)
            }
            setLeaveTypes(dataStore.getLeaveTypesByCompanyId(currentCompany.id))
        } catch (error) {
            console.error('Refresh leave types error:', error)
        }
    }

    const addLeave = async (leaveData: Omit<LeaveRecord, 'id' | 'companyId' | 'createdAt'>): Promise<LeaveRecord> => {
        try {
            if (!currentCompany) throw new Error('No company set up')

            if (apiAccessToken) {
                const documents = leaveData.documents
                    || (leaveData.attachments?.length
                        ? { files: leaveData.attachments.map(file => file.dataUrl) }
                        : undefined)
                const apiLeave = await createLeaveApi(
                    {
                        employeeId: leaveData.employeeId,
                        date: leaveData.date,
                        type: leaveData.type,
                        unit: leaveData.unit,
                        amount: leaveData.amount,
                        companyId: currentCompany.id,
                        note: leaveData.note,
                        leaveTypeId: leaveData.leaveTypeId,
                        documents
                    },
                    apiAccessToken
                )
                const normalized = normalizeLeave(apiLeave, currentCompany.id, leaveData)
                dataStore.upsertLeave(normalized)
                setLeaves(dataStore.getLeavesByCompanyId(currentCompany.id))
                return normalized
            }

            const leave = dataStore.addLeave(leaveData, currentCompany.id)
            setLeaves(dataStore.getLeavesByCompanyId(currentCompany.id))
            return leave
        } catch (error) {
            console.error('Add leave error:', error)
            throw error
        }
    }

    const refreshLeaves = async () => {
        try {
            if (!currentCompany) return
            if (apiAccessToken) {
                const apiLeaves = await fetchLeavesApi(apiAccessToken)
                const existing = dataStore.getLeavesByCompanyId(currentCompany.id)
                const normalized = apiLeaves.map(leave => {
                    const fallback = existing.find(entry => entry.id === leave.id)
                    return normalizeLeave(leave, currentCompany.id, fallback)
                })
                dataStore.setLeavesForCompany(currentCompany.id, normalized)
            }
            setLeaves(dataStore.getLeavesByCompanyId(currentCompany.id))
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

            if (apiAccessToken) {
                const apiRole = await createRoleApi(
                    {
                        title: roleData.title,
                        description: roleData.description,
                        companyId: currentCompany.id
                    },
                    apiAccessToken
                )
                const normalized = normalizeRole(apiRole, currentCompany.id, roleData)
                dataStore.upsertRole(normalized)
                setRoles(dataStore.getRolesByCompanyId(currentCompany.id))
                return normalized
            }

            const role = dataStore.createRole(roleData, currentCompany.id)
            setRoles(dataStore.getRolesByCompanyId(currentCompany.id))
            return role
        } catch (error) {
            console.error('Create role error:', error)
            throw error
        }
    }

    const updateRole = async (id: string, roleData: Partial<Omit<Role, 'id' | 'companyId' | 'createdAt'>>): Promise<Role | null> => {
        try {
            if (!currentCompany) {
                throw new Error('No company set up')
            }

            if (apiAccessToken) {
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
                const existing = dataStore.getRolesByCompanyId(currentCompany.id).find(role => role.id === id)
                const normalized = normalizeRole(apiRole, currentCompany.id, {
                    ...(existing || {}),
                    ...roleData,
                    id,
                    companyId: currentCompany.id
                })

                if (existing) {
                    const updated = dataStore.updateRole(id, {
                        title: normalized.title,
                        description: normalized.description
                    })
                    setRoles(dataStore.getRolesByCompanyId(currentCompany.id))
                    return updated
                }

                dataStore.upsertRole(normalized)
                setRoles(dataStore.getRolesByCompanyId(currentCompany.id))
                return normalized
            }

            const role = dataStore.updateRole(id, roleData)
            setRoles(dataStore.getRolesByCompanyId(currentCompany.id))
            return role
        } catch (error) {
            console.error('Update role error:', error)
            throw error
        }
    }

    const deleteRole = async (id: string) => {
        try {
            if (!currentCompany) return
            if (apiAccessToken) {
                await deleteRoleApi(id, apiAccessToken)
            }
            dataStore.deleteRole(id)
            setRoles(dataStore.getRolesByCompanyId(currentCompany.id))
        } catch (error) {
            console.error('Delete role error:', error)
            throw error
        }
    }

    const refreshRoles = async () => {
        try {
            if (!currentCompany) return
            if (apiAccessToken) {
                const apiRoles = await fetchRolesApi(apiAccessToken)
                const normalized = apiRoles.map(role => normalizeRole(role, currentCompany.id))
                dataStore.setRolesForCompany(currentCompany.id, normalized)
            }
            setRoles(dataStore.getRolesByCompanyId(currentCompany.id))
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
            if (!currentCompany) {
                throw new Error('No company found')
            }
            if (apiAccessToken) {
                const apiJob = await createJobApi(
                    {
                        title: jobData.title,
                        status: jobData.status || 'open',
                        employmentType: jobData.employmentType,
                        companyId: currentCompany.id
                    },
                    apiAccessToken
                )
                const normalized = normalizeJob(apiJob, currentCompany.id, jobData)
                dataStore.upsertJob(normalized)
                setJobs(dataStore.getJobsByCompanyId(currentCompany.id))
                return normalized
            }

            const job = dataStore.createJob(currentCompany.id, jobData)
            setJobs(dataStore.getJobsByCompanyId(currentCompany.id))
            return job
        } catch (error) {
            console.error('Create job error:', error)
            throw error
        }
    }

    const updateJob = async (id: string, jobData: Partial<Omit<Job, 'id' | 'companyId' | 'createdAt'>>): Promise<Job | null> => {
        try {
            if (!currentCompany) {
                throw new Error('No company found')
            }

            if (apiAccessToken) {
                const payload: { status?: string; companyId: string; title?: string; employmentType?: string } = {
                    companyId: currentCompany.id
                }
                if (jobData.status) payload.status = jobData.status
                if (jobData.title) payload.title = jobData.title
                if (jobData.employmentType) payload.employmentType = jobData.employmentType

                const apiJob = await updateJobApi(id, payload, apiAccessToken)
                const existing = dataStore.getJobsByCompanyId(currentCompany.id).find(job => job.id === id)
                const normalized = normalizeJob(apiJob, currentCompany.id, {
                    ...(existing || {}),
                    ...jobData,
                    id,
                    companyId: currentCompany.id
                })

                if (existing) {
                    const updated = dataStore.updateJob(id, {
                        title: normalized.title,
                        roleId: normalized.roleId,
                        department: normalized.department,
                        employmentType: normalized.employmentType,
                        location: normalized.location,
                        salary: normalized.salary,
                        experience: normalized.experience,
                        status: normalized.status
                    })
                    setJobs(dataStore.getJobsByCompanyId(currentCompany.id))
                    return updated
                }

                dataStore.upsertJob(normalized)
                setJobs(dataStore.getJobsByCompanyId(currentCompany.id))
                return normalized
            }

            const job = dataStore.updateJob(id, jobData)
            setJobs(dataStore.getJobsByCompanyId(currentCompany.id))
            return job
        } catch (error) {
            console.error('Update job error:', error)
            throw error
        }
    }

    const deleteJob = async (id: string) => {
        try {
            if (!currentCompany) return
            if (apiAccessToken) {
                await deleteJobApi(id, apiAccessToken)
            }
            dataStore.deleteJob(id)
            setJobs(dataStore.getJobsByCompanyId(currentCompany.id))
        } catch (error) {
            console.error('Delete job error:', error)
            throw error
        }
    }

    const refreshJobs = async () => {
        try {
            if (!currentCompany) return
            if (apiAccessToken) {
                const apiJobs = await fetchJobsApi(apiAccessToken)
                const existing = dataStore.getJobsByCompanyId(currentCompany.id)
                const normalized = apiJobs.map(job => {
                    const fallback = existing.find(item => item.id === job.id)
                    return normalizeJob(job, currentCompany.id, fallback)
                })
                dataStore.setJobsForCompany(currentCompany.id, normalized)
            }
            setJobs(dataStore.getJobsByCompanyId(currentCompany.id))
        } catch (error) {
            console.error('Refresh jobs error:', error)
        }
    }

    const createApplicant = async (applicantData: Omit<Applicant, 'id' | 'companyId' | 'createdAt'>): Promise<Applicant> => {
        try {
            if (!currentCompany) {
                throw new Error('No company found')
            }
            if (apiAccessToken) {
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
                dataStore.upsertApplicant(normalized)
                setApplicants(dataStore.getApplicantsByCompanyId(currentCompany.id))
                return normalized
            }
            const applicant = dataStore.createApplicant(currentCompany.id, applicantData)
            setApplicants(dataStore.getApplicantsByCompanyId(currentCompany.id))
            return applicant
        } catch (error) {
            console.error('Create applicant error:', error)
            throw error
        }
    }

    const updateApplicant = async (id: string, applicantData: Partial<Omit<Applicant, 'id' | 'companyId' | 'createdAt'>>): Promise<Applicant | null> => {
        try {
            if (!currentCompany) {
                throw new Error('No company found')
            }
            if (apiAccessToken) {
                const existing = dataStore.getApplicantsByCompanyId(currentCompany.id).find(applicant => applicant.id === id)
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
                dataStore.upsertApplicant(normalized)
                setApplicants(dataStore.getApplicantsByCompanyId(currentCompany.id))
                return normalized
            }
            const applicant = dataStore.updateApplicant(id, applicantData)
            if (currentCompany) {
                setApplicants(dataStore.getApplicantsByCompanyId(currentCompany.id))
            }
            return applicant
        } catch (error) {
            console.error('Update applicant error:', error)
            throw error
        }
    }

    const deleteApplicant = async (id: string) => {
        try {
            if (!currentCompany) return
            if (apiAccessToken) {
                await deleteApplicantApi(id, apiAccessToken)
            }
            dataStore.deleteApplicant(id)
            if (currentCompany) {
                setApplicants(dataStore.getApplicantsByCompanyId(currentCompany.id))
            }
        } catch (error) {
            console.error('Delete applicant error:', error)
            throw error
        }
    }

    const refreshApplicants = async () => {
        try {
            if (!currentCompany) return
            if (apiAccessToken) {
                const apiApplicants = await fetchApplicantsApi(apiAccessToken)
                const existing = dataStore.getApplicantsByCompanyId(currentCompany.id)
                const normalized = apiApplicants.map(applicant => {
                    const fallback = existing.find(entry => entry.id === applicant.id)
                    return normalizeApplicant(applicant, currentCompany.id, fallback)
                })
                dataStore.setApplicantsForCompany(currentCompany.id, normalized)
            }
            setApplicants(dataStore.getApplicantsByCompanyId(currentCompany.id))
        } catch (error) {
            console.error('Refresh applicants error:', error)
        }
    }

    useEffect(() => {
        if (!currentCompany || !apiAccessToken) return
        void refreshApplicants()
    }, [currentCompany?.id, apiAccessToken])

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
                refreshApplicants
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
