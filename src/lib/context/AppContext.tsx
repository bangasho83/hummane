'use client'

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User, Company, Employee, Department, LeaveRecord, Role, Job, Applicant, LeaveType, Holiday, EmployeeDocument } from '@/types'
import { dataStore } from '@/lib/store/dataStore'
interface AppContextType {
    currentUser: User | null
    currentCompany: Company | null
    employees: Employee[]
    departments: Department[]
    leaves: LeaveRecord[]
    leaveTypes: LeaveType[]
    holidays: Holiday[]
    roles: Role[]
    jobs: Job[]
    applicants: Applicant[]
    login: (email: string, password: string) => Promise<{ success: boolean; message: string }>
    signup: (name: string, email: string, password: string) => Promise<{ success: boolean; message: string }>
    logout: () => void
    createCompany: (name: string, industry: string, size: string) => Promise<Company>
    updateCompany: (id: string, companyData: Partial<Omit<Company, 'id' | 'ownerId' | 'createdAt'>>) => Promise<Company | null>
    createEmployee: (employeeData: Omit<Employee, 'id' | 'companyId' | 'createdAt'>) => Promise<Employee>
    updateEmployee: (id: string, employeeData: Partial<Omit<Employee, 'id' | 'companyId' | 'createdAt'>>) => Promise<Employee | null>
    deleteEmployee: (id: string) => void
    refreshEmployees: () => void
    createDepartment: (departmentData: Omit<Department, 'id' | 'companyId' | 'createdAt'>) => Promise<Department>
    deleteDepartment: (id: string) => void
    refreshDepartments: () => void
    createHoliday: (holiday: Omit<Holiday, 'id' | 'companyId' | 'createdAt'>) => Holiday
    deleteHoliday: (id: string) => void
    refreshHolidays: () => void
    addDocument: (doc: Omit<EmployeeDocument, 'id' | 'uploadedAt'>) => EmployeeDocument
    deleteDocument: (id: string) => void
    getDocuments: (employeeId: string) => EmployeeDocument[]
    createLeaveType: (leaveTypeData: Omit<LeaveType, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>) => LeaveType
    deleteLeaveType: (id: string) => void
    refreshLeaveTypes: () => void
    addLeave: (leaveData: Omit<LeaveRecord, 'id' | 'companyId' | 'createdAt'>) => Promise<LeaveRecord>
    createRole: (roleData: Omit<Role, 'id' | 'companyId' | 'createdAt'>) => Promise<Role>
    updateRole: (id: string, roleData: Partial<Omit<Role, 'id' | 'companyId' | 'createdAt'>>) => Promise<Role | null>
    deleteRole: (id: string) => void
    refreshRoles: () => void
    createJob: (jobData: Omit<Job, 'id' | 'companyId' | 'createdAt'>) => Promise<Job>
    updateJob: (id: string, jobData: Partial<Omit<Job, 'id' | 'companyId' | 'createdAt'>>) => Promise<Job | null>
    deleteJob: (id: string) => void
    refreshJobs: () => void
    createApplicant: (applicantData: Omit<Applicant, 'id' | 'companyId' | 'createdAt'>) => Promise<Applicant>
    updateApplicant: (id: string, applicantData: Partial<Omit<Applicant, 'id' | 'companyId' | 'createdAt'>>) => Promise<Applicant | null>
    deleteApplicant: (id: string) => void
    refreshApplicants: () => void
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
    const [roles, setRoles] = useState<Role[]>([])
    const [jobs, setJobs] = useState<Job[]>([])
    const [applicants, setApplicants] = useState<Applicant[]>([])
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        // Check if user is logged in
        const user = dataStore.getCurrentUser()
        if (user) {
            setCurrentUser(user)
            const company = dataStore.getCompanyByOwnerId(user.id)
            if (company) {
                setCurrentCompany(company)
                setEmployees(dataStore.getEmployeesByCompanyId(company.id))
                setDepartments(dataStore.getDepartmentsByCompanyId(company.id))
                setLeaves(dataStore.getLeavesByCompanyId(company.id))
                setLeaveTypes(dataStore.getLeaveTypesByCompanyId(company.id))
                setHolidays(dataStore.getHolidaysByCompanyId(company.id))
                setRoles(dataStore.getRolesByCompanyId(company.id))
                setJobs(dataStore.getJobsByCompanyId(company.id))
                setApplicants(dataStore.getApplicantsByCompanyId(company.id))
            }
        }
    }, [])

    const login = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
        try {
            // Verify user credentials with hashed password
            const user = await dataStore.verifyUserPassword(email, password)

            if (!user) {
                return { success: false, message: 'Invalid email or password' }
            }

            dataStore.setCurrentUser(user.id)
            setCurrentUser(user)

            const company = dataStore.getCompanyByOwnerId(user.id)
            if (company) {
                setCurrentCompany(company)
                setEmployees(dataStore.getEmployeesByCompanyId(company.id))
                setDepartments(dataStore.getDepartmentsByCompanyId(company.id))
                setLeaves(dataStore.getLeavesByCompanyId(company.id))
                setLeaveTypes(dataStore.getLeaveTypesByCompanyId(company.id))
                setHolidays(dataStore.getHolidaysByCompanyId(company.id))
                setRoles(dataStore.getRolesByCompanyId(company.id))
                setJobs(dataStore.getJobsByCompanyId(company.id))
                setApplicants(dataStore.getApplicantsByCompanyId(company.id))
            }

            return { success: true, message: 'Welcome back!' }
        } catch (error) {
            console.error('Login error:', error)
            return { success: false, message: 'An error occurred during login. Please try again.' }
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

            // Check if email already exists
            if (dataStore.getUserByEmail(email)) {
                return { success: false, message: 'An account with this email already exists' }
            }

            // Create user with hashed password
            const user = await dataStore.createUser({ name, email, password })
            dataStore.setCurrentUser(user.id)
            setCurrentUser(user)

            return { success: true, message: 'Account created successfully!' }
        } catch (error) {
            console.error('Signup error:', error)
            return { success: false, message: 'An error occurred during signup. Please try again.' }
        }
    }

    const logout = () => {
        try {
            dataStore.logout()
            setCurrentUser(null)
            setCurrentCompany(null)
            setEmployees([])
            setDepartments([])
            setLeaves([])
        } catch (error) {
            console.error('Logout error:', error)
            throw new Error('Failed to logout. Please try again.')
        }
    }

    const createCompany = async (name: string, industry: string, size: string): Promise<Company> => {
        try {
            if (!currentUser) throw new Error('No user logged in')

            const company = dataStore.createCompany({ name, industry, size }, currentUser.id)
            setCurrentCompany(company)
            return company
        } catch (error) {
            console.error('Create company error:', error)
            throw error
        }
    }

    const updateCompany = async (id: string, companyData: Partial<Omit<Company, 'id' | 'ownerId' | 'createdAt'>>): Promise<Company | null> => {
        try {
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

    const deleteEmployee = (id: string) => {
        try {
            dataStore.deleteEmployee(id)
            if (currentCompany) {
                setEmployees(dataStore.getEmployeesByCompanyId(currentCompany.id))
            }
        } catch (error) {
            console.error('Delete employee error:', error)
            throw error
        }
    }

    const refreshEmployees = () => {
        try {
            if (currentCompany) {
                setEmployees(dataStore.getEmployeesByCompanyId(currentCompany.id))
            }
        } catch (error) {
            console.error('Refresh employees error:', error)
        }
    }

    const createDepartment = async (departmentData: Omit<Department, 'id' | 'companyId' | 'createdAt'>): Promise<Department> => {
        try {
            if (!currentCompany) throw new Error('No company set up')

            const department = dataStore.createDepartment(departmentData, currentCompany.id)
            setDepartments(dataStore.getDepartmentsByCompanyId(currentCompany.id))
            return department
        } catch (error) {
            console.error('Create department error:', error)
            throw error
        }
    }

    const deleteDepartment = (id: string) => {
        try {
            dataStore.deleteDepartment(id)
            if (currentCompany) {
                setDepartments(dataStore.getDepartmentsByCompanyId(currentCompany.id))
            }
        } catch (error) {
            console.error('Delete department error:', error)
            throw error
        }
    }

    const refreshDepartments = () => {
        try {
            if (currentCompany) {
                setDepartments(dataStore.getDepartmentsByCompanyId(currentCompany.id))
            }
        } catch (error) {
            console.error('Refresh departments error:', error)
        }
    }

    const createHoliday = (holiday: Omit<Holiday, 'id' | 'companyId' | 'createdAt'>) => {
        try {
            if (!currentCompany) throw new Error('No company set up')
            const created = dataStore.createHoliday(holiday, currentCompany.id)
            setHolidays(dataStore.getHolidaysByCompanyId(currentCompany.id))
            return created
        } catch (error) {
            console.error('Create holiday error:', error)
            throw error
        }
    }

    const deleteHoliday = (id: string) => {
        try {
            dataStore.deleteHoliday(id)
            if (currentCompany) {
                setHolidays(dataStore.getHolidaysByCompanyId(currentCompany.id))
            }
        } catch (error) {
            console.error('Delete holiday error:', error)
            throw error
        }
    }

    const refreshHolidays = () => {
        try {
            if (currentCompany) {
                setHolidays(dataStore.getHolidaysByCompanyId(currentCompany.id))
            }
        } catch (error) {
            console.error('Refresh holidays error:', error)
        }
    }

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

    const createLeaveType = (leaveTypeData: Omit<LeaveType, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>) => {
        try {
            if (!currentCompany) throw new Error('No company set up')
            const leaveType = dataStore.createLeaveType(leaveTypeData, currentCompany.id)
            setLeaveTypes(dataStore.getLeaveTypesByCompanyId(currentCompany.id))
            return leaveType
        } catch (error) {
            console.error('Create leave type error:', error)
            throw error
        }
    }

    const deleteLeaveType = (id: string) => {
        try {
            dataStore.deleteLeaveType(id)
            if (currentCompany) {
                setLeaveTypes(dataStore.getLeaveTypesByCompanyId(currentCompany.id))
            }
        } catch (error) {
            console.error('Delete leave type error:', error)
            throw error
        }
    }

    const refreshLeaveTypes = () => {
        try {
            if (currentCompany) {
                setLeaveTypes(dataStore.getLeaveTypesByCompanyId(currentCompany.id))
            }
        } catch (error) {
            console.error('Refresh leave types error:', error)
        }
    }

    const addLeave = async (leaveData: Omit<LeaveRecord, 'id' | 'companyId' | 'createdAt'>): Promise<LeaveRecord> => {
        try {
            if (!currentCompany) throw new Error('No company set up')

            const leave = dataStore.addLeave(leaveData, currentCompany.id)
            setLeaves(dataStore.getLeavesByCompanyId(currentCompany.id))
            return leave
        } catch (error) {
            console.error('Add leave error:', error)
            throw error
        }
    }

    const createRole = async (roleData: Omit<Role, 'id' | 'companyId' | 'createdAt'>): Promise<Role> => {
        try {
            if (!currentCompany) throw new Error('No company set up')

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
            const role = dataStore.updateRole(id, roleData)
            if (currentCompany) {
                setRoles(dataStore.getRolesByCompanyId(currentCompany.id))
            }
            return role
        } catch (error) {
            console.error('Update role error:', error)
            throw error
        }
    }

    const deleteRole = (id: string) => {
        try {
            dataStore.deleteRole(id)
            if (currentCompany) {
                setRoles(dataStore.getRolesByCompanyId(currentCompany.id))
            }
        } catch (error) {
            console.error('Delete role error:', error)
            throw error
        }
    }

    const refreshRoles = () => {
        try {
            if (currentCompany) {
                setRoles(dataStore.getRolesByCompanyId(currentCompany.id))
            }
        } catch (error) {
            console.error('Refresh roles error:', error)
        }
    }

    const createJob = async (jobData: Omit<Job, 'id' | 'companyId' | 'createdAt'>): Promise<Job> => {
        try {
            if (!currentCompany) {
                throw new Error('No company found')
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
            const job = dataStore.updateJob(id, jobData)
            if (currentCompany) {
                setJobs(dataStore.getJobsByCompanyId(currentCompany.id))
            }
            return job
        } catch (error) {
            console.error('Update job error:', error)
            throw error
        }
    }

    const deleteJob = (id: string) => {
        try {
            dataStore.deleteJob(id)
            if (currentCompany) {
                setJobs(dataStore.getJobsByCompanyId(currentCompany.id))
            }
        } catch (error) {
            console.error('Delete job error:', error)
            throw error
        }
    }

    const refreshJobs = () => {
        try {
            if (currentCompany) {
                setJobs(dataStore.getJobsByCompanyId(currentCompany.id))
            }
        } catch (error) {
            console.error('Refresh jobs error:', error)
        }
    }

    const createApplicant = async (applicantData: Omit<Applicant, 'id' | 'companyId' | 'createdAt'>): Promise<Applicant> => {
        try {
            if (!currentCompany) {
                throw new Error('No company found')
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

    const deleteApplicant = (id: string) => {
        try {
            dataStore.deleteApplicant(id)
            if (currentCompany) {
                setApplicants(dataStore.getApplicantsByCompanyId(currentCompany.id))
            }
        } catch (error) {
            console.error('Delete applicant error:', error)
            throw error
        }
    }

    const refreshApplicants = () => {
        try {
            if (currentCompany) {
                setApplicants(dataStore.getApplicantsByCompanyId(currentCompany.id))
            }
        } catch (error) {
            console.error('Refresh applicants error:', error)
        }
    }

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
                roles,
                jobs,
                applicants,
                login,
                signup,
                logout,
                createCompany,
                updateCompany,
                createEmployee,
                updateEmployee,
                deleteEmployee,
                refreshEmployees,
                createDepartment,
                deleteDepartment,
                refreshDepartments,
                createHoliday,
                deleteHoliday,
                refreshHolidays,
                createLeaveType,
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
