import { ResourceDetail } from '@/features/resources'

export default async function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return <ResourceDetail id={id} mode="book" />
}