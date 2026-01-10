'use client'

import { useEffect, useState } from 'react'
import { Calendar as CalendarIcon, Plus, Check, FileText } from 'lucide-react'
import { useApp } from '@/lib/context/AppContext'
import type { LeaveRecord } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { AttendanceTabs } from '@/features/attendance'
import { uploadFileToStorage } from '@/lib/firebase/storage'

export default function AttendancePage() {
    const { employees, leaves, addLeave, leaveTypes, refreshLeaveTypes } = useApp()
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
        const todayStr = current.toISOString().split('T')[0]
        setStartDate(todayStr)
        setEndDate(todayStr)
    }, [])

    useEffect(() => {
        const emp = employees.find(e => e.id === selectedEmployee)
        const filteredLeaveTypes = emp
            ? leaveTypes.filter(lt => lt.employmentType === emp.employmentType)
            : []
        if (filteredLeaveTypes.length > 0) {
            setSelectedType(filteredLeaveTypes[0].id)
        } else {
            setSelectedType('')
        }
    }, [leaveTypes, selectedEmployee, employees])

    useEffect(() => {
        if (!isDialogOpen) return
        void refreshLeaveTypes()
    }, [isDialogOpen, refreshLeaveTypes])

    const formatDate = (date: Date) => {
        return date.toISOString().split('T')[0]
    }

    const isWeekend = (date: Date) => {
        const day = date.getDay()
        return day === 0 || day === 6
    }

    const getAttendanceStatus = (employeeId: string, date: Date) => {
        const dateStr = formatDate(date)
        const leave = leaves.find(l => l.employeeId === employeeId && l.date.split('T')[0] === dateStr)

        if (leave) {
            const hasDocument = Boolean(leave.documents?.files?.length)
            return { type: 'leave', label: 'L', color: 'bg-red-100 text-red-600', hasDocument }
        }
        if (isWeekend(date)) return { type: 'weekend', label: '-', color: 'bg-slate-50 text-slate-300' }
        return { type: 'present', label: 'P', color: 'text-green-600 bg-green-50' }
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
        const leaveEntries: { date: string; amount: number }[] = []

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
            const days: string[] = []
            const cursor = new Date(start)
            while (cursor <= end) {
                days.push(cursor.toISOString().split('T')[0])
                cursor.setDate(cursor.getDate() + 1)
            }
            requestedUnits = days.length
            days.forEach(d => leaveEntries.push({ date: d, amount: 1 }))
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
            leaveEntries.push({ date: startDate, amount: diffHours })
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
            for (const entry of leaveEntries) {
                await addLeave({
                    employeeId: selectedEmployee,
                    date: entry.date,
                    type: leaveType ? leaveType.name : selectedType || 'Personal',
                    leaveTypeId: leaveType?.id,
                    unit,
                    amount: entry.amount,
                    note: trimmedNote,
                    attachments,
                    documents
                } as any)
            }
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
                                                <div className="font-bold text-slate-900 text-sm truncate max-w-[150px]">{emp.name}</div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase truncate max-w-[150px]">{emp.department}</div>
                                            </TableCell>
                                            {dates.map((date, i) => {
                                                const status = getAttendanceStatus(emp.id, date)
                                                return (
                                                    <TableCell key={i} className="p-0 border-l border-slate-50 text-center">
                                                        <div className={cn(
                                                            "w-full h-12 flex items-center justify-center font-bold text-xs transition-colors",
                                                            status.color
                                                        )}>
                                                            {status.type === 'leave' && (
                                                                <div className="flex flex-col items-center leading-none">
                                                                    <span>L</span>
                                                                    {status.hasDocument && (
                                                                        <FileText className="w-3 h-3 mt-0.5 text-red-500" />
                                                                    )}
                                                                </div>
                                                            )}
                                                            {status.type === 'present' && <Check className="w-3.5 h-3.5 opacity-50" />}
                                                            {status.type === 'weekend' && '-'}
                                                        </div>
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
