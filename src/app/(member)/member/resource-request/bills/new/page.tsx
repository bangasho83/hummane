'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createResourceApi } from '@/lib/api/client'
import { useApp } from '@/lib/context/AppContext'
import { buildReimbursementPayload, type ReimbursementFormValues } from '@/lib/validation/reimbursement'
import { ReimbursementForm } from '@/features/member/components/ReimbursementForm'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'

export default function NewMemberReimbursementPage() {
    const router = useRouter()
    const { apiAccessToken, meProfile } = useApp()
    const [submitting, setSubmitting] = useState(false)
    const listPath = '/member/resource-request/bills'

    const submit = async (values: ReimbursementFormValues) => {
        if (!apiAccessToken) { toast('You must be signed in to submit a reimbursement.', 'error'); return }
        if (!meProfile?.employeeId) { toast('Your account is not linked to an employee profile.', 'error'); return }
        setSubmitting(true)
        try {
            await createResourceApi(buildReimbursementPayload(values, meProfile.employeeId), apiAccessToken)
            toast('Reimbursement submitted.', 'success')
            router.push(listPath)
            router.refresh()
        } catch (error) {
            toast(error instanceof Error ? error.message : 'Failed to submit reimbursement.', 'error')
            setSubmitting(false)
        }
    }

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <div className="flex items-center gap-4"><Button variant="ghost" size="icon" onClick={() => router.push(listPath)} className="rounded-xl"><ArrowLeft className="h-5 w-5" /></Button><div><p className="text-xs font-bold uppercase tracking-widest text-slate-400">New bill</p><h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Request reimbursement</h2></div></div>
            <ReimbursementForm submitting={submitting} onSubmit={(values) => void submit(values)} onCancel={() => router.push(listPath)} />
        </div>
    )
}
