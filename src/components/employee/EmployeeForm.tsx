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
    onSubmit: (data: {
        name: string
        email: string
        position: string
        department: string
        roleId?: string
        startDate: string
        salary: number
    }) => Promise<void>
    onCancel: () => void
    submitLabel?: string
    loading?: boolean
}

export function EmployeeForm({
    employee,
    onSubmit,
    onCancel,
    submitLabel = 'Save Employee',
    loading = false
}: EmployeeFormProps) {
    const { departments, roles } = useApp()
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        position: '',
        department: '',
        roleId: '',
        startDate: '',
        salary: ''
    })
    const [errors, setErrors] = useState<Record<string, string>>({})

    useEffect(() => {
        if (employee) {
            setFormData({
                name: employee.name,
                email: employee.email,
                position: employee.position,
                department: employee.department,
                roleId: employee.roleId || '',
                startDate: employee.startDate,
                salary: employee.salary.toString()
            })
        } else {
            setFormData({
                name: '',
                email: '',
                position: '',
                department: '',
                roleId: '',
                startDate: '',
                salary: ''
            })
        }
        setErrors({})
    }, [employee])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrors({})

        try {
            const employeeData = {
                name: formData.name,
                email: formData.email,
                position: formData.position,
                department: formData.department,
                roleId: formData.roleId || undefined,
                startDate: formData.startDate,
                salary: parseFloat(formData.salary)
            }

            // Validate with Zod schema
            const validated = employeeSchema.parse(employeeData)
            await onSubmit(validated)
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

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="position">Position</Label>
                    <Input
                        id="position"
                        placeholder="Software Engineer"
                        value={formData.position}
                        onChange={(e) => handleChange('position', e.target.value)}
                        required
                        className={errors.position ? 'border-red-500' : ''}
                    />
                    {errors.position && (
                        <p className="text-xs text-red-600 mt-1">{errors.position}</p>
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
                        {formData.roleId && formData.roleId !== "none" && roles.find(r => r.id === formData.roleId) && (
                            <p className="text-xs text-slate-500 mt-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <span className="font-bold">JD:</span> {roles.find(r => r.id === formData.roleId)?.description}
                            </p>
                        )}
                    </>
                ) : (
                    <div className="text-sm p-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-500">
                        No roles defined. <Link href="/dashboard/team/roles" className="text-blue-600 font-bold hover:underline">Create one</Link> to assign job descriptions.
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
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
                    <Label htmlFor="salary">Annual Salary</Label>
                    <Input
                        id="salary"
                        type="number"
                        placeholder="80000"
                        step="1000"
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
