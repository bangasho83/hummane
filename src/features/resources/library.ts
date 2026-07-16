import type { Resource } from '@/types'
import type { ResourcePayload } from '@/lib/api/client'
import {
    assignmentEmployeeId,
    resourceAssignment,
    resourceCategory,
    resourceDetails,
    resourceType,
    textValue,
} from './resource-ui'

export const LIBRARY_CATEGORY = 'Training & Learning'

export interface LibraryBookValues {
    title: string
    identifier: string
    author: string
    isbn: string
    publisher: string
    edition: string
    location: string
    description: string
}

export const isLibraryBook = (resource: Resource): boolean =>
    resourceType(resource) === 'physical_asset'
    && resourceCategory(resource).trim().toLowerCase() === LIBRARY_CATEGORY.toLowerCase()

export const buildLibraryBookPayload = (values: LibraryBookValues): ResourcePayload => ({
    resourceType: 'physical_asset',
    category: LIBRARY_CATEGORY,
    name: values.title.trim(),
    identifier: values.identifier.trim(),
    description: values.description.trim() || undefined,
    status: 'active',
    assignmentType: 'unassigned',
    location: values.location.trim() || undefined,
    details: Object.fromEntries(Object.entries({
        isbn: values.isbn.trim() || undefined,
        author: values.author.trim() || undefined,
        publisher: values.publisher.trim() || undefined,
        edition: values.edition.trim() || undefined,
    }).filter(([, value]) => value !== undefined)),
})

export const libraryBooksAssignedTo = (resources: Resource[], employeeId: string): Resource[] =>
    resources.filter((resource) =>
        isLibraryBook(resource)
        && assignmentEmployeeId(resourceAssignment(resource)) === employeeId
    )

export const libraryBookDetail = (resource: Resource, key: string): string =>
    textValue(resourceDetails(resource)[key])