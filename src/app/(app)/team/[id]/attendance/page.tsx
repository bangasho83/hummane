'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useApp } from '@/lib/context/AppContext'
import type { Employee, LeaveRecord } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { ArrowLeft, FileText, Trash2 } from 'lucide-react'

const API_BASE_URL = 'https://api.hummane.com'

export default function EmployeeAttendancePage() {
    const params = useParams()
    const router = useRouter()
    const { employees, leaveTypes, apiAccessToken } = useApp()
    const [employee, setEmployee] = useState<Employee | null>(null)
    const [employeeLeaves, setEmployeeLeaves] = useState<LeaveRecord[]>([])
    const [leaveSummary, setLeaveSummary] = useState<Array<{ id: string; name: string; code: string; unit: string; quota: number; color: string; used: number; remaining: number }>>([])
    const [loading, setLoading] = useState(true)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const employeeId = params.id as string

    const fetchLeaves = useCallback(async () => {
        if (!apiAccessToken || !employeeId) return

        setLoading(true)
        try {
            const response = await fetch(`${API_BASE_URL}/leaves?employeeId=${encodeURIComponent(employeeId)}`, {
                headers: { Authorization: `Bearer ${apiAccessToken}` }
            })
            const data = await response.json()
            const list = data?.records || data?.data || data?.leaves || data
            setEmployeeLeaves(Array.isArray(list) ? list : [])
            // Extract summary data
            if (Array.isArray(data?.summary)) {
                setLeaveSummary(data.summary)
            } else {
                setLeaveSummary([])
            }
        } catch (error) {
            console.error('Error fetching leaves:', error)
            setEmployeeLeaves([])
            setLeaveSummary([])
        } finally {
            setLoading(false)
        }
    }, [apiAccessToken, employeeId])

    useEffect(() => {
        const emp = employees.find(e => e.id === employeeId)
        if (!emp && employees.length > 0) {
            toast('Employee not found', 'error')
            router.push('/team')
        } else {
            setEmployee(emp || null)
        }
    }, [employees, employeeId, router])

    useEffect(() => {
        fetchLeaves()
    }, [fetchLeaves])

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast('Copied to clipboard', 'success')
    }

    const handleDeleteLeave = async (leaveId: string) => {
        if (!apiAccessToken) {
            toast('Missing access token', 'error')
            return
        }
        if (!confirm('Delete this leave request?')) return
        setDeletingId(leaveId)
        try {
            const response = await fetch(`${API_BASE_URL}/leaves/${encodeURIComponent(leaveId)}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${apiAccessToken}` }
            })
            if (!response.ok) {
                const message = await response.text()
                throw new Error(message || 'Failed to delete leave request')
            }
            toast('Leave request deleted', 'success')
            await fetchLeaves()
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to delete leave request'
            toast(message, 'error')
        } finally {
            setDeletingId(null)
        }
    }

    if (!employee) {
        return (
            <div className="p-8 text-slate-500">Loading profile...</div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push('/team')}
                        className="rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{employee.name}</h1>
                        <p className="text-slate-500 font-medium">{employee.roleName || employee.position || '—'} • {employee.departmentName || employee.department || '—'}</p>
                    </div>
                </div>
                <Badge className="bg-blue-50 text-blue-700 border-blue-100">{employee.employmentType}</Badge>
            </div>

            <div className="flex gap-2">
                <Button
                    asChild
                    variant="outline"
                    className="border-slate-200 text-slate-600"
                >
                    <Link href={`/team/${employee.id}`}>General Info</Link>
                </Button>
                <Button
                    asChild
                    variant="default"
                    className="bg-slate-900 text-white border-slate-900"
                >
                    <Link href={`/team/${employee.id}/attendance`}>Attendance</Link>
                </Button>
                <Button
                    asChild
                    variant="outline"
                    className="border-slate-200 text-slate-600"
                >
                    <Link href={`/team/${employee.id}/feedback`}>Feedback</Link>
                </Button>
            </div>

            {/* Leave Summary */}
            {leaveSummary.length > 0 && (
                <div className="flex flex-wrap items-center gap-6">
                    {/* Day-based leaves */}
                    {leaveSummary.filter(item => item.unit === 'Day').length > 0 && (
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Days</span>
                            <div className="flex flex-wrap gap-2">
                                {leaveSummary.filter(item => item.unit === 'Day').map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-100 bg-white shadow-sm"
                                    >
                                        <div
                                            className="w-2.5 h-2.5 rounded-full"
                                            style={{ backgroundColor: item.color || '#94a3b8' }}
                                        />
                                        <span className="text-sm font-medium text-slate-700">{item.name}</span>
                                        <span className="text-sm font-bold text-slate-900">{item.used}/{item.quota}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {/* Hour-based leaves */}
                    {leaveSummary.filter(item => item.unit === 'Hour').length > 0 && (
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hours</span>
                            <div className="flex flex-wrap gap-2">
                                {leaveSummary.filter(item => item.unit === 'Hour').map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-100 bg-white shadow-sm"
                                    >
                                        <div
                                            className="w-2.5 h-2.5 rounded-full"
                                            style={{ backgroundColor: item.color || '#94a3b8' }}
                                        />
                                        <span className="text-sm font-medium text-slate-700">{item.name}</span>
                                        <span className="text-sm font-bold text-slate-900">{item.used}/{item.quota}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

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
                                <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Note</TableHead>
                                <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Document</TableHead>
                                <TableHead className="text-right pr-6 py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="p-10 text-center text-slate-500">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
                                            Loading leaves...
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : employeeLeaves.length === 0 ? (
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
                                    const displayDate = leave.startDate || leave.date
                                    return (
                                        <TableRow key={leave.id} className="border-slate-50">
                                            <TableCell className="pl-6 py-4 text-sm font-medium text-slate-700">{displayDate ? formatDate(displayDate) : '—'}</TableCell>
                                            <TableCell className="text-sm font-medium text-slate-700">{leave.leaveTypeName || lt?.name || '—'}</TableCell>
                                            <TableCell className="text-sm text-slate-500">{leave.leaveTypeCode || lt?.code || '—'}</TableCell>
                                            <TableCell className="text-sm text-slate-500">{leave.unit || lt?.unit || 'Day'}</TableCell>
                                            <TableCell className="text-sm text-slate-500">{leave.amount ?? 1}</TableCell>
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
                                            <TableCell className="text-right pr-6">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-10 w-10 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl"
                                                    onClick={() => handleDeleteLeave(leave.id)}
                                                    disabled={deletingId === leave.id}
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </Button>
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
