'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { BookOpen, Loader2, Pencil, Plus, Search } from 'lucide-react'
import type { Resource } from '@/types'
import { RESOURCE_STATUSES } from '@/types'
import { deleteResourceApi, fetchResourcesApi } from '@/lib/api/client'
import { useApp } from '@/lib/context/AppContext'
import { toast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DeleteResourceDialog } from './DeleteResourceDialog'
import { ResourceBadge } from './ResourceBadge'
import {
    asRecord,
    assignmentEmployeeName,
    employeeDisplayName,
    resourceAssignment,
    resourceDetails,
    resourceId,
    resourceName,
    resourceStatus,
    textValue,
} from '@/features/resources/resource-ui'

export function BookList() {
    const { apiAccessToken, employees, isHydrating } = useApp()
    const [books, setBooks] = useState<Resource[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')

    const load = useCallback(async () => {
        if (!apiAccessToken) { setLoading(false); return }
        setLoading(true)
        try { setBooks(await fetchResourcesApi(apiAccessToken, { resourceType: 'book', limit: 100 })) }
        catch { setBooks([]) }
        finally { setLoading(false) }
    }, [apiAccessToken])

    useEffect(() => { if (!isHydrating) void load() }, [isHydrating, load])

    const employeeNames = useMemo(() => new Map(employees.map((employee) => [employee.id, employeeDisplayName(asRecord(employee))])), [employees])
    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase()
        return books.filter((book) => {
            const details = resourceDetails(book)
            const assignment = resourceAssignment(book)
            const assignedTo = assignmentEmployeeName(assignment, employeeNames)
            const searchText = `${resourceName(book)} ${textValue(details.author)} ${textValue(book.identifier)} ${assignedTo}`.toLowerCase()
            return (!term || searchText.includes(term)) && (statusFilter === 'all' || resourceStatus(book) === statusFilter)
        })
    }, [books, employeeNames, search, statusFilter])

    const remove = async (book: Resource) => {
        if (!apiAccessToken) return
        try {
            await deleteResourceApi(resourceId(book), apiAccessToken)
            setBooks((current) => current.filter((item) => resourceId(item) !== resourceId(book)))
            toast('Book deleted.', 'success')
        } catch (error) {
            toast(error instanceof Error ? error.message : 'Failed to delete book', 'error')
            throw error
        }
    }

    return <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-500">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end"><div><h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Books</h1><p className="font-medium text-slate-500">Manage physical book copies and assign them to employees.</p></div><Button asChild className="h-auto rounded-2xl bg-blue-600 px-6 py-4 font-bold text-white"><Link href="/resources/books/new"><Plus className="h-5 w-5" />Add book</Link></Button></div>
        <Card className="overflow-hidden rounded-3xl border-slate-100 bg-white shadow-premium"><CardContent className="p-0">
            <div className="flex flex-wrap gap-3 border-b border-slate-100 p-5 sm:p-8"><div className="relative min-w-[240px] flex-1"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search title, author, ISBN, or assignee…" className="h-12 rounded-2xl border-slate-100 bg-slate-50 pl-11" /></div><Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="h-12 w-[170px] rounded-2xl border-slate-100 bg-slate-50"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{RESOURCE_STATUSES.map((status) => <SelectItem key={status} value={status}>{status.replace('_', ' ')}</SelectItem>)}</SelectContent></Select></div>
            {isHydrating || loading ? <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div> : filtered.length === 0 ? <div className="p-20 text-center"><BookOpen className="mx-auto mb-4 h-10 w-10 text-slate-300" /><p className="font-medium text-slate-500">No books found.</p></div> : <div className="overflow-x-auto"><Table className="min-w-[900px]"><TableHeader className="bg-slate-50/50"><TableRow className="border-slate-100 hover:bg-transparent"><TableHead className="pl-8">Title</TableHead><TableHead>Author</TableHead><TableHead>ISBN / accession</TableHead><TableHead>Status</TableHead><TableHead>Current assignee</TableHead><TableHead className="pr-8 text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{filtered.map((book) => { const id = resourceId(book); const assignment = resourceAssignment(book); const assignee = assignmentEmployeeName(assignment, employeeNames) || 'Unassigned'; return <TableRow key={id} className="border-slate-50"><TableCell className="py-5 pl-8"><Link href={`/resources/books/${id}`} className="font-bold text-slate-900 hover:text-blue-600">{resourceName(book)}</Link></TableCell><TableCell className="py-5 text-sm text-slate-600">{textValue(resourceDetails(book).author) || '—'}</TableCell><TableCell className="py-5 text-sm text-slate-600">{textValue(book.identifier) || '—'}</TableCell><TableCell className="py-5"><ResourceBadge value={resourceStatus(book)} /></TableCell><TableCell className="py-5 text-sm text-slate-600">{assignee}</TableCell><TableCell className="py-5 pr-8"><div className="flex justify-end gap-1"><Button asChild variant="ghost" size="icon" aria-label="Edit book"><Link href={`/resources/books/${id}/edit`}><Pencil /></Link></Button><DeleteResourceDialog name={resourceName(book)} onDelete={() => remove(book)} /></div></TableCell></TableRow> })}</TableBody></Table></div>}
            <div className="border-t border-slate-50 bg-slate-50/30 px-8 py-5 text-xs font-bold uppercase tracking-widest text-slate-400">{filtered.length} {filtered.length === 1 ? 'book' : 'books'}</div>
        </CardContent></Card>
    </div>
}