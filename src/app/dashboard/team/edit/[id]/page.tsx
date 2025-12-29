'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams, usePathname } from 'next/navigation'
import { useApp } from '@/lib/context/AppContext'
import { EmployeeForm } from '@/components/employee/EmployeeForm'
import { toast } from '@/components/ui/toast'
import { Users, Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Employee } from '@/types'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'

export default function EditEmployeePage() {
    const router = useRouter()
    const params = useParams()
    const pathname = usePathname()
    const { employees, updateEmployee } = useApp()
    const [employee, setEmployee] = useState<Employee | null>(null)
    const [loading, setLoading] = useState(false)
    const employeeId = params.id as string

    // Redirect if not logged in or no company (these checks are typically handled by DashboardShell or a parent layout)
    // if (!currentUser) {
    //     router.push('/login')
    //     return null
    // }

    // if (!currentCompany) {
    //     router.push('/company-setup')
    //     return null
    // }

    useEffect(() => {
        const emp = employees.find(e => e.id === employeeId)
        if (emp) {
            setEmployee(emp)
        } else if (employees.length > 0) {
            toast('Employee not found', 'error')
            router.push('/dashboard/team')
        }
    }, [employeeId, employees, router])

    const handleSubmit = async (data: any) => {
        if (!employee) return
        setLoading(true)
        try {
            await updateEmployee(employee.id, data)
            toast('Employee updated successfully', 'success')
            router.push('/dashboard/team')
        } catch (error) {
            toast('Failed to update employee', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleCancel = () => {
        router.push('/dashboard/team')
    }

    const isTeamTab = pathname === '/dashboard/team'

    if (!employee && employees.length === 0) {
        return <div className="p-8 text-center text-slate-500">Loading employee data...</div>
    }

    return (
        <DashboardShell>
            <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                            Team
                        </h1>
                        <p className="text-slate-500 font-medium">
                            Update profile and professional details for {employee?.name}.
                        </p>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-2 mb-6">
                    <Link href="/dashboard/team">
                        <Button
                            variant={isTeamTab ? "default" : "outline"}
                            className={`rounded-2xl font-bold h-12 px-6 ${
                                isTeamTab
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20'
                                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <Users className="w-4 h-4 mr-2" />
                            Team Members
                        </Button>
                    </Link>
                    <Link href="/dashboard/team/roles">
                        <Button
                            variant={!isTeamTab ? "default" : "outline"}
                            className={`rounded-2xl font-bold h-12 px-6 ${
                                !isTeamTab
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20'
                                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <Briefcase className="w-4 h-4 mr-2" />
                            Roles & JDs
                        </Button>
                    </Link>
                </div>

                <div className="max-w-2xl">
                    <Card className="border-none shadow-premium rounded-3xl overflow-hidden">
                        <CardContent className="p-8">
                            {employee ? (
                                <EmployeeForm
                                    employee={employee}
                                    onSubmit={handleSubmit}
                                    onCancel={handleCancel}
                                    submitLabel="Update Employee Info"
                                    loading={loading}
                                />
                            ) : (
                                <div className="py-12 text-center text-slate-400">Loading form...</div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardShell>
    )
}
