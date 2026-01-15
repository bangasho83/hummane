'use client'

import 'quill/dist/quill.snow.css'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/toast'
import { useApp } from '@/lib/context/AppContext'

type DraftAnswer = {
    questionId: string
    score: number
    comment?: string
    answer?: string  // Raw API field
}

export default function EditFeedbackPage() {
    const params = useParams()
    const router = useRouter()
    const { feedbackCards, feedbackEntries, employees, applicants, updateFeedbackEntry } = useApp()
    const entryId = params.id as string
    const entry = useMemo(() => feedbackEntries.find(e => e.id === entryId) || null, [feedbackEntries, entryId])

    const [type, setType] = useState<'Team Member' | 'Applicant'>('Team Member')
    const [cardId, setCardId] = useState<string>('')
    const [subjectId, setSubjectId] = useState<string>('')
    const [answers, setAnswers] = useState<DraftAnswer[]>([])
    const [saving, setSaving] = useState(false)

    const filteredCards = useMemo(
        () => feedbackCards.filter(card => card.subject === type),
        [feedbackCards, type]
    )

    const selectedCard = useMemo(
        () => filteredCards.find(card => card.id === cardId) || null,
        [filteredCards, cardId]
    )

    const subjects = useMemo(() => {
        return type === 'Applicant'
            ? applicants.map(a => ({ id: a.id, label: a.fullName }))
            : employees.map(e => ({ id: e.id, label: e.name }))
    }, [type, applicants, employees])

    useEffect(() => {
        if (!entry) return
        // Derive type from subjectType (Employee = Team Member, otherwise Applicant)
        const entryType = entry.subjectType === 'Employee' ? 'Team Member' : 'Applicant'
        setType(entryType)
        setCardId(entry.cardId)
        setSubjectId(entry.subjectId || '')
        const card = feedbackCards.find(c => c.id === entry.cardId)
        if (card) {
            const answerQuestions = card.questions.filter(q => (q.kind ?? 'score') !== 'content')
            setAnswers(answerQuestions.map(q => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const existing = entry.answers.find((a: any) => a.questionId === q.id) as any
                const kind = q.kind ?? 'score'
                // Use answer from API response (answer.answer field)
                const answerValue = existing?.answer ?? ''
                return {
                    questionId: q.id,
                    score: kind === 'score' ? (parseInt(answerValue, 10) || 0) : 0,
                    comment: kind === 'comment' ? answerValue : undefined,
                    answer: answerValue
                }
            }))
        } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setAnswers(entry.answers.map((a: any) => ({
                questionId: a.questionId,
                score: parseInt(a.answer, 10) || 0,
                comment: a.answer,
                answer: a.answer
            })))
        }
    }, [entry, feedbackCards])

    if (!entry) {
        return (
            <div className="p-8 text-slate-500">Feedback entry not found.</div>
        )
    }

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
            toast('Select a recipient', 'error')
            return
        }
        if (!selectedCard) {
            toast('Selected card not found', 'error')
            return
        }
        setSaving(true)
        const subject = subjects.find(s => s.id === subjectId)
        try {
            await updateFeedbackEntry(entry.id, {
                type,
                subjectType: type === 'Team Member' ? 'Employee' : 'Applicant',
                cardId,
                subjectId,
                subjectName: subject?.label,
                answers: answers.map(a => {
                    const question = selectedCard.questions.find(q => q.id === a.questionId)
                    const kind = question?.kind ?? 'score'
                    // Use 'answer' field for API compatibility
                    return {
                        questionId: a.questionId,
                        answer: kind === 'comment' ? a.comment : String(a.score),
                        score: a.score,
                        comment: a.comment
                    }
                })
            })
            toast('Feedback updated', 'success')
            router.push('/performance/feedback')
        } catch (error) {
            toast('Failed to update feedback', 'error')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="animate-in fade-in duration-500 slide-in-from-bottom-4 space-y-6">
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Edit Feedback</h1>
                <p className="text-slate-500 font-medium">
                    Continue a draft or update submitted feedback.
                </p>
            </div>

            <Card className="border border-slate-100 shadow-premium rounded-3xl bg-white overflow-hidden">
                <CardContent className="p-8 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-slate-700 px-1">Type</Label>
                            <Select
                                value={type}
                                onValueChange={(value: 'Team Member' | 'Applicant') => {
                                    setType(value)
                                    setCardId('')
                                    setSubjectId('')
                                    setAnswers([])
                                }}
                            >
                                <SelectTrigger className="h-11 rounded-xl border-slate-200">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Team Member">Team Member</SelectItem>
                                    <SelectItem value="Applicant">Applicant</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-slate-700 px-1">
                                {type === 'Applicant' ? 'Applicant' : 'Team Member'}
                            </Label>
                            <Select
                                value={subjectId || 'none'}
                                onValueChange={(value) => {
                                    setSubjectId(value === 'none' ? '' : value)
                                    setCardId('')
                                    setAnswers([])
                                }}
                            >
                                <SelectTrigger className="h-11 rounded-xl border-slate-200">
                                    <SelectValue placeholder="Select person" />
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
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Questions</p>
                            </div>
                            <div className="space-y-3">
                                {selectedCard.questions.map((q, index) => {
                                    const kind = q.kind ?? 'score'
                                    if (kind === 'content') {
                                        return (
                                            <div key={q.id} className="rounded-2xl border border-slate-200 bg-white p-4">
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
                            <Button type="button" variant="outline" className="rounded-xl" onClick={() => router.push('/performance/feedback')}>
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? 'Saving...' : 'Submit Feedback'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
)
}
