'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useApp } from '@/lib/context/AppContext'
import type { ResourceRequest } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { fetchResourceRequestApi } from '@/lib/api/client'
import { ResourceRequestStatusBadge } from '@/features/member/components/ResourceRequestStatusBadge'

export default function MemberResourceRequestDetailPage() {
    const router = useRouter()
    const params = useParams<{ id: string }>()
    const requestId = params?.id
    const { apiAccessToken, isHydrating } = useApp()

    const [request, setRequest] = useState<ResourceRequest | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const load = useCallback(async () => {
        if (!apiAccessToken || !requestId) {
            setLoading(false)
            return
        }
        setLoading(true)
        setError(null)
        try {
            const req = await fetchResourceRequestApi(requestId, apiAccessToken)
            if (!req) {
                setError('Resource request not found.')
            }
            setRequest(req)
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

    if (isHydrating || loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    if (error || !request) {
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
                <ResourceRequestStatusBadge status={request.status} />
            </div>

            <Card className="border border-slate-100 shadow-premium rounded-3xl bg-white">
                <CardContent className="p-8">
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Category</p>
                                <p className="font-semibold text-slate-900">{request.category || '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Priority</p>
                                <p className="font-semibold text-slate-900 capitalize">{request.priority}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Estimated Cost</p>
                                <p className="font-semibold text-slate-900">
                                    {request.estimatedCost != null
                                        ? Number(request.estimatedCost).toLocaleString()
                                        : '—'}
                                </p>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Description</p>
                            <p className="text-sm text-slate-700 whitespace-pre-wrap mt-1">{request.description || '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Goal Alignment</p>
                            <p className="text-sm text-slate-700 whitespace-pre-wrap mt-1">{request.goalAlignment || '—'}</p>
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
                </CardContent>
            </Card>
        </div>
    )
}
