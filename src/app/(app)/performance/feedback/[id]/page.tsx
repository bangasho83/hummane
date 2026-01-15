'use client'

import 'quill/dist/quill.snow.css'

import { useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useApp } from '@/lib/context/AppContext'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

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
            <div className="p-8 text-center text-slate-500">
                Feedback entry not found.
            </div>
        )
    }

    // Use question data from API answer.question or fall back to card questions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getQuestionKind = (a: any) => a.question?.kind || card?.questions.find(q => q.id === a.questionId)?.kind || 'score'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getQuestionPrompt = (a: any) => a.question?.prompt || card?.questions.find(q => q.id === a.questionId)?.prompt || 'Question unavailable'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scoreAnswers = entry.answers.filter((a: any) => getQuestionKind(a) === 'score')
    // Get score from API 'answer' field (parsed)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getScore = (a: any) => {
        if (a.answer) {
            const parsed = parseFloat(a.answer)
            if (!isNaN(parsed)) return parsed
        }
        return 0
    }
    const totalScore = scoreAnswers.reduce((sum, a) => sum + getScore(a), 0)
    const maxScore = scoreAnswers.length * 5
    const percentScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0
    const avgScore = scoreAnswers.length > 0 ? (totalScore / scoreAnswers.length).toFixed(1) : '0.0'
    // Incomplete if any score-type answer has value <= 0
    const isIncomplete = scoreAnswers.some((a) => getScore(a) <= 0)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const contentBlocks = entry.answers.filter((a: any) => getQuestionKind(a) === 'content')
    // Display type from API or derive from subjectType
    const displayType = entry.type || (entry.subjectType === 'Employee' ? 'Team Member' : entry.subjectType) || '—'


    return (
        <div className="animate-in fade-in duration-500 slide-in-from-bottom-4 space-y-6">
            <div className="flex items-center justify-between">
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
                        router.push('/performance/feedback')
                    }}
                    className="rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Feedback Detail</p>
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                        {entry.subjectName || 'Unknown'} <span className="text-slate-400 font-medium text-lg">({entry.id})</span>
                    </h1>
                </div>
            </div>
                <div className="flex items-center gap-3">
                    {isIncomplete && (
                        <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Incomplete</Badge>
                    )}
                    <Button
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => router.push(`/performance/feedback/${entry.id}/edit`)}
                    >
                        Edit Feedback
                    </Button>
                </div>
            </div>

            <Card className="border border-slate-100 shadow-premium rounded-3xl bg-white overflow-hidden">
                <CardContent className="p-8 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Type</p>
                            <p className="font-semibold text-slate-900">{displayType}</p>
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
                <CardContent className="p-6 space-y-4">
                    {contentBlocks.length > 0 && (
                        <div className="space-y-2 pb-4 border-b border-slate-100">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {contentBlocks.map((block: any) => (
                                <div key={block.questionId} className="p-1">
                                    <div className="ql-snow">
                                        <div
                                            className="ql-editor p-0 text-sm text-slate-700"
                                            dangerouslySetInnerHTML={{ __html: block.question?.prompt || '' }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="space-y-4">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {entry.answers.filter((answer: any) => getQuestionKind(answer) !== 'content').map((answer: any) => {
                            const kind = getQuestionKind(answer)
                            const prompt = getQuestionPrompt(answer)
                            const displayScore = getScore(answer)
                            const displayComment = answer.answer || '—'
                            return (
                                <div key={answer.questionId} className="rounded-2xl border border-slate-200 p-4 space-y-3">
                                    <p className="text-sm font-semibold text-slate-800">
                                        {prompt}
                                    </p>
                                    {kind === 'comment' ? (
                                        <p className="text-sm text-slate-600 whitespace-pre-wrap">
                                            {displayComment}
                                        </p>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            {[1, 2, 3, 4, 5].map((score) => (
                                                <div
                                                    key={score}
                                                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                                                        displayScore === score
                                                            ? 'bg-blue-600 text-white shadow-md'
                                                            : 'bg-slate-100 text-slate-400'
                                                    }`}
                                                >
                                                    {score}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
