import type { User, Company, Employee, Department, DataStoreSchema, LeaveRecord, Role, Job, Applicant } from '@/types'
import { hashPassword, verifyPassword, sanitizeInput, sanitizeEmail } from '@/lib/security/crypto'

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

            // Check if user already has a company
            if (data.companies.some(c => c.ownerId === ownerId)) {
                throw new Error('User already has a company')
            }

            const company: Company = {
                id: this.generateId(),
                name: sanitizedName,
                industry: sanitizedIndustry,
                size: companyData.size,
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

            // Validate salary
            if (employeeData.salary < 0 || !isFinite(employeeData.salary)) {
                throw new Error('Invalid salary amount')
            }

            const employee: Employee = {
                id: this.generateId(),
                companyId,
                name: sanitizedName,
                email: sanitizedEmail,
                position: sanitizedPosition,
                department: sanitizedDepartment,
                startDate: employeeData.startDate,
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
            return data.employees.filter(employee => employee.companyId === companyId)
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
            if (employeeData.name) sanitizedData.name = sanitizeInput(employeeData.name)
            if (employeeData.email) sanitizedData.email = sanitizeEmail(employeeData.email)
            if (employeeData.position) sanitizedData.position = sanitizeInput(employeeData.position)
            if (employeeData.department) sanitizedData.department = sanitizeInput(employeeData.department)
            if (employeeData.startDate) sanitizedData.startDate = employeeData.startDate
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
            const sanitizedDescription = sanitizeInput(roleData.description)

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
                description: roleData.description ? sanitizeInput(roleData.description) : data.roles[roleIndex].description
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

            const newApplicant: Applicant = {
                id: `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                companyId,
                jobId: applicantData.jobId,
                fullName: sanitizeInput(applicantData.fullName),
                email: sanitizeEmail(applicantData.email),
                phone: sanitizeInput(applicantData.phone),
                positionApplied: sanitizeInput(applicantData.positionApplied),
                yearsOfExperience: applicantData.yearsOfExperience,
                currentSalary: sanitizeInput(applicantData.currentSalary),
                expectedSalary: sanitizeInput(applicantData.expectedSalary),
                noticePeriod: sanitizeInput(applicantData.noticePeriod),
                resumeUrl: applicantData.resumeUrl,
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

            const updatedApplicant: Applicant = {
                ...data.applicants[applicantIndex],
                ...applicantData,
                fullName: applicantData.fullName ? sanitizeInput(applicantData.fullName) : data.applicants[applicantIndex].fullName,
                email: applicantData.email ? sanitizeEmail(applicantData.email) : data.applicants[applicantIndex].email,
                phone: applicantData.phone ? sanitizeInput(applicantData.phone) : data.applicants[applicantIndex].phone,
                positionApplied: applicantData.positionApplied ? sanitizeInput(applicantData.positionApplied) : data.applicants[applicantIndex].positionApplied,
                currentSalary: applicantData.currentSalary ? sanitizeInput(applicantData.currentSalary) : data.applicants[applicantIndex].currentSalary,
                expectedSalary: applicantData.expectedSalary ? sanitizeInput(applicantData.expectedSalary) : data.applicants[applicantIndex].expectedSalary,
                noticePeriod: applicantData.noticePeriod ? sanitizeInput(applicantData.noticePeriod) : data.applicants[applicantIndex].noticePeriod,
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
