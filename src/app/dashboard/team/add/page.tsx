'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Users, Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmployeeForm } from '@/components/employee/EmployeeForm'
import { useApp } from '@/lib/context/AppContext'
import { toast } from '@/components/ui/toast'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'

export default function AddEmployeePage() {
    const router = useRouter()
    const pathname = usePathname()
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

    const isTeamTab = pathname === '/dashboard/team'

    return (
        <DashboardShell>
            <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                            Team
                        </h1>
                        <p className="text-slate-500 font-medium">
                            Add a new member to {currentCompany?.name}.
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
