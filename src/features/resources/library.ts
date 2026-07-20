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

const libraryBookMetadata = (values: LibraryBookValues): Partial<ResourcePayload> => ({
    resourceType: 'physical_asset',
    category: LIBRARY_CATEGORY,
    name: values.title.trim(),
    ...(values.identifier.trim() ? { identifier: values.identifier.trim() } : {}),
    description: values.description.trim() || undefined,
    location: values.location.trim() || undefined,
    details: Object.fromEntries(Object.entries({
        isbn: values.isbn.trim() || undefined,
        author: values.author.trim() || undefined,
        publisher: values.publisher.trim() || undefined,
        edition: values.edition.trim() || undefined,
    }).filter(([, value]) => value !== undefined)),
})

export const buildLibraryBookPayload = (values: LibraryBookValues): ResourcePayload => ({
    ...libraryBookMetadata(values),
    resourceType: 'physical_asset',
    category: LIBRARY_CATEGORY,
    name: values.title.trim(),
    status: 'active',
    assignmentType: 'unassigned',
})

export const buildLibraryBookUpdatePayload = (
    values: LibraryBookValues,
    resource: Resource
): Partial<ResourcePayload> => {
    const editableDetailKeys = new Set(['isbn', 'author', 'publisher', 'edition'])
    const preservedDetails = Object.fromEntries(
        Object.entries(resourceDetails(resource)).filter(([key]) => !editableDetailKeys.has(key))
    )
    const metadata = libraryBookMetadata(values)
    return {
        ...metadata,
        identifier: values.identifier.trim(),
        description: values.description.trim(),
        location: values.location.trim(),
        details: { ...preservedDetails, ...metadata.details },
    }
}

export const libraryBookValues = (resource: Resource): LibraryBookValues => {
    const item = resource as Resource & { identifier?: string | null; location?: string | null; description?: string | null }
    return {
        title: resource.name,
        identifier: item.identifier || '',
        author: libraryBookDetail(resource, 'author'),
        isbn: libraryBookDetail(resource, 'isbn'),
        publisher: libraryBookDetail(resource, 'publisher'),
        edition: libraryBookDetail(resource, 'edition'),
        location: item.location || '',
        description: item.description || '',
    }
}

export const libraryBooksAssignedTo = (resources: Resource[], employeeId: string): Resource[] =>
    resources.filter((resource) =>
        isLibraryBook(resource)
        && assignmentEmployeeId(resourceAssignment(resource)) === employeeId
    )

export const libraryBookDetail = (resource: Resource, key: string): string =>
    textValue(resourceDetails(resource)[key])