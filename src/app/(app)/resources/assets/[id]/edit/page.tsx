'use client'

import { useParams } from 'next/navigation'
import { ResourceEditPage } from '@/features/resources'

export default function EditResourcePage() {
    const params = useParams<{ id: string }>()
    return <ResourceEditPage id={params.id} mode="resource" />
}
