import { describe, expect, it } from 'vitest'
import type { Resource } from '@/types'
import {
    buildLibraryBookPayload,
    buildLibraryBookUpdatePayload,
    isLibraryBook,
    libraryBookValues,
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

    it('omits an identifier when the optional field is blank', () => {
        expect(buildLibraryBookPayload({
            title: 'Clean Code', identifier: '  ', author: '', isbn: '',
            publisher: '', edition: '', location: '', description: '',
        })).not.toHaveProperty('identifier')
    })

    it('updates metadata without changing status or assignment and preserves circulation details', () => {
        const checkedOut = resource({
            status: 'active', assignmentType: 'person', assignedToEmployeeId: 'employee-1',
            identifier: 'OLD', location: 'Shelf A', description: 'Old notes',
            details: { author: 'Old author', isbn: '123', dueDate: '2026-08-01', condition: 'good' },
        })
        const values = {
            title: ' Refactoring ', identifier: '', author: ' Martin Fowler ', isbn: '',
            publisher: ' Addison-Wesley ', edition: '', location: ' Shelf B ', description: '',
        }

        expect(buildLibraryBookUpdatePayload(values, checkedOut)).toEqual({
            resourceType: 'physical_asset', category: LIBRARY_CATEGORY, name: 'Refactoring',
            identifier: '', description: '', location: 'Shelf B',
            details: { dueDate: '2026-08-01', condition: 'good', author: 'Martin Fowler', publisher: 'Addison-Wesley' },
        })
        expect(buildLibraryBookUpdatePayload(values, checkedOut)).not.toHaveProperty('status')
        expect(buildLibraryBookUpdatePayload(values, checkedOut)).not.toHaveProperty('assignmentType')
    })

    it('maps an existing resource into editable book values', () => {
        expect(libraryBookValues(resource({
            identifier: 'BOOK-1', location: 'Shelf C', description: 'Notes',
            details: { author: 'Author', isbn: 'ISBN', publisher: 'Publisher', edition: '2nd' },
        }))).toEqual({
            title: 'Clean Code', identifier: 'BOOK-1', author: 'Author', isbn: 'ISBN',
            publisher: 'Publisher', edition: '2nd', location: 'Shelf C', description: 'Notes',
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