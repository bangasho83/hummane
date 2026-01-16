'use client'

import { useEffect, useState } from 'react'
import { Calendar as CalendarIcon, Plus, Check } from 'lucide-react'
import Link from 'next/link'
import { useApp } from '@/lib/context/AppContext'
import type { LeaveRecord } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { AttendanceTabs } from '@/features/attendance'
import { uploadFileToStorage } from '@/lib/firebase/storage'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://hummane-api.vercel.app'
const DEFAULT_LEAVE_COLOR = '#ec4899'

export default function AttendancePage() {
    const { employees, leaves, addLeave, leaveTypes, refreshLeaveTypes, apiAccessToken } = useApp()
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedEmployee, setSelectedEmployee] = useState('')
    const [selectedType, setSelectedType] = useState<string>('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [startTime, setStartTime] = useState('09:00')
    const [endTime, setEndTime] = useState('18:00')
    const [note, setNote] = useState('')
    const [attachment, setAttachment] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [today, setToday] = useState<Date | null>(null)
    const [dates, setDates] = useState<Date[]>([])
    const [apiDebug, setApiDebug] = useState<{ curl: string; response: string } | null>(null)

    // Fetch leaves and capture API debug info
    useEffect(() => {
        const fetchDebug = async () => {
            if (!apiAccessToken) return
            const url = `${API_BASE_URL}/leaves`
            const curlCmd = `curl -X GET "${url}" \\\n  -H "Authorization: Bearer ${apiAccessToken}"`
            try {
                const res = await fetch(url, {
                    method: 'GET',
                    headers: { Authorization: `Bearer ${apiAccessToken}` }
                })
                const data = await res.json()
                setApiDebug({ curl: curlCmd, response: JSON.stringify(data, null, 2) })
            } catch (err) {
                setApiDebug({ curl: curlCmd, response: String(err) })
            }
        }
        fetchDebug()
    }, [apiAccessToken, leaves])

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
        const todayStr = formatDate(current)
        setStartDate(todayStr)
        setEndDate(todayStr)
    }, [])

    useEffect(() => {
        const emp = employees.find(e => e.id === selectedEmployee)
        const filteredLeaveTypes = emp
            ? leaveTypes.filter(lt => lt.employmentType === emp.employmentType)
            : []
        // Only auto-select if there's no current selection or the current selection is invalid
        const isCurrentSelectionValid = selectedType && filteredLeaveTypes.some(lt => lt.id === selectedType)
        if (!isCurrentSelectionValid) {
            if (filteredLeaveTypes.length > 0) {
                setSelectedType(filteredLeaveTypes[0].id)
            } else {
                setSelectedType('')
            }
        }
    }, [leaveTypes, selectedEmployee, employees, selectedType])

    useEffect(() => {
        if (!isDialogOpen) return
        void refreshLeaveTypes()
    }, [isDialogOpen, refreshLeaveTypes])

    const formatDate = (date: Date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    // Normalize date string to YYYY-MM-DD format, handling timezone offset
    const normalizeDate = (value: string) => {
        if (!value) return ''
        // If it's already in YYYY-MM-DD format, return as is
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
        // Parse the date and format it in local timezone
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
            // Check leaveDays array first
            if (l.leaveDays && l.leaveDays.length > 0) {
                return l.leaveDays.some(day => normalizeDate(day.date) === dateStr)
            }
            // Check date range if startDate and endDate exist
            if (l.startDate && l.endDate) {
                const start = normalizeDate(l.startDate)
                const end = normalizeDate(l.endDate)
                return dateStr >= start && dateStr <= end
            }
            // Fall back to single date
            return normalizeDate(l.date) === dateStr
        })
    }

    const getAttendanceStatus = (employeeId: string, date: Date) => {
        const leavesOnDate = getLeavesForDate(employeeId, date)

        if (leavesOnDate.length > 0) {
            const firstLeave = leavesOnDate[0]
            const hasDocument = leavesOnDate.some(l => Boolean(l.documents?.files?.length))
            // Find the leave type to get its color
            const leaveType = leaveTypes.find(lt => lt.id === firstLeave.leaveTypeId)
            const leaveColor = leaveType?.color || DEFAULT_LEAVE_COLOR
            return {
                type: 'leave',
                label: 'L',
                color: '',
                leaveColor,
                hasDocument,
                leave: firstLeave,
                leaveType,
                allLeaves: leavesOnDate,
                leaveCount: leavesOnDate.length
            }
        }
        if (isWeekend(date)) return { type: 'weekend', label: '-', color: 'bg-slate-50 text-slate-300', leaveColor: undefined, hasDocument: false, leave: undefined, leaveType: undefined, allLeaves: [], leaveCount: 0 }
        return { type: 'present', label: 'P', color: 'text-green-600 bg-green-50', leaveColor: undefined, hasDocument: false, leave: undefined, leaveType: undefined, allLeaves: [], leaveCount: 0 }
    }

    const handleAddLeave = async () => {
        if (!selectedEmployee) {
            toast('Please select an employee', 'error')
            return
        }
        const trimmedNote = note.trim()
        if (!trimmedNote) {
            toast('Please add a note for this leave', 'error')
            return
        }

        const leaveType = leaveTypes.find(lt => lt.id === selectedType)
        const unit = leaveType?.unit || 'Day'

        let requestedUnits = 1
        let payloadStartDate = startDate
        let payloadEndDate = endDate

        if (unit === 'Day') {
            if (!startDate || !endDate) {
                toast('Please select both start and end dates', 'error')
                return
            }
            const start = new Date(startDate)
            const end = new Date(endDate)
            if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
                toast('Invalid date range', 'error')
                return
            }
            payloadStartDate = startDate
            payloadEndDate = endDate
        } else {
            if (!startDate || !startTime || !endTime) {
                toast('Please select date and time range', 'error')
                return
            }
            const start = new Date(`${startDate}T${startTime}`)
            const end = new Date(`${startDate}T${endTime}`)
            if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
                toast('Invalid time range', 'error')
                return
            }
            const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
            requestedUnits = diffHours
            payloadStartDate = startDate
            payloadEndDate = startDate
        }

        // Allow leave registration even if quota is exceeded or zero.

        const buildPayload = async () => {
            if (!attachment) {
                return { attachments: undefined, documents: undefined }
            }
            const url = await uploadFileToStorage(attachment, 'leaves', selectedEmployee || 'leave')
            return {
                attachments: [
                    {
                        name: attachment.name,
                        type: attachment.type,
                        dataUrl: url
                    }
                ] as LeaveRecord['attachments'],
                documents: {
                    files: [url]
                }
            }
        }

        setLoading(true)
        try {
            const { attachments, documents } = await buildPayload()
            await addLeave({
                employeeId: selectedEmployee,
                date: payloadStartDate,
                startDate: payloadStartDate,
                endDate: payloadEndDate,
                type: leaveType ? leaveType.name : selectedType || 'Personal',
                leaveTypeId: leaveType?.id,
                unit,
                amount: unit === 'Hour' ? requestedUnits : 1,
                note: trimmedNote,
                attachments,
                documents
            })
            toast('Leave registered successfully', 'success')
            setIsDialogOpen(false)
            setSelectedEmployee('')
            setSelectedType('')
            setStartDate('')
            setEndDate('')
            setStartTime('09:00')
            setEndTime('18:00')
            setNote('')
            setAttachment(null)
        } catch (error) {
            toast('Failed to register leave', 'error')
        } finally {
            setLoading(false)
        }
    }

    if (!today || dates.length === 0) {
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

    const leaveTypesForEmployee = (empId: string) => {
        const emp = employees.find(e => e.id === empId)
        return emp ? leaveTypes.filter(lt => lt.employmentType === emp.employmentType) : []
    }

    const filteredLeaveTypes = leaveTypesForEmployee(selectedEmployee)
    return (
        <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">
            <div className="flex justify-between items-end mb-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        Attendance
                    </h1>
                    <p className="text-slate-500 font-medium">
                        Track daily presence and manage employee leaves.
                    </p>
                </div>
            </div>

            <AttendanceTabs />

            <div className="flex justify-between items-end mb-6">
                <div />

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 px-6 py-6 h-auto">
                            <Plus className="w-5 h-5 mr-2" />
                            Register Leave
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md rounded-3xl bg-white border-slate-200">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold text-slate-900">Register Leave</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={(e) => { e.preventDefault(); handleAddLeave(); }} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 px-1">Employee</label>
                                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                                    <SelectTrigger className="h-12 rounded-xl border-slate-200">
                                        <SelectValue placeholder="Select Employee" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {employees.map(emp => (
                                            <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 px-1">Leave Type</label>
                                <Select value={selectedType} onValueChange={setSelectedType} disabled={!selectedEmployee}>
                                    <SelectTrigger className="h-12 rounded-xl border-slate-200">
                                        <SelectValue placeholder="Select Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filteredLeaveTypes.length === 0 ? (
                                            <SelectItem value="none" disabled>
                                                No leave type defined for this employment type
                                            </SelectItem>
                                        ) : (
                                            filteredLeaveTypes.map((lt) => (
                                                <SelectItem key={lt.id} value={lt.id}>
                                                    {lt.name} ({lt.code}) — {lt.unit} • {lt.employmentType}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                                {selectedType && leaveTypes.find(lt => lt.id === selectedType) && (
                                    <p className="text-xs text-slate-500 px-1">
                                        Unit: {leaveTypes.find(lt => lt.id === selectedType)?.unit} • Quota: {leaveTypes.find(lt => lt.id === selectedType)?.quota}
                                    </p>
                                )}
                            </div>
                            {(() => {
                                const lt = leaveTypes.find(lt => lt.id === selectedType)
                                const unit = lt?.unit || 'Day'
                                if (unit === 'Hour') {
                                            return (
                                        <div className="space-y-3">
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-slate-700 px-1">Date</label>
                                                <Input
                                                    type="date"
                                                    className="h-12 rounded-xl border-slate-200"
                                                    value={startDate}
                                                    onChange={(e) => { setStartDate(e.target.value); setEndDate(e.target.value) }}
                                                    required
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-bold text-slate-700 px-1">From Time</label>
                                                    <Input
                                                        type="time"
                                                        className="h-12 rounded-xl border-slate-200"
                                                        value={startTime}
                                                        onChange={(e) => setStartTime(e.target.value)}
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-bold text-slate-700 px-1">To Time</label>
                                                    <Input
                                                        type="time"
                                                        className="h-12 rounded-xl border-slate-200"
                                                        value={endTime}
                                                        onChange={(e) => setEndTime(e.target.value)}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>
    )
                                    }
                                    return (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-slate-700 px-1">From Date</label>
                                                <Input
                                                    type="date"
                                                    className="h-12 rounded-xl border-slate-200"
                                                    value={startDate}
                                                    onChange={(e) => setStartDate(e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-slate-700 px-1">To Date</label>
                                                <Input
                                                    type="date"
                                                    className="h-12 rounded-xl border-slate-200"
                                                    value={endDate}
                                                    onChange={(e) => setEndDate(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    )
                                })()}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 px-1">Note</label>
                                    <Input
                                        placeholder="Add a quick note for this leave"
                                        className="h-12 rounded-xl border-slate-200"
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 px-1">Attachment (Optional)</label>
                                    <Input
                                        type="file"
                                        className="h-12 rounded-xl border-slate-200"
                                        onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                                    />
                                    {attachment && (
                                        <p className="text-xs text-slate-500 px-1">Selected: {attachment.name}</p>
                                    )}
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl font-bold border-slate-200 h-12 px-6">
                                        Cancel
                                    </Button>
                                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold h-12 px-6" disabled={loading}>
                                        {loading ? 'Registering...' : 'Register Leave'}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
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
                                                    No Employees Yet
                                                </h2>
                                                <p className="text-slate-500 font-medium max-w-sm">
                                                    Add employees to start tracking attendance and managing leaves.
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    employees.map((emp) => (
                                        <TableRow key={emp.id} className="hover:bg-slate-50/30 border-slate-50">
                                            <TableCell className="sticky left-0 bg-white z-10 w-48 pl-8 py-4 border-r border-slate-100 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)]">
                                                <Link href={`/team/${emp.id}/attendance`} className="block group">
                                                    <div className="font-bold text-slate-900 text-sm truncate max-w-[150px] group-hover:text-blue-600 transition-colors">{emp.name}</div>
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase truncate max-w-[150px]">{emp.department}</div>
                                                </Link>
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
                                                                        {/* Show stacked effect for multiple leaves */}
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

                {/* API Debug Section */}
                {apiDebug && (
                    <div className="mt-8 bg-slate-900 rounded-2xl overflow-hidden shadow-xl">
                        <div className="p-4 border-b border-slate-700">
                            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">API Debug</h3>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">cURL Command</p>
                                <pre className="bg-slate-800 p-4 rounded-xl text-xs text-green-400 overflow-x-auto whitespace-pre-wrap break-all">
                                    {apiDebug.curl}
                                </pre>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">API Response</p>
                                <pre className="bg-slate-800 p-4 rounded-xl text-xs text-blue-300 overflow-x-auto max-h-96 overflow-y-auto">
                                    {apiDebug.response}
                                </pre>
                            </div>
                        </div>
                    </div>
                )}

            </div>
)
}
