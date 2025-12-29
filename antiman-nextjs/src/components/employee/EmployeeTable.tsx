'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, Search, Filter } from 'lucide-react'
import type { Employee } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useApp } from '@/lib/context/AppContext'
import { toast } from '@/components/ui/toast'

import { Badge } from '@/components/ui/badge'

interface EmployeeTableProps {
    employees: Employee[]
}

export function EmployeeTable({ employees }: EmployeeTableProps) {
    const router = useRouter()
    const { deleteEmployee } = useApp()
    const [searchTerm, setSearchTerm] = useState('')
    const [departmentFilter, setDepartmentFilter] = useState<string>('all')
    const [positionFilter, setPositionFilter] = useState<string>('all')

    // Get unique departments and positions
    const departments = useMemo(() => {
        const unique = [...new Set(employees.map(emp => emp.department))]
        return unique.sort()
    }, [employees])

    const positions = useMemo(() => {
        const unique = [...new Set(employees.map(emp => emp.position))]
        return unique.sort()
    }, [employees])

    // Filter employees
    const filteredEmployees = useMemo(() => {
        return employees.filter(emp => {
            const matchesSearch =
                emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                emp.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
                emp.department.toLowerCase().includes(searchTerm.toLowerCase())

            const matchesDepartment = departmentFilter === 'all' || emp.department === departmentFilter
            const matchesPosition = positionFilter === 'all' || emp.position === positionFilter

            return matchesSearch && matchesDepartment && matchesPosition
        })
    }, [employees, searchTerm, departmentFilter, positionFilter])

    const handleDelete = (employee: Employee) => {
        if (confirm(`Are you sure you want to delete ${employee.name}? This action cannot be undone.`)) {
            deleteEmployee(employee.id)
            toast('Employee deleted successfully', 'success')
        }
    }

    const clearFilters = () => {
        setSearchTerm('')
        setDepartmentFilter('all')
        setPositionFilter('all')
    }

    const hasActiveFilters = searchTerm || departmentFilter !== 'all' || positionFilter !== 'all'

    return (
        <div className="space-y-0">
            {/* Table Header / Filters */}
            <div className="p-8 pb-4">
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex-1 min-w-[300px]">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            <Input
                                placeholder="Search employees by name, role, email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-11 bg-slate-50 border-slate-100 h-12 rounded-2xl focus-visible:ring-blue-500/20"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                            <SelectTrigger className="w-[180px] bg-slate-50 border-slate-100 h-12 rounded-2xl">
                                <SelectValue placeholder="Department" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Departments</SelectItem>
                                {departments.map(dept => (
                                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={positionFilter} onValueChange={setPositionFilter}>
                            <SelectTrigger className="w-[180px] bg-slate-50 border-slate-100 h-12 rounded-2xl">
                                <SelectValue placeholder="Position" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Positions</SelectItem>
                                {positions.map(pos => (
                                    <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {hasActiveFilters && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearFilters}
                                className="text-slate-500 hover:text-red-500 font-bold"
                            >
                                Reset
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow className="hover:bg-transparent border-slate-100">
                            <TableHead className="w-[300px] pl-8 py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Employee</TableHead>
                            <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Position</TableHead>
                            <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Department</TableHead>
                            <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Start Date</TableHead>
                            <TableHead className="text-right py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Salary</TableHead>
                            <TableHead className="text-right pr-8 py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredEmployees.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-20">
                                    <div className="flex flex-col items-center gap-2 max-w-xs mx-auto">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-2">
                                            <Search className="w-8 h-8 text-slate-200" />
                                        </div>
                                        <h4 className="font-bold text-slate-900">No results found</h4>
                                        <p className="text-sm text-slate-500">
                                            We couldn't find any employees matching your current filters or search terms.
                                        </p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={clearFilters}
                                            className="mt-4 rounded-xl"
                                        >
                                            Clear all filters
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredEmployees.map((employee) => (
                                <TableRow key={employee.id} className="hover:bg-slate-50/50 group border-slate-50">
                                    <TableCell className="pl-8 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-100 to-slate-200 flex items-center justify-center text-slate-600 font-bold group-hover:from-blue-100 group-hover:to-blue-50 group-hover:text-blue-600 transition-all duration-300">
                                                {employee.name?.[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">{employee.name}</p>
                                                <p className="text-xs text-slate-400 font-medium">{employee.email}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm font-semibold text-slate-600">{employee.position}</span>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="success" className="bg-blue-50 text-blue-600 border-none px-3 py-1">
                                            {employee.department}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm font-medium text-slate-500">{formatDate(employee.startDate)}</span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className="font-extrabold text-slate-900">{formatCurrency(employee.salary)}</span>
                                    </TableCell>
                                    <TableCell className="text-right pr-8">
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-9 w-9 bg-white shadow-sm border border-slate-100 rounded-xl hover:text-blue-600"
                                                onClick={() => router.push(`/dashboard/employees/edit/${employee.id}`)}
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-9 w-9 bg-white shadow-sm border border-slate-100 rounded-xl hover:text-red-600 hover:bg-red-50"
                                                onClick={() => handleDelete(employee)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="p-8 border-t border-slate-50 bg-slate-50/30 flex justify-between items-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Showing {filteredEmployees.length} of {employees.length} employees
                </p>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled className="h-9 rounded-xl px-4 opacity-50">Previous</Button>
                    <Button variant="outline" size="sm" disabled className="h-9 rounded-xl px-4 opacity-50">Next</Button>
                </div>
            </div>
        </div>
    )
}
