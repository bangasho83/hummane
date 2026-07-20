'use client'

import { Badge } from '@/components/ui/badge'
import type { ResourceRequestStatus } from '@/types'

const STATUS_VARIANT: Record<
    ResourceRequestStatus,
    'default' | 'warning' | 'success' | 'destructive' | 'secondary'
> = {
    pending: 'warning',
    in_review: 'default',
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
    const label = status === 'in_review' ? 'In Review' : status
    return <Badge variant={variant} className="capitalize">{label}</Badge>
}
