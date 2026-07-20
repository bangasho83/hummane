'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Loader2, Package, Search } from 'lucide-react'
import { useApp } from '@/lib/context/AppContext'
import { formatCurrency } from '@/lib/utils'
import type { ResourceRequest } from '@/types'
import { RESOURCE_REQUEST_PRIORITIES, RESOURCE_REQUEST_STATUSES } from '@/types'
import { fetchResourceRequestsApi } from '@/lib/api/client'
import { ResourceRequestStatusBadge } from '@/features/member/components/ResourceRequestStatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'

const capitalize = (value: string) => value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())

export default function ResourcesPage() {
    const { apiAccessToken, currentCompany, isHydrating } = useApp()
    const [requests, setRequests] = useState<ResourceRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [priorityFilter, setPriorityFilter] = useState<string>('all')
    const [categoryFilter, setCategoryFilter] = useState<string>('all')

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

    const categories = useMemo(() => {
        const unique = [...new Set(requests.map((r) => r.category || '').filter(Boolean))]
        return unique.sort()
    }, [requests])

    const filteredRequests = useMemo(() => {
        const term = searchTerm.trim().toLowerCase()
        return requests.filter((request) => {
            const matchesSearch =
                !term ||
                request.title.toLowerCase().includes(term) ||
                (request.employeeName || '').toLowerCase().includes(term) ||
                (request.category || '').toLowerCase().includes(term)

            const matchesStatus = statusFilter === 'all' || request.status === statusFilter
            const matchesPriority = priorityFilter === 'all' || request.priority === priorityFilter
            const matchesCategory = categoryFilter === 'all' || request.category === categoryFilter

            return matchesSearch && matchesStatus && matchesPriority && matchesCategory
        })
    }, [requests, searchTerm, statusFilter, priorityFilter, categoryFilter])

    const hasActiveFilters =
        !!searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all'

    const clearFilters = () => {
        setSearchTerm('')
        setStatusFilter('all')
        setPriorityFilter('all')
        setCategoryFilter('all')
    }

    return (
        <div className="animate-in fade-in duration-500 slide-in-from-bottom-4 space-y-6">
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Requests</h1>
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
                    <CardContent className="p-0">
                        <div className="p-8 border-b border-slate-100">
                            <div className="flex items-center gap-4 flex-wrap">
                                <div className="flex-1 min-w-[300px]">
                                    <div className="relative group">
                                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-blue-500 transition-colors" />
                                        <Input
                                            placeholder="Search requests..."
                                            className="pl-11 bg-slate-50 border-slate-100 h-12 rounded-2xl focus-visible:ring-blue-500/20"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 flex-wrap">
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="w-40 bg-slate-50 border-slate-100 h-12 rounded-2xl">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Statuses</SelectItem>
                                            {RESOURCE_REQUEST_STATUSES.map((status) => (
                                                <SelectItem key={status} value={status}>{capitalize(status)}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                                        <SelectTrigger className="w-40 bg-slate-50 border-slate-100 h-12 rounded-2xl">
                                            <SelectValue placeholder="Priority" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Priorities</SelectItem>
                                            {RESOURCE_REQUEST_PRIORITIES.map((priority) => (
                                                <SelectItem key={priority} value={priority}>{capitalize(priority)}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                        <SelectTrigger className="w-44 bg-slate-50 border-slate-100 h-12 rounded-2xl">
                                            <SelectValue placeholder="Category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Categories</SelectItem>
                                            {categories.map((category) => (
                                                <SelectItem key={category} value={category}>{category}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {hasActiveFilters && (
                                        <button
                                            type="button"
                                            onClick={clearFilters}
                                            className="text-sm font-semibold text-slate-500 hover:text-red-500"
                                        >
                                            Reset
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow className="hover:bg-transparent border-slate-100">
                                    <TableHead className="pl-8 py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Request</TableHead>
                                    <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Requested by</TableHead>
                                    <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Category</TableHead>
                                    <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Priority</TableHead>
                                    <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Est. Cost</TableHead>
                                    <TableHead className="py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Status</TableHead>
                                    <TableHead className="py-4 pr-8 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredRequests.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="p-20 text-center">
                                            <Package className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                                            <p className="font-medium text-slate-500">
                                                {hasActiveFilters
                                                    ? 'No requests match your filters.'
                                                    : 'No resource requests yet.'}
                                            </p>
                                            {hasActiveFilters && (
                                                <button
                                                    type="button"
                                                    onClick={clearFilters}
                                                    className="mt-3 text-sm font-semibold text-blue-600 hover:text-blue-700"
                                                >
                                                    Clear filters
                                                </button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ) : filteredRequests.map((request) => (
                                    <TableRow key={request.id} className="hover:bg-slate-50/50 border-slate-50">
                                        <TableCell className="pl-8 py-5">
                                            <Link
                                                href={`/resources/${request.id}`}
                                                className="font-bold text-slate-900 hover:text-slate-700 transition-colors"
                                            >
                                                {request.title}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="py-5 text-sm text-slate-600">{request.employeeName || '—'}</TableCell>
                                        <TableCell className="py-5 text-sm text-slate-600">{request.category || '—'}</TableCell>
                                        <TableCell className="py-5 text-sm text-slate-600 capitalize">{request.priority}</TableCell>
                                        <TableCell className="py-5 text-sm text-slate-600">
                                            {request.estimatedCost != null
                                                ? formatCurrency(Number(request.estimatedCost), currentCompany?.currency)
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
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}