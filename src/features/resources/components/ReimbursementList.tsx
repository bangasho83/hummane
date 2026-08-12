'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, FileText, Loader2, Pencil, Plus, Search } from 'lucide-react'
import type { Resource } from '@/types'
import { deleteResourceApi, fetchResourcesApi, updateResourceApi } from '@/lib/api/client'
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
import { formatResourceDate, resourceCost, resourceDate, resourceId, resourceInvoice, resourceIsSettled, resourceName } from '@/features/resources/resource-ui'

export function ReimbursementList({ memberMode = false }: { memberMode?: boolean }) {
    const { apiAccessToken, currentCompany, employees, isHydrating } = useApp()
    const [items, setItems] = useState<Resource[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [paymentFilter, setPaymentFilter] = useState('all')
    const [updatingId, setUpdatingId] = useState<string | null>(null)

    const load = useCallback(async () => {
        if (!apiAccessToken) { setLoading(false); return }
        setLoading(true)
        try { setItems(await fetchResourcesApi(apiAccessToken, { resourceType: 'reimbursement', limit: 100 })) }
        catch { setItems([]) }
        finally { setLoading(false) }
    }, [apiAccessToken])

    useEffect(() => { if (!isHydrating) void load() }, [isHydrating, load])

    const employeeNames = useMemo(() => new Map(employees.map((employee) => [employee.id, employee.name])), [employees])
    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase()
        return items.filter((item) => {
            const paidBy = item.paidByEmployeeName || employeeNames.get(item.paidByEmployeeId || '') || ''
            const settled = resourceIsSettled(item)
            return (!term || `${resourceName(item)} ${paidBy} ${resourceInvoice(item)}`.toLowerCase().includes(term)) && (paymentFilter === 'all' || (paymentFilter === 'paid' ? settled : !settled))
        })
    }, [employeeNames, items, paymentFilter, search])

    const markPaid = async (item: Resource) => {
        const id = resourceId(item)
        if (!apiAccessToken || resourceIsSettled(item)) return
        setUpdatingId(id)
        try { const updated = await updateResourceApi(id, { isSettled: true }, apiAccessToken); setItems((current) => current.map((value) => resourceId(value) === id ? updated : value)); toast('Reimbursement marked as paid.', 'success') }
        catch (error) { toast(error instanceof Error ? error.message : 'Failed to update reimbursement', 'error') }
        finally { setUpdatingId(null) }
    }

    const remove = async (item: Resource) => {
        if (!apiAccessToken) return
        try { await deleteResourceApi(resourceId(item), apiAccessToken); setItems((current) => current.filter((value) => resourceId(value) !== resourceId(item))); toast('Reimbursement deleted.', 'success') }
        catch (error) { toast(error instanceof Error ? error.message : 'Failed to delete reimbursement', 'error') }
    }

    return <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-500">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end"><div><h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Reimbursements</h1><p className="font-medium text-slate-500">{memberMode ? 'Track expenses you submitted for reimbursement.' : 'Review employee-paid expenses and reimbursement status.'}</p></div><Button asChild className="h-auto rounded-2xl bg-blue-600 px-6 py-4 font-bold text-white"><Link href={memberMode ? '/member/reimbursements/new' : '/resources/reimbursements/new'}><Plus className="h-5 w-5" />Add reimbursement</Link></Button></div>
        <Card className="overflow-hidden rounded-3xl border-slate-100 bg-white shadow-premium"><CardContent className="p-0">
            <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-5 sm:p-8"><div className="relative min-w-[240px] flex-1"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search reimbursements…" className="h-12 rounded-2xl border-slate-100 bg-slate-50 pl-11" /></div><Select value={paymentFilter} onValueChange={setPaymentFilter}><SelectTrigger className="h-12 w-[170px] rounded-2xl border-slate-100 bg-slate-50"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All payments</SelectItem><SelectItem value="paid">Paid</SelectItem><SelectItem value="unpaid">Unpaid</SelectItem></SelectContent></Select></div>
            {isHydrating || loading ? <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div> : filtered.length === 0 ? <div className="p-20 text-center"><FileText className="mx-auto mb-4 h-10 w-10 text-slate-300" /><p className="font-medium text-slate-500">No reimbursements found.</p></div> : <div className="overflow-x-auto"><Table className="min-w-[1000px]"><TableHeader className="bg-slate-50/50"><TableRow className="border-slate-100 hover:bg-transparent"><TableHead className="pl-8">Reimbursement</TableHead>{!memberMode && <TableHead>Paid by</TableHead>}<TableHead>Invoice</TableHead><TableHead>Date</TableHead><TableHead>Amount</TableHead><TableHead>Billing type</TableHead><TableHead>Payment</TableHead>{!memberMode && <TableHead className="pr-8 text-right">Actions</TableHead>}</TableRow></TableHeader><TableBody>{filtered.map((item) => { const id = resourceId(item); const settled = resourceIsSettled(item); const paidBy = item.paidByEmployeeName || employeeNames.get(item.paidByEmployeeId || '') || 'Unknown employee'; const amount = resourceCost(item); return <TableRow key={id} className="border-slate-50"><TableCell className="py-5 pl-8 font-bold text-slate-900">{resourceName(item)}</TableCell>{!memberMode && <TableCell className="py-5 text-sm text-slate-600">{paidBy}</TableCell>}<TableCell className="py-5 text-sm text-slate-600">{resourceInvoice(item) || '—'}</TableCell><TableCell className="py-5 text-sm text-slate-600">{formatResourceDate(resourceDate(item))}</TableCell><TableCell className="py-5 text-sm font-semibold text-slate-800">{amount == null ? '—' : formatCurrency(amount, currentCompany?.currency)}</TableCell><TableCell className="py-5 text-sm text-slate-600">{item.costType ? item.costType.replace('_', ' ') : '—'}</TableCell><TableCell className="py-5"><ResourceBadge value={settled ? 'paid' : 'pending'} /></TableCell>{!memberMode && <TableCell className="py-5 pr-8"><div className="flex justify-end gap-1">{!settled && <Button variant="ghost" size="icon" onClick={() => void markPaid(item)} disabled={updatingId === id} aria-label="Mark paid">{updatingId === id ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}</Button>}<Button asChild variant="ghost" size="icon" aria-label="Edit reimbursement"><Link href={`/resources/reimbursements/${id}/edit`}><Pencil /></Link></Button><DeleteResourceDialog name={resourceName(item)} onDelete={() => remove(item)} /></div></TableCell>}</TableRow> })}</TableBody></Table></div>}
            <div className="border-t border-slate-50 bg-slate-50/30 px-8 py-5 text-xs font-bold uppercase tracking-widest text-slate-400">{filtered.length} {filtered.length === 1 ? 'reimbursement' : 'reimbursements'}</div>
        </CardContent></Card>
    </div>
}