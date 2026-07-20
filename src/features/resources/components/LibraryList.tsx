'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { BookOpen, Eye, Loader2, Plus, Search } from 'lucide-react'
import type { Resource } from '@/types'
import { RESOURCE_STATUSES } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { fetchResourcesApi } from '@/lib/api/client'
import { useApp } from '@/lib/context/AppContext'
import {
    asRecord,
    assignmentEmployeeName,
    employeeDisplayName,
    formatResourceDate,
    labelize,
    resourceAssignment,
    resourceId,
    resourceName,
    resourceRecord,
    resourceStatus,
    textValue,
} from '../resource-ui'
import { isLibraryBook, libraryBookDetail } from '../library'
import { ResourceBadge } from './ResourceBadge'

export function LibraryList() {
    const { apiAccessToken, employees, isHydrating } = useApp()
    const [books, setBooks] = useState<Resource[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [availabilityFilter, setAvailabilityFilter] = useState('all')

    const load = useCallback(async () => {
        if (!apiAccessToken) { setLoading(false); return }
        setLoading(true)
        setError(null)
        try {
            const resources = await fetchResourcesApi(apiAccessToken, { resourceType: 'physical_asset', limit: 100 })
            setBooks(resources.filter(isLibraryBook))
        } catch (loadError) {
            setBooks([])
            setError(loadError instanceof Error ? loadError.message : 'Failed to load library books')
        } finally { setLoading(false) }
    }, [apiAccessToken])

    useEffect(() => { if (!isHydrating) void load() }, [isHydrating, load])

    const employeeNames = useMemo(() => new Map(employees.map((employee) => [
        employee.id,
        employeeDisplayName(asRecord(employee)),
    ])), [employees])

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase()
        return [...books].filter((book) => {
            const assignment = resourceAssignment(book)
            const checkedOut = textValue(assignment.assignmentType || assignment.type) === 'person'
            const matchesSearch = !term || [
                resourceName(book), textValue(resourceRecord(book).identifier),
                libraryBookDetail(book, 'author'), libraryBookDetail(book, 'isbn'),
                assignmentEmployeeName(assignment, employeeNames),
            ].join(' ').toLowerCase().includes(term)
            return matchesSearch
                && (statusFilter === 'all' || resourceStatus(book) === statusFilter)
                && (availabilityFilter === 'all' || (availabilityFilter === 'checked_out' ? checkedOut : !checkedOut))
        }).sort((a, b) => resourceName(a).localeCompare(resourceName(b)))
    }, [availabilityFilter, books, employeeNames, search, statusFilter])

    const hasFilters = !!search || statusFilter !== 'all' || availabilityFilter !== 'all'

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-500">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
                <div><h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Library</h1><p className="font-medium text-slate-500">Manage office books, checkouts, and returns.</p></div>
                <Button asChild className="h-auto rounded-2xl bg-blue-600 px-6 py-4 font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700"><Link href="/resources/library/new"><Plus className="h-5 w-5" />Add book</Link></Button>
            </div>
            <Card className="overflow-hidden rounded-3xl border-slate-100 bg-white shadow-premium">
                <CardContent className="p-0">
                    <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-6 sm:p-8">
                        <div className="relative min-w-[240px] flex-1"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search title, author, ISBN, ID, or employee…" className="h-12 rounded-2xl border-slate-100 bg-slate-50 pl-11" /></div>
                        <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}><SelectTrigger className="h-12 w-[180px] rounded-2xl border-slate-100 bg-slate-50"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All availability</SelectItem><SelectItem value="available">Available</SelectItem><SelectItem value="checked_out">Checked out</SelectItem></SelectContent></Select>
                        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="h-12 w-[170px] rounded-2xl border-slate-100 bg-slate-50"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{RESOURCE_STATUSES.map((status) => <SelectItem key={status} value={status}>{labelize(status)}</SelectItem>)}</SelectContent></Select>
                        {hasFilters && <button type="button" onClick={() => { setSearch(''); setStatusFilter('all'); setAvailabilityFilter('all') }} className="text-sm font-semibold text-slate-500 hover:text-red-600">Reset</button>}
                    </div>
                    {isHydrating || loading ? <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div> : error ? <div className="space-y-4 p-20 text-center"><p className="text-sm font-medium text-red-700">{error}</p><Button variant="outline" className="rounded-xl" onClick={() => void load()}>Try again</Button></div> : filtered.length === 0 ? <div className="p-20 text-center"><BookOpen className="mx-auto mb-4 h-10 w-10 text-slate-300" /><p className="font-medium text-slate-500">{hasFilters ? 'No books match your filters.' : 'No books have been added yet.'}</p></div> : (
                        <div className="overflow-x-auto"><Table className="min-w-[980px]">
                            <TableHeader className="bg-slate-50/50"><TableRow className="border-slate-100 hover:bg-transparent"><Head className="pl-8">Book</Head><Head>Author</Head><Head>Book ID</Head><Head>Location</Head><Head>Status</Head><Head>Checked out to</Head><Head>Due date</Head><Head className="pr-8 text-right">Action</Head></TableRow></TableHeader>
                            <TableBody>{filtered.map((book) => { const item = resourceRecord(book); const assignment = resourceAssignment(book); const checkedOut = textValue(assignment.assignmentType || assignment.type) === 'person'; return <TableRow key={resourceId(book)} className="border-slate-50 hover:bg-slate-50/50"><TableCell className="py-5 pl-8"><Link href={`/resources/library/${resourceId(book)}`} className="font-bold text-slate-900 hover:text-slate-700">{resourceName(book)}</Link><p className="mt-1 text-xs text-slate-400">{libraryBookDetail(book, 'isbn') || 'No ISBN'}</p></TableCell><TableCell className="py-5 text-sm text-slate-600">{libraryBookDetail(book, 'author') || '—'}</TableCell><TableCell className="py-5 text-sm font-semibold text-slate-600">{textValue(item.identifier) || '—'}</TableCell><TableCell className="py-5 text-sm text-slate-600">{textValue(assignment.location || item.location) || '—'}</TableCell><TableCell className="py-5"><ResourceBadge value={resourceStatus(book)} /></TableCell><TableCell className="py-5 text-sm font-semibold text-slate-700">{checkedOut ? assignmentEmployeeName(assignment, employeeNames) || 'Unknown employee' : <span className="text-emerald-600">Available</span>}</TableCell><TableCell className="py-5 text-sm text-slate-500">{checkedOut ? formatResourceDate(libraryBookDetail(book, 'dueDate')) : '—'}</TableCell><TableCell className="py-5 pr-8 text-right"><Button asChild variant="ghost" size="icon" className="rounded-xl"><Link href={`/resources/library/${resourceId(book)}`} aria-label={`View ${resourceName(book)}`}><Eye /></Link></Button></TableCell></TableRow> })}</TableBody>
                        </Table></div>
                    )}
                    <div className="border-t border-slate-50 bg-slate-50/30 px-8 py-5 text-xs font-bold uppercase tracking-widest text-slate-400">{filtered.length} {filtered.length === 1 ? 'book' : 'books'}</div>
                </CardContent>
            </Card>
        </div>
    )
}

function Head({ children, className = '' }: { children: React.ReactNode; className?: string }) { return <TableHead className={`py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 ${className}`}>{children}</TableHead> }