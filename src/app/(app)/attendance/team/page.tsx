'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { AttendanceTabs } from '@/features/attendance'
import { useApp } from '@/lib/context/AppContext'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar as CalendarIcon, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

type SortField = 'name' | 'total' | string
type SortDirection = 'asc' | 'desc'

export default function AttendanceTeamPage() {
    const { employees, leaveTypes, leaves } = useApp()
    const [searchTerm, setSearchTerm] = useState('')
    const [departmentFilter, setDepartmentFilter] = useState<string>('all')
    const [positionFilter, setPositionFilter] = useState<string>('all')
    const [leaveTypeFilter, setLeaveTypeFilter] = useState<string>('all')

    // Sorting state
    const [sortField, setSortField] = useState<SortField>('name')
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

    // Date range state - default to start of year to today
    const today = new Date()
    const startOfYear = new Date(today.getFullYear(), 0, 1)
    const [startDate, setStartDate] = useState(startOfYear.toISOString().split('T')[0])
    const [endDate, setEndDate] = useState(today.toISOString().split('T')[0])

    // Filter leaves by date range
    const filteredLeaves = useMemo(() => {
        if (!startDate || !endDate) return leaves
        const start = new Date(startDate)
        start.setHours(0, 0, 0, 0)
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)

        return leaves.filter(leave => {
            const leaveDate = new Date(leave.startDate || leave.date)
            return leaveDate >= start && leaveDate <= end
        })
    }, [leaves, startDate, endDate])

    const leaveTypesOrdered = useMemo(
        () => [...leaveTypes].sort((a, b) => a.name.localeCompare(b.name)),
        [leaveTypes]
    )

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

    const clearFilters = () => {
        setSearchTerm('')
        setDepartmentFilter('all')
        setPositionFilter('all')
        setLeaveTypeFilter('all')
    }

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDirection('asc')
        }
    }

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />
        return sortDirection === 'asc'
            ? <ArrowUp className="w-3 h-3 ml-1" />
            : <ArrowDown className="w-3 h-3 ml-1" />
    }

    const normalizeCount = (value: number) => {
        const rounded = Math.round(value * 100) / 100
        const nearestInt = Math.round(rounded)
        if (Math.abs(rounded - nearestInt) <= 0.01) {
            return nearestInt
        }
        return rounded
    }

    const formatCount = (value: number) => {
        const normalized = normalizeCount(value)
        if (Number.isInteger(normalized)) return `${normalized}`
        return normalized.toFixed(2)
    }

    const getLeaveAmount = (leave: { amount?: number | string; unit?: string; leaveDays?: { amount?: number | string; countsTowardQuota?: boolean | string }[] }) => {
        if (leave.leaveDays && leave.leaveDays.length > 0) {
            const total = leave.leaveDays.reduce((sum, day) => {
                const countsTowardQuota = day.countsTowardQuota
                // Skip days that explicitly don't count toward quota
                if (countsTowardQuota === false || countsTowardQuota === 'false') {
                    return sum
                }
                // If day has an amount property, use it; otherwise count as 1 day
                const dayAmount = day.amount !== undefined ? Number(day.amount) : 1
                if (!Number.isFinite(dayAmount)) {
                    return sum + 1 // Count as 1 if amount is invalid
                }
                return sum + dayAmount
            }, 0)
            const normalized = normalizeCount(total)
            // Fallback to leave.amount if leaveDays total is 0
            const fallbackAmount = Number(leave.amount)
            if (normalized <= 0 && Number.isFinite(fallbackAmount) && fallbackAmount > 0) {
                return normalizeCount(fallbackAmount)
            }
            return normalized
        }
        // No leaveDays - use leave.amount or default to 1
        const amount = Number(leave.amount)
        return normalizeCount(Number.isFinite(amount) && amount > 0 ? amount : 1)
    }

    const normalizeId = (value: string | undefined) => (value || '').trim().toLowerCase()

    const getCount = (employeeId: string, employeeCode: string, leaveTypeId: string, leaveTypeName: string) => {
        const employeeKey = normalizeId(employeeId)
        const employeeCodeKey = normalizeId(employeeCode)
        const leaveTypeKey = normalizeId(leaveTypeId)
        return filteredLeaves
            .filter(l => {
                const leaveEmployeeId = normalizeId(l.employeeId)
                if (leaveEmployeeId !== employeeKey && leaveEmployeeId !== employeeCodeKey) return false
                const leaveType = normalizeId(l.leaveTypeId)
                if (leaveType) {
                    return leaveType === leaveTypeKey
                }
                return normalizeId(l.type) === normalizeId(leaveTypeName)
            })
            .reduce((sum, l) => sum + getLeaveAmount(l), 0)
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
                            {/* Date Range Picker */}
                            <div className="flex items-center gap-2">
                                <CalendarIcon className="w-4 h-4 text-slate-400" />
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="h-11 rounded-xl bg-slate-50 border-slate-200 w-40"
                                />
                                <span className="text-slate-400">to</span>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="h-11 rounded-xl bg-slate-50 border-slate-200 w-40"
                                />
                            </div>

                            <div className="flex-1 min-w-[200px]">
                                <Input
                                    placeholder="Search team..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-4 h-11 rounded-xl bg-slate-50 border-slate-200"
                                />
                            </div>
                            <div className="flex items-center gap-3 flex-wrap">
                                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                                    <SelectTrigger className="w-44 bg-slate-50 border-slate-200 h-11 rounded-xl">
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
                                    <SelectTrigger className="w-44 bg-slate-50 border-slate-200 h-11 rounded-xl">
                                        <SelectValue placeholder="Position" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Positions</SelectItem>
                                        {positions.map(pos => (
                                            <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={leaveTypeFilter} onValueChange={setLeaveTypeFilter}>
                                    <SelectTrigger className="w-44 bg-slate-50 border-slate-200 h-11 rounded-xl">
                                        <SelectValue placeholder="Leave Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Leave Types</SelectItem>
                                        {leaveTypesOrdered.map(lt => (
                                            <SelectItem key={lt.id} value={lt.id}>{lt.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {(searchTerm || departmentFilter !== 'all' || positionFilter !== 'all' || leaveTypeFilter !== 'all') && (
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
                            <TableHeader className="bg-slate-50">
                                <TableRow className="hover:bg-transparent border-slate-100">
                                    <TableHead
                                        className="sticky left-0 bg-slate-50 z-20 w-48 min-w-48 pl-8 py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 cursor-pointer hover:text-slate-600"
                                        onClick={() => handleSort('name')}
                                    >
                                        <div className="flex items-center">
                                            Employee
                                            <SortIcon field="name" />
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="sticky left-48 bg-slate-50 z-20 w-16 min-w-16 py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 text-center cursor-pointer hover:text-slate-600 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]"
                                        onClick={() => handleSort('total')}
                                    >
                                        <div className="flex items-center justify-center">
                                            Total
                                            <SortIcon field="total" />
                                        </div>
                                    </TableHead>
                                    {(leaveTypeFilter === 'all' ? leaveTypesOrdered : leaveTypesOrdered.filter(lt => lt.id === leaveTypeFilter)).map((lt) => (
                                        <TableHead
                                            key={lt.id}
                                            className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 text-center cursor-pointer hover:text-slate-600"
                                            onClick={() => handleSort(lt.id)}
                                        >
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="flex items-center">
                                                    <span>{lt.code}</span>
                                                    <SortIcon field={lt.id} />
                                                </div>
                                                <span className="text-[9px] font-semibold tracking-normal text-slate-300">
                                                    Quota {lt.quota ?? 0}
                                                </span>
                                            </div>
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredEmployees.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={(leaveTypeFilter === 'all' ? leaveTypesOrdered.length : 1) + 2} className="p-12 text-center text-slate-500">
                                            {employees.length === 0 ? 'No employees yet.' : 'No matches for the selected filters.'}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    [...filteredEmployees]
                                        .map((emp) => {
                                            const total = leaveTypesOrdered.reduce((sum, lt) => {
                                                if (lt.employmentType !== emp.employmentType) return sum
                                                const count = getCount(emp.id, emp.employeeId, lt.id, lt.name)
                                                if (count <= 0) return sum
                                                return sum + count
                                            }, 0)
                                            const leaveCountsMap: Record<string, number> = {}
                                            leaveTypesOrdered.forEach(lt => {
                                                leaveCountsMap[lt.id] = getCount(emp.id, emp.employeeId, lt.id, lt.name)
                                            })
                                            return { emp, total, leaveCountsMap }
                                        })
                                        .sort((a, b) => {
                                            let comparison = 0
                                            if (sortField === 'name') {
                                                comparison = a.emp.name.localeCompare(b.emp.name)
                                            } else if (sortField === 'total') {
                                                comparison = a.total - b.total
                                            } else {
                                                // Sort by specific leave type
                                                comparison = (a.leaveCountsMap[sortField] || 0) - (b.leaveCountsMap[sortField] || 0)
                                            }
                                            return sortDirection === 'asc' ? comparison : -comparison
                                        })
                                        .map(({ emp, total, leaveCountsMap }) => {
                                            const displayLeaveTypes = leaveTypeFilter === 'all'
                                                ? leaveTypesOrdered
                                                : leaveTypesOrdered.filter(lt => lt.id === leaveTypeFilter)
                                            return (
                                                <TableRow key={emp.id} className="hover:bg-slate-50/50 border-slate-50">
                                                    <TableCell className="sticky left-0 bg-white z-10 w-48 min-w-48 pl-8 py-4">
                                                        <Link href={`/team/${emp.id}/attendance`} className="block group">
                                                            <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate max-w-40">{emp.name}</div>
                                                            <div className="text-[11px] text-slate-500 font-medium truncate max-w-40">
                                                                {emp.department}
                                                            </div>
                                                        </Link>
                                                    </TableCell>
                                                    <TableCell className="sticky left-48 bg-white z-10 w-16 min-w-16 text-center shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">
                                                        <span className={cn("text-sm font-bold", total > 0 ? "text-slate-900" : "text-slate-400")}>
                                                            {formatCount(total)}
                                                        </span>
                                                    </TableCell>
                                                    {displayLeaveTypes.map((lt) => {
                                                        const count = leaveCountsMap[lt.id] || 0
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
                                                                {matchesEmployment ? formatCount(count) : '—'}
                                                            </TableCell>
                                                        )
                                                    })}
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
