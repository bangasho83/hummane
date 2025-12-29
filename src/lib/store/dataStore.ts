import type { User, Company, Employee, Department, DataStoreSchema, LeaveRecord } from '@/types'

export class DataStore {
    private STORAGE_KEY = 'hrSystemData'

    constructor() {
        if (typeof window !== 'undefined') {
            this.initializeStorage()
        }
    }

    private initializeStorage(): void {
        if (!localStorage.getItem(this.STORAGE_KEY)) {
            const initialData: DataStoreSchema = {
                users: [],
                companies: [],
                employees: [],
                departments: [],
                leaves: [],
                currentUser: null
            }
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(initialData))
        }
    }

    private getData(): DataStoreSchema {
        if (typeof window === 'undefined') {
            return {
                users: [],
                companies: [],
                employees: [],
                departments: [],
                leaves: [],
                currentUser: null
            }
        }
        const data = localStorage.getItem(this.STORAGE_KEY)
        return data ? JSON.parse(data) : this.getInitialData()
    }

    private getInitialData(): DataStoreSchema {
        return {
            users: [],
            companies: [],
            employees: [],
            departments: [],
            leaves: [],
            currentUser: null
        }
    }

    private saveData(data: DataStoreSchema): void {
        if (typeof window !== 'undefined') {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data))
        }
    }

    private generateId(): string {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    }

    // User operations
    createUser(userData: Omit<User, 'id' | 'createdAt'>): User {
        const data = this.getData()
        const user: User = {
            id: this.generateId(),
            ...userData,
            createdAt: new Date().toISOString()
        }
        data.users.push(user)
        this.saveData(data)
        return user
    }

    getUserByEmail(email: string): User | undefined {
        const data = this.getData()
        return data.users.find(user => user.email === email)
    }

    setCurrentUser(userId: string): void {
        const data = this.getData()
        data.currentUser = userId
        this.saveData(data)
    }

    getCurrentUser(): User | null {
        const data = this.getData()
        if (!data.currentUser) return null
        return data.users.find(user => user.id === data.currentUser) || null
    }

    logout(): void {
        const data = this.getData()
        data.currentUser = null
        this.saveData(data)
    }

    // Company operations
    createCompany(companyData: Omit<Company, 'id' | 'ownerId' | 'createdAt'>, ownerId: string): Company {
        const data = this.getData()
        const company: Company = {
            id: this.generateId(),
            ...companyData,
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
    }

    getCompanyByOwnerId(ownerId: string): Company | undefined {
        const data = this.getData()
        return data.companies.find(company => company.ownerId === ownerId)
    }

    updateCompany(companyId: string, companyData: Partial<Omit<Company, 'id' | 'ownerId' | 'createdAt'>>): Company | null {
        const data = this.getData()
        const index = data.companies.findIndex(comp => comp.id === companyId)
        if (index !== -1) {
            data.companies[index] = {
                ...data.companies[index],
                ...companyData
            }
            this.saveData(data)
            return data.companies[index]
        }
        return null
    }

    // Employee operations
    createEmployee(employeeData: Omit<Employee, 'id' | 'companyId' | 'createdAt'>, companyId: string): Employee {
        const data = this.getData()
        const employee: Employee = {
            id: this.generateId(),
            companyId,
            ...employeeData,
            createdAt: new Date().toISOString()
        }
        data.employees.push(employee)
        this.saveData(data)
        return employee
    }

    getEmployeesByCompanyId(companyId: string): Employee[] {
        const data = this.getData()
        return data.employees.filter(employee => employee.companyId === companyId)
    }

    updateEmployee(employeeId: string, employeeData: Partial<Omit<Employee, 'id' | 'companyId' | 'createdAt'>>): Employee | null {
        const data = this.getData()
        const index = data.employees.findIndex(emp => emp.id === employeeId)
        if (index !== -1) {
            data.employees[index] = {
                ...data.employees[index],
                ...employeeData,
                updatedAt: new Date().toISOString()
            }
            this.saveData(data)
            return data.employees[index]
        }
        return null
    }

    deleteEmployee(employeeId: string): void {
        const data = this.getData()
        data.employees = data.employees.filter(emp => emp.id !== employeeId)
        this.saveData(data)
    }

    // Department operations
    createDepartment(departmentData: Omit<Department, 'id' | 'companyId' | 'createdAt'>, companyId: string): Department {
        const data = this.getData()
        const department: Department = {
            id: this.generateId(),
            companyId,
            ...departmentData,
            createdAt: new Date().toISOString()
        }
        if (!data.departments) data.departments = []
        data.departments.push(department)
        this.saveData(data)
        return department
    }

    getDepartmentsByCompanyId(companyId: string): Department[] {
        const data = this.getData()
        if (!data.departments) return []
        return data.departments.filter(dept => dept.companyId === companyId)
    }

    deleteDepartment(departmentId: string): void {
        const data = this.getData()
        if (!data.departments) return
        data.departments = data.departments.filter(dept => dept.id !== departmentId)
        this.saveData(data)
    }

    // Leave operations
    addLeave(leaveData: Omit<LeaveRecord, 'id' | 'companyId' | 'createdAt'>, companyId: string): LeaveRecord {
        const data = this.getData()
        const leave: LeaveRecord = {
            id: this.generateId(),
            companyId,
            ...leaveData,
            createdAt: new Date().toISOString()
        }
        if (!data.leaves) data.leaves = []
        data.leaves.push(leave)
        this.saveData(data)
        return leave
    }

    getLeavesByCompanyId(companyId: string): LeaveRecord[] {
        const data = this.getData()
        if (!data.leaves) return []
        return data.leaves.filter(leave => leave.companyId === companyId)
    }

}

// Singleton instance
export const dataStore = new DataStore()
