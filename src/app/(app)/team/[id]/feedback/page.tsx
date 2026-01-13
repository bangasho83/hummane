'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useApp } from '@/lib/context/AppContext'
import type { Employee, FeedbackCard } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { ArrowLeft } from 'lucide-react'

export default function EmployeeFeedbackPage() {
    const params = useParams()
    const router = useRouter()
    const pathname = usePathname()
    const { employees, feedbackEntries, feedbackCards } = useApp()
    const [employee, setEmployee] = useState<Employee | null>(null)
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

    const entries = useMemo(
        () => feedbackEntries.filter(e => e.type === 'Team Member' && e.subjectId === employeeId),
        [feedbackEntries, employeeId]
    )

    const cardsById = useMemo(
        () => new Map(feedbackCards.map(card => [card.id, card])),
        [feedbackCards]
    )

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
                    variant="outline"
                    className="border-slate-200 text-slate-600"
                >
                    <Link href={`/team/${employee.id}/attendance`}>Attendance</Link>
                </Button>
                <Button
                    asChild
                    variant="default"
                    className="bg-slate-900 text-white border-slate-900"
                >
                    <Link href={`/team/${employee.id}/feedback`}>Feedback</Link>
                </Button>
            </div>

            <Card className="border border-slate-100 shadow-premium rounded-3xl bg-white">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="hover:bg-transparent border-slate-100">
                                <TableHead className="pl-6 py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">ID</TableHead>
                                <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Card</TableHead>
                                <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {entries.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="p-10 text-center text-slate-500">
                                        No feedback entries for this team member.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                entries.map((entry) => {
                                    const card = cardsById.get(entry.cardId) as FeedbackCard | undefined
                                            return (
                                        <TableRow key={entry.id} className="border-slate-50">
                                            <TableCell className="pl-6 py-4 text-xs font-mono text-slate-500">
                                                <Link
                                                    href={`/performance/feedback/${entry.id}`}
                                                    className="hover:text-blue-600"
                                                    onClick={() => {
                                                        if (typeof window !== 'undefined') {
                                                            sessionStorage.setItem('feedbackDetailBack', pathname)
                                                        }
                                                    }}
                                                >
                                                    {entry.id}
                                                </Link>
                                            </TableCell>
                                            <TableCell className="text-sm text-slate-700">{card?.title || 'Unknown'}</TableCell>
                                            <TableCell className="text-sm text-slate-500">{new Date(entry.createdAt).toLocaleDateString()}</TableCell>
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
