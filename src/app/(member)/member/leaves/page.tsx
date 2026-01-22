'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useApp } from '@/lib/context/AppContext'
import type { Employee, LeaveRecord } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import { CalendarDays, FileText, Loader2, Plus } from 'lucide-react'
import { uploadFileToStorage } from '@/lib/firebase/storage'

const API_BASE_URL = 'https://api.hummane.com'

export default function MemberLeavesPage() {
    const { employees, leaveTypes, meProfile, isHydrating, addLeave, refreshLeaveTypes, apiAccessToken } = useApp()
    const [employee, setEmployee] = useState<Employee | null>(null)
    const [employeeLeaves, setEmployeeLeaves] = useState<LeaveRecord[]>([])
    const [loading, setLoading] = useState(true)

    // Leave application form state
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedType, setSelectedType] = useState<string>('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [startTime, setStartTime] = useState('09:00')
    const [endTime, setEndTime] = useState('18:00')
    const [note, setNote] = useState('')
    const [attachment, setAttachment] = useState<File | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const employeeId = meProfile?.employeeId

    // Wait for hydration AND meProfile to be loaded before looking for employee
    const isDataLoading = isHydrating || (!meProfile && employees.length === 0)

    useEffect(() => {
        if (!employeeId) {
            setEmployee(null)
            return
        }
        const emp = employees.find(e => e.id === employeeId)
        setEmployee(emp || null)
    }, [employees, employeeId])

    // Fetch leaves for this employee directly from API
    const fetchEmployeeLeaves = useCallback(async () => {
        if (!employeeId || !apiAccessToken) {
            setEmployeeLeaves([])
            setLoading(false)
            return
        }
        setLoading(true)
        try {
            const response = await fetch(`${API_BASE_URL}/leaves?employeeId=${encodeURIComponent(employeeId)}`, {
                method: 'GET',
                headers: { Authorization: `Bearer ${apiAccessToken}` },
            })
            if (!response.ok) throw new Error('Failed to fetch leaves')
            const data = await response.json()
            setEmployeeLeaves(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error('Error fetching employee leaves:', error)
            setEmployeeLeaves([])
        } finally {
            setLoading(false)
        }
    }, [employeeId, apiAccessToken])

    useEffect(() => {
        fetchEmployeeLeaves()
    }, [fetchEmployeeLeaves])

    // Filter leave types by employee's employment type
    const filteredLeaveTypes = useMemo(() => {
        if (!employee) return []
        return leaveTypes.filter(lt => lt.employmentType === employee.employmentType)
    }, [leaveTypes, employee])

    // Auto-select first leave type when dialog opens or leave types change
    useEffect(() => {
        if (!isDialogOpen) return
        void refreshLeaveTypes()
    }, [isDialogOpen, refreshLeaveTypes])

    useEffect(() => {
        const isCurrentSelectionValid = selectedType && filteredLeaveTypes.some(lt => lt.id === selectedType)
        if (!isCurrentSelectionValid && filteredLeaveTypes.length > 0) {
            setSelectedType(filteredLeaveTypes[0].id)
        }
    }, [filteredLeaveTypes, selectedType])

    // Set initial dates
    useEffect(() => {
        if (isDialogOpen && !startDate) {
            const today = new Date()
            const dateStr = today.toISOString().split('T')[0]
            setStartDate(dateStr)
            setEndDate(dateStr)
        }
    }, [isDialogOpen, startDate])

    const resetForm = () => {
        setSelectedType('')
        setStartDate('')
        setEndDate('')
        setStartTime('09:00')
        setEndTime('18:00')
        setNote('')
        setAttachment(null)
    }

    const handleApplyLeave = async () => {
        if (!employeeId) {
            toast('No employee profile linked', 'error')
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

        const buildPayload = async () => {
            if (!attachment) {
                return { attachments: undefined, documents: undefined }
            }
            const url = await uploadFileToStorage(attachment, 'leaves', employeeId)
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

        setSubmitting(true)
        try {
            const { attachments, documents } = await buildPayload()
            await addLeave({
                employeeId,
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
            toast('Leave applied successfully', 'success')
            setIsDialogOpen(false)
            resetForm()
            // Refresh the leaves list
            fetchEmployeeLeaves()
        } catch (error) {
            toast('Failed to apply leave', 'error')
        } finally {
            setSubmitting(false)
        }
    }

    if (isDataLoading || loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    if (!employeeId || !employee) {
        return (
            <div className="animate-in fade-in duration-500 slide-in-from-bottom-4 space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Leaves</h1>
                    <p className="text-slate-500">View your leave history</p>
                </div>

                <Card className="border-dashed">
                    <CardHeader className="text-center pb-4">
                        <div className="mx-auto w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mb-4">
                            <CalendarDays className="w-8 h-8 text-amber-600" />
                        </div>
                        <CardTitle className="text-xl">No Employee Profile Linked</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center text-slate-500">
                        <p>
                            Your account is not linked to an employee profile.
                            <br />
                            Please contact your administrator.
                        </p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="animate-in fade-in duration-500 slide-in-from-bottom-4 space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">My Leaves</h1>
                    <p className="text-slate-500">View your leave history and apply for new leaves</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 px-6 py-6 h-auto">
                            <Plus className="w-5 h-5 mr-2" />
                            Apply Leave
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md rounded-3xl bg-white border-slate-200">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold text-slate-900">Apply for Leave</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={(e) => { e.preventDefault(); handleApplyLeave(); }} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 px-1">Leave Type</label>
                                <Select value={selectedType} onValueChange={setSelectedType}>
                                    <SelectTrigger className="h-12 rounded-xl border-slate-200">
                                        <SelectValue placeholder="Select Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filteredLeaveTypes.length === 0 ? (
                                            <SelectItem value="none" disabled>
                                                No leave type defined for your employment type
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
                                <label className="text-sm font-bold text-slate-700 px-1">Reason / Note</label>
                                <Input
                                    placeholder="Please provide a reason for this leave"
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
                                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold h-12 px-6" disabled={submitting}>
                                    {submitting ? 'Submitting...' : 'Apply Leave'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border border-slate-100 shadow-premium rounded-3xl bg-white">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="hover:bg-transparent border-slate-100">
                                <TableHead className="pl-6 py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Date</TableHead>
                                <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Type</TableHead>
                                <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Code</TableHead>
                                <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Unit</TableHead>
                                <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Amount</TableHead>
                                <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Quota</TableHead>
                                <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Note</TableHead>
                                <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Document</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {employeeLeaves.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="p-10 text-center text-slate-500">
                                        No leaves recorded.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                employeeLeaves.map((leave) => {
                                    const lt = leaveTypes.find(t => t.id === leave.leaveTypeId)
                                    const files = leave.documents?.files || []
                                    const firstFile = files[0]
                                    return (
                                        <TableRow key={leave.id} className="border-slate-50">
                                            <TableCell className="pl-6 py-4 text-sm font-medium text-slate-700">
                                                {leave.startDate && leave.endDate && leave.startDate !== leave.endDate
                                                    ? `${formatDate(leave.startDate)} - ${formatDate(leave.endDate)}`
                                                    : formatDate(leave.startDate || leave.date)
                                                }
                                            </TableCell>
                                            <TableCell className="text-sm font-medium text-slate-700">{leave.leaveTypeName || lt?.name || '—'}</TableCell>
                                            <TableCell className="text-sm text-slate-500">{leave.leaveTypeCode || lt?.code || '—'}</TableCell>
                                            <TableCell className="text-sm text-slate-500">{leave.unit || lt?.unit || 'Day'}</TableCell>
                                            <TableCell className="text-sm text-slate-500">{leave.amount ?? 1}</TableCell>
                                            <TableCell className="text-sm text-slate-500">{leave.leaveTypeQuota ?? lt?.quota ?? '—'}</TableCell>
                                            <TableCell className="text-sm text-slate-500">{leave.note || '—'}</TableCell>
                                            <TableCell className="text-sm text-slate-500">
                                                {firstFile ? (
                                                    <a
                                                        href={firstFile}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
                                                    >
                                                        <FileText className="w-4 h-4" />
                                                        {files.length > 1 ? `View file (${files.length})` : 'View file'}
                                                    </a>
                                                ) : (
                                                    '—'
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}

