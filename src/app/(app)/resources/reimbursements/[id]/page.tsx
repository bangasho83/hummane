'use client'

import { useParams } from 'next/navigation'
import { ReimbursementDetail } from '@/features/resources'

export default function ReimbursementDetailPage() {
    const params = useParams<{ id: string }>()
    return <ReimbursementDetail id={params.id} />
}
