'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, ExternalLink, FileText, Loader2, Pencil, Plus, Search } from 'lucide-react'
import type { Resource, Vendor } from '@/types'
import { deleteResourceApi, fetchResourcesApi, fetchVendorsApi, updateResourceApi } from '@/lib/api/client'
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
    formatResourceDate,
    resourceAttachmentUrls,
    resourceCategory,
    resourceCost,
    resourceDate,
    resourceId,
    resourceInvoice,
    resourceIsSettled,
    resourceName,
    resourceType,
    resourceVendor,
} from '@/features/resources/resource-ui'

export function BillList() {
    const { apiAccessToken, currentCompany, isHydrating } = useApp()
    const [bills, setBills] = useState<Resource[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [vendorItems, setVendorItems] = useState<Vendor[]>([])
    const [search, setSearch] = useState('')
    const [vendorFilter, setVendorFilter] = useState('all')
    const [categoryFilter, setCategoryFilter] = useState('all')
    const [paymentFilter, setPaymentFilter] = useState('all')
    const [updatingId, setUpdatingId] = useState<string | null>(null)

    const load = useCallback(async () => {
        if (!apiAccessToken) { setLoading(false); return }
        setLoading(true)
        setError(null)
        try {
            const [items, loadedVendors] = await Promise.all([
                fetchResourcesApi(apiAccessToken, { limit: 100, resourceType: 'expense' }),
                fetchVendorsApi(apiAccessToken).catch(() => [] as Vendor[]),
            ])
            setBills(items.filter((item) => resourceType(item) === 'expense'))
            setVendorItems(loadedVendors)
        } catch (loadError) {
            setBills([])
            setError(loadError instanceof Error ? loadError.message : 'Failed to load bills')
        } finally { setLoading(false) }
    }, [apiAccessToken])

    useEffect(() => { if (!isHydrating) void load() }, [isHydrating, load])

    const vendorNames = useMemo(() => new Map(vendorItems.map((vendor) => [vendor.id, vendor.name])), [vendorItems])
    const vendors = useMemo(() => [...new Set(bills.map((bill) => resourceVendor(bill, vendorNames)).filter(Boolean))].sort(), [bills, vendorNames])
    const categories = useMemo(() => [...new Set(bills.map(resourceCategory).filter(Boolean))].sort(), [bills])
    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase()
        return bills.filter((bill) => {
            const settled = resourceIsSettled(bill)
            const vendor = resourceVendor(bill, vendorNames)
            const searchable = [resourceName(bill), vendor, resourceInvoice(bill), resourceCategory(bill)].join(' ').toLowerCase()
            return (!term || searchable.includes(term))
                && (vendorFilter === 'all' || vendor === vendorFilter)
                && (categoryFilter === 'all' || resourceCategory(bill) === categoryFilter)
                && (paymentFilter === 'all' || (paymentFilter === 'paid' ? settled : !settled))
        })
    }, [bills, search, vendorFilter, categoryFilter, paymentFilter, vendorNames])

    const markPaid = async (bill: Resource) => {
        if (!apiAccessToken || resourceIsSettled(bill)) return
        const id = resourceId(bill)
        setUpdatingId(id)
        try {
            const updated = await updateResourceApi(id, { isSettled: true }, apiAccessToken)
            setBills((current) => current.map((item) => resourceId(item) === id ? updated : item))
            toast('Bill marked as paid.', 'success')
        } catch (updateError) {
            toast(updateError instanceof Error ? updateError.message : 'Failed to update payment', 'error')
        } finally { setUpdatingId(null) }
    }

    const remove = async (bill: Resource) => {
        if (!apiAccessToken) return
        try {
            await deleteResourceApi(resourceId(bill), apiAccessToken)
            setBills((current) => current.filter((item) => resourceId(item) !== resourceId(bill)))
            toast('Bill deleted.', 'success')
        } catch (deleteError) {
            toast(deleteError instanceof Error ? deleteError.message : 'Failed to delete bill', 'error')
            throw deleteError
        }
    }

    const hasFilters = !!search || vendorFilter !== 'all' || categoryFilter !== 'all' || paymentFilter !== 'all'

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-500">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
                <div><h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Bills</h1><p className="font-medium text-slate-500">Track company expenses, invoices, and payment status.</p></div>
                <Button asChild className="h-auto rounded-2xl bg-blue-600 px-6 py-4 font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700"><Link href="/resources/bills/new"><Plus className="h-5 w-5" />Add bill</Link></Button>
            </div>
            <Card className="overflow-hidden rounded-3xl border-slate-100 bg-white shadow-premium">
                <CardContent className="p-0">
                    <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-5 sm:p-8">
                        <div className="relative min-w-[240px] flex-1"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search bills, invoices…" className="h-12 rounded-2xl border-slate-100 bg-slate-50 pl-11" /></div>
                        <Select value={vendorFilter} onValueChange={setVendorFilter}><SelectTrigger className="h-12 w-[180px] rounded-2xl border-slate-100 bg-slate-50"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All vendors</SelectItem>{vendors.map((vendor) => <SelectItem key={vendor} value={vendor}>{vendor}</SelectItem>)}</SelectContent></Select>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}><SelectTrigger className="h-12 w-[180px] rounded-2xl border-slate-100 bg-slate-50"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All categories</SelectItem>{categories.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}</SelectContent></Select>
                        <Select value={paymentFilter} onValueChange={setPaymentFilter}><SelectTrigger className="h-12 w-[160px] rounded-2xl border-slate-100 bg-slate-50"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All payments</SelectItem><SelectItem value="paid">Paid</SelectItem><SelectItem value="unpaid">Unpaid</SelectItem></SelectContent></Select>
                        {hasFilters && <button type="button" onClick={() => { setSearch(''); setVendorFilter('all'); setCategoryFilter('all'); setPaymentFilter('all') }} className="text-sm font-semibold text-slate-500 hover:text-red-600">Reset</button>}
                    </div>
                    {isHydrating || loading ? <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div> : error ? <div className="space-y-4 p-20 text-center"><p className="text-sm font-medium text-red-700">{error}</p><Button variant="outline" className="rounded-xl" onClick={() => void load()}>Try again</Button></div> : filtered.length === 0 ? <div className="p-20 text-center"><FileText className="mx-auto mb-4 h-10 w-10 text-slate-300" /><p className="font-medium text-slate-500">{hasFilters ? 'No bills match your filters.' : 'No bills yet.'}</p></div> : (
                        <div className="overflow-x-auto"><Table className="min-w-[1100px]">
                            <TableHeader className="bg-slate-50/50"><TableRow className="border-slate-100 hover:bg-transparent"><Head className="pl-8">Bill</Head><Head>Vendor</Head><Head>Invoice</Head><Head>Category</Head><Head>Date</Head><Head>Amount</Head><Head>Payment</Head><Head>Attachments</Head><Head className="pr-8 text-right">Actions</Head></TableRow></TableHeader>
                            <TableBody>{filtered.map((bill) => {
                                const id = resourceId(bill)
                                const settled = resourceIsSettled(bill)
                                const attachments = resourceAttachmentUrls(bill)
                                const amount = resourceCost(bill)
                                return <TableRow key={id} className="border-slate-50 hover:bg-slate-50/50">
                                    <TableCell className="py-5 pl-8 font-bold text-slate-900">{resourceName(bill)}</TableCell>
                                    <TableCell className="py-5 text-sm text-slate-600">{resourceVendor(bill, vendorNames) || '—'}</TableCell>
                                    <TableCell className="py-5 text-sm text-slate-600">{resourceInvoice(bill) || '—'}</TableCell>
                                    <TableCell className="py-5 text-sm text-slate-600">{resourceCategory(bill) || '—'}</TableCell>
                                    <TableCell className="py-5 text-sm text-slate-600">{formatResourceDate(resourceDate(bill))}</TableCell>
                                    <TableCell className="py-5 text-sm font-semibold text-slate-800">{amount == null ? '—' : formatCurrency(amount, currentCompany?.currency)}</TableCell>
                                    <TableCell className="py-5"><ResourceBadge value={settled ? 'paid' : 'pending'} /></TableCell>
                                    <TableCell className="py-5 text-sm">{attachments.length ? <div className="flex flex-col gap-1">{attachments.slice(0, 2).map((url, index) => <a key={url} href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700">File {index + 1}<ExternalLink className="h-3 w-3" /></a>)}{attachments.length > 2 && <span className="text-xs text-slate-400">+{attachments.length - 2} more</span>}</div> : '—'}</TableCell>
                                    <TableCell className="py-5 pr-8"><div className="flex justify-end gap-1">{!settled && <Button variant="ghost" size="icon" onClick={() => void markPaid(bill)} disabled={updatingId === id} className="h-10 w-10 rounded-xl text-slate-300 hover:bg-emerald-50 hover:text-emerald-600" aria-label="Mark paid">{updatingId === id ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}</Button>}<Button asChild variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-300 hover:bg-blue-50 hover:text-blue-600"><Link href={`/resources/bills/${id}/edit`} aria-label="Edit bill"><Pencil /></Link></Button><DeleteResourceDialog name={resourceName(bill)} onDelete={() => remove(bill)} /></div></TableCell>
                                </TableRow>
                            })}</TableBody>
                        </Table></div>
                    )}
                    <div className="border-t border-slate-50 bg-slate-50/30 px-8 py-5 text-xs font-bold uppercase tracking-widest text-slate-400">{filtered.length} {filtered.length === 1 ? 'bill' : 'bills'}</div>
                </CardContent>
            </Card>
        </div>
    )
}

function Head({ children, className = '' }: { children: React.ReactNode; className?: string }) { return <TableHead className={`py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 ${className}`}>{children}</TableHead> }
