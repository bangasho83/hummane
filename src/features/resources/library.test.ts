import { describe, expect, it } from 'vitest'
import type { Resource } from '@/types'
import {
    buildLibraryBookPayload,
    isLibraryBook,
    LIBRARY_CATEGORY,
    libraryBooksAssignedTo,
} from './library'

const resource = (overrides: Partial<Resource> = {}): Resource => ({
    id: 'book-1',
    companyId: 'company-1',
    resourceType: 'physical_asset',
    name: 'Clean Code',
    category: LIBRARY_CATEGORY,
    status: 'active',
    assignmentType: 'unassigned',
    details: {},
    attachments: { files: [] },
    assignmentHistory: [],
    createdAt: '2026-07-16T00:00:00Z',
    ...overrides,
})

describe('library resource mapping', () => {
    it('builds a minimal unassigned physical asset payload', () => {
        expect(buildLibraryBookPayload({
            title: ' Clean Code ', identifier: ' BOOK-001 ', author: ' Robert Martin ',
            isbn: '', publisher: '', edition: '', location: ' Shelf A ', description: '',
        })).toEqual({
            resourceType: 'physical_asset', category: LIBRARY_CATEGORY, name: 'Clean Code',
            identifier: 'BOOK-001', status: 'active', assignmentType: 'unassigned',
            location: 'Shelf A', description: undefined, details: { author: 'Robert Martin' },
        })
    })

    it('separates library books from other physical assets', () => {
        expect(isLibraryBook(resource())).toBe(true)
        expect(isLibraryBook(resource({ category: 'IT Equipment' }))).toBe(false)
    })

    it('returns only books assigned to the selected employee', () => {
        const assigned = resource({ assignmentType: 'person', assignedToEmployeeId: 'employee-1' })
        const otherEmployee = resource({ id: 'book-2', assignmentType: 'person', assignedToEmployeeId: 'employee-2' })
        expect(libraryBooksAssignedTo([assigned, otherEmployee], 'employee-1')).toEqual([assigned])
    })
})