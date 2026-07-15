'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Building2, Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import type { Vendor } from '@/types'
import { deleteVendorApi, fetchVendorsApi, updateVendorApi } from '@/lib/api/client'
import { useApp } from '@/lib/context/AppContext'
import { toast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export function VendorsTab() {
    const router = useRouter()
    const { apiAccessToken, isHydrating } = useApp()
    const [vendors, setVendors] = useState<Vendor[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [actionId, setActionId] = useState<string | null>(null)

    const loadVendors = useCallback(async () => {
        if (!apiAccessToken) {
            setLoading(false)
            return
        }
        setLoading(true)
        setError(null)
        try {
            setVendors(await fetchVendorsApi(apiAccessToken))
        } catch (loadError) {
            setVendors([])
            setError(loadError instanceof Error ? loadError.message : 'Failed to load vendors')
        } finally {
            setLoading(false)
        }
    }, [apiAccessToken])

    useEffect(() => {
        if (!isHydrating) void loadVendors()
    }, [isHydrating, loadVendors])

    const filteredVendors = useMemo(() => {
        const term = searchTerm.trim().toLowerCase()
        return vendors.filter((vendor) => {
            const matchesSearch = !term || [vendor.name, vendor.contactName, vendor.email, vendor.phone]
                .some((value) => (value || '').toLowerCase().includes(term))
            const matchesStatus = statusFilter === 'all' ||
                (statusFilter === 'active' ? vendor.isActive : !vendor.isActive)
            return matchesSearch && matchesStatus
        })
    }, [vendors, searchTerm, statusFilter])

    const updateActiveState = async (vendor: Vendor) => {
        if (!apiAccessToken) return
        setActionId(vendor.id)
        try {
            const updated = await updateVendorApi(vendor.id, { isActive: !vendor.isActive }, apiAccessToken)
            setVendors((current) => current.map((item) => item.id === vendor.id ? updated : item))
            toast(`Vendor ${updated.isActive ? 'activated' : 'deactivated'}`, 'success')
        } catch (updateError) {
            toast(updateError instanceof Error ? updateError.message : 'Failed to update vendor', 'error')
        } finally {
            setActionId(null)
        }
    }

    const handleDelete = async (vendor: Vendor) => {
        if (!apiAccessToken || !confirm(`Delete ${vendor.name}? Linked resources will keep their history but lose this vendor reference.`)) return
        setActionId(vendor.id)
        try {
            await deleteVendorApi(vendor.id, apiAccessToken)
            setVendors((current) => current.filter((item) => item.id !== vendor.id))
            toast('Vendor deleted', 'success')
        } catch (deleteError) {
            toast(deleteError instanceof Error ? deleteError.message : 'Failed to delete vendor', 'error')
        } finally {
            setActionId(null)
        }
    }

    const hasFilters = !!searchTerm || statusFilter !== 'all'
    const clearFilters = () => {
        setSearchTerm('')
        setStatusFilter('all')
    }

    return (
        <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">
            <div className="flex justify-between items-end mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Vendors</h1>
                    <p className="text-slate-500 font-medium">Manage suppliers and account contacts for resource purchasing.</p>
                </div>
                <Link href="/organization/vendors/new">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 px-6 py-6 h-auto">
                        <Plus className="w-5 h-5 mr-2" />Add Vendor
                    </Button>
                </Link>
            </div>

            <div className="bg-white rounded-3xl shadow-premium border border-slate-100 overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex items-center gap-4 flex-wrap">
                    <div className="relative flex-1 min-w-[300px] group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <Input placeholder="Search vendors..." className="pl-11 bg-slate-50 border-slate-100 h-12 rounded-2xl focus-visible:ring-blue-500/20" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-40 bg-slate-50 border-slate-100 h-12 rounded-2xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Vendors</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                    {hasFilters && <button type="button" onClick={clearFilters} className="text-sm font-semibold text-slate-500 hover:text-red-500">Reset</button>}
                </div>

                {isHydrating || loading ? (
                    <div className="p-20 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
                ) : error ? (
                    <div className="p-20 text-center space-y-4">
                        <p className="text-sm font-medium text-red-700">{error}</p>
                        <Button variant="outline" onClick={loadVendors} className="rounded-xl">Try again</Button>
                    </div>
                ) : filteredVendors.length === 0 ? (
                    <div className="p-20 flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6"><Building2 className="w-10 h-10 text-slate-200" /></div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">{hasFilters ? 'No results found' : 'No Vendors Yet'}</h2>
                        <p className="text-slate-500 font-medium max-w-sm">{hasFilters ? 'No vendors match your current filters.' : 'Create your first vendor to manage supplier contacts.'}</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="hover:bg-transparent border-slate-100">
                                <Head className="pl-8">Vendor</Head><Head>Contact</Head><Head>Email</Head><Head>Phone</Head><Head>Status</Head><Head className="text-right pr-8">Actions</Head>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredVendors.map((vendor) => (
                                <TableRow key={vendor.id} className="hover:bg-slate-50/50 group border-slate-50">
                                    <TableCell className="pl-8 py-5 font-bold text-slate-900">{vendor.name}</TableCell>
                                    <TableCell className="py-5 text-sm text-slate-600">{vendor.contactName || '—'}</TableCell>
                                    <TableCell className="py-5 text-sm text-slate-600">{vendor.email || '—'}</TableCell>
                                    <TableCell className="py-5 text-sm text-slate-600">{vendor.phone || '—'}</TableCell>
                                    <TableCell className="py-5">
                                        <button type="button" onClick={() => void updateActiveState(vendor)} disabled={actionId === vendor.id} className={`rounded-full px-3 py-1 text-xs font-bold ${vendor.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                            {vendor.isActive ? 'Active' : 'Inactive'}
                                        </button>
                                    </TableCell>
                                    <TableCell className="text-right pr-8">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl" onClick={() => router.push(`/organization/vendors/${vendor.id}/edit`)}><Pencil className="w-5 h-5" /></Button>
                                            <Button variant="ghost" size="icon" disabled={actionId === vendor.id} className="h-10 w-10 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl" onClick={() => void handleDelete(vendor)}><Trash2 className="w-5 h-5" /></Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
                <div className="p-8 border-t border-slate-50 bg-slate-50/30"><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{filteredVendors.length} {filteredVendors.length === 1 ? 'Vendor' : 'Vendors'}</p></div>
            </div>
        </div>
    )
}

function Head({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return <TableHead className={`py-4 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 ${className}`}>{children}</TableHead>
}
