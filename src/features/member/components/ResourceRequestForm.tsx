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
import { RESOURCE_REQUEST_PRIORITIES, RESOURCE_REQUEST_TYPES, type ResourceCategory, type ResourceRequestType } from '@/types'
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

    const requestType = values.requestType as ResourceRequestType
    const isStaffingRequest = requestType === 'headcount' || requestType === 'team_allocation'
    const requestTypeLabel = requestType === 'headcount'
        ? 'Headcount'
        : requestType === 'team_allocation'
            ? 'Team Allocation'
            : 'Resource / Asset'

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <Label htmlFor="requestType">Request type</Label>
                    <Select value={values.requestType} onValueChange={(value) => setField('requestType', value)} disabled={submitting}>
                        <SelectTrigger id="requestType" className="mt-2"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {RESOURCE_REQUEST_TYPES.map((type) => (
                                <SelectItem key={type} value={type}>
                                    {type === 'resource' ? 'Resource / Asset' : type === 'headcount' ? 'Headcount' : 'Team Allocation'}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.requestType && <p className={fieldError}>{errors.requestType}</p>}
                </div>
                <div className="md:col-span-2">
                    <Label htmlFor="title">{isStaffingRequest ? 'Request title' : 'Title'}</Label>
                    <Input
                        id="title"
                        value={values.title}
                        onChange={(e) => setField('title', e.target.value)}
                        placeholder={isStaffingRequest ? `e.g. ${requestTypeLabel} for the Product team` : 'e.g. Standing desk for home office'}
                        className="mt-2"
                        disabled={submitting}
                    />
                    {errors.title && <p className={fieldError}>{errors.title}</p>}
                </div>

                {!isStaffingRequest && <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                        value={values.categoryId || 'none'}
                        onValueChange={(v) => setField('categoryId', v)}
                        disabled={submitting || categoriesLoading}
                    >
                        <SelectTrigger id="category" className="mt-2">
                            <SelectValue
                                placeholder={categoriesLoading ? 'Loading…' : 'Select a category'}
                            />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none" disabled>Select a category</SelectItem>
                            {categories.filter((category) => category.name !== 'Staffing').map((c) => (
                                <SelectItem key={c.name} value={c.name}>
                                    {c.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.categoryId && <p className={fieldError}>{errors.categoryId}</p>}
                </div>}

                <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                        value={values.priority || 'none'}
                        onValueChange={(v) => setField('priority', v)}
                        disabled={submitting}
                    >
                        <SelectTrigger id="priority" className="mt-2">
                            <SelectValue placeholder="Select a priority" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none" disabled>Select a priority</SelectItem>
                            {RESOURCE_REQUEST_PRIORITIES.map((p) => (
                                <SelectItem key={p} value={p}>
                                    {p.charAt(0).toUpperCase() + p.slice(1)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.priority && <p className={fieldError}>{errors.priority}</p>}
                </div>

                {!isStaffingRequest && <div>
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
                </div>}

                {!isStaffingRequest && <div>
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
                </div>}

                {requestType === 'headcount' && <>
                    <div>
                        <Label htmlFor="role">Role / job title</Label>
                        <Input id="role" value={values.role} onChange={(e) => setField('role', e.target.value)} placeholder="e.g. Senior Backend Engineer" className="mt-2" disabled={submitting} />
                        {errors.role && <p className={fieldError}>{errors.role}</p>}
                    </div>
                    <div>
                        <Label htmlFor="headcount">People needed</Label>
                        <Input id="headcount" type="number" min="1" step="1" value={values.headcount} onChange={(e) => setField('headcount', e.target.value)} placeholder="1" className="mt-2" disabled={submitting} />
                        {errors.headcount && <p className={fieldError}>{errors.headcount}</p>}
                    </div>
                    <div>
                        <Label htmlFor="team">Team / department</Label>
                        <Input id="team" value={values.team} onChange={(e) => setField('team', e.target.value)} placeholder="e.g. Engineering" className="mt-2" disabled={submitting} />
                        {errors.team && <p className={fieldError}>{errors.team}</p>}
                    </div>
                    <div>
                        <Label htmlFor="employmentType">Employment type</Label>
                        <Select value={values.employmentType || 'none'} onValueChange={(value) => setField('employmentType', value)} disabled={submitting}>
                            <SelectTrigger id="employmentType" className="mt-2"><SelectValue placeholder="Select employment type" /></SelectTrigger>
                            <SelectContent><SelectItem value="none" disabled>Select employment type</SelectItem><SelectItem value="permanent">Permanent</SelectItem><SelectItem value="temporary">Temporary</SelectItem></SelectContent>
                        </Select>
                        {errors.employmentType && <p className={fieldError}>{errors.employmentType}</p>}
                    </div>
                </>}

                {isStaffingRequest && <div>
                    <Label htmlFor="startDate">Requested start date</Label>
                    <Input id="startDate" type="date" value={values.startDate} onChange={(e) => setField('startDate', e.target.value)} className="mt-2" disabled={submitting} />
                    {errors.startDate && <p className={fieldError}>{errors.startDate}</p>}
                </div>}

                {requestType === 'team_allocation' && <>
                    <div>
                        <Label htmlFor="teamMember">Requested team member</Label>
                        <Input id="teamMember" value={values.teamMember} onChange={(e) => setField('teamMember', e.target.value)} placeholder="Name of the employee to allocate" className="mt-2" disabled={submitting} />
                        {errors.teamMember && <p className={fieldError}>{errors.teamMember}</p>}
                    </div>
                    <div>
                        <Label htmlFor="team">Team / project</Label>
                        <Input id="team" value={values.team} onChange={(e) => setField('team', e.target.value)} placeholder="e.g. Product launch" className="mt-2" disabled={submitting} />
                        {errors.team && <p className={fieldError}>{errors.team}</p>}
                    </div>
                    <div>
                        <Label htmlFor="allocationPercentage">Allocation percentage</Label>
                        <Input id="allocationPercentage" type="number" min="1" max="100" step="1" value={values.allocationPercentage} onChange={(e) => setField('allocationPercentage', e.target.value)} placeholder="e.g. 50" className="mt-2" disabled={submitting} />
                        {errors.allocationPercentage && <p className={fieldError}>{errors.allocationPercentage}</p>}
                    </div>
                </>}

                {isStaffingRequest && <div className="md:col-span-2">
                    <Label htmlFor="skills">Required skills (optional)</Label>
                    <Textarea id="skills" value={values.skills} onChange={(e) => setField('skills', e.target.value)} placeholder="List the skills, experience, or domain knowledge needed." className="mt-2 min-h-[90px]" disabled={submitting} />
                    {errors.skills && <p className={fieldError}>{errors.skills}</p>}
                </div>}
            </div>

            <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    value={values.description}
                    onChange={(e) => setField('description', e.target.value)}
                    placeholder={isStaffingRequest ? 'Describe the staffing need and why it is required.' : 'Describe what you need and why.'}
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
