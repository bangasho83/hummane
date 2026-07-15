'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ExternalLink, History, Loader2, MapPin, Pencil, RotateCcw, UserRound } from 'lucide-react'
import type { Resource, Vendor } from '@/types'
import { RESOURCE_ASSIGNMENT_TYPES } from '@/types'
import {
    deleteResourceApi,
    fetchResourceApi,
    fetchVendorsApi,
    updateResourceApi,
    updateResourceAssignmentApi,
    type ResourceAssignmentPayload,
} from '@/lib/api/client'
import { useApp } from '@/lib/context/AppContext'
import { formatCurrency } from '@/lib/utils'
import { toast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DeleteResourceDialog } from './DeleteResourceDialog'
import { ResourceBadge } from './ResourceBadge'
import {
    asRecord,
    assignmentEmployeeId,
    assignmentEmployeeName,
    employeeDisplayName,
    formatResourceDate,
    labelize,
    resourceAssignment,
    resourceAssignmentHistory,
    resourceAttachmentUrls,
    resourceCategory,
    resourceCost,
    resourceCostType,
    resourceDetails,
    resourceId,
    resourceName,
    resourceRecord,
    resourceStatus,
    resourceType,
    resourceVendor,
    textValue,
} from '@/features/resources/resource-ui'

interface ResourceDetailProps { id: string }

