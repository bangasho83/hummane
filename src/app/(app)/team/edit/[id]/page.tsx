'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useApp } from '@/lib/context/AppContext'
import { EmployeeForm, JobDescriptionPreview } from '@/features/employees'
import { toast } from '@/components/ui/toast'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { EmployeeApi } from '@/types'

const API_URL = 'https://hummane-api.vercel.app'

export default function EditEmployeePage() {
    const router = useRouter()
    const params = useParams()
    const { employees, updateEmployee, roles, apiAccessToken, departments, refreshDepartments, refreshRoles } = useApp()
    const [employee, setEmployee] = useState<EmployeeApi | null>(null)
    const [loading, setLoading] = useState(false)
    const [loadingEmployee, setLoadingEmployee] = useState(true)
    const [loadingLists, setLoadingLists] = useState(true)
    const [selectedRoleId, setSelectedRoleId] = useState('')
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
        let isActive = true

        const loadEmployee = async () => {
            console.log('EditPage loadEmployee - apiAccessToken:', !!apiAccessToken, 'employees.length:', employees.length)
            if (!apiAccessToken) {
                const emp = employees.find(e => e.id === employeeId)
                console.log('EditPage - using context employee, personalDetails:', emp?.personalDetails)
                if (!isActive) return
                setEmployee(emp || null)
                setSelectedRoleId(emp?.roleId || '')
                setLoadingEmployee(false)
                if (!emp && employees.length > 0) {
                    toast('Employee not found', 'error')
                    router.push('/team')
                }
                return
            }

            try {
                setLoadingEmployee(true)

                const apiUrl = `${API_URL}/employees/${encodeURIComponent(employeeId)}`
                const response = await fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${apiAccessToken}`,
                    },
                })

                if (!isActive) return

                if (!response.ok) {
                    toast('Employee not found', 'error')
                    router.push('/team')
                    return
                }

                const data = await response.json()
                const apiEmployee = (data?.data || data?.employee || data) as EmployeeApi | null

                setEmployee(apiEmployee)
                setSelectedRoleId(apiEmployee?.roleId || '')
                if (!apiEmployee) {
                    toast('Employee not found', 'error')
                    router.push('/team')
                }
            } catch (error) {
                if (!isActive) return
                toast('Failed to load employee', 'error')
            } finally {
                if (isActive) {
                    setLoadingEmployee(false)
                }
            }
        }

        void loadEmployee()
        return () => {
            isActive = false
        }
    }, [apiAccessToken, employeeId, employees, router])

    useEffect(() => {
        let isActive = true
        const loadLists = async () => {
            try {
                if (departments.length === 0) {
                    await refreshDepartments()
                }
                if (roles.length === 0) {
                    await refreshRoles()
                }
            } finally {
                if (isActive) {
                    setLoadingLists(false)
                }
            }
        }

        void loadLists()
        return () => {
            isActive = false
        }
    }, [departments.length, roles.length, refreshDepartments, refreshRoles])

    const selectedRole = roles.find(role => role.id === selectedRoleId)

    const handleSubmit = async (data: any) => {
        if (!employee?.id) {
            toast('Missing employee id', 'error')
            return
        }

        // Build and log curl command for debugging
        const apiUrl = `${API_URL}/employees/${encodeURIComponent(employee.id)}`
        const payload = {
            companyId: data.companyId || employee.companyId,
            employeeId: data.employeeId,
            name: data.name,
            email: data.email,
            departmentId: data.departmentId,
            roleId: data.roleId,
            startDate: data.startDate,
            employmentType: data.employmentType,
            employmentMode: data.employmentMode,
            reportingManagerId: data.reportingManagerId,
            gender: data.gender,
            salary: data.salary,
            dob: data.dob,
            personalDetails: data.personalDetails
        }
        // Remove undefined values for cleaner output
        const cleanPayload = Object.fromEntries(
            Object.entries(payload).filter(([, v]) => v !== undefined)
        )
        const curlCommand = `curl -X PUT "${apiUrl}" \\
  -H "Authorization: Bearer ${apiAccessToken}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(cleanPayload, null, 2)}'`
        console.log('Update Employee CURL:\n', curlCommand)

        setLoading(true)
        try {
            await updateEmployee(employee.id, data)
            toast('Employee updated successfully', 'success')
            router.push('/team')
        } catch (error) {
            toast('Failed to update employee', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleCancel = () => {
        router.push('/team')
    }

    if ((loadingEmployee && !employee) || loadingLists) {
        return <div className="p-8 text-center text-slate-500">Loading employee data...</div>
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
                        Edit {employee?.name}
                    </h1>
                    <p className="text-slate-500 font-medium">
                        Update profile and professional details for this employee.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px] gap-6">
                <Card className="border border-slate-100 shadow-premium rounded-3xl bg-white overflow-hidden">
                    <CardContent className="p-8">
                        {employee ? (
                            <EmployeeForm
                                employee={employee}
                                onSubmit={handleSubmit}
                                onCancel={handleCancel}
                                submitLabel="Update Employee Info"
                                loading={loading}
                                onRoleChange={setSelectedRoleId}
                            />
                        ) : (
                            <div className="py-12 text-center text-slate-400">Loading form...</div>
                        )}
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
