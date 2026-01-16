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
import { ArrowLeft, Trash2 } from 'lucide-react'

export default function EmployeeFeedbackPage() {
    const params = useParams()
    const router = useRouter()
    const pathname = usePathname()
    const { employees, feedbackEntries, feedbackCards, deleteFeedbackEntry } = useApp()
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
        () => feedbackEntries.filter(e => {
            // Check subjectId matches the employee
            if (e.subjectId !== employeeId) return false
            // Check if it's a team member entry (API returns subjectType: 'Employee' or type: 'Team Member')
            const isTeamMember = e.type === 'Team Member' || e.subjectType === 'Employee'
            return isTeamMember
        }),
        [feedbackEntries, employeeId]
    )

    const cardsById = useMemo(
        () => new Map(feedbackCards.map(card => [card.id, card])),
        [feedbackCards]
    )

    const handleDelete = async (entryId: string) => {
        if (confirm('Delete this feedback entry?')) {
            try {
                await deleteFeedbackEntry(entryId)
                toast('Feedback entry deleted', 'success')
            } catch (error) {
                toast('Failed to delete feedback entry', 'error')
            }
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
                                <TableHead className="pl-8 py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">View Feedback</TableHead>
                                <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Card</TableHead>
                                <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">From</TableHead>
                                <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Date</TableHead>
                                <TableHead className="text-right pr-8 py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {entries.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-12 text-center text-slate-500">
                                        No feedback entries for this team member.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                entries.map((entry) => {
                                    const card = cardsById.get(entry.cardId) as FeedbackCard | undefined
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    const scoreAnswers = entry.answers.filter((a: any) => a.question?.kind === 'score')
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    const isIncomplete = scoreAnswers.some((a: any) => {
                                        const value = parseInt(a.answer, 10)
                                        return isNaN(value) || value <= 0
                                    })
                                    return (
                                        <TableRow key={entry.id} className="hover:bg-slate-50/50 border-slate-50">
                                            <TableCell className="pl-8 py-5">
                                                <Link
                                                    href={`/performance/feedback/${entry.id}`}
                                                    onClick={() => {
                                                        if (typeof window !== 'undefined') {
                                                            sessionStorage.setItem('feedbackDetailBack', pathname)
                                                        }
                                                    }}
                                                    className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                                                >
                                                    View Feedback
                                                </Link>
                                            </TableCell>
                                            <TableCell className="py-5 text-sm text-slate-600">
                                                <div className="flex items-center gap-2">
                                                    <span>{card?.title || 'Unknown'}</span>
                                                    {isIncomplete && (
                                                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
                                                            Incomplete
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-5 text-sm font-medium text-slate-600">
                                                {entry.authorName || '—'}
                                            </TableCell>
                                            <TableCell className="py-5 text-sm text-slate-500">
                                                {new Date(entry.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right pr-8">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-10 w-10 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl"
                                                    onClick={() => handleDelete(entry.id)}
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
