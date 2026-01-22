'use client'

import 'quill/dist/quill.snow.css'

import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/toast'
import { useApp } from '@/lib/context/AppContext'
import { Loader2 } from 'lucide-react'

type DraftAnswer = {
    questionId: string
    score: number
    comment?: string
}

export default function MemberNewFeedbackPage() {
    const router = useRouter()
    const { feedbackCards, employees, meProfile, isHydrating, createFeedbackEntry } = useApp()
    const [cardId, setCardId] = useState<string>('')
    const [subjectId, setSubjectId] = useState<string>('')
    const [answers, setAnswers] = useState<DraftAnswer[]>([])
    const [saving, setSaving] = useState(false)

    const employeeId = meProfile?.employeeId
    const isDataLoading = isHydrating || (!meProfile && employees.length === 0)

    // Get the logged-in employee (the author)
    const author = useMemo(
        () => employees.find(e => e.id === employeeId) || null,
        [employees, employeeId]
    )

    // Filter cards for Team Member type only
    const filteredCards = useMemo(
        () => feedbackCards.filter(card => card.subject === 'Team Member'),
        [feedbackCards]
    )

    const selectedCard = useMemo(
        () => filteredCards.find(card => card.id === cardId) || null,
        [filteredCards, cardId]
    )

    // All employees except the logged-in user as subjects
    const subjects = useMemo(
        () => employees.map(e => ({ id: e.id, label: e.name })),
        [employees]
    )

    const handleSelectCard = (value: string) => {
        setCardId(value)
        const card = filteredCards.find(c => c.id === value)
        if (!card) {
            setAnswers([])
            return
        }
        const answerQuestions = card.questions.filter(q => (q.kind ?? 'score') !== 'content')
        setAnswers(answerQuestions.map(q => ({
            questionId: q.id,
            score: (q.kind ?? 'score') === 'score' ? 0 : 0,
            comment: (q.kind ?? 'score') === 'comment' ? '' : undefined
        })))
    }

    const handleAnswerChange = (questionId: string, score: number) => {
        setAnswers(prev => prev.map(a => (a.questionId === questionId ? { ...a, score } : a)))
    }

    const handleCommentChange = (questionId: string, comment: string) => {
        setAnswers(prev => prev.map(a => (a.questionId === questionId ? { ...a, comment } : a)))
    }

    const handleSave = async () => {
        if (!cardId) {
            toast('Select a feedback card', 'error')
            return
        }
        if (!subjectId) {
            toast('Select a team member', 'error')
            return
        }
        if (!employeeId) {
            toast('Your employee profile is not linked', 'error')
            return
        }
        if (!selectedCard) {
            toast('Selected card not found', 'error')
            return
        }
        setSaving(true)
        const subject = subjects.find(s => s.id === subjectId)
        try {
            await createFeedbackEntry({
                type: 'Team Member',
                subjectType: 'Employee',
                cardId,
                subjectId,
                subjectName: subject?.label,
                authorId: employeeId,
                answers: answers.map(a => {
                    const question = selectedCard.questions.find(q => q.id === a.questionId)
                    const kind = question?.kind ?? 'score'
                    return {
                        questionId: a.questionId,
                        answer: kind === 'comment' ? a.comment : String(a.score),
                        score: a.score,
                        comment: a.comment
                    }
                })
            })
            toast('Feedback submitted', 'success')
            router.push('/member/feedback/given')
        } catch {
            toast('Failed to submit feedback', 'error')
        } finally {
            setSaving(false)
        }
    }

    if (isDataLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    if (!employeeId || !author) {
        return (
            <div className="animate-in fade-in duration-500 slide-in-from-bottom-4 space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Add Feedback</h1>
                    <p className="text-slate-500">Your account is not linked to an employee profile.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="animate-in fade-in duration-500 slide-in-from-bottom-4 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Add Feedback</h1>
                <p className="text-slate-500">Select a team member and feedback card to submit your feedback.</p>
            </div>

            <Card className="border border-slate-100 shadow-premium rounded-3xl bg-white overflow-hidden">
                <CardContent className="p-8 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* From (auto-filled, read-only) */}
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-slate-700 px-1">From</Label>
                            <div className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 flex items-center text-sm text-slate-600">
                                {author.name}
                            </div>
                        </div>
                        {/* Team Member selection */}
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-slate-700 px-1">To (Team Member)</Label>
                            <Select
                                value={subjectId || 'none'}
                                onValueChange={(value) => {
                                    setSubjectId(value === 'none' ? '' : value)
                                    setCardId('')
                                    setAnswers([])
                                }}
                            >
                                <SelectTrigger className="h-11 rounded-xl border-slate-200">
                                    <SelectValue placeholder="Select team member" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Select</SelectItem>
                                    {subjects.map(subject => (
                                        <SelectItem key={subject.id} value={subject.id}>
                                            {subject.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {/* Feedback Card selection */}
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-slate-700 px-1">Feedback Card</Label>
                            <Select
                                value={cardId || 'none'}
                                onValueChange={(value) => handleSelectCard(value === 'none' ? '' : value)}
                                disabled={!subjectId}
                            >
                                <SelectTrigger className="h-11 rounded-xl border-slate-200">
                                    <SelectValue placeholder="Select card" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Select</SelectItem>
                                    {filteredCards.map(card => (
                                        <SelectItem key={card.id} value={card.id}>
                                            {card.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {selectedCard && subjectId && (
                        <div className="space-y-4">
                            <div className="space-y-3">
                                {selectedCard.questions.map((q) => {
                                    const kind = q.kind ?? 'score'
                                    if (kind === 'content') {
                                        return (
                                            <div key={q.id} className="rounded-2xl bg-white p-2">
                                                <div className="ql-snow">
                                                    <div
                                                        className="ql-editor p-0 text-sm text-slate-700"
                                                        dangerouslySetInnerHTML={{ __html: q.prompt }}
                                                    />
                                                </div>
                                            </div>
                                        )
                                    }
                                    const current = answers.find(a => a.questionId === q.id)?.score ?? 0
                                    const commentValue = answers.find(a => a.questionId === q.id)?.comment ?? ''
                                    return (
                                        <div key={q.id} className="rounded-2xl border border-slate-200 p-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-semibold text-slate-800">
                                                    {q.prompt}
                                                </p>
                                            </div>
                                            {kind === 'comment' ? (
                                                <textarea
                                                    className="w-full min-h-[120px] rounded-xl border border-slate-200 p-3 text-sm text-slate-700"
                                                    placeholder="Add your comments..."
                                                    value={commentValue}
                                                    onChange={(e) => handleCommentChange(q.id, e.target.value)}
                                                />
                                            ) : (
                                                <div className="flex flex-wrap gap-3">
                                                    {[1, 2, 3, 4, 5].map((score) => (
                                                        <label key={score} className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                                                            <input
                                                                type="radio"
                                                                name={`score-${q.id}`}
                                                                value={score}
                                                                checked={current === score}
                                                                onChange={() => handleAnswerChange(q.id, score)}
                                                            />
                                                            {score}
                                                        </label>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="outline" className="rounded-xl" onClick={() => router.push('/member/feedback/given')}>
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                            onClick={handleSave}
                            disabled={saving || !cardId || !subjectId}
                        >
                            {saving ? 'Submitting...' : 'Submit Feedback'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

