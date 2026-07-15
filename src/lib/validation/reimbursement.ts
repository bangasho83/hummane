import type { ResourcePayload } from '@/lib/api/client'

export interface ReimbursementFormValues {
    name: string
    category: string
    description: string
    costAmount: string
    expenseDate: string
    attachmentUrls: string[]
    purpose: string
    notes: string
}

export type ReimbursementFormErrors = Partial<Record<keyof ReimbursementFormValues, string>>

export const emptyReimbursementFormValues: ReimbursementFormValues = {
    name: '',
    category: 'Other',
    description: '',
    costAmount: '',
    expenseDate: '',
    attachmentUrls: [],
    purpose: '',
    notes: '',
}

const isHttpUrl = (value: string): boolean => {
    try {
        const url = new URL(value)
        return url.protocol === 'http:' || url.protocol === 'https:'
    } catch {
        return false
    }
}

export function validateReimbursement(values: ReimbursementFormValues): ReimbursementFormErrors {
    const errors: ReimbursementFormErrors = {}
    if (!values.name.trim()) errors.name = 'Reimbursement name is required'
    if (!values.category.trim()) errors.category = 'Category is required'
    if (!values.description.trim()) errors.description = 'Description is required'
    if (!values.expenseDate.trim()) errors.expenseDate = 'Expense date is required'

    const amount = values.costAmount.trim()
    if (!amount) {
        errors.costAmount = 'Amount is required'
    } else if (!/^\d+(?:\.\d{1,2})?$/.test(amount) || Number(amount) <= 0) {
        errors.costAmount = 'Amount must be greater than zero with at most 2 decimal places'
    }

    if (values.attachmentUrls.some((value) => value.trim() && !isHttpUrl(value.trim()))) {
        errors.attachmentUrls = 'Receipt links must be valid http(s) URLs'
    }
    return errors
}

export function buildReimbursementPayload(
    values: ReimbursementFormValues,
    employeeId: string
): ResourcePayload {
    const files = values.attachmentUrls.map((url) => url.trim()).filter(Boolean)
    const purpose = values.purpose.trim()
    const notes = values.notes.trim()
    return {
        resourceType: 'reimbursement',
        name: values.name.trim(),
        category: values.category.trim(),
        description: values.description.trim(),
        assignmentType: 'not_applicable',
        costAmount: Number(values.costAmount.trim()),
        costType: 'one_time',
        expenseDate: values.expenseDate.trim(),
        paidByEmployeeId: employeeId,
        isSettled: false,
        ...(files.length ? { attachments: { files } } : {}),
        ...((purpose || notes) ? {
            details: {
                ...(purpose ? { purpose } : {}),
                ...(notes ? { notes } : {}),
            },
        } : {}),
    }
}
