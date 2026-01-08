'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { useApp } from '@/lib/context/AppContext'
import type { Employee } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { ArrowLeft } from 'lucide-react'

export default function EmployeeAttendancePage() {
    const params = useParams()
    const router = useRouter()
    const { employees, leaves, leaveTypes } = useApp()
    const [employee, setEmployee] = useState<Employee | null>(null)
    const employeeId = params.id as string

    useEffect(() => {
        const emp = employees.find(e => e.id === employeeId)
        if (!emp && employees.length > 0) {
            toast('Employee not found', 'error')
            router.push('/dashboard/team')
        } else {
            setEmployee(emp || null)
        }
    }, [employees, employeeId, router])

    const employeeLeaves = useMemo(
        () => leaves.filter(l => l.employeeId === employeeId),
        [leaves, employeeId]
    )

    if (!employee) {
        return (
            <DashboardShell>
                <div className="p-8 text-slate-500">Loading profile...</div>
            </DashboardShell>
        )
    }

    return (
        <DashboardShell>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push('/dashboard/team')}
                            className="rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{employee.name}</h1>
                            <p className="text-slate-500 font-medium">{employee.position} • {employee.department}</p>
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
                        <Link href={`/dashboard/team/${employee.id}`}>General Info</Link>
                    </Button>
                    <Button
                        asChild
                        variant="default"
                        className="bg-slate-900 text-white border-slate-900"
                    >
                        <Link href={`/dashboard/team/${employee.id}/attendance`}>Attendance</Link>
                    </Button>
                    <Button
                        asChild
                        variant="outline"
                        className="border-slate-200 text-slate-600"
                    >
                        <Link href={`/dashboard/team/${employee.id}/feedback`}>Feedback</Link>
                    </Button>
                </div>

                <Card className="border border-slate-100 shadow-premium rounded-3xl bg-white">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow className="hover:bg-transparent border-slate-100">
                                    <TableHead className="pl-6 py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Date</TableHead>
                                    <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Type</TableHead>
                                    <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Unit</TableHead>
                                    <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {employeeLeaves.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="p-10 text-center text-slate-500">
                                            No leaves recorded.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    employeeLeaves.map((leave) => {
                                        const lt = leaveTypes.find(t => t.id === leave.leaveTypeId)
                                        return (
                                            <TableRow key={leave.id} className="border-slate-50">
                                                <TableCell className="pl-6 py-4 text-sm font-medium text-slate-700">{formatDate(leave.date)}</TableCell>
                                                <TableCell className="text-sm font-medium text-slate-700">{leave.type}</TableCell>
                                                <TableCell className="text-sm text-slate-500">{leave.unit || lt?.unit || 'Day'}</TableCell>
                                                <TableCell className="text-sm text-slate-500">{leave.amount ?? 1}</TableCell>
                                            </TableRow>
                                        )
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </DashboardShell>
    )
}
