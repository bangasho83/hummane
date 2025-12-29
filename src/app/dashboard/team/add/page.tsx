'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmployeeForm } from '@/components/employee/EmployeeForm'
import { useApp } from '@/lib/context/AppContext'
import { toast } from '@/components/ui/toast'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Card, CardContent } from '@/components/ui/card'

export default function AddEmployeePage() {
    const router = useRouter()
    const { createEmployee, currentCompany } = useApp()
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (data: any) => {
        setLoading(true)
        try {
            await createEmployee(data)
            toast('Employee added successfully', 'success')
            router.push('/dashboard/team')
        } catch (error) {
            toast('Failed to add employee', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleCancel = () => {
        router.push('/dashboard/team')
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
                            Add New Employee
                        </h1>
                        <p className="text-slate-500 font-medium">
                            Enter details to register a new member to {currentCompany?.name}.
                        </p>
                    </div>
                </div>

                <div className="max-w-2xl">
                    <Card className="border-none shadow-premium rounded-3xl overflow-hidden">
                        <CardContent className="p-8">
                            <EmployeeForm
                                onSubmit={handleSubmit}
                                onCancel={handleCancel}
                                submitLabel="Register Employee"
                                loading={loading}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardShell>
    )
}
