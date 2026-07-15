import { Badge } from '@/components/ui/badge'
import { labelize } from '@/features/resources/resource-ui'

export function ResourceBadge({ value }: { value: string }) {
    const normalized = value.toLowerCase()
    const variant = normalized === 'active' || normalized === 'available' || normalized === 'paid'
        ? 'success'
        : normalized === 'maintenance' || normalized === 'pending'
            ? 'warning'
            : normalized === 'retired' || normalized === 'cancelled'
                ? 'destructive'
                : 'secondary'
    return <Badge variant={variant}>{labelize(value || 'unknown')}</Badge>
}