export function ResourceDetail({ id }: ResourceDetailProps) {
    const router = useRouter()
    const { apiAccessToken, currentCompany, employees, isHydrating } = useApp()
    const [resource, setResource] = useState<Resource | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [vendors, setVendors] = useState<Vendor[]>([])
    const [assignmentOpen, setAssignmentOpen] = useState(false)
    const [retiring, setRetiring] = useState(false)

    const load = useCallback(async () => {
        if (!apiAccessToken || !id) { setLoading(false); return }
        setLoading(true)
        setError(null)
        try {
            const [item, vendorItems] = await Promise.all([
                fetchResourceApi(id, apiAccessToken),
                fetchVendorsApi(apiAccessToken).catch(() => [] as Vendor[]),
            ])
            if (resourceType(item) === 'expense') throw new Error('Resource not found')
            setResource(item)
            setVendors(vendorItems)
        }
        catch (loadError) { setResource(null); setError(loadError instanceof Error ? loadError.message : 'Resource not found') }
        finally { setLoading(false) }
    }, [apiAccessToken, id])

    useEffect(() => { if (!isHydrating) void load() }, [isHydrating, load])

    const history = useMemo(() => resource ? [...resourceAssignmentHistory(resource)].sort((a, b) => {
        const first = new Date(textValue(a.assignedAt || a.createdAt || a.date)).getTime()
        const second = new Date(textValue(b.assignedAt || b.createdAt || b.date)).getTime()
        return second - first
    }) : [], [resource])

    const employeeNames = useMemo(() => new Map(employees.map((employee) => [employee.id, employeeDisplayName(asRecord(employee))])), [employees])
    const vendorNames = useMemo(() => new Map(vendors.map((vendor) => [vendor.id, vendor.name])), [vendors])

    const remove = async () => {
        if (!apiAccessToken || !resource) return
        try {
            await deleteResourceApi(id, apiAccessToken)
            toast('Resource permanently deleted.', 'success')
            router.push('/resources/assets')
        } catch (deleteError) {
            toast(deleteError instanceof Error ? deleteError.message : 'Failed to delete resource', 'error')
            throw deleteError
        }
    }

    const retire = async () => {
        if (!apiAccessToken || !resource) return
        setRetiring(true)
        try {
            const updated = await updateResourceApi(id, { status: 'retired' }, apiAccessToken)
            setResource(updated)
            toast('Resource retired. Its assignment history has been preserved.', 'success')
        } catch (retireError) {
            toast(retireError instanceof Error ? retireError.message : 'Failed to retire resource', 'error')
        } finally { setRetiring(false) }
    }

    if (isHydrating || loading) return <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
    if (error || !resource) return <div className="space-y-6"><Button variant="ghost" size="icon" className="rounded-xl" onClick={() => router.push('/resources/assets')}><ArrowLeft /></Button><Card className="border-red-100 bg-red-50/50"><CardContent className="space-y-4 p-8 text-center"><p className="text-sm font-medium text-red-700">{error || 'Resource not found'}</p><Button variant="outline" className="rounded-xl" onClick={() => void load()}>Try again</Button></CardContent></Card></div>

    const item = resourceRecord(resource)
    const details = resourceDetails(resource)
    const assignment = resourceAssignment(resource)
    const attachments = resourceAttachmentUrls(resource)
    const cost = resourceCost(resource)
    const assignmentType = textValue(assignment.assignmentType || assignment.type)
    const assignedTo = assignmentType === 'person'
        ? assignmentEmployeeName(assignment, employeeNames) || 'Unknown employee'
        : assignmentType ? labelize(assignmentType) : 'Unassigned'
    const currentTimelineEntry = {
        ...assignment,
        assignmentType: assignmentType || 'unassigned',
        assignedAt: assignment.assignedAt || item.assignedAt || item.updatedAt || item.createdAt,
        isCurrent: true,
    }
    const timeline = [currentTimelineEntry, ...history]

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-500">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-4"><Button variant="ghost" size="icon" className="rounded-xl" onClick={() => router.push('/resources/assets')}><ArrowLeft /></Button><div><p className="text-xs font-bold uppercase tracking-widest text-slate-400">{labelize(resourceType(resource))}</p><h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{resourceName(resource)}</h1></div></div>
                <div className="flex flex-wrap items-center gap-2"><ResourceBadge value={resourceStatus(resource)} /><Button asChild variant="outline" className="rounded-xl border-slate-200"><Link href={`/resources/assets/${id}/edit`}><Pencil />Edit</Link></Button></div>
            </div>

            <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(310px,1fr)]">
                <div className="space-y-6">
                    <Card className="rounded-3xl border-slate-100 bg-white shadow-premium">
                        <CardHeader className="px-8 pt-8"><CardTitle className="text-lg">General information</CardTitle></CardHeader>
                        <CardContent className="space-y-7 p-8 pt-2">
                            <div className="grid grid-cols-2 gap-6 lg:grid-cols-4"><Detail label="Category" value={resourceCategory(resource) || '—'} /><Detail label="Vendor" value={resourceVendor(resource, vendorNames) || '—'} /><Detail label="Cost" value={cost == null ? '—' : formatCurrency(cost, textValue(item.currency) || currentCompany?.currency)} /><Detail label="Cost type" value={resourceCostType(resource) ? labelize(resourceCostType(resource)) : '—'} /></div>
                            <Detail label="Description" value={textValue(item.description) || '—'} multiline />
                            <div className="grid grid-cols-2 gap-6"><Detail label="Created" value={formatResourceDate(item.createdAt, true)} /><Detail label="Updated" value={formatResourceDate(item.updatedAt, true)} /></div>
                        </CardContent>
                    </Card>

                    {Object.keys(details).length > 0 && <Card className="rounded-3xl border-slate-100 bg-white shadow-premium"><CardHeader className="px-8 pt-8"><CardTitle className="text-lg">{labelize(resourceType(resource))} details</CardTitle></CardHeader><CardContent className="grid grid-cols-1 gap-6 p-8 pt-2 sm:grid-cols-2 lg:grid-cols-3">{Object.entries(details).map(([key, value]) => <Detail key={key} label={labelize(key)} value={key.toLowerCase().includes('date') || key.toLowerCase().includes('expiry') || key.toLowerCase().includes('expires') ? formatResourceDate(value) : textValue(value) || '—'} />)}</CardContent></Card>}

                    <Card className="rounded-3xl border-slate-100 bg-white shadow-premium">
                        <CardHeader className="px-8 pt-8"><CardTitle className="text-lg">Attachments</CardTitle></CardHeader>
                        <CardContent className="p-8 pt-2">{attachments.length ? <div className="grid gap-3 sm:grid-cols-2">{attachments.map((url, index) => <a key={url} href={url} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 text-sm font-semibold text-blue-600 hover:border-blue-200 hover:bg-blue-50"><span className="truncate">Attachment {index + 1}</span><ExternalLink className="h-4 w-4 shrink-0" /></a>)}</div> : <p className="text-sm text-slate-500">No attachments.</p>}</CardContent>
                    </Card>

                </div>

                <div className="space-y-6">
                    <div className="space-y-6 xl:sticky xl:top-24">
                    <Card className="rounded-3xl border-slate-100 bg-white shadow-premium">
                        <CardHeader className="px-6 pt-6"><CardTitle className="text-lg">Current assignment</CardTitle></CardHeader>
                        <CardContent className="space-y-5 px-6 pb-6 pt-1">
                            <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4"><UserRound className="mt-0.5 h-5 w-5 text-blue-600" /><div><p className="text-xs font-bold uppercase tracking-widest text-slate-400">Assigned to</p><p className="mt-1 text-sm font-bold text-slate-900">{assignedTo}</p></div></div>
                            {textValue(assignment.location) && <div className="flex items-start gap-3"><MapPin className="mt-0.5 h-4 w-4 text-slate-400" /><p className="text-sm text-slate-600">{textValue(assignment.location)}</p></div>}
                            {textValue(assignment.note) && <p className="rounded-xl border border-slate-100 p-3 text-sm text-slate-600">{textValue(assignment.note)}</p>}
                            <Button className="w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700" onClick={() => setAssignmentOpen(true)}>Update assignment</Button>
                        </CardContent>
                    </Card>
                    <Card className="rounded-3xl border-slate-100 bg-white shadow-premium">
                        <CardHeader className="px-6 pt-6"><CardTitle className="flex items-center gap-2 text-lg"><History className="h-5 w-5 text-slate-400" />Assignment timeline</CardTitle></CardHeader>
                        <CardContent className="px-6 pb-6 pt-1">
                            <div className="space-y-0">{timeline.map((entry, index) => <HistoryEntry key={`${textValue(asRecord(entry).id || asRecord(entry).assignedAt || asRecord(entry).createdAt)}-${index}`} entry={entry} employeeName={assignmentEmployeeName(entry, employeeNames)} last={index === timeline.length - 1} />)}</div>
                        </CardContent>
                    </Card>
                    <Card className="rounded-3xl border-slate-100 bg-white shadow-premium"><CardContent className="space-y-3 p-6"><p className="text-xs font-bold uppercase tracking-widest text-slate-400">Lifecycle</p>{history.length > 0 && resourceStatus(resource) !== 'retired' && <Button variant="outline" className="w-full rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50" disabled={retiring} onClick={() => void retire()}>{retiring ? <Loader2 className="animate-spin" /> : <RotateCcw />}Retire resource</Button>}<DeleteResourceDialog name={resourceName(resource)} onDelete={remove} compact={false} /></CardContent></Card>
                    </div>
                </div>
            </div>
            <AssignmentDialog open={assignmentOpen} setOpen={setAssignmentOpen} resource={resource} employees={employees.map(asRecord)} token={apiAccessToken} onUpdated={setResource} />
        </div>
    )
}

function AssignmentDialog({ open, setOpen, resource, employees, token, onUpdated }: { open: boolean; setOpen: (open: boolean) => void; resource: Resource; employees: Array<Record<string, unknown>>; token: string | null; onUpdated: (resource: Resource) => void }) {
    const current = resourceAssignment(resource)
    const [assignmentType, setAssignmentType] = useState(textValue(current.assignmentType || current.type))
    const [employeeId, setEmployeeId] = useState(assignmentEmployeeId(current))
    const [employeeQuery, setEmployeeQuery] = useState('')
    const [location, setLocation] = useState(textValue(current.location))
    const [note, setNote] = useState(textValue(current.note))
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (!open) return
        const assignment = resourceAssignment(resource)
        setAssignmentType(textValue(assignment.assignmentType || assignment.type))
        setEmployeeId(assignmentEmployeeId(assignment))
        setEmployeeQuery('')
        setLocation(textValue(assignment.location))
        setNote(textValue(assignment.note))
    }, [open, resource])

    const filteredEmployees = employees.filter((employee) =>
        employeeDisplayName(employee).toLowerCase().includes(employeeQuery.trim().toLowerCase())
    )

    const save = async () => {
        if (!token || !assignmentType || (assignmentType === 'person' && !employeeId)) return
        const payload = {
            assignmentType,
            assignedToEmployeeId: assignmentType === 'person' ? employeeId : undefined,
            location: location.trim() || undefined,
            note: note.trim() || undefined,
        } as ResourceAssignmentPayload
        setSaving(true)
        try {
            const updated = await updateResourceAssignmentApi(resourceId(resource), payload, token)
            onUpdated(updated)
            setOpen(false)
            toast('Assignment updated.', 'success')
        } catch (error) { toast(error instanceof Error ? error.message : 'Failed to update assignment', 'error') }
        finally { setSaving(false) }
    }

    return <Dialog open={open} onOpenChange={setOpen}><DialogContent className="rounded-3xl border-slate-100 sm:max-w-xl"><DialogHeader><DialogTitle>Update assignment</DialogTitle><DialogDescription>Assignment changes are recorded in this resource&apos;s history.</DialogDescription></DialogHeader><div className="grid gap-5 py-3 sm:grid-cols-2"><div className="space-y-2"><Label>Assignment type *</Label><Select value={assignmentType} onValueChange={setAssignmentType} disabled={saving}><SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Select assignment" /></SelectTrigger><SelectContent>{(RESOURCE_ASSIGNMENT_TYPES as readonly string[]).map((type) => <SelectItem key={type} value={type}>{labelize(type)}</SelectItem>)}</SelectContent></Select></div>{assignmentType === 'person' && <div className="space-y-2"><Label>Employee *</Label><Select value={employeeId} onValueChange={setEmployeeId} disabled={saving}><SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Select employee" /></SelectTrigger><SelectContent className="max-h-72 overflow-y-auto"><div className="sticky top-0 z-10 border-b border-slate-100 bg-white p-2"><Input value={employeeQuery} onChange={(event) => setEmployeeQuery(event.target.value)} placeholder="Search employees..." className="h-9 rounded-lg" onKeyDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()} /></div>{filteredEmployees.length > 0 ? filteredEmployees.map((employee) => <SelectItem key={textValue(employee.id)} value={textValue(employee.id)}>{employeeDisplayName(employee)}</SelectItem>) : <SelectItem value="no-results" disabled>No employees found</SelectItem>}</SelectContent></Select></div>}<div className="space-y-2 sm:col-span-2"><Label>Location</Label><Input value={location} onChange={(event) => setLocation(event.target.value)} className="h-11 rounded-xl" disabled={saving} /></div><div className="space-y-2 sm:col-span-2"><Label>Note</Label><Textarea value={note} onChange={(event) => setNote(event.target.value)} className="min-h-24 rounded-xl" disabled={saving} /></div></div><DialogFooter><Button variant="outline" className="rounded-xl" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button><Button className="rounded-xl bg-blue-600 text-white hover:bg-blue-700" onClick={() => void save()} disabled={saving || !assignmentType || (assignmentType === 'person' && !employeeId)}>{saving && <Loader2 className="animate-spin" />}Save assignment</Button></DialogFooter></DialogContent></Dialog>
}

