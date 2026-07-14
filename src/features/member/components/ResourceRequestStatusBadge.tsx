'use client'

import { Badge } from '@/components/ui/badge'
import type { ResourceRequestStatus } from '@/types'

const STATUS_VARIANT: Record<
    ResourceRequestStatus,
    'warning' | 'success' | 'destructive' | 'secondary'
> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'destructive',
    fulfilled: 'success',
    cancelled: 'secondary',
}

export function ResourceRequestStatusBadge({
    status,
}: {
    status: ResourceRequestStatus
}) {
    const variant = STATUS_VARIANT[status] ?? 'secondary'
    return <Badge variant={variant} className="capitalize">{status}</Badge>
}
