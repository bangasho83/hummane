'use client'

import { LeavesTab } from '@/components/dashboard/organization/LeavesTab'
import { OrgPageFrame } from '@/components/dashboard/organization/OrgPageFrame'

export default function OrganizationLeavesPage() {
    return (
        <OrgPageFrame>
            <LeavesTab />
        </OrgPageFrame>
    )
}
