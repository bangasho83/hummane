import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
    createResourceTemplateApi,
    fetchResourceCostReportApi,
    fetchResourceTemplatesApi,
} from './client'

const response = (body: unknown, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
}) as unknown as Response

describe('Resource template API', () => {
    let fetchMock: ReturnType<typeof vi.fn>

    beforeEach(() => {
        fetchMock = vi.fn()
        vi.stubGlobal('fetch', fetchMock)
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('fetches active templates with bearer authentication', async () => {
        fetchMock.mockResolvedValue(response({ resourceTemplates: [{ id: 't1', name: 'Claude.ai' }] }))

        await expect(fetchResourceTemplatesApi('tok')).resolves.toEqual([{ id: 't1', name: 'Claude.ai' }])
        const [url, init] = fetchMock.mock.calls[0]
        expect(String(url)).toContain('/resource-templates?limit=100&activeOnly=true')
        expect(init.headers).toMatchObject({ Authorization: 'Bearer tok' })
    })

    it('creates a template using the API payload', async () => {
        fetchMock.mockResolvedValue(response({ id: 't1', name: 'Claude.ai' }, 201))

        await createResourceTemplateApi({
            name: 'Claude.ai',
            category: 'Software & Subscriptions',
            defaultCostAmount: 25,
            defaultCostType: 'recurring',
        }, 'tok')

        const [, init] = fetchMock.mock.calls[0]
        expect(init.method).toBe('POST')
        expect(JSON.parse(init.body)).toMatchObject({ name: 'Claude.ai', defaultCostAmount: 25 })
    })

    it('sends product and employee filters to the cost report', async () => {
        fetchMock.mockResolvedValue(response({ totalCost: 45, resourceCount: 2, byTemplate: [], byEmployee: [] }))

        await expect(fetchResourceCostReportApi('tok', {
            resourceType: 'subscription',
            status: 'active',
            employeeId: 'employee/1',
            resourceTemplateId: 'template/1',
        })).resolves.toMatchObject({ totalCost: 45, resourceCount: 2 })

        const url = new URL(String(fetchMock.mock.calls[0][0]))
        expect(Object.fromEntries(url.searchParams)).toEqual({
            resourceType: 'subscription',
            status: 'active',
            employeeId: 'employee/1',
            resourceTemplateId: 'template/1',
        })
    })
})