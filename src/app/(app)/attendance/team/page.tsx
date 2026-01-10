'use client'

import { useMemo, useState } from 'react'
import { AttendanceTabs } from '@/features/attendance'
import { useApp } from '@/lib/context/AppContext'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function AttendanceTeamPage() {
    const { employees, leaveTypes, leaves } = useApp()
    const [searchTerm, setSearchTerm] = useState('')
    const [departmentFilter, setDepartmentFilter] = useState<string>('all')
    const [positionFilter, setPositionFilter] = useState<string>('all')

    const leaveTypesOrdered = useMemo(
        () => [...leaveTypes].sort((a, b) => a.name.localeCompare(b.name)),
        [leaveTypes]
    )

    const departments = useMemo(() => {
        const unique = [...new Set(employees.map(emp => emp.department))]
        return unique.sort()
    }, [employees])

    const positions = useMemo(() => {
        const unique = [...new Set(employees.map(emp => emp.position))]
        return unique.sort()
    }, [employees])

    const filteredEmployees = useMemo(() => {
        return employees.filter(emp => {
            const matchesSearch =
                emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                emp.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
                emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                emp.department.toLowerCase().includes(searchTerm.toLowerCase())

            const matchesDepartment = departmentFilter === 'all' || emp.department === departmentFilter
            const matchesPosition = positionFilter === 'all' || emp.position === positionFilter

            return matchesSearch && matchesDepartment && matchesPosition
        })
    }, [employees, searchTerm, departmentFilter, positionFilter])

    const clearFilters = () => {
        setSearchTerm('')
        setDepartmentFilter('all')
        setPositionFilter('all')
    }

    const getCount = (employeeId: string, leaveTypeId: string, leaveTypeName: string) => {
        return leaves
            .filter(l => l.employeeId === employeeId && (l.leaveTypeId === leaveTypeId || l.type === leaveTypeName))
            .reduce((sum, l) => sum + (l.amount ?? 1), 0)
    }

    return (
        <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">
            <div className="flex justify-between items-end mb-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        Team Leave Totals
                    </h1>
                    <p className="text-slate-500 font-medium">
                        See leave consumption per team member by leave type.
                    </p>
                </div>
            </div>

            <AttendanceTabs />

            <Card className="border-none shadow-premium rounded-3xl bg-white overflow-hidden">
                <CardContent className="p-0">
                    <div className="p-8 border-b border-slate-100">
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex-1 min-w-[280px]">
                                <div className="relative">
                                    <Input
                                        placeholder="Search team..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-4 h-11 rounded-xl bg-slate-50 border-slate-200"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-3 flex-wrap">
                                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                                    <SelectTrigger className="w-[180px] bg-slate-50 border-slate-200 h-11 rounded-xl">
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
                                    <SelectTrigger className="w-[180px] bg-slate-50 border-slate-200 h-11 rounded-xl">
                                        <SelectValue placeholder="Position" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Positions</SelectItem>
                                        {positions.map(pos => (
                                            <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {(searchTerm || departmentFilter !== 'all' || positionFilter !== 'all') && (
                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        className="text-sm font-semibold text-slate-500 hover:text-red-500"
                                    >
                                        Reset
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow className="hover:bg-transparent border-slate-100">
                                    <TableHead className="w-64 pl-8 py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                                        Employee
                                    </TableHead>
                                    {leaveTypesOrdered.map((lt) => (
                                        <TableHead key={lt.id} className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <span>{lt.code}</span>
                                                <span className="text-[9px] font-semibold tracking-normal text-slate-300">
                                                    Quota {lt.quota ?? 0}
                                                </span>
                                            </div>
                                        </TableHead>
                                    ))}
                                    <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 text-center pr-8">
                                        Total
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredEmployees.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={leaveTypesOrdered.length + 2} className="p-12 text-center text-slate-500">
                                            {employees.length === 0 ? 'No employees yet.' : 'No matches for the selected filters.'}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredEmployees.map((emp) => {
                                        const total = leaveTypesOrdered.reduce((sum, lt) => {
                                            if (lt.employmentType !== emp.employmentType) return sum
                                            const count = getCount(emp.id, lt.id, lt.name)
                                            if (!Number.isInteger(count) || count <= 0) return sum
                                            return sum + count
                                        }, 0)
                                                return (
                                            <TableRow key={emp.id} className="hover:bg-slate-50/50 border-slate-50">
                                                <TableCell className="pl-8 py-4">
                                                    <div className="font-bold text-slate-900">{emp.name}</div>
                                                    <div className="text-[11px] text-slate-500 font-medium">
                                                        {emp.department}
                                                    </div>
                                                </TableCell>
                                                {leaveTypesOrdered.map((lt) => {
                                                    const count = getCount(emp.id, lt.id, lt.name)
                                                    const matchesEmployment = lt.employmentType === emp.employmentType
                                                    const quotaLimit = lt.quota ?? 0
                                                    const isOverQuota = matchesEmployment && count > quotaLimit
                                                            return (
                                                        <TableCell
                                                            key={lt.id}
                                                            className={cn(
                                                                "text-center text-sm font-semibold",
                                                                matchesEmployment ? "text-slate-600" : "text-slate-400",
                                                                isOverQuota ? "text-red-600" : ""
                                                            )}
                                                        >
                                                            {matchesEmployment ? (count || 0) : '—'}
                                                        </TableCell>
    )
                                                    })}
                                                    <TableCell className="text-center pr-8">
                                                        <span className={cn("text-sm font-bold", total > 0 ? "text-slate-900" : "text-slate-400")}>
                                                            {total}
                                                        </span>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
)
}
