'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2, ExternalLink, HandCoins, Loader2, UserRound } from 'lucide-react'
import type { Employee, Resource } from '@/types'
import { fetchEmployeesApi, fetchResourceApi, updateResourceApi } from '@/lib/api/client'
import { useApp } from '@/lib/context/AppContext'
import { formatCurrency } from '@/lib/utils'
import { toast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    resourceInvoice,
    resourceIsSettled,
    resourceName,
    resourceRecord,
    resourceType,
    textValue,
} from '@/features/resources/resource-ui'

export function ReimbursementDetail({ id }: { id: string }) {
    const router = useRouter()
    const { apiAccessToken, currentCompany, isHydrating } = useApp()
    const [resource, setResource] = useState<Resource | null>(null)
    const [employees, setEmployees] = useState<Employee[]>([])
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const load = useCallback(async () => {
        if (!apiAccessToken || !id) { setLoading(false); return }
        setLoading(true)
        setError(null)
        try {
            const [item, employeeItems] = await Promise.all([
                fetchResourceApi(id, apiAccessToken),
                fetchEmployeesApi(apiAccessToken).catch(() => [] as Employee[]),
            ])
            if (resourceType(item) !== 'reimbursement') throw new Error('Reimbursement not found')
            setResource(item)
            setEmployees(employeeItems)
        } catch (loadError) {
            setResource(null)
            setError(loadError instanceof Error ? loadError.message : 'Reimbursement not found')
        } finally { setLoading(false) }
    }, [apiAccessToken, id])

    useEffect(() => { if (!isHydrating) void load() }, [isHydrating, load])

    const employeeNames = useMemo(() => new Map(employees.flatMap((employee) => {
        const name = employeeDisplayName(asRecord(employee))
        return [[employee.id, name], [employee.employeeId, name]] as const
    })), [employees])

    const markPaid = async () => {
        if (!apiAccessToken || !resource || resourceIsSettled(resource)) return
        setUpdating(true)
        try {
            const updated = await updateResourceApi(id, { isSettled: true }, apiAccessToken)
            setResource(updated)
            toast('Reimbursement marked as paid.', 'success')
        } catch (updateError) {
            toast(updateError instanceof Error ? updateError.message : 'Failed to update reimbursement', 'error')
        } finally { setUpdating(false) }
    }

    if (isHydrating || loading) return <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
    if (error || !resource) return <div className="space-y-6"><Button variant="ghost" size="icon" className="rounded-xl" onClick={() => router.push('/resources/reimbursements')}><ArrowLeft /></Button><Card className="border-red-100 bg-red-50/50"><CardContent className="space-y-4 p-8 text-center"><p className="text-sm font-medium text-red-700">{error || 'Reimbursement not found'}</p><Button variant="outline" className="rounded-xl" onClick={() => void load()}>Try again</Button></CardContent></Card></div>

    const item = resourceRecord(resource)
    const details = resourceDetails(resource)
    const attachments = resourceAttachmentUrls(resource)
    const amount = resourceCost(resource)
    const settled = resourceIsSettled(resource)
    const employeeId = textValue(item.paidByEmployeeId)
    const claimant = textValue(item.paidByEmployeeName) || employeeNames.get(employeeId) || employeeId || '—'

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-500">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-4"><Button variant="ghost" size="icon" className="rounded-xl" onClick={() => router.push('/resources/reimbursements')} aria-label="Back to reimbursements"><ArrowLeft /></Button><div><p className="text-xs font-bold uppercase tracking-widest text-slate-400">Reimbursement</p><h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{resourceName(resource)}</h1></div></div>
                <ResourceBadge value={settled ? 'paid' : 'pending'} />
            </div>

            <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
                <div className="space-y-6">
                    <Card className="rounded-3xl border-slate-100 bg-white shadow-premium">
                        <CardHeader className="px-8 pt-8"><CardTitle className="text-lg">Reimbursement details</CardTitle></CardHeader>
                        <CardContent className="space-y-7 p-8 pt-2">
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"><Detail label="Employee" value={claimant} /><Detail label="Category" value={resourceCategory(resource) || '—'} /><Detail label="Expense date" value={formatResourceDate(resourceDate(resource))} /><Detail label="Amount" value={amount == null ? '—' : formatCurrency(amount, textValue(item.currency) || currentCompany?.currency)} /></div>
                            <Detail label="Description" value={textValue(item.description) || '—'} multiline />
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2"><Detail label="Purpose" value={textValue(details.purpose) || '—'} /><Detail label="Notes" value={textValue(details.notes) || '—'} multiline /></div>
                            {resourceInvoice(resource) && <Detail label="Invoice number" value={resourceInvoice(resource)} />}
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2"><Detail label="Created" value={formatResourceDate(item.createdAt, true)} /><Detail label="Updated" value={formatResourceDate(item.updatedAt, true)} /></div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl border-slate-100 bg-white shadow-premium">
                        <CardHeader className="px-8 pt-8"><CardTitle className="text-lg">Receipts</CardTitle></CardHeader>
                        <CardContent className="p-8 pt-2">{attachments.length ? <div className="grid gap-3 sm:grid-cols-2">{attachments.map((url, index) => <a key={url} href={url} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 text-sm font-semibold text-blue-600 hover:border-blue-200 hover:bg-blue-50"><span className="truncate">Receipt {index + 1}</span><ExternalLink className="h-4 w-4 shrink-0" /></a>)}</div> : <p className="text-sm text-slate-500">No receipts attached.</p>}</CardContent>
                    </Card>
                </div>

                <Card className="rounded-3xl border-slate-100 bg-white shadow-premium xl:sticky xl:top-24">
                    <CardHeader className="px-6 pt-6"><CardTitle className="flex items-center gap-2 text-lg"><HandCoins className="h-5 w-5 text-emerald-600" />Payment</CardTitle></CardHeader>
                    <CardContent className="space-y-5 px-6 pb-6 pt-1">
                        <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4"><UserRound className="mt-0.5 h-5 w-5 text-blue-600" /><div><p className="text-xs font-bold uppercase tracking-widest text-slate-400">Claimant</p><p className="mt-1 text-sm font-bold text-slate-900">{claimant}</p></div></div>
                        <div><p className="text-xs font-bold uppercase tracking-widest text-slate-400">Status</p><div className="mt-2"><ResourceBadge value={settled ? 'paid' : 'pending'} /></div></div>
                        {!settled ? <Button className="w-full rounded-xl bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => void markPaid()} disabled={updating}>{updating ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}Mark as paid</Button> : <p className="rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">This reimbursement has been paid.</p>}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function Detail({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
    return <div><p className="text-xs font-bold uppercase tracking-widest text-slate-400">{label}</p><p className={`mt-1 text-sm text-slate-700 ${multiline ? 'whitespace-pre-wrap' : 'font-semibold'}`}>{value}</p></div>
}
