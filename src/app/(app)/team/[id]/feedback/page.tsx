'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
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

const API_BASE_URL = 'https://api.hummane.com'

export default function EmployeeFeedbackPage() {
    const params = useParams()
    const router = useRouter()
    const pathname = usePathname()
    const { employees, feedbackCards, apiAccessToken } = useApp()
    const [employee, setEmployee] = useState<Employee | null>(null)
    const [entries, setEntries] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
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

    const fetchEntries = useCallback(async () => {
        if (!apiAccessToken || !employeeId) {
            setEntries([])
            setIsLoading(false)
            return
        }
        setIsLoading(true)
        try {
            const url = `${API_BASE_URL}/feedback-entries?subjectId=${encodeURIComponent(employeeId)}`
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${apiAccessToken}`
                }
            })
            const text = await response.text()
            let parsed: unknown = null
            if (text) {
                try {
                    parsed = JSON.parse(text)
                } catch {
                    parsed = text
                }
            }
            if (!response.ok) {
                const message = typeof parsed === 'string' ? parsed : 'Failed to fetch feedback entries'
                throw new Error(message || 'Failed to fetch feedback entries')
            }
            const list = Array.isArray(parsed)
                ? parsed
                : Array.isArray((parsed as { data?: unknown })?.data)
                    ? (parsed as { data: unknown[] }).data
                    : Array.isArray((parsed as { feedbackEntries?: unknown })?.feedbackEntries)
                        ? (parsed as { feedbackEntries: unknown[] }).feedbackEntries
                        : []
            setEntries(list)
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch feedback entries'
            toast(message, 'error')
            setEntries([])
        } finally {
            setIsLoading(false)
        }
    }, [apiAccessToken, employeeId])

    const cardsById = useMemo(
        () => new Map(feedbackCards.map(card => [card.id, card])),
        [feedbackCards]
    )

    const handleDelete = async (entryId: string) => {
        if (confirm('Delete this feedback entry?')) {
            try {
                const response = await fetch(
                    `${API_BASE_URL}/feedback-entries/${encodeURIComponent(entryId)}`,
                    {
                        method: 'DELETE',
                        headers: {
                            Authorization: `Bearer ${apiAccessToken}`
                        }
                    }
                )
                if (!response.ok) {
                    const message = await response.text()
                    throw new Error(message || 'Failed to delete feedback entry')
                }
                toast('Feedback entry deleted', 'success')
                await fetchEntries()
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Failed to delete feedback entry'
                toast(message, 'error')
            }
        }
    }

    useEffect(() => {
        void fetchEntries()
    }, [fetchEntries])

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
                                <TableHead className="pl-6 py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">View Feedback</TableHead>
                                <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Card</TableHead>
                                <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">From</TableHead>
                                <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Score</TableHead>
                                <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Status</TableHead>
                                <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Date</TableHead>
                                <TableHead className="text-right pr-6 py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-12 text-center text-slate-500">
                                        Loading feedback entries...
                                    </TableCell>
                                </TableRow>
                            ) : entries.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-12 text-center text-slate-500">
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
                                    // Calculate score percentage
                                    let scorePercent = 0
                                    if (scoreAnswers.length > 0) {
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        const total = scoreAnswers.reduce((sum: number, a: any) => {
                                            const val = parseInt(a.answer, 10)
                                            return sum + (isNaN(val) ? 0 : val)
                                        }, 0)
                                        const maxScore = scoreAnswers.length * 5
                                        scorePercent = Math.round((total / maxScore) * 100)
                                    }
                                    const scoreColor = scorePercent >= 80 ? 'bg-green-500' : scorePercent >= 60 ? 'bg-amber-500' : 'bg-red-500'
                                    return (
                                        <TableRow key={entry.id} className="hover:bg-slate-50/50 border-slate-50">
                                            <TableCell className="pl-6 py-5">
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
                                                {card?.title || 'Unknown'}
                                            </TableCell>
                                            <TableCell className="py-5 text-sm font-medium text-slate-600">
                                                {entry.authorName || '—'}
                                            </TableCell>
                                            <TableCell className="py-5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className={`h-full ${scoreColor} rounded-full`} style={{ width: `${scorePercent}%` }} />
                                                    </div>
                                                    <span className="text-sm font-medium text-slate-700">{scorePercent}%</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-5">
                                                {isIncomplete ? (
                                                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
                                                        Incomplete
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-green-100 text-green-700">
                                                        Complete
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="py-5 text-sm text-slate-500">
                                                {new Date(entry.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
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
