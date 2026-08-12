'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Loader2, Pencil, Plus, RefreshCw, Search } from 'lucide-react'
import type { Resource, Vendor } from '@/types'
import { RESOURCE_STATUSES } from '@/types'
import { deleteResourceApi, fetchResourcesApi, fetchVendorsApi } from '@/lib/api/client'
import { useApp } from '@/lib/context/AppContext'
import { formatCurrency } from '@/lib/utils'
import { toast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DeleteResourceDialog } from './DeleteResourceDialog'
import { ResourceBadge } from './ResourceBadge'
import {
    asRecord,
    assignmentEmployeeName,
    employeeDisplayName,
    formatResourceDate,
    resourceAssignment,
    resourceCost,
    resourceCostType,
    resourceDetails,
    resourceId,
    resourceName,
    resourceStatus,
    resourceVendor,
    textValue,
} from '@/features/resources/resource-ui'

export function SubscriptionList() {
    const { apiAccessToken, currentCompany, employees, isHydrating } = useApp()
    const [subscriptions, setSubscriptions] = useState<Resource[]>([])
    const [vendors, setVendors] = useState<Vendor[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')

    const load = useCallback(async () => {
        if (!apiAccessToken) { setLoading(false); return }
        setLoading(true)
        try {
            const [items, vendorItems] = await Promise.all([
                fetchResourcesApi(apiAccessToken, { resourceType: 'subscription', limit: 100 }),
                fetchVendorsApi(apiAccessToken).catch(() => [] as Vendor[]),
            ])
            setSubscriptions(items)
            setVendors(vendorItems)
        } catch { setSubscriptions([]) }
        finally { setLoading(false) }
    }, [apiAccessToken])

    useEffect(() => { if (!isHydrating) void load() }, [isHydrating, load])

    const employeeNames = useMemo(() => new Map(employees.map((employee) => [employee.id, employeeDisplayName(asRecord(employee))])), [employees])
    const vendorNames = useMemo(() => new Map(vendors.map((vendor) => [vendor.id, vendor.name])), [vendors])
    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase()
        return subscriptions.filter((subscription) => {
            const details = resourceDetails(subscription)
            const assignee = assignmentEmployeeName(resourceAssignment(subscription), employeeNames)
            const searchText = `${resourceName(subscription)} ${resourceVendor(subscription, vendorNames)} ${textValue(details.accountEmail)} ${assignee}`.toLowerCase()
            return (!term || searchText.includes(term)) && (statusFilter === 'all' || resourceStatus(subscription) === statusFilter)
        })
    }, [employeeNames, search, statusFilter, subscriptions, vendorNames])

    const remove = async (subscription: Resource) => {
        if (!apiAccessToken) return
        try {
            await deleteResourceApi(resourceId(subscription), apiAccessToken)
            setSubscriptions((current) => current.filter((item) => resourceId(item) !== resourceId(subscription)))
            toast('Subscription deleted.', 'success')
        } catch (error) {
            toast(error instanceof Error ? error.message : 'Failed to delete subscription', 'error')
            throw error
        }
    }

    return <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-500">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end"><div><h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Subscriptions</h1><p className="font-medium text-slate-500">Manage software subscriptions, recurring costs, seats, and renewal dates.</p></div><Button asChild className="h-auto rounded-2xl bg-blue-600 px-6 py-4 font-bold text-white"><Link href="/resources/subscriptions/new"><Plus className="h-5 w-5" />Add subscription</Link></Button></div>
        <Card className="overflow-hidden rounded-3xl border-slate-100 bg-white shadow-premium"><CardContent className="p-0">
            <div className="flex flex-wrap gap-3 border-b border-slate-100 p-5 sm:p-8"><div className="relative min-w-[240px] flex-1"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search subscriptions, vendors, accounts, or assignees…" className="h-12 rounded-2xl border-slate-100 bg-slate-50 pl-11" /></div><Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="h-12 w-[170px] rounded-2xl border-slate-100 bg-slate-50"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{RESOURCE_STATUSES.map((status) => <SelectItem key={status} value={status}>{status.replace('_', ' ')}</SelectItem>)}</SelectContent></Select></div>
            {isHydrating || loading ? <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div> : filtered.length === 0 ? <div className="p-20 text-center"><RefreshCw className="mx-auto mb-4 h-10 w-10 text-slate-300" /><p className="font-medium text-slate-500">No subscriptions found.</p></div> : <div className="overflow-x-auto"><Table className="min-w-[1100px]"><TableHeader className="bg-slate-50/50"><TableRow className="border-slate-100 hover:bg-transparent"><TableHead className="pl-8">Subscription</TableHead><TableHead>Status</TableHead><TableHead>Vendor</TableHead><TableHead>Seats</TableHead><TableHead>Renewal</TableHead><TableHead>Cost</TableHead><TableHead>Assignee</TableHead><TableHead className="pr-8 text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{filtered.map((subscription) => { const id = resourceId(subscription); const details = resourceDetails(subscription); const cost = resourceCost(subscription); const assignee = assignmentEmployeeName(resourceAssignment(subscription), employeeNames) || 'Company'; return <TableRow key={id} className="border-slate-50"><TableCell className="py-5 pl-8"><Link href={`/resources/subscriptions/${id}`} className="font-bold text-slate-900 hover:text-blue-600">{resourceName(subscription)}</Link><span className="block text-xs text-slate-400">{textValue(details.accountEmail) || 'No account email'}</span></TableCell><TableCell className="py-5"><ResourceBadge value={resourceStatus(subscription)} /></TableCell><TableCell className="py-5 text-sm text-slate-600">{resourceVendor(subscription, vendorNames) || '—'}</TableCell><TableCell className="py-5 text-sm text-slate-600">{textValue(details.numberOfSeats) || '—'}</TableCell><TableCell className="py-5 text-sm text-slate-600">{formatResourceDate(details.renewalDate)}</TableCell><TableCell className="py-5 text-sm text-slate-600"><span className="font-semibold text-slate-800">{cost == null ? '—' : formatCurrency(cost, currentCompany?.currency)}</span>{resourceCostType(subscription) && <span className="block text-xs text-slate-400">{resourceCostType(subscription).replace('_', ' ')}</span>}</TableCell><TableCell className="py-5 text-sm text-slate-600">{assignee}</TableCell><TableCell className="py-5 pr-8"><div className="flex justify-end gap-1"><Button asChild variant="ghost" size="icon" aria-label="Edit subscription"><Link href={`/resources/subscriptions/${id}/edit`}><Pencil /></Link></Button><DeleteResourceDialog name={resourceName(subscription)} onDelete={() => remove(subscription)} /></div></TableCell></TableRow> })}</TableBody></Table></div>}
            <div className="border-t border-slate-50 bg-slate-50/30 px-8 py-5 text-xs font-bold uppercase tracking-widest text-slate-400">{filtered.length} {filtered.length === 1 ? 'subscription' : 'subscriptions'}</div>
        </CardContent></Card>
    </div>
}