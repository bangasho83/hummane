'use client'

import { useState } from 'react'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Calendar as CalendarIcon, Plus, Check, X } from 'lucide-react'
import { useApp } from '@/lib/context/AppContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

export default function AttendancePage() {
    const { employees, leaves, addLeave } = useApp()
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedEmployee, setSelectedEmployee] = useState('')
    const [selectedDate, setSelectedDate] = useState('')
    const [selectedType, setSelectedType] = useState('Personal')
    const [loading, setLoading] = useState(false)

    // Generate dates: 15 days before -> Today -> 15 days after
    const today = new Date()
    const dates: Date[] = []
    for (let i = -15; i <= 15; i++) {
        const date = new Date(today)
        date.setDate(today.getDate() + i)
        dates.push(date)
    }

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

        if (leave) return { type: 'leave', label: 'L', color: 'bg-red-100 text-red-600' }
        if (isWeekend(date)) return { type: 'weekend', label: '-', color: 'bg-slate-50 text-slate-300' }
        return { type: 'present', label: 'P', color: 'text-green-600 bg-green-50' }
    }

    const handleAddLeave = async () => {
        if (!selectedEmployee || !selectedDate) {
            toast('Please select an employee and a date', 'error')
            return
        }

        setLoading(true)
        try {
            await addLeave({
                employeeId: selectedEmployee,
                date: selectedDate,
                type: selectedType as any
            })
            toast('Leave registered successfully', 'success')
            setIsDialogOpen(false)
            setSelectedEmployee('')
            setSelectedDate('')
        } catch (error) {
            toast('Failed to register leave', 'error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <DashboardShell>
            <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                            Attendance
                        </h1>
                        <p className="text-slate-500 font-medium">
                            Track daily presence and manage employee leaves.
                        </p>
                    </div>

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
                                    <label className="text-sm font-bold text-slate-700 px-1">Date</label>
                                    <Input
                                        type="date"
                                        className="h-12 rounded-xl border-slate-200"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 px-1">Leave Type</label>
                                    <Select value={selectedType} onValueChange={setSelectedType}>
                                        <SelectTrigger className="h-12 rounded-xl border-slate-200">
                                            <SelectValue placeholder="Select Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Personal">Personal Leave</SelectItem>
                                            <SelectItem value="Sick">Sick Leave</SelectItem>
                                            <SelectItem value="Vacation">Vacation</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
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
                                                            {status.type === 'leave' && 'L'}
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
        </DashboardShell>
    )
}
