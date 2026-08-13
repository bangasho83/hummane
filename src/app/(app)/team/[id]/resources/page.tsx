'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { FileText, Loader2 } from 'lucide-react'
import type { Employee, Resource, ResourceRequest } from '@/types'
import { fetchResourceRequestsApi, fetchResourcesApi } from '@/lib/api/client'
import { useApp } from '@/lib/context/AppContext'
import { formatCurrency } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { EmployeeProfileTabs, employeeResourceTabs, type EmployeeResourceTab } from '@/features/employees/components/EmployeeProfileTabs'
import { ResourceBadge } from '@/features/resources/components/ResourceBadge'
import { ResourceRequestStatusBadge } from '@/features/member/components/ResourceRequestStatusBadge'
import { formatResourceDate, labelize, resourceCost, resourceDate, resourceDetails, resourceInvoice, resourceIsSettled, resourceName, resourceStatus, resourceType, textValue } from '@/features/resources/resource-ui'

const resourceTypes = ['book', 'subscription', 'expense', 'reimbursement'] as const

const requestTypeLabel = (value: ResourceRequest['requestType']) => value === 'team_allocation' ? 'Team Allocation' : value === 'headcount' ? 'Headcount' : 'Resource'

export default function EmployeeResourcesPage() {
    const params = useParams()
    const router = useRouter()
    const { apiAccessToken, currentCompany, employees, isHydrating } = useApp()
    const employeeId = params.id as string
    const [employee, setEmployee] = useState<Employee | null>(null)
    const [resources, setResources] = useState<Resource[]>([])
    const [reimbursements, setReimbursements] = useState<Resource[]>([])
    const [requests, setRequests] = useState<ResourceRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<EmployeeResourceTab>('resources')
    const [search, setSearch] = useState('')

    useEffect(() => {
        const selected = employees.find((item) => item.id === employeeId)
        if (!selected && employees.length > 0) {
            toast('Employee not found', 'error')
            router.push('/team')
            return
        }
        setEmployee(selected || null)
    }, [employeeId, employees, router])

    const load = useCallback(async () => {
        if (!apiAccessToken || !employeeId) {
            setResources([])
            setReimbursements([])
            setRequests([])
            setLoading(false)
            return
        }
        setLoading(true)
        try {
            const [assigned, employeeReimbursements, companyRequests] = await Promise.all([
                fetchResourcesApi(apiAccessToken, { assignedToEmployeeId: employeeId, limit: 100 }),
                fetchResourcesApi(apiAccessToken, { resourceType: 'reimbursement', limit: 100 }),
                fetchResourceRequestsApi(apiAccessToken),
            ])
            setResources(assigned.filter((item) => !['expense', 'reimbursement'].includes(resourceType(item))))
            setReimbursements(employeeReimbursements.filter((item) => item.paidByEmployeeId === employeeId || item.assignedToEmployeeId === employeeId))
            setRequests(companyRequests.filter((item) => item.employeeId === employeeId))
        } catch {
            setResources([])
            setReimbursements([])
            setRequests([])
        } finally {
            setLoading(false)
        }
    }, [apiAccessToken, employeeId])

    useEffect(() => { if (!isHydrating) void load() }, [isHydrating, load])

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase()
        const matches = (value: string) => !term || value.toLowerCase().includes(term)
        return {
            requests: requests.filter((item) => matches(`${item.title} ${item.category} ${item.description || ''}`)),
            resources: resources.filter((item) => matches(`${resourceName(item)} ${item.category} ${item.identifier || ''}`) && !resourceTypes.includes(resourceType(item) as typeof resourceTypes[number])),
            subscriptions: resources.filter((item) => resourceType(item) === 'subscription' && matches(`${resourceName(item)} ${textValue(resourceDetails(item).accountEmail)}`)),
            reimbursements: reimbursements.filter((item) => matches(`${resourceName(item)} ${resourceInvoice(item)}`)),
            books: resources.filter((item) => resourceType(item) === 'book' && matches(`${resourceName(item)} ${textValue(resourceDetails(item).author)} ${item.identifier || ''}`)),
        }
    }, [reimbursements, requests, resources, search])

    if (!employee) return <div className="p-8 text-slate-500">Loading profile...</div>

    const empty = (message: string, colSpan: number) => <TableRow><TableCell colSpan={colSpan} className="p-16 text-center"><FileText className="mx-auto mb-3 h-9 w-9 text-slate-300" /><p className="font-medium text-slate-500">{message}</p></TableCell></TableRow>
    const table = (children: React.ReactNode) => <Card className="overflow-hidden rounded-3xl border-slate-100 bg-white shadow-premium"><CardContent className="p-0"><div className="overflow-x-auto"><Table>{children}</Table></div></CardContent></Card>

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{employee.name}</h1>
                    <p className="font-medium text-slate-500">{employee.roleName || employee.position || '—'} • {employee.departmentName || employee.department || '—'}</p>
                </div>
                <Button asChild variant="outline" className="border-slate-200 text-slate-600"><Link href={`/team/${employee.id}`}>View profile</Link></Button>
            </div>
            <EmployeeProfileTabs employeeId={employee.id} active="resources" />
            <div><p className="mb-2 text-xs font-extrabold uppercase tracking-[0.2em] text-blue-600">Employee record</p><h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Resources</h2><p className="font-medium text-slate-500">Review resources, subscriptions, books, reimbursements, and requests associated with this employee.</p></div>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as EmployeeResourceTab)}>
                <TabsList className="h-auto flex-wrap justify-start bg-transparent p-0">{employeeResourceTabs.map((tab) => { const Icon = tab.icon; return <TabsTrigger key={tab.value} value={tab.value} className="border border-slate-200 bg-slate-50"><Icon className="h-4 w-4" />{tab.label}</TabsTrigger> })}</TabsList>
                <div className="mt-6"><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${activeTab}…`} className="h-12 rounded-2xl border-slate-100 bg-white" /></div>
                {isHydrating || loading ? <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div> : <>
                    <TabsContent value="requests">{table(<><TableHeader><TableRow><TableHead className="pl-8">Request</TableHead><TableHead>Category</TableHead><TableHead>Type</TableHead><TableHead>Priority</TableHead><TableHead className="pr-8">Status</TableHead></TableRow></TableHeader><TableBody>{filtered.requests.length === 0 ? empty('No requests from this employee.', 5) : filtered.requests.map((item) => <TableRow key={item.id}><TableCell className="py-5 pl-8 font-bold"><Link href={`/resources/${item.id}`} className="hover:text-blue-600">{item.title}</Link></TableCell><TableCell>{item.category || '—'}</TableCell><TableCell>{requestTypeLabel(item.requestType)}</TableCell><TableCell className="capitalize">{item.priority}</TableCell><TableCell className="pr-8"><ResourceRequestStatusBadge status={item.status} /></TableCell></TableRow>)}</TableBody></>)}</TabsContent>
                    <TabsContent value="resources">{table(<><TableHeader><TableRow><TableHead className="pl-8">Type</TableHead><TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead className="pr-8">Status</TableHead></TableRow></TableHeader><TableBody>{filtered.resources.length === 0 ? empty('No resources are assigned to this employee.', 4) : filtered.resources.map((item) => <TableRow key={item.id}><TableCell className="py-5 pl-8 text-sm font-semibold text-slate-600">{labelize(resourceType(item))}</TableCell><TableCell className="py-5 font-bold text-slate-900">{resourceName(item)}</TableCell><TableCell className="py-5 text-slate-600">{item.category}</TableCell><TableCell className="py-5 pr-8"><ResourceBadge value={resourceStatus(item)} /></TableCell></TableRow>)}</TableBody></>)}</TabsContent>
                    <TabsContent value="subscriptions">{table(<><TableHeader><TableRow><TableHead className="pl-8">Subscription</TableHead><TableHead>Account email</TableHead><TableHead>Seats</TableHead><TableHead>Renewal</TableHead><TableHead className="pr-8">Status</TableHead></TableRow></TableHeader><TableBody>{filtered.subscriptions.length === 0 ? empty('No subscriptions are assigned to this employee.', 5) : filtered.subscriptions.map((item) => <TableRow key={item.id}><TableCell className="py-5 pl-8 font-bold">{resourceName(item)}</TableCell><TableCell>{textValue(resourceDetails(item).accountEmail) || '—'}</TableCell><TableCell>{textValue(resourceDetails(item).numberOfSeats) || '—'}</TableCell><TableCell>{formatResourceDate(resourceDetails(item).renewalDate)}</TableCell><TableCell className="pr-8"><ResourceBadge value={resourceStatus(item)} /></TableCell></TableRow>)}</TableBody></>)}</TabsContent>
                    <TabsContent value="reimbursements">{table(<><TableHeader><TableRow><TableHead className="pl-8">Reimbursement</TableHead><TableHead>Invoice</TableHead><TableHead>Date</TableHead><TableHead>Amount</TableHead><TableHead className="pr-8">Payment</TableHead></TableRow></TableHeader><TableBody>{filtered.reimbursements.length === 0 ? empty('No reimbursements were submitted by this employee.', 5) : filtered.reimbursements.map((item) => <TableRow key={item.id}><TableCell className="py-5 pl-8 font-bold">{resourceName(item)}</TableCell><TableCell>{resourceInvoice(item) || '—'}</TableCell><TableCell>{formatResourceDate(resourceDate(item))}</TableCell><TableCell>{resourceCost(item) == null ? '—' : formatCurrency(resourceCost(item) ?? 0, currentCompany?.currency)}</TableCell><TableCell className="pr-8"><ResourceBadge value={resourceIsSettled(item) ? 'paid' : 'pending'} /></TableCell></TableRow>)}</TableBody></>)}</TabsContent>
                    <TabsContent value="books">{table(<><TableHeader><TableRow><TableHead className="pl-8">Title</TableHead><TableHead>Author</TableHead><TableHead>ISBN / accession</TableHead><TableHead className="pr-8">Status</TableHead></TableRow></TableHeader><TableBody>{filtered.books.length === 0 ? empty('No books are assigned to this employee.', 4) : filtered.books.map((item) => <TableRow key={item.id}><TableCell className="py-5 pl-8 font-bold">{resourceName(item)}</TableCell><TableCell>{textValue(resourceDetails(item).author) || '—'}</TableCell><TableCell>{item.identifier || '—'}</TableCell><TableCell className="pr-8"><ResourceBadge value={resourceStatus(item)} /></TableCell></TableRow>)}</TableBody></>)}</TabsContent>
                </>}
            </Tabs>
        </div>
    )
}
