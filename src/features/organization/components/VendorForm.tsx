'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Vendor } from '@/types'
import { createVendorApi, updateVendorApi, type VendorPayload } from '@/lib/api/client'
import { useApp } from '@/lib/context/AppContext'
import { validateVendor, type VendorFormErrors, type VendorFormValues } from '@/lib/validation/vendor'
import { toast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface VendorFormProps {
    mode: 'create' | 'edit'
    vendor?: Vendor | null
}

const emptyValues: VendorFormValues = {
    name: '',
    contactName: '',
    email: '',
    phone: '',
    isActive: true,
}

export function VendorForm({ mode, vendor }: VendorFormProps) {
    const router = useRouter()
    const { apiAccessToken } = useApp()
    const [values, setValues] = useState<VendorFormValues>(emptyValues)
    const [errors, setErrors] = useState<VendorFormErrors>({})
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!vendor) return
        setValues({
            name: vendor.name,
            contactName: vendor.contactName || '',
            email: vendor.email || '',
            phone: vendor.phone || '',
            isActive: vendor.isActive,
        })
    }, [vendor])

    const setField = <K extends keyof VendorFormValues>(key: K, value: VendorFormValues[K]) => {
        setValues((current) => ({ ...current, [key]: value }))
        if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }))
    }

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        const validationErrors = validateVendor(values)
        if (Object.keys(validationErrors).length) {
            setErrors(validationErrors)
            return
        }
        if (!apiAccessToken) {
            toast('You must be signed in to save a vendor.', 'error')
            return
        }

        const payload: VendorPayload = {
            name: values.name.trim(),
            contactName: values.contactName.trim() || undefined,
            email: values.email.trim() || undefined,
            phone: values.phone.trim() || undefined,
            isActive: values.isActive,
        }

        setLoading(true)
        try {
            if (mode === 'create') {
                await createVendorApi(payload, apiAccessToken)
                toast('Vendor created successfully', 'success')
            } else if (vendor) {
                await updateVendorApi(vendor.id, payload, apiAccessToken)
                toast('Vendor updated successfully', 'success')
            }
            router.push('/organization/vendors')
        } catch (error) {
            toast(error instanceof Error ? error.message : 'Failed to save vendor', 'error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="border border-slate-100 shadow-premium rounded-3xl bg-white">
                <CardContent className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Field label="Vendor Name" error={errors.name} required>
                            <Input value={values.name} onChange={(e) => setField('name', e.target.value)} placeholder="e.g. Apple Authorized Reseller" className="rounded-xl border-slate-200 h-12" disabled={loading} />
                        </Field>
                        <Field label="Contact Name" error={errors.contactName}>
                            <Input value={values.contactName} onChange={(e) => setField('contactName', e.target.value)} placeholder="e.g. Sales Desk" className="rounded-xl border-slate-200 h-12" disabled={loading} />
                        </Field>
                        <Field label="Email" error={errors.email}>
                            <Input type="email" value={values.email} onChange={(e) => setField('email', e.target.value)} placeholder="accounts@example.com" className="rounded-xl border-slate-200 h-12" disabled={loading} />
                        </Field>
                        <Field label="Phone" error={errors.phone}>
                            <Input value={values.phone} onChange={(e) => setField('phone', e.target.value)} placeholder="+92 300 1234567" className="rounded-xl border-slate-200 h-12" disabled={loading} />
                        </Field>
                    </div>
                    <label className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-4 cursor-pointer">
                        <div>
                            <p className="text-sm font-bold text-slate-900">Active Vendor</p>
                            <p className="text-xs text-slate-500 mt-1">Inactive vendors remain available for historical records.</p>
                        </div>
                        <input type="checkbox" checked={values.isActive} onChange={(e) => setField('isActive', e.target.checked)} className="h-5 w-5 accent-blue-600" disabled={loading} />
                    </label>
                </CardContent>
            </Card>
            <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" className="rounded-xl border-slate-200" onClick={() => router.push('/organization/vendors')} disabled={loading}>Cancel</Button>
                <Button type="submit" className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
                    {loading ? 'Saving...' : mode === 'create' ? 'Create Vendor' : 'Save Changes'}
                </Button>
            </div>
        </form>
    )
}

function Field({ label, error, required, children }: { label: string; error?: string; required?: boolean; children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <Label className="text-sm font-bold text-slate-700 px-1">{label}{required ? ' *' : ''}</Label>
            {children}
            {error && <p className="text-xs font-medium text-red-600 px-1">{error}</p>}
        </div>
    )
}
