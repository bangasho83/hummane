import { describe, expect, it } from 'vitest'
import {
    buildReimbursementPayload,
    emptyReimbursementFormValues,
    validateReimbursement,
} from './reimbursement'

const validValues = {
    ...emptyReimbursementFormValues,
    name: 'Fuel Reimbursement',
    category: 'Other',
    description: 'Fuel used for a client visit.',
    costAmount: '8000',
    expenseDate: '2026-07-15',
    attachmentUrls: ['https://storage.example.com/fuel-receipt.jpg'],
    purpose: 'Client visit',
    notes: 'Round trip from office to client location',
}

describe('validateReimbursement', () => {
    it('requires the core reimbursement fields', () => {
        expect(validateReimbursement(emptyReimbursementFormValues)).toMatchObject({
            name: expect.any(String),
            description: expect.any(String),
            costAmount: expect.any(String),
            expenseDate: expect.any(String),
        })
    })

    it('accepts a valid reimbursement and rejects invalid amounts and receipt URLs', () => {
        expect(validateReimbursement(validValues)).toEqual({})
        expect(validateReimbursement({ ...validValues, costAmount: '-1' }).costAmount).toBeDefined()
        expect(validateReimbursement({ ...validValues, attachmentUrls: ['file:///receipt.jpg'] }).attachmentUrls).toBeDefined()
    })
})

describe('buildReimbursementPayload', () => {
    it('builds the member reimbursement API contract', () => {
        expect(buildReimbursementPayload(validValues, 'employee-1')).toEqual({
            resourceType: 'reimbursement',
            name: 'Fuel Reimbursement',
            category: 'Other',
            description: 'Fuel used for a client visit.',
            assignmentType: 'not_applicable',
            costAmount: 8000,
            costType: 'one_time',
            expenseDate: '2026-07-15',
            paidByEmployeeId: 'employee-1',
            isSettled: false,
            attachments: { files: ['https://storage.example.com/fuel-receipt.jpg'] },
            details: {
                purpose: 'Client visit',
                notes: 'Round trip from office to client location',
            },
        })
    })

    it('omits empty optional attachments and details', () => {
        const payload = buildReimbursementPayload({
            ...validValues,
            attachmentUrls: [''],
            purpose: '',
            notes: '',
        }, 'employee-1')
        expect(payload).not.toHaveProperty('attachments')
        expect(payload).not.toHaveProperty('details')
    })
})
