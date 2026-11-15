import type { Metadata } from 'next'
import { GUIDES } from '@/features/help'
import { GuideHub } from '@/features/help/GuideHub'

export const metadata: Metadata = {
  title: `${GUIDES.admin.title} | Hummane Help`,
  description: GUIDES.admin.tagline,
}

export default function AdminHelpPage() {
  return <GuideHub guide="admin" />
}
