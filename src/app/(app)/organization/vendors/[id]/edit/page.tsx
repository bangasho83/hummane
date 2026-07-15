'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import type { Vendor } from '@/types'
import { fetchVendorApi } from '@/lib/api/client'
import { useApp } from '@/lib/context/AppContext'
import { OrgPageFrame, VendorForm } from '@/features/organization'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export default function EditVendorPage() {
    const params = useParams<{ id: string }>()
    const router = useRouter()
    const { apiAccessToken, isHydrating } = useApp()
    const [vendor, setVendor] = useState<Vendor | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const loadVendor = useCallback(async () => {
        if (!apiAccessToken || !params.id) {
            setLoading(false)
            return
        }
        setLoading(true)
        setError(null)
        try {
            setVendor(await fetchVendorApi(params.id, apiAccessToken))
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : 'Vendor not found')
        } finally {
            setLoading(false)
        }
    }, [apiAccessToken, params.id])

    useEffect(() => {
        if (!isHydrating) void loadVendor()
    }, [isHydrating, loadVendor])

    return (
        <OrgPageFrame>
            <div className="animate-in fade-in duration-500 slide-in-from-bottom-4 space-y-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Edit Vendor</h1>
                    <p className="text-slate-500 font-medium">Update supplier details or deactivate this vendor.</p>
                </div>
                {isHydrating || loading ? (
                    <div className="p-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
                ) : error || !vendor ? (
                    <div className="rounded-3xl border border-red-100 bg-red-50/50 p-8 text-center space-y-4">
                        <p className="text-sm font-medium text-red-700">{error || 'Vendor not found'}</p>
                        <Button variant="outline" onClick={() => router.push('/organization/vendors')} className="rounded-xl">Back to Vendors</Button>
                    </div>
                ) : <VendorForm mode="edit" vendor={vendor} />}
            </div>
        </OrgPageFrame>
    )
}
