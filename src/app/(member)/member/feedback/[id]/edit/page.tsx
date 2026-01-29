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

const API_BASE_URL = 'https://api.hummane.com'

interface CardQuestion {
    id?: string
    questionId?: string
    kind: 'content' | 'score' | 'comment'
    prompt: string
    weight?: number
    answer?: {
        answer: string
        questionId: string
    }
}

interface ApiCard {
    id: string
    companyId: string
    title: string
    subject: string
    questions: CardQuestion[]
    createdAt: string
    updatedAt: string
}

interface ApiEntry {
    id: string
    subjectName?: string
    subjectType?: string
    type?: string
    cardId: string
    subjectId?: string
    createdAt: string
    card: ApiCard
}

type DraftAnswer = {
    index: number
    score: number
    comment?: string
}

type ApiAnswerPayload = {
    answer: string
    questionId: string
    question: {
        id: string
        kind: 'score' | 'comment'
        prompt: string
        weight?: number
        questionId: string
    }
}

export default function MemberEditFeedbackPage() {
    const params = useParams()
    const router = useRouter()
    const { employees, applicants, apiAccessToken } = useApp()
    const entryId = params.id as string

    const [apiEntry, setApiEntry] = useState<ApiEntry | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const [type, setType] = useState<'Team Member' | 'Applicant'>('Team Member')
    const [subjectId, setSubjectId] = useState<string>('')
    const [answers, setAnswers] = useState<DraftAnswer[]>([])

    useEffect(() => {
        if (!entryId || !apiAccessToken) return

        const url = `${API_BASE_URL}/feedback-entries/${encodeURIComponent(entryId)}`

        fetch(url, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${apiAccessToken}`,
            },
        })
            .then(res => res.json())
            .then(data => {
                const entry = data?.data || data
                setApiEntry(entry)

                if (entry) {
                    const entryType = entry.subjectType === 'Employee' ? 'Team Member' : 'Applicant'
                    setType(entryType)
                    setSubjectId(entry.subjectId || '')

                    if (entry.card?.questions) {
                        const initialAnswers: DraftAnswer[] = entry.card.questions.map((q: CardQuestion, index: number) => {
                            const answerValue = q.answer?.answer || ''
                            if (q.kind === 'score') {
                                return { index, score: parseInt(answerValue, 10) || 0 }
                            }
                            if (q.kind === 'comment') {
                                return { index, score: 0, comment: answerValue }
                            }
                            return { index, score: 0 }
                        })
                        setAnswers(initialAnswers)
                    }
                }
                setLoading(false)
            })
            .catch(() => {
                setLoading(false)
            })
    }, [entryId, apiAccessToken])

    const subjects = useMemo(() => {
        return type === 'Applicant'
            ? applicants.map(a => ({ id: a.id, label: a.fullName }))
            : employees.map(e => ({ id: e.id, label: e.name }))
    }, [type, applicants, employees])

    if (loading) {
        return (
            <div className="p-8 text-slate-500">Loading feedback entry...</div>
        )
    }

    if (!apiEntry || !apiEntry.card) {
        return (
            <div className="p-8 text-slate-500">Feedback entry not found.</div>
        )
    }

    const card = apiEntry.card
    const questions = card.questions || []

    const handleAnswerChange = (index: number, score: number) => {
        setAnswers(prev => prev.map(a => (a.index === index ? { ...a, score } : a)))
    }

    const handleCommentChange = (index: number, comment: string) => {
        setAnswers(prev => prev.map(a => (a.index === index ? { ...a, comment } : a)))
    }

    const handleSave = async () => {
        if (!subjectId) {
            toast('Select a recipient', 'error')
            return
        }
        setSaving(true)
        try {
            const apiAnswers = questions
                .map((q, index) => {
                    const answer = answers.find(a => a.index === index)
                    const questionId = q.answer?.questionId || q.questionId || q.id || `q_${index}`
                    if (q.kind === 'content') return null
                    const kind: 'score' | 'comment' = q.kind === 'comment' ? 'comment' : 'score'
                    if (kind === 'comment') {
                        const value = answer?.comment || ''
                        const payload: ApiAnswerPayload = {
                            answer: value,
                            questionId,
                            question: {
                                id: questionId,
                                kind,
                                prompt: q.prompt,
                                ...(q.weight !== undefined ? { weight: q.weight } : {}),
                                questionId
                            }
                        }
                        return payload
                    }
                    const value = String(answer?.score || 0)
                    const payload: ApiAnswerPayload = {
                        answer: value,
                        questionId,
                        question: {
                            id: questionId,
                            kind,
                            prompt: q.prompt,
                            ...(q.weight !== undefined ? { weight: q.weight } : {}),
                            questionId
                        }
                    }
                    return payload
                })
                .filter((a): a is ApiAnswerPayload => a !== null)

            const apiPayload = {
                answers: apiAnswers,
                companyId: apiEntry.card.companyId
            }

            const updateUrl = `${API_BASE_URL}/feedback-entries/${encodeURIComponent(apiEntry.id)}`

            const response = await fetch(updateUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiAccessToken}`,
                },
                body: JSON.stringify(apiPayload),
            })

            const data = await response.json().catch(() => null)

            if (!response.ok) {
                throw new Error(data?.message || 'Failed to update feedback entry')
            }

            toast('Feedback updated', 'success')
            router.push('/member/feedback/given')
        } catch (error) {
            console.error('Update error:', error)
            toast('Failed to update feedback', 'error')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="animate-in fade-in duration-500 slide-in-from-bottom-4 space-y-6">
            <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Edit Feedback</h1>
                <p className="text-slate-500 font-medium">Update your feedback answers.</p>
            </div>

            <Card className="border border-slate-100 shadow-premium rounded-3xl bg-white overflow-hidden">
                <CardContent className="p-8 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-slate-700 px-1">Type</Label>
                            <Select
                                value={type}
                                onValueChange={(value: 'Team Member' | 'Applicant') => {
                                    setType(value)
                                    setSubjectId('')
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
                            <Label className="text-sm font-bold text-slate-700 px-1">Recipient</Label>
                            <Select
                                value={subjectId || 'none'}
                                onValueChange={(value) => setSubjectId(value === 'none' ? '' : value)}
                            >
                                <SelectTrigger className="h-11 rounded-xl border-slate-200">
                                    <SelectValue placeholder="Select recipient" />
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
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-3">
                            {questions.map((q, index) => {
                                const kind = q.kind ?? 'score'
                                if (kind === 'content') {
                                    return (
                                        <div key={index} className="rounded-2xl bg-white p-2">
                                            <div className="ql-snow">
                                                <div
                                                    className="ql-editor p-0 text-sm text-slate-700"
                                                    dangerouslySetInnerHTML={{ __html: q.prompt }}
                                                />
                                            </div>
                                        </div>
                                    )
                                }
                                const current = answers.find(a => a.index === index)?.score ?? 0
                                const commentValue = answers.find(a => a.index === index)?.comment ?? ''
                                return (
                                    <div key={index} className="rounded-2xl border border-slate-200 p-4 space-y-3">
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
                                                onChange={(e) => handleCommentChange(index, e.target.value)}
                                            />
                                        ) : (
                                            <div className="flex flex-wrap gap-3">
                                                {[1, 2, 3, 4, 5].map((score) => (
                                                    <label key={score} className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                                                        <input
                                                            type="radio"
                                                            name={`score-${index}`}
                                                            value={score}
                                                            checked={current === score}
                                                            onChange={() => handleAnswerChange(index, score)}
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

                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="outline" className="rounded-xl" onClick={() => router.push('/member/feedback/given')}>
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
