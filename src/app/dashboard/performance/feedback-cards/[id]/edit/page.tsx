'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { Card, CardContent } from '@/components/ui/card'
import { FeedbackCardForm } from '@/components/performance/FeedbackCardForm'
import { useApp } from '@/lib/context/AppContext'
import { toast } from '@/components/ui/toast'

export default function EditFeedbackCardPage() {
    const router = useRouter()
    const params = useParams()
    const { feedbackCards, updateFeedbackCard } = useApp()
    const [saving, setSaving] = useState(false)

    const cardId = params.id as string
    const card = useMemo(() => feedbackCards.find(c => c.id === cardId) || null, [feedbackCards, cardId])

    useEffect(() => {
        if (!card && feedbackCards.length > 0) {
            toast('Feedback card not found', 'error')
            router.push('/dashboard/performance/feedback-cards')
        }
    }, [card, feedbackCards.length, router])

    const handleSave = async (payload: { title: string; subject: 'Team Member' | 'Applicant'; questions: { id: string; kind: 'score' | 'comment'; prompt: string; weight?: number }[] }) => {
        if (!card) return
        setSaving(true)
        try {
            await updateFeedbackCard(card.id, payload)
            toast('Feedback card updated', 'success')
            router.push('/dashboard/performance/feedback-cards')
        } catch (error) {
            toast('Failed to update feedback card', 'error')
        } finally {
            setSaving(false)
        }
    }

    if (!card) {
        return (
            <DashboardShell>
                <div className="p-8 text-center text-slate-500">Loading feedback card...</div>
            </DashboardShell>
        )
    }

    return (
        <DashboardShell>
            <div className="animate-in fade-in duration-500 slide-in-from-bottom-4 space-y-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Edit Feedback Card</h1>
                    <p className="text-slate-500 font-medium">Update the card title and questions.</p>
                </div>

                <Card className="border border-slate-100 shadow-premium rounded-3xl bg-white overflow-hidden">
                    <CardContent className="p-8">
                        <FeedbackCardForm
                            initialTitle={card.title}
                            initialSubject={card.subject}
                            initialQuestions={card.questions}
                            submitLabel="Save Changes"
                            onSubmit={handleSave}
                            onCancel={() => router.push('/dashboard/performance/feedback-cards')}
                            saving={saving}
                        />
                    </CardContent>
                </Card>
            </div>
        </DashboardShell>
    )
}
