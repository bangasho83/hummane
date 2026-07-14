'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useApp } from '@/lib/context/AppContext'
import type { ResourceCategory, ResourceRequest } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2, Pencil } from 'lucide-react'
import { toast } from '@/components/ui/toast'
import {
    fetchResourceCategoriesApi,
    fetchResourceRequestApi,
    updateResourceRequestApi,
} from '@/lib/api/client'
import { ResourceRequestForm } from '@/features/member/components/ResourceRequestForm'
import { ResourceRequestStatusBadge } from '@/features/member/components/ResourceRequestStatusBadge'
import type { ResourceRequestFormValues } from '@/lib/validation/resource-request'

export default function MemberResourceRequestDetailPage() {
    const router = useRouter()
    const params = useParams<{ id: string }>()
    const requestId = params?.id
    const { meProfile, currentCompany, apiCompanyId, apiAccessToken, isHydrating } = useApp()

    const [request, setRequest] = useState<ResourceRequest | null>(null)
    const [categories, setCategories] = useState<ResourceCategory[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [editing, setEditing] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    const companyId = currentCompany?.id || apiCompanyId || ''

    const load = useCallback(async () => {
        if (!apiAccessToken || !requestId) {
            setLoading(false)
            return
        }
        setLoading(true)
        setError(null)
        try {
            const [req, cats] = await Promise.all([
                fetchResourceRequestApi(requestId, apiAccessToken),
                fetchResourceCategoriesApi().catch(() => []),
            ])
            if (!req) {
                setError('Resource request not found.')
            }
            setRequest(req)
            setCategories(Array.isArray(cats) ? cats : [])
        } catch {
            setError('We could not load this resource request. Please try again.')
        } finally {
            setLoading(false)
        }
    }, [apiAccessToken, requestId])

    useEffect(() => {
        if (!isHydrating) {
            load()
        }
    }, [isHydrating, load])

    const initialValues: ResourceRequestFormValues | null = useMemo(() => {
        if (!request) return null
        return {
            title: request.title || '',
            categoryId: request.categoryId || '',
            description: request.description || '',
            goalAlignment: request.goalAlignment || '',
            priority: request.priority || '',
            estimatedCost:
                request.estimatedCost != null ? String(request.estimatedCost) : '',
            productUrl: request.productUrl || '',
        }
    }, [request])

    const employeeId = meProfile?.employeeId

    const handleSubmit = async (values: ResourceRequestFormValues) => {
        if (!apiAccessToken || !requestId) return
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
            const updated = await updateResourceRequestApi(
                requestId,
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
            setRequest(updated)
            setEditing(false)
            toast('Resource request updated.', 'success')
        } catch {
            toast('Failed to update resource request. Please try again.', 'error')
        } finally {
            setSubmitting(false)
        }
    }

    if (isHydrating || loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    if (error || !request || !initialValues) {
        return (
            <div className="animate-in fade-in duration-500 space-y-6 max-w-3xl">
                <Button variant="ghost" size="icon" onClick={() => router.push('/member/resource-request')} className="rounded-xl">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <Card className="border-red-100 bg-red-50/50">
                    <CardContent className="p-8 text-center text-sm font-medium text-red-700">
                        {error || 'Resource request not found.'}
                    </CardContent>
                </Card>
            </div>
        )
    }

    const isPending = request.status === 'Pending'

    return (
        <div className="animate-in fade-in duration-500 slide-in-from-bottom-4 space-y-6 max-w-3xl">
            <div className="flex items-center justify-between gap-4">
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
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Resource Request</p>
                        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{request.title}</h1>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <ResourceRequestStatusBadge status={request.status} />
                    {isPending && !editing && (
                        <Button variant="outline" onClick={() => setEditing(true)} className="rounded-2xl">
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                        </Button>
                    )}
                </div>
            </div>

            <Card className="border border-slate-100 shadow-premium rounded-3xl bg-white">
                <CardContent className="p-8">
                    {editing ? (
                        <ResourceRequestForm
                            initialValues={initialValues}
                            categories={categories}
                            submitting={submitting}
                            submitLabel="Save Changes"
                            onSubmit={handleSubmit}
                            onCancel={() => setEditing(false)}
                        />
                    ) : (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Category</p>
                                    <p className="font-semibold text-slate-900">{request.categoryName || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Priority</p>
                                    <p className="font-semibold text-slate-900">{request.priority}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Estimated Cost</p>
                                    <p className="font-semibold text-slate-900">{Number(request.estimatedCost).toLocaleString()}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Description</p>
                                <p className="text-sm text-slate-700 whitespace-pre-wrap mt-1">{request.description}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Goal Alignment</p>
                                <p className="text-sm text-slate-700 whitespace-pre-wrap mt-1">{request.goalAlignment}</p>
                            </div>
                            {request.productUrl && (
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Product URL</p>
                                    <a href={request.productUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-600 hover:text-blue-700 break-all">
                                        {request.productUrl}
                                    </a>
                                </div>
                            )}
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Submitted</p>
                                <p className="text-sm text-slate-700 mt-1">{new Date(request.createdAt).toLocaleString()}</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
