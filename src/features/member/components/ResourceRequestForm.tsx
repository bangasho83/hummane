'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { RESOURCE_REQUEST_PRIORITIES, type ResourceCategory } from '@/types'
import {
    validateResourceRequest,
    type ResourceRequestFormErrors,
    type ResourceRequestFormValues,
} from '@/lib/validation/resource-request'

interface ResourceRequestFormProps {
    initialValues: ResourceRequestFormValues
    categories: ResourceCategory[]
    categoriesLoading?: boolean
    submitting?: boolean
    submitLabel?: string
    onSubmit: (values: ResourceRequestFormValues) => void
    onCancel?: () => void
}

const fieldError = 'text-xs font-medium text-red-600 mt-1'

export function ResourceRequestForm({
    initialValues,
    categories,
    categoriesLoading = false,
    submitting = false,
    submitLabel = 'Submit Request',
    onSubmit,
    onCancel,
}: ResourceRequestFormProps) {
    const [values, setValues] = useState<ResourceRequestFormValues>(initialValues)
    const [errors, setErrors] = useState<ResourceRequestFormErrors>({})

    const setField = <K extends keyof ResourceRequestFormValues>(
        key: K,
        value: ResourceRequestFormValues[K]
    ) => {
        setValues((prev) => ({ ...prev, [key]: value }))
        if (errors[key]) {
            setErrors((prev) => ({ ...prev, [key]: undefined }))
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const validationErrors = validateResourceRequest(values)
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors)
            return
        }
        setErrors({})
        onSubmit(values)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                        id="title"
                        value={values.title}
                        onChange={(e) => setField('title', e.target.value)}
                        placeholder="e.g. Standing desk for home office"
                        className="mt-2"
                        disabled={submitting}
                    />
                    {errors.title && <p className={fieldError}>{errors.title}</p>}
                </div>

                <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                        value={values.categoryId || undefined}
                        onValueChange={(v) => setField('categoryId', v)}
                        disabled={submitting || categoriesLoading}
                    >
                        <SelectTrigger id="category" className="mt-2">
                            <SelectValue
                                placeholder={categoriesLoading ? 'Loading…' : 'Select a category'}
                            />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                    {c.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.categoryId && <p className={fieldError}>{errors.categoryId}</p>}
                </div>

                <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                        value={values.priority || undefined}
                        onValueChange={(v) => setField('priority', v)}
                        disabled={submitting}
                    >
                        <SelectTrigger id="priority" className="mt-2">
                            <SelectValue placeholder="Select a priority" />
                        </SelectTrigger>
                        <SelectContent>
                            {RESOURCE_REQUEST_PRIORITIES.map((p) => (
                                <SelectItem key={p} value={p}>
                                    {p}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.priority && <p className={fieldError}>{errors.priority}</p>}
                </div>

                <div>
                    <Label htmlFor="estimatedCost">Estimated Cost (optional)</Label>
                    <Input
                        id="estimatedCost"
                        type="number"
                        min="0"
                        step="0.01"
                        value={values.estimatedCost}
                        onChange={(e) => setField('estimatedCost', e.target.value)}
                        placeholder="0.00"
                        className="mt-2"
                        disabled={submitting}
                    />
                    {errors.estimatedCost && (
                        <p className={fieldError}>{errors.estimatedCost}</p>
                    )}
                </div>

                <div>
                    <Label htmlFor="productUrl">Product URL (optional)</Label>
                    <Input
                        id="productUrl"
                        value={values.productUrl}
                        onChange={(e) => setField('productUrl', e.target.value)}
                        placeholder="https://…"
                        className="mt-2"
                        disabled={submitting}
                    />
                    {errors.productUrl && <p className={fieldError}>{errors.productUrl}</p>}
                </div>
            </div>

            <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    value={values.description}
                    onChange={(e) => setField('description', e.target.value)}
                    placeholder="Describe what you need and why."
                    className="mt-2 min-h-[120px]"
                    disabled={submitting}
                />
                {errors.description && <p className={fieldError}>{errors.description}</p>}
            </div>

            <div>
                <Label htmlFor="goalAlignment">Goal Alignment (optional)</Label>
                <Textarea
                    id="goalAlignment"
                    value={values.goalAlignment}
                    onChange={(e) => setField('goalAlignment', e.target.value)}
                    placeholder="How does this support your goals or the team's?"
                    className="mt-2 min-h-[100px]"
                    disabled={submitting}
                />
                {errors.goalAlignment && <p className={fieldError}>{errors.goalAlignment}</p>}
            </div>

            <div className="flex items-center justify-end gap-3">
                {onCancel && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={submitting}
                        className="rounded-2xl"
                    >
                        Cancel
                    </Button>
                )}
                <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 px-6"
                >
                    {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {submitLabel}
                </Button>
            </div>
        </form>
    )
}
