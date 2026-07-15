'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useApp } from '@/lib/context/AppContext'
import type { ResourceRequest } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Package, Loader2, Plus } from 'lucide-react'
import { fetchResourceRequestsApi } from '@/lib/api/client'
import { ResourceRequestStatusBadge } from '@/features/member/components/ResourceRequestStatusBadge'

export default function MemberResourceRequestPage() {
    const { employees, meProfile, isHydrating, apiAccessToken } = useApp()
    const [requests, setRequests] = useState<ResourceRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const employeeId = meProfile?.employeeId
    const isDataLoading = isHydrating || (!meProfile && employees.length === 0)

    const fetchRequests = useCallback(async () => {
        if (!apiAccessToken) {
            setLoading(false)
            return
        }
        setLoading(true)
        setError(null)
        try {
            const list = await fetchResourceRequestsApi(apiAccessToken)
            setRequests(Array.isArray(list) ? list : [])
        } catch {
            setError('We could not load your resource requests. Please try again.')
            setRequests([])
        } finally {
            setLoading(false)
        }
    }, [apiAccessToken])

    useEffect(() => {
        if (!isDataLoading) {
            fetchRequests()
        }
    }, [isDataLoading, fetchRequests])

    if (isDataLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    if (!employeeId) {
        return (
            <div className="animate-in fade-in duration-500 slide-in-from-bottom-4 space-y-6">
                <div>
                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Requests</h2>
                    <p className="text-slate-500 font-medium">Request the resources you need to do your best work.</p>
                </div>
                <Card className="border-dashed">
                    <CardHeader className="text-center pb-4">
                        <div className="mx-auto w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mb-4">
                            <Package className="w-8 h-8 text-amber-600" />
                        </div>
                        <CardTitle className="text-xl">No Employee Profile Linked</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center text-slate-500">
                        <p>
                            Your account is not linked to an employee profile.
                            <br />
                            Please contact your administrator.
                        </p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="animate-in fade-in duration-500 slide-in-from-bottom-4 space-y-6">
            <div className="flex items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Requests</h2>
                    <p className="text-slate-500 font-medium">Request the resources you need to do your best work.</p>
                </div>
                <Button
                    asChild
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 px-6 py-6 h-auto"
                >
                    <Link href="/member/resource-request/new">
                        <Plus className="w-5 h-5 mr-2" />
                        New Request
                    </Link>
                </Button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            ) : error ? (
                <Card className="border-red-100 bg-red-50/50">
                    <CardContent className="p-8 text-center space-y-4">
                        <p className="text-sm font-medium text-red-700">{error}</p>
                        <Button variant="outline" onClick={fetchRequests} className="rounded-2xl">
                            Try again
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Card className="border border-slate-100 shadow-premium rounded-3xl bg-white">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow className="hover:bg-transparent border-slate-100">
                                    <TableHead className="pl-8 py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Title</TableHead>
                                    <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Category</TableHead>
                                    <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Priority</TableHead>
                                    <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Est. Cost</TableHead>
                                    <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Status</TableHead>
                                    <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requests.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="py-12 text-center text-slate-500">
                                            No resource requests yet. Create your first one.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    requests.map((request) => (
                                        <TableRow key={request.id} className="hover:bg-slate-50/50 border-slate-50">
                                            <TableCell className="pl-8 py-5">
                                                <Link
                                                    href={`/member/resource-request/${request.id}`}
                                                    className="font-bold text-slate-900 hover:text-slate-700 transition-colors"
                                                >
                                                    {request.title}
                                                </Link>
                                            </TableCell>
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
                                            <TableCell className="py-5 text-sm text-slate-500">
                                                {new Date(request.createdAt).toLocaleDateString()}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
