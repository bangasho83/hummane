'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, Package } from 'lucide-react'
import type { Resource } from '@/types'
import { fetchResourcesApi } from '@/lib/api/client'
import { useApp } from '@/lib/context/AppContext'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ResourceBadge } from '@/features/resources/components/ResourceBadge'
import { labelize } from '@/features/resources/resource-ui'
import { formatCurrency } from '@/lib/utils'

export default function MemberResourcesPage() {
    const { apiAccessToken, currentCompany, isHydrating, meProfile } = useApp()
    const [resources, setResources] = useState<Resource[]>([])
    const [loading, setLoading] = useState(true)

    const employeeId = meProfile?.employeeId
    const load = useCallback(async () => {
        if (!apiAccessToken || !employeeId) {
            setResources([])
            setLoading(false)
            return
        }
        setLoading(true)
        try {
            setResources(await fetchResourcesApi(apiAccessToken, {
                assignedToEmployeeId: employeeId,
                limit: 100,
            }))
        } catch {
            setResources([])
        } finally {
            setLoading(false)
        }
    }, [apiAccessToken, employeeId])

    useEffect(() => {
        if (!isHydrating) void load()
    }, [isHydrating, load])

    return (
        <div className="space-y-6">
            <div>
                <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.2em] text-blue-600">Employee Portal</p>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Library</h1>
                <p className="font-medium text-slate-500">Resources currently assigned to you.</p>
            </div>
            <Card className="overflow-hidden rounded-3xl border-slate-100 bg-white shadow-premium">
                <CardContent className="p-0">
                    {isHydrating || loading ? <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div> : resources.length === 0 ? <div className="p-20 text-center"><Package className="mx-auto mb-4 h-10 w-10 text-slate-300" /><p className="font-medium text-slate-500">No resources are currently assigned to you.</p></div> : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-50/50"><TableRow className="border-slate-100 hover:bg-transparent"><TableHead className="pl-8">Type</TableHead><TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead>Status</TableHead><TableHead className="pr-8">Cost</TableHead></TableRow></TableHeader>
                                <TableBody>{resources.map((resource) => <TableRow key={resource.id} className="border-slate-50"><TableCell className="py-5 pl-8 text-sm font-semibold text-slate-600">{labelize(resource.resourceType)}</TableCell><TableCell className="py-5 font-bold text-slate-900">{resource.name}</TableCell><TableCell className="py-5 text-sm text-slate-600">{resource.category}</TableCell><TableCell className="py-5"><ResourceBadge value={resource.status} /></TableCell><TableCell className="py-5 pr-8 text-sm text-slate-600">{resource.costAmount == null ? '—' : <><span className="font-semibold text-slate-800">{formatCurrency(resource.costAmount, currentCompany?.currency)}</span>{resource.costType && <span className="block text-xs text-slate-400">{labelize(resource.costType)}</span>}</>}</TableCell></TableRow>)}</TableBody>
                            </Table>
                        </div>
                    )}
                    {!isHydrating && !loading && resources.length > 0 && <div className="border-t border-slate-50 bg-slate-50/30 px-8 py-5 text-xs font-bold uppercase tracking-widest text-slate-400">{resources.length} {resources.length === 1 ? 'resource' : 'resources'}</div>}
                </CardContent>
            </Card>
        </div>
    )
}