'use client'

import { useEffect, useState } from 'react'
import { Loader2, Paperclip, Save, Upload } from 'lucide-react'
import type { ResourceCategory } from '@/types'
import { fetchResourceCategoriesApi } from '@/lib/api/client'
import {
    emptyReimbursementFormValues,
    validateReimbursement,
    type ReimbursementFormErrors,
    type ReimbursementFormValues,
} from '@/lib/validation/reimbursement'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

interface ReimbursementFormProps {
    submitting: boolean
    onSubmit: (values: ReimbursementFormValues, files: File[]) => void
    onCancel: () => void
}

const fieldClass = 'h-12 rounded-xl border-slate-200 bg-white'
const errorClass = 'mt-1.5 text-xs font-medium text-red-600'

export function ReimbursementForm({ submitting, onSubmit, onCancel }: ReimbursementFormProps) {
    const [values, setValues] = useState<ReimbursementFormValues>(emptyReimbursementFormValues)
    const [errors, setErrors] = useState<ReimbursementFormErrors>({})
    const [categories, setCategories] = useState<ResourceCategory[]>([])
    const [categoriesLoading, setCategoriesLoading] = useState(true)
    const [receiptFiles, setReceiptFiles] = useState<File[]>([])

    useEffect(() => {
        let active = true
        fetchResourceCategoriesApi()
            .then((items) => { if (active) setCategories(items) })
            .catch(() => { if (active) setCategories([{ name: 'Other', description: '' }]) })
            .finally(() => { if (active) setCategoriesLoading(false) })
        return () => { active = false }
    }, [])

    const setField = <K extends keyof ReimbursementFormValues>(key: K, value: ReimbursementFormValues[K]) => {
        setValues((current) => ({ ...current, [key]: value }))
        if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }))
    }

    const submit = (event: React.FormEvent) => {
        event.preventDefault()
        const validation = validateReimbursement(values)
        if (Object.keys(validation).length) {
            setErrors(validation)
            return
        }
        onSubmit(values, receiptFiles)
    }

    return (
        <form onSubmit={submit} className="space-y-6">
            <Card className="rounded-3xl border-slate-100 bg-white shadow-premium">
                <CardHeader className="px-8 pt-8"><CardTitle className="text-lg">Reimbursement details</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 gap-6 p-8 pt-2 md:grid-cols-2">
                    <Field label="Name" error={errors.name} required><Input value={values.name} onChange={(event) => setField('name', event.target.value)} placeholder="e.g. Fuel reimbursement" className={fieldClass} disabled={submitting} /></Field>
                    <Field label="Category" error={errors.category} required>
                        <Select value={values.category || undefined} onValueChange={(value) => setField('category', value)} disabled={submitting || categoriesLoading}>
                            <SelectTrigger className={fieldClass}><SelectValue placeholder={categoriesLoading ? 'Loading categories…' : 'Select category'} /></SelectTrigger>
                            <SelectContent>{categories.map((category) => <SelectItem key={category.name} value={category.name}>{category.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </Field>
                    <Field label="Amount" error={errors.costAmount} required><Input type="number" min="0.01" step="0.01" value={values.costAmount} onChange={(event) => setField('costAmount', event.target.value)} placeholder="0.00" className={fieldClass} disabled={submitting} /></Field>
                    <Field label="Expense date" error={errors.expenseDate} required><Input type="date" value={values.expenseDate} onChange={(event) => setField('expenseDate', event.target.value)} className={fieldClass} disabled={submitting} /></Field>
                    <Field label="Description" error={errors.description} required className="md:col-span-2"><Textarea value={values.description} onChange={(event) => setField('description', event.target.value)} placeholder="What did you purchase and why?" className="min-h-28 rounded-xl border-slate-200" disabled={submitting} /></Field>
                    <Field label="Purpose" error={errors.purpose}><Input value={values.purpose} onChange={(event) => setField('purpose', event.target.value)} placeholder="e.g. Client visit" className={fieldClass} disabled={submitting} /></Field>
                    <Field label="Notes" error={errors.notes}><Input value={values.notes} onChange={(event) => setField('notes', event.target.value)} placeholder="Any additional details" className={fieldClass} disabled={submitting} /></Field>
                </CardContent>
            </Card>
            <Card className="rounded-3xl border-slate-100 bg-white shadow-premium">
                <CardHeader className="px-8 pt-8"><CardTitle className="text-lg">Receipts</CardTitle></CardHeader>
                <CardContent className="space-y-5 p-8 pt-2">
                    <Field label="Upload receipt files">
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-4">
                            <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-blue-600">
                                <Upload className="h-4 w-4" />
                                <span>{receiptFiles.length ? 'Choose more files' : 'Choose files'}</span>
                                <Input type="file" multiple className="sr-only" onChange={(event) => setReceiptFiles((current) => [...current, ...Array.from(event.target.files || [])])} disabled={submitting} />
                            </label>
                            {receiptFiles.length > 0 && <p className="mt-2 text-xs text-slate-500">{receiptFiles.map((file) => file.name).join(', ')}</p>}
                            <p className="mt-1 text-xs text-slate-400">Files are uploaded to Firebase Storage under resources/ when submitted.</p>
                        </div>
                    </Field>
                    <Field label="Existing or external URLs" error={errors.attachmentUrls}>
                        <div className="relative"><Paperclip className="absolute left-4 top-4 h-4 w-4 text-slate-400" /><Textarea value={values.attachmentUrls.join('\n')} onChange={(event) => setField('attachmentUrls', event.target.value.split(/\r?\n|,/))} placeholder="Optional: one https:// receipt URL per line" className="min-h-24 rounded-xl border-slate-200 pl-11" disabled={submitting} /></div>
                    </Field>
                </CardContent>
            </Card>
            <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
                <Button type="button" variant="outline" className="rounded-xl" onClick={onCancel} disabled={submitting}>Cancel</Button>
                <Button type="submit" className="rounded-xl bg-blue-600 text-white hover:bg-blue-700" disabled={submitting}>{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Submit reimbursement</Button>
            </div>
        </form>
    )
}

function Field({ label, error, required, className = '', children }: { label: string; error?: string; required?: boolean; className?: string; children: React.ReactNode }) {
    return <div className={className}><Label className="mb-2 block text-sm font-bold text-slate-700">{label}{required && <span className="text-red-500"> *</span>}</Label>{children}{error && <p className={errorClass}>{error}</p>}</div>
}
