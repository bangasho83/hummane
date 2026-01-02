'use client'

import { RolesTab } from '@/components/dashboard/organization/RolesTab'
import { OrgPageFrame } from '@/components/dashboard/organization/OrgPageFrame'

export default function OrganizationRolesPage() {
    return (
        <OrgPageFrame>
            <RolesTab />
        </OrgPageFrame>
    )
}
