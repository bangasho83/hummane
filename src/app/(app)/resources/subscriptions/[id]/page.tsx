import { ResourceDetail } from '@/features/resources'

export default async function SubscriptionDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return <ResourceDetail id={id} mode="subscription" />
}