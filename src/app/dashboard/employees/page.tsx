'use client'

import { useRouter } from 'next/navigation'
import { useApp } from '@/lib/context/AppContext'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { EmployeeTable } from '@/components/employee/EmployeeTable'
import { DashboardShell } from '@/components/layout/DashboardShell'

export default function EmployeesPage() {
    const router = useRouter()
    const { currentUser, currentCompany, employees } = useApp()

    // Redirect if not logged in or no company
    if (!currentUser) {
        router.push('/login')
        return null
    }

    if (!currentCompany) {
        router.push('/company-setup')
        return null
    }

    const handleAddEmployee = () => {
        router.push('/dashboard/employees/add')
    }

    return (
        <DashboardShell>
            <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                            Employees
                        </h1>
                        <p className="text-slate-500 font-medium">
                            Manage your team members and their information.
                        </p>
                    </div>

                    <Button
                        onClick={handleAddEmployee}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 px-6 py-6 h-auto"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Add Employee
                    </Button>
                </div>

                <div className="bg-white rounded-3xl shadow-premium border border-slate-100 overflow-hidden">
                    <EmployeeTable employees={employees} />
                </div>
            </div>
        </DashboardShell>
    )
}
