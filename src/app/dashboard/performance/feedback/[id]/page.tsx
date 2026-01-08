'use client'

import { useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useApp } from '@/lib/context/AppContext'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft } from 'lucide-react'

export default function FeedbackDetailPage() {
    const params = useParams()
    const router = useRouter()
    const { feedbackEntries, feedbackCards } = useApp()

    const entryId = params.id as string
    const entry = useMemo(
        () => feedbackEntries.find(e => e.id === entryId) || null,
        [feedbackEntries, entryId]
    )
    const card = useMemo(
        () => feedbackCards.find(c => c.id === entry?.cardId) || null,
        [feedbackCards, entry?.cardId]
    )

    if (!entry) {
        return (
            <DashboardShell>
                <div className="p-8 text-center text-slate-500">
                    Feedback entry not found.
                </div>
            </DashboardShell>
        )
    }

    const questionById = new Map(card?.questions.map(q => [q.id, q]) || [])
    const scoreAnswers = entry.answers.filter(a => (questionById.get(a.questionId)?.kind || 'score') === 'score')
    const totalScore = scoreAnswers.reduce((sum, a) => sum + a.score, 0)
    const maxScore = scoreAnswers.length * 5
    const percentScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0
    const avgScore = scoreAnswers.length > 0 ? (totalScore / scoreAnswers.length).toFixed(1) : '0.0'

    return (
        <DashboardShell>
            <div className="animate-in fade-in duration-500 slide-in-from-bottom-4 space-y-6">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            if (typeof window !== 'undefined') {
                                const backTarget = sessionStorage.getItem('feedbackDetailBack')
                                if (backTarget) {
                                    router.push(backTarget)
                                    return
                                }
                            }
                            router.push('/dashboard/performance/feedback')
                        }}
                        className="rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Feedback Detail</p>
                        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{entry.id}</h1>
                    </div>
                </div>

                <Card className="border border-slate-100 shadow-premium rounded-3xl bg-white overflow-hidden">
                    <CardContent className="p-8 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Type</p>
                                <p className="font-semibold text-slate-900">{entry.type}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recipient</p>
                                <p className="font-semibold text-slate-900">{entry.subjectName || 'Unknown'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Card</p>
                                <p className="font-semibold text-slate-900">{card?.title || 'Unknown'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Date</p>
                                <p className="font-semibold text-slate-900">{new Date(entry.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                            <div className="rounded-2xl border border-slate-200 p-4">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Score</p>
                                <p className="text-2xl font-extrabold text-slate-900">{totalScore} / {maxScore}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200 p-4">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Average</p>
                                <p className="text-2xl font-extrabold text-slate-900">{avgScore}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200 p-4 space-y-2">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Score %</p>
                                <p className="text-2xl font-extrabold text-slate-900">{percentScore}%</p>
                                <Progress value={percentScore} className="h-2" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-premium rounded-3xl bg-white overflow-hidden">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow className="hover:bg-transparent border-slate-100">
                                    <TableHead className="pl-8 py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Question</TableHead>
                                    <TableHead className="text-center py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Score</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {entry.answers.map((answer) => {
                                    const question = questionById.get(answer.questionId)
                                    return (
                                        <TableRow key={answer.questionId} className="hover:bg-slate-50/50 border-slate-50">
                                            <TableCell className="pl-8 py-5 text-sm text-slate-700">
                                                {question?.prompt || 'Question unavailable'}
                                            </TableCell>
                                            <TableCell className="text-center py-5 font-semibold text-slate-900">
                                                {question?.kind === 'comment' ? (
                                                    <div className="text-sm text-slate-600 whitespace-pre-wrap text-left">
                                                        {answer.comment || '—'}
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-2">
                                                        <span className="text-lg font-extrabold text-slate-900">{answer.score}</span>
                                                        <Progress value={(answer.score / 5) * 100} className="h-2 w-28" />
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </DashboardShell>
    )
}
