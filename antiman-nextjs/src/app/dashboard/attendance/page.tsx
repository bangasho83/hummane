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
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                            <CalendarIcon className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                                Attendance
                            </h1>
                            <p className="text-slate-500 font-medium">
                                Track daily presence and manage employee leaves.
                            </p>
                        </div>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-slate-900 text-white font-bold rounded-xl px-6 h-12 shadow-lg hover:bg-slate-800 transition-all">
                                <Plus className="w-5 h-5 mr-2" />
                                Register Leave
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-white rounded-3xl p-0 overflow-hidden border-none shadow-2xl max-w-md">
                            <DialogHeader className="p-8 pb-4 bg-slate-50 border-b border-slate-100">
                                <DialogTitle className="text-xl font-black text-slate-900">Register Leave</DialogTitle>
                            </DialogHeader>
                            <div className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <Label>Employee</Label>
                                    <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                                        <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-200">
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
                                    <Label>Date</Label>
                                    <Input
                                        type="date"
                                        className="h-12 rounded-xl bg-slate-50 border-slate-200"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Type</Label>
                                    <Select value={selectedType} onValueChange={setSelectedType}>
                                        <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-200">
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
                            </div>
                            <DialogFooter className="p-8 pt-4 bg-slate-50 border-t border-slate-100">
                                <Button
                                    className="w-full h-12 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800"
                                    onClick={handleAddLeave}
                                    disabled={loading}
                                >
                                    {loading ? 'Registering...' : 'Confirm Leave'}
                                </Button>
                            </DialogFooter>
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
                                        <TableCell colSpan={dates.length + 1} className="text-center py-20 text-slate-500">
                                            No employees found. Add employees to start tracking attendance.
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
                </div>
            </div>
        </DashboardShell>
    )
}
