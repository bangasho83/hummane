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
            <section className="animate-in fade-in duration-700 slide-in-from-bottom-6">
                <div className="bg-white rounded-3xl shadow-premium border border-slate-100 overflow-hidden">
                    <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white/50 backdrop-blur-sm">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">
                                Employee Directory
                            </h3>
                            <p className="text-sm text-slate-500 font-medium">
                                Detailed list of all active employees in your organization.
                            </p>
                        </div>
                        <Button
                            onClick={handleAddEmployee}
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 px-6 py-6 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Add New Employee
                        </Button>
                    </div>

                    <div className="p-0">
                        <EmployeeTable employees={employees} />
                    </div>
                </div>
            </section>
        </DashboardShell>
    )
}
