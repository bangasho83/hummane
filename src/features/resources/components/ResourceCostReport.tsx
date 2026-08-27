'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { BarChart3, Loader2, Search } from 'lucide-react'
import type { Resource, ResourceStatus, ResourceType, Vendor } from '@/types'
import { fetchResourceCostReportApi, fetchResourcesApi, fetchVendorsApi, type ResourceCostReport } from '@/lib/api/client'
import { useApp } from '@/lib/context/AppContext'
import { formatCurrency } from '@/lib/utils'
import { toast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { asRecord, employeeDisplayName, resourceCost, resourceDate, resourceDetails, resourceName, resourceType, resourceVendor, textValue } from '@/features/resources/resource-ui'

const BILL_TYPES = new Set(['expense', 'reimbursement', 'event'])
const STATUS_OPTIONS = ['active', 'inactive', 'maintenance', 'lost', 'retired']
const emptyReport: ResourceCostReport = { totalCost: 0, resourceCount: 0, recurringCost: 0, unsettledCost: 0, byTemplate: [], byEmployee: [] }

type ReportTab = 'overview' | 'subscriptions' | 'bills'

export function ResourceCostReport() {
    const { apiAccessToken, currentCompany, employees, isHydrating } = useApp()
    const [resources, setResources] = useState<Resource[]>([])
    const [vendors, setVendors] = useState<Vendor[]>([])
    const [tab, setTab] = useState<ReportTab>('overview')
    const [search, setSearch] = useState('')
    const [status, setStatus] = useState('all')
    const [vendor, setVendor] = useState('all')
    const [employee, setEmployee] = useState('all')
    const [settlement, setSettlement] = useState('all')
    const [month, setMonth] = useState('')
    const [aggregate, setAggregate] = useState<ResourceCostReport>(emptyReport)
    const [loading, setLoading] = useState(true)

    const load = useCallback(async () => {
        if (!apiAccessToken) { setLoading(false); return }
        setLoading(true)
        try {
            const reportFilters = {
                status: status === 'all' ? undefined : status as ResourceStatus,
                employeeId: employee === 'all' ? undefined : employee,
                vendorId: vendor === 'all' ? undefined : vendor,
                isSettled: settlement === 'all' ? undefined : settlement === 'settled',
                month: month || undefined,
                search: search.trim() || undefined,
            }
            const reportTypes: Array<ResourceType | undefined> = tab === 'subscriptions' ? ['subscription'] : tab === 'bills' ? ['expense', 'reimbursement', 'event'] : [undefined]
            const [items, vendorItems, reports] = await Promise.all([
                fetchResourcesApi(apiAccessToken, { limit: 100 }),
                fetchVendorsApi(apiAccessToken).catch(() => [] as Vendor[]),
                Promise.all(reportTypes.map((resourceType) => fetchResourceCostReportApi(apiAccessToken, { ...reportFilters, resourceType }))),
            ])
            setResources(items)
            setVendors(vendorItems)
            setAggregate(reports.reduce((sum, report) => ({
                ...sum,
                totalCost: sum.totalCost + report.totalCost,
                resourceCount: sum.resourceCount + report.resourceCount,
                recurringCost: sum.recurringCost + report.recurringCost,
                unsettledCost: sum.unsettledCost + report.unsettledCost,
            }), emptyReport))
        } catch (error) {
            setResources([])
            setAggregate(emptyReport)
            toast(error instanceof Error ? error.message : 'Failed to load resource reports', 'error')
        } finally { setLoading(false) }
    }, [apiAccessToken, employee, month, search, settlement, status, tab, vendor])

    useEffect(() => { if (!isHydrating) void load() }, [isHydrating, load])

    const vendorNames = useMemo(() => new Map(vendors.map((item) => [item.id, item.name])), [vendors])
    const vendorOptions = useMemo(() => [...vendors].sort((a, b) => a.name.localeCompare(b.name)), [vendors])
    const employeeOptions = useMemo(() => [...employees].sort((a, b) => a.name.localeCompare(b.name)), [employees])

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase()
        return resources.filter((item) => {
            const type = resourceType(item)
            const itemVendor = resourceVendor(item, vendorNames)
            const itemEmployee = textValue(item.assignedToEmployeeId || item.paidByEmployeeId)
            const searchable = [resourceName(item), item.category, type, itemVendor, item.identifier || '', textValue(resourceDetails(item).invoiceNumber)].join(' ').toLowerCase()
            const tabMatch = tab === 'overview' || (tab === 'subscriptions' ? type === 'subscription' : BILL_TYPES.has(type))
            return tabMatch
                && (!term || searchable.includes(term))
                && (!month || resourceDate(item).startsWith(month))
                && (status === 'all' || item.status === status)
                && (vendor === 'all' || item.vendorId === vendor)
                && (employee === 'all' || itemEmployee === employee)
                && (settlement === 'all' || (settlement === 'settled' ? item.isSettled !== false : item.isSettled === false))
        })
    }, [employee, month, resources, search, settlement, status, tab, vendor, vendorNames])

    const hasFilters = !!search || !!month || status !== 'all' || vendor !== 'all' || employee !== 'all' || settlement !== 'all'
    const clearFilters = () => { setSearch(''); setMonth(''); setStatus('all'); setVendor('all'); setEmployee('all'); setSettlement('all') }

    const grouped = useMemo(() => {
        const groups = new Map<string, { count: number; total: number }>()
        filtered.forEach((item) => {
            const key = resourceVendor(item, vendorNames) || item.category || 'Uncategorised'
            const current = groups.get(key) || { count: 0, total: 0 }
            groups.set(key, { count: current.count + 1, total: current.total + (resourceCost(item) || 0) })
        })
        return [...groups.entries()].sort((a, b) => b[1].total - a[1].total)
    }, [filtered, vendorNames])

    const groupedRecords = useMemo(() => {
        const groups = new Map<string, { name: string; type: string; count: number; total: number }>()
        filtered.forEach((item) => {
            const name = resourceName(item)
            const type = resourceType(item)
            const key = `${type}:${name}`
            const current = groups.get(key) || { name, type, count: 0, total: 0 }
            groups.set(key, { ...current, count: current.count + 1, total: current.total + (resourceCost(item) || 0) })
        })
        return [...groups.values()].sort((a, b) => b.total - a.total || b.count - a.count || a.name.localeCompare(b.name))
    }, [filtered])

    const title = tab === 'subscriptions' ? 'Subscription reports' : tab === 'bills' ? 'Bills & expenses reports' : 'Resource reports'
    const description = tab === 'subscriptions' ? 'Review recurring software and service costs.' : tab === 'bills' ? 'Review bills, reimbursements, and company expenses.' : 'See a combined view of company resources and costs.'

    return <div className="space-y-6">
        <div><h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{title}</h1><p className="font-medium text-slate-500">{description}</p></div>
        <Tabs value={tab} onValueChange={(value) => setTab(value as ReportTab)}><TabsList><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="subscriptions">Subscriptions</TabsTrigger><TabsTrigger value="bills">Bills &amp; expenses</TabsTrigger></TabsList></Tabs>
        <Card className="rounded-3xl border-slate-100 bg-white shadow-premium"><CardContent className="flex flex-wrap items-center gap-3 p-5 sm:p-7">
            <div className="relative min-w-[240px] flex-1"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search resources, vendors, invoices…" className="h-12 rounded-2xl border-slate-100 bg-slate-50 pl-11" /></div>
            <Select value={status} onValueChange={setStatus}><SelectTrigger className="h-12 w-[155px] rounded-2xl border-slate-100 bg-slate-50"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{STATUS_OPTIONS.map((item) => <SelectItem key={item} value={item}>{item.replace('_', ' ')}</SelectItem>)}</SelectContent></Select>
            <Select value={vendor} onValueChange={setVendor}><SelectTrigger className="h-12 w-[180px] rounded-2xl border-slate-100 bg-slate-50"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All vendors</SelectItem>{vendorOptions.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select>
            <Select value={employee} onValueChange={setEmployee}><SelectTrigger className="h-12 w-[180px] rounded-2xl border-slate-100 bg-slate-50"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All employees</SelectItem>{employeeOptions.map((item) => <SelectItem key={item.id} value={item.id}>{employeeDisplayName(asRecord(item))}</SelectItem>)}</SelectContent></Select>
            <Select value={settlement} onValueChange={setSettlement}><SelectTrigger className="h-12 w-[160px] rounded-2xl border-slate-100 bg-slate-50"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All settlement</SelectItem><SelectItem value="settled">Settled</SelectItem><SelectItem value="unsettled">Unsettled</SelectItem></SelectContent></Select><Input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="h-12 w-[170px] rounded-2xl border-slate-100 bg-slate-50" aria-label="Filter by month" />
            {hasFilters && <Button variant="ghost" onClick={clearFilters} className="font-semibold text-slate-500 hover:text-red-600">Reset</Button>}
        </CardContent></Card>
        {isHydrating || loading ? <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div> : <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Total cost" value={formatCurrency(aggregate.totalCost, currentCompany?.currency)} /><Metric label="Records" value={String(aggregate.resourceCount)} /><Metric label="Recurring cost" value={formatCurrency(aggregate.recurringCost, currentCompany?.currency)} /><Metric label="Unsettled" value={formatCurrency(aggregate.unsettledCost, currentCompany?.currency)} /></div>
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2"><ReportCard title="Cost by vendor / category"><div className="divide-y divide-slate-100">{grouped.length ? grouped.map(([name, value]) => <div key={name} className="flex items-center justify-between gap-4 p-4"><div><p className="font-bold text-slate-900">{name}</p><p className="text-xs text-slate-400">{value.count} record{value.count === 1 ? '' : 's'}</p></div><p className="font-bold text-slate-800">{formatCurrency(value.total, currentCompany?.currency)}</p></div>) : <Empty />}</div></ReportCard><ReportCard title="Grouped records in this view"><div className="divide-y divide-slate-100">{groupedRecords.length ? groupedRecords.slice(0, 10).map((group) => <div key={`${group.type}:${group.name}`} className="flex items-center justify-between gap-4 p-4"><div><p className="font-bold text-slate-900">{group.name}</p><p className="text-xs capitalize text-slate-400">{group.type.replace('_', ' ')} · {group.count} record{group.count === 1 ? '' : 's'}</p></div><p className="font-bold text-slate-800">{formatCurrency(group.total, currentCompany?.currency)}</p></div>) : <Empty />}</div>{groupedRecords.length > 10 && <p className="border-t border-slate-100 p-4 text-center text-xs font-bold uppercase tracking-widest text-slate-400">Showing 10 of {groupedRecords.length} groups</p>}</ReportCard></div>
        </>}
    </div>
}

function Metric({ label, value }: { label: string; value: string }) { return <Card className="rounded-3xl border-slate-100 bg-white shadow-premium"><CardContent className="p-7"><p className="text-xs font-bold uppercase tracking-widest text-slate-400">{label}</p><p className="mt-3 text-2xl font-extrabold text-slate-900">{value}</p></CardContent></Card> }
function ReportCard({ title, children }: { title: string; children: React.ReactNode }) { return <Card className="overflow-hidden rounded-3xl border-slate-100 bg-white shadow-premium"><CardHeader className="px-6 pt-6"><CardTitle className="flex items-center gap-2 text-lg"><BarChart3 className="h-5 w-5 text-blue-600" />{title}</CardTitle></CardHeader><CardContent className="p-0">{children}</CardContent></Card> }
function Empty() { return <p className="p-8 text-center text-sm text-slate-500">No records match the selected filters.</p> }