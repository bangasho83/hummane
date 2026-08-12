'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import type { Resource } from '@/types'
import { fetchResourceApi } from '@/lib/api/client'
import { useApp } from '@/lib/context/AppContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ResourceForm } from './ResourceForm'
import { resourceType } from '@/features/resources/resource-ui'

export function ResourceEditPage({ id, mode }: { id: string; mode: 'resource' | 'book' | 'subscription' | 'bill' | 'reimbursement' }) {
    const router = useRouter()
    const { apiAccessToken, isHydrating } = useApp()
    const [resource, setResource] = useState<Resource | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const listPath = mode === 'bill' ? '/resources/bills' : mode === 'reimbursement' ? '/resources/reimbursements' : mode === 'book' ? '/resources/books' : mode === 'subscription' ? '/resources/subscriptions' : '/resources/assets'

    const load = useCallback(async () => {
        if (!apiAccessToken || !id) { setLoading(false); return }
        setLoading(true)
        setError(null)
        try {
            const item = await fetchResourceApi(id, apiAccessToken)
            const expected = mode === 'bill' ? resourceType(item) === 'expense' : mode === 'reimbursement' ? resourceType(item) === 'reimbursement' : mode === 'book' ? resourceType(item) === 'book' : mode === 'subscription' ? resourceType(item) === 'subscription' : !['book', 'expense', 'reimbursement', 'subscription'].includes(resourceType(item))
            if (!expected) throw new Error(mode === 'bill' ? 'Bill not found' : mode === 'book' ? 'Book not found' : mode === 'subscription' ? 'Subscription not found' : 'Resource not found')
            setResource(item)
        } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Record not found') }
        finally { setLoading(false) }
    }, [apiAccessToken, id, mode])

    useEffect(() => { if (!isHydrating) void load() }, [isHydrating, load])

    if (isHydrating || loading) return <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
    if (error || !resource) return <Card className="border-red-100 bg-red-50/50"><CardContent className="space-y-4 p-8 text-center"><p className="text-sm font-medium text-red-700">{error || 'Record not found'}</p><Button variant="outline" className="rounded-xl" onClick={() => router.push(listPath)}>Back to list</Button></CardContent></Card>

    const label = mode === 'bill' ? 'Bill' : mode === 'reimbursement' ? 'Reimbursement' : mode === 'book' ? 'Book' : mode === 'subscription' ? 'Subscription' : 'Resource'
    const lockedResourceType = mode === 'book' ? 'book' : mode === 'subscription' ? 'subscription' : undefined
    return <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-500"><div><h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Edit {label}</h1><p className="font-medium text-slate-500">Update approved {label.toLowerCase()} details.</p></div><ResourceForm mode={mode === 'bill' ? 'bill' : 'resource'} resource={resource} initialResourceType={mode === 'reimbursement' ? 'reimbursement' : lockedResourceType} lockedResourceType={lockedResourceType} resourceLabel={mode === 'reimbursement' ? 'reimbursement' : mode === 'book' ? 'book' : mode === 'subscription' ? 'subscription' : undefined} resourceListPath={listPath} /></div>
}
