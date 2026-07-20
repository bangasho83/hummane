'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, Loader2, Package, Pencil, Plus, Search } from 'lucide-react'
import type { Resource, Vendor } from '@/types'
import { RESOURCE_ASSIGNMENT_TYPES, RESOURCE_STATUSES, RESOURCE_TYPES } from '@/types'
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
import { isLibraryBook } from '../library'
import {
    asRecord,
    assignmentEmployeeId,
    assignmentEmployeeName,
    employeeDisplayName,
    labelize,
    resourceAssignment,
    resourceAssignmentHistory,
    resourceCategory,
    resourceCost,
    resourceCostType,
    resourceId,
    resourceName,
    resourceStatus,
    resourceType,
    resourceVendor,
    resourceRecord,
    textValue,
} from '@/features/resources/resource-ui'

export function AssetList() {
    const router = useRouter()
    const { apiAccessToken, currentCompany, employees, isHydrating } = useApp()
    const [resources, setResources] = useState<Resource[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [vendors, setVendors] = useState<Vendor[]>([])
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState('all')
    const [statusFilter, setStatusFilter] = useState('all')
    const [categoryFilter, setCategoryFilter] = useState('all')
    const [assignmentFilter, setAssignmentFilter] = useState('all')
    const [employeeFilter, setEmployeeFilter] = useState('all')
    const [vendorFilter, setVendorFilter] = useState('all')

    const load = useCallback(async () => {
        if (!apiAccessToken) {
            setLoading(false)
            return
        }
        setLoading(true)
        setError(null)
        try {
            const [items, vendorItems] = await Promise.all([
                fetchResourcesApi(apiAccessToken, { limit: 100 }),
                fetchVendorsApi(apiAccessToken).catch(() => [] as Vendor[]),
            ])
            setResources(items.filter((item) => resourceType(item) !== 'expense' && !isLibraryBook(item)))
            setVendors(vendorItems)
        } catch (loadError) {
            setResources([])
            setError(loadError instanceof Error ? loadError.message : 'Failed to load resources')
        } finally {
            setLoading(false)
        }
    }, [apiAccessToken])

    useEffect(() => { if (!isHydrating) void load() }, [isHydrating, load])

    const employeeNames = useMemo(() => new Map(employees.map((employee) => [employee.id, employeeDisplayName(asRecord(employee))])), [employees])
    const vendorNames = useMemo(() => new Map(vendors.map((vendor) => [vendor.id, vendor.name])), [vendors])
    const categories = useMemo(() => [...new Set(resources.map(resourceCategory).filter(Boolean))].sort(), [resources])
    const assignmentName = useCallback((resource: Resource) => {
        const assignment = resourceAssignment(resource)
        const type = textValue(assignment.assignmentType || assignment.type)
        if (!type || type === 'unassigned') return 'Unassigned'
        if (type === 'person') {
            const latestPerson = [...resourceAssignmentHistory(resource)]
                .sort((a, b) => new Date(textValue(b.assignedAt)).getTime() - new Date(textValue(a.assignedAt)).getTime())
                .find((entry) => textValue(entry.assignmentType || entry.type) === 'person')
            return assignmentEmployeeName(assignment, employeeNames)
                || (latestPerson ? assignmentEmployeeName(latestPerson, employeeNames) : '')
                || 'Unknown employee'
        }
        return labelize(type)
    }, [employeeNames])

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase()
        return resources.filter((resource) => {
            const assignment = resourceAssignment(resource)
            const assignmentType = textValue(assignment.assignmentType || assignment.type) || 'unassigned'
            const vendorId = textValue(resourceRecord(resource).vendorId)
            const searchable = [resourceName(resource), resourceCategory(resource), resourceVendor(resource, vendorNames), assignmentName(resource)].join(' ').toLowerCase()
            return (!term || searchable.includes(term))
                && (typeFilter === 'all' || resourceType(resource) === typeFilter)
                && (statusFilter === 'all' || resourceStatus(resource) === statusFilter)
                && (categoryFilter === 'all' || resourceCategory(resource) === categoryFilter)
                && (assignmentFilter === 'all' || assignmentType === assignmentFilter)
                && (employeeFilter === 'all' || assignmentEmployeeId(assignment) === employeeFilter)
                && (vendorFilter === 'all' || vendorId === vendorFilter)
        })
    }, [resources, search, typeFilter, statusFilter, categoryFilter, assignmentFilter, employeeFilter, vendorFilter, assignmentName, vendorNames])

    const remove = async (resource: Resource) => {
        if (!apiAccessToken) return
        try {
            await deleteResourceApi(resourceId(resource), apiAccessToken)
            setResources((current) => current.filter((item) => resourceId(item) !== resourceId(resource)))
            toast('Resource deleted.', 'success')
        } catch (deleteError) {
            toast(deleteError instanceof Error ? deleteError.message : 'Failed to delete resource', 'error')
            throw deleteError
        }
    }

    const hasFilters = !!search || typeFilter !== 'all' || statusFilter !== 'all' || categoryFilter !== 'all' || assignmentFilter !== 'all' || employeeFilter !== 'all' || vendorFilter !== 'all'
    const reset = () => { setSearch(''); setTypeFilter('all'); setStatusFilter('all'); setCategoryFilter('all'); setAssignmentFilter('all'); setEmployeeFilter('all'); setVendorFilter('all') }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-500">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
                <div><h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Assets &amp; Resources</h1><p className="font-medium text-slate-500">Manage approved company resources, services, and assignments.</p></div>
                <Button asChild className="h-auto rounded-2xl bg-blue-600 px-6 py-4 font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700"><Link href="/resources/assets/new"><Plus className="h-5 w-5" />Add resource</Link></Button>
            </div>
            <Card className="overflow-hidden rounded-3xl border-slate-100 bg-white shadow-premium">
                <CardContent className="p-0">
                    <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-5 sm:p-8">
                        <div className="relative min-w-[240px] flex-1"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search resources…" className="h-12 rounded-2xl border-slate-100 bg-slate-50 pl-11" /></div>
                        <Filter value={typeFilter} setValue={setTypeFilter} label="All types" options={(RESOURCE_TYPES as readonly string[]).filter((item) => item !== 'expense')} />
                        <Filter value={statusFilter} setValue={setStatusFilter} label="All statuses" options={RESOURCE_STATUSES as readonly string[]} />
                        <Filter value={categoryFilter} setValue={setCategoryFilter} label="All categories" options={categories} rawLabels />
                        <Filter value={assignmentFilter} setValue={setAssignmentFilter} label="All assignments" options={RESOURCE_ASSIGNMENT_TYPES as readonly string[]} />
                        <NamedFilter value={employeeFilter} setValue={setEmployeeFilter} label="All employees" options={employees.map((employee) => ({ value: employee.id, label: employeeDisplayName(asRecord(employee)) }))} />
                        <NamedFilter value={vendorFilter} setValue={setVendorFilter} label="All vendors" options={vendors.map((vendor) => ({ value: vendor.id, label: vendor.name }))} />
                        {hasFilters && <button type="button" onClick={reset} className="text-sm font-semibold text-slate-500 hover:text-red-600">Reset</button>}
                    </div>
                    {isHydrating || loading ? <Loading /> : error ? <ErrorState error={error} retry={load} /> : filtered.length === 0 ? <Empty filtered={hasFilters} /> : (
                        <div className="overflow-x-auto">
                            <Table className="min-w-[1050px]">
                                <TableHeader className="bg-slate-50/50"><TableRow className="border-slate-100 hover:bg-transparent"><Head className="pl-8">Type</Head><Head>Name</Head><Head>Category</Head><Head>Status</Head><Head>Vendor</Head><Head>Current assignee</Head><Head>Cost</Head><Head className="pr-8 text-right">Actions</Head></TableRow></TableHeader>
                                <TableBody>{filtered.map((resource) => {
                                    const cost = resourceCost(resource)
                                    const id = resourceId(resource)
                                    return <TableRow
                                        key={id}
                                        role="link"
                                        tabIndex={0}
                                        aria-label={`Open ${resourceName(resource)}`}
                                        className="cursor-pointer border-slate-50 hover:bg-slate-50/70 focus-visible:bg-blue-50/50 focus-visible:outline-none"
                                        onClick={() => router.push(`/resources/assets/${id}`)}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter' || event.key === ' ') {
                                                event.preventDefault()
                                                router.push(`/resources/assets/${id}`)
                                            }
                                        }}
                                    >
                                        <TableCell className="py-5 pl-8 text-sm font-semibold text-slate-600">{labelize(resourceType(resource))}</TableCell>
                                        <TableCell className="py-5"><Link href={`/resources/assets/${id}`} className="font-bold text-slate-900 hover:text-blue-600" onClick={(event) => event.stopPropagation()}>{resourceName(resource)}</Link></TableCell>
                                        <TableCell className="py-5 text-sm text-slate-600">{resourceCategory(resource) || '—'}</TableCell>
                                        <TableCell className="py-5"><ResourceBadge value={resourceStatus(resource)} /></TableCell>
                                        <TableCell className="py-5 text-sm text-slate-600">{resourceVendor(resource, vendorNames) || '—'}</TableCell>
                                        <TableCell className="py-5 text-sm text-slate-600">{assignmentName(resource)}</TableCell>
                                        <TableCell className="py-5 text-sm text-slate-600"><span className="font-semibold text-slate-800">{cost == null ? '—' : formatCurrency(cost, currentCompany?.currency)}</span>{resourceCostType(resource) && <span className="block text-xs text-slate-400">{labelize(resourceCostType(resource))}</span>}</TableCell>
                                        <TableCell className="py-5 pr-8" onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}><div className="flex justify-end gap-1"><IconLink href={`/resources/assets/${id}`} label="View"><Eye /></IconLink><IconLink href={`/resources/assets/${id}/edit`} label="Edit"><Pencil /></IconLink><DeleteResourceDialog name={resourceName(resource)} onDelete={() => remove(resource)} /></div></TableCell>
                                    </TableRow>
                                })}</TableBody>
                            </Table>
                        </div>
                    )}
                    <div className="border-t border-slate-50 bg-slate-50/30 px-8 py-5 text-xs font-bold uppercase tracking-widest text-slate-400">{filtered.length} {filtered.length === 1 ? 'resource' : 'resources'}</div>
                </CardContent>
            </Card>
        </div>
    )
}

