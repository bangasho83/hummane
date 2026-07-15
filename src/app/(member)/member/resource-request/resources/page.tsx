'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, Package } from 'lucide-react'
import type { Resource } from '@/types'
import { fetchResourcesApi } from '@/lib/api/client'
import { useApp } from '@/lib/context/AppContext'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ResourceBadge } from '@/features/resources/components/ResourceBadge'
import {
    assignmentEmployeeId,
    formatResourceDate,
    labelize,
    resourceAssignment,
    resourceCategory,
    resourceCost,
    resourceCostType,
    resourceName,
    resourceRecord,
    resourceStatus,
    resourceType,
    textValue,
} from '@/features/resources/resource-ui'

export default function MyResourcesPage() {
    const { employees, meProfile, isHydrating, apiAccessToken } = useApp()
    const employeeId = meProfile?.employeeId
    const isDataLoading = isHydrating || (!meProfile && employees.length === 0)
    const [resources, setResources] = useState<Resource[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const load = useCallback(async () => {
        if (!apiAccessToken || !employeeId) {
            setResources([])
            setLoading(false)
            return
        }
        setLoading(true)
        setError(null)
        try {
            const list = await fetchResourcesApi(apiAccessToken, {
                assignedToEmployeeId: employeeId,
                limit: 100,
            })
            setResources(list.filter((resource) =>
                resourceType(resource) !== 'expense'
                && assignmentEmployeeId(resourceAssignment(resource)) === employeeId
            ))
        } catch (loadError) {
            setResources([])
            setError(loadError instanceof Error ? loadError.message : 'We could not load your assigned resources.')
        } finally {
            setLoading(false)
        }
    }, [apiAccessToken, employeeId])

    useEffect(() => {
        if (!isDataLoading) void load()
    }, [isDataLoading, load])

    const sortedResources = useMemo(() => [...resources].sort((a, b) =>
        resourceName(a).localeCompare(resourceName(b))
    ), [resources])

    if (isDataLoading) return <Loading />

    if (!employeeId) {
        return (
            <Card className="border-dashed">
                <CardHeader className="pb-4 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100"><Package className="h-8 w-8 text-amber-600" /></div>
                    <CardTitle className="text-xl">No Employee Profile Linked</CardTitle>
                </CardHeader>
                <CardContent className="text-center text-slate-500">Please contact your administrator to link your employee profile.</CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">My Resources</h2>
                <p className="font-medium text-slate-500">Resources currently assigned to you.</p>
            </div>
            {loading ? <Loading /> : error ? (
                <Card className="border-red-100 bg-red-50/50"><CardContent className="space-y-4 p-8 text-center"><p className="text-sm font-medium text-red-700">{error}</p><Button variant="outline" onClick={() => void load()} className="rounded-2xl">Try again</Button></CardContent></Card>
            ) : (
                <Card className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-premium">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table className="min-w-[850px]">
                                <TableHeader className="bg-slate-50/50"><TableRow className="border-slate-100 hover:bg-transparent"><Head className="pl-8">Resource</Head><Head>Type</Head><Head>Category</Head><Head>Status</Head><Head>Location</Head><Head>Cost</Head><Head className="pr-8">Assigned</Head></TableRow></TableHeader>
                                <TableBody>
                                    {sortedResources.length === 0 ? <TableRow><TableCell colSpan={7} className="p-20 text-center"><Package className="mx-auto mb-3 h-10 w-10 text-slate-300" /><p className="font-medium text-slate-500">No resources are currently assigned to you.</p></TableCell></TableRow> : sortedResources.map((resource) => {
                                        const item = resourceRecord(resource)
                                        const assignment = resourceAssignment(resource)
                                        const cost = resourceCost(resource)
                                        const assignedAt = assignment.assignedAt || item.assignedAt || item.updatedAt || item.createdAt
                                        return <TableRow key={textValue(item.id)} className="border-slate-50 hover:bg-slate-50/50"><TableCell className="py-5 pl-8 font-bold text-slate-900">{resourceName(resource)}{textValue(item.identifier) && <p className="mt-1 text-xs font-medium text-slate-400">{textValue(item.identifier)}</p>}</TableCell><TableCell className="py-5 text-sm font-semibold text-slate-600">{labelize(resourceType(resource))}</TableCell><TableCell className="py-5 text-sm text-slate-600">{resourceCategory(resource) || '—'}</TableCell><TableCell className="py-5"><ResourceBadge value={resourceStatus(resource)} /></TableCell><TableCell className="py-5 text-sm text-slate-600">{textValue(assignment.location || item.location) || '—'}</TableCell><TableCell className="py-5 text-sm text-slate-600">{cost == null ? '—' : `${formatCurrency(cost)}${resourceCostType(resource) === 'recurring' ? ' / recurring' : ''}`}</TableCell><TableCell className="py-5 pr-8 text-sm text-slate-500">{formatResourceDate(assignedAt)}</TableCell></TableRow>
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

function Loading() { return <div className="flex items-center justify-center p-16"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div> }
function Head({ children, className = '' }: { children: React.ReactNode; className?: string }) { return <TableHead className={`py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 ${className}`}>{children}</TableHead> }
