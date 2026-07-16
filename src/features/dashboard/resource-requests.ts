import type { ResourceRequest } from '@/types'

export const getRecentResourceRequests = (
    requests: ResourceRequest[],
    limit = 4
): ResourceRequest[] => [...requests]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit)