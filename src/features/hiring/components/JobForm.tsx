'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { QuillEditor } from '@/components/ui/quill-editor'
import { useApp } from '@/lib/context/AppContext'
import { EMPLOYMENT_MODES, EMPLOYMENT_TYPES, JOB_STATUSES, type EmploymentMode, type EmploymentType, type Job, type JobStatus } from '@/types'
import { toast } from '@/components/ui/toast'

type JobFormProps = {
    mode: 'create' | 'edit'
    job?: Job | null
}

type JobFormState = {
    title: string
    roleId: string
    department: string
    employmentType: EmploymentType
    employmentMode: EmploymentMode
    location: {
        city: string
        country: string
    }
    salary: {
        min: number
        max: number
        currency: string
    }
    experience: string
    requirement: string
    status: JobStatus
}

export function JobForm({ mode, job }: JobFormProps) {
    const { roles, departments, currentCompany, createJob, updateJob } = useApp()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [roleQuery, setRoleQuery] = useState('')
    const [form, setForm] = useState<JobFormState>({
        title: job?.title || '',
        roleId: job?.roleId || '',
        department: job?.departmentName || job?.department || '',
        employmentType: job?.employmentType ?? EMPLOYMENT_TYPES[1],
        employmentMode: job?.employmentMode ?? EMPLOYMENT_MODES[0],
        location: {
            city: job?.location?.city || '',
            country: job?.location?.country || ''
        },
        salary: job?.salary || { min: 0, max: 0, currency: currentCompany?.currency || 'USD' },
        experience: job?.experience || '',
        requirement: job?.requirement || '',
        status: job?.status ?? JOB_STATUSES[0]
    })

    useEffect(() => {
        if (job) {
            setForm({
                title: job.title,
                roleId: job.roleId || '',
                department: job.departmentName || job.department || '',
                employmentType: job.employmentType ?? EMPLOYMENT_TYPES[1],
                employmentMode: job.employmentMode ?? EMPLOYMENT_MODES[0],
                location: {
                    city: job.location?.city || '',
                    country: job.location?.country || ''
                },
                salary: job.salary || { min: 0, max: 0, currency: currentCompany?.currency || 'USD' },
                experience: job.experience,
                requirement: job.requirement || '',
                status: job.status
            })
        }
    }, [job, currentCompany?.currency])

    const filteredRoles = useMemo(() => {
        const query = roleQuery.trim().toLowerCase()
        if (!query) return roles
        return roles.filter((role) => role.title.toLowerCase().includes(query))
    }, [roles, roleQuery])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.title || !form.roleId || !form.department || !form.employmentType || !form.employmentMode || !form.salary.min || !form.salary.max || !form.experience) {
            toast('Please fill in all required fields', 'error')
            return
        }

        setLoading(true)
        try {
            if (mode === 'create') {
                await createJob(form)
                toast('Job created successfully', 'success')
            } else if (job) {
                await updateJob(job.id, form)
                toast('Job updated successfully', 'success')
            }
            router.push('/jobs')
        } catch (error) {
            toast('Failed to save job', 'error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="border border-slate-100 shadow-premium rounded-3xl bg-white">
                <CardContent className="p-6 space-y-4">
                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-slate-700 px-1">Job Title *</Label>
                        <Input
                            placeholder="e.g. Senior Software Engineer"
                            className="rounded-xl border-slate-200 h-12"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-slate-700 px-1">Role</Label>
                        <Select
                            value={form.roleId || 'none'}
                            onValueChange={(value) => setForm({ ...form, roleId: value === 'none' ? '' : value })}
                        >
                            <SelectTrigger className="rounded-xl border-slate-200 h-12">
                                <SelectValue placeholder="Select Role" />
                            </SelectTrigger>
                            <SelectContent>
                                <div className="p-2 sticky top-0 bg-white z-10 border-b border-slate-100">
                                    <Input
                                        value={roleQuery}
                                        onChange={(e) => setRoleQuery(e.target.value)}
                                        placeholder="Search roles..."
                                        className="h-9 rounded-lg"
                                        onKeyDown={(e) => e.stopPropagation()}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                                <SelectItem value="none">None</SelectItem>
                                {filteredRoles.map((role) => (
                                    <SelectItem key={role.id} value={role.id}>
                                        {role.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-slate-700 px-1">
                            Department
                            {form.department && (
                                <span className="ml-2 text-xs font-normal text-slate-400">
                                    (ID: {departments.find(d => d.name === form.department)?.id || 'N/A'})
                                </span>
                            )}
                        </Label>
                        {departments.length > 0 ? (
                            <Select
                                value={form.department || 'none'}
                                onValueChange={(value) => setForm({ ...form, department: value === 'none' ? '' : value })}
                            >
                                <SelectTrigger className="rounded-xl border-slate-200 h-12">
                                    <SelectValue placeholder="Select Department" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {departments.map((dept) => (
                                        <SelectItem key={dept.id} value={dept.name}>
                                            {dept.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <div className="text-sm p-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-500">
                                No departments found.
                            </div>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-slate-700 px-1">Employment Type</Label>
                    <Select
                        value={form.employmentType}
                        onValueChange={(value) => setForm({ ...form, employmentType: value as EmploymentType })}
                    >
                        <SelectTrigger className="rounded-xl border-slate-200 h-12">
                            <SelectValue placeholder="Select employment type" />
                        </SelectTrigger>
                        <SelectContent>
                            {EMPLOYMENT_TYPES.map((type) => (
                                <SelectItem key={type} value={type}>
                                    {type}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-slate-700 px-1">Employment Mode</Label>
                        <Select
                            value={form.employmentMode}
                            onValueChange={(value) => setForm({ ...form, employmentMode: value as EmploymentMode })}
                        >
                            <SelectTrigger className="rounded-xl border-slate-200 h-12">
                                <SelectValue placeholder="Select employment mode" />
                            </SelectTrigger>
                            <SelectContent>
                                {EMPLOYMENT_MODES.map((modeOption) => (
                                    <SelectItem key={modeOption} value={modeOption}>
                                        {modeOption}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-slate-700 px-1">City</Label>
                            <Input
                                placeholder="e.g. Dubai"
                                className="rounded-xl border-slate-200 h-12"
                                value={form.location.city}
                                onChange={(e) => setForm({
                                    ...form,
                                    location: { ...form.location, city: e.target.value }
                                })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-slate-700 px-1">Country</Label>
                            <Input
                                placeholder="e.g. UAE"
                                className="rounded-xl border-slate-200 h-12"
                                value={form.location.country}
                                onChange={(e) => setForm({
                                    ...form,
                                    location: { ...form.location, country: e.target.value }
                                })}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-slate-700 px-1">Min Salary</Label>
                            <Input
                                type="number"
                                placeholder="50000"
                                className="rounded-xl border-slate-200 h-12"
                                value={form.salary.min || ''}
                                onChange={(e) => setForm({
                                    ...form,
                                    salary: { ...form.salary, min: parseInt(e.target.value) || 0 }
                                })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-slate-700 px-1">Max Salary</Label>
                            <Input
                                type="number"
                                placeholder="80000"
                                className="rounded-xl border-slate-200 h-12"
                                value={form.salary.max || ''}
                                onChange={(e) => setForm({
                                    ...form,
                                    salary: { ...form.salary, max: parseInt(e.target.value) || 0 }
                                })}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-slate-700 px-1">Experience Required</Label>
                        <Input
                            placeholder="e.g. 3-5 years"
                            className="rounded-xl border-slate-200 h-12"
                            value={form.experience}
                            onChange={(e) => setForm({ ...form, experience: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-slate-700 px-1">Requirements</Label>
                        <QuillEditor
                            value={form.requirement}
                            onChange={(value) => setForm({ ...form, requirement: value })}
                            placeholder="Describe the role requirements..."
                            className="bg-white"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-bold text-slate-700 px-1">Status</Label>
                    <Select
                        value={form.status}
                        onValueChange={(value) => setForm({ ...form, status: value as JobStatus })}
                    >
                        <SelectTrigger className="rounded-xl border-slate-200 h-12">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {JOB_STATUSES.map((status) => (
                                <SelectItem key={status} value={status}>
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
                <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl border-slate-200"
                    onClick={() => router.push('/jobs')}
                    disabled={loading}
                >
                    Cancel
                </Button>
                <Button type="submit" className="rounded-xl bg-blue-600 text-white" disabled={loading}>
                    {loading ? 'Saving...' : mode === 'create' ? 'Create Job' : 'Save Changes'}
                </Button>
            </div>
        </form>
    )
}
