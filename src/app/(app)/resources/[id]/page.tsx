'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, ExternalLink, Loader2 } from 'lucide-react'
import { useApp } from '@/lib/context/AppContext'
import { formatCurrency } from '@/lib/utils'
import type {
    ResourceRequest,
    ResourceRequestAdminStatus,
    ResourceRequestStatusHistoryEntry,
} from '@/types'
import { RESOURCE_REQUEST_ADMIN_STATUSES } from '@/types'
import {
    fetchResourceRequestApi,
    updateResourceRequestStatusApi,
} from '@/lib/api/client'
import { ResourceRequestStatusBadge } from '@/features/member/components/ResourceRequestStatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { toast } from '@/components/ui/toast'

const formatDate = (value?: string) => value ? new Date(value).toLocaleString() : '—'
const capitalize = (value: string) => value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())

export default function ResourceRequestDetailPage() {
    const router = useRouter()
    const params = useParams<{ id: string }>()
    const requestId = params?.id
    const { apiAccessToken, currentCompany, isHydrating } = useApp()
    const [request, setRequest] = useState<ResourceRequest | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [status, setStatus] = useState<ResourceRequestAdminStatus | ''>('')
    const [reviewerNote, setReviewerNote] = useState('')
    const [updating, setUpdating] = useState(false)

    const loadRequest = useCallback(async () => {
        if (!apiAccessToken || !requestId) {
            setLoading(false)
            return
        }
        setLoading(true)
        setError(null)
        try {
            const item = await fetchResourceRequestApi(requestId, apiAccessToken)
            setRequest(item)
            if (!item) setError('Resource request not found.')
        } catch {
            setRequest(null)
            setError('We could not load this resource request. Please try again.')
        } finally {
            setLoading(false)
        }
    }, [apiAccessToken, requestId])

    useEffect(() => {
        if (!isHydrating) void loadRequest()
    }, [isHydrating, loadRequest])

    const handleStatusUpdate = async () => {
        if (!apiAccessToken || !requestId || !status) return
        setUpdating(true)
        try {
            const updated = await updateResourceRequestStatusApi(
                requestId,
                { status, reviewerNote: reviewerNote.trim() || undefined },
                apiAccessToken
            )
            setRequest(updated)
            setStatus('')
            setReviewerNote('')
            toast('Resource request status updated.', 'success')
        } catch (updateError) {
            const message = updateError instanceof Error
                ? updateError.message
                : 'Failed to update resource request status.'
            toast(message, 'error')
        } finally {
            setUpdating(false)
        }
    }

    if (isHydrating || loading) {
        return <div className="flex items-center justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
    }

    if (error || !request) {
        return (
            <div className="space-y-6 max-w-3xl">
                <Button variant="ghost" size="icon" onClick={() => router.push('/resources')} className="rounded-xl">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <Card className="border-red-100 bg-red-50/50">
                    <CardContent className="p-8 text-center space-y-4">
                        <p className="text-sm font-medium text-red-700">{error || 'Resource request not found.'}</p>
                        <Button variant="outline" onClick={loadRequest} className="rounded-2xl">Try again</Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const statusOptions = RESOURCE_REQUEST_ADMIN_STATUSES.filter((option) => option !== request.status)
    const history: ResourceRequestStatusHistoryEntry[] = request.statusHistory?.length
        ? request.statusHistory
        : [{
            status: request.status,
            changedByName: request.employeeName,
            changedAt: request.updatedAt || request.createdAt,
            note: request.reviewerNote,
        }]

    return (
        <div className="animate-in fade-in duration-500 slide-in-from-bottom-4 space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/resources')} className="rounded-xl">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Resource Request</p>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{request.title}</h1>
                    </div>
                </div>
                <ResourceRequestStatusBadge status={request.status} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] gap-6 items-start">
                <div className="space-y-6">
                    <Card className="border border-slate-100 shadow-premium rounded-3xl bg-white">
                        <CardContent className="p-8 space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                                <Detail label="Requested by" value={request.employeeName || '—'} />
                                <Detail label="Category" value={request.category || '—'} />
                                <Detail label="Priority" value={capitalize(request.priority)} />
                                <Detail label="Estimated cost" value={request.estimatedCost != null ? formatCurrency(Number(request.estimatedCost), currentCompany?.currency) : '—'} />
                            </div>
                            <Detail label="Description" value={request.description || '—'} multiline />
                            <Detail label="Goal alignment" value={request.goalAlignment || '—'} multiline />
                            {request.productUrl && (
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Product URL</p>
                                    <a href={request.productUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 break-all">
                                        {request.productUrl}<ExternalLink className="w-3.5 h-3.5 shrink-0" />
                                    </a>
                                </div>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <Detail label="Submitted" value={formatDate(request.createdAt)} />
                                <Detail label="Last updated" value={formatDate(request.updatedAt)} />
                            </div>
                        </CardContent>
                    </Card>

                </div>

                <Card className="border border-slate-100 shadow-premium rounded-3xl bg-white xl:sticky xl:top-24">
                    <CardHeader><CardTitle>Status &amp; Timeline</CardTitle></CardHeader>
                    <CardContent className="space-y-5">
                        <div>
                            <Label htmlFor="request-status">New status</Label>
                            <Select value={status || 'none'} onValueChange={(value) => setStatus(value as ResourceRequestAdminStatus)} disabled={updating}>
                                <SelectTrigger id="request-status" className="mt-2"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none" disabled>Select a status</SelectItem>
                                    {statusOptions.map((option) => <SelectItem key={option} value={option}>{capitalize(option)}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="reviewer-note">Note (optional)</Label>
                            <Textarea
                                id="reviewer-note"
                                value={reviewerNote}
                                onChange={(event) => setReviewerNote(event.target.value)}
                                placeholder="Add a note for the employee"
                                className="mt-2 min-h-[110px]"
                                disabled={updating}
                            />
                        </div>
                        <Button onClick={handleStatusUpdate} disabled={!status || updating} className="w-full rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold">
                            {updating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Update Status
                        </Button>
                        <div className="border-t border-slate-100 pt-5">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-5">Timeline</p>
                            <StatusTimeline history={history} />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function Detail({ label, value, multiline = false }: { label: string; value: string; multiline?: boolean }) {
    return (
        <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
            <p className={`mt-1 text-sm text-slate-700 ${multiline ? 'whitespace-pre-wrap' : 'font-semibold'}`}>{value}</p>
        </div>
    )
}

function StatusTimeline({ history }: { history: ResourceRequestStatusHistoryEntry[] }) {
    return (
        <div>
            {history.map((entry, index) => {
                const isLast = index === history.length - 1
                return (
                    <div key={`${entry.changedAt}-${index}`} className="relative flex gap-3 pb-6 last:pb-0">
                        <div className="relative flex w-3 shrink-0 justify-center">
                            {!isLast && <span className="absolute top-3 bottom-[-24px] w-px bg-slate-200" />}
                            <span className="relative mt-1.5 h-3 w-3 rounded-full border-2 border-blue-600 bg-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <ResourceRequestStatusBadge status={entry.status} />
                            <p className="mt-2 text-sm font-semibold text-slate-900">{entry.changedByName || 'System'}</p>
                            <p className="text-xs text-slate-500">{formatDate(entry.changedAt)}</p>
                            {entry.note && (
                                <p className="mt-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-600 whitespace-pre-wrap">
                                    {entry.note}
                                </p>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}