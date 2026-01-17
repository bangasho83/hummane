'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmployeeForm, JobDescriptionPreview } from '@/features/employees'
import { useApp } from '@/lib/context/AppContext'
import { toast } from '@/components/ui/toast'
import { Card, CardContent } from '@/components/ui/card'

export default function AddEmployeePage() {
    const router = useRouter()
    const { createEmployee, currentCompany, roles } = useApp()
    const [loading, setLoading] = useState(false)
    const [selectedRoleId, setSelectedRoleId] = useState('')
    const selectedRole = roles.find(role => role.id === selectedRoleId)

    const handleSubmit = async (data: any) => {
        setLoading(true)
        try {
            await createEmployee(data)
            toast('Employee added successfully', 'success')
            router.push('/team')
        } catch (error) {
            toast('Failed to add employee', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleCancel = () => {
        router.push('/team')
    }

    return (
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

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px] gap-6">
                <Card className="border border-slate-100 shadow-premium rounded-3xl bg-white overflow-hidden">
                    <CardContent className="p-8">
                        <EmployeeForm
                            onSubmit={handleSubmit}
                            onCancel={handleCancel}
                            submitLabel="Register Employee"
                            loading={loading}
                            onRoleChange={setSelectedRoleId}
                        />
                    </CardContent>
                </Card>
                <div className="space-y-6">
                    {/* Career Timeline */}
                    <Card className="border border-slate-100 shadow-premium rounded-3xl bg-white overflow-hidden">
                        <CardContent className="p-6">
                            <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-3">Career Timeline</p>
                            <div className="space-y-2 text-sm">
                                <p className="text-slate-600"><span className="text-slate-400">Jan 2023</span> — Intern — Internship [Rs. 25,000]</p>
                                <p className="text-slate-600"><span className="text-slate-400">Apr 2023</span> — Junior Developer — Full-time [Rs. 60,000]</p>
                                <p className="text-slate-600"><span className="text-slate-400">Jan 2024</span> — Senior Developer — Full-time [Rs. 120,000]</p>
                                <p className="text-slate-700 font-medium"><span className="text-slate-400">Aug 2024</span> — Team Lead — Full-time [Rs. 180,000]</p>
                            </div>
                        </CardContent>
                    </Card>

                    <JobDescriptionPreview
                        title={selectedRole?.title || 'Job Description'}
                        description={selectedRole?.description}
                    />
                </div>
            </div>
        </div>
    )
}
