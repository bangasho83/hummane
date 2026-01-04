'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import type { Employee } from '@/types'
import { useApp } from '@/lib/context/AppContext'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import Link from 'next/link'
import { employeeSchema } from '@/lib/validation/schemas'
import { z } from 'zod'

interface EmployeeFormProps {
    employee?: Employee | null
    onSubmit: (data: Omit<Employee, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>) => Promise<void>
    onCancel: () => void
    submitLabel?: string
    loading?: boolean
    onRoleChange?: (roleId: string) => void
}

export function EmployeeForm({
    employee,
    onSubmit,
    onCancel,
    submitLabel = 'Save Employee',
    loading = false,
    onRoleChange
}: EmployeeFormProps) {
    const { departments, roles, employees } = useApp()
    const [formData, setFormData] = useState({
        employeeId: '',
        name: '',
        email: '',
        department: '',
        roleId: '',
        startDate: '',
        employmentType: 'Permanent',
        reportingManager: 'self',
        gender: 'Male',
        salary: ''
    })
    const [errors, setErrors] = useState<Record<string, string>>({})

    useEffect(() => {
        if (employee) {
            setFormData({
                employeeId: employee.employeeId,
                name: employee.name,
                email: employee.email,
                department: employee.department,
                roleId: employee.roleId || '',
                startDate: employee.startDate,
                employmentType: employee.employmentType,
                reportingManager: employees.find(e => e.name === employee.reportingManager)?.id || 'self',
                gender: employee.gender,
                salary: employee.salary.toString()
            })
        } else {
            setFormData({
                employeeId: '',
                name: '',
                email: '',
                department: '',
                roleId: '',
                startDate: '',
                employmentType: 'Permanent',
                reportingManager: 'self',
                gender: 'Male',
                salary: ''
            })
        }
        setErrors({})
    }, [employee, employees])

    useEffect(() => {
        if (onRoleChange) {
            onRoleChange(formData.roleId || '')
        }
    }, [formData.roleId, onRoleChange])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrors({})

        try {
            const managerName = formData.reportingManager === 'self'
                ? formData.name
                : employees.find(emp => emp.id === formData.reportingManager)?.name || formData.name
            const employeeData = {
                employeeId: formData.employeeId,
                name: formData.name,
                email: formData.email,
                position: employee?.position || '',
                department: formData.department,
                roleId: formData.roleId || undefined,
                startDate: formData.startDate,
                employmentType: formData.employmentType as Employee['employmentType'],
                reportingManager: managerName,
                gender: formData.gender as Employee['gender'],
                salary: parseFloat(formData.salary)
            }

            // Validate with Zod schema
            const validated = employeeSchema.parse(employeeData)
            await onSubmit({
                ...validated,
                position: validated.position || ''
            })
        } catch (error) {
            if (error instanceof z.ZodError) {
                const fieldErrors: Record<string, string> = {}
                error.issues.forEach((err) => {
                    const path = err.path.join('.')
                    fieldErrors[path] = err.message
                })
                setErrors(fieldErrors)
            } else {
                console.error('Form submission error:', error)
            }
        }
    }

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        // Clear error for this field when user starts typing
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev }
                delete newErrors[field]
                return newErrors
            })
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="employeeId">Employee ID</Label>
                    <Input
                        id="employeeId"
                        placeholder="EMP-00123"
                        value={formData.employeeId}
                        onChange={(e) => handleChange('employeeId', e.target.value)}
                        required
                        className={errors.employeeId ? 'border-red-500' : ''}
                    />
                    {errors.employeeId && (
                        <p className="text-xs text-red-600 mt-1">{errors.employeeId}</p>
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="employmentType">Employment Type</Label>
                    <Select
                        value={formData.employmentType}
                        onValueChange={(value) => handleChange('employmentType', value)}
                    >
                        <SelectTrigger id="employmentType" className="rounded-xl border-slate-200">
                            <SelectValue placeholder="Select employment type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Permanent">Permanent</SelectItem>
                            <SelectItem value="Probation">Probation</SelectItem>
                            <SelectItem value="Contract">Contract</SelectItem>
                            <SelectItem value="Intern">Intern</SelectItem>
                            <SelectItem value="Part-time">Part-time</SelectItem>
                        </SelectContent>
                    </Select>
                    {errors.employmentType && (
                        <p className="text-xs text-red-600 mt-1">{errors.employmentType}</p>
                    )}
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                    id="name"
                    placeholder="Jane Smith"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    required
                    className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                    <p className="text-xs text-red-600 mt-1">{errors.name}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="jane@company.com"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    required
                    className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                    <p className="text-xs text-red-600 mt-1">{errors.email}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                {departments.length > 0 ? (
                    <>
                        <Select
                            value={formData.department}
                            onValueChange={(value) => handleChange('department', value)}
                        >
                            <SelectTrigger id="department" className={`rounded-xl border-slate-200 ${errors.department ? 'border-red-500' : ''}`}>
                                <SelectValue placeholder="Select Department" />
                            </SelectTrigger>
                            <SelectContent>
                                {departments.map((dept) => (
                                    <SelectItem key={dept.id} value={dept.name}>
                                        {dept.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.department && (
                            <p className="text-xs text-red-600 mt-1">{errors.department}</p>
                        )}
                    </>
                ) : (
                    <div className="text-sm p-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-500">
                        No departments found. <Link href="/dashboard/departments" className="text-blue-600 font-bold hover:underline">Create one</Link> first.
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="role">Role / Job Description (Optional)</Label>
                {roles.length > 0 ? (
                    <>
                        <Select
                            value={formData.roleId || "none"}
                            onValueChange={(value) => handleChange('roleId', value === "none" ? "" : value)}
                        >
                            <SelectTrigger id="role" className="rounded-xl border-slate-200">
                                <SelectValue placeholder="Select Role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {roles.map((role) => (
                                    <SelectItem key={role.id} value={role.id}>
                                        {role.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </>
                ) : (
                    <div className="text-sm p-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-500">
                        No roles defined. <Link href="/dashboard/roles" className="text-blue-600 font-bold hover:underline">Create one</Link> to assign job descriptions.
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="startDate">Joining Date</Label>
                    <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => handleChange('startDate', e.target.value)}
                        required
                        className={errors.startDate ? 'border-red-500' : ''}
                    />
                    {errors.startDate && (
                        <p className="text-xs text-red-600 mt-1">{errors.startDate}</p>
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="reportingManager">Reporting Manager</Label>
                    <Select
                        value={formData.reportingManager || "self"}
                        onValueChange={(value) => handleChange('reportingManager', value)}
                    >
                        <SelectTrigger id="reportingManager" className={`rounded-xl border-slate-200 ${errors.reportingManager ? 'border-red-500' : ''}`}>
                            <SelectValue placeholder="Select Manager" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="self">Self / This employee leads</SelectItem>
                            {employees
                                .filter(emp => !employee || emp.id !== employee.id)
                                .map((emp) => (
                                    <SelectItem key={emp.id} value={emp.id}>
                                        {emp.name} ({emp.position})
                                    </SelectItem>
                                ))}
                        </SelectContent>
                    </Select>
                    {errors.reportingManager && (
                        <p className="text-xs text-red-600 mt-1">{errors.reportingManager}</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                        value={formData.gender}
                        onValueChange={(value) => handleChange('gender', value)}
                    >
                        <SelectTrigger id="gender" className="rounded-xl border-slate-200">
                            <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Non-binary">Non-binary</SelectItem>
                            <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                        </SelectContent>
                    </Select>
                    {errors.gender && (
                        <p className="text-xs text-red-600 mt-1">{errors.gender}</p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="salary">Monthly Salary</Label>
                    <Input
                        id="salary"
                        type="number"
                        placeholder="8000"
                        step="100"
                        min="0"
                        value={formData.salary}
                        onChange={(e) => handleChange('salary', e.target.value)}
                        required
                        className={errors.salary ? 'border-red-500' : ''}
                    />
                    {errors.salary && (
                        <p className="text-xs text-red-600 mt-1">{errors.salary}</p>
                    )}
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : submitLabel}
                </Button>
            </div>
        </form>
    )
}
