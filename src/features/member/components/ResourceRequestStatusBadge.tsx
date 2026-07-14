'use client'

import { Badge } from '@/components/ui/badge'
import type { ResourceRequestStatus } from '@/types'

const STATUS_VARIANT: Record<
    ResourceRequestStatus,
    'warning' | 'success' | 'destructive'
> = {
    Pending: 'warning',
    Approved: 'success',
    Rejected: 'destructive',
}

export function ResourceRequestStatusBadge({
    status,
}: {
    status: ResourceRequestStatus
}) {
    const variant = STATUS_VARIANT[status] ?? 'secondary'
    return <Badge variant={variant}>{status}</Badge>
}
