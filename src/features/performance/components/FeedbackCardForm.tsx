'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { QuillEditor } from '@/components/ui/quill-editor'
import type { FeedbackQuestion } from '@/types'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { toast } from '@/components/ui/toast'

type FeedbackCardFormProps = {
    initialTitle?: string
    initialSubject?: 'Team Member' | 'Applicant'
    initialQuestions?: FeedbackQuestion[]
    submitLabel: string
    onSubmit: (payload: { title: string; subject: 'Team Member' | 'Applicant'; questions: FeedbackQuestion[] }) => Promise<void>
    onCancel: () => void
    saving?: boolean
}

const createQuestion = (kind: FeedbackQuestion['kind']): FeedbackQuestion => ({
    id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    kind,
    prompt: '',
    weight: kind === 'score' ? 1 : undefined
})

const hasPromptText = (prompt: string) => {
    const cleaned = prompt
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .trim()
    return cleaned.length > 0
}

export function FeedbackCardForm({
    initialTitle = '',
    initialSubject = 'Team Member',
    initialQuestions,
    submitLabel,
    onSubmit,
    onCancel,
    saving = false
}: FeedbackCardFormProps) {
    const [title, setTitle] = useState(initialTitle)
    const [subject, setSubject] = useState<'Team Member' | 'Applicant'>(initialSubject)
    const [questions, setQuestions] = useState<FeedbackQuestion[]>(
        initialQuestions && initialQuestions.length > 0 ? initialQuestions : [createQuestion('score')]
    )

    const handleAddQuestion = (kind: FeedbackQuestion['kind']) => {
        setQuestions(prev => [...prev, createQuestion(kind)])
    }

    const handleRemoveQuestion = (id: string) => {
        setQuestions(prev => prev.filter(q => q.id !== id))
    }

    const handleQuestionChange = (id: string, field: 'prompt' | 'weight', value: string) => {
        setQuestions(prev => prev.map(q => {
            if (q.id !== id) return q
            if (field === 'prompt') {
                return { ...q, prompt: value }
            }
            const parsed = Number.parseInt(value, 10)
            return { ...q, weight: Number.isFinite(parsed) && parsed >= 0 ? parsed : 0 }
        }))
    }

    const moveQuestion = (fromIndex: number, toIndex: number) => {
        if (toIndex < 0 || toIndex >= questions.length) return
        setQuestions(prev => {
            const next = [...prev]
            const [item] = next.splice(fromIndex, 1)
            next.splice(toIndex, 0, item)
            return next
        })
    }

    const validate = () => {
        if (!title.trim()) {
            toast('Please add a title for the feedback card', 'error')
            return false
        }
        if (questions.length === 0) {
            toast('Add at least one question', 'error')
            return false
        }
        const hasEmpty = questions.some(q => {
            if (q.kind === 'content') {
                return !hasPromptText(q.prompt)
            }
            return !q.prompt.trim()
        })
        if (hasEmpty) {
            toast('All questions must have text', 'error')
            return false
        }
        const hasInvalidWeight = questions.some(q => q.kind === 'score' && (!Number.isInteger(q.weight) || (q.weight ?? 0) < 0))
        if (hasInvalidWeight) {
            toast('Question weights must be non-negative whole numbers', 'error')
            return false
        }
        return true
    }

    const handleSubmit = async () => {
        if (!validate()) return
        await onSubmit({
            title: title.trim(),
            subject,
            questions: questions.map(q => ({
                id: q.id,
                kind: q.kind,
                prompt: q.prompt.trim(),
                weight: q.weight
            }))
        })
    }

    return (
        <div className="space-y-5 py-2">
            <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700 px-1">Title</Label>
                <Input
                    className="h-12 rounded-xl border-slate-200"
                    placeholder="Quarterly Performance Review"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
            </div>
            <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700 px-1">Type</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <select
                        className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value as 'Team Member' | 'Applicant')}
                    >
                        <option value="Team Member">Team Member</option>
                        <option value="Applicant">Applicant</option>
                    </select>
                </div>
            </div>

            <div className="space-y-3">
                <Label className="text-sm font-bold text-slate-700 px-1">Questions</Label>
                <div className="space-y-3">
                    {questions.map((q, index) => (
                        <div key={q.id} className="rounded-2xl border border-slate-200 p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    {q.kind === 'content' ? 'Content Block' : 'Question'}
                                </p>
                                <div className="flex items-center gap-1">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-slate-400 hover:text-slate-700"
                                        onClick={() => moveQuestion(index, index - 1)}
                                        disabled={index === 0}
                                    >
                                        <ArrowUp className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-slate-400 hover:text-slate-700"
                                        onClick={() => moveQuestion(index, index + 1)}
                                        disabled={index === questions.length - 1}
                                    >
                                        <ArrowDown className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-slate-400 hover:text-red-500"
                                        onClick={() => handleRemoveQuestion(q.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-[1fr_140px] gap-3 items-start">
                                {q.kind === 'content' ? (
                                    <div className="md:col-span-2 space-y-2">
                                        <QuillEditor
                                            value={q.prompt}
                                            onChange={(value) => handleQuestionChange(q.id, 'prompt', value)}
                                            placeholder="Add any context or instructions for this card..."
                                            className="bg-white"
                                        />
                                        <p className="text-[11px] text-slate-400 px-1">Content block</p>
                                    </div>
                                ) : (
                                    <>
                                        <Input
                                            className="h-11 rounded-xl border-slate-200"
                                            placeholder={q.kind === 'comment' ? 'Comment box label' : 'Describe the employee’s impact on team goals.'}
                                            value={q.prompt}
                                            onChange={(e) => handleQuestionChange(q.id, 'prompt', e.target.value)}
                                        />
                                        {q.kind === 'score' ? (
                                            <div className="space-y-1.5">
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    step={1}
                                                    inputMode="numeric"
                                                    className="h-11 rounded-xl border-slate-200"
                                                    placeholder="Weight"
                                                    value={q.weight ?? 1}
                                                    onKeyDown={(e) => {
                                                        if (e.key === '-' || e.key === '+' || e.key.toLowerCase() === 'e' || e.key === '.') {
                                                            e.preventDefault()
                                                        }
                                                    }}
                                                    onChange={(e) => handleQuestionChange(q.id, 'weight', e.target.value)}
                                                />
                                                <p className="text-[11px] text-slate-400 px-1">Weight (default 1)</p>
                                            </div>
                                        ) : (
                                            <div className="text-xs text-slate-400 px-1 pt-2">Comment box</div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" className="rounded-xl" onClick={() => handleAddQuestion('score')}>
                        Add Question
                    </Button>
                    <Button type="button" variant="outline" className="rounded-xl" onClick={() => handleAddQuestion('comment')}>
                        Add Comment Section
                    </Button>
                    <Button type="button" variant="outline" className="rounded-xl" onClick={() => handleAddQuestion('content')}>
                        Add Content Block
                    </Button>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" className="rounded-xl" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="button" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl" onClick={handleSubmit} disabled={saving}>
                    {saving ? 'Saving...' : submitLabel}
                </Button>
            </div>
        </div>
    )
}
