'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { BookOpen, Loader2, Package, RefreshCw } from 'lucide-react'
import type { Resource } from '@/types'
import { fetchResourcesApi } from '@/lib/api/client'
import { useApp } from '@/lib/context/AppContext'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ResourceBadge } from '@/features/resources/components/ResourceBadge'
import { formatResourceDate, labelize, resourceDetails, resourceName, resourceStatus, resourceType, textValue } from '@/features/resources/resource-ui'

type MemberRegister = 'resources' | 'subscriptions' | 'books'

const registerContent = {
    resources: {
        title: 'Resources',
        description: 'Equipment and other company resources currently assigned to you.',
        empty: 'No resources are currently assigned to you.',
        icon: Package,
    },
    subscriptions: {
        title: 'Subscriptions',
        description: 'Software subscriptions and accounts assigned to you.',
        empty: 'No subscriptions are currently assigned to you.',
        icon: RefreshCw,
    },
    books: {
        title: 'Books',
        description: 'Books currently assigned to you.',
        empty: 'No books are currently assigned to you.',
        icon: BookOpen,
    },
} as const

export function MemberAssignedResourceList({ register }: { register: MemberRegister }) {
    const { apiAccessToken, isHydrating, meProfile } = useApp()
    const [items, setItems] = useState<Resource[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const employeeId = meProfile?.employeeId
    const content = registerContent[register]

    const load = useCallback(async () => {
        if (!apiAccessToken || !employeeId) {
            setItems([])
            setLoading(false)
            return
        }
        setLoading(true)
        try {
            const resourceTypeFilter = register === 'subscriptions' ? 'subscription' : register === 'books' ? 'book' : undefined
            const resources = await fetchResourcesApi(apiAccessToken, { assignedToEmployeeId: employeeId, resourceType: resourceTypeFilter, limit: 100 })
            setItems(register === 'resources' ? resources.filter((item) => !['book', 'subscription', 'expense', 'reimbursement'].includes(resourceType(item))) : resources)
        } catch {
            setItems([])
        } finally {
            setLoading(false)
        }
    }, [apiAccessToken, employeeId, register])

    useEffect(() => { if (!isHydrating) void load() }, [isHydrating, load])

    const filteredItems = useMemo(() => {
        const term = search.trim().toLowerCase()
        if (!term) return items
        return items.filter((item) => `${resourceName(item)} ${item.category} ${item.identifier || ''} ${textValue(resourceDetails(item).author)} ${textValue(resourceDetails(item).accountEmail)}`.toLowerCase().includes(term))
    }, [items, search])

    const Icon = content.icon
    return (
        <div className="space-y-6">
            <div>
                <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.2em] text-blue-600">Employee Portal</p>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{content.title}</h1>
                <p className="font-medium text-slate-500">{content.description}</p>
            </div>
            <Card className="overflow-hidden rounded-3xl border-slate-100 bg-white shadow-premium">
                <CardContent className="p-0">
                    <div className="border-b border-slate-100 p-5 sm:p-8"><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search your ${content.title.toLowerCase()}…`} className="h-12 rounded-2xl border-slate-100 bg-slate-50" /></div>
                    {isHydrating || loading ? <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div> : filteredItems.length === 0 ? <div className="p-20 text-center"><Icon className="mx-auto mb-4 h-10 w-10 text-slate-300" /><p className="font-medium text-slate-500">{search ? 'No assigned items match your search.' : content.empty}</p></div> : (
                        <div className="overflow-x-auto"><Table><TableHeader className="bg-slate-50/50"><TableRow className="border-slate-100 hover:bg-transparent">{register === 'books' ? <><TableHead className="pl-8">Title</TableHead><TableHead>Author</TableHead><TableHead>ISBN / accession</TableHead></> : register === 'subscriptions' ? <><TableHead className="pl-8">Subscription</TableHead><TableHead>Account email</TableHead><TableHead>Seats</TableHead><TableHead>Renewal</TableHead></> : <><TableHead className="pl-8">Type</TableHead><TableHead>Name</TableHead><TableHead>Category</TableHead></>}<TableHead className="pr-8">Status</TableHead></TableRow></TableHeader><TableBody>{filteredItems.map((item) => <TableRow key={item.id} className="border-slate-50">{register === 'books' ? <><TableCell className="py-5 pl-8 font-bold text-slate-900">{resourceName(item)}</TableCell><TableCell className="py-5 text-sm text-slate-600">{textValue(resourceDetails(item).author) || '—'}</TableCell><TableCell className="py-5 text-sm text-slate-600">{item.identifier || '—'}</TableCell></> : register === 'subscriptions' ? <><TableCell className="py-5 pl-8 font-bold text-slate-900">{resourceName(item)}</TableCell><TableCell className="py-5 text-sm text-slate-600">{textValue(resourceDetails(item).accountEmail) || '—'}</TableCell><TableCell className="py-5 text-sm text-slate-600">{textValue(resourceDetails(item).numberOfSeats) || '—'}</TableCell><TableCell className="py-5 text-sm text-slate-600">{formatResourceDate(resourceDetails(item).renewalDate)}</TableCell></> : <><TableCell className="py-5 pl-8 text-sm font-semibold text-slate-600">{labelize(resourceType(item))}</TableCell><TableCell className="py-5 font-bold text-slate-900">{resourceName(item)}</TableCell><TableCell className="py-5 text-sm text-slate-600">{item.category}</TableCell></>}<TableCell className="py-5 pr-8"><ResourceBadge value={resourceStatus(item)} /></TableCell></TableRow>)}</TableBody></Table></div>
                    )}
                    {!isHydrating && !loading && filteredItems.length > 0 && <div className="border-t border-slate-50 bg-slate-50/30 px-8 py-5 text-xs font-bold uppercase tracking-widest text-slate-400">{filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}</div>}
                </CardContent>
            </Card>
        </div>
    )
}