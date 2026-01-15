'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { EMPLOYMENT_MODES, EMPLOYMENT_TYPES, GENDER_OPTIONS, type Employee, type EmployeeApi, type EmploymentMode, type EmploymentType, type Gender } from '@/types'
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
    employee?: EmployeeApi | null
    onSubmit: (data: Omit<Employee, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>) => Promise<void>
    onCancel: () => void
    submitLabel?: string
    loading?: boolean
    onRoleChange?: (roleId: string) => void
}

type EmployeeFormState = {
    employeeId: string
    name: string
    email: string
    departmentId: string
    roleId: string
    startDate: string
    employmentType: EmploymentType
    employmentMode: EmploymentMode
    reportingManager: string
    gender: Gender
    salary: string
}

const getDefaultFormData = (): EmployeeFormState => ({
    employeeId: '',
    name: '',
    email: '',
    departmentId: '',
    roleId: '',
    startDate: '',
    employmentType: EMPLOYMENT_TYPES[1],
    employmentMode: EMPLOYMENT_MODES[0],
    reportingManager: 'self',
    gender: GENDER_OPTIONS[0],
    salary: ''
})

const toDateInputValue = (value?: string | null) => {
    if (!value) return ''
    return value.split('T')[0] || ''
}

const normalizeEnumValue = <T extends readonly string[]>(
    value: string | null | undefined,
    options: T
): T[number] | undefined => {
    if (!value) return undefined
    const trimmed = value.trim()
    if (!trimmed) return undefined
    const normalizeKey = (input: string) =>
        input
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, ' ')
            .trim()
    const normalizedValue = normalizeKey(trimmed)
    return options.find(option => normalizeKey(option) === normalizedValue)
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
    const [formData, setFormData] = useState<EmployeeFormState>(getDefaultFormData)
    const [errors, setErrors] = useState<Record<string, string>>({})
    useEffect(() => {
        if (employee) {
            const departmentIdFromName = employee.departmentName || employee.department
                ? departments.find(dept => dept.name === (employee.departmentName || employee.department))?.id
                : undefined
            const roleFromName = employee.roleName
                ? roles.find(role => role.title === employee.roleName)?.id
                : undefined

            const rawEmploymentType = employee.employmentType?.trim() || ''
            const rawEmploymentMode = employee.employmentMode?.trim() || ''
            const rawGender = employee.gender?.trim() || ''

            const normalizedEmploymentType = normalizeEnumValue(rawEmploymentType || null, EMPLOYMENT_TYPES)
            const normalizedEmploymentMode = normalizeEnumValue(rawEmploymentMode || null, EMPLOYMENT_MODES)
            const normalizedGender = normalizeEnumValue(rawGender || null, GENDER_OPTIONS)

            const employmentTypeValue = normalizedEmploymentType || rawEmploymentType || EMPLOYMENT_TYPES[1]
            const employmentModeValue = normalizedEmploymentMode || rawEmploymentMode || EMPLOYMENT_MODES[0]
            const genderValue = normalizedGender || rawGender || GENDER_OPTIONS[0]

            const managerId = employee.reportingManagerId?.trim()
            const reportingManagerFromName = employee.reportingManager
                ? employees.find(e => e.name === employee.reportingManager)?.id
                : undefined
            const reportingManagerValue = managerId && managerId !== employee.id
                ? managerId
                : reportingManagerFromName || 'self'

            setFormData({
                employeeId: employee.employeeId || '',
                name: employee.name || '',
                email: employee.email || '',
                departmentId: employee.departmentId?.trim() || departmentIdFromName?.trim() || '',
                roleId: employee.roleId?.trim() || roleFromName?.trim() || '',
                startDate: toDateInputValue(employee.startDate),
                employmentType: employmentTypeValue as EmploymentType,
                employmentMode: employmentModeValue as EmploymentMode,
                reportingManager: reportingManagerValue,
                gender: genderValue as Gender,
                salary: employee.salary != null ? employee.salary.toString() : ''
            })
        } else {
            setFormData(getDefaultFormData())
        }
        setErrors({})
    }, [employee, employees, departments, roles])

    useEffect(() => {
        if (!employee) return
        const managerId = employee.reportingManagerId?.trim()
        if (!managerId || managerId === employee.id) return
        setFormData((prev) => {
            if (prev.reportingManager === managerId) return prev
            return { ...prev, reportingManager: managerId }
        })
    }, [employee?.id, employee?.reportingManagerId, employees.length])

    useEffect(() => {
        if (!employee) return
        const rawEmploymentType = employee.employmentType?.trim() || ''
        const rawEmploymentMode = employee.employmentMode?.trim() || ''
        const rawGender = employee.gender?.trim() || ''
        const normalizedEmploymentType = normalizeEnumValue(rawEmploymentType || null, EMPLOYMENT_TYPES)
        const normalizedEmploymentMode = normalizeEnumValue(rawEmploymentMode || null, EMPLOYMENT_MODES)
        const normalizedGender = normalizeEnumValue(rawGender || null, GENDER_OPTIONS)
        const employmentTypeValue = normalizedEmploymentType || rawEmploymentType
        const employmentModeValue = normalizedEmploymentMode || rawEmploymentMode
        const genderValue = normalizedGender || rawGender

        setFormData((prev) => {
            if (!employmentTypeValue && !employmentModeValue && !genderValue) return prev
            let changed = false
            const next = { ...prev }
            if (employmentTypeValue && prev.employmentType !== employmentTypeValue) {
                next.employmentType = employmentTypeValue as EmploymentType
                changed = true
            }
            if (employmentModeValue && prev.employmentMode !== employmentModeValue) {
                next.employmentMode = employmentModeValue as EmploymentMode
                changed = true
            }
            if (genderValue && prev.gender !== genderValue) {
                next.gender = genderValue as Gender
                changed = true
            }
            return changed ? next : prev
        })
    }, [employee?.id, employee?.employmentType, employee?.employmentMode, employee?.gender])

    const managerOptions = employees.filter(emp => !employee || emp.id !== employee.id)
    const reportingManagerId = employee?.reportingManagerId?.trim()
    const reportingManagerEntry = reportingManagerId
        ? managerOptions.find(emp => emp.id === reportingManagerId)
        : undefined
    const showMissingManager = reportingManagerId
        && reportingManagerId !== employee?.id
        && !reportingManagerEntry
    const missingManagerLabel = reportingManagerId
        ? `${employee?.reportingManager?.trim() || 'Unknown'} [${reportingManagerEntry?.employeeId || 'Unknown'}] ${reportingManagerId}`
        : ''
    const normalizedEmploymentTypeValue = normalizeEnumValue(formData.employmentType as string, EMPLOYMENT_TYPES)
    const normalizedEmploymentModeValue = normalizeEnumValue(formData.employmentMode as string, EMPLOYMENT_MODES)
    const showMissingEmploymentType = Boolean(formData.employmentType && !normalizedEmploymentTypeValue)
    const showMissingEmploymentMode = Boolean(formData.employmentMode && !normalizedEmploymentModeValue)
    const normalizedGenderValue = normalizeEnumValue(formData.gender as string, GENDER_OPTIONS)
    const showMissingGender = Boolean(formData.gender && !normalizedGenderValue)

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
            const departmentName = departments.find(dept => dept.id === formData.departmentId)?.name
                || employee?.departmentName
                || employee?.department
                || ''
            const employeeData = {
                employeeId: formData.employeeId,
                name: formData.name,
                email: formData.email,
                position: employee?.position || '',
                department: departmentName,
                departmentId: formData.departmentId || undefined,
                roleId: formData.roleId,
                startDate: formData.startDate,
                employmentType: formData.employmentType,
                employmentMode: formData.employmentMode,
                reportingManager: managerName,
                gender: formData.gender,
                salary: parseFloat(formData.salary)
            }
            const reportingManagerId = formData.reportingManager === 'self' ? undefined : formData.reportingManager

            // Validate with Zod schema
            const validated = employeeSchema.parse(employeeData)
            await onSubmit({
                ...validated,
                position: validated.position || '',
                reportingManagerId
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

    const handleChange = <K extends keyof EmployeeFormState>(field: K, value: EmployeeFormState[K]) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        // Clear error for this field when user starts typing
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev }
                delete newErrors[field]
                return newErrors
            })
        }
        if (field === 'departmentId' && errors.department) {
            setErrors(prev => {
                const newErrors = { ...prev }
                delete newErrors.department
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
                        onValueChange={(value) => handleChange('employmentType', value as EmploymentType)}
                        key={formData.employmentType}
                    >
                        <SelectTrigger id="employmentType" className="rounded-xl border-slate-200">
                            <SelectValue placeholder="Select employment type" />
                        </SelectTrigger>
                        <SelectContent>
                            {showMissingEmploymentType && (
                                <SelectItem value={formData.employmentType}>
                                    {formData.employmentType}
                                </SelectItem>
                            )}
                            {EMPLOYMENT_TYPES.map((type) => (
                                <SelectItem key={type} value={type}>
                                    {type}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.employmentType && (
                        <p className="text-xs text-red-600 mt-1">{errors.employmentType}</p>
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="employmentMode">Employment Mode</Label>
                    <Select
                        value={formData.employmentMode}
                        onValueChange={(value) => handleChange('employmentMode', value as EmploymentMode)}
                        key={formData.employmentMode}
                    >
                        <SelectTrigger id="employmentMode" className="rounded-xl border-slate-200">
                            <SelectValue placeholder="Select employment mode" />
                        </SelectTrigger>
                        <SelectContent>
                            {showMissingEmploymentMode && (
                                <SelectItem value={formData.employmentMode}>
                                    {formData.employmentMode}
                                </SelectItem>
                            )}
                            {EMPLOYMENT_MODES.map((modeOption) => (
                                <SelectItem key={modeOption} value={modeOption}>
                                    {modeOption}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.employmentMode && (
                        <p className="text-xs text-red-600 mt-1">{errors.employmentMode}</p>
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
                            key={`${formData.departmentId}-${departments.length}`}
                            value={formData.departmentId}
                            onValueChange={(value) => handleChange('departmentId', value)}
                        >
                            <SelectTrigger id="department" className={`rounded-xl border-slate-200 ${errors.department ? 'border-red-500' : ''}`}>
                                <SelectValue placeholder="Select Department" />
                            </SelectTrigger>
                            <SelectContent>
                                {departments.map((dept) => (
                                    <SelectItem key={dept.id} value={dept.id}>
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
                    <>
                        <div className="text-sm p-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-500">
                            No departments found. <Link href="/departments" className="text-blue-600 font-bold hover:underline">Create one</Link> first.
                        </div>
                        {errors.department && (
                            <p className="text-xs text-red-600 mt-1">{errors.department}</p>
                        )}
                    </>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="role">Role / Job Description</Label>
                {roles.length > 0 ? (
                    <>
                        <Select
                            key={`${formData.roleId}-${roles.length}`}
                            value={formData.roleId}
                            onValueChange={(value) => handleChange('roleId', value)}
                        >
                            <SelectTrigger id="role" className={`rounded-xl border-slate-200 ${errors.roleId ? 'border-red-500' : ''}`}>
                                <SelectValue placeholder="Select Role" />
                            </SelectTrigger>
                            <SelectContent>
                                {roles.map((role) => (
                                    <SelectItem key={role.id} value={role.id}>
                                        {role.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.roleId && (
                            <p className="text-xs text-red-600 mt-1">{errors.roleId}</p>
                        )}
                    </>
                ) : (
                    <>
                        <div className="text-sm p-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-500">
                            No roles defined. <Link href="/roles" className="text-blue-600 font-bold hover:underline">Create one</Link> to assign job descriptions.
                        </div>
                        {errors.roleId && (
                            <p className="text-xs text-red-600 mt-1">{errors.roleId}</p>
                        )}
                    </>
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
                        key={`${formData.reportingManager}-${employees.length}`}
                    >
                        <SelectTrigger id="reportingManager" className={`rounded-xl border-slate-200 ${errors.reportingManager ? 'border-red-500' : ''}`}>
                            <SelectValue placeholder="Select Manager" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="self">Self / This employee leads</SelectItem>
                            {showMissingManager && (
                                <SelectItem value={reportingManagerId as string}>
                                    {missingManagerLabel}
                                </SelectItem>
                            )}
                            {managerOptions.map((emp) => (
                                <SelectItem key={emp.id} value={emp.id}>
                                    {emp.name} [{emp.employeeId}]
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
                        onValueChange={(value) => handleChange('gender', value as Gender)}
                        key={formData.gender}
                    >
                        <SelectTrigger id="gender" className="rounded-xl border-slate-200">
                            <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                            {showMissingGender && (
                                <SelectItem value={formData.gender}>
                                    {formData.gender}
                                </SelectItem>
                            )}
                            {GENDER_OPTIONS.map((gender) => (
                                <SelectItem key={gender} value={gender}>
                                    {gender}
                                </SelectItem>
                            ))}
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
                        step="1"
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
