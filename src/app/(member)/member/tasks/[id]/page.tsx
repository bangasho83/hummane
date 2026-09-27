'use client'

import { useParams, useRouter } from 'next/navigation'
import { TaskDetailPage } from '@/features/tasks/components/TaskDetailPage'

export default function MemberTaskDetailPage() {
    const router = useRouter()
    const params = useParams<{ id: string }>()
    return <TaskDetailPage taskId={params.id} onBack={() => router.push('/member/tasks')} />
}
