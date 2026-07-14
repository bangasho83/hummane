import { describe, it, expect } from 'vitest'
import {
    validateResourceRequest,
    isResourceRequestValid,
    emptyResourceRequestFormValues,
    type ResourceRequestFormValues,
} from './resource-request'

const validValues: ResourceRequestFormValues = {
    title: 'Standing desk',
    categoryId: 'cat-1',
    description: 'A height adjustable standing desk for my home office.',
    goalAlignment: 'Improves my focus and long-term health while working.',
    priority: 'High',
    estimatedCost: '450',
    productUrl: 'https://example.com/desk',
}

describe('validateResourceRequest', () => {
    it('returns no errors for valid values', () => {
        expect(validateResourceRequest(validValues)).toEqual({})
        expect(isResourceRequestValid(validValues)).toBe(true)
    })

    it('flags every required field when empty', () => {
        const errors = validateResourceRequest(emptyResourceRequestFormValues)
        expect(errors.title).toBeDefined()
        expect(errors.categoryId).toBeDefined()
        expect(errors.description).toBeDefined()
        expect(errors.goalAlignment).toBeDefined()
        expect(errors.priority).toBeDefined()
        expect(errors.estimatedCost).toBeDefined()
        expect(isResourceRequestValid(emptyResourceRequestFormValues)).toBe(false)
    })

    it('rejects a title shorter than 3 characters', () => {
        const errors = validateResourceRequest({ ...validValues, title: 'ab' })
        expect(errors.title).toContain('at least 3')
    })

    it('rejects a title longer than 120 characters', () => {
        const errors = validateResourceRequest({
            ...validValues,
            title: 'a'.repeat(121),
        })
        expect(errors.title).toContain('less than 120')
    })

    it('rejects a description shorter than 10 characters', () => {
        const errors = validateResourceRequest({ ...validValues, description: 'short' })
        expect(errors.description).toContain('at least 10')
    })

    it('rejects a goal alignment shorter than 10 characters', () => {
        const errors = validateResourceRequest({ ...validValues, goalAlignment: 'nope' })
        expect(errors.goalAlignment).toContain('at least 10')
    })

    it('rejects an invalid priority value', () => {
        const errors = validateResourceRequest({ ...validValues, priority: 'Whenever' })
        expect(errors.priority).toContain('valid priority')
    })

    it('accepts each allowed priority', () => {
        for (const priority of ['Low', 'Medium', 'High', 'Urgent']) {
            const errors = validateResourceRequest({ ...validValues, priority })
            expect(errors.priority).toBeUndefined()
        }
    })

    it('rejects a non-numeric estimated cost', () => {
        const errors = validateResourceRequest({ ...validValues, estimatedCost: 'abc' })
        expect(errors.estimatedCost).toContain('number')
    })

    it('rejects a negative estimated cost', () => {
        const errors = validateResourceRequest({ ...validValues, estimatedCost: '-5' })
        expect(errors.estimatedCost).toContain('negative')
    })

    it('accepts a zero estimated cost', () => {
        const errors = validateResourceRequest({ ...validValues, estimatedCost: '0' })
        expect(errors.estimatedCost).toBeUndefined()
    })

    it('allows an empty product URL (optional)', () => {
        const errors = validateResourceRequest({ ...validValues, productUrl: '' })
        expect(errors.productUrl).toBeUndefined()
    })

    it('rejects a malformed product URL', () => {
        const errors = validateResourceRequest({ ...validValues, productUrl: 'not-a-url' })
        expect(errors.productUrl).toContain('valid http')
    })

    it('rejects a non-http(s) product URL', () => {
        const errors = validateResourceRequest({
            ...validValues,
            productUrl: 'ftp://example.com/file',
        })
        expect(errors.productUrl).toContain('valid http')
    })

    it('trims whitespace-only fields as empty', () => {
        const errors = validateResourceRequest({ ...validValues, title: '   ' })
        expect(errors.title).toContain('required')
    })
})
