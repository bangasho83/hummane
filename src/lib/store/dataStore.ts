import type { User, Company, Employee, Department, DataStoreSchema, LeaveRecord, Role, Job, Applicant, LeaveType, Holiday, FeedbackCard, FeedbackEntry } from '@/types'
import type { EmployeeDocument, DocumentKind } from '@/types'
import { hashPassword, verifyPassword, sanitizeInput, sanitizeEmail, sanitizeRichText } from '@/lib/security/crypto'

/**
 * DataStore class for managing application data in localStorage
 * Includes security features like password hashing and input sanitization
 */
export class DataStore {
    private STORAGE_KEY = 'hrSystemData'

    constructor() {
        if (typeof window !== 'undefined') {
            this.initializeStorage()
        }
    }

    private initializeStorage(): void {
        try {
            if (!localStorage.getItem(this.STORAGE_KEY)) {
                const initialData: DataStoreSchema = {
                    users: [],
                    companies: [],
                    employees: [],
                    departments: [],
                leaves: [],
                roles: [],
                jobs: [],
                applicants: [],
                leaveTypes: [],
                    holidays: [],
                    feedbackCards: [],
                    feedbackEntries: [],
                    documents: [],
                currentUser: null
            }
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(initialData))
            }
        } catch (error) {
            console.error('Failed to initialize storage:', error)
            throw new Error('Storage initialization failed. Please check browser settings.')
        }
    }

    private getData(): DataStoreSchema {
        if (typeof window === 'undefined') {
            return this.getInitialData()
        }

        try {
            const data = localStorage.getItem(this.STORAGE_KEY)
            if (!data) return this.getInitialData()

            const parsed = JSON.parse(data)
            // Validate data structure
            if (!parsed || typeof parsed !== 'object') {
                console.warn('Invalid data structure in storage, resetting...')
                return this.getInitialData()
            }

            return {
                users: Array.isArray(parsed.users) ? parsed.users : [],
                companies: Array.isArray(parsed.companies) ? parsed.companies : [],
                employees: Array.isArray(parsed.employees) ? parsed.employees : [],
                departments: Array.isArray(parsed.departments) ? parsed.departments : [],
                leaves: Array.isArray(parsed.leaves) ? parsed.leaves : [],
                leaveTypes: Array.isArray(parsed.leaveTypes) ? parsed.leaveTypes : [],
                holidays: Array.isArray(parsed.holidays) ? parsed.holidays : [],
                feedbackCards: Array.isArray(parsed.feedbackCards) ? parsed.feedbackCards : [],
                feedbackEntries: Array.isArray(parsed.feedbackEntries) ? parsed.feedbackEntries : [],
                documents: Array.isArray(parsed.documents) ? parsed.documents : [],
                roles: Array.isArray(parsed.roles) ? parsed.roles : [],
                jobs: Array.isArray(parsed.jobs) ? parsed.jobs : [],
                applicants: Array.isArray(parsed.applicants) ? parsed.applicants : [],
                currentUser: parsed.currentUser || null
            }
        } catch (error) {
            console.error('Failed to parse storage data:', error)
            return this.getInitialData()
        }
    }

    private getInitialData(): DataStoreSchema {
            return {
                users: [],
                companies: [],
                employees: [],
                departments: [],
                leaves: [],
                leaveTypes: [],
                holidays: [],
                feedbackCards: [],
                feedbackEntries: [],
                documents: [],
                roles: [],
                jobs: [],
                applicants: [],
                currentUser: null
            }
    }

    private saveData(data: DataStoreSchema): void {
        if (typeof window === 'undefined') return

        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data))
        } catch (error) {
            console.error('Failed to save data to storage:', error)
            throw new Error('Failed to save data. Storage may be full.')
        }
    }

    private generateId(): string {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    }

    // User operations
    async createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
        try {
            const data = this.getData()

            // Sanitize inputs
            const sanitizedEmail = sanitizeEmail(userData.email)
            const sanitizedName = sanitizeInput(userData.name)

            // Check if user already exists
            if (data.users.some(u => u.email === sanitizedEmail)) {
                throw new Error('User with this email already exists')
            }

            // Hash password
            const hashedPassword = await hashPassword(userData.password)

            const user: User = {
                id: this.generateId(),
                name: sanitizedName,
                email: sanitizedEmail,
                password: hashedPassword,
                createdAt: new Date().toISOString()
            }

            data.users.push(user)
            this.saveData(data)
            return user
        } catch (error) {
            console.error('Error creating user:', error)
            throw error
        }
    }

    getUserByEmail(email: string): User | undefined {
        try {
            const data = this.getData()
            const sanitizedEmail = sanitizeEmail(email)
            return data.users.find(user => user.email === sanitizedEmail)
        } catch (error) {
            console.error('Error getting user by email:', error)
            return undefined
        }
    }

    async verifyUserPassword(email: string, password: string): Promise<User | null> {
        try {
            const user = this.getUserByEmail(email)
            if (!user) return null

            const isValid = await verifyPassword(password, user.password)
            return isValid ? user : null
        } catch (error) {
            console.error('Error verifying password:', error)
            return null
        }
    }

    setCurrentUser(userId: string): void {
        try {
            const data = this.getData()
            data.currentUser = userId
            this.saveData(data)
        } catch (error) {
            console.error('Error setting current user:', error)
            throw new Error('Failed to set current user')
        }
    }

    getCurrentUser(): User | null {
        try {
            const data = this.getData()
            if (!data.currentUser) return null
            return data.users.find(user => user.id === data.currentUser) || null
        } catch (error) {
            console.error('Error getting current user:', error)
            return null
        }
    }

    logout(): void {
        try {
            const data = this.getData()
            data.currentUser = null
            this.saveData(data)
        } catch (error) {
            console.error('Error during logout:', error)
            throw new Error('Failed to logout')
        }
    }

    // Company operations
    createCompany(companyData: Omit<Company, 'id' | 'ownerId' | 'createdAt'>, ownerId: string): Company {
        try {
            const data = this.getData()

            // Sanitize inputs
            const sanitizedName = sanitizeInput(companyData.name)
            const sanitizedIndustry = sanitizeInput(companyData.industry)
            const sanitizedCurrency = companyData.currency ? sanitizeInput(companyData.currency).toUpperCase() : undefined

            // Check if user already has a company
            if (data.companies.some(c => c.ownerId === ownerId)) {
                throw new Error('User already has a company')
            }

            const company: Company = {
                id: this.generateId(),
                name: sanitizedName,
                industry: sanitizedIndustry,
                size: companyData.size,
                currency: sanitizedCurrency,
                ownerId,
                createdAt: new Date().toISOString()
            }
            data.companies.push(company)

            // Update user with companyId
            const user = data.users.find(u => u.id === ownerId)
            if (user) {
                user.companyId = company.id
            }

            this.saveData(data)
            return company
        } catch (error) {
            console.error('Error creating company:', error)
            throw error
        }
    }

    getCompanyByOwnerId(ownerId: string): Company | undefined {
        try {
            const data = this.getData()
            return data.companies.find(company => company.ownerId === ownerId)
        } catch (error) {
            console.error('Error getting company:', error)
            return undefined
        }
    }

    updateCompany(companyId: string, companyData: Partial<Omit<Company, 'id' | 'ownerId' | 'createdAt'>>): Company | null {
        try {
            const data = this.getData()
            const index = data.companies.findIndex(comp => comp.id === companyId)
            if (index === -1) return null

            // Sanitize inputs if provided
            const sanitizedData: Partial<Company> = {}
            if (companyData.name) sanitizedData.name = sanitizeInput(companyData.name)
            if (companyData.industry) sanitizedData.industry = sanitizeInput(companyData.industry)
            if (companyData.size) sanitizedData.size = companyData.size
            if (companyData.currency !== undefined) {
                sanitizedData.currency = companyData.currency
                    ? sanitizeInput(companyData.currency).toUpperCase()
                    : ''
            }

            data.companies[index] = {
                ...data.companies[index],
                ...sanitizedData
            }
            this.saveData(data)
            return data.companies[index]
        } catch (error) {
            console.error('Error updating company:', error)
            return null
        }
    }

    // Employee operations
    createEmployee(employeeData: Omit<Employee, 'id' | 'companyId' | 'createdAt'>, companyId: string): Employee {
        try {
            const data = this.getData()

            // Sanitize inputs
            const sanitizedName = sanitizeInput(employeeData.name)
            const sanitizedEmail = sanitizeEmail(employeeData.email)
            const sanitizedPosition = sanitizeInput(employeeData.position)
            const sanitizedDepartment = sanitizeInput(employeeData.department)
            const sanitizedEmployeeId = sanitizeInput(employeeData.employeeId)
            const sanitizedManager = sanitizeInput(employeeData.reportingManager)
            const sanitizedRoleId = sanitizeInput(employeeData.roleId)

            // Validate salary
            if (employeeData.salary < 0 || !isFinite(employeeData.salary)) {
                throw new Error('Invalid salary amount')
            }

            // Ensure unique employeeId within company
            const isDuplicateId = data.employees.some(emp => emp.companyId === companyId && emp.employeeId === sanitizedEmployeeId)
            if (isDuplicateId) {
                throw new Error('Employee ID must be unique')
            }

            const employee: Employee = {
                id: this.generateId(),
                companyId,
                employeeId: sanitizedEmployeeId,
                name: sanitizedName,
                email: sanitizedEmail,
                position: sanitizedPosition,
                department: sanitizedDepartment,
                roleId: sanitizedRoleId,
                startDate: employeeData.startDate,
                employmentType: employeeData.employmentType,
                reportingManager: sanitizedManager,
                gender: employeeData.gender,
                salary: employeeData.salary,
                createdAt: new Date().toISOString()
            }
            data.employees.push(employee)
            this.saveData(data)
            return employee
        } catch (error) {
            console.error('Error creating employee:', error)
            throw error
        }
    }

    getEmployeesByCompanyId(companyId: string): Employee[] {
        try {
            const data = this.getData()
            return data.employees
                .filter(employee => employee.companyId === companyId)
                .map(emp => ({
                    ...emp,
                    // Backfill legacy records so UI/validation is consistent
                    employeeId: emp.employeeId || `LEGACY-${emp.id}`,
                employmentType: emp.employmentType || 'Full-time',
                reportingManager: emp.reportingManager || 'Unassigned',
                gender: emp.gender || 'Prefer not to say'
                }))
        } catch (error) {
            console.error('Error getting employees:', error)
            return []
        }
    }

    updateEmployee(employeeId: string, employeeData: Partial<Omit<Employee, 'id' | 'companyId' | 'createdAt'>>): Employee | null {
        try {
            const data = this.getData()
            const index = data.employees.findIndex(emp => emp.id === employeeId)
            if (index === -1) return null

            // Sanitize inputs if provided
            const sanitizedData: Partial<Employee> = {}
            if (employeeData.name !== undefined) sanitizedData.name = sanitizeInput(employeeData.name)
            if (employeeData.email !== undefined) sanitizedData.email = sanitizeEmail(employeeData.email)
            if (employeeData.position !== undefined) sanitizedData.position = sanitizeInput(employeeData.position)
            if (employeeData.department !== undefined) sanitizedData.department = sanitizeInput(employeeData.department)
            if (employeeData.employeeId !== undefined) {
                const sanitizedEmployeeId = sanitizeInput(employeeData.employeeId)
                const duplicate = data.employees.some(emp =>
                    emp.companyId === data.employees[index].companyId &&
                    emp.employeeId === sanitizedEmployeeId &&
                    emp.id !== employeeId
                )
                if (duplicate) {
                    throw new Error('Employee ID must be unique')
                }
                sanitizedData.employeeId = sanitizedEmployeeId
            }
            if (employeeData.reportingManager !== undefined) sanitizedData.reportingManager = sanitizeInput(employeeData.reportingManager)
            if (employeeData.roleId !== undefined) sanitizedData.roleId = sanitizeInput(employeeData.roleId)
            if (employeeData.startDate !== undefined) sanitizedData.startDate = employeeData.startDate
            if (employeeData.employmentType !== undefined) sanitizedData.employmentType = employeeData.employmentType
            if (employeeData.gender !== undefined) sanitizedData.gender = employeeData.gender
            if (employeeData.salary !== undefined) {
                if (employeeData.salary < 0 || !isFinite(employeeData.salary)) {
                    throw new Error('Invalid salary amount')
                }
                sanitizedData.salary = employeeData.salary
            }

            data.employees[index] = {
                ...data.employees[index],
                ...sanitizedData,
                updatedAt: new Date().toISOString()
            }
            this.saveData(data)
            return data.employees[index]
        } catch (error) {
            console.error('Error updating employee:', error)
            throw error
        }
    }

    deleteEmployee(employeeId: string): void {
        try {
            const data = this.getData()
            const initialLength = data.employees.length
            data.employees = data.employees.filter(emp => emp.id !== employeeId)

            if (data.employees.length === initialLength) {
                throw new Error('Employee not found')
            }

            this.saveData(data)
        } catch (error) {
            console.error('Error deleting employee:', error)
            throw error
        }
    }

    // Leave type operations
    createLeaveType(leaveTypeData: Omit<LeaveType, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>, companyId: string) {
        try {
            const data = this.getData()
            const sanitizedName = sanitizeInput(leaveTypeData.name)
            const sanitizedCode = sanitizeInput(leaveTypeData.code).toUpperCase()
            const sanitizedUnit = leaveTypeData.unit
            const quota = leaveTypeData.quota
            const employmentType = leaveTypeData.employmentType

            if (quota < 0 || !isFinite(quota)) {
                throw new Error('Quota must be a valid non-negative number')
            }

            // ensure unique code per company
            const duplicate = data.leaveTypes.some(lt => lt.companyId === companyId && lt.code === sanitizedCode && lt.employmentType === employmentType)
            if (duplicate) {
                throw new Error('Leave code must be unique')
            }

            const leaveType = {
                id: this.generateId(),
                companyId,
                name: sanitizedName,
                code: sanitizedCode,
                unit: sanitizedUnit,
                quota,
                employmentType,
                createdAt: new Date().toISOString()
            }

            data.leaveTypes.push(leaveType)
            this.saveData(data)
            return leaveType
        } catch (error) {
            console.error('Error creating leave type:', error)
            throw error
        }
    }

    getLeaveTypesByCompanyId(companyId: string) {
        try {
            const data = this.getData()
            return data.leaveTypes.filter(lt => lt.companyId === companyId).map(lt => ({
                ...lt,
                employmentType: lt.employmentType || 'Full-time',
                quota: lt.quota !== undefined ? lt.quota : 0
            }))
        } catch (error) {
            console.error('Error getting leave types:', error)
            return []
        }
    }

    deleteLeaveType(id: string) {
        try {
            const data = this.getData()
            const initial = data.leaveTypes.length
            data.leaveTypes = data.leaveTypes.filter(lt => lt.id !== id)
            if (initial === data.leaveTypes.length) {
                throw new Error('Leave type not found')
            }
            this.saveData(data)
        } catch (error) {
            console.error('Error deleting leave type:', error)
            throw error
        }
    }

    updateLeaveType(
        id: string,
        leaveTypeData: Partial<Omit<LeaveType, 'id' | 'companyId' | 'createdAt'>>
    ): LeaveType | null {
        try {
            const data = this.getData()
            if (!data.leaveTypes) return null

            const index = data.leaveTypes.findIndex(lt => lt.id === id)
            if (index === -1) {
                throw new Error('Leave type not found')
            }

            const existing = data.leaveTypes[index]
            const sanitizedName = leaveTypeData.name ? sanitizeInput(leaveTypeData.name) : existing.name
            const sanitizedCode = leaveTypeData.code ? sanitizeInput(leaveTypeData.code) : existing.code

            const duplicateCode = data.leaveTypes.some(
                lt =>
                    lt.companyId === existing.companyId &&
                    lt.id !== id &&
                    lt.code.toLowerCase() === sanitizedCode.toLowerCase()
            )
            if (duplicateCode) {
                throw new Error('Leave code already exists')
            }

            const updated: LeaveType = {
                ...existing,
                ...leaveTypeData,
                name: sanitizedName,
                code: sanitizedCode,
                updatedAt: new Date().toISOString()
            }

            data.leaveTypes[index] = updated

            if (data.leaves && data.leaves.length) {
                data.leaves = data.leaves.map(leave =>
                    leave.leaveTypeId === id
                        ? { ...leave, type: updated.name, unit: updated.unit }
                        : leave
                )
            }

            this.saveData(data)
            return updated
        } catch (error) {
            console.error('Error updating leave type:', error)
            throw error
        }
    }

    // Department operations
    createDepartment(departmentData: Omit<Department, 'id' | 'companyId' | 'createdAt'>, companyId: string): Department {
        try {
            const data = this.getData()

            // Sanitize inputs
            const sanitizedName = sanitizeInput(departmentData.name)
            const sanitizedDescription = departmentData.description
                ? sanitizeInput(departmentData.description)
                : undefined

            // Check for duplicate department name in same company
            if (!data.departments) data.departments = []
            const exists = data.departments.some(
                d => d.companyId === companyId && d.name.toLowerCase() === sanitizedName.toLowerCase()
            )
            if (exists) {
                throw new Error('Department with this name already exists')
            }

            const department: Department = {
                id: this.generateId(),
                companyId,
                name: sanitizedName,
                description: sanitizedDescription,
                createdAt: new Date().toISOString()
            }
            data.departments.push(department)
            this.saveData(data)
            return department
        } catch (error) {
            console.error('Error creating department:', error)
            throw error
        }
    }

    getDepartmentsByCompanyId(companyId: string): Department[] {
        try {
            const data = this.getData()
            if (!data.departments) return []
            return data.departments.filter(dept => dept.companyId === companyId)
        } catch (error) {
            console.error('Error getting departments:', error)
            return []
        }
    }

    updateDepartment(
        departmentId: string,
        updates: Partial<Omit<Department, 'id' | 'companyId' | 'createdAt'>>
    ): Department {
        try {
            const data = this.getData()
            if (!data.departments) throw new Error('No departments found')

            const index = data.departments.findIndex(dept => dept.id === departmentId)
            if (index === -1) {
                throw new Error('Department not found')
            }

            const existing = data.departments[index]
            const sanitizedName = updates.name !== undefined ? sanitizeInput(updates.name) : existing.name
            const sanitizedDescription = updates.description !== undefined
                ? sanitizeInput(updates.description)
                : existing.description

            const duplicate = data.departments.some(
                d =>
                    d.companyId === existing.companyId &&
                    d.id !== departmentId &&
                    d.name.toLowerCase() === sanitizedName.toLowerCase()
            )
            if (duplicate) {
                throw new Error('Department with this name already exists')
            }

            const updated: Department = {
                ...existing,
                name: sanitizedName,
                description: sanitizedDescription
            }
            data.departments[index] = updated

            // Update employees that reference the old department name
            if (existing.name !== sanitizedName) {
                data.employees = data.employees.map(emp =>
                    emp.department === existing.name ? { ...emp, department: sanitizedName } : emp
                )
            }

            this.saveData(data)
            return updated
        } catch (error) {
            console.error('Error updating department:', error)
            throw error
        }
    }

    deleteDepartment(departmentId: string): void {
        try {
            const data = this.getData()
            if (!data.departments) return

            const initialLength = data.departments.length
            data.departments = data.departments.filter(dept => dept.id !== departmentId)

            if (data.departments.length === initialLength) {
                throw new Error('Department not found')
            }

            this.saveData(data)
        } catch (error) {
            console.error('Error deleting department:', error)
            throw error
        }
    }

    // Leave operations
    addLeave(leaveData: Omit<LeaveRecord, 'id' | 'companyId' | 'createdAt'>, companyId: string): LeaveRecord {
        try {
            const data = this.getData()

            const leave: LeaveRecord = {
                id: this.generateId(),
                companyId,
                employeeId: leaveData.employeeId,
                date: leaveData.date,
                type: leaveData.type,
                leaveTypeId: leaveData.leaveTypeId,
                unit: leaveData.unit,
                amount: leaveData.amount,
                note: leaveData.note,
                attachments: leaveData.attachments,
                createdAt: new Date().toISOString()
            }

            if (!data.leaves) data.leaves = []
            data.leaves.push(leave)
            this.saveData(data)
            return leave
        } catch (error) {
            console.error('Error adding leave:', error)
            throw error
        }
    }

    // Holidays
    createHoliday(holidayData: Omit<Holiday, 'id' | 'companyId' | 'createdAt'>, companyId: string): Holiday {
        try {
            const data = this.getData()
            const sanitizedName = sanitizeInput(holidayData.name)
            const date = holidayData.date

            const exists = data.holidays.some(
                (h) => h.companyId === companyId && h.date === date && h.name.toLowerCase() === sanitizedName.toLowerCase()
            )
            if (exists) {
                throw new Error('Holiday already exists for this date')
            }

            const holiday: Holiday = {
                id: this.generateId(),
                companyId,
                date,
                name: sanitizedName,
                createdAt: new Date().toISOString()
            }

            data.holidays.push(holiday)
            this.saveData(data)
            return holiday
        } catch (error) {
            console.error('Error creating holiday:', error)
            throw error
        }
    }

    getHolidaysByCompanyId(companyId: string): Holiday[] {
        try {
            const data = this.getData()
            return data.holidays.filter(h => h.companyId === companyId)
        } catch (error) {
            console.error('Error getting holidays:', error)
            return []
        }
    }

    deleteHoliday(id: string): void {
        try {
            const data = this.getData()
            data.holidays = data.holidays.filter(h => h.id !== id)
            this.saveData(data)
        } catch (error) {
            console.error('Error deleting holiday:', error)
            throw error
        }
    }

    // Feedback cards
    createFeedbackCard(companyId: string, cardData: Omit<FeedbackCard, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>): FeedbackCard {
        try {
            const data = this.getData()
            if (!data.feedbackCards) data.feedbackCards = []

            const title = sanitizeInput(cardData.title)
            if (!title) {
                throw new Error('Feedback card title is required')
            }
            if (!cardData.questions || cardData.questions.length === 0) {
                throw new Error('Feedback card requires at least one question')
            }

            const subject = cardData.subject === 'Applicant' ? 'Applicant' : 'Team Member'
            const questions = cardData.questions.map((q) => {
                const rawWeight = q.weight
                return {
                    id: q.id || this.generateId(),
                    kind: (q.kind === 'comment' ? 'comment' : 'score') as 'comment' | 'score',
                    prompt: sanitizeInput(q.prompt),
                    weight: q.kind === 'score' && typeof rawWeight === 'number' && Number.isFinite(rawWeight)
                        ? Math.max(0, Math.round(rawWeight))
                        : undefined
                }
            })

            const card: FeedbackCard = {
                id: this.generateId(),
                companyId,
                title,
                subject,
                questions,
                createdAt: new Date().toISOString()
            }

            data.feedbackCards.push(card)
            this.saveData(data)
            return card
        } catch (error) {
            console.error('Error creating feedback card:', error)
            throw error
        }
    }

    getFeedbackCardsByCompanyId(companyId: string): FeedbackCard[] {
        try {
            const data = this.getData()
            return (data.feedbackCards || []).filter(card => card.companyId === companyId)
        } catch (error) {
            console.error('Error getting feedback cards:', error)
            return []
        }
    }

    updateFeedbackCard(cardId: string, updates: Partial<Omit<FeedbackCard, 'id' | 'companyId' | 'createdAt'>>): FeedbackCard | null {
        try {
            const data = this.getData()
            const index = (data.feedbackCards || []).findIndex(card => card.id === cardId)
            if (index === -1) return null

            const existing = data.feedbackCards[index]
            const title = updates.title !== undefined ? sanitizeInput(updates.title) : existing.title
            const subject = updates.subject ? (updates.subject === 'Applicant' ? 'Applicant' : 'Team Member') : existing.subject
            const questions = updates.questions
                ? updates.questions.map((q) => {
                    const rawWeight = q.weight
                    return {
                        id: q.id || this.generateId(),
                        kind: (q.kind === 'comment' ? 'comment' : 'score') as 'comment' | 'score',
                        prompt: sanitizeInput(q.prompt),
                        weight: q.kind === 'score' && typeof rawWeight === 'number' && Number.isFinite(rawWeight)
                            ? Math.max(0, Math.round(rawWeight))
                            : undefined
                    }
                })
                : existing.questions

            const updated: FeedbackCard = {
                ...existing,
                title,
                subject,
                questions,
                updatedAt: new Date().toISOString()
            }

            data.feedbackCards[index] = updated
            this.saveData(data)
            return updated
        } catch (error) {
            console.error('Error updating feedback card:', error)
            throw error
        }
    }

    deleteFeedbackCard(cardId: string): void {
        try {
            const data = this.getData()
            data.feedbackCards = (data.feedbackCards || []).filter(card => card.id !== cardId)
            this.saveData(data)
        } catch (error) {
            console.error('Error deleting feedback card:', error)
            throw error
        }
    }

    // Feedback entries
    createFeedbackEntry(companyId: string, entryData: Omit<FeedbackEntry, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>): FeedbackEntry {
        try {
            const data = this.getData()
            if (!data.feedbackEntries) data.feedbackEntries = []

            const entry: FeedbackEntry = {
                id: this.generateId(),
                companyId,
                type: entryData.type === 'Applicant' ? 'Applicant' : 'Team Member',
                cardId: entryData.cardId,
                subjectId: entryData.subjectId,
                subjectName: entryData.subjectName ? sanitizeInput(entryData.subjectName) : undefined,
                answers: entryData.answers.map((a) => ({
                    questionId: a.questionId,
                    score: Number.isFinite(a.score) ? Math.min(5, Math.max(1, Math.round(a.score))) : 1,
                    comment: a.comment ? sanitizeInput(a.comment) : undefined
                })),
                createdAt: new Date().toISOString()
            }

            data.feedbackEntries.push(entry)
            this.saveData(data)
            return entry
        } catch (error) {
            console.error('Error creating feedback entry:', error)
            throw error
        }
    }

    getFeedbackEntriesByCompanyId(companyId: string): FeedbackEntry[] {
        try {
            const data = this.getData()
            return (data.feedbackEntries || []).filter(entry => entry.companyId === companyId)
        } catch (error) {
            console.error('Error getting feedback entries:', error)
            return []
        }
    }

    deleteFeedbackEntry(entryId: string): void {
        try {
            const data = this.getData()
            data.feedbackEntries = (data.feedbackEntries || []).filter(entry => entry.id !== entryId)
            this.saveData(data)
        } catch (error) {
            console.error('Error deleting feedback entry:', error)
            throw error
        }
    }

    // Employee documents
    addDocument(doc: Omit<EmployeeDocument, 'id' | 'uploadedAt'>): EmployeeDocument {
        try {
            const data = this.getData()
            const newDoc: EmployeeDocument = {
                ...doc,
                id: this.generateId(),
                uploadedAt: new Date().toISOString()
            }
            if (!data.documents) data.documents = []
            data.documents.push(newDoc)
            this.saveData(data)
            return newDoc
        } catch (error) {
            console.error('Error adding document:', error)
            throw error
        }
    }

    getDocumentsByEmployeeId(employeeId: string): EmployeeDocument[] {
        try {
            const data = this.getData()
            return data.documents.filter(d => d.employeeId === employeeId)
        } catch (error) {
            console.error('Error getting documents:', error)
            return []
        }
    }

    deleteDocument(id: string): void {
        try {
            const data = this.getData()
            data.documents = data.documents.filter(d => d.id !== id)
            this.saveData(data)
        } catch (error) {
            console.error('Error deleting document:', error)
            throw error
        }
    }

    getLeavesByCompanyId(companyId: string): LeaveRecord[] {
        try {
            const data = this.getData()
            if (!data.leaves) return []
            return data.leaves.filter(leave => leave.companyId === companyId)
        } catch (error) {
            console.error('Error getting leaves:', error)
            return []
        }
    }

    // Role operations
    createRole(roleData: Omit<Role, 'id' | 'companyId' | 'createdAt'>, companyId: string): Role {
        try {
            const data = this.getData()

            // Sanitize inputs
            const sanitizedTitle = sanitizeInput(roleData.title)
            const sanitizedDescription = sanitizeRichText(roleData.description)

            const role: Role = {
                id: this.generateId(),
                companyId,
                title: sanitizedTitle,
                description: sanitizedDescription,
                createdAt: new Date().toISOString()
            }

            if (!data.roles) data.roles = []
            data.roles.push(role)
            this.saveData(data)
            return role
        } catch (error) {
            console.error('Error creating role:', error)
            throw error
        }
    }

    getRolesByCompanyId(companyId: string): Role[] {
        try {
            const data = this.getData()
            if (!data.roles) return []
            return data.roles.filter(role => role.companyId === companyId)
        } catch (error) {
            console.error('Error getting roles:', error)
            return []
        }
    }

    getRoleById(roleId: string): Role | null {
        try {
            const data = this.getData()
            if (!data.roles) return null
            return data.roles.find(role => role.id === roleId) || null
        } catch (error) {
            console.error('Error getting role:', error)
            return null
        }
    }

    updateRole(roleId: string, roleData: Partial<Omit<Role, 'id' | 'companyId' | 'createdAt'>>): Role | null {
        try {
            const data = this.getData()
            if (!data.roles) return null

            const roleIndex = data.roles.findIndex(r => r.id === roleId)
            if (roleIndex === -1) {
                throw new Error('Role not found')
            }

            const updatedRole = {
                ...data.roles[roleIndex],
                ...roleData,
                title: roleData.title ? sanitizeInput(roleData.title) : data.roles[roleIndex].title,
                description: roleData.description ? sanitizeRichText(roleData.description) : data.roles[roleIndex].description
            }

            data.roles[roleIndex] = updatedRole
            this.saveData(data)
            return updatedRole
        } catch (error) {
            console.error('Error updating role:', error)
            throw error
        }
    }

    deleteRole(roleId: string): void {
        try {
            const data = this.getData()
            if (!data.roles) return

            const initialLength = data.roles.length
            data.roles = data.roles.filter(role => role.id !== roleId)

            if (data.roles.length === initialLength) {
                throw new Error('Role not found')
            }

            this.saveData(data)
        } catch (error) {
            console.error('Error deleting role:', error)
            throw error
        }
    }

    // Job Management
    getJobsByCompanyId(companyId: string): Job[] {
        try {
            const data = this.getData()
            if (!data.jobs) return []
            return data.jobs.filter(job => job.companyId === companyId)
        } catch (error) {
            console.error('Error getting jobs:', error)
            return []
        }
    }

    createJob(companyId: string, jobData: Omit<Job, 'id' | 'companyId' | 'createdAt'>): Job {
        try {
            const data = this.getData()
            if (!data.jobs) data.jobs = []

            const newJob: Job = {
                id: `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                companyId,
                title: sanitizeInput(jobData.title),
                roleId: jobData.roleId,
                department: jobData.department ? sanitizeInput(jobData.department) : undefined,
                employmentType: jobData.employmentType,
                location: jobData.location
                    ? {
                        city: sanitizeInput(jobData.location.city),
                        country: sanitizeInput(jobData.location.country)
                    }
                    : undefined,
                salary: jobData.salary,
                experience: sanitizeInput(jobData.experience),
                status: jobData.status || 'open',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }

            data.jobs.push(newJob)
            this.saveData(data)
            return newJob
        } catch (error) {
            console.error('Error creating job:', error)
            throw error
        }
    }

    updateJob(jobId: string, jobData: Partial<Omit<Job, 'id' | 'companyId' | 'createdAt'>>): Job | null {
        try {
            const data = this.getData()
            if (!data.jobs) return null

            const jobIndex = data.jobs.findIndex(job => job.id === jobId)
            if (jobIndex === -1) {
                throw new Error('Job not found')
            }

            const updatedJob: Job = {
                ...data.jobs[jobIndex],
                ...jobData,
                title: jobData.title ? sanitizeInput(jobData.title) : data.jobs[jobIndex].title,
                department: jobData.department ? sanitizeInput(jobData.department) : data.jobs[jobIndex].department,
                employmentType: jobData.employmentType ?? data.jobs[jobIndex].employmentType,
                location: jobData.location
                    ? {
                        city: sanitizeInput(jobData.location.city),
                        country: sanitizeInput(jobData.location.country)
                    }
                    : data.jobs[jobIndex].location,
                experience: jobData.experience ? sanitizeInput(jobData.experience) : data.jobs[jobIndex].experience,
                updatedAt: new Date().toISOString()
            }

            data.jobs[jobIndex] = updatedJob
            this.saveData(data)
            return updatedJob
        } catch (error) {
            console.error('Error updating job:', error)
            throw error
        }
    }

    deleteJob(jobId: string): void {
        try {
            const data = this.getData()
            if (!data.jobs) return

            const initialLength = data.jobs.length
            data.jobs = data.jobs.filter(job => job.id !== jobId)

            if (data.jobs.length === initialLength) {
                throw new Error('Job not found')
            }

            this.saveData(data)
        } catch (error) {
            console.error('Error deleting job:', error)
            throw error
        }
    }

    // Applicant Management
    getApplicantsByCompanyId(companyId: string): Applicant[] {
        try {
            const data = this.getData()
            if (!data.applicants) return []
            return data.applicants.filter(applicant => applicant.companyId === companyId)
        } catch (error) {
            console.error('Error getting applicants:', error)
            return []
        }
    }

    getApplicantById(applicantId: string): Applicant | null {
        try {
            const data = this.getData()
            if (!data.applicants) return null
            return data.applicants.find(applicant => applicant.id === applicantId) || null
        } catch (error) {
            console.error('Error getting applicant:', error)
            return null
        }
    }

    createApplicant(companyId: string, applicantData: Omit<Applicant, 'id' | 'companyId' | 'createdAt'>): Applicant {
        try {
            const data = this.getData()
            if (!data.applicants) data.applicants = []

            const normalizeInt = (value: number) =>
                Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0

            const newApplicant: Applicant = {
                id: `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                companyId,
                jobId: applicantData.jobId,
                fullName: sanitizeInput(applicantData.fullName),
                email: sanitizeEmail(applicantData.email),
                phone: sanitizeInput(applicantData.phone),
                positionApplied: sanitizeInput(applicantData.positionApplied),
                yearsOfExperience: applicantData.yearsOfExperience,
                currentSalary: normalizeInt(applicantData.currentSalary),
                expectedSalary: normalizeInt(applicantData.expectedSalary),
                noticePeriod: sanitizeInput(applicantData.noticePeriod),
                resumeFile: applicantData.resumeFile,
                linkedinUrl: applicantData.linkedinUrl,
                status: applicantData.status || 'new',
                appliedDate: applicantData.appliedDate,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }

            data.applicants.push(newApplicant)
            this.saveData(data)
            return newApplicant
        } catch (error) {
            console.error('Error creating applicant:', error)
            throw error
        }
    }

    updateApplicant(applicantId: string, applicantData: Partial<Omit<Applicant, 'id' | 'companyId' | 'createdAt'>>): Applicant | null {
        try {
            const data = this.getData()
            if (!data.applicants) return null

            const applicantIndex = data.applicants.findIndex(applicant => applicant.id === applicantId)
            if (applicantIndex === -1) {
                throw new Error('Applicant not found')
            }

            const normalizeInt = (value: number) =>
                Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0

            const updatedApplicant: Applicant = {
                ...data.applicants[applicantIndex],
                ...applicantData,
                fullName: applicantData.fullName ? sanitizeInput(applicantData.fullName) : data.applicants[applicantIndex].fullName,
                email: applicantData.email ? sanitizeEmail(applicantData.email) : data.applicants[applicantIndex].email,
                phone: applicantData.phone ? sanitizeInput(applicantData.phone) : data.applicants[applicantIndex].phone,
                positionApplied: applicantData.positionApplied ? sanitizeInput(applicantData.positionApplied) : data.applicants[applicantIndex].positionApplied,
                currentSalary: applicantData.currentSalary !== undefined
                    ? normalizeInt(applicantData.currentSalary)
                    : data.applicants[applicantIndex].currentSalary,
                expectedSalary: applicantData.expectedSalary !== undefined
                    ? normalizeInt(applicantData.expectedSalary)
                    : data.applicants[applicantIndex].expectedSalary,
                noticePeriod: applicantData.noticePeriod ? sanitizeInput(applicantData.noticePeriod) : data.applicants[applicantIndex].noticePeriod,
                resumeFile: applicantData.resumeFile ?? data.applicants[applicantIndex].resumeFile,
                updatedAt: new Date().toISOString()
            }

            data.applicants[applicantIndex] = updatedApplicant
            this.saveData(data)
            return updatedApplicant
        } catch (error) {
            console.error('Error updating applicant:', error)
            throw error
        }
    }

    deleteApplicant(applicantId: string): void {
        try {
            const data = this.getData()
            if (!data.applicants) return

            const initialLength = data.applicants.length
            data.applicants = data.applicants.filter(applicant => applicant.id !== applicantId)

            if (data.applicants.length === initialLength) {
                throw new Error('Applicant not found')
            }

            this.saveData(data)
        } catch (error) {
            console.error('Error deleting applicant:', error)
            throw error
        }
    }

}

// Singleton instance
export const dataStore = new DataStore()
