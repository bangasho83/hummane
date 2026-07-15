import { describe, expect, it } from 'vitest'
import {
    emptyResourceFormValues,
    validateResource,
    type ResourceFormValues,
} from './resource'

const validValues = (mode: 'resource' | 'bill' = 'resource'): ResourceFormValues => ({
    ...emptyResourceFormValues(mode),
    name: mode === 'bill' ? 'Office lunch' : 'Laptop',
    category: mode === 'bill' ? 'Meals' : 'Computers',
    vendorId: mode === 'bill' ? 'v1' : '',
    expenseDate: mode === 'bill' ? '2026-07-15' : '',
})

describe('emptyResourceFormValues', () => {
    it('defaults resource mode to a physical, unassigned asset', () => {
        const values = emptyResourceFormValues('resource')
        expect(values.resourceType).toBe('physical_asset')
        expect(values.assignmentType).toBe('unassigned')
        expect(values.status).toBe('active')
        expect(values.isSettled).toBe(false)
        expect(values.attachmentUrls).toEqual([])
    })

    it('defaults bill mode to a company expense', () => {
        const values = emptyResourceFormValues('bill')
        expect(values.resourceType).toBe('expense')
        expect(values.assignmentType).toBe('company')
    })

    it('returns a fresh attachment array for each form', () => {
        const first = emptyResourceFormValues('resource')
        const second = emptyResourceFormValues('resource')
        first.attachmentUrls.push('https://example.com/file.pdf')
        expect(second.attachmentUrls).toEqual([])
    })
})

describe('validateResource', () => {
    it('requires name, category, and resource type in every mode', () => {
        const values = validValues()
        values.name = ' '
        values.category = ''
        values.resourceType = ''
        expect(validateResource(values, 'resource')).toMatchObject({
            name: 'Name is required',
            category: 'Category is required',
            resourceType: 'Resource type is required',
        })
    })

    it('accepts valid common fields and every resource type', () => {
        for (const resourceType of [
            'physical_asset', 'subscription', 'service', 'expense', 'event', 'reimbursement',
        ]) {
            const values = validValues()
            values.resourceType = resourceType
            if (resourceType === 'reimbursement') {
                values.paidByEmployeeId = 'e1'
                values.expenseDate = '2026-07-15'
            }
            expect(validateResource(values, 'resource')).toEqual({})
        }
    })

    it('rejects invalid resource, status, assignment, and cost types', () => {
        const values = validValues()
        values.resourceType = 'unknown'
        values.status = 'broken'
        values.assignmentType = 'team'
        values.costType = 'monthly'
        expect(validateResource(values, 'resource')).toMatchObject({
            resourceType: 'Select a valid resource type',
            status: 'Select a valid status',
            assignmentType: 'Select a valid assignment type',
            costType: 'Select a valid cost type',
        })
    })

    it('requires an employee for person assignments', () => {
        const values = validValues()
        values.assignmentType = 'person'
        expect(validateResource(values, 'resource').assignedToEmployeeId).toBe(
            'Employee is required for a person assignment'
        )
        values.assignedToEmployeeId = 'e1'
        expect(validateResource(values, 'resource').assignedToEmployeeId).toBeUndefined()
    })

    it('allows costs with no more than two decimal places', () => {
        for (const costAmount of ['0', '12', '12.3', '12.34']) {
            expect(validateResource({ ...validValues(), costAmount }, 'resource').costAmount).toBeUndefined()
        }
        for (const costAmount of ['-1', '1.234', '.50', '1.', 'money']) {
            expect(validateResource({ ...validValues(), costAmount }, 'resource').costAmount).toContain(
                'at most 2 decimal places'
            )
        }
    })

    it('requires vendor and expense date for bill mode', () => {
        const values = validValues('bill')
        values.vendorId = ''
        values.expenseDate = ''
        expect(validateResource(values, 'bill')).toMatchObject({
            vendorId: 'Vendor is required for a bill',
            expenseDate: 'Expense date is required for a bill',
        })
    })

    it('does not impose bill-only requirements in resource mode', () => {
        const errors = validateResource(validValues('resource'), 'resource')
        expect(errors.vendorId).toBeUndefined()
        expect(errors.expenseDate).toBeUndefined()
    })

    it('requires paidBy and expense date for reimbursements', () => {
        const values = validValues()
        values.resourceType = 'reimbursement'
        expect(validateResource(values, 'resource')).toMatchObject({
            paidByEmployeeId: 'Paid by employee is required for a reimbursement',
            expenseDate: 'Expense date is required for a reimbursement',
        })
        values.paidByEmployeeId = 'e1'
        values.expenseDate = '2026-07-15'
        expect(validateResource(values, 'resource')).toEqual({})
    })

    it('allows empty attachment slots but rejects non-http(s) links', () => {
        expect(validateResource({
            ...validValues(),
            attachmentUrls: ['', 'https://example.com/a.pdf', 'http://example.com/b.pdf'],
        }, 'resource').attachmentUrls).toBeUndefined()
        expect(validateResource({
            ...validValues(),
            attachmentUrls: ['ftp://example.com/a.pdf'],
        }, 'resource').attachmentUrls).toContain('http(s)')
    })

    it('validates optional seat count and account email', () => {
        const values = validValues()
        values.numberOfSeats = '1.5'
        values.accountEmail = 'invalid'
        expect(validateResource(values, 'resource')).toMatchObject({
            numberOfSeats: 'Number of seats must be a positive whole number',
            accountEmail: 'Enter a valid account email',
        })
    })
})
