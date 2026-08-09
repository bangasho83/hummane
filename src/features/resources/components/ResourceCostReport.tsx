'use client'

import { useCallback, useEffect, useState } from 'react'
import { BarChart3, Loader2 } from 'lucide-react'
import type { ResourceTemplate } from '@/types'
import { fetchResourceCostReportApi, fetchResourceTemplatesApi, type ResourceCostReport } from '@/lib/api/client'
import { useApp } from '@/lib/context/AppContext'
import { formatCurrency } from '@/lib/utils'
import { toast } from '@/components/ui/toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { asRecord, employeeDisplayName, textValue } from '@/features/resources/resource-ui'

const emptyReport: ResourceCostReport = { totalCost: 0, resourceCount: 0, byTemplate: [], byEmployee: [] }

export function ResourceCostReport() {
    const { apiAccessToken, currentCompany, employees } = useApp()
    const [templates, setTemplates] = useState<ResourceTemplate[]>([])
    const [report, setReport] = useState<ResourceCostReport>(emptyReport)
    const [templateId, setTemplateId] = useState('all')
    const [employeeId, setEmployeeId] = useState('all')
    const [loading, setLoading] = useState(true)

    const load = useCallback(async () => {
        if (!apiAccessToken) { setLoading(false); return }
        setLoading(true)
        try {
            const [templateItems, costReport] = await Promise.all([
                fetchResourceTemplatesApi(apiAccessToken),
                fetchResourceCostReportApi(apiAccessToken, {
                    resourceType: 'subscription',
                    status: 'active',
                    resourceTemplateId: templateId === 'all' ? undefined : templateId,
                    employeeId: employeeId === 'all' ? undefined : employeeId,
                }),
            ])
            setTemplates(templateItems)
            setReport(costReport)
        } catch (error) {
            toast(error instanceof Error ? error.message : 'Failed to load cost report', 'error')
            setReport(emptyReport)
        } finally { setLoading(false) }
    }, [apiAccessToken, employeeId, templateId])

    useEffect(() => { void load() }, [load])

    const currency = currentCompany?.currency
    return (
        <div className="space-y-6">
            <div><h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Subscription costs</h1><p className="font-medium text-slate-500">See company software costs by product and employee.</p></div>
            <div className="flex flex-wrap gap-3"><Select value={templateId} onValueChange={setTemplateId}><SelectTrigger className="h-12 w-[220px] rounded-2xl border-slate-100 bg-white"><SelectValue placeholder="All products" /></SelectTrigger><SelectContent><SelectItem value="all">All products</SelectItem>{templates.map((template) => <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>)}</SelectContent></Select><Select value={employeeId} onValueChange={setEmployeeId}><SelectTrigger className="h-12 w-[220px] rounded-2xl border-slate-100 bg-white"><SelectValue placeholder="All employees" /></SelectTrigger><SelectContent><SelectItem value="all">All employees</SelectItem>{[...employees].sort((a, b) => a.name.localeCompare(b.name)).map((employee) => <SelectItem key={employee.id} value={employee.id}>{employeeDisplayName(asRecord(employee))}</SelectItem>)}</SelectContent></Select></div>
            {loading ? <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div> : <>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2"><Card className="rounded-3xl border-slate-100 bg-white shadow-premium"><CardContent className="p-7"><p className="text-xs font-bold uppercase tracking-widest text-slate-400">Total active subscriptions</p><p className="mt-3 text-3xl font-extrabold text-slate-900">{formatCurrency(report.totalCost, currency)}</p></CardContent></Card><Card className="rounded-3xl border-slate-100 bg-white shadow-premium"><CardContent className="p-7"><p className="text-xs font-bold uppercase tracking-widest text-slate-400">Assigned resource records</p><p className="mt-3 text-3xl font-extrabold text-slate-900">{report.resourceCount}</p></CardContent></Card></div>
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2"><ReportCard title="Cost by product"><TableHeader productLabel="Product" /><div className="divide-y divide-slate-100">{report.byTemplate.length ? report.byTemplate.map((row) => <div key={`${row.templateId || row.templateName}`} className="flex items-center justify-between gap-4 p-4"><div><p className="font-bold text-slate-900">{row.templateName}</p><p className="text-xs text-slate-400">{row.resourceCount} resource{row.resourceCount === 1 ? '' : 's'}</p></div><p className="font-bold text-slate-800">{formatCurrency(Number(row.totalCost), currency)}</p></div>) : <Empty />}</div></ReportCard><ReportCard title="Cost by employee"><TableHeader productLabel="Employee" /><div className="divide-y divide-slate-100">{report.byEmployee.length ? report.byEmployee.map((row, index) => <div key={`${row.employeeId || row.employeeName}-${row.templateId || row.templateName}-${index}`} className="flex items-center justify-between gap-4 p-4"><div><p className="font-bold text-slate-900">{row.employeeName || textValue(row.employeeId) || 'Unassigned'}</p><p className="text-xs text-slate-400">{row.templateName}</p></div><p className="font-bold text-slate-800">{formatCurrency(Number(row.totalCost), currency)}</p></div>) : <Empty />}</div></ReportCard></div>
            </>}
        </div>
    )
}

function ReportCard({ title, children }: { title: string; children: React.ReactNode }) { return <Card className="overflow-hidden rounded-3xl border-slate-100 bg-white shadow-premium"><CardHeader className="px-6 pt-6"><CardTitle className="flex items-center gap-2 text-lg"><BarChart3 className="h-5 w-5 text-blue-600" />{title}</CardTitle></CardHeader><CardContent className="p-0">{children}</CardContent></Card> }
function TableHeader({ productLabel }: { productLabel: string }) { return <div className="border-y border-slate-100 bg-slate-50/50 px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">{productLabel}<span className="float-right">Cost</span></div> }
function Empty() { return <p className="p-8 text-center text-sm text-slate-500">No subscription costs found.</p> }