'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Paperclip, Save } from 'lucide-react'
import type { Resource, ResourceCategory, Vendor } from '@/types'
import {
    RESOURCE_ASSIGNMENT_TYPES,
    RESOURCE_COST_TYPES,
    RESOURCE_STATUSES,
    RESOURCE_TYPES,
} from '@/types'
import {
    createResourceApi,
    fetchResourceCategoriesApi,
    fetchVendorsApi,
    updateResourceApi,
    type ResourcePayload,
} from '@/lib/api/client'
import {
    emptyResourceFormValues,
    validateResource,
    type ResourceFormValues,
} from '@/lib/validation/resource'
import { useApp } from '@/lib/context/AppContext'
import { toast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    asRecord,
    compact,
    dateInputValue,
    employeeDisplayName,
    labelize,
    resourceAssignment,
    resourceAttachmentUrls,
    resourceDetails,
    resourceId,
    resourceRecord,
    textValue,
} from '@/features/resources/resource-ui'

interface ResourceFormProps {
    mode: 'resource' | 'bill'
    resource?: Resource | null
}

type FormState = ResourceFormValues & Record<string, unknown>
type FormErrors = Record<string, string | undefined>

const fieldClass = 'h-12 rounded-xl border-slate-200 bg-white'
const resourceTypes = (RESOURCE_TYPES as readonly string[]).filter((type) => type !== 'expense')

const numberOrUndefined = (value: unknown): number | undefined => {
    if (value === '' || value == null) return undefined
    const number = Number(value)
    return Number.isFinite(number) ? number : undefined
}

const categoryValue = (category: ResourceCategory): string => {
    const item = asRecord(category)
    return textValue(item.id) || textValue(item.name)
}

const vendorValue = (vendor: Vendor): string => textValue(asRecord(vendor).id)

const toFormState = (mode: 'resource' | 'bill', resource?: Resource | null): FormState => {
    const empty = emptyResourceFormValues(mode) as FormState
    if (!resource) return empty
    const item = resourceRecord(resource)
    const details = resourceDetails(resource)
    const assignment = resourceAssignment(resource)
    const category = asRecord(item.category)
    const vendor = asRecord(item.vendor)
    return {
        ...empty,
        name: textValue(item.name),
        resourceType: mode === 'bill' ? 'expense' : textValue(item.resourceType || item.type),
        category: textValue(item.categoryName) || textValue(category.name) || textValue(item.category),
        status: textValue(item.status),
        vendorId: textValue(item.vendorId) || textValue(vendor.id),
        description: textValue(item.description),
        identifier: textValue(item.identifier),
        costAmount: textValue(item.costAmount ?? item.cost ?? item.amount ?? asRecord(item.cost).amount),
        costType: textValue(item.costType) || textValue(asRecord(item.cost).type),
        expenseDate: dateInputValue(item.expenseDate),
        paidByEmployeeId: textValue(item.paidByEmployeeId),
        isSettled: item.isSettled === true,
        attachmentUrls: resourceAttachmentUrls(resource),
        assignmentType: textValue(assignment.assignmentType || assignment.type),
        assignedToEmployeeId: textValue(assignment.assignedToEmployeeId || assignment.employeeId),
        location: textValue(assignment.location),
        assignmentNote: textValue(assignment.note),
        ...Object.fromEntries(Object.entries(details).map(([key, value]) => [
            key,
            key.toLowerCase().includes('date') || key.toLowerCase().includes('expiry') || key.toLowerCase().includes('expires')
                ? dateInputValue(value)
                : value,
        ])),
    } as FormState
}

