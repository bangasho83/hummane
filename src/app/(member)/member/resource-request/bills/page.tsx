'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ExternalLink, FileText, Loader2, Plus } from 'lucide-react'
import type { Resource } from '@/types'
import { fetchResourcesApi } from '@/lib/api/client'
import { useApp } from '@/lib/context/AppContext'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ResourceBadge } from '@/features/resources/components/ResourceBadge'
import { formatResourceDate, resourceAttachmentUrls, resourceCategory, resourceCost, resourceDate, resourceDetails, resourceId, resourceIsSettled, resourceName, resourceType, textValue } from '@/features/resources/resource-ui'

export default function MemberBillsPage() {
    const { apiAccessToken, meProfile, currentCompany, isHydrating } = useApp()
    const employeeId = meProfile?.employeeId
    const [items, setItems] = useState<Resource[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const load = useCallback(async () => {
        if (!apiAccessToken || !employeeId) { setItems([]); setLoading(false); return }
        setLoading(true)
        setError(null)
        try {
            const resources = await fetchResourcesApi(apiAccessToken, { resourceType: 'reimbursement', paidByEmployeeId: employeeId, limit: 100 })
            setItems(resources.filter((resource) => resourceType(resource) === 'reimbursement' && textValue(resource.paidByEmployeeId) === employeeId))
        } catch (loadError) {
            setItems([])
            setError(loadError instanceof Error ? loadError.message : 'We could not load your reimbursements.')
        } finally { setLoading(false) }
    }, [apiAccessToken, employeeId])

    useEffect(() => { if (!isHydrating) void load() }, [isHydrating, load])
    const sorted = useMemo(() => [...items].sort((a, b) => resourceDate(b).localeCompare(resourceDate(a))), [items])

    if (isHydrating) return <Loading />
    if (!employeeId) return <Card className="border-dashed"><CardHeader className="text-center"><CardTitle>No Employee Profile Linked</CardTitle></CardHeader><CardContent className="text-center text-slate-500">Please contact your administrator to link your employee profile.</CardContent></Card>

    return (
        <div className="space-y-6">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
                <div><h2 className="text-2xl font-extrabold tracking-tight text-slate-900">My Bills</h2><p className="font-medium text-slate-500">Submit and track reimbursement claims.</p></div>
                <Button asChild className="h-auto rounded-2xl bg-blue-600 px-6 py-4 font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700"><Link href="/member/resource-request/bills/new"><Plus className="h-5 w-5" />New reimbursement</Link></Button>
            </div>
            {loading ? <Loading /> : error ? <Card className="border-red-100 bg-red-50/50"><CardContent className="space-y-4 p-8 text-center"><p className="text-sm font-medium text-red-700">{error}</p><Button variant="outline" onClick={() => void load()} className="rounded-xl">Try again</Button></CardContent></Card> : (
                <Card className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-premium"><CardContent className="p-0"><div className="overflow-x-auto"><Table className="min-w-[900px]"><TableHeader className="bg-slate-50/50"><TableRow className="border-slate-100 hover:bg-transparent"><Head className="pl-8">Reimbursement</Head><Head>Category</Head><Head>Date</Head><Head>Amount</Head><Head>Payment</Head><Head>Purpose</Head><Head className="pr-8">Receipts</Head></TableRow></TableHeader><TableBody>
                    {sorted.length === 0 ? <TableRow><TableCell colSpan={7} className="p-20 text-center"><FileText className="mx-auto mb-3 h-10 w-10 text-slate-300" /><p className="font-medium text-slate-500">No reimbursement claims yet.</p></TableCell></TableRow> : sorted.map((resource) => { const files = resourceAttachmentUrls(resource); const amount = resourceCost(resource); const details = resourceDetails(resource); return <TableRow key={resourceId(resource)} className="border-slate-50 hover:bg-slate-50/50"><TableCell className="py-5 pl-8 font-bold text-slate-900">{resourceName(resource)}</TableCell><TableCell className="py-5 text-sm text-slate-600">{resourceCategory(resource) || '—'}</TableCell><TableCell className="py-5 text-sm text-slate-600">{formatResourceDate(resourceDate(resource))}</TableCell><TableCell className="py-5 text-sm font-semibold text-slate-800">{amount == null ? '—' : formatCurrency(amount, currentCompany?.currency)}</TableCell><TableCell className="py-5"><ResourceBadge value={resourceIsSettled(resource) ? 'paid' : 'pending'} /></TableCell><TableCell className="py-5 text-sm text-slate-600">{textValue(details.purpose) || '—'}</TableCell><TableCell className="py-5 pr-8 text-sm">{files.length ? files.map((url, index) => <a key={url} href={url} target="_blank" rel="noreferrer" className="mr-3 inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700">Receipt {index + 1}<ExternalLink className="h-3 w-3" /></a>) : '—'}</TableCell></TableRow> })}
                </TableBody></Table></div></CardContent></Card>
            )}
        </div>
    )
}

function Loading() { return <div className="flex items-center justify-center p-16"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div> }
function Head({ children, className = '' }: { children: React.ReactNode; className?: string }) { return <TableHead className={`py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 ${className}`}>{children}</TableHead> }
