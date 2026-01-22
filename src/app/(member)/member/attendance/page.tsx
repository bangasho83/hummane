'use client'

import { useEffect, useState } from 'react'
import { Calendar as CalendarIcon, Check } from 'lucide-react'
import { useApp } from '@/lib/context/AppContext'
import type { LeaveRecord } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { cn } from '@/lib/utils'

const DEFAULT_LEAVE_COLOR = '#ec4899'

export default function MemberAttendancePage() {
    const { employees, leaves, leaveTypes, meProfile, isHydrating } = useApp()
    const [today, setToday] = useState<Date | null>(null)
    const [dates, setDates] = useState<Date[]>([])

    const isDataLoading = isHydrating || (!meProfile && employees.length === 0)

    // Build the date range on the client to avoid SSR/client drift
    useEffect(() => {
        const current = new Date()
        const range: Date[] = []
        for (let i = -15; i <= 15; i++) {
            const date = new Date(current)
            date.setDate(current.getDate() + i)
            range.push(date)
        }
        setToday(current)
        setDates(range)
    }, [])

    const formatDate = (date: Date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    // Normalize date string to YYYY-MM-DD format
    const normalizeDate = (value: string) => {
        if (!value) return ''
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
        const date = new Date(value)
        return formatDate(date)
    }

    const isWeekend = (date: Date) => {
        const day = date.getDay()
        return day === 0 || day === 6
    }

    // Find all leaves for a specific employee on a specific date
    const getLeavesForDate = (employeeId: string, date: Date): LeaveRecord[] => {
        const dateStr = formatDate(date)
        return leaves.filter((l) => {
            if (l.employeeId !== employeeId) return false
            if (l.leaveDays && l.leaveDays.length > 0) {
                return l.leaveDays.some(day => normalizeDate(day.date) === dateStr)
            }
            if (l.startDate && l.endDate) {
                const start = normalizeDate(l.startDate)
                const end = normalizeDate(l.endDate)
                return dateStr >= start && dateStr <= end
            }
            return normalizeDate(l.date) === dateStr
        })
    }

    const getAttendanceStatus = (employeeId: string, date: Date) => {
        const leavesOnDate = getLeavesForDate(employeeId, date)

        if (leavesOnDate.length > 0) {
            const firstLeave = leavesOnDate[0]
            const leaveType = leaveTypes.find(lt => lt.id === firstLeave.leaveTypeId)
            const leaveColor = leaveType?.color || DEFAULT_LEAVE_COLOR
            return {
                type: 'leave',
                label: 'L',
                color: '',
                leaveColor,
                leave: firstLeave,
                leaveType,
                allLeaves: leavesOnDate,
                leaveCount: leavesOnDate.length
            }
        }
        if (isWeekend(date)) return { type: 'weekend', label: '-', color: 'bg-slate-50 text-slate-300', leaveColor: undefined, leave: undefined, leaveType: undefined, allLeaves: [], leaveCount: 0 }
        return { type: 'present', label: 'P', color: 'text-green-600 bg-green-50', leaveColor: undefined, leave: undefined, leaveType: undefined, allLeaves: [], leaveCount: 0 }
    }

    if (isDataLoading || !today || dates.length === 0) {
        return (
            <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">
                <Card className="border-none shadow-premium bg-white rounded-3xl">
                    <CardContent className="p-12 text-center text-slate-500 font-medium">
                        Loading attendance view...
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        Team Attendance
                    </h1>
                    <p className="text-slate-500 font-medium">
                        View your team&apos;s attendance and who is on leave.
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-premium border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="hover:bg-transparent border-slate-100">
                                <TableHead className="sticky left-0 bg-slate-50 z-20 w-48 pl-8 py-4 font-extrabold uppercase tracking-widest text-[10px] text-slate-400 border-r border-slate-100 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)]">
                                    Employee
                                </TableHead>
                                {dates.map((date, i) => {
                                    const isToday = formatDate(date) === formatDate(today)
                                    return (
                                        <TableHead
                                            key={i}
                                            className={cn(
                                                "w-12 h-12 text-center p-0 font-bold border-l border-slate-50",
                                                isToday ? "bg-blue-50 text-blue-600" : "text-slate-400"
                                            )}
                                        >
                                            <div className="flex flex-col items-center justify-center h-full text-[10px]">
                                                <span className="uppercase opacity-50">{date.toLocaleDateString('en-US', { weekday: 'narrow' })}</span>
                                                <span className="text-xs">{date.getDate()}</span>
                                            </div>
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {employees.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={dates.length + 1} className="border-0">
                                        <div className="p-20 flex flex-col items-center justify-center text-center">
                                            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
                                                <CalendarIcon className="w-10 h-10 text-slate-200" />
                                            </div>
                                            <h2 className="text-2xl font-bold text-slate-900 mb-2">
                                                No Team Members
                                            </h2>
                                            <p className="text-slate-500 font-medium max-w-sm">
                                                No employees to display.
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                employees.map((emp) => (
                                    <TableRow key={emp.id} className="hover:bg-slate-50/30 border-slate-50">
                                        <TableCell className="sticky left-0 bg-white z-10 w-48 pl-8 py-4 border-r border-slate-100 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)]">
                                            <div>
                                                <div className="font-bold text-slate-900 text-sm truncate max-w-[150px]">{emp.name}</div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase truncate max-w-[150px]">{emp.department}</div>
                                            </div>
                                        </TableCell>
                                        {dates.map((date, i) => {
                                            const status = getAttendanceStatus(emp.id, date)
                                            return (
                                                <TableCell key={i} className="p-0 border-l border-slate-50 text-center">
                                                    {status.type === 'leave' ? (
                                                        <HoverCard openDelay={100} closeDelay={100}>
                                                            <HoverCardTrigger asChild>
                                                                <div
                                                                    className="w-full h-12 flex items-center justify-center font-bold text-xs transition-colors cursor-pointer hover:opacity-80 relative"
                                                                    style={{
                                                                        backgroundColor: `${status.leaveColor}20`,
                                                                        color: status.leaveColor
                                                                    }}
                                                                >
                                                                    {status.leaveCount > 1 && (
                                                                        <>
                                                                            <div
                                                                                className="absolute inset-1 rounded-sm opacity-40"
                                                                                style={{ backgroundColor: status.leaveColor, transform: 'translate(2px, 2px)' }}
                                                                            />
                                                                            <div
                                                                                className="absolute inset-1 rounded-sm opacity-20"
                                                                                style={{ backgroundColor: status.leaveColor, transform: 'translate(4px, 4px)' }}
                                                                            />
                                                                        </>
                                                                    )}
                                                                    <div className="flex flex-col items-center leading-none relative z-10">
                                                                        <span>{status.leaveCount > 1 ? 'L+' : 'L'}</span>
                                                                    </div>
                                                                </div>
                                                            </HoverCardTrigger>
                                                            <HoverCardContent
                                                                className="w-auto p-0 border-0 shadow-2xl rounded-2xl overflow-hidden"
                                                                sideOffset={8}
                                                                align="center"
                                                            >
                                                                <div className="bg-white px-4 py-3 min-w-[200px] max-w-[280px]">
                                                                    {status.leaveCount > 1 && (
                                                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                                                            {status.leaveCount} Leaves on this day
                                                                        </div>
                                                                    )}
                                                                    {status.allLeaves.map((leave, idx) => {
                                                                        const lt = leaveTypes.find(t => t.id === leave.leaveTypeId)
                                                                        const color = lt?.color || DEFAULT_LEAVE_COLOR
                                                                        return (
                                                                            <div
                                                                                key={leave.id}
                                                                                className={cn(
                                                                                    "py-2",
                                                                                    idx > 0 && "border-t border-slate-100 mt-2"
                                                                                )}
                                                                            >
                                                                                <div className="flex items-center gap-2">
                                                                                    <div
                                                                                        className="w-2 h-2 rounded-full shrink-0"
                                                                                        style={{ backgroundColor: color }}
                                                                                    />
                                                                                    <div
                                                                                        className="font-bold text-sm"
                                                                                        style={{ color }}
                                                                                    >
                                                                                        {lt?.name || leave.type || 'Leave'}
                                                                                    </div>
                                                                                </div>
                                                                                {leave.startDate && leave.endDate && leave.startDate !== leave.endDate ? (
                                                                                    <div className="text-slate-500 text-xs mt-1 pl-4">
                                                                                        📅 {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="text-slate-500 text-xs mt-1 pl-4">
                                                                                        📅 {leave.date ? new Date(leave.date).toLocaleDateString() : ''}
                                                                                    </div>
                                                                                )}
                                                                                {leave.unit && leave.amount && (
                                                                                    <div className="text-slate-500 text-xs mt-0.5 pl-4">
                                                                                        ⏱️ {leave.amount} {leave.unit}{leave.amount > 1 ? 's' : ''}
                                                                                    </div>
                                                                                )}
                                                                                {leave.note && (
                                                                                    <div className="text-slate-400 text-xs mt-1 pl-4 truncate">
                                                                                        💬 {leave.note}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        )
                                                                    })}
                                                                </div>
                                                            </HoverCardContent>
                                                        </HoverCard>
                                                    ) : (
                                                        <div
                                                            className={cn(
                                                                "w-full h-12 flex items-center justify-center font-bold text-xs transition-colors",
                                                                status.color
                                                            )}
                                                        >
                                                            {status.type === 'present' && <Check className="w-3.5 h-3.5 opacity-50" />}
                                                            {status.type === 'weekend' && '-'}
                                                        </div>
                                                    )}
                                                </TableCell>
                                            )
                                        })}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
                <div className="p-8 border-t border-slate-50 bg-slate-50/30">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        {employees.length} {employees.length === 1 ? 'Employee' : 'Employees'} Tracked
                    </p>
                </div>
            </div>
        </div>
    )
}