export function ResourceForm({ mode, resource }: ResourceFormProps) {
    const router = useRouter()
    const { apiAccessToken, employees } = useApp()
    const editing = !!resource
    const listPath = mode === 'bill' ? '/resources/bills' : '/resources/assets'
    const [values, setValues] = useState<FormState>(() => toFormState(mode, resource))
    const [errors, setErrors] = useState<FormErrors>({})
    const [categories, setCategories] = useState<ResourceCategory[]>([])
    const [vendors, setVendors] = useState<Vendor[]>([])
    const [optionsLoading, setOptionsLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => setValues(toFormState(mode, resource)), [mode, resource])

    useEffect(() => {
        let active = true
        const load = async () => {
            if (!apiAccessToken) {
                setOptionsLoading(false)
                return
            }
            try {
                const [categoryItems, vendorItems] = await Promise.all([
                    fetchResourceCategoriesApi(),
                    fetchVendorsApi(apiAccessToken),
                ])
                if (active) {
                    setCategories(categoryItems)
                    setVendors(vendorItems)
                }
            } catch (error) {
                if (active) toast(error instanceof Error ? error.message : 'Failed to load form options', 'error')
            } finally {
                if (active) setOptionsLoading(false)
            }
        }
        void load()
        return () => { active = false }
    }, [apiAccessToken])

    const type = mode === 'bill' ? 'expense' : textValue(values.resourceType)
    const assignmentType = mode === 'bill' ? 'company' : textValue(values.assignmentType)
    const employeeOptions = useMemo(
        () => [...employees].sort((a, b) => a.name.localeCompare(b.name)),
        [employees]
    )

    const setField = (key: string, value: unknown) => {
        setValues((current) => ({ ...current, [key]: value }))
        if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }))
    }

    const errorFor = (key: string) => errors[key]

    const buildDetails = () => {
        const fields: Record<string, string[]> = {
            physical_asset: ['brand', 'model', 'serialNumber', 'warrantyExpiresOn'],
            subscription: ['numberOfSeats', 'accountEmail', 'renewalDate'],
            service: ['affectedResourceId', 'invoiceNumber'],
            event: [],
            reimbursement: ['invoiceNumber'],
            expense: ['invoiceNumber'],
        }
        const numeric = new Set(['numberOfSeats'])
        return compact(Object.fromEntries((fields[type] || []).map((key) => [
            key,
            numeric.has(key) ? numberOrUndefined(values[key]) : textValue(values[key]).trim() || undefined,
        ])))
    }

    const buildPayload = (): ResourcePayload => {
        const attachmentUrls = (Array.isArray(values.attachmentUrls) ? values.attachmentUrls : [])
            .map((url) => textValue(url).trim())
            .filter(Boolean)
        const assignment = compact({
            assignmentType,
            assignedToEmployeeId: assignmentType === 'person' ? textValue(values.assignedToEmployeeId).trim() || undefined : undefined,
            location: textValue(values.location).trim() || undefined,
        })
        const payload = compact({
            resourceType: type,
            name: textValue(values.name).trim(),
            category: textValue(values.category).trim(),
            description: textValue(values.description).trim() || undefined,
            identifier: textValue(values.identifier).trim() || undefined,
            status: textValue(values.status).trim(),
            ...(mode === 'bill' || !editing ? assignment : {}),
            vendorId: textValue(values.vendorId).trim() || undefined,
            costAmount: numberOrUndefined(values.costAmount),
            costType: textValue(values.costType).trim() || undefined,
            expenseDate: textValue(values.expenseDate).trim() || undefined,
            paidByEmployeeId: type === 'reimbursement' ? textValue(values.paidByEmployeeId).trim() || undefined : undefined,
            details: buildDetails(),
            attachments: attachmentUrls.length || editing ? { files: attachmentUrls } : undefined,
            isSettled: mode === 'bill' || type === 'reimbursement' ? values.isSettled === true : undefined,
        })
        return payload as ResourcePayload
    }

    const submit = async (event: React.FormEvent) => {
        event.preventDefault()
        const validation = validateResource(values, mode) as FormErrors
        if (Object.keys(validation).length) {
            setErrors(validation)
            toast('Please correct the highlighted fields.', 'error')
            return
        }
        if (!apiAccessToken) {
            toast('You must be signed in to save this record.', 'error')
            return
        }
        setSaving(true)
        try {
            const payload = buildPayload()
            if (editing && resource) {
                await updateResourceApi(resourceId(resource), payload, apiAccessToken)
                toast(mode === 'bill' ? 'Bill updated.' : 'Resource updated.', 'success')
            } else {
                await createResourceApi(payload, apiAccessToken)
                toast(mode === 'bill' ? 'Bill created.' : 'Resource created.', 'success')
            }
            router.push(listPath)
            router.refresh()
        } catch (error) {
            toast(error instanceof Error ? error.message : 'Failed to save resource', 'error')
        } finally {
            setSaving(false)
        }
    }

    return (
        <form onSubmit={submit} className="space-y-6">
            <Card className="rounded-3xl border-slate-100 bg-white shadow-premium">
                <CardHeader className="px-8 pt-8"><CardTitle className="text-lg">General information</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 gap-6 p-8 pt-2 md:grid-cols-2">
                    <Field label={mode === 'bill' ? 'Bill name' : 'Resource name'} error={errorFor('name')} required>
                        <Input value={textValue(values.name)} onChange={(event) => setField('name', event.target.value)} className={fieldClass} placeholder={mode === 'bill' ? 'e.g. June cloud hosting' : 'e.g. Design team MacBook'} disabled={saving} />
                    </Field>
                    {mode === 'resource' ? (
                        <Field label="Type" error={errorFor('resourceType')} required>
                            <OptionSelect value={type} onChange={(value) => setField('resourceType', value)} options={resourceTypes} placeholder="Select a type" disabled={saving} />
                        </Field>
                    ) : (
                        <Field label="Type"><Input value="Expense · Company" readOnly className={`${fieldClass} bg-slate-50 text-slate-500`} /></Field>
                    )}
                    <Field label="Category" error={errorFor('category')} required>
                        <Select value={textValue(values.category)} onValueChange={(value) => setField('category', value)} disabled={saving || optionsLoading}>
                            <SelectTrigger className={fieldClass}><SelectValue placeholder={optionsLoading ? 'Loading categories…' : 'Select a category'} /></SelectTrigger>
                            <SelectContent>{categories.map((category) => <SelectItem key={categoryValue(category)} value={categoryValue(category)}>{textValue(asRecord(category).name)}</SelectItem>)}</SelectContent>
                        </Select>
                    </Field>
                    <Field label="Status" error={errorFor('status')} required>
                        <OptionSelect value={textValue(values.status)} onChange={(value) => setField('status', value)} options={RESOURCE_STATUSES as readonly string[]} placeholder="Select status" disabled={saving} />
                    </Field>
                    <Field label="Vendor" error={errorFor('vendorId')} required={mode === 'bill'}>
                        <Select value={textValue(values.vendorId) || 'none'} onValueChange={(value) => setField('vendorId', value === 'none' ? '' : value)} disabled={saving || optionsLoading}>
                            <SelectTrigger className={fieldClass}><SelectValue placeholder="Select a vendor" /></SelectTrigger>
                            <SelectContent>
                                {mode === 'resource' && <SelectItem value="none">No vendor</SelectItem>}
                                {vendors.filter((vendor) => vendor.isActive || vendorValue(vendor) === textValue(values.vendorId)).map((vendor) => <SelectItem key={vendorValue(vendor)} value={vendorValue(vendor)}>{vendor.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </Field>
                    <Field label="Description" error={errorFor('description')} className="md:col-span-2">
                        <Textarea value={textValue(values.description)} onChange={(event) => setField('description', event.target.value)} className="min-h-28 rounded-xl border-slate-200" placeholder="Notes about this record" disabled={saving} />
                    </Field>
                </CardContent>
            </Card>

            <AdaptiveDetails type={type} values={values} errors={errors} setField={setField} employees={employeeOptions.map(asRecord)} disabled={saving} />

            <Card className="rounded-3xl border-slate-100 bg-white shadow-premium">
                <CardHeader className="px-8 pt-8"><CardTitle className="text-lg">Cost &amp; attachments</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 gap-6 p-8 pt-2 md:grid-cols-3">
                    <Field label={mode === 'bill' ? 'Amount' : 'Cost'} error={errorFor('costAmount')} required={mode === 'bill'}>
                        <Input type="number" min="0" step="0.01" value={textValue(values.costAmount)} onChange={(event) => setField('costAmount', event.target.value)} className={fieldClass} disabled={saving} />
                    </Field>
                    <Field label="Cost type" error={errorFor('costType')}>
                        <OptionSelect value={textValue(values.costType)} onChange={(value) => setField('costType', value)} options={RESOURCE_COST_TYPES as readonly string[]} placeholder="Select cost type" disabled={saving} />
                    </Field>
                    <Field label="Identifier" error={errorFor('identifier')}>
                        <Input value={textValue(values.identifier)} onChange={(event) => setField('identifier', event.target.value)} className={fieldClass} placeholder="Asset tag or reference" disabled={saving} />
                    </Field>
                    <Field label="Attachment URLs" error={errorFor('attachmentUrls')} className="md:col-span-3">
                        <div className="relative">
                            <Paperclip className="absolute left-4 top-4 h-4 w-4 text-slate-400" />
                            <Textarea value={(Array.isArray(values.attachmentUrls) ? values.attachmentUrls : []).join('\n')} onChange={(event) => setField('attachmentUrls', event.target.value.split(/\r?\n|,/))} className="min-h-24 rounded-xl border-slate-200 pl-11" placeholder="One https:// URL per line" disabled={saving} />
                        </div>
                    </Field>
                    {(mode === 'bill' || type === 'reimbursement') && (
                        <label className="md:col-span-3 flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                            <div><p className="text-sm font-bold text-slate-900">Payment settled</p><p className="mt-1 text-xs text-slate-500">Mark this {mode === 'bill' ? 'bill' : 'reimbursement'} as paid.</p></div>
                            <input type="checkbox" checked={values.isSettled === true} onChange={(event) => setField('isSettled', event.target.checked)} className="h-5 w-5 accent-blue-600" disabled={saving} />
                        </label>
                    )}
                </CardContent>
            </Card>

            {!editing && mode === 'resource' && (
                <Card className="rounded-3xl border-slate-100 bg-white shadow-premium">
                    <CardHeader className="px-8 pt-8"><CardTitle className="text-lg">Initial assignment <span className="font-normal text-slate-400">(optional)</span></CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 gap-6 p-8 pt-2 md:grid-cols-2">
                        <Field label="Assignment type" error={errorFor('assignmentType')}>
                            <OptionSelect value={assignmentType} onChange={(value) => setField('assignmentType', value)} options={RESOURCE_ASSIGNMENT_TYPES as readonly string[]} placeholder="Select assignment" disabled={saving} />
                        </Field>
                        {assignmentType === 'person' && (
                            <Field label="Employee" error={errorFor('assignedToEmployeeId')}>
                                <Select value={textValue(values.assignedToEmployeeId)} onValueChange={(value) => setField('assignedToEmployeeId', value)} disabled={saving}>
                                    <SelectTrigger className={fieldClass}><SelectValue placeholder="Select employee" /></SelectTrigger>
                                    <SelectContent>{employeeOptions.map((employee) => <SelectItem key={employee.id} value={employee.id}>{employeeDisplayName(asRecord(employee))}</SelectItem>)}</SelectContent>
                                </Select>
                            </Field>
                        )}
                        <Field label="Location" error={errorFor('location')}><Input value={textValue(values.location)} onChange={(event) => setField('location', event.target.value)} className={fieldClass} disabled={saving} /></Field>
                    </CardContent>
                </Card>
            )}

            <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
                <Button type="button" variant="outline" className="rounded-xl border-slate-200" onClick={() => router.push(listPath)} disabled={saving}>Cancel</Button>
                <Button type="submit" className="rounded-xl bg-blue-600 text-white hover:bg-blue-700" disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {editing ? 'Save changes' : mode === 'bill' ? 'Add bill' : 'Add resource'}
                </Button>
            </div>
        </form>
    )
}

function AdaptiveDetails({ type, values, errors, setField, employees, disabled }: { type: string; values: FormState; errors: FormErrors; setField: (key: string, value: unknown) => void; employees: Array<Record<string, unknown>>; disabled: boolean }) {
    const definitions: Record<string, Array<{ key: string; label: string; kind?: string }>> = {
        physical_asset: [
            { key: 'brand', label: 'Brand' }, { key: 'model', label: 'Model' },
            { key: 'serialNumber', label: 'Serial number' }, { key: 'warrantyExpiresOn', label: 'Warranty expiry', kind: 'date' },
        ],
        subscription: [
            { key: 'numberOfSeats', label: 'Number of seats', kind: 'number' },
            { key: 'accountEmail', label: 'Account email', kind: 'email' },
            { key: 'renewalDate', label: 'Renewal date', kind: 'date' },
        ],
        service: [{ key: 'affectedResourceId', label: 'Affected resource ID' }, { key: 'invoiceNumber', label: 'Invoice number' }],
        event: [],
        reimbursement: [{ key: 'invoiceNumber', label: 'Invoice number' }],
        expense: [{ key: 'invoiceNumber', label: 'Invoice number' }],
    }
    const fields = definitions[type] || []
    const needsExpenseDate = type === 'expense' || type === 'reimbursement' || type === 'event'
    if (!fields.length && !needsExpenseDate) return null
    return (
        <Card className="rounded-3xl border-slate-100 bg-white shadow-premium">
            <CardHeader className="px-8 pt-8"><CardTitle className="text-lg">{labelize(type)} details</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 gap-6 p-8 pt-2 md:grid-cols-2">
                {needsExpenseDate && (
                    <Field label={type === 'expense' ? 'Bill date' : type === 'event' ? 'Event date' : 'Expense date'} error={errors.expenseDate} required={type !== 'event'}>
                        <Input type="date" value={textValue(values.expenseDate)} onChange={(event) => setField('expenseDate', event.target.value)} className={fieldClass} disabled={disabled} />
                    </Field>
                )}
                {type === 'reimbursement' && (
                    <Field label="Paid by employee" error={errors.paidByEmployeeId} required>
                        <Select value={textValue(values.paidByEmployeeId)} onValueChange={(value) => setField('paidByEmployeeId', value)} disabled={disabled}>
                            <SelectTrigger className={fieldClass}><SelectValue placeholder="Select employee" /></SelectTrigger>
                            <SelectContent>{employees.map((employee) => <SelectItem key={textValue(employee.id)} value={textValue(employee.id)}>{employeeDisplayName(employee)}</SelectItem>)}</SelectContent>
                        </Select>
                    </Field>
                )}
                {fields.map((field) => (
                    <Field key={field.key} label={field.label} error={errors[field.key]}>
                        <Input type={field.kind || 'text'} min={field.kind === 'number' ? 1 : undefined} value={textValue(values[field.key])} onChange={(event) => setField(field.key, event.target.value)} className={fieldClass} disabled={disabled} />
                    </Field>
                ))}
            </CardContent>
        </Card>
    )
}

function OptionSelect({ value, onChange, options, placeholder, disabled }: { value: string; onChange: (value: string) => void; options: readonly string[]; placeholder: string; disabled?: boolean }) {
    return (
        <Select value={value} onValueChange={onChange} disabled={disabled}>
            <SelectTrigger className={fieldClass}><SelectValue placeholder={placeholder} /></SelectTrigger>
            <SelectContent>{options.map((option) => <SelectItem key={option} value={option}>{labelize(option)}</SelectItem>)}</SelectContent>
        </Select>
    )
}

function Field({ label, error, required, className = '', children }: { label: string; error?: string; required?: boolean; className?: string; children: React.ReactNode }) {
    return (
        <div className={`space-y-2 ${className}`}>
            <Label className="px-1 text-sm font-bold text-slate-700">{label}{required ? ' *' : ''}</Label>
            {children}
            {error && <p className="px-1 text-xs font-medium text-red-600">{error}</p>}
        </div>
    )
}
