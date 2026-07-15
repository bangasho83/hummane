import {
    RESOURCE_ASSIGNMENT_TYPES,
    RESOURCE_COST_TYPES,
    RESOURCE_STATUSES,
    RESOURCE_TYPES,
    type ResourceAssignmentType,
    type ResourceCostType,
    type ResourceStatus,
    type ResourceType,
} from '@/types'

export type ResourceFormMode = 'resource' | 'bill'

export interface ResourceFormValues {
    resourceType: string
    name: string
    category: string
    description: string
    identifier: string
    status: string
    assignmentType: string
    assignedToEmployeeId: string
    location: string
    vendorId: string
    costAmount: string
    costType: string
    expenseDate: string
    paidByEmployeeId: string
    isSettled: boolean
    attachmentUrls: string[]
    brand: string
    model: string
    serialNumber: string
    warrantyExpiresOn: string
    numberOfSeats: string
    accountEmail: string
    renewalDate: string
    affectedResourceId: string
    invoiceNumber: string
    assignmentNote: string
}

export type ResourceFormErrors = Partial<Record<keyof ResourceFormValues, string>>

export const emptyResourceFormValues = (mode: ResourceFormMode): ResourceFormValues => ({
    resourceType: mode === 'bill' ? 'expense' : 'physical_asset',
    name: '',
    category: '',
    description: '',
    identifier: '',
    status: 'active',
    assignmentType: mode === 'bill' ? 'company' : 'unassigned',
    assignedToEmployeeId: '',
    location: '',
    vendorId: '',
    costAmount: '',
    costType: 'one_time',
    expenseDate: '',
    paidByEmployeeId: '',
    isSettled: false,
    attachmentUrls: [],
    brand: '',
    model: '',
    serialNumber: '',
    warrantyExpiresOn: '',
    numberOfSeats: '',
    accountEmail: '',
    renewalDate: '',
    affectedResourceId: '',
    invoiceNumber: '',
    assignmentNote: '',
})

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const isHttpUrl = (value: string): boolean => {
    try {
        const url = new URL(value)
        return url.protocol === 'http:' || url.protocol === 'https:'
    } catch {
        return false
    }
}

const hasAtMostTwoDecimalPlaces = (value: string): boolean => /^\d+(?:\.\d{1,2})?$/.test(value)

export function validateResource(
    values: ResourceFormValues,
    mode: ResourceFormMode
): ResourceFormErrors {
    const errors: ResourceFormErrors = {}
    const resourceType = values.resourceType.trim()

    if (!values.name.trim()) errors.name = 'Name is required'
    if (!values.category.trim()) errors.category = 'Category is required'
    if (!resourceType) {
        errors.resourceType = 'Resource type is required'
    } else if (!RESOURCE_TYPES.includes(resourceType as ResourceType)) {
        errors.resourceType = 'Select a valid resource type'
    }

    if (values.status && !RESOURCE_STATUSES.includes(values.status as ResourceStatus)) {
        errors.status = 'Select a valid status'
    }
    if (
        values.assignmentType
        && !RESOURCE_ASSIGNMENT_TYPES.includes(values.assignmentType as ResourceAssignmentType)
    ) {
        errors.assignmentType = 'Select a valid assignment type'
    }
    if (values.assignmentType === 'person' && !values.assignedToEmployeeId.trim()) {
        errors.assignedToEmployeeId = 'Employee is required for a person assignment'
    }

    const cost = values.costAmount.trim()
    if (cost) {
        if (!hasAtMostTwoDecimalPlaces(cost)) {
            errors.costAmount = 'Cost must be a non-negative number with at most 2 decimal places'
        } else if (!Number.isFinite(Number(cost))) {
            errors.costAmount = 'Cost must be a valid number'
        }
    }
    if (values.costType && !RESOURCE_COST_TYPES.includes(values.costType as ResourceCostType)) {
        errors.costType = 'Select a valid cost type'
    }

    if (mode === 'bill') {
        if (!values.vendorId.trim()) errors.vendorId = 'Vendor is required for a bill'
        if (!values.expenseDate.trim()) errors.expenseDate = 'Expense date is required for a bill'
    }

    if (resourceType === 'reimbursement') {
        if (!values.paidByEmployeeId.trim()) {
            errors.paidByEmployeeId = 'Paid by employee is required for a reimbursement'
        }
        if (!values.expenseDate.trim()) {
            errors.expenseDate = 'Expense date is required for a reimbursement'
        }
    }

    const invalidLink = values.attachmentUrls.some((value) => {
        const link = value.trim()
        return link.length > 0 && !isHttpUrl(link)
    })
    if (invalidLink) errors.attachmentUrls = 'Attachment links must be valid http(s) URLs'

    const seats = values.numberOfSeats.trim()
    if (seats && (!/^\d+$/.test(seats) || Number(seats) < 1)) {
        errors.numberOfSeats = 'Number of seats must be a positive whole number'
    }
    const email = values.accountEmail.trim()
    if (email && !EMAIL_PATTERN.test(email)) errors.accountEmail = 'Enter a valid account email'

    return errors
}