function Filter({ value, setValue, label, options, rawLabels = false }: { value: string; setValue: (value: string) => void; label: string; options: readonly string[]; rawLabels?: boolean }) {
    return <Select value={value} onValueChange={setValue}><SelectTrigger className="h-12 w-[170px] rounded-2xl border-slate-100 bg-slate-50"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">{label}</SelectItem>{options.map((option) => <SelectItem value={option} key={option}>{rawLabels ? option : labelize(option)}</SelectItem>)}</SelectContent></Select>
}
function NamedFilter({ value, setValue, label, options }: { value: string; setValue: (value: string) => void; label: string; options: Array<{ value: string; label: string }> }) {
    return <Select value={value} onValueChange={setValue}><SelectTrigger className="h-12 w-[180px] rounded-2xl border-slate-100 bg-slate-50"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">{label}</SelectItem>{options.map((option) => <SelectItem value={option.value} key={option.value}>{option.label}</SelectItem>)}</SelectContent></Select>
}
function Head({ children, className = '' }: { children: React.ReactNode; className?: string }) { return <TableHead className={`py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 ${className}`}>{children}</TableHead> }
function IconLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) { return <Button asChild variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-300 hover:bg-blue-50 hover:text-blue-600"><Link href={href} aria-label={label}>{children}</Link></Button> }
function Loading() { return <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div> }
function ErrorState({ error, retry }: { error: string; retry: () => Promise<void> }) { return <div className="space-y-4 p-20 text-center"><p className="text-sm font-medium text-red-700">{error}</p><Button variant="outline" className="rounded-xl" onClick={() => void retry()}>Try again</Button></div> }
function Empty({ filtered }: { filtered: boolean }) { return <div className="p-20 text-center"><Package className="mx-auto mb-4 h-10 w-10 text-slate-300" /><p className="font-medium text-slate-500">{filtered ? 'No resources match your filters.' : 'No approved resources yet.'}</p></div> }
