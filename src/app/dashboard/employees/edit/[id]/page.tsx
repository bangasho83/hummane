'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useApp } from '@/lib/context/AppContext'
import { EmployeeForm } from '@/components/employee/EmployeeForm'
import { toast } from '@/components/ui/toast'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Employee } from '@/types'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Card, CardContent } from '@/components/ui/card'

export default function EditEmployeePage() {
    const router = useRouter()
    const params = useParams()
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
            router.push('/dashboard/employees')
        }
    }, [employeeId, employees, router])

    const handleSubmit = async (data: any) => {
        if (!employee) return
        setLoading(true)
        try {
            await updateEmployee(employee.id, data)
            toast('Employee updated successfully', 'success')
            router.push('/dashboard/employees')
        } catch (error) {
            toast('Failed to update employee', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleCancel = () => {
        router.push('/dashboard/employees')
    }

    if (!employee && employees.length === 0) {
        return <div className="p-8 text-center text-slate-500">Loading employee data...</div>
    }

    return (
        <DashboardShell>
            <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">
                <div className="flex items-center gap-4 mb-8">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCancel}
                        className="rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                            Edit {employee?.name}
                        </h1>
                        <p className="text-slate-500 font-medium">
                            Update profile and professional details for this employee.
                        </p>
                    </div>
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
