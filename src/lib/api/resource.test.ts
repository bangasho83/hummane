import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
    createResourceApi,
    deleteResourceApi,
    fetchResourceApi,
    fetchResourcesApi,
    parseApiError,
    updateResourceApi,
    updateResourceAssignmentApi,
    type ResourcePayload,
} from './client'

const response = (body: unknown, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => typeof body === 'string' ? body : JSON.stringify(body),
}) as unknown as Response

const resource = {
    id: 'r1',
    companyId: 'c1',
    resourceType: 'physical_asset',
    name: 'Laptop',
    category: 'Computer',
    status: 'active',
    assignmentType: 'unassigned',
    details: {},
    attachments: { files: [] },
    assignmentHistory: [],
    createdAt: '2026-07-15T00:00:00.000Z',
}

const payload: ResourcePayload = {
    resourceType: 'physical_asset',
    name: 'Laptop',
    category: 'Computer',
    status: 'active',
    assignmentType: 'unassigned',
}

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
})

describe('Resource API', () => {
    it('lists resources with bearer authentication and no query by default', async () => {
        fetchMock.mockResolvedValue(response({ resources: [resource] }))

        await expect(fetchResourcesApi('tok')).resolves.toEqual([resource])
        const [url, init] = fetchMock.mock.calls[0]
        expect(String(url)).toMatch(/\/resources$/)
        expect(init).toMatchObject({ headers: { Authorization: 'Bearer tok' } })
        expect(init.method).toBeUndefined()
    })

    it('sends every supported list filter and caps limit at 100', async () => {
        fetchMock.mockResolvedValue(response({ data: [] }))
        await fetchResourcesApi('tok', {
            resourceType: 'subscription',
            status: 'inactive',
            assignedToEmployeeId: 'employee / 1',
            vendorId: 'vendor&1',
            limit: 500,
        })

        const url = new URL(String(fetchMock.mock.calls[0][0]))
        expect(Object.fromEntries(url.searchParams)).toEqual({
            resourceType: 'subscription',
            status: 'inactive',
            assignedToEmployeeId: 'employee / 1',
            vendorId: 'vendor&1',
            limit: '100',
        })
    })

    it('returns an empty list for a malformed list response', async () => {
        fetchMock.mockResolvedValue(response({ data: { id: 'not-a-list' } }))
        await expect(fetchResourcesApi('tok')).resolves.toEqual([])
    })

    it('fetches one resource using an encoded id', async () => {
        fetchMock.mockResolvedValue(response({ data: resource }))
        await expect(fetchResourceApi('r/1', 'tok')).resolves.toEqual(resource)
        expect(String(fetchMock.mock.calls[0][0])).toContain('/resources/r%2F1')
    })

    it('creates a resource with only approved payload keys', async () => {
        fetchMock.mockResolvedValue(response({ resource }, 201))
        const unsafePayload = {
            ...payload,
            details: { brand: 'Framework' },
            attachments: { files: ['https://example.com/receipt.pdf'] },
            companyId: 'must-not-be-sent',
            createdBy: 'must-not-be-sent',
        } as ResourcePayload

        await createResourceApi(unsafePayload, 'tok')
        const [, init] = fetchMock.mock.calls[0]
        expect(init.method).toBe('POST')
        expect(init.headers).toMatchObject({
            Authorization: 'Bearer tok',
            'Content-Type': 'application/json',
        })
        expect(JSON.parse(init.body)).toEqual({
            ...payload,
            details: { brand: 'Framework' },
            attachments: { files: ['https://example.com/receipt.pdf'] },
        })
    })

    it('partially updates a resource and strips server-managed fields', async () => {
        fetchMock.mockResolvedValue(response(resource))
        await updateResourceApi(
            'r/1',
            { name: 'Updated', companyId: 'no', createdBy: 'no' } as Partial<ResourcePayload>,
            'tok'
        )

        const [url, init] = fetchMock.mock.calls[0]
        expect(String(url)).toContain('/resources/r%2F1')
        expect(init.method).toBe('PUT')
        expect(JSON.parse(init.body)).toEqual({ name: 'Updated' })
    })

    it('patches assignment with only assignment fields', async () => {
        fetchMock.mockResolvedValue(response(resource))
        await updateResourceAssignmentApi('r/1', {
            assignmentType: 'person',
            assignedToEmployeeId: 'e1',
            location: 'HQ',
            note: 'Issued by IT',
            companyId: 'no',
        } as Parameters<typeof updateResourceAssignmentApi>[1], 'tok')

        const [url, init] = fetchMock.mock.calls[0]
        expect(String(url)).toContain('/resources/r%2F1/assignment')
        expect(init.method).toBe('PATCH')
        expect(JSON.parse(init.body)).toEqual({
            assignmentType: 'person',
            assignedToEmployeeId: 'e1',
            location: 'HQ',
            note: 'Issued by IT',
        })
    })

    it('deletes with authentication and no request body', async () => {
        fetchMock.mockResolvedValue(response(null, 204))
        await expect(deleteResourceApi('r1', 'tok')).resolves.toBeUndefined()
        const [, init] = fetchMock.mock.calls[0]
        expect(init.method).toBe('DELETE')
        expect(init.body).toBeUndefined()
        expect(init.headers).not.toHaveProperty('Content-Type')
    })

    it('surfaces paths and messages from Zod issue arrays', async () => {
        fetchMock.mockResolvedValue(response({
            issues: [
                { code: 'invalid_type', path: ['name'], message: 'Required' },
                { code: 'custom', path: ['details', 'url'], message: 'Invalid URL' },
            ],
        }, 400))

        await expect(createResourceApi(payload, 'tok')).rejects.toThrow(
            'name: Required; details.url: Invalid URL'
        )
    })

    it('preserves plain-text errors and wraps network failures', async () => {
        fetchMock.mockResolvedValueOnce(response('Resource not found', 404))
        await expect(fetchResourceApi('missing', 'tok')).rejects.toThrow('Resource not found')

        fetchMock.mockRejectedValueOnce(new Error('offline'))
        await expect(fetchResourcesApi('tok')).rejects.toThrow('Network error while contacting the API')
    })
})

describe('parseApiError', () => {
    it('uses string messages and a fallback for an empty body', () => {
        expect(parseApiError('{"message":"Invalid resource"}', 'fallback')).toBe('Invalid resource')
        expect(parseApiError('', 'fallback')).toBe('fallback')
    })

    it('formats direct and nested error arrays returned by validation middleware', () => {
        expect(parseApiError(JSON.stringify({
            errors: [{ path: ['costAmount'], message: 'Expected number' }],
        }), 'fallback')).toBe('costAmount: Expected number')
        expect(parseApiError(JSON.stringify({
            error: { issues: [{ path: ['vendorId'], message: 'Required' }] },
        }), 'fallback')).toBe('vendorId: Required')
    })
})
