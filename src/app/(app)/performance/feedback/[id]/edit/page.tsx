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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://hummane-api.vercel.app'

// Types for the API card structure
interface CardQuestion {
    kind: 'content' | 'score' | 'comment'  // API uses 'kind' and 'comment' for text
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
    index: number  // Use index since questions don't have IDs
    score: number
    comment?: string
}

export default function EditFeedbackPage() {
    const params = useParams()
    const router = useRouter()
    const { employees, applicants, updateFeedbackEntry, apiAccessToken } = useApp()
    const entryId = params.id as string

    // API data state
    const [apiEntry, setApiEntry] = useState<ApiEntry | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Form state
    const [type, setType] = useState<'Team Member' | 'Applicant'>('Team Member')
    const [subjectId, setSubjectId] = useState<string>('')
    const [answers, setAnswers] = useState<DraftAnswer[]>([])

    // API Debug state
    const [apiResponse, setApiResponse] = useState<string>('')
    const [curlCommand, setCurlCommand] = useState<string>('')

    // Fetch from API
    useEffect(() => {
        if (!entryId || !apiAccessToken) return

        const url = `${API_BASE_URL}/feedback-entries/${encodeURIComponent(entryId)}`
        const curl = `curl -X GET '${url}' \\
  -H 'Authorization: Bearer ${apiAccessToken}'`
        setCurlCommand(curl)

        fetch(url, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${apiAccessToken}`,
            },
        })
            .then(res => res.json())
            .then(data => {
                setApiResponse(JSON.stringify(data, null, 2))
                const entry = data?.data || data
                setApiEntry(entry)

                // Initialize form from API data
                if (entry) {
                    const entryType = entry.subjectType === 'Employee' ? 'Team Member' : 'Applicant'
                    setType(entryType)
                    setSubjectId(entry.subjectId || '')

                    // Initialize answers from card.questions with embedded answers
                    if (entry.card?.questions) {
                        const initialAnswers: DraftAnswer[] = entry.card.questions.map((q: CardQuestion, index: number) => {
                            const answerValue = q.answer?.answer || ''
                            if (q.kind === 'score') {
                                return { index, score: parseInt(answerValue, 10) || 0 }
                            } else if (q.kind === 'comment') {
                                return { index, score: 0, comment: answerValue }
                            }
                            return { index, score: 0 }
                        })
                        setAnswers(initialAnswers)
                    }
                }
                setLoading(false)
            })
            .catch(err => {
                setApiResponse(`Error: ${err.message}`)
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
        const subject = subjects.find(s => s.id === subjectId)
        try {
            // Build answers array from questions with answers
            const apiAnswers = questions.map((q, index) => {
                const answer = answers.find(a => a.index === index)
                const questionId = q.answer?.questionId || `q_${index}`
                if (q.kind === 'comment') {
                    return { questionId, answer: answer?.comment || '' }
                } else if (q.kind === 'score') {
                    return { questionId, answer: String(answer?.score || 0) }
                }
                return null
            }).filter(Boolean)

            const payload = {
                type: type as 'Team Member' | 'Applicant',
                subjectType: (type === 'Team Member' ? 'Employee' : 'Applicant') as 'Employee' | 'Applicant',
                cardId: apiEntry.cardId,
                subjectId,
                subjectName: subject?.label,
                answers: apiAnswers.filter((a): a is { questionId: string; answer: string } => a !== null)
            }

            // Print curl command to console
            const updateUrl = `${API_BASE_URL}/feedback-entries/${encodeURIComponent(apiEntry.id)}`
            const curlCmd = `curl -X PATCH '${updateUrl}' \\
  -H 'Authorization: Bearer ${apiAccessToken}' \\
  -H 'Content-Type: application/json' \\
  -d '${JSON.stringify(payload)}'`
            console.log('=== SUBMIT FEEDBACK CURL ===')
            console.log(curlCmd)
            console.log('=== END CURL ===')

            await updateFeedbackEntry(apiEntry.id, payload)
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
                    {/* Header info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-slate-700 px-1">Type</Label>
                            <div className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 flex items-center text-sm text-slate-600">
                                {apiEntry.type || type}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-slate-700 px-1">Recipient</Label>
                            <Select
                                value={subjectId || 'none'}
                                onValueChange={(value) => setSubjectId(value === 'none' ? '' : value)}
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
                            <div className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 flex items-center text-sm text-slate-600">
                                {card.title}
                            </div>
                        </div>
                    </div>

                    {/* Questions in order from card.questions */}
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Questions</p>
                        </div>
                        <div className="space-y-3">
                            {questions.map((q, index) => {
                                if (q.kind === 'content') {
                                    // Content block - section header
                                    return (
                                        <div key={index} className="pt-2">
                                            <div className="ql-snow">
                                                <div
                                                    className="ql-editor p-0 text-sm text-slate-700"
                                                    dangerouslySetInnerHTML={{ __html: q.prompt }}
                                                />
                                            </div>
                                        </div>
                                    )
                                } else if (q.kind === 'score') {
                                    // Score question
                                    const current = answers.find(a => a.index === index)?.score ?? 0
                                    return (
                                        <div key={index} className="rounded-2xl border border-slate-200 p-4 space-y-3">
                                            <p className="text-sm font-semibold text-slate-800">
                                                {q.prompt}
                                            </p>
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
                                        </div>
                                    )
                                } else if (q.kind === 'comment') {
                                    // Comment question
                                    const commentValue = answers.find(a => a.index === index)?.comment ?? ''
                                    return (
                                        <div key={index} className="rounded-2xl border border-slate-200 p-4 space-y-3">
                                            <p className="text-sm font-semibold text-slate-800">
                                                {q.prompt}
                                            </p>
                                            <textarea
                                                className="w-full min-h-30 rounded-xl border border-slate-200 p-3 text-sm text-slate-700"
                                                placeholder="Add your comments..."
                                                value={commentValue}
                                                onChange={(e) => handleCommentChange(index, e.target.value)}
                                            />
                                        </div>
                                    )
                                }
                                return null
                            })}
                        </div>
                    </div>

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

                {/* API Debug */}
                <div className="space-y-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Curl Command</p>
                    <pre className="bg-slate-900 text-green-400 p-4 rounded-xl text-xs overflow-x-auto whitespace-pre-wrap">
                        {curlCommand || 'No API access token available'}
                    </pre>

                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">API Response</p>
                    <pre className="bg-slate-900 text-blue-400 p-4 rounded-xl text-xs overflow-x-auto max-h-96 overflow-y-auto whitespace-pre-wrap">
                        {apiResponse || 'Loading...'}
                    </pre>
                </div>
            </div>
    )
}
