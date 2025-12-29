'use client'

import { useRouter } from 'next/navigation'
import { useApp } from '@/lib/context/AppContext'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { EmployeeTable } from '@/components/employee/EmployeeTable'
import { StatsCards } from '@/components/dashboard/StatsCards'
import { DashboardShell } from '@/components/layout/DashboardShell'

export default function DashboardPage() {
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
        router.push('/dashboard/team/add')
    }

    return (
        <DashboardShell>
            {/* Stats Section */}
            <section className="animate-in fade-in duration-500 slide-in-from-bottom-4">
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                            Dashboard Overview
                        </h2>
                        <p className="text-slate-500 font-medium">
                            Welcome back! Here's what's happening in {currentCompany.name} today.
                        </p>
                    </div>
                </div>
                <StatsCards employees={employees} />
            </section>

            {/* Quick Actions or Recent Activity could go here in a real app */}
            <section className="animate-in fade-in duration-700 delay-100 slide-in-from-bottom-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-3xl shadow-premium border border-slate-100">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Recent Activity</h3>
                    <p className="text-slate-500 text-sm mb-6">Latest updates from your workforce.</p>
                    <div className="space-y-4">
                        <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-4">
                            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center font-bold">
                                +
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-900">New Employee Registered</p>
                                <p className="text-xs text-slate-500">A few moments ago</p>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-4 opacity-50">
                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-bold">
                                i
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-900">Payroll processed</p>
                                <p className="text-xs text-slate-500">2 days ago</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-premium border border-slate-100">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Quick Links</h3>
                    <p className="text-slate-500 text-sm mb-6">Commonly used tools and actions.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Button
                            onClick={handleAddEmployee}
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 py-6 rounded-2xl font-bold transition-all hover:scale-105"
                        >
                            Add Employee
                        </Button>
                        <Button
                            variant="outline"
                            className="py-6 rounded-2xl font-bold border-slate-200"
                        >
                            Run Payroll
                        </Button>
                    </div>
                </div>
            </section>
        </DashboardShell>
    )
}
