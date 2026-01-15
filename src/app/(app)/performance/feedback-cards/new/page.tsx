'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { FeedbackCardForm } from '@/features/performance'
import { useApp } from '@/lib/context/AppContext'
import { toast } from '@/components/ui/toast'

export default function NewFeedbackCardPage() {
    const router = useRouter()
    const { createFeedbackCard, currentCompany } = useApp()
    const [saving, setSaving] = useState(false)

    const handleSave = async (payload: { title: string; subject: 'Team Member' | 'Applicant'; questions: { id: string; kind: 'score' | 'comment' | 'content'; prompt: string; weight?: number }[] }) => {
        setSaving(true)
        try {
            const apiPayload = {
                title: payload.title,
                subject: payload.subject,
                questions: payload.questions.map(question => ({
                    prompt: question.prompt,
                    type: question.kind === 'comment' ? 'text' : question.kind === 'content' ? 'content' : 'score',
                    weight: question.kind === 'score' ? question.weight : undefined
                })),
                companyId: currentCompany?.id || 'YOUR_COMPANY_ID'
            }
            await createFeedbackCard(payload)
            toast('Feedback card created', 'success')
            router.push('/performance/feedback-cards')
        } catch (error) {
            toast('Failed to create feedback card', 'error')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="animate-in fade-in duration-500 slide-in-from-bottom-4 space-y-6">
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Add Feedback Card</h1>
                <p className="text-slate-500 font-medium">Create a new feedback template with weighted questions.</p>
            </div>

            <Card className="border border-slate-100 shadow-premium rounded-3xl bg-white overflow-hidden">
                <CardContent className="p-8">
                    <FeedbackCardForm
                        submitLabel="Save Feedback Card"
                        onSubmit={handleSave}
                        onCancel={() => router.push('/performance/feedback-cards')}
                        saving={saving}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
