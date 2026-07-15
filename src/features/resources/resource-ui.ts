import type { Resource } from '@/types'

export type ResourceRecord = Record<string, unknown>

export const asRecord = (value: unknown): ResourceRecord =>
    value && typeof value === 'object' ? value as ResourceRecord : {}

export const textValue = (value: unknown): string =>
    typeof value === 'string' ? value : typeof value === 'number' ? String(value) : ''

export const resourceRecord = (resource: Resource): ResourceRecord => asRecord(resource)
export const resourceDetails = (resource: Resource): ResourceRecord => asRecord(resourceRecord(resource).details)
export const resourceAssignment = (resource: Resource): ResourceRecord => {
    const item = resourceRecord(resource)
    return Object.keys(asRecord(item.assignment || item.currentAssignment)).length
        ? asRecord(item.assignment || item.currentAssignment)
        : item
}

export const resourceId = (resource: Resource): string => textValue(resourceRecord(resource).id)
export const resourceType = (resource: Resource): string => textValue(resourceRecord(resource).resourceType || resourceRecord(resource).type)
export const resourceName = (resource: Resource): string => textValue(resourceRecord(resource).name) || 'Untitled resource'
export const resourceStatus = (resource: Resource): string => textValue(resourceRecord(resource).status)

export const nestedName = (value: unknown): string => {
    if (typeof value === 'string') return value
    const item = asRecord(value)
    return textValue(item.name || item.title)
}

export const resourceCategory = (resource: Resource): string => {
    const item = resourceRecord(resource)
    return textValue(item.categoryName) || nestedName(item.category)
}

export const resourceVendor = (resource: Resource, vendorNames?: Map<string, string>): string => {
    const item = resourceRecord(resource)
    return vendorNames?.get(textValue(item.vendorId)) || textValue(item.vendorName) || nestedName(item.vendor)
}

export const assignmentEmployeeId = (assignment: ResourceRecord): string =>
    textValue(assignment.assignedToEmployeeId || assignment.employeeId)

export const assignmentEmployeeName = (assignment: ResourceRecord, employeeNames?: Map<string, string>): string =>
    employeeNames?.get(assignmentEmployeeId(assignment))
        || textValue(assignment.assignedToEmployeeName || assignment.employeeName)

export const resourceCost = (resource: Resource): number | null => {
    const item = resourceRecord(resource)
    const cost = item.cost
    const candidate = item.costAmount ?? (typeof cost === 'object' && cost ? asRecord(cost).amount : cost ?? item.amount)
    if (candidate === '' || candidate == null) return null
    const number = Number(candidate)
    return Number.isFinite(number) ? number : null
}

export const resourceCostType = (resource: Resource): string => {
    const item = resourceRecord(resource)
    return textValue(item.costType) || textValue(asRecord(item.cost).type)
}

export const resourceDate = (resource: Resource): string => {
    const item = resourceRecord(resource)
    const details = resourceDetails(resource)
    return textValue(item.expenseDate || item.date || details.date || details.expenseDate || details.eventDate || item.createdAt)
}

export const resourceInvoice = (resource: Resource): string => {
    const item = resourceRecord(resource)
    return textValue(item.invoiceNumber || resourceDetails(resource).invoiceNumber)
}

export const resourceIsSettled = (resource: Resource): boolean => resourceRecord(resource).isSettled === true

export const resourceAttachmentUrls = (resource: Resource): string[] => {
    const attachments = resourceRecord(resource).attachments
    if (Array.isArray(attachments)) {
        return attachments.flatMap((entry) => {
            if (typeof entry === 'string') return [entry]
            const item = asRecord(entry)
            const url = textValue(item.url || item.dataUrl)
            return url ? [url] : []
        })
    }
    const files = asRecord(attachments).files
    return Array.isArray(files) ? files.filter((file): file is string => typeof file === 'string' && !!file) : []
}

export const resourceAssignmentHistory = (resource: Resource): ResourceRecord[] => {
    const history = resourceRecord(resource).assignmentHistory
    return Array.isArray(history) ? history.map(asRecord) : []
}

export const labelize = (value: string): string => value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())

export const dateInputValue = (value: unknown): string => textValue(value).split('T')[0]

export const formatResourceDate = (value: unknown, withTime = false): string => {
    const raw = textValue(value)
    if (!raw) return '—'
    const date = new Date(raw)
    if (Number.isNaN(date.getTime())) return raw
    return withTime ? date.toLocaleString() : date.toLocaleDateString()
}

export const compact = <T extends ResourceRecord>(value: T): ResourceRecord =>
    Object.fromEntries(Object.entries(value).filter(([, item]) => {
        if (item === undefined || item === null || item === '') return false
        if (Array.isArray(item) && item.length === 0) return false
        if (typeof item === 'object' && !Array.isArray(item) && Object.keys(item as object).length === 0) return false
        return true
    }))

export const employeeDisplayName = (employee: ResourceRecord): string =>
    textValue(employee.name) || textValue(employee.email) || textValue(employee.employeeId) || 'Unknown employee'