function HistoryEntry({ entry, employeeName, last }: { entry: Record<string, unknown>; employeeName?: string; last: boolean }) {
    const type = textValue(entry.assignmentType || entry.type)
    const name = type === 'person' ? employeeName || textValue(entry.assignedToEmployeeName || entry.employeeName) || 'Unknown employee' : labelize(type || 'Unassigned')
    const isCurrent = entry.isCurrent === true
    return <div className="relative flex gap-4 pb-7 last:pb-0"><div className="relative flex w-3 justify-center">{!last && <span className="absolute bottom-[-28px] top-3 w-px bg-slate-200" />}<span className={`relative mt-1.5 h-3 w-3 rounded-full border-2 border-blue-600 ${isCurrent ? 'bg-blue-600' : 'bg-white'}`} /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><p className="text-sm font-bold text-slate-900">{name}{isCurrent && <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] uppercase tracking-wide text-blue-700">Current</span>}</p><p className="text-xs text-slate-400">{formatResourceDate(entry.assignedAt || entry.createdAt || entry.date, true)}</p></div>{textValue(entry.unassignedAt) && <p className="mt-1 text-xs text-slate-400">Unassigned {formatResourceDate(entry.unassignedAt, true)}</p>}{textValue(entry.location) && <p className="mt-1 text-sm text-slate-600">{textValue(entry.location)}</p>}{textValue(entry.note) && <p className="mt-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{textValue(entry.note)}</p>}</div></div>
}

function Detail({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) { return <div><p className="text-xs font-bold uppercase tracking-widest text-slate-400">{label}</p><p className={`mt-1 text-sm text-slate-700 ${multiline ? 'whitespace-pre-wrap' : 'font-semibold'}`}>{value}</p></div> }
