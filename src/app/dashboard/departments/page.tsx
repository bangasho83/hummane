'use client'

import { DashboardShell } from '@/components/layout/DashboardShell'
import { DepartmentsTab } from '@/components/dashboard/organization/DepartmentsTab'

export default function DepartmentsPage() {
    return (
        <DashboardShell>
            <DepartmentsTab />
        </DashboardShell>
    )
}
