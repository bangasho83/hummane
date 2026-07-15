'use client'

import { useParams } from 'next/navigation'
import { ResourceDetail } from '@/features/resources'

export default function ResourceDetailPage() {
    const params = useParams<{ id: string }>()
    return <ResourceDetail id={params.id} />
}
