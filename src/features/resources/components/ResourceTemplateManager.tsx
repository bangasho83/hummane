'use client'

import { useCallback, useEffect, useState } from 'react'
import { Pencil, Plus, Save, Archive, Loader2 } from 'lucide-react'
import type { ResourceCategory, ResourceTemplate, Vendor } from '@/types'
import {
    archiveResourceTemplateApi,
    createResourceTemplateApi,
    fetchResourceCategoriesApi,
    fetchResourceTemplatesApi,
    fetchVendorsApi,
    updateResourceTemplateApi,
    type ResourceTemplatePayload,
} from '@/lib/api/client'
import { useApp } from '@/lib/context/AppContext'
import { toast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'
import { asRecord, textValue } from '@/features/resources/resource-ui'

type TemplateForm = {
    name: string
    category: string
    vendorId: string
    defaultCostAmount: string
    defaultCostType: 'one_time' | 'recurring'
}

const emptyForm: TemplateForm = {
    name: '', category: '', vendorId: '', defaultCostAmount: '', defaultCostType: 'recurring',
}

const categoryValue = (category: ResourceCategory) => textValue(asRecord(category).id) || textValue(asRecord(category).name)

export function ResourceTemplateManager() {
    const { apiAccessToken, currentCompany } = useApp()
    const [templates, setTemplates] = useState<ResourceTemplate[]>([])
    const [categories, setCategories] = useState<ResourceCategory[]>([])
    const [vendors, setVendors] = useState<Vendor[]>([])
    const [form, setForm] = useState<TemplateForm>(emptyForm)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const load = useCallback(async () => {
        if (!apiAccessToken) { setLoading(false); return }
        setLoading(true)
        try {
            const [templateItems, categoryItems, vendorItems] = await Promise.all([
                fetchResourceTemplatesApi(apiAccessToken, false),
                fetchResourceCategoriesApi(),
                fetchVendorsApi(apiAccessToken),
            ])
            setTemplates(templateItems)
            setCategories(categoryItems)
            setVendors(vendorItems)
        } catch (error) {
            toast(error instanceof Error ? error.message : 'Failed to load resource templates', 'error')
        } finally { setLoading(false) }
    }, [apiAccessToken])

    useEffect(() => { void load() }, [load])

    const setField = (key: keyof TemplateForm, value: string) => setForm((current) => ({ ...current, [key]: value }))

    const edit = (template: ResourceTemplate) => {
        setEditingId(template.id)
        setForm({
            name: template.name,
            category: template.category,
            vendorId: template.vendorId || '',
            defaultCostAmount: template.defaultCostAmount == null ? '' : String(template.defaultCostAmount),
            defaultCostType: template.defaultCostType === 'one_time' ? 'one_time' : 'recurring',
        })
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const reset = () => { setEditingId(null); setForm(emptyForm) }

    const submit = async (event: React.FormEvent) => {
        event.preventDefault()
        if (!apiAccessToken || !currentCompany) return
        const amount = form.defaultCostAmount.trim() ? Number(form.defaultCostAmount) : undefined
        if (!form.name.trim() || !form.category || (amount !== undefined && !Number.isFinite(amount))) {
            toast('Enter a name, category, and valid default price.', 'error')
            return
        }
        setSaving(true)
        const payload: ResourceTemplatePayload = {
            name: form.name.trim(),
            resourceType: 'subscription',
            category: form.category,
            vendorId: form.vendorId || undefined,
            defaultCostAmount: amount,
            defaultCostType: form.defaultCostType,
        }
        try {
            const saved = editingId
                ? await updateResourceTemplateApi(editingId, payload, apiAccessToken)
                : await createResourceTemplateApi(payload, apiAccessToken)
            setTemplates((current) => editingId
                ? current.map((item) => item.id === saved.id ? saved : item)
                : [...current, saved].sort((a, b) => a.name.localeCompare(b.name)))
            toast(editingId ? 'Template updated.' : 'Template created.', 'success')
            reset()
        } catch (error) {
            toast(error instanceof Error ? error.message : 'Failed to save template', 'error')
        } finally { setSaving(false) }
    }

    const archive = async (template: ResourceTemplate) => {
        if (!apiAccessToken) return
        try {
            const archived = await archiveResourceTemplateApi(template.id, apiAccessToken)
            setTemplates((current) => current.map((item) => item.id === archived.id ? archived : item))
            toast('Template archived. Existing resources are unchanged.', 'success')
        } catch (error) { toast(error instanceof Error ? error.message : 'Failed to archive template', 'error') }
    }

    return (
        <div className="space-y-6">
            <div><h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Resource templates</h1><p className="font-medium text-slate-500">Reuse subscription names, vendors, and default prices when adding resources.</p></div>
            <Card className="rounded-3xl border-slate-100 bg-white shadow-premium">
                <CardHeader className="px-8 pt-8"><CardTitle className="flex items-center gap-2 text-lg">{editingId ? <Pencil className="h-5 w-5 text-blue-600" /> : <Plus className="h-5 w-5 text-blue-600" />}{editingId ? 'Edit template' : 'New subscription template'}</CardTitle></CardHeader>
                <CardContent className="p-8 pt-2"><form onSubmit={submit} className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <Field label="Name"><Input required value={form.name} onChange={(event) => setField('name', event.target.value)} placeholder="e.g. Claude.ai" disabled={saving} /></Field>
                    <Field label="Category"><Select value={form.category} onValueChange={(value) => setField('category', value)} disabled={saving}><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger><SelectContent>{categories.map((category) => <SelectItem key={categoryValue(category)} value={categoryValue(category)}>{textValue(asRecord(category).name)}</SelectItem>)}</SelectContent></Select></Field>
                    <Field label="Vendor"><Select value={form.vendorId || 'none'} onValueChange={(value) => setField('vendorId', value === 'none' ? '' : value)} disabled={saving}><SelectTrigger><SelectValue placeholder="Select vendor (optional)" /></SelectTrigger><SelectContent><SelectItem value="none">No vendor</SelectItem>{vendors.filter((vendor) => vendor.isActive).map((vendor) => <SelectItem key={vendor.id} value={vendor.id}>{vendor.name}</SelectItem>)}</SelectContent></Select></Field>
                    <Field label="Default price"><Input type="number" min="0" step="0.01" value={form.defaultCostAmount} onChange={(event) => setField('defaultCostAmount', event.target.value)} placeholder="0.00" disabled={saving} /></Field>
                    <Field label="Cost type"><Select value={form.defaultCostType} onValueChange={(value) => setField('defaultCostType', value as TemplateForm['defaultCostType'])} disabled={saving}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="recurring">Recurring</SelectItem><SelectItem value="one_time">One time</SelectItem></SelectContent></Select></Field>
                    <div className="flex items-end justify-end gap-3"><Button type="button" variant="outline" className="rounded-xl" onClick={reset} disabled={saving}>Clear</Button><Button type="submit" className="rounded-xl bg-blue-600 text-white hover:bg-blue-700" disabled={saving}>{saving ? <Loader2 className="animate-spin" /> : <Save />}{editingId ? 'Save changes' : 'Create template'}</Button></div>
                </form></CardContent>
            </Card>
            <Card className="overflow-hidden rounded-3xl border-slate-100 bg-white shadow-premium"><CardContent className="p-0">{loading ? <div className="flex justify-center p-16"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div> : <div className="divide-y divide-slate-100">{templates.length === 0 ? <p className="p-10 text-center text-sm text-slate-500">No templates yet.</p> : templates.map((template) => <div key={template.id} className={`flex flex-wrap items-center justify-between gap-4 p-6 ${!template.isActive ? 'opacity-50' : ''}`}><div><p className="font-bold text-slate-900">{template.name}</p><p className="mt-1 text-sm text-slate-500">{template.category}{template.defaultCostAmount != null ? ` · ${formatCurrency(template.defaultCostAmount, currentCompany?.currency)} ${template.defaultCostType || 'recurring'}` : ''}</p></div><div className="flex items-center gap-2">{template.isActive ? <><Button variant="ghost" size="icon" className="rounded-xl" onClick={() => edit(template)} aria-label={`Edit ${template.name}`}><Pencil /></Button><Button variant="ghost" size="icon" className="rounded-xl text-slate-400 hover:text-amber-600" onClick={() => void archive(template)} aria-label={`Archive ${template.name}`}><Archive /></Button></> : <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Archived</span>}</div></div>)}</div>}</CardContent></Card>
        </div>
    )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div> }