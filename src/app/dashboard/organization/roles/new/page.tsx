'use client'

import { OrgPageFrame } from '@/components/dashboard/organization/OrgPageFrame'
import { RoleForm } from '@/components/dashboard/organization/RoleForm'

export default function NewRolePage() {
    return (
        <OrgPageFrame>
            <div className="animate-in fade-in duration-500 slide-in-from-bottom-4 space-y-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Add New Role</h1>
                    <p className="text-slate-500 font-medium">Create a role and describe its responsibilities.</p>
                </div>
                <RoleForm mode="create" />
            </div>
        </OrgPageFrame>
    )
}
