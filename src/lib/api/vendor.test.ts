import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
    createVendorApi,
    deleteVendorApi,
    fetchVendorApi,
    fetchVendorsApi,
    updateVendorApi,
} from './client'

const response = (body: unknown, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => typeof body === 'string' ? body : JSON.stringify(body),
}) as unknown as Response

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

describe('Vendor API', () => {
    it('lists up to 100 vendors with bearer authentication', async () => {
        fetchMock.mockResolvedValue(response([{ id: 'v1', name: 'Apple' }]))
        expect(await fetchVendorsApi('tok')).toHaveLength(1)
        const [url, init] = fetchMock.mock.calls[0]
        expect(String(url)).toContain('/vendors?limit=100')
        expect(init.headers.Authorization).toBe('Bearer tok')
    })

    it('creates a vendor without adding companyId', async () => {
        fetchMock.mockResolvedValue(response({ id: 'v1', name: 'Apple' }, 201))
        await createVendorApi({ name: 'Apple', isActive: true }, 'tok')
        const [, init] = fetchMock.mock.calls[0]
        expect(init.method).toBe('POST')
        expect(JSON.parse(init.body)).toEqual({ name: 'Apple', isActive: true })
        expect(JSON.parse(init.body)).not.toHaveProperty('companyId')
    })

    it('gets and partially updates an encoded vendor id', async () => {
        fetchMock.mockResolvedValue(response({ id: 'v/1', name: 'Apple' }))
        await fetchVendorApi('v/1', 'tok')
        expect(String(fetchMock.mock.calls[0][0])).toContain('/vendors/v%2F1')

        fetchMock.mockResolvedValue(response({ id: 'v/1', name: 'Apple', isActive: false }))
        await updateVendorApi('v/1', { isActive: false }, 'tok')
        const [url, init] = fetchMock.mock.calls[1]
        expect(String(url)).toContain('/vendors/v%2F1')
        expect(init.method).toBe('PUT')
        expect(JSON.parse(init.body)).toEqual({ isActive: false })
    })

    it('deletes a vendor and accepts an empty success body', async () => {
        fetchMock.mockResolvedValue(response(null))
        await expect(deleteVendorApi('v1', 'tok')).resolves.toBeUndefined()
        expect(fetchMock.mock.calls[0][1].method).toBe('DELETE')
    })

    it('surfaces API validation errors', async () => {
        fetchMock.mockResolvedValue(response('Duplicate vendor name', 400))
        await expect(createVendorApi({ name: 'Apple' }, 'tok')).rejects.toThrow('Duplicate vendor name')
    })
})
