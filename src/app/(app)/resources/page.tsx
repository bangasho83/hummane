'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, Package } from 'lucide-react'
import { useApp } from '@/lib/context/AppContext'
import type { ResourceRequest } from '@/types'
import { fetchResourceRequestsApi } from '@/lib/api/client'
import { ResourceRequestStatusBadge } from '@/features/member/components/ResourceRequestStatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'

export default function ResourcesPage() {
    const { apiAccessToken, isHydrating } = useApp()
    const [requests, setRequests] = useState<ResourceRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const loadRequests = useCallback(async () => {
        if (!apiAccessToken) {
            setLoading(false)
            return
        }

        setLoading(true)
        setError(null)
        try {
            setRequests(await fetchResourceRequestsApi(apiAccessToken))
        } catch {
            setRequests([])
            setError('We could not load resource requests. Please try again.')
        } finally {
            setLoading(false)
        }
    }, [apiAccessToken])

    useEffect(() => {
        if (!isHydrating) void loadRequests()
    }, [isHydrating, loadRequests])

    return (
        <div className="animate-in fade-in duration-500 slide-in-from-bottom-4 space-y-6">
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Resources</h1>
                <p className="text-slate-500 font-medium">Review resource requests from your team.</p>
            </div>

            {isHydrating || loading ? (
                <div className="flex items-center justify-center p-20">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            ) : error ? (
                <Card className="border-red-100 bg-red-50/50">
                    <CardContent className="p-8 text-center space-y-4">
                        <p className="text-sm font-medium text-red-700">{error}</p>
                        <Button variant="outline" onClick={loadRequests} className="rounded-2xl">
                            Try again
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Card className="border border-slate-100 shadow-premium rounded-3xl bg-white overflow-hidden">
                    <CardContent className="p-0 overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow className="hover:bg-transparent border-slate-100">
                                    <TableHead className="pl-8 py-4">Request</TableHead>
                                    <TableHead className="py-4">Requested by</TableHead>
                                    <TableHead className="py-4">Category</TableHead>
                                    <TableHead className="py-4">Priority</TableHead>
                                    <TableHead className="py-4">Est. Cost</TableHead>
                                    <TableHead className="py-4">Status</TableHead>
                                    <TableHead className="py-4 pr-8">Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requests.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="p-20 text-center">
                                            <Package className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                                            <p className="font-medium text-slate-500">No resource requests yet.</p>
                                        </TableCell>
                                    </TableRow>
                                ) : requests.map((request) => (
                                    <TableRow key={request.id} className="hover:bg-slate-50/50 border-slate-50">
                                        <TableCell className="pl-8 py-5 font-semibold text-slate-900">{request.title}</TableCell>
                                        <TableCell className="py-5 text-sm text-slate-600">{request.employeeName || '—'}</TableCell>
                                        <TableCell className="py-5 text-sm text-slate-600">{request.category || '—'}</TableCell>
                                        <TableCell className="py-5 text-sm text-slate-600 capitalize">{request.priority}</TableCell>
                                        <TableCell className="py-5 text-sm text-slate-600">
                                            {request.estimatedCost != null
                                                ? Number(request.estimatedCost).toLocaleString()
                                                : '—'}
                                        </TableCell>
                                        <TableCell className="py-5">
                                            <ResourceRequestStatusBadge status={request.status} />
                                        </TableCell>
                                        <TableCell className="py-5 pr-8 text-sm text-slate-500">
                                            {new Date(request.createdAt).toLocaleDateString()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}