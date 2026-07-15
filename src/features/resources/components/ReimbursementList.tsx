'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ExternalLink, HandCoins, Loader2, Search } from 'lucide-react'
import type { Employee, Resource } from '@/types'
import { fetchEmployeesApi, fetchResourcesApi, updateResourceApi } from '@/lib/api/client'
import { useApp } from '@/lib/context/AppContext'
import { formatCurrency } from '@/lib/utils'
import { toast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ResourceBadge } from './ResourceBadge'
import {
    asRecord,
    employeeDisplayName,
    formatResourceDate,
    resourceAttachmentUrls,
    resourceCategory,
    resourceCost,
    resourceDate,
    resourceDetails,
    resourceId,
    resourceIsSettled,
    resourceName,
    resourceRecord,
    resourceType,
    textValue,
} from '@/features/resources/resource-ui'

export function ReimbursementList() {
    const { apiAccessToken, currentCompany, isHydrating } = useApp()
    const [items, setItems] = useState<Resource[]>([])
    const [employees, setEmployees] = useState<Employee[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    const [paymentFilter, setPaymentFilter] = useState('all')
    const [updatingId, setUpdatingId] = useState<string | null>(null)

    const load = useCallback(async () => {
        if (!apiAccessToken) { setLoading(false); return }
        setLoading(true)
        setError(null)
        try {
            const [resources, employeeItems] = await Promise.all([
                fetchResourcesApi(apiAccessToken, { resourceType: 'reimbursement', limit: 100 }),
                fetchEmployeesApi(apiAccessToken).catch(() => [] as Employee[]),
            ])
            setItems(resources.filter((resource) => resourceType(resource) === 'reimbursement'))
            setEmployees(employeeItems)
        } catch (loadError) {
            setItems([])
            setError(loadError instanceof Error ? loadError.message : 'Failed to load reimbursements')
        } finally { setLoading(false) }
    }, [apiAccessToken])

    useEffect(() => { if (!isHydrating) void load() }, [isHydrating, load])

    const employeeNames = useMemo(() => new Map(employees.flatMap((employee) => {
        const name = employeeDisplayName(asRecord(employee))
        return [[employee.id, name], [employee.employeeId, name]] as const
    })), [employees])

    const claimantName = useCallback((resource: Resource) => {
        const item = resourceRecord(resource)
        const employeeId = textValue(item.paidByEmployeeId)
        return textValue(item.paidByEmployeeName) || employeeNames.get(employeeId) || employeeId || '—'
    }, [employeeNames])

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase()
        return [...items]
            .filter((resource) => {
                const details = resourceDetails(resource)
                const searchable = [resourceName(resource), claimantName(resource), resourceCategory(resource), textValue(details.purpose), textValue(details.notes)].join(' ').toLowerCase()
                const settled = resourceIsSettled(resource)
                return (!term || searchable.includes(term))
                    && (paymentFilter === 'all' || (paymentFilter === 'paid' ? settled : !settled))
            })
            .sort((a, b) => resourceDate(b).localeCompare(resourceDate(a)))
    }, [claimantName, items, paymentFilter, search])

    const markPaid = async (resource: Resource) => {
        if (!apiAccessToken || resourceIsSettled(resource)) return
        const id = resourceId(resource)
        setUpdatingId(id)
        try {
            const updated = await updateResourceApi(id, { isSettled: true }, apiAccessToken)
            setItems((current) => current.map((item) => resourceId(item) === id ? updated : item))
            toast('Reimbursement marked as paid.', 'success')
        } catch (updateError) {
            toast(updateError instanceof Error ? updateError.message : 'Failed to update reimbursement', 'error')
        } finally { setUpdatingId(null) }
    }

    const hasFilters = !!search || paymentFilter !== 'all'

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-500">
            <div><h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Reimbursements</h1><p className="font-medium text-slate-500">Review every employee reimbursement claim and track payment status.</p></div>
            <Card className="overflow-hidden rounded-3xl border-slate-100 bg-white shadow-premium">
                <CardContent className="p-0">
                    <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-5 sm:p-8">
                        <div className="relative min-w-[240px] flex-1"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search claims or employees…" className="h-12 rounded-2xl border-slate-100 bg-slate-50 pl-11" /></div>
                        <Select value={paymentFilter} onValueChange={setPaymentFilter}><SelectTrigger className="h-12 w-[180px] rounded-2xl border-slate-100 bg-slate-50"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All payments</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="paid">Paid</SelectItem></SelectContent></Select>
                        {hasFilters && <button type="button" onClick={() => { setSearch(''); setPaymentFilter('all') }} className="text-sm font-semibold text-slate-500 hover:text-red-600">Reset</button>}
                    </div>
                    {isHydrating || loading ? <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div> : error ? <div className="space-y-4 p-20 text-center"><p className="text-sm font-medium text-red-700">{error}</p><Button variant="outline" className="rounded-xl" onClick={() => void load()}>Try again</Button></div> : filtered.length === 0 ? <div className="p-20 text-center"><HandCoins className="mx-auto mb-4 h-10 w-10 text-slate-300" /><p className="font-medium text-slate-500">{hasFilters ? 'No reimbursements match your filters.' : 'No reimbursements yet.'}</p></div> : (
                        <div className="overflow-x-auto"><Table className="min-w-[1100px]">
                            <TableHeader className="bg-slate-50/50"><TableRow className="border-slate-100 hover:bg-transparent"><Head className="pl-8">Reimbursement</Head><Head>Employee</Head><Head>Category</Head><Head>Date</Head><Head>Amount</Head><Head>Purpose</Head><Head>Payment</Head><Head>Receipts</Head><Head className="pr-8 text-right">Actions</Head></TableRow></TableHeader>
                            <TableBody>{filtered.map((resource) => { const id = resourceId(resource); const settled = resourceIsSettled(resource); const amount = resourceCost(resource); const details = resourceDetails(resource); const files = resourceAttachmentUrls(resource); return <TableRow key={id} className="border-slate-50 hover:bg-slate-50/50"><TableCell className="py-5 pl-8 font-bold text-slate-900">{resourceName(resource)}</TableCell><TableCell className="py-5 text-sm font-semibold text-slate-700">{claimantName(resource)}</TableCell><TableCell className="py-5 text-sm text-slate-600">{resourceCategory(resource) || '—'}</TableCell><TableCell className="py-5 text-sm text-slate-600">{formatResourceDate(resourceDate(resource))}</TableCell><TableCell className="py-5 text-sm font-semibold text-slate-800">{amount == null ? '—' : formatCurrency(amount, currentCompany?.currency)}</TableCell><TableCell className="max-w-[220px] py-5 text-sm text-slate-600">{textValue(details.purpose) || '—'}</TableCell><TableCell className="py-5"><ResourceBadge value={settled ? 'paid' : 'pending'} /></TableCell><TableCell className="py-5 text-sm">{files.length ? files.map((url, index) => <a key={url} href={url} target="_blank" rel="noreferrer" className="mr-3 inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700">Receipt {index + 1}<ExternalLink className="h-3 w-3" /></a>) : '—'}</TableCell><TableCell className="py-5 pr-8 text-right">{!settled ? <Button variant="ghost" onClick={() => void markPaid(resource)} disabled={updatingId === id} className="rounded-xl text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700">{updatingId === id ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}Mark paid</Button> : <span className="text-xs font-semibold text-slate-400">Completed</span>}</TableCell></TableRow> })}</TableBody>
                        </Table></div>
                    )}
                    <div className="border-t border-slate-50 bg-slate-50/30 px-8 py-5 text-xs font-bold uppercase tracking-widest text-slate-400">{filtered.length} {filtered.length === 1 ? 'reimbursement' : 'reimbursements'}</div>
                </CardContent>
            </Card>
        </div>
    )
}

function Head({ children, className = '' }: { children: React.ReactNode; className?: string }) { return <TableHead className={`py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 ${className}`}>{children}</TableHead> }
