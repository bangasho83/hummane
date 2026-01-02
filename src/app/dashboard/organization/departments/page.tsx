'use client'

import { DepartmentsTab } from '@/components/dashboard/organization/DepartmentsTab'
import { OrgPageFrame } from '@/components/dashboard/organization/OrgPageFrame'

export default function OrganizationDepartmentsPage() {
    return (
        <OrgPageFrame>
            <DepartmentsTab />
        </OrgPageFrame>
    )
}
