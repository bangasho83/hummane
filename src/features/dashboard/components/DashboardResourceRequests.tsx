'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ClipboardList, Loader2 } from 'lucide-react'
import type { ResourceRequest } from '@/types'
import { Button } from '@/components/ui/button'
import { ResourceRequestStatusBadge } from '@/features/member/components/ResourceRequestStatusBadge'
import { fetchResourceRequestsApi } from '@/lib/api/client'
import { useApp } from '@/lib/context/AppContext'
import { getRecentResourceRequests } from '../resource-requests'

interface DashboardResourceRequestsProps {
    onCountChange?: (count: number) => void
}

export function DashboardResourceRequests({ onCountChange }: DashboardResourceRequestsProps) {
    const { apiAccessToken, isHydrating } = useApp()
    const [requests, setRequests] = useState<ResourceRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    const loadRequests = useCallback(async () => {
        if (!apiAccessToken) {
            onCountChange?.(0)
            setLoading(false)
            return
        }

        setLoading(true)
        setError(false)
        try {
            const allRequests = await fetchResourceRequestsApi(apiAccessToken)
            setRequests(getRecentResourceRequests(allRequests))
            onCountChange?.(allRequests.length)
        } catch {
            setRequests([])
            onCountChange?.(0)
            setError(true)
        } finally {
            setLoading(false)
        }
    }, [apiAccessToken, onCountChange])

    useEffect(() => {
        if (!isHydrating) void loadRequests()
    }, [isHydrating, loadRequests])

    return (
        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-premium xl:col-span-2">
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 p-8">
                <div>
                    <h3 className="text-xl font-bold text-slate-900">Resource Requests</h3>
                    <p className="text-sm text-slate-500">Latest requests submitted by your team.</p>
                </div>
                <Link href="/resources" className="shrink-0 text-sm font-semibold text-blue-600 hover:text-blue-700">
                    View All →
                </Link>
            </div>

            {isHydrating || loading ? (
                <div className="flex min-h-56 items-center justify-center">
                    <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
                </div>
            ) : error ? (
                <div className="flex min-h-56 flex-col items-center justify-center gap-4 p-8 text-center">
                    <p className="text-sm font-medium text-red-700">We could not load resource requests.</p>
                    <Button variant="outline" className="rounded-xl" onClick={() => void loadRequests()}>
                        Try again
                    </Button>
                </div>
            ) : requests.length === 0 ? (
                <div className="flex min-h-56 flex-col items-center justify-center p-8 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50">
                        <ClipboardList className="h-6 w-6 text-slate-300" />
                    </div>
                    <p className="text-sm font-medium text-slate-500">No resource requests yet.</p>
                </div>
            ) : (
                <div className="divide-y divide-slate-100">
                    {requests.map((request) => (
                        <Link
                            key={request.id}
                            href={`/resources/${request.id}`}
                            className="grid gap-3 px-8 py-5 transition-colors hover:bg-slate-50 sm:grid-cols-[minmax(0,1fr)_140px_120px] sm:items-center"
                        >
                            <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-slate-900">{request.title}</p>
                                <p className="mt-1 truncate text-xs text-slate-500">
                                    {request.employeeName || 'Employee'} • {request.category || 'Uncategorized'}
                                </p>
                            </div>
                            <ResourceRequestStatusBadge status={request.status} />
                            <p className="text-xs font-medium text-slate-400 sm:text-right">
                                {new Date(request.createdAt).toLocaleDateString()}
                            </p>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}