'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useApp } from '@/lib/context/AppContext'
import type { Employee } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { ArrowLeft, FileText } from 'lucide-react'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://hummane-api.vercel.app'

export default function EmployeeAttendancePage() {
    const params = useParams()
    const router = useRouter()
    const { employees, leaves, leaveTypes, apiAccessToken } = useApp()
    const [employee, setEmployee] = useState<Employee | null>(null)
    const [apiResponse, setApiResponse] = useState<unknown>(null)
    const [apiLoading, setApiLoading] = useState(false)
    const employeeId = params.id as string

    useEffect(() => {
        const emp = employees.find(e => e.id === employeeId)
        if (!emp && employees.length > 0) {
            toast('Employee not found', 'error')
            router.push('/team')
        } else {
            setEmployee(emp || null)
        }
    }, [employees, employeeId, router])

    const employeeLeaves = useMemo(
        () => leaves.filter(l => l.employeeId === employeeId),
        [leaves, employeeId]
    )

    // Fetch raw API response for display
    useEffect(() => {
        if (!apiAccessToken || !employeeId) return
        const fetchApiData = async () => {
            setApiLoading(true)
            try {
                const response = await fetch(`${API_BASE_URL}/leaves?employeeId=${encodeURIComponent(employeeId)}`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${apiAccessToken}`,
                    },
                })
                const data = await response.json()
                setApiResponse(data)
            } catch (error) {
                console.error('Failed to fetch API response:', error)
                setApiResponse({ error: 'Failed to fetch' })
            } finally {
                setApiLoading(false)
            }
        }
        void fetchApiData()
    }, [apiAccessToken, employeeId])

    const curlCommand = `curl -X GET "${API_BASE_URL}/leaves?employeeId=${encodeURIComponent(employeeId)}" \\
  -H "Authorization: Bearer ${apiAccessToken || '<ACCESS_TOKEN>'}"`

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

            <Card className="border border-slate-100 shadow-premium rounded-3xl bg-white">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="hover:bg-transparent border-slate-100">
                                <TableHead className="pl-6 py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Date</TableHead>
                                <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Type</TableHead>
                                <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Code</TableHead>
                                <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Quota</TableHead>
                                <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Unit</TableHead>
                                <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Amount</TableHead>
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
                                            <TableCell className="pl-6 py-4 text-sm font-medium text-slate-700">{formatDate(leave.date)}</TableCell>
                                            <TableCell className="text-sm font-medium text-slate-700">{leave.leaveTypeName || lt?.name || '—'}</TableCell>
                                            <TableCell className="text-sm text-slate-500">{leave.leaveTypeCode || lt?.code || '—'}</TableCell>
                                            <TableCell className="text-sm text-slate-500">{leave.leaveTypeQuota ?? lt?.quota ?? '—'}</TableCell>
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
                                        </TableRow>
                                    )
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* API Response Debug Section */}
                <Card className="border border-slate-100 shadow-premium rounded-3xl bg-white">
                    <CardContent className="p-6 space-y-4">
                        <h2 className="text-lg font-bold text-slate-900">API Response</h2>

                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">cURL Command</p>
                            <pre className="bg-slate-900 text-green-400 p-4 rounded-xl text-xs overflow-x-auto whitespace-pre-wrap break-all">
                                {curlCommand}
                            </pre>
                        </div>

                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Response</p>
                            {apiLoading ? (
                                <div className="text-slate-500">Loading...</div>
                            ) : (
                                <pre className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs overflow-x-auto max-h-96 overflow-y-auto">
                                    {JSON.stringify(apiResponse, null, 2)}
                                </pre>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
)
}
