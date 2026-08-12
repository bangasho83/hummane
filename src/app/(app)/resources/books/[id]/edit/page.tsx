import { ResourceEditPage } from '@/features/resources'

export default async function EditBookPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return <ResourceEditPage id={id} mode="book" />
}