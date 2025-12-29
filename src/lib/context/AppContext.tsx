'use client'

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User, Company, Employee, Department, LeaveRecord } from '@/types'
import { dataStore } from '@/lib/store/dataStore'
interface AppContextType {
    currentUser: User | null
    currentCompany: Company | null
    employees: Employee[]
    departments: Department[]
    leaves: LeaveRecord[]
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
    addLeave: (leaveData: Omit<LeaveRecord, 'id' | 'companyId' | 'createdAt'>) => Promise<LeaveRecord>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User | null>(null)
    const [currentCompany, setCurrentCompany] = useState<Company | null>(null)
    const [employees, setEmployees] = useState<Employee[]>([])
    const [departments, setDepartments] = useState<Department[]>([])
    const [leaves, setLeaves] = useState<LeaveRecord[]>([])
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
            }
        }
    }, [])

    const login = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
        const user = dataStore.getUserByEmail(email)

        if (!user) {
            return { success: false, message: 'No account found with this email' }
        }

        if (user.password !== password) {
            return { success: false, message: 'Incorrect password' }
        }

        dataStore.setCurrentUser(user.id)
        setCurrentUser(user)

        const company = dataStore.getCompanyByOwnerId(user.id)
        if (company) {
            setCurrentCompany(company)
            setEmployees(dataStore.getEmployeesByCompanyId(company.id))
            setDepartments(dataStore.getDepartmentsByCompanyId(company.id))
            setLeaves(dataStore.getLeavesByCompanyId(company.id))
        }

        return { success: true, message: 'Welcome back!' }
    }

    const signup = async (name: string, email: string, password: string): Promise<{ success: boolean; message: string }> => {
        // Validate password length
        if (password.length < 6) {
            return { success: false, message: 'Password must be at least 6 characters' }
        }

        // Check if email already exists
        if (dataStore.getUserByEmail(email)) {
            return { success: false, message: 'An account with this email already exists' }
        }

        const user = dataStore.createUser({ name, email, password })
        dataStore.setCurrentUser(user.id)
        setCurrentUser(user)

        return { success: true, message: 'Account created successfully!' }
    }

    const logout = () => {
        dataStore.logout()
        setCurrentUser(null)
        setCurrentCompany(null)
        setEmployees([])
        setDepartments([])
        setLeaves([])
    }

    const createCompany = async (name: string, industry: string, size: string): Promise<Company> => {
        if (!currentUser) throw new Error('No user logged in')

        const company = dataStore.createCompany({ name, industry, size }, currentUser.id)
        setCurrentCompany(company)
        return company
    }

    const updateCompany = async (id: string, companyData: Partial<Omit<Company, 'id' | 'ownerId' | 'createdAt'>>): Promise<Company | null> => {
        const company = dataStore.updateCompany(id, companyData)
        if (company) {
            setCurrentCompany(company)
        }
        return company
    }

    const createEmployee = async (employeeData: Omit<Employee, 'id' | 'companyId' | 'createdAt'>): Promise<Employee> => {
        if (!currentCompany) throw new Error('No company set up')

        const employee = dataStore.createEmployee(employeeData, currentCompany.id)
        setEmployees(dataStore.getEmployeesByCompanyId(currentCompany.id))
        return employee
    }

    const updateEmployee = async (id: string, employeeData: Partial<Omit<Employee, 'id' | 'companyId' | 'createdAt'>>): Promise<Employee | null> => {
        const employee = dataStore.updateEmployee(id, employeeData)
        if (currentCompany) {
            setEmployees(dataStore.getEmployeesByCompanyId(currentCompany.id))
        }
        return employee
    }

    const deleteEmployee = (id: string) => {
        dataStore.deleteEmployee(id)
        if (currentCompany) {
            setEmployees(dataStore.getEmployeesByCompanyId(currentCompany.id))
        }
    }

    const refreshEmployees = () => {
        if (currentCompany) {
            setEmployees(dataStore.getEmployeesByCompanyId(currentCompany.id))
        }
    }

    const createDepartment = async (departmentData: Omit<Department, 'id' | 'companyId' | 'createdAt'>): Promise<Department> => {
        if (!currentCompany) throw new Error('No company set up')

        const department = dataStore.createDepartment(departmentData, currentCompany.id)
        setDepartments(dataStore.getDepartmentsByCompanyId(currentCompany.id))
        return department
    }

    const deleteDepartment = (id: string) => {
        dataStore.deleteDepartment(id)
        if (currentCompany) {
            setDepartments(dataStore.getDepartmentsByCompanyId(currentCompany.id))
        }
    }

    const refreshDepartments = () => {
        if (currentCompany) {
            setDepartments(dataStore.getDepartmentsByCompanyId(currentCompany.id))
        }
    }

    const addLeave = async (leaveData: Omit<LeaveRecord, 'id' | 'companyId' | 'createdAt'>): Promise<LeaveRecord> => {
        if (!currentCompany) throw new Error('No company set up')

        const leave = dataStore.addLeave(leaveData, currentCompany.id)
        setLeaves(dataStore.getLeavesByCompanyId(currentCompany.id))
        return leave
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
                addLeave
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
