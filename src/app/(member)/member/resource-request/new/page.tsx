'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/lib/context/AppContext'
import type { ResourceCategory } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from '@/components/ui/toast'
import {
    createResourceRequestApi,
    fetchResourceCategoriesApi,
} from '@/lib/api/client'
import { ResourceRequestForm } from '@/features/member/components/ResourceRequestForm'
import {
    emptyResourceRequestFormValues,
    type ResourceRequestFormValues,
} from '@/lib/validation/resource-request'

export default function MemberNewResourceRequestPage() {
    const router = useRouter()
    const { meProfile, currentCompany, apiCompanyId, apiAccessToken, isHydrating } = useApp()
    const [categories, setCategories] = useState<ResourceCategory[]>([])
    const [categoriesLoading, setCategoriesLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    const companyId = currentCompany?.id || apiCompanyId || ''

    const loadCategories = useCallback(async () => {
        setCategoriesLoading(true)
        try {
            const list = await fetchResourceCategoriesApi()
            setCategories(Array.isArray(list) ? list : [])
        } catch {
            setCategories([])
        } finally {
            setCategoriesLoading(false)
        }
    }, [])

    useEffect(() => {
        loadCategories()
    }, [loadCategories])

    const employeeId = meProfile?.employeeId

    const handleSubmit = async (values: ResourceRequestFormValues) => {
        if (!apiAccessToken) {
            toast('You must be signed in to submit a request.', 'error')
            return
        }
        if (!employeeId) {
            toast('Your account is not linked to an employee profile.', 'error')
            return
        }
        if (!companyId) {
            toast('No company is selected for your account.', 'error')
            return
        }
        setSubmitting(true)
        try {
            await createResourceRequestApi(
                {
                    title: values.title.trim(),
                    categoryId: values.categoryId,
                    description: values.description.trim(),
                    goalAlignment: values.goalAlignment.trim(),
                    priority: values.priority,
                    estimatedCost: Number(values.estimatedCost),
                    productUrl: values.productUrl.trim() || undefined,
                    employeeId,
                    companyId,
                },
                apiAccessToken
            )
            toast('Resource request submitted.', 'success')
            router.push('/member/resource-request')
        } catch {
            toast('Failed to submit resource request. Please try again.', 'error')
            setSubmitting(false)
        }
    }

    if (isHydrating) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <div className="animate-in fade-in duration-500 slide-in-from-bottom-4 space-y-6 max-w-3xl">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push('/member/resource-request')}
                    className="rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">New Request</p>
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Resource Request</h1>
                </div>
            </div>

            <Card className="border border-slate-100 shadow-premium rounded-3xl bg-white">
                <CardContent className="p-8">
                    <ResourceRequestForm
                        initialValues={emptyResourceRequestFormValues}
                        categories={categories}
                        categoriesLoading={categoriesLoading}
                        submitting={submitting}
                        submitLabel="Submit Request"
                        onSubmit={handleSubmit}
                        onCancel={() => router.push('/member/resource-request')}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
