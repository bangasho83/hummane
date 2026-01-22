'use client'

import type { ReactNode } from 'react'
import { MemberDashboardShell } from '@/components/layout/MemberDashboardShell'

export default function MemberLayout({
  children,
}: {
  children: ReactNode
}) {
  return <MemberDashboardShell>{children}</MemberDashboardShell>
}

