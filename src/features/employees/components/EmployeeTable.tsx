'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, Search, Users } from 'lucide-react'
import type { Employee } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { useApp } from '@/lib/context/AppContext'
import { toast } from '@/components/ui/toast'

import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface EmployeeTableProps {
    employees: Employee[]
    onRefresh?: () => void
}

export function EmployeeTable({ employees, onRefresh }: EmployeeTableProps) {
    const router = useRouter()
    const { deleteEmployee, currentCompany } = useApp()
    const [searchTerm, setSearchTerm] = useState('')
    const [departmentFilter, setDepartmentFilter] = useState<string>('all')
    const [positionFilter, setPositionFilter] = useState<string>('all')

    // Get unique departments and positions
    const departments = useMemo(() => {
        const unique = [
            ...new Set(employees.map(emp => emp.departmentName || emp.department || '').filter(Boolean))
        ]
        return unique.sort()
    }, [employees])

    const positions = useMemo(() => {
        const unique = [
            ...new Set(employees.map(emp => emp.roleName || emp.position || '').filter(Boolean))
        ]
        return unique.sort()
    }, [employees])

    // Filter employees
    const filteredEmployees = useMemo(() => {
        return employees.filter(emp => {
            const departmentName = emp.departmentName || emp.department || ''
            const roleName = emp.roleName || emp.position || ''
            const matchesSearch =
                emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                roleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                departmentName.toLowerCase().includes(searchTerm.toLowerCase())

            const matchesDepartment = departmentFilter === 'all' || departmentName === departmentFilter
            const matchesPosition = positionFilter === 'all' || roleName === positionFilter

            return matchesSearch && matchesDepartment && matchesPosition
        })
    }, [employees, searchTerm, departmentFilter, positionFilter])

    const handleDelete = async (employee: Employee) => {
        if (confirm(`Are you sure you want to delete ${employee.name}? This action cannot be undone.`)) {
            try {
                await deleteEmployee(employee.id)
                toast('Employee deleted successfully', 'success')
                onRefresh?.()
            } catch {
                toast('Failed to delete employee', 'error')
            }
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
            {/* Search and Filters */}
            <div className="p-8 border-b border-slate-100">
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex-1 min-w-[300px]">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            <Input
                                placeholder="Search employees..."
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
                            <SelectValue placeholder="Role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Roles</SelectItem>
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
                            <TableHead className="pl-8 py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Employee ID</TableHead>
                            <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Employee</TableHead>
                            <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Role</TableHead>
                            <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Department</TableHead>
                            <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Manager</TableHead>
                            <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Employment</TableHead>
                            <TableHead className="text-right py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Monthly Salary</TableHead>
                            <TableHead className="text-right pr-8 py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredEmployees.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="border-0">
                                    <div className="p-20 flex flex-col items-center justify-center text-center">
                                        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
                                            <Users className="w-10 h-10 text-slate-200" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-slate-900 mb-2">
                                            {searchTerm || hasActiveFilters ? 'No results found' : 'No Employees Yet'}
                                        </h2>
                                        <p className="text-slate-500 font-medium max-w-sm">
                                            {searchTerm || hasActiveFilters
                                                ? `We couldn't find any employees matching your search criteria.`
                                                : 'Add your first employee to start building your team.'}
                                        </p>
                                        {hasActiveFilters && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={clearFilters}
                                                className="mt-4 rounded-xl"
                                            >
                                                Clear all filters
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredEmployees.map((employee) => (
                                <TableRow key={employee.id} className="hover:bg-slate-50/50 group border-slate-50">
                                    <TableCell className="pl-8 py-5">
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{employee.employeeId}</span>
                                    </TableCell>
                                    <TableCell>
                                        <Link href={`/team/${employee.id}`} className="group">
                                            <p className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors">{employee.name}</p>
                                            <p className="text-xs text-slate-400 font-medium">{employee.email}</p>
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm font-medium text-slate-500">{employee.roleName || employee.position || '—'}</span>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-none px-4 py-1.5 rounded-full font-bold">
                                            {employee.departmentName || employee.department || '—'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm font-medium text-slate-500">{employee.reportingManagerName || employee.reportingManager || '—'}</span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-xs font-bold text-slate-600">{employee.employmentType}</span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className="font-bold text-slate-900">{formatCurrency(employee.salary, currentCompany?.currency)}</span>
                                    </TableCell>
                                    <TableCell className="text-right pr-8">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-10 w-10 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                onClick={() => router.push(`/team/edit/${employee.id}`)}
                                            >
                                                <Pencil className="w-5 h-5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-10 w-10 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                                onClick={() => handleDelete(employee)}
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="p-8 border-t border-slate-50 bg-slate-50/30">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    {filteredEmployees.length} {filteredEmployees.length === 1 ? 'Employee' : 'Employees'} {searchTerm || hasActiveFilters ? 'Found' : 'Managed'}
                </p>
            </div>
        </div>
    )
}
