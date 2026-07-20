'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toast'
import type { Resource } from '@/types'
import { createResourceApi, updateResourceApi } from '@/lib/api/client'
import { useApp } from '@/lib/context/AppContext'
import { resourceId } from '../resource-ui'
import {
    buildLibraryBookPayload,
    buildLibraryBookUpdatePayload,
    libraryBookValues,
    type LibraryBookValues,
} from '../library'

const initialValues: LibraryBookValues = {
    title: '', identifier: '', author: '', isbn: '', publisher: '',
    edition: '', location: '', description: '',
}

export function LibraryBookForm({ resource }: { resource?: Resource }) {
    const router = useRouter()
    const { apiAccessToken } = useApp()
    const editing = !!resource
    const destination = editing ? `/resources/library/${resourceId(resource)}` : '/resources/library'
    const [values, setValues] = useState(() => resource ? libraryBookValues(resource) : initialValues)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [saving, setSaving] = useState(false)

    const setValue = (key: keyof LibraryBookValues, value: string) => {
        setValues((current) => ({ ...current, [key]: value }))
        setErrors((current) => ({ ...current, [key]: '' }))
    }

    const submit = async (event: React.FormEvent) => {
        event.preventDefault()
        const nextErrors: Record<string, string> = {}
        if (!values.title.trim()) nextErrors.title = 'Book title is required.'
        if (Object.keys(nextErrors).length) {
            setErrors(nextErrors)
            return
        }
        if (!apiAccessToken) {
            toast('You must be signed in to save a book.', 'error')
            return
        }

        setSaving(true)
        try {
            if (resource) {
                await updateResourceApi(resourceId(resource), buildLibraryBookUpdatePayload(values, resource), apiAccessToken)
                toast('Book updated.', 'success')
            } else {
                await createResourceApi(buildLibraryBookPayload(values), apiAccessToken)
                toast('Book added to the library.', 'success')
            }
            router.push(destination)
            router.refresh()
        } catch (error) {
            toast(error instanceof Error ? error.message : `Failed to ${editing ? 'update' : 'add'} book`, 'error')
        } finally {
            setSaving(false)
        }
    }

    return (
        <Card className="rounded-3xl border-slate-100 bg-white shadow-premium">
            <CardContent className="p-8">
                <form className="space-y-8" onSubmit={submit}>
                    <div className="grid gap-6 md:grid-cols-2">
                        <Field label="Book title *" error={errors.title}>
                            <Input value={values.title} onChange={(event) => setValue('title', event.target.value)} placeholder="e.g. Clean Code" className="h-11 rounded-xl" disabled={saving} />
                        </Field>
                        <Field label="Identifier">
                            <Input value={values.identifier} onChange={(event) => setValue('identifier', event.target.value)} placeholder="Optional identifier" className="h-11 rounded-xl" disabled={saving} />
                        </Field>
                        <Field label="Author">
                            <Input value={values.author} onChange={(event) => setValue('author', event.target.value)} placeholder="Author name" className="h-11 rounded-xl" disabled={saving} />
                        </Field>
                        <Field label="ISBN">
                            <Input value={values.isbn} onChange={(event) => setValue('isbn', event.target.value)} placeholder="ISBN" className="h-11 rounded-xl" disabled={saving} />
                        </Field>
                        <Field label="Publisher">
                            <Input value={values.publisher} onChange={(event) => setValue('publisher', event.target.value)} placeholder="Publisher" className="h-11 rounded-xl" disabled={saving} />
                        </Field>
                        <Field label="Edition">
                            <Input value={values.edition} onChange={(event) => setValue('edition', event.target.value)} placeholder="e.g. 2nd edition" className="h-11 rounded-xl" disabled={saving} />
                        </Field>
                        <Field label="Library location">
                            <Input value={values.location} onChange={(event) => setValue('location', event.target.value)} placeholder="e.g. Shelf A3" className="h-11 rounded-xl" disabled={saving} />
                        </Field>
                    </div>
                    <Field label="Description / Notes">
                        <Textarea value={values.description} onChange={(event) => setValue('description', event.target.value)} placeholder="Optional notes about this copy" className="min-h-24 rounded-xl" disabled={saving} />
                    </Field>
                    <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-6">
                        <Button type="button" variant="outline" className="rounded-xl" onClick={() => router.push(destination)} disabled={saving}>Cancel</Button>
                        <Button type="submit" className="rounded-xl bg-blue-600 text-white hover:bg-blue-700" disabled={saving}>{saving ? <Loader2 className="animate-spin" /> : <BookOpen />}{editing ? 'Save changes' : 'Add book'}</Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return <div className="space-y-2"><Label>{label}</Label>{children}{error && <p className="text-xs font-medium text-red-600">{error}</p>}</div>
}