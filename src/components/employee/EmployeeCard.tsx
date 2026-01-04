'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, Mail, Briefcase, Building2, Calendar, DollarSign } from 'lucide-react'
import type { Employee } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useApp } from '@/lib/context/AppContext'
import { toast } from '@/components/ui/toast'

interface EmployeeCardProps {
    employee: Employee
    onEdit: (employee: Employee) => void
}

export function EmployeeCard({ employee, onEdit }: EmployeeCardProps) {
    const { deleteEmployee, currentCompany } = useApp()

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this employee? This action cannot be undone.')) {
            deleteEmployee(employee.id)
            toast('Employee deleted successfully', 'success')
        }
    }

    return (
        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="flex-1">
                    <h3 className="text-xl font-semibold text-slate-900">{employee.name}</h3>
                    <p className="text-sm font-medium text-blue-600">{employee.position}</p>
                    <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                        <Mail className="w-3 h-3" />
                        {employee.email}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onEdit(employee)}
                    >
                        <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={handleDelete}
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Building2 className="w-3 h-3" />
                            Department
                        </div>
                        <div className="text-sm font-medium text-slate-900">{employee.department}</div>
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Calendar className="w-3 h-3" />
                            Start Date
                        </div>
                        <div className="text-sm font-medium text-slate-900">{formatDate(employee.startDate)}</div>
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <DollarSign className="w-3 h-3" />
                            Salary
                        </div>
                        <div className="text-sm font-medium text-slate-900">{formatCurrency(employee.salary, currentCompany?.currency)}</div>
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Briefcase className="w-3 h-3" />
                            Employee ID
                        </div>
                        <div className="text-sm font-medium text-slate-900">#{employee.id.slice(-6).toUpperCase()}</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
