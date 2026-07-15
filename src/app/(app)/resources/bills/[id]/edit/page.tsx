'use client'

import { useParams } from 'next/navigation'
import { ResourceEditPage } from '@/features/resources'

export default function EditBillPage() {
    const params = useParams<{ id: string }>()
    return <ResourceEditPage id={params.id} mode="bill" />
}
