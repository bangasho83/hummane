'use client'

import { useParams } from 'next/navigation'
import { ResourceDetail } from '@/features/resources'

export default function LibraryBookDetailPage() {
    const params = useParams<{ id: string }>()
    return <ResourceDetail id={params.id} variant="library" />
}