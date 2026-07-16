import { describe, expect, it } from 'vitest'
import type { ResourceRequest } from '@/types'
import { getRecentResourceRequests } from './resource-requests'

const request = (id: string, createdAt: string): ResourceRequest => ({
    id,
    companyId: 'company-1',
    title: `Request ${id}`,
    category: 'Equipment',
    priority: 'normal',
    status: 'pending',
    createdAt,
})

describe('getRecentResourceRequests', () => {
    it('returns the newest requests without mutating the source list', () => {
        const requests = [
            request('oldest', '2026-07-01T09:00:00Z'),
            request('newest', '2026-07-03T09:00:00Z'),
            request('middle', '2026-07-02T09:00:00Z'),
        ]

        expect(getRecentResourceRequests(requests, 2).map(({ id }) => id))
            .toEqual(['newest', 'middle'])
        expect(requests.map(({ id }) => id)).toEqual(['oldest', 'newest', 'middle'])
    })
})