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

interface EmployeeFormProps {
    employee?: Employee | null
    onSubmit: (data: {
        name: string
        email: string
        position: string
        department: string
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
    const { departments } = useApp()
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        position: '',
        department: '',
        startDate: '',
        salary: ''
    })

    useEffect(() => {
        if (employee) {
            setFormData({
                name: employee.name,
                email: employee.email,
                position: employee.position,
                department: employee.department,
                startDate: employee.startDate,
                salary: employee.salary.toString()
            })
        } else {
            setFormData({
                name: '',
                email: '',
                position: '',
                department: '',
                startDate: '',
                salary: ''
            })
        }
    }, [employee])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const employeeData = {
            name: formData.name,
            email: formData.email,
            position: formData.position,
            department: formData.department,
            startDate: formData.startDate,
            salary: parseFloat(formData.salary)
        }

        await onSubmit(employeeData)
    }

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
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
                />
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
                />
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
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    {departments.length > 0 ? (
                        <Select
                            value={formData.department}
                            onValueChange={(value) => handleChange('department', value)}
                        >
                            <SelectTrigger id="department" className="rounded-xl border-slate-200">
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
                    ) : (
                        <div className="text-sm p-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-500">
                            No departments found. <Link href="/dashboard/departments" className="text-blue-600 font-bold hover:underline">Create one</Link> first.
                        </div>
                    )}
                </div>
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
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="salary">Annual Salary</Label>
                    <Input
                        id="salary"
                        type="number"
                        placeholder="80000"
                        step="1000"
                        value={formData.salary}
                        onChange={(e) => handleChange('salary', e.target.value)}
                        required
                    />
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
