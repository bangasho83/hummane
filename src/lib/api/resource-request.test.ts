import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
    fetchResourceCategoriesApi,
    createResourceRequestApi,
    fetchResourceRequestsApi,
    fetchResourceRequestApi,
    updateResourceRequestApi,
    type ResourceRequestPayload,
} from './client'

const okJson = (body: unknown) =>
    ({
        ok: true,
        json: async () => body,
        text: async () => JSON.stringify(body),
    }) as unknown as Response

const errRes = (message: string) =>
    ({
        ok: false,
        json: async () => null,
        text: async () => message,
    }) as unknown as Response

const payload: ResourceRequestPayload = {
    title: 'Desk',
    categoryId: 'cat-1',
    description: 'A desk',
    goalAlignment: 'Health',
    priority: 'High',
    estimatedCost: 100,
    companyId: 'co-1',
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

describe('fetchResourceCategoriesApi', () => {
    it('GETs categories without an Authorization header', async () => {
        fetchMock.mockResolvedValue(okJson({ data: [{ id: 'c1', name: 'Hardware' }] }))
        const result = await fetchResourceCategoriesApi()
        expect(result).toEqual([{ id: 'c1', name: 'Hardware' }])
        const [url, init] = fetchMock.mock.calls[0]
        expect(String(url)).toContain('/resource-categories')
        expect(init.method).toBe('GET')
        expect(init.headers?.Authorization).toBeUndefined()
    })

    it('returns [] when the payload is not an array', async () => {
        fetchMock.mockResolvedValue(okJson({ data: null }))
        expect(await fetchResourceCategoriesApi()).toEqual([])
    })
})

describe('createResourceRequestApi', () => {
    it('POSTs with a bearer token and JSON body', async () => {
        fetchMock.mockResolvedValue(okJson({ data: { id: 'r1', ...payload } }))
        const result = await createResourceRequestApi(payload, 'token-123')
        expect(result).toMatchObject({ id: 'r1' })
        const [url, init] = fetchMock.mock.calls[0]
        expect(String(url)).toContain('/resource-requests')
        expect(init.method).toBe('POST')
        expect(init.headers.Authorization).toBe('Bearer token-123')
        expect(JSON.parse(init.body)).toMatchObject({ title: 'Desk' })
    })

    it('throws with the server message on a non-ok response', async () => {
        fetchMock.mockResolvedValue(errRes('boom'))
        await expect(createResourceRequestApi(payload, 't')).rejects.toThrow('boom')
    })

    it('wraps network errors', async () => {
        fetchMock.mockRejectedValue(new Error('down'))
        await expect(createResourceRequestApi(payload, 't')).rejects.toThrow('Network error')
    })
})

describe('fetchResourceRequestsApi', () => {
    it('GETs the list with a bearer token', async () => {
        fetchMock.mockResolvedValue(okJson({ data: [{ id: 'r1' }] }))
        const result = await fetchResourceRequestsApi('tok')
        expect(result).toEqual([{ id: 'r1' }])
        const [, init] = fetchMock.mock.calls[0]
        expect(init.headers.Authorization).toBe('Bearer tok')
    })
})

describe('fetchResourceRequestApi', () => {
    it('encodes the id in the URL', async () => {
        fetchMock.mockResolvedValue(okJson({ data: { id: 'a/b' } }))
        await fetchResourceRequestApi('a/b', 'tok')
        const [url] = fetchMock.mock.calls[0]
        expect(String(url)).toContain('/resource-requests/a%2Fb')
    })

    it('returns null when the response is not an object', async () => {
        fetchMock.mockResolvedValue(okJson({ data: 'nope' }))
        expect(await fetchResourceRequestApi('id', 'tok')).toBeNull()
    })
})

describe('updateResourceRequestApi', () => {
    it('PUTs with a bearer token and encoded id', async () => {
        fetchMock.mockResolvedValue(okJson({ data: { id: 'r1', ...payload } }))
        const result = await updateResourceRequestApi('r1', payload, 'tok')
        expect(result).toMatchObject({ id: 'r1' })
        const [url, init] = fetchMock.mock.calls[0]
        expect(String(url)).toContain('/resource-requests/r1')
        expect(init.method).toBe('PUT')
        expect(init.headers.Authorization).toBe('Bearer tok')
    })

    it('throws on a non-ok response', async () => {
        fetchMock.mockResolvedValue(errRes('nope'))
        await expect(updateResourceRequestApi('r1', payload, 'tok')).rejects.toThrow('nope')
    })
})
