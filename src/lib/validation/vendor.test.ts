import { describe, expect, it } from 'vitest'
import { emptyVendorFormValues, validateVendor } from './vendor'

describe('validateVendor', () => {
    it('requires only the vendor name', () => {
        const errors = validateVendor(emptyVendorFormValues)
        expect(errors.name).toBe('Vendor name is required')
        expect(errors.contactName).toBeUndefined()
        expect(errors.email).toBeUndefined()
        expect(errors.phone).toBeUndefined()
    })

    it('accepts a name with all optional fields empty', () => {
        expect(validateVendor({ ...emptyVendorFormValues, name: 'Apple Reseller' })).toEqual({})
    })

    it('rejects an invalid optional email', () => {
        const errors = validateVendor({
            ...emptyVendorFormValues,
            name: 'Apple Reseller',
            email: 'not-an-email',
        })
        expect(errors.email).toBe('Enter a valid email address')
    })

    it('accepts a valid optional email', () => {
        const errors = validateVendor({
            ...emptyVendorFormValues,
            name: 'Apple Reseller',
            email: 'accounts@example.com',
        })
        expect(errors.email).toBeUndefined()
    })
})
