'use client'

import 'quill/dist/quill.snow.css'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/toast'
import { useApp } from '@/lib/context/AppContext'
import type { FeedbackCard } from '@/types'

type DraftAnswer = {
    questionId: string
    score: number
    comment?: string
}

export default function NewFeedbackPage() {
    const router = useRouter()
    const { feedbackCards, employees, applicants, createFeedbackEntry } = useApp()
    const [type, setType] = useState<'Team Member' | 'Applicant'>('Team Member')
    const [cardId, setCardId] = useState<string>('')
    const [subjectId, setSubjectId] = useState<string>('')
    const [authorId, setAuthorId] = useState<string>('')
    const [answers, setAnswers] = useState<DraftAnswer[]>([])
    const [saving, setSaving] = useState(false)
    const [authorQuery, setAuthorQuery] = useState('')
    const [subjectQuery, setSubjectQuery] = useState('')

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

    const authors = useMemo(
        () => employees.map(e => ({ id: e.id, label: e.name })),
        [employees]
    )

    const filteredAuthors = useMemo(() => {
        const query = authorQuery.trim().toLowerCase()
        if (!query) return authors
        return authors.filter(author => author.label.toLowerCase().includes(query))
    }, [authors, authorQuery])

    const filteredSubjects = useMemo(() => {
        const query = subjectQuery.trim().toLowerCase()
        if (!query) return subjects
        return subjects.filter(subject => subject.label.toLowerCase().includes(query))
    }, [subjects, subjectQuery])

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
        if (!authorId) {
            toast('Select who submitted the feedback', 'error')
            return
        }
        if (!selectedCard) {
            toast('Selected card not found', 'error')
            return
        }
        setSaving(true)
        const subject = subjects.find(s => s.id === subjectId)
        const apiPayload = {
            cardId,
            subjectType: type === 'Applicant' ? 'Applicant' : 'Employee',
            subjectId,
            subjectName: subject?.label,
            answers: answers.map(answer => {
                const kind = selectedCard.questions.find(q => q.id === answer.questionId)?.kind
                const value = kind === 'comment'
                    ? answer.comment || ''
                    : Number.isFinite(answer.score)
                        ? String(answer.score)
                        : answer.comment || ''
                return {
                    questionId: answer.questionId,
                    answer: value
                }
            }),
            companyId: 'YOUR_COMPANY_ID'
        }
        try {
            const curl = `curl -X POST \"$BASE_URL/feedback-entries\" \\\n` +
                `  -H \"Authorization: Bearer $TOKEN\" \\\n` +
                `  -H \"Content-Type: application/json\" \\\n` +
                `  -d '${JSON.stringify(apiPayload)}'`
            console.info(`Feedback entry create curl:\n${curl}`)
            await createFeedbackEntry({
                type,
                subjectType: type === 'Applicant' ? 'Applicant' : 'Employee',
                cardId,
                subjectId,
                subjectName: subject?.label,
                authorId,
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
            toast('Feedback submitted', 'success')
            router.push('/performance/feedback')
        } catch (error) {
            toast('Failed to submit feedback', 'error')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="animate-in fade-in duration-500 slide-in-from-bottom-4 space-y-6">
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Add Feedback</h1>
                <p className="text-slate-500 font-medium">
                    Select a feedback card and score each question.
                </p>
            </div>

            <Card className="border border-slate-100 shadow-premium rounded-3xl bg-white overflow-hidden">
                <CardContent className="p-8 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-slate-700 px-1">Type</Label>
                            <Select
                                value={type}
                                onValueChange={(value: 'Team Member' | 'Applicant') => {
                                    setType(value)
                                    setCardId('')
                                    setSubjectId('')
                                    setSubjectQuery('')
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
                            <Label className="text-sm font-bold text-slate-700 px-1">Feedback Card</Label>
                            <Select
                                value={cardId || 'none'}
                                onValueChange={(value) => handleSelectCard(value === 'none' ? '' : value)}
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
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-slate-700 px-1">From</Label>
                            <Select
                                value={authorId || 'none'}
                                onValueChange={(value) => setAuthorId(value === 'none' ? '' : value)}
                            >
                                <SelectTrigger className="h-11 rounded-xl border-slate-200">
                                    <SelectValue placeholder="Select team member" />
                                </SelectTrigger>
                                <SelectContent className="max-h-72 overflow-y-auto">
                                    <div className="p-2 sticky top-0 bg-white z-10 border-b border-slate-100">
                                        <Input
                                            value={authorQuery}
                                            onChange={(e) => setAuthorQuery(e.target.value)}
                                            placeholder="Search team members..."
                                            className="h-9 rounded-lg"
                                            onKeyDown={(e) => e.stopPropagation()}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                    <SelectItem value="none">Select</SelectItem>
                                    {filteredAuthors.map(author => (
                                        <SelectItem key={author.id} value={author.id}>
                                            {author.label}
                                        </SelectItem>
                                    ))}
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
                                }}
                            >
                                <SelectTrigger className="h-11 rounded-xl border-slate-200">
                                    <SelectValue placeholder="Select person" />
                                </SelectTrigger>
                                <SelectContent className="max-h-72 overflow-y-auto">
                                    <div className="p-2 sticky top-0 bg-white z-10 border-b border-slate-100">
                                        <Input
                                            value={subjectQuery}
                                            onChange={(e) => setSubjectQuery(e.target.value)}
                                            placeholder={`Search ${type === 'Applicant' ? 'applicants' : 'team members'}...`}
                                            className="h-9 rounded-lg"
                                            onKeyDown={(e) => e.stopPropagation()}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                    <SelectItem value="none">Select</SelectItem>
                                    {filteredSubjects.map(subject => (
                                        <SelectItem key={subject.id} value={subject.id}>
                                            {subject.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {selectedCard && subjectId && (
                        <div className="space-y-4">
                            <div className="space-y-3">
                                {selectedCard.questions.map((q, index) => {
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
                            <Button type="button" variant="outline" className="rounded-xl" onClick={() => router.push('/performance/feedback')}>
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? 'Submitting...' : 'Submit Feedback'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
)
}
