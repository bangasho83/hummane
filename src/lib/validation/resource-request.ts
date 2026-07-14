import { RESOURCE_REQUEST_PRIORITIES, type ResourceRequestPriority } from '@/types'

/**
 * Pure validation for the member Resource Request form.
 * Kept framework-free so it can be unit tested and shared between the
 * create and edit flows.
 */

export interface ResourceRequestFormValues {
    title: string
    categoryId: string
    description: string
    goalAlignment: string
    priority: string
    estimatedCost: string
    productUrl: string
}

export type ResourceRequestFormErrors = Partial<
    Record<keyof ResourceRequestFormValues, string>
>

export const emptyResourceRequestFormValues: ResourceRequestFormValues = {
    title: '',
    categoryId: '',
    description: '',
    goalAlignment: '',
    priority: '',
    estimatedCost: '',
    productUrl: '',
}

const isValidUrl = (value: string): boolean => {
    try {
        const url = new URL(value)
        return url.protocol === 'http:' || url.protocol === 'https:'
    } catch {
        return false
    }
}

export function validateResourceRequest(
    values: ResourceRequestFormValues
): ResourceRequestFormErrors {
    const errors: ResourceRequestFormErrors = {}

    const title = values.title.trim()
    if (!title) {
        errors.title = 'Title is required'
    } else if (title.length < 3) {
        errors.title = 'Title must be at least 3 characters'
    } else if (title.length > 120) {
        errors.title = 'Title must be less than 120 characters'
    }

    if (!values.categoryId.trim()) {
        errors.categoryId = 'Please select a category'
    }

    const description = values.description.trim()
    if (!description) {
        errors.description = 'Description is required'
    } else if (description.length < 10) {
        errors.description = 'Description must be at least 10 characters'
    } else if (description.length > 2000) {
        errors.description = 'Description must be less than 2000 characters'
    }

    const goalAlignment = values.goalAlignment.trim()
    if (!goalAlignment) {
        errors.goalAlignment = 'Goal alignment is required'
    } else if (goalAlignment.length < 10) {
        errors.goalAlignment = 'Goal alignment must be at least 10 characters'
    } else if (goalAlignment.length > 2000) {
        errors.goalAlignment = 'Goal alignment must be less than 2000 characters'
    }

    if (!values.priority.trim()) {
        errors.priority = 'Please select a priority'
    } else if (
        !RESOURCE_REQUEST_PRIORITIES.includes(
            values.priority as ResourceRequestPriority
        )
    ) {
        errors.priority = 'Please select a valid priority'
    }

    const costRaw = values.estimatedCost.trim()
    if (!costRaw) {
        errors.estimatedCost = 'Estimated cost is required'
    } else {
        const cost = Number(costRaw)
        if (!Number.isFinite(cost)) {
            errors.estimatedCost = 'Estimated cost must be a number'
        } else if (cost < 0) {
            errors.estimatedCost = 'Estimated cost cannot be negative'
        } else if (cost > 10_000_000) {
            errors.estimatedCost = 'Estimated cost is too large'
        }
    }

    const productUrl = values.productUrl.trim()
    if (productUrl && !isValidUrl(productUrl)) {
        errors.productUrl = 'Enter a valid http(s) URL'
    }

    return errors
}

export function isResourceRequestValid(
    values: ResourceRequestFormValues
): boolean {
    return Object.keys(validateResourceRequest(values)).length === 0
}
