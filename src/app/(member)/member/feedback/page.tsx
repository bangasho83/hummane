'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useApp } from '@/lib/context/AppContext'
import type { Employee, FeedbackCard, FeedbackEntry } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { MessageSquare, Loader2 } from 'lucide-react'
import { MemberFeedbackTabs } from '@/features/member/components/MemberFeedbackTabs'

const API_BASE_URL = 'https://api.hummane.com'

export default function MemberFeedbackPage() {
    const { employees, feedbackCards, meProfile, isHydrating, apiAccessToken } = useApp()
    const [employee, setEmployee] = useState<Employee | null>(null)
    const [entries, setEntries] = useState<FeedbackEntry[]>([])
    const [loading, setLoading] = useState(true)
    const pathname = usePathname()

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

    // Fetch feedback entries where this employee is the subject (received feedback)
    const fetchReceivedFeedback = useCallback(async () => {
        if (!apiAccessToken || !employeeId) {
            setLoading(false)
            return
        }
        setLoading(true)
        try {
            const response = await fetch(`${API_BASE_URL}/feedback-entries?subjectId=${encodeURIComponent(employeeId)}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${apiAccessToken}`,
                },
            })
            if (response.ok) {
                const data = await response.json()
                const list = data?.data || data?.feedbackEntries || data
                setEntries(Array.isArray(list) ? list : [])
            } else {
                setEntries([])
            }
        } catch {
            setEntries([])
        } finally {
            setLoading(false)
        }
    }, [apiAccessToken, employeeId])

    useEffect(() => {
        if (!isDataLoading && employeeId) {
            fetchReceivedFeedback()
        }
    }, [isDataLoading, employeeId, fetchReceivedFeedback])

    const cardsById = useMemo(
        () => new Map(feedbackCards.map(card => [card.id, card])),
        [feedbackCards]
    )

    if (isDataLoading) {
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
                    <h1 className="text-2xl font-bold text-slate-900">Feedback</h1>
                    <p className="text-slate-500">View feedback received from your team</p>
                </div>

                <Card className="border-dashed">
                    <CardHeader className="text-center pb-4">
                        <div className="mx-auto w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mb-4">
                            <MessageSquare className="w-8 h-8 text-amber-600" />
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
            <div>
                <h1 className="text-2xl font-bold text-slate-900">My Feedback</h1>
                <p className="text-slate-500">View feedback you have received and given</p>
            </div>

            <MemberFeedbackTabs />

            {loading ? (
                <div className="flex items-center justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            ) : (
            <Card className="border border-slate-100 shadow-premium rounded-3xl bg-white">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="hover:bg-transparent border-slate-100">
                                <TableHead className="pl-8 py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">View Feedback</TableHead>
                                <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Card</TableHead>
                                <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">From</TableHead>
                                <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Score</TableHead>
                                <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Status</TableHead>
                                <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {entries.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-12 text-center text-slate-500">
                                        No feedback received yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                entries.map((entry) => {
                                    const card = cardsById.get(entry.cardId) as FeedbackCard | undefined
                                    // Calculate score from answers
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    const scoreAnswers = entry.answers.filter((a: any) => a.question?.kind === 'score')
                                    let scorePercent: number | null = null
                                    let isIncomplete = false
                                    if (scoreAnswers.length > 0) {
                                        let total = 0, max = 0
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        scoreAnswers.forEach((a: any) => {
                                            const val = parseInt(a.answer || '0', 10)
                                            if (!isNaN(val) && val > 0) {
                                                total += val
                                                max += 5
                                            } else {
                                                isIncomplete = true
                                            }
                                        })
                                        if (max > 0) {
                                            scorePercent = Math.round((total / max) * 100)
                                        }
                                    }
                                    return (
                                        <TableRow key={entry.id} className="hover:bg-slate-50/50 border-slate-50">
                                            <TableCell className="pl-8 py-5">
                                                <Link
                                                    href={`/member/feedback/${entry.id}`}
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
                                                {scorePercent !== null ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-16 h-2 rounded-full bg-slate-100 overflow-hidden">
                                                            <div
                                                                className={`h-2 rounded-full ${scorePercent >= 80 ? 'bg-emerald-500' : scorePercent >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                                style={{ width: `${scorePercent}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-sm font-semibold text-slate-700">{scorePercent}%</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-slate-400">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="py-5">
                                                {isIncomplete ? (
                                                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
                                                        Incomplete
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                                                        Complete
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="py-5 text-sm text-slate-500">
                                                {new Date(entry.createdAt).toLocaleDateString()}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            )}
        </div>
    )
}

