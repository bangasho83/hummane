'use client'

import { DashboardShell } from '@/components/layout/DashboardShell'
import { RolesTab } from '@/components/dashboard/organization/RolesTab'

export default function RolesPage() {
    return (
        <DashboardShell>
            <RolesTab />
        </DashboardShell>
    )
}

